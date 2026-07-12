/**
 * Композабл для синтеза речи (Text-To-Speech).
 *
 * Стратегия выбора бэкенда (в порядке приоритета):
 * 1. Web Speech API — встроен в WebView2/браузер, zero-install, работает офлайн
 * 2. Go IPC (Wails -> Python TTS) — только если Web Speech не нашёл голоса для языка
 * 3. Google Translate TTS — онлайн-резерв для браузерной версии
 *
 * @module composables/useTts
 */

import { ref, type Ref } from 'vue'
import { getCachedAudio, setCachedAudio } from './useTtsCache'

/** Состояние TTS для одного языка */
export type TtsVoiceState = 'checking' | 'ready' | 'not_found' | 'loading' | 'error'

/** Статус TTS для обоих языков */
export interface TtsStatus {
  ja: TtsVoiceState
  ru: TtsVoiceState
}

/**
 * Флаг: запущены ли мы в среде Wails.
 * Определяется по наличию глобального объекта `window.go.main.App`.
 */
const isWails = typeof window !== 'undefined' && window.go?.main?.App != null

/**
 * Загружает список доступных голосов Web Speech API.
 *
 * На Chrome голоса приходят асинхронно, поэтому оборачиваем в Promise
 * с обработкой события `onvoiceschanged`.
 */
const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(voices)
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        resolve(window.speechSynthesis.getVoices())
      }
      // Таймаут на случай, если voiceschanged не сработает
      setTimeout(() => resolve(window.speechSynthesis.getVoices() || []), 3000)
    }
  })
}

/**
 * Находит подходящий голос для указанного языка.
 *
 * Сначала ищет точное совпадение (например, `ja-JP`),
 * затем по префиксу языка (`ja`), затем частичное совпадение.
 *
 * @param voices - список голосов Web Speech API
 * @param lang - код языка (например, `ja-JP`, `ru-RU`)
 */
const findVoice = (voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined => {
  let voice = voices.find(v => v.lang === lang)
  if (voice) return voice
  const prefix = lang.split('-')[0]
  voice = voices.find(v => v.lang.startsWith(prefix))
  if (voice) return voice
  return voices.find(v => v.lang && v.lang.toLowerCase().includes(prefix))
}

/**
 * Произносит текст через Web Speech API системным голосом по умолчанию.
 */
const speakWithDefaultVoice = (text: string, lang: string): Promise<void> => {
  return new Promise((resolve) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.9
      utterance.onend = () => resolve()
      utterance.onerror = () => resolve()
      window.speechSynthesis.speak(utterance)
    } catch {
      resolve()
    }
  })
}

/**
 * Проигрывает текст через Google Translate TTS (запасной вариант).
 *
 * Использует две стратегии:
 * 1. fetch + blob (обход CORS через Referer)
 * 2. прямая установка src на `<audio>`
 *
 * @param text - текст для озвучки
 * @param lang - код языка
 * @returns `'ok'` если успешно, пустую строку если нет
 */
const speakWithGoogleTTS = async (text: string, lang: string): Promise<string> => {
  const tl = lang.split('-')[0]
  const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`

  // Стратегия 1: fetch + blob (позволяет установить Referer и обойти CORS)
  try {
    const response = await fetch(url, {
      headers: { Referer: 'https://translate.google.com' },
    })
    if (response.ok) {
      const blob = await response.blob()
      if (blob.size > 500) {
        const blobUrl = URL.createObjectURL(blob)
        return new Promise<string>((resolve) => {
          const audio = new Audio()
          audio.src = blobUrl
          audio.volume = 1
          audio.onended = () => { URL.revokeObjectURL(blobUrl); resolve('ok') }
          audio.onerror = () => { URL.revokeObjectURL(blobUrl); resolve('') }
          audio.play().catch(() => { URL.revokeObjectURL(blobUrl); resolve('') })
        })
      }
    }
  } catch {
    // silent — пробуем следующую стратегию
  }

  // Стратегия 2: прямая установка src на <audio>
  try {
    const audio = new Audio(url)
    audio.volume = 1
    return new Promise<string>((resolve) => {
      audio.onended = () => resolve('ok')
      audio.onerror = () => resolve('')
      audio.play().catch(() => resolve(''))
    })
  } catch {
    return ''
  }
}

/**
 * Пытается воспроизвести текст через Web Speech API.
 *
 * @returns true если успешно, false если голос не найден
 */
const tryWebSpeech = async (text: string, lang: string): Promise<boolean> => {
  try {
    if (!window.speechSynthesis) return false

    window.speechSynthesis.cancel()

    const voices = await loadVoices()
    const voice = findVoice(voices, lang)

    if (voice) {
      return new Promise<boolean>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = 0.9
        utterance.voice = voice
        utterance.onend = () => resolve(true)
        utterance.onerror = () => resolve(false)
        window.speechSynthesis.speak(utterance)
      })
    }

    // Голос не найден — попробуем без указания голоса
    await speakWithDefaultVoice(text, lang)
    return false
  } catch (e) {
    console.warn(`tryWebSpeech: ошибка для ${lang}:`, e)
    return false
  }
}

/**
 * Проверяет доступность голосов через Web Speech API.
 *
 * @returns объект с флагами доступности японского и русского голосов
 */
export const checkVoicesAvailability = async (): Promise<{ Ja: boolean; Ru: boolean }> => {
  try {
    const voices = await loadVoices()
    const jaVoice = voices.some(v => v.lang.startsWith('ja'))
    const ruVoice = voices.some(v => v.lang.startsWith('ru'))

    // Если хотя бы один голос найден через Web Speech — возвращаем результат
    if (jaVoice || ruVoice) return { Ja: jaVoice, Ru: ruVoice }
  } catch {
    // Если Web Speech недоступен — пробуем Go IPC
  }

  // Fallback: Go IPC (Wails) или заглушка
  if (isWails) {
    try {
      return await window.go!.main.App.CheckVoicesAvailability()
    } catch {
      // Go IPC тоже недоступен
    }
  }

  return { Ja: false, Ru: false }
}

/**
 * Проверяет доступность TTS в системе.
 *
 * Сначала проверяет Web Speech API (встроенные голоса ОС).
 * Если голоса не найдены — пробует Go IPC (Python TTS).
 *
 * @returns объект с флагом `available`, сообщением и статусом
 */
export const checkTTSAvailability = async (): Promise<{ available: boolean; message: string; status: number }> => {
  // 1. Проверяем Web Speech API
  try {
    const voices = await loadVoices()
    const jaVoice = voices.some(v => v.lang.startsWith('ja'))
    const ruVoice = voices.some(v => v.lang.startsWith('ru'))

    if (jaVoice || ruVoice) {
      const langs: string[] = []
      if (jaVoice) langs.push('японский')
      if (ruVoice) langs.push('русский')
      return {
        available: true,
        message: `Web Speech: ${langs.join(', ')}`,
        status: 2, // StateReady
      }
    }
  } catch {
    // Web Speech недоступен — пробуем Go IPC
  }

  // 2. Fallback: Go IPC (Python TTS в Wails)
  if (isWails) {
    try {
      return await window.go!.main.App.CheckTTSAvailability()
    } catch {
      // Go IPC недоступен
    }
  }

  return { available: false, message: 'TTS-голоса не найдены', status: 3 }
}

/**
 * Произносит указанный текст через TTS.
 *
 * Стратегия (в порядке приоритета):
 * 1. Кэш (IndexedDB) — если уже синтезировали через Python TTS
 * 2. Web Speech API (WebView2 / браузер) — ноль зависимостей
 * 3. Go IPC (Wails -> Python TTS) — если Web Speech не справился
 * 4. Google Translate TTS — онлайн-резерв
 *
 * @param text - текст для озвучки
 * @param lang - код языка (например, `ja-JP`, `ru-RU`)
 * @returns объект с base64 аудио и MIME-типом (пустые строки если уже воспроизведено)
 */
export const speakText = async (text: string, lang: string): Promise<{ audio: string; mime: string }> => {
  // 1. Проверяем кэш (синтезированное ранее аудио от Python TTS или Google TTS)
  try {
    const cached = await getCachedAudio(text, lang)
    if (cached) {
      return { audio: cached.split(',')[1] || '', mime: cached.startsWith('data:audio/wav') ? 'audio/wav' : 'audio/mpeg' }
    }
  } catch {
    // кэш недоступен — игнорируем
  }

  // 2. Web Speech API — работает в WebView2 (Wails) и в браузере
  const webSpeechOk = await tryWebSpeech(text, lang)
  if (webSpeechOk) return { audio: '', mime: '' }

  // 3. Go IPC (Wails -> Python TTS) — если Web Speech не нашёл голос
  if (isWails) {
    try {
      const result = await window.go!.main.App.SpeakText(text, lang)
      // Сохраняем в кэш для будущих повторений
      if (result.audio && result.mime) {
        setCachedAudio(text, lang, `data:${result.mime};base64,${result.audio}`, result.mime).catch(() => {})
      }
      return result
    } catch (e) {
      console.warn(`speakText: Go IPC ошибка для ${lang}:`, e)
    }
  }

  // 4. Google Translate TTS — онлайн-резерв (браузер, dev-режим)
  const googleOk = await speakWithGoogleTTS(text, lang)
  if (googleOk) return { audio: '', mime: '' }

  // 5. Последний шанс: Web Speech API без голоса
  await speakWithDefaultVoice(text, lang)
  return { audio: '', mime: '' }
}

/**
 * Проигрывает base64 аудио через HTML5 Audio API.
 *
 * @param audio - base64-строка аудиоданных (может быть пустой, если уже воспроизведено через Web Speech API)
 * @param mime - MIME-тип аудио ("audio/mpeg" или "audio/wav")
 */
export const playAudio = (audio: string, mime: string): Promise<void> => {
  if (!audio) return Promise.resolve()
  return new Promise((resolve) => {
    const audioEl = new Audio(`data:${mime};base64,${audio}`)
    audioEl.onended = () => resolve()
    audioEl.onerror = () => resolve()
    audioEl.play().catch(() => resolve())
  })
}

/**
 * Произносит японское слово через TTS.
 *
 * @param text - японский текст
 */
export const speakJapanese = async (text: string): Promise<void> => {
  try {
    const result = await speakText(text, 'ja-JP')
    await playAudio(result.audio, result.mime)
  } catch (e) {
    console.warn('Ошибка озвучки (ja-JP):', e)
  }
}

/**
 * Произносит русский перевод через TTS.
 *
 * @param text - русский текст
 */
export const speakRussian = async (text: string): Promise<void> => {
  try {
    const result = await speakText(text, 'ru-RU')
    await playAudio(result.audio, result.mime)
  } catch (e) {
    console.warn('Ошибка озвучки (ru-RU):', e)
  }
}

/**
 * Произносит японское слово, затем с паузой 500мс — русский перевод.
 *
 * @param kanjiText - японский текст
 * @param translation - русский перевод
 */
export const speakBoth = async (kanjiText: string, translation: string): Promise<void> => {
  try {
    const jaResult = await speakText(kanjiText, 'ja-JP')
    await playAudio(jaResult.audio, jaResult.mime)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const ruResult = await speakText(translation, 'ru-RU')
    await playAudio(ruResult.audio, ruResult.mime)
  } catch (e) {
    console.warn('Ошибка озвучки:', e)
  }
}

/**
 * Возвращает реактивный статус TTS для каждого языка.
 *
 * Обновляется при загрузке голосов Web Speech API (событие onvoiceschanged).
 * Используется компонентом TtsStatus.vue для отображения состояния.
 */
export const getTtsStatus = (): Ref<TtsStatus> => {
  const status = ref<TtsStatus>({ ja: 'checking', ru: 'checking' })

  const updateStatus = async () => {
    try {
      const voices = await loadVoices()
      const jaVoice = voices.some(v => v.lang.startsWith('ja'))
      const ruVoice = voices.some(v => v.lang.startsWith('ru'))

      status.value = {
        ja: jaVoice ? 'ready' : 'not_found',
        ru: ruVoice ? 'ready' : 'not_found',
      }
    } catch {
      status.value = { ja: 'not_found', ru: 'not_found' }
    }
  }

  // Первичная проверка
  updateStatus()

  // Слушаем изменения голосов (асинхронная загрузка в Chrome)
  if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
      updateStatus()
    }
  }

  return status
}

/**
 * Произносит указанный текст с использованием ТОЛЬКО Web Speech API.
 * Без fallback на Go IPC или Google TTS.
 * Используется для предпросмотра голоса в настройках.
 *
 * @param text - текст для озвучки
 * @param lang - код языка
 */
export const speakWithWebSpeechOnly = async (text: string, lang: string): Promise<boolean> => {
  return tryWebSpeech(text, lang)
}

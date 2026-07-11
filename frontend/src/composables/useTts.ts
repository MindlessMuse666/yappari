/**
 * Композабл для синтеза речи (Text-To-Speech).
 *
 * Стратегия выбора бэкенда (в порядке приоритета):
 * 1. Web Speech API — встроен в браузер, zero-install, работает офлайн
 * 2. Google Translate TTS — онлайн-резерв
 *
 * Go IPC (Wails → Python TTS) удалён — в веб-версии не используется.
 *
 * @module composables/useTts
 */

import { ref, type Ref } from 'vue'
import { getCachedAudio } from './useTtsCache'

/** Состояние TTS для одного языка */
export type TtsVoiceState = 'checking' | 'ready' | 'not_found' | 'loading' | 'error'

/** Статус TTS для обоих языков */
export interface TtsStatus {
  ja: TtsVoiceState
  ru: TtsVoiceState
}

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
 */
const speakWithGoogleTTS = async (text: string, lang: string): Promise<string> => {
  const tl = lang.split('-')[0]
  const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`

  // Стратегия 1: fetch + blob
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
 */
export const checkVoicesAvailability = async (): Promise<{ Ja: boolean; Ru: boolean }> => {
  try {
    const voices = await loadVoices()
    const jaVoice = voices.some(v => v.lang.startsWith('ja'))
    const ruVoice = voices.some(v => v.lang.startsWith('ru'))
    return { Ja: jaVoice, Ru: ruVoice }
  } catch {
    return { Ja: false, Ru: false }
  }
}

/**
 * Проверяет доступность TTS в системе.
 */
export const checkTTSAvailability = async (): Promise<{ available: boolean; message: string; status: number }> => {
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
    // Web Speech недоступен
  }

  return { available: false, message: 'TTS-голоса не найдены', status: 3 }
}

/**
 * Произносит указанный текст через TTS.
 *
 * Стратегия (в порядке приоритета):
 * 1. Кэш (IndexedDB) — если уже синтезировали ранее
 * 2. Web Speech API — ноль зависимостей
 * 3. Google Translate TTS — онлайн-резерв
 */
export const speakText = async (text: string, lang: string): Promise<{ audio: string; mime: string }> => {
  // 1. Проверяем кэш
  try {
    const cached = await getCachedAudio(text, lang)
    if (cached) {
      return { audio: cached.split(',')[1] || '', mime: cached.startsWith('data:audio/wav') ? 'audio/wav' : 'audio/mpeg' }
    }
  } catch {
    // кэш недоступен — игнорируем
  }

  // 2. Web Speech API
  const webSpeechOk = await tryWebSpeech(text, lang)
  if (webSpeechOk) return { audio: '', mime: '' }

  // 3. Google Translate TTS — онлайн-резерв
  const googleOk = await speakWithGoogleTTS(text, lang)
  if (googleOk) return { audio: '', mime: '' }

  // 4. Последний шанс: Web Speech API без голоса
  await speakWithDefaultVoice(text, lang)
  return { audio: '', mime: '' }
}

/**
 * Проигрывает base64 аудио через HTML5 Audio API.
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
 * Без fallback на Google TTS.
 */
export const speakWithWebSpeechOnly = async (text: string, lang: string): Promise<boolean> => {
  return tryWebSpeech(text, lang)
}

/**
 * Композабл для синтеза речи (Text-To-Speech).
 *
 * Предоставляет единый интерфейс озвучки текста на японском и русском языках.
 * В режиме Wails: вызывает Go-бэкенд (edge-tts).
 * В режиме разработки: использует Web Speech API с запасными вариантами.
 *
 * @module composables/useTts
 */

import { useAlert } from './useAlert'

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
 * Произносит текст системным голосом по умолчанию (без указания конкретного).
 *
 * @param text - текст для озвучки
 * @param lang - код языка
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
 * Проверяет доступность голосов через Web Speech API.
 *
 * @returns объект с флагами доступности японского и русского голосов
 */
export const checkVoicesAvailability = async (): Promise<{ Ja: boolean; Ru: boolean }> => {
  if (isWails) {
    return window.go!.main.App.CheckVoicesAvailability()
  }
  const voices = await loadVoices()
  const jaVoice = voices.some(v => v.lang.startsWith('ja'))
  const ruVoice = voices.some(v => v.lang.startsWith('ru'))
  return { Ja: jaVoice, Ru: ruVoice }
}

/**
 * Произносит указанный текст через edge-tts (Wails) или Web Speech API.
 *
 * Последовательность работы в режиме разработки:
 * 1. Пробует Web Speech API с подходящим голосом
 * 2. Если голос не найден — Google Translate TTS
 * 3. Если Google не сработал — Web Speech API без голоса
 *
 * @param text - текст для озвучки
 * @param lang - код языка (например, `ja-JP`, `ru-RU`)
 * @returns base64 MP3-строку (в режиме Wails) или пустую строку
 */
export const speakText = async (text: string, lang: string): Promise<string> => {
  if (isWails) {
    return window.go!.main.App.SpeakText(text, lang)
  }

  // Режим разработки: Web Speech API + Google TTS fallback
  try {
    if (!window.speechSynthesis) {
      console.warn('Web Speech API недоступен')
      return ''
    }

    window.speechSynthesis.cancel()

    const voices = await loadVoices()
    const voice = findVoice(voices, lang)

    if (voice) {
      return new Promise<string>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = 0.9
        utterance.voice = voice
        utterance.onend = () => resolve('')
        utterance.onerror = () => resolve('')
        window.speechSynthesis.speak(utterance)
      })
    }

    console.warn(`Голос для языка ${lang} не найден. Пробуем запасные способы...`)

    // Запасной: Google TTS
    const ok = await speakWithGoogleTTS(text, lang)
    if (ok) return ''

    // Запасной: Web Speech API без голоса
    await speakWithDefaultVoice(text, lang)
    return ''
  } catch (e) {
    console.error(`speakText: критическая ошибка для ${lang}:`, e)
    return ''
  }
}

/**
 * Проверяет доступность edge-tts в системе.
 *
 * @returns объект с флагом `available` и сообщением
 */
export const checkEdgeTTS = async (): Promise<{ available: boolean; message: string }> => {
  if (isWails) {
    return window.go!.main.App.CheckEdgeTTSAvailability()
  }
  return { available: false, message: 'Режим разработки (без Wails)' }
}

/**
 * Проигрывает base64 аудио через HTML5 Audio API.
 *
 * @param base64 - base64-строка MP3 (может быть пустой, если уже воспроизведено через Web Speech API)
 */
export const playAudio = (base64: string): Promise<void> => {
  if (!base64) return Promise.resolve()
  return new Promise((resolve) => {
    const audio = new Audio('data:audio/mp3;base64,' + base64)
    audio.onended = () => resolve()
    audio.onerror = () => resolve()
    audio.play().catch(() => resolve())
  })
}

/**
 * Произносит японское слово через TTS.
 *
 * @param text - японский текст
 */
export const speakJapanese = async (text: string): Promise<void> => {
  try {
    const audio = await speakText(text, 'ja-JP')
    await playAudio(audio)
  } catch (e) {
    console.error('Ошибка озвучки (ja):', e)
    if (isWails) {
      const { alert } = useAlert()
      await alert({
        title: 'Ошибка озвучки',
        message: 'Не удалось воспроизвести японскую озвучку. Убедитесь, что установлен edge-tts (pip install edge-tts).',
      })
    }
  }
}

/**
 * Произносит русский перевод через TTS.
 *
 * @param text - русский текст
 */
export const speakRussian = async (text: string): Promise<void> => {
  try {
    const audio = await speakText(text, 'ru-RU')
    await playAudio(audio)
  } catch (e) {
    console.error('Ошибка озвучки (ru):', e)
    if (isWails) {
      const { alert } = useAlert()
      await alert({
        title: 'Ошибка озвучки',
        message: 'Не удалось воспроизвести русскую озвучку. Убедитесь, что установлен edge-tts (pip install edge-tts).',
      })
    }
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
    const audioJa = await speakText(kanjiText, 'ja-JP')
    await playAudio(audioJa)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const audioRu = await speakText(translation, 'ru-RU')
    await playAudio(audioRu)
  } catch (e) {
    console.error('Ошибка озвучки:', e)
    if (isWails) {
      const { alert } = useAlert()
      await alert({
        title: 'Ошибка озвучки',
        message: 'Не удалось воспроизвести озвучку. Убедитесь, что установлен edge-tts (pip install edge-tts).',
      })
    }
  }
}

/**
 * Композабл для синтеза речи (Text-To-Speech).
 *
 * Предоставляет единый интерфейс озвучки текста на японском и русском языках.
 * В режиме Wails: вызывает Go-бэкенд (Silero / Kokoro TTS).
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
 * Флаги: показывались ли уже TTS-ошибки (показываем только один раз за сессию).
 */
let ttsUnavailableShown = false
let ttsErrorShown = false

/** Проверяет, показывалось ли уже уведомление о недоступности TTS */
export const isTtsUnavailableShown = () => ttsUnavailableShown

/** Отмечает, что уведомление о недоступности TTS было показано */
export const markTtsUnavailableShown = () => { ttsUnavailableShown = true }

/** Проверяет, показывалась ли уже ошибка озвучки */
export const isTtsErrorShown = () => ttsErrorShown

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
 * Произносит указанный текст через TTS-движок (Wails) или Web Speech API.
 *
 * В режиме Wails возвращает объект { audio, mime } от бэкенда:
 * - Silero TTS (русский): mime = "audio/wav"
 * - Kokoro TTS (японский): mime = "audio/wav"
 *
 * В режиме разработки воспроизводит через Web Speech API / Google TTS
 * и возвращает пустой объект (аудио уже сыграно).
 *
 * @param text - текст для озвучки
 * @param lang - код языка (например, `ja-JP`, `ru-RU`)
 * @returns объект с base64 аудио и MIME-типом
 */
export const speakText = async (text: string, lang: string): Promise<{ audio: string; mime: string }> => {
  if (isWails) {
    return window.go!.main.App.SpeakText(text, lang)
  }

  // Режим разработки: Web Speech API + Google TTS fallback
  try {
    if (!window.speechSynthesis) {
      console.warn('Web Speech API недоступен')
      return { audio: '', mime: '' }
    }

    window.speechSynthesis.cancel()

    const voices = await loadVoices()
    const voice = findVoice(voices, lang)

    if (voice) {
      return new Promise<{ audio: string; mime: string }>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = 0.9
        utterance.voice = voice
        utterance.onend = () => resolve({ audio: '', mime: '' })
        utterance.onerror = () => resolve({ audio: '', mime: '' })
        window.speechSynthesis.speak(utterance)
      })
    }

    console.warn(`Голос для языка ${lang} не найден. Пробуем запасные способы...`)

    // Запасной: Google TTS
    const ok = await speakWithGoogleTTS(text, lang)
    if (ok) return { audio: '', mime: '' }

    // Запасной: Web Speech API без голоса
    await speakWithDefaultVoice(text, lang)
    return { audio: '', mime: '' }
  } catch (e) {
    console.error(`speakText: критическая ошибка для ${lang}:`, e)
    return { audio: '', mime: '' }
  }
}

/**
 * Проверяет доступность TTS в системе.
 *
 * @returns объект с флагом `available`, сообщением и статусом (0-3: uninit, loading, ready, error)
 */
export const checkTTSAvailability = async (): Promise<{ available: boolean; message: string; status: number }> => {
  if (isWails) {
    return window.go!.main.App.CheckTTSAvailability()
  }
  return { available: false, message: 'Режим разработки (без Wails)', status: 3 }
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
    console.error('Ошибка озвучки (ja):', e)
    if (isWails && !ttsErrorShown) {
      ttsErrorShown = true
      const { alert } = useAlert()
      await alert({
        title: 'Ошибка озвучки',
        message: 'Не удалось воспроизвести японскую озвучку. TTS-модели не загружены. Проверьте подключение к интернету при первом запуске.',
        isError: true,
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
    const result = await speakText(text, 'ru-RU')
    await playAudio(result.audio, result.mime)
  } catch (e) {
    console.error('Ошибка озвучки (ru):', e)
    if (isWails && !ttsErrorShown) {
      ttsErrorShown = true
      const { alert } = useAlert()
      await alert({
        title: 'Ошибка озвучки',
        message: 'Не удалось воспроизвести русскую озвучку. TTS-модели не загружены. Проверьте подключение к интернету при первом запуске.',
        isError: true,
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
    const jaResult = await speakText(kanjiText, 'ja-JP')
    await playAudio(jaResult.audio, jaResult.mime)
    await new Promise((resolve) => setTimeout(resolve, 500))
    const ruResult = await speakText(translation, 'ru-RU')
    await playAudio(ruResult.audio, ruResult.mime)
  } catch (e) {
    console.error('Ошибка озвучки:', e)
    if (isWails && !ttsErrorShown) {
      ttsErrorShown = true
      const { alert } = useAlert()
      await alert({
        title: 'Ошибка озвучки',
        message: 'Не удалось воспроизвести озвучку. TTS-модели не загружены. Проверьте подключение к интернету при первом запуске.',
        isError: true,
      })
    }
  }
}

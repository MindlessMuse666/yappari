/**
 * Композабл для звуковых эффектов (UI-звуки).
 *
 * Генерирует короткие синтезированные звуки через Web Audio API
 * без внешних аудиофайлов. Все звуки тихие и ненавязчивые.
 *
 * @module composables/useSound
 */

/**
 * Единственный AudioContext (ленивая инициализация — требуется
 * пользовательский жест для создания).
 */
let audioCtx: AudioContext | null = null

/** Время последнего воспроизведения звука клика */
let lastClickTime = 0

/** Минимальный интервал между кликами (мс) */
const CLICK_COOLDOWN_MS = 50

/** Возвращает AudioContext, создавая при первом вызове. */
const getContext = (): AudioContext => {
  if (!audioCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    audioCtx = new Ctor!()
  }
  return audioCtx
}

/**
 * Короткий тихий звук клика.
 *
 * Sine-волна 960Hz, 40ms, gain 0.06 — едва слышный щелчок.
 */
export const playClickSound = (): void => {
  try {
    const now = Date.now()
    if (now - lastClickTime < CLICK_COOLDOWN_MS) return
    lastClickTime = now

    const ctx = getContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.frequency.value = 960
    osc.type = 'sine'

    const t = ctx.currentTime
    gain.gain.setValueAtTime(0.06, t)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04)

    osc.start(t)
    osc.stop(t + 0.04)
  } catch {
    // Звук не критичен — игнорируем ошибки
  }
}

/**
 * Утилита для анимации конфетти при завершении тренировки.
 *
 * Использует библиотеку canvas-confetti для создания праздничного эффекта.
 *
 * @module utils/confetti
 */

import confetti from 'canvas-confetti'

/**
 * Запускает анимацию конфетти на 3 секунды.
 *
 * Конфетти выстреливает с разных позиций по ширине экрана
 * с постепенно уменьшающимся количеством частиц.
 */
export function triggerConfetti(): void {
  const duration = 3 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      clearInterval(interval)
      return
    }

    const particleCount = 50 * (timeLeft / duration)
    confetti({
      ...defaults,
      particleCount,
      origin: { x: Math.random(), y: Math.random() - 0.2 },
    })
  }, 250)
}

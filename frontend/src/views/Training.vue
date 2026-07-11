<template>
  <div class="training">
    <div class="header">
      <button @click="goBack" class="icon-btn" title="Назад">
        <span class="icon">←</span>
      </button>
      <h1>{{ modeLabel }}</h1>
      <div class="header-right">
        <span class="progress-text">{{ currentIndex }} / {{ cards.length }}</span>
      </div>
    </div>

    <div v-if="isWails && !ttsAvailable" class="tts-warning">
      Озвучка отключена — не настроено TTS-окружение
    </div>
    <ProgressBar v-if="!isLoading" :value="progress" :show-value="false" class="progress-bar" />

    <!-- Экран загрузки/перехода -->
    <div v-if="isLoading" class="loading-screen">
      <div class="loading-card">
        <div class="loading-card-inner">
          <div class="loading-char">や</div>
          <div class="loading-dots">
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
            <span class="loading-dot"></span>
          </div>
          <p class="loading-label">Загрузка карточек…</p>
        </div>
      </div>
    </div>

    <!-- Основной контент (после загрузки) -->
    <template v-else>
      <div v-if="currentCard && !isFinished" class="card-container">
        <div class="card" :class="{ flipped: showAnswer }" :key="currentCard.ID">
          <div class="card-inner">
            <div class="card-front">
              <div class="text" :class="{ 'tts-disabled': isWails && !ttsAvailable }" @click="speakJapaneseOnly">{{ currentCard.KanjiText }}</div>
            </div>
            <div class="card-back">
              <div class="word-section">
                <div class="text clickable" :class="{ 'tts-disabled': isWails && !ttsAvailable }" @click="speakJapaneseOnly">
                  <FuriganaText :KanjiText="currentCard.KanjiText" :FuriganaText="currentCard.FuriganaText" />
                </div>
              </div>
              <div class="separator"></div>
              <div class="translation-section">
                <div class="text clickable" :class="{ 'tts-disabled': isWails && !ttsAvailable }" @click="speakRussianOnly">{{ currentCard.Translation }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isFinished" class="actions">
        <div class="action-buttons">
          <template v-if="mode === 'interval'">
            <button v-if="!showAnswer" @click="showAnswerFn" class="primary-btn large">
              Показать ответ <kbd class="hotkey-hint">Space</kbd>
            </button>
            <template v-else>
              <button @click="submitReview(0)" class="grade-btn grade-0">
                <span class="grade-emoji">😵‍💫</span>
                <span class="grade-text">Повторить <kbd class="hotkey-hint">1</kbd></span>
              </button>
              <button @click="submitReview(3)" class="grade-btn grade-3">
                <span class="grade-emoji">🥺</span>
                <span class="grade-text">Трудно <kbd class="hotkey-hint">2</kbd></span>
              </button>
              <button @click="submitReview(4)" class="grade-btn grade-4">
                <span class="grade-emoji">😊</span>
                <span class="grade-text">Хорошо <kbd class="hotkey-hint">3</kbd></span>
              </button>
              <button @click="submitReview(5)" class="grade-btn grade-5">
                <span class="grade-emoji">😜</span>
                <span class="grade-text">Легко <kbd class="hotkey-hint">4</kbd></span>
              </button>
            </template>
          </template>
          <template v-else>
            <button @click="toggleAutoPlay" class="auto-play-btn secondary-btn" :class="{ active: isAutoPlaying }">
              {{ isAutoPlaying ? 'Остановить' : 'Авто' }} <kbd class="hotkey-hint">Ctrl W</kbd>
            </button>
            <template v-if="!isAutoPlaying">
              <button v-if="!showAnswer" @click="showAnswerFn" class="primary-btn large">
                Показать ответ <kbd class="hotkey-hint">Space</kbd>
              </button>
              <button v-else @click="nextCard" class="primary-btn large">
                Далее <kbd class="hotkey-hint">Space</kbd>
              </button>
            </template>
          </template>
        </div>
      </div>

      <div v-if="isFinished" class="finished">
        <div class="finished-icon">
          <span class="main-emoji" style="user-select: none;">🎉</span>
        </div>
        <h2>Повторение завершено!</h2>
        <p>Повторено карточек: {{ cards.length }}</p>
        <button @click="goBack" class="primary-btn go-home-btn">
          Вернуться на главную <kbd class="hotkey-hint">Esc</kbd>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент тренировки (повторение карточек).
 *
 * Поддерживает два режима:
 * - `interval` — интервальное повторение с оценкой SM-2 (grade 0/3/4/5)
 * - `free` — свободный режим с опциональным автовоспроизведением
 *
 * В режиме `interval` после показа ответа пользователь выбирает одну из
 * четырёх оценок, и карточка уходит из стопки.
 * В режиме `free` — только кнопка "Далее".
 *
 * @see {@link module:composables/useWails} для IPC-операций
 * @see {@link module:composables/useTts} для озвучки
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressBar from 'primevue/progressbar'
import FuriganaText from '../components/FuriganaText.vue'
import type { TrainingCard as TrainingCardType } from '../types'
import { useWails } from '../composables/useWails'
import { useAlert } from '../composables/useAlert'
import { speakBoth, speakJapanese, speakRussian, checkTTSAvailability, isTtsUnavailableShown, markTtsUnavailableShown } from '../composables/useTts'
import { playClickSound } from '../composables/useSound'
import { triggerConfetti } from '../utils/confetti'

const router = useRouter()
const route = useRoute()
const { alert } = useAlert()
const { isWails, getTrainingCards, submitReview: submitReviewWails } = useWails()

/** ID выбранных колод из query-параметров */
const rawDeckIds = route.query.deckIds as string | undefined
const deckIds = rawDeckIds
  ? rawDeckIds.split(',').map(Number).filter(id => !isNaN(id))
  : []

/** Режим тренировки: `interval` или `free` */
const mode = computed(() => {
  const m = route.query.mode as string
  // Поддерживаем старые названия режимов для обратной совместимости
  if (m === 'normal' || m === 'lazy') return 'free'
  return m || 'interval'
})

/** Человекочитаемое название режима */
const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    interval: 'Повторение',
    free: 'Свободный режим',
  }
  return labels[mode.value] || ''
})

const cards = ref<TrainingCardType[]>([])
const currentIndex = ref(0)
const currentCard = computed(() => cards.value[currentIndex.value])
const showAnswer = ref(false)
const isFinished = computed(() => currentIndex.value >= cards.value.length)
const progress = computed(() => {
  if (cards.value.length === 0) return 0
  return (currentIndex.value / cards.value.length) * 100
})

/** Флаг: доступен ли TTS — влияет на кнопки озвучки */
const ttsAvailable = ref(true)
/** Таймер опроса готовности TTS */
let ttsPollTimer: ReturnType<typeof setInterval> | null = null

/** Флаг: включён ли авто-режим (только свободный режим) */
const isAutoPlaying = ref(false)
let lazyTimer: ReturnType<typeof setTimeout> | null = null
let answerTimer: ReturnType<typeof setTimeout> | null = null

/** Флаг загрузки карточек — пока true, показываем экран перехода */
const isLoading = ref(true)

/** Минимальный интервал между нажатиями Space (мс) */
const SPACE_COOLDOWN_MS = 400
let lastSpaceTime = 0

/** Звук победы при завершении тренировки */
const successSound = ref<HTMLAudioElement | null>(null)

/** Загружает карточки с бэкенда */
const loadCards = async () => {
  try {
    // Для free режима используем `normal` на бэке
    const backendMode = mode.value === 'free' ? 'normal' : mode.value
    cards.value = await getTrainingCards(backendMode, deckIds)
  } catch (e) {
    console.error('Ошибка загрузки карточек для тренировки:', e)
    await alert({
      title: 'Ошибка',
      message: 'Не удалось загрузить карточки для тренировки: ' + e,
      isError: true,
    })
  }

  // Если карточек нет — уходим на главную (isLoading остаётся true, чтобы не было flash)
  if (cards.value.length === 0) {
    router.push({ name: 'Home' })
    return
  }

  isLoading.value = false
}

/** Переход на главную с очисткой таймеров и звуков */
const goBack = () => {
  playClickSound()
  stopAutoPlay()
  if (successSound.value) {
    successSound.value.pause()
    successSound.value.currentTime = 0
    successSound.value = null
  }
  router.push({ name: 'Home' })
}

/**
 * Обработчик клавиатурных сокращений.
 *
 * - Escape → на главную
 * - Space → показать ответ / далее
 * - 1-4 → оценки SM-2 (интервальный режим)
 * - Ctrl/Cmd+A → авто (свободный режим)
 */
const onKeydown = (e: KeyboardEvent) => {
  // Escape — всегда на главную
  if (e.key === 'Escape') {
    e.preventDefault()
    goBack()
    return
  }

  // Не обрабатываем хоткеи если тренировка завершена
  if (isFinished.value) return

  // Space — показать ответ или далее (в свободном режиме)
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault()
    const now = Date.now()
    if (now - lastSpaceTime < SPACE_COOLDOWN_MS) return
    lastSpaceTime = now
    if (!showAnswer.value) {
      showAnswerFn()
    } else if (mode.value === 'free' && !isAutoPlaying.value) {
      nextCard()
    }
    // В interval-режиме при showAnswer Space ничего не делает (ждём цифру)
    return
  }

  // Ctrl/Cmd+W — авто (свободный режим)
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyW') {
    e.preventDefault()
    if (mode.value === 'free' && !isFinished.value) {
      toggleAutoPlay()
    }
    return
  }

  // 1-4 — оценки SM-2 (только интервальный режим, после показа ответа)
  if (showAnswer.value && mode.value === 'interval') {
    switch (e.key) {
      case '1':
        e.preventDefault()
        submitReview(0)
        break
      case '2':
        e.preventDefault()
        submitReview(3)
        break
      case '3':
        e.preventDefault()
        submitReview(4)
        break
      case '4':
        e.preventDefault()
        submitReview(5)
        break
    }
  }
}

/** Показывает ответ и запускает озвучку (яп + пауза + ру) */
const showAnswerFn = () => {
  playClickSound()
  showAnswer.value = true
  if (currentCard.value) {
    speakBoth(currentCard.value.KanjiText, currentCard.value.Translation)
  }
}

/** Озвучка только японского текста */
const speakJapaneseOnly = () => {
  if (!ttsAvailable.value && isWails) return
  if (currentCard.value) {
    speakJapanese(currentCard.value.KanjiText)
  }
}

/** Озвучка только русского перевода */
const speakRussianOnly = () => {
  if (!ttsAvailable.value && isWails) return
  if (currentCard.value) {
    speakRussian(currentCard.value.Translation)
  }
}

/** Отправляет оценку SM-2 и переходит к следующей карточке */
const submitReview = async (grade: number) => {
  playClickSound()
  try {
    if (currentCard.value) {
      await submitReviewWails(currentCard.value.ID, grade)
    }
    nextCard()
  } catch (e) {
    console.error('Ошибка отправки повторения:', e)
    await alert({
      title: 'Ошибка',
      message: 'Не удалось отправить повторение: ' + e,
      isError: true,
    })
  }
}

/** Переходит к следующей карточке (с задержкой для анимации) */
const nextCard = () => {
  playClickSound()
  showAnswer.value = false
  setTimeout(() => {
    currentIndex.value++
    nextTick(() => {
      if (isFinished.value) {
        triggerConfetti()
        try {
          const audio = new Audio('/audio/training_success_sound.mp3')
          successSound.value = audio
          audio.play()
        } catch {
          // звук не критичен
        }
      }
    })
  }, 50)
}

/** Переключает авто-режим */
const toggleAutoPlay = () => {
  playClickSound()
  if (isAutoPlaying.value) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
}

/** Запускает авто-режим: вопрос → 2c → ответ + озвучка → 3.5c → далее */
const startAutoPlay = () => {
  isAutoPlaying.value = true
  processAutoPlayStep()
}

/** Останавливает авто-режим */
const stopAutoPlay = () => {
  isAutoPlaying.value = false
  if (lazyTimer) { clearTimeout(lazyTimer); lazyTimer = null }
  if (answerTimer) { clearTimeout(answerTimer); answerTimer = null }
}

/** Выполняет один шаг авто-режима */
const processAutoPlayStep = () => {
  if (!isAutoPlaying.value || isFinished.value) {
    stopAutoPlay()
    return
  }

  lazyTimer = setTimeout(() => {
    if (!isAutoPlaying.value || isFinished.value) return

    showAnswerFn()

    answerTimer = setTimeout(() => {
      if (!isAutoPlaying.value || isFinished.value) return
      nextCard()
      processAutoPlayStep()
    }, 3500)
  }, 2000)
}

/** При ручном показе ответа — отменяем таймер вопроса */
watch(showAnswer, () => {
  if (showAnswer.value && isAutoPlaying.value) {
    if (lazyTimer) { clearTimeout(lazyTimer); lazyTimer = null }
  }
})

/** При смене карточки в авто-режиме — продолжаем цикл */
watch(currentIndex, () => {
  if (isAutoPlaying.value && !isFinished.value) {
    if (answerTimer) { clearTimeout(answerTimer); answerTimer = null }
    processAutoPlayStep()
  }
})

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)

  // Защита: если не выбраны колоды — редирект
  if (deckIds.length === 0) {
    await alert({
      title: 'Ошибка',
      message: 'Не выбраны колоды для тренировки. Вернитесь на главную и выберите хотя бы одну колоду.',
      isError: true,
    })
    router.push({ name: 'Home' })
    return
  }

  await loadCards()

  // Проверяем доступность TTS в Wails-режиме
  if (isWails) {
    try {
      const ttsStatus = await checkTTSAvailability()
      ttsAvailable.value = ttsStatus.available
      if (!ttsStatus.available) {
        if (ttsStatus.status === 1 && !isTtsUnavailableShown()) { // StatusInitializing
          markTtsUnavailableShown()
          await alert({
            title: 'Озвучка настраивается',
            message:
              'Python-окружение для озвучки устанавливается. '
              + ttsStatus.message
              + '\n\nЭто может занять несколько минут при первом запуске. '
              + 'Озвучка станет доступна автоматически.',
          })
          startPollingTTS()
        } else if (ttsStatus.status !== 1) {
          // Остальные состояния — просто логируем, banner покажет подсказку
          console.warn('TTS недоступен:', ttsStatus.message)
        }
      }
    } catch {
      // игнорируем ошибку проверки
    }
  }
})

/** Запускает опрос готовности TTS */
const startPollingTTS = () => {
  ttsPollTimer = setInterval(async () => {
    try {
      const status = await checkTTSAvailability()
      if (status.available) {
        ttsAvailable.value = true
        if (ttsPollTimer) {
          clearInterval(ttsPollTimer)
          ttsPollTimer = null
        }
      }
    } catch {
      // игнорируем ошибку
    }
  }, 5000)
}

/** Останавливает опрос готовности TTS */
const stopPollingTTS = () => {
  if (ttsPollTimer) {
    clearInterval(ttsPollTimer)
    ttsPollTimer = null
  }
}

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  stopAutoPlay()
  stopPollingTTS()
  if (successSound.value) {
    successSound.value.pause()
    successSound.value.currentTime = 0
    successSound.value = null
  }
})
</script>

<style scoped>
.training {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 4rem);
}

.header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.header h1 {
  flex: 1;
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-text {
  color: #c7cdd8;
  font-weight: 500;
  font-size: 0.95rem;
}

.progress-bar {
  margin-bottom: 2.5rem;
}

:deep(.progress-bar .p-progressbar) {
  background: #222222 !important;
  border-radius: 1rem !important;
  height: 8px !important;
}

:deep(.progress-bar .p-progressbar-value) {
  background: linear-gradient(90deg, #ff0a14 0%, #ff3b45 100%) !important;
  border-radius: 1rem !important;
}

/* ===== Экран загрузки ===== */
.loading-screen {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 350px;
}

.loading-card {
  width: 100%;
  max-width: 600px;
  height: 350px;
  perspective: 1200px;
}

.loading-card-inner {
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #1a1a1a 0%, #111111 100%);
  border: 1px solid #222222;
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: loadingGlow 2s ease-in-out infinite;
}

@keyframes loadingGlow {
  0%, 100% {
    border-color: #222222;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  }
  50% {
    border-color: #333333;
    box-shadow: 0 10px 40px rgba(255, 10, 20, 0.08), 0 0 60px rgba(255, 10, 20, 0.04);
  }
}

.loading-char {
  font-size: 3rem;
  font-weight: 700;
  color: #ff0a14;
  opacity: 0.6;
  user-select: none;
}

.loading-dots {
  display: flex;
  gap: 0.75rem;
}

.loading-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ff0a14;
  opacity: 0.3;
  animation: dotPulse 1.2s ease-in-out infinite;
}

.loading-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes dotPulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

.loading-label {
  margin: 0;
  color: #555555;
  font-size: 0.85rem;
  font-weight: 400;
  letter-spacing: 0.03em;
}

/* ===== Карточка тренировки ===== */
.card-container {
  perspective: 1200px;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
  min-height: 350px;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.card {
  width: 100%;
  max-width: 600px;
  height: 350px;
  position: relative;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
  will-change: transform;
}

.card.flipped .card-inner {
  transform: rotateY(180deg) scale(1.03);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  background: linear-gradient(145deg, #1a1a1a 0%, #111111 100%);
  border: 1px solid #222222;
  border-radius: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.card-back {
  transform: rotateY(180deg);
  background: linear-gradient(145deg, #111111 0%, #1a1a1a 100%);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.text {
  font-size: 2.5rem;
  font-family: 'Noto Sans JP', 'Inter', sans-serif;
  text-align: center;
  line-height: 1.4;
  cursor: default;
}

.text.clickable {
  cursor: pointer;
  transition: background-position 0.3s ease;
  background-size: 200% 100%;
  background-image: linear-gradient(to right, white 50%, #ff0a14 50%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.translation-section .text.clickable {
  background-image: linear-gradient(to right, #c7cdd8 50%, #004078 50%);
}

.text.clickable:hover {
  background-position: -100% 0;
}

.text.clickable.tts-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background-image: none !important;
  -webkit-text-fill-color: #555555 !important;
}

.text.tts-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.word-section,
.translation-section {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin: 0.5rem 0;
  width: 100%;
  justify-content: center;
}

.word-section .text {
  font-size: 2rem;
}

.translation-section .text {
  font-size: 1.5rem;
  color: #c7cdd8;
}

.separator {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent 0%, #333333 50%, transparent 100%);
  margin: 1.5rem 0;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  transition: opacity 0.3s, visibility 0.3s;
  width: 100%;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
}

.action-buttons>* {
  flex: 1;
  min-width: 120px;
}

.primary-btn {
  background-color: #ff0a14;
  color: white;
  border: none;
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
}

.primary-btn:hover {
  background-color: #e00912;
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 10, 20, 0.3);
}

.primary-btn:active {
  transform: translateY(0);
}

.primary-btn.large {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
}

.secondary-btn {
  background-color: #222222;
  color: white;
  border: 1px solid #333333;
  padding: 0.875rem 1.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-align: center;
}

.secondary-btn:hover {
  background-color: #333333;
  border-color: #ff0a14;
  transform: translateY(-2px);
}

.grade-btn {
  padding: 0.875rem 1.25rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  flex: 1;
  min-width: 110px;
  border: none;
  color: white;
  text-align: center;
}

.grade-emoji {
  font-size: 1.75rem;
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.8);
}

.grade-text {
  font-size: 0.8rem;
  opacity: 0.9;
}

.grade-0 {
  background-color: #d62828;
}

.grade-0:hover {
  background-color: #b81d24;
  transform: translateY(-2px);
}

.grade-3 {
  background-color: #e8904a;
}

.grade-3:hover {
  background-color: #d87b32;
  transform: translateY(-2px);
}

.grade-4 {
  background-color: #004078;
}

.grade-4:hover {
  background-color: #003058;
  transform: translateY(-2px);
}

.grade-5 {
  background-color: #365700;
}

.grade-5:hover {
  background-color: #2a4500;
  transform: translateY(-2px);
}

.auto-play-btn {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  border: none;
}

.auto-play-btn.active {
  background-color: #1a3a1a;
  border: 1px solid #6bcb77;
  color: #6bcb77;
}

.finished {
  text-align: center;
  padding: 4rem 2rem;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
}

.finished-icon {
  font-size: 5rem;
  margin-bottom: 0.5rem;
  display: inline-block;
}

.finished h2 {
  font-size: 2rem;
  margin: 0;
}

.finished p {
  color: #c7cdd8;
  font-size: 1.1rem;
  margin: 0;
}

.icon-btn {
  background: transparent;
  border: 1px solid #333333;
  color: #c7cdd8;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: #1a1a1a;
  border-color: #ff0a14;
  color: #ffffff;
}

.icon {
  font-size: 1.25rem;
}

.hotkey-hint {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 3px;
  padding: 0 5px;
  margin-left: 5px;
  font-size: 0.6rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  letter-spacing: 0.04em;
  font-family: inherit;
  line-height: 1.6;
  vertical-align: middle;
  text-transform: uppercase;
}

.tts-warning {
  background: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem;
  text-align: center;
  font-size: 0.85rem;
  color: #c7cdd8;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.go-home-btn {
  width: auto;
  min-width: 200px;
  margin: 0 auto;
}
</style>

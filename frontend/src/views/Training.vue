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

    <ProgressBar :value="progress" :show-value="false" class="progress-bar" />

    <div v-if="currentCard && !isFinished" class="card-container">
      <div class="card" :class="{ flipped: showAnswer }" :key="currentCard.ID">
        <div class="card-inner">
          <div class="card-front">
            <div class="text" @click="speakJapanese">{{ currentCard.KanjiText }}</div>
          </div>
          <div class="card-back">
            <div class="word-section">
              <div class="text clickable" @click="speakJapanese">
                <FuriganaText :KanjiText="currentCard.KanjiText" :FuriganaText="currentCard.FuriganaText" />
              </div>
            </div>
            <div class="separator"></div>
            <div class="translation-section">
              <div class="text clickable" @click="speakRussian">{{ currentCard.Translation }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!isFinished" class="actions">
      <div class="action-buttons">
        <template v-if="mode === 'interval'">
          <button v-if="!showAnswer" @click="showAnswerFn" class="primary-btn large">
            Показать ответ
          </button>
          <template v-else>
            <button @click="submitReview(0)" class="grade-btn grade-0">
              <span class="grade-emoji">😵‍💫</span>
              <span class="grade-text">Повторить</span>
            </button>
            <button @click="submitReview(3)" class="grade-btn grade-3">
              <span class="grade-emoji">🥺</span>
              <span class="grade-text">Трудно</span>
            </button>
            <button @click="submitReview(4)" class="grade-btn grade-4">
              <span class="grade-emoji">😊</span>
              <span class="grade-text">Хорошо</span>
            </button>
            <button @click="submitReview(5)" class="grade-btn grade-5">
              <span class="grade-emoji">😜</span>
              <span class="grade-text">Легко</span>
            </button>
          </template>
        </template>
        <template v-else>
          <template v-if="!isAutoPlaying">
            <button v-if="!showAnswer" @click="showAnswerFn" class="primary-btn large">
              Показать ответ
            </button>
            <div v-else class="free-mode-buttons">
              <button @click="nextCard" class="primary-btn large">
                Далее
              </button>
            </div>
          </template>
          <button @click="toggleAutoPlay" class="auto-play-btn secondary-btn" :class="{ active: isAutoPlaying }">
            {{ isAutoPlaying ? 'Остановить' : 'Авто-режим' }}
          </button>
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
        Вернуться на главную
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressBar from 'primevue/progressbar'
import FuriganaText from '../components/FuriganaText.vue'
import type { TrainingCard as TrainingCardType } from '../types'
import { useWails } from '../composables/useWails'
import { useAlert } from '../composables/useAlert'
import confetti from 'canvas-confetti'

const router = useRouter()
const route = useRoute()
const { alert } = useAlert()
const mode = computed(() => {
  const m = route.query.mode as string
  // Поддерживаем старые режимы для обратной совместимости
  if (m === 'normal' || m === 'lazy') return 'free'
  return m || 'interval'
})
const deckIds = (route.query.deckIds as string).split(',').map(Number)
const { getTrainingCards, submitReview: submitReviewWails } = useWails()

const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    interval: 'Повторение',
    free: 'Свободный режим'
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
  return ((currentIndex.value) / cards.value.length) * 100
})

// Автовоспроизведение
const isAutoPlaying = ref(false)
let lazyTimer: number | null = null
let answerTimer: number | null = null

// Голосовые функции
let voices: SpeechSynthesisVoice[] = []
let voicesLoaded = false

const loadVoices = () => {
  voices = window.speechSynthesis.getVoices()
  voicesLoaded = voices.length > 0
}

onMounted(async () => {
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)

  await loadCards()
})

onUnmounted(() => {
  window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
  stopAutoPlay()
  window.speechSynthesis.cancel()
})

const loadCards = async () => {
  try {
    // Для free режима используем normal
    const backendMode = mode.value === 'free' ? 'normal' : mode.value
    cards.value = await getTrainingCards(backendMode, deckIds)
  } catch (e) {
    console.error('Ошибка загрузки карточек для тренировки:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось загрузить карточки для тренировки: ' + e })
  }
}

const goBack = () => {
  stopAutoPlay()
  window.speechSynthesis.cancel()
  router.push({ name: 'Home' })
}

const getVoice = (lang: string): SpeechSynthesisVoice | null => {
  if (!voicesLoaded) {
    loadVoices()
  }

  // Сначала ищем точное соответствие
  let voice = voices.find((v) => v.lang === lang)
  if (voice) return voice

  // Потом ищем по началу кода языка
  voice = voices.find((v) => v.lang.startsWith(lang.split('-')[0]))
  return voice || null
}

const speakJapanese = () => {
  if (!currentCard.value) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(currentCard.value.KanjiText)
  utterance.lang = 'ja-JP'
  const voice = getVoice('ja-JP')
  if (voice) {
    utterance.voice = voice
  }
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

const speakRussian = () => {
  if (!currentCard.value) return
  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(currentCard.value.Translation)
  utterance.lang = 'ru-RU'
  const voice = getVoice('ru-RU')
  if (voice) {
    utterance.voice = voice
  }
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

const speak = () => {
  if (!currentCard.value) return
  window.speechSynthesis.cancel()

  const uttr1 = new SpeechSynthesisUtterance(currentCard.value.KanjiText)
  uttr1.lang = 'ja-JP'
  const jaVoice = getVoice('ja-JP')
  if (jaVoice) {
    uttr1.voice = jaVoice
  }
  uttr1.rate = 0.9

  window.speechSynthesis.speak(uttr1)

  setTimeout(() => {
    if (!currentCard.value) return
    const uttr2 = new SpeechSynthesisUtterance(currentCard.value.Translation)
    uttr2.lang = 'ru-RU'
    const ruVoice = getVoice('ru-RU')
    if (ruVoice) {
      uttr2.voice = ruVoice
    }
    uttr2.rate = 0.9
    window.speechSynthesis.speak(uttr2)
  }, 500)
}

const showAnswerFn = () => {
  showAnswer.value = true
  speak()
}

const submitReview = async (grade: number) => {
  try {
    if (currentCard.value) {
      await submitReviewWails(currentCard.value.ID, grade)
    }
    nextCard()
  } catch (e) {
    console.error('Ошибка отправки повторения:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось отправить повторение: ' + e })
  }
}

const nextCard = () => {
  window.speechSynthesis.cancel()
  // First hide the answer
  showAnswer.value = false
  // Wait a tiny bit for the animation to start, then update index
  setTimeout(() => {
    currentIndex.value++
    // Check if we just finished
    nextTick(() => {
      if (isFinished.value) {
        triggerConfetti()
      }
    })
  }, 50)
}

const triggerConfetti = () => {
  const duration = 3 * 1000
  const animationEnd = Date.now() + duration
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

  const random = (min: number, max: number) => Math.random() * (max - min) + min

  const interval: any = setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      return clearInterval(interval)
    }

    const particleCount = 50 * (timeLeft / duration)
    // since particles fall down, start a bit higher than random
    confetti({ ...defaults, particleCount, origin: { x: random(0, 1), y: Math.random() - 0.2 } })
  }, 250)
}

const toggleAutoPlay = () => {
  if (isAutoPlaying.value) {
    stopAutoPlay()
  } else {
    startAutoPlay()
  }
}

const startAutoPlay = () => {
  isAutoPlaying.value = true
  processAutoPlayStep()
}

const stopAutoPlay = () => {
  isAutoPlaying.value = false
  if (lazyTimer) {
    clearTimeout(lazyTimer)
    lazyTimer = null
  }
  if (answerTimer) {
    clearTimeout(answerTimer)
    answerTimer = null
  }
  window.speechSynthesis.cancel()
}

const processAutoPlayStep = () => {
  if (!isAutoPlaying.value || isFinished.value) {
    stopAutoPlay()
    return
  }

  // Показываем вопрос, ждем 2 секунды
  lazyTimer = window.setTimeout(() => {
    if (!isAutoPlaying.value || isFinished.value) return

    // Показываем ответ и озвучиваем
    showAnswerFn()

    // Ждем завершения озвучки + еще 3 секунды
    answerTimer = window.setTimeout(() => {
      if (!isAutoPlaying.value || isFinished.value) return
      nextCard()

      // Переход к следующей карточке
      processAutoPlayStep()
    }, 3500)
  }, 2000)
}

// Останавливаем автовоспроизведение при ручном взаимодействии
watch(showAnswer, () => {
  if (showAnswer.value && isAutoPlaying.value) {
    // Пользователь нажал "Показать ответ" вручную - останавливаем таймер,
    // но оставляем isAutoPlaying активным, чтобы он мог продолжить
    if (lazyTimer) {
      clearTimeout(lazyTimer)
      lazyTimer = null
    }
  }
})

watch(currentIndex, () => {
  if (isAutoPlaying.value && !isFinished.value) {
    // Перешли к следующей карточке - продолжаем автовоспроизведение
    if (answerTimer) {
      clearTimeout(answerTimer)
      answerTimer = null
    }
    processAutoPlayStep()
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
}

.card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
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

.action-buttons,
.free-mode-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
}

.action-buttons > * {
  flex: 1;
  min-width: 120px;
}

.free-mode-buttons > * {
  flex: 1;
  min-width: 150px;
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

.auto-play-btn.active {
  background-color: #1a3a1a;
  border-color: #6bcb77;
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

.go-home-btn {
  width: auto;
  min-width: 200px;
  margin: 0 auto;
}
</style>

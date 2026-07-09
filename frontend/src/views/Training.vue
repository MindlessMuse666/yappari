<template>
  <div class="training">
    <div class="header">
      <button @click="goBack">← Назад</button>
      <h1>{{ modeLabel }}</h1>
    </div>
    <ProgressBar :value="progress" :show-value="false" />
    <div v-if="currentCard" class="card">
      <div class="front">{{ currentCard.KanjiText }}</div>
      <div v-if="showAnswer" class="back">
        <FuriganaText :KanjiText="currentCard.KanjiText" :FuriganaText="currentCard.FuriganaText" />
        <div class="translation">{{ currentCard.Translation }}</div>
      </div>
    </div>
    <div class="actions">
      <button v-if="!showAnswer" @click="showAnswerFn">Показать ответ</button>
      <template v-else>
        <button v-if="mode === 'interval'" @click="submitReview(0)">Повторить</button>
        <button v-if="mode === 'interval'" @click="submitReview(3)">Трудно</button>
        <button v-if="mode === 'interval'" @click="submitReview(4)">Хорошо</button>
        <button v-if="mode === 'interval'" @click="submitReview(5)">Легко</button>
        <button v-if="mode !== 'interval'" @click="nextCard">Далее</button>
      </template>
    </div>
    <div v-if="isFinished" class="finished">
      <h2>Тренировка завершена!</h2>
      <button @click="goBack">Вернуться на главную</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ProgressBar from 'primevue/progressbar'
import FuriganaText from '../components/FuriganaText.vue'
import type { TrainingCard as TrainingCardType } from '../types'
import { useWails } from '../composables/useWails'

const router = useRouter()
const route = useRoute()
const mode = route.query.mode as string
const deckIds = (route.query.deckIds as string).split(',').map(Number)
const { getTrainingCards, submitReview: submitReviewWails } = useWails()

const modeLabel = computed(() => {
  const labels: Record<string, string> = {
    interval: 'Интервальное повторение',
    normal: 'Обычная зубрёжка',
    lazy: 'Ленивое заучивание'
  }
  return labels[mode] || ''
})

const cards = ref<TrainingCardType[]>([])
const currentIndex = ref(0)
const currentCard = computed(() => cards.value[currentIndex.value])
const showAnswer = ref(false)
const isFinished = computed(() => currentIndex.value >= cards.value.length)
const progress = computed(() => (currentIndex.value / cards.value.length) * 100)

let lazyTimer: number | null = null

onMounted(async () => {
  await loadCards()
  if (mode === 'lazy') {
    startLazyMode()
  }
})

onUnmounted(() => {
  if (lazyTimer) {
    clearTimeout(lazyTimer)
  }
})

const loadCards = async () => {
  try {
    cards.value = await getTrainingCards(mode, deckIds)
  } catch (e) {
    console.error('Ошибка загрузки карточек для тренировки:', e)
    alert('Не удалось загрузить карточки для тренировки: ' + e)
  }
}

const goBack = () => {
  router.push({ name: 'Home' })
}

const showAnswerFn = () => {
  showAnswer.value = true
  speak()
}

const speak = () => {
  if (!currentCard.value) return
  const synth = window.speechSynthesis
  synth.cancel()
  const uttr1 = new SpeechSynthesisUtterance(currentCard.value.KanjiText)
  uttr1.lang = 'ja-JP'
  synth.speak(uttr1)
  setTimeout(() => {
    const uttr2 = new SpeechSynthesisUtterance(currentCard.value.Translation)
    uttr2.lang = 'ru-RU'
    synth.speak(uttr2)
  }, 500)
}

const submitReview = async (grade: number) => {
  try {
    if (currentCard.value) {
      await submitReviewWails(currentCard.value.ID, grade)
    }
    nextCard()
  } catch (e) {
    console.error('Ошибка отправки повторения:', e)
    alert('Не удалось отправить повторение: ' + e)
  }
}

const nextCard = () => {
  showAnswer.value = false
  currentIndex.value++
  if (mode === 'lazy' && !isFinished.value) {
    startLazyMode()
  }
}

const startLazyMode = () => {
  lazyTimer = window.setTimeout(() => {
    showAnswerFn()
    lazyTimer = window.setTimeout(() => {
      nextCard()
    }, 3000)
  }, 2000)
}
</script>

<style scoped>
.training {
  padding: 2rem;
  text-align: center;
}

.header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
}

.card {
  margin: 4rem 0;
  padding: 4rem;
  background: #1a1a1a;
  border-radius: 1rem;
}

.front {
  font-size: 3rem;
}

.back {
  margin-top: 2rem;
}

.translation {
  font-size: 1.5rem;
  margin-top: 1rem;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.finished {
  margin-top: 4rem;
}
</style>

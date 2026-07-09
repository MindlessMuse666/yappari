<template>
  <div class="home">
    <h1>Yappari</h1>

    <div v-if="decks.length === 0" class="empty-state">
      <p>У тебя пока нет колод. Создай первую!</p>
    </div>

    <div v-else class="deck-list">
      <div v-for="deck in decks" :key="deck.ID" class="deck-item">
        <input type="checkbox" :id="`deck-${deck.ID}`" v-model="selectedDeckIds" :value="deck.ID" />
        <label :for="`deck-${deck.ID}`">{{ deck.Name }}</label>
        <button @click="goToDeck(deck.ID)">Управлять</button>
      </div>
    </div>

    <div class="actions">
      <button @click="createDeckModalVisible = true">Новая колода</button>
    </div>

    <div v-if="decks.length > 0" class="training-buttons">
      <button @click="startTraining('interval')" :disabled="selectedDeckIds.length === 0">
        Интервальное повторение
      </button>
      <button @click="startTraining('normal')" :disabled="selectedDeckIds.length === 0">
        Обычная зубрёжка
      </button>
      <button @click="startTraining('lazy')" :disabled="selectedDeckIds.length === 0">
        Ленивое заучивание
      </button>
    </div>

    <Dialog v-model:visible="createDeckModalVisible" header="Новая колода">
      <InputText v-model="newDeckName" placeholder="Название колоды" />
      <template #footer>
        <Button label="Отмена" @click="createDeckModalVisible = false" />
        <Button label="Создать" @click="createDeck" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import type { Deck } from '../types'
import { useWails } from '../composables/useWails'

const router = useRouter()
const { getDecks, createDeck: createDeckWails } = useWails()
const decks = ref<Deck[]>([])
const selectedDeckIds = ref<number[]>([])
const createDeckModalVisible = ref(false)
const newDeckName = ref('')
const isLoading = ref(false)

onMounted(async () => {
  const saved = localStorage.getItem('selectedDeckIds')
  if (saved) {
    selectedDeckIds.value = JSON.parse(saved)
  }
  await loadDecks()
})

watch(selectedDeckIds, (newVal) => {
  localStorage.setItem('selectedDeckIds', JSON.stringify(newVal))
})

const loadDecks = async () => {
  try {
    isLoading.value = true
    decks.value = await getDecks()
  } catch (e) {
    console.error('Ошибка загрузки колод:', e)
    alert('Не удалось загрузить колоды: ' + e)
  } finally {
    isLoading.value = false
  }
}

const createDeck = async () => {
  if (!newDeckName.value.trim()) {
    alert('Пожалуйста, введите название колоды!')
    return
  }
  try {
    isLoading.value = true
    await createDeckWails(newDeckName.value)
    createDeckModalVisible.value = false
    newDeckName.value = ''
    await loadDecks()
  } catch (e) {
    console.error('Ошибка создания колоды:', e)
    alert('Не удалось создать колоду: ' + e)
  } finally {
    isLoading.value = false
  }
}

const goToDeck = (id: number) => {
  router.push({ name: 'DeckManage', params: { id } })
}

const startTraining = (mode: string) => {
  router.push({ name: 'Training', query: { mode, deckIds: selectedDeckIds.value.join(',') } })
}
</script>

<style scoped>
.home {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #c7cdd8;
  font-size: 1.1rem;
}

.deck-list {
  margin: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.deck-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: #111111;
  border: 1px solid #222222;
  border-radius: 0.75rem;
}

.deck-item label {
  flex: 1;
  cursor: pointer;
  font-size: 1.1rem;
}

.deck-item input[type="checkbox"] {
  width: auto;
  transform: scale(1.3);
}

.actions {
  margin: 1.5rem 0;
}

.training-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>

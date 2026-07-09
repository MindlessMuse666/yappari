<template>
  <div class="home">
    <div class="header">
      <img src="/yappari_logo.png" alt="Yappari Logo" class="logo" draggable="false" />
      <h1>Yappari</h1>
    </div>

    <div class="actions">
      <button @click="createDeckModalVisible = true" class="primary-btn">
        <span class="icon">+</span>
        Новая колода
      </button>
    </div>

    <div v-if="decks.length === 0" class="empty-state">
      <p>У тебя пока нет колод. Создай первую!</p>
    </div>

    <div v-else class="deck-list">
      <div v-for="deck in decks" :key="deck.ID" class="deck-item">
        <label class="deck-checkbox-wrapper" :for="`deck-${deck.ID}`">
          <input type="checkbox" :id="`deck-${deck.ID}`" v-model="selectedDeckIds" :value="deck.ID" />
          <span class="deck-name">{{ deck.Name }}</span>
        </label>
        <button @click.stop="goToDeck(deck.ID)" class="gear-btn" title="Управлять колодой">
          ⚙️
        </button>
      </div>
    </div>

    <div v-if="decks.length > 0" class="training-buttons">
      <button @click="startTraining('interval')" :disabled="selectedDeckIds.length === 0" class="training-btn">
        Повторение
      </button>
      <button @click="startTraining('free')" :disabled="selectedDeckIds.length === 0" class="training-btn">
        Свободный режим
      </button>
    </div>

    <Dialog v-model:visible="createDeckModalVisible" header="Создать колоду" class="custom-dialog" :closable="false">
      <div class="form-content" :class="{ 'shake': shake }">
        <div class="input-group">
          <label for="deck-name">Название колоды <span class="required-asterisk">*</span></label>
          <InputText id="deck-name" v-model="newDeckName" placeholder="Введите название колоды" class="custom-input"
            :class="{ 'input-error': errors.deckName }" @keyup.enter="createDeck" />
          <div v-if="errors.deckName" class="error">{{ errors.deckName }}</div>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" @click="closeCreateModal" class="secondary-btn" />
        <Button label="Создать" @click="createDeck" class="primary-btn" />
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
import { useAlert } from '../composables/useAlert'

const router = useRouter()
const { getDecks, createDeck: createDeckWails } = useWails()
const { alert } = useAlert()
const decks = ref<Deck[]>([])
const selectedDeckIds = ref<number[]>([])
const createDeckModalVisible = ref(false)
const newDeckName = ref('')
const isLoading = ref(false)
const errors = ref({ deckName: '' })
const shake = ref(false)

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
    await alert({ title: 'Ошибка', message: 'Не удалось загрузить колоды: ' + e })
  } finally {
    isLoading.value = false
  }
}

const triggerShake = () => {
  shake.value = true
  setTimeout(() => {
    shake.value = false
  }, 500)
}

const validateForm = (): boolean => {
  errors.value = { deckName: '' }
  if (!newDeckName.value.trim()) {
    errors.value.deckName = 'Поле не может быть пустым!'
    triggerShake()
    return false
  }
  if (newDeckName.value.trim().length < 2) {
    errors.value.deckName = 'Название колоды должно быть не менее 2 символов'
    triggerShake()
    return false
  }
  return true
}

const createDeck = async () => {
  if (!validateForm()) return

  try {
    isLoading.value = true
    await createDeckWails(newDeckName.value.trim())
    closeCreateModal()
    await loadDecks()
  } catch (e) {
    console.error('Ошибка создания колоды:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось создать колоду: ' + e })
  } finally {
    isLoading.value = false
  }
}

const closeCreateModal = () => {
  createDeckModalVisible.value = false
  newDeckName.value = ''
  errors.value = { deckName: '' }
}

const goToDeck = (id: number) => {
  router.push({ name: 'DeckManage', params: { id } })
}

const startTraining = (mode: string) => {
  if (selectedDeckIds.value.length === 0) return
  router.push({ name: 'Training', query: { mode, deckIds: selectedDeckIds.value.join(',') } })
}
</script>

<style scoped>
.home {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.logo {
  width: 64px;
  height: 64px;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  user-select: none;
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
  padding: 1rem 1.25rem;
  background-color: #111111;
  border: 1px solid #222222;
  border-radius: 0.75rem;
  transition: all 0.2s;
  cursor: pointer;
}

.deck-item:hover {
  border-color: #ff0a14;
  background-color: #151515;
}

.deck-checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  cursor: pointer;
}

.deck-checkbox-wrapper input[type="checkbox"] {
  appearance: none;
  width: 26px;
  height: 26px;
  border: 2px solid #333333;
  border-radius: 6px;
  background: #111111;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  position: relative;
}

.deck-checkbox-wrapper input[type="checkbox"]:checked {
  background: #ff0a14;
  border-color: #ff0a14;
}

.deck-checkbox-wrapper input[type="checkbox"]:checked::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 46%;
  width: 8px;
  height: 14px;
  border: solid white;
  border-width: 0 3px 3px 0;
  transform: translate(-50%, -50%) rotate(45deg);
}

.deck-checkbox-wrapper input[type="checkbox"]:hover {
  border-color: #ff0a14;
}

.deck-name {
  font-size: 1.1rem;
  user-select: none;
}

.gear-btn {
  background: transparent;
  border: none;
  color: #c7cdd8;
  padding: 0.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  line-height: 1;
  z-index: 1;
}

.gear-btn:hover {
  color: #ffffff;
  transform: rotate(90deg) scale(1.2);
}

.actions {
  margin: 0 0 2rem 0;
}

.primary-btn {
  background-color: #ff0a14;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
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

.primary-btn:hover:not(:disabled) {
  background-color: #e00912;
  transform: translateY(-2px);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.secondary-btn {
  background-color: #222222;
  color: white;
  border: 1px solid #333333;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.secondary-btn:hover {
  background-color: #333333;
  border-color: #ff0a14;
  transform: translateY(-2px);
}

.training-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.training-btn {
  flex: 1;
  min-width: 200px;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  transition: all 0.2s;
}

.training-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 10, 20, 0.3);
}

.form-content {
  padding: 1rem 0;
}

.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  color: #c7cdd8;
  font-weight: 500;
}

.required-asterisk {
  color: #ff0a14;
}

.custom-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid #c7cdd8;
  background: #111111;
  color: white;
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.custom-input::placeholder {
  color: #555555;
}

.custom-input:focus {
  border-color: #ffffff;
}

.custom-input.input-error {
  border-color: #ff0a14 !important;
}

.error {
  color: #ff4444;
  font-size: 0.85rem;
  margin-top: 0.25rem;
}
</style>

<style>
.p-dialog-mask {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.5) !important;
  pointer-events: auto !important;
}

.custom-dialog .p-dialog {
  background: #111111 !important;
  border: 1px solid #c7cdd8 !important;
  border-radius: 1.5rem !important;
  width: 90vw !important;
  max-width: 550px !important;
}

.custom-dialog .p-dialog-header {
  background: #111111 !important;
  border-bottom: 1px solid #222222 !important;
  color: white !important;
  border-radius: 1.5rem 1.5rem 0 0 !important;
  padding: 1.75rem !important;
}

.custom-dialog .p-dialog-content {
  background: #111111 !important;
  color: white !important;
  padding: 1.75rem !important;
}

.custom-dialog .p-dialog-footer {
  background: #111111 !important;
  border-top: 1px solid #222222 !important;
  border-radius: 0 0 1.5rem 1.5rem !important;
  padding: 1.75rem !important;
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.custom-dialog .p-dialog-title {
  font-size: 1.35rem !important;
  font-weight: 700 !important;
}

.custom-dialog .p-button {
  border-radius: 0.75rem !important;
  padding: 0.75rem 1.5rem !important;
  font-weight: 600 !important;
  transition: all 0.2s !important;
}

.custom-dialog .p-button.secondary-btn {
  background: #222222 !important;
  border: 1px solid #333333 !important;
  color: white !important;
}

.custom-dialog .p-button.secondary-btn:hover {
  background: #333333 !important;
  border-color: #ff0a14 !important;
}

.custom-dialog .p-button.primary-btn {
  background: #ff0a14 !important;
  border: none !important;
  color: white !important;
}

.custom-dialog .p-button.primary-btn:hover {
  background: #e00912 !important;
}
</style>

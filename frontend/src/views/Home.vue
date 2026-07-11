<!--
  Главная страница приложения.

  Отображает список колод с чекбоксами для выбора, кнопки
  создания колоды и перехода к тренировке, а также модальное
  окно для создания новой колоды.
-->

<template>
  <div class="home">
    <div class="header">
      <img src="/yappari_logo.png" alt="Yappari Logo" class="logo" draggable="false" />
      <h1>Yappari</h1>
    </div>

    <div class="actions">
      <button v-if="decks.length > 0" @click="createDeckModalVisible = true" class="primary-btn">
        <span class="icon">+</span>
        Новая колода <kbd class="hotkey-hint">Ctrl N</kbd>
      </button>
      <button v-if="decks.length > 0" @click="toggleSelectAll" class="primary-btn select-all-btn">
        {{ allSelected ? 'Сбросить все' : 'Выбрать все' }}
      </button>
    </div>

    <div v-if="decks.length === 0" class="empty-state" @click="createDeckModalVisible = true">
      <div class="empty-state-icon">
        <span class="empty-plus">+</span>
      </div>
      <h2 class="empty-state-title">У тебя пока нет колод.</h2>
      <p class="empty-state-subtitle">Создай первую!</p>
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
      <!-- Кнопка: Интервальное повторение -->
      <div class="training-btn-wrapper">
        <button @click="startTraining('interval')" :disabled="selectedDeckIds.length === 0" class="training-btn">
          Повторение
        </button>
        <div class="corner-trigger" @mouseenter="showPopover('interval')" @mouseleave="onLeavePopover"
          @click="startTraining('interval')">
          <span class="corner-fold">?</span>
        </div>
        <Transition name="popover">
          <div v-if="activePopover === 'interval'" class="legend-popover" @mouseenter="clearPopoverTimer"
            @mouseleave="onLeavePopover">
            <strong class="popover-title">Интервальное повторение</strong>
            <p class="popover-desc">
              Умная система SM-2 следит за твоими успехами и подсовывает
              карточки ровно в тот момент, когда ты начинаешь их забывать.
            </p>
          </div>
        </Transition>
      </div>

      <!-- Кнопка: Свободный режим -->
      <div class="training-btn-wrapper">
        <button @click="startTraining('free')" :disabled="selectedDeckIds.length === 0" class="training-btn">
          Свободный режим
        </button>
        <div class="corner-trigger" @mouseenter="showPopover('free')" @mouseleave="onLeavePopover"
          @click="startTraining('free')">
          <span class="corner-fold">?</span>
        </div>
        <Transition name="popover">
          <div v-if="activePopover === 'free'" class="legend-popover" @mouseenter="clearPopoverTimer"
            @mouseleave="onLeavePopover">
            <strong class="popover-title">Свободный режим</strong>
            <p class="popover-desc">
              Свободный темп + автовоспроизведение по желанию. Можно включить
              карточки как фоновую "ленту" и запоминать пассивно.
            </p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Модальное окно создания колоды -->
    <Dialog v-model:visible="createDeckModalVisible" header="Создать колоду" class="custom-dialog" :closable="false"
      @show="focusDeckNameInput">
      <div class="form-content" :class="{ shake: shake }">
        <div class="input-group">
          <label for="deck-name">
            Название колоды <span class="required-asterisk">*</span>
          </label>
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
/**
 * Главная страница: список колод и выбор режима тренировки.
 *
 * @module views/Home
 */

import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import type { Deck } from '../types'
import { useWails } from '../composables/useWails'
import { useAlert } from '../composables/useAlert'
import { playClickSound } from '../composables/useSound'

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
const activePopover = ref<string | null>(null)
let popoverTimer: ReturnType<typeof setTimeout> | null = null

/** Выбраны ли все колоды */
const allSelected = computed(
  () => decks.value.length > 0 && selectedDeckIds.value.length === decks.value.length
)

/** Загружает колоды с бэкенда */
const loadDecks = async () => {
  try {
    isLoading.value = true
    decks.value = await getDecks()
    // Очищаем выбор от несуществующих колод (мог остаться stale ID в localStorage)
    const validIds = new Set(decks.value.map(d => d.ID))
    selectedDeckIds.value = selectedDeckIds.value.filter(id => validIds.has(id))
  } catch (e) {
    console.error('Ошибка загрузки колод:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось загрузить колоды: ' + e, isError: true })
  } finally {
    isLoading.value = false
  }
}

/** Валидирует форму создания колоды */
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

/** Анимация встряхивания при ошибке валидации */
const triggerShake = () => {
  shake.value = true
  setTimeout(() => { shake.value = false }, 500)
}

/** Создаёт новую колоду */
const createDeck = async () => {
  playClickSound()
  if (!validateForm()) return
  try {
    isLoading.value = true
    await createDeckWails(newDeckName.value.trim())
    closeCreateModal()
    await loadDecks()
  } catch (e) {
    console.error('Ошибка создания колоды:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось создать колоду: ' + e, isError: true })
  } finally {
    isLoading.value = false
  }
}

/** Ставит каретку в поле ввода при открытии модалки */
const focusDeckNameInput = () => {
  nextTick(() => document.getElementById('deck-name')?.focus())
}

/** Закрывает модалку создания колоды и сбрасывает форму */
const closeCreateModal = () => {
  playClickSound()
  createDeckModalVisible.value = false
  newDeckName.value = ''
  errors.value = { deckName: '' }
}

/** Переход на страницу управления колодой */
const goToDeck = (id: number) => {
  playClickSound()
  router.push({ name: 'DeckManage', params: { id } })
}

/** Переход к тренировке */
const startTraining = (mode: string) => {
  playClickSound()
  if (selectedDeckIds.value.length === 0) return
  router.push({
    name: 'Training',
    query: { mode, deckIds: selectedDeckIds.value.join(',') },
  })
}

/** Выделить / снять выделение со всех колод */
const toggleSelectAll = () => {
  playClickSound()
  if (allSelected.value) {
    selectedDeckIds.value = []
  } else {
    selectedDeckIds.value = decks.value.map(d => d.ID)
  }
}

/** Ctrl+N — открыть модалку создания колоды */
const onKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyN') {
    e.preventDefault()
    createDeckModalVisible.value = true
  }
}

/** Сброс таймера поповера */
const clearPopoverTimer = () => {
  if (popoverTimer !== null) {
    clearTimeout(popoverTimer)
    popoverTimer = null
  }
}

/** Запуск таймера скрытия поповера */
const onLeavePopover = () => {
  clearPopoverTimer()
  popoverTimer = setTimeout(() => { activePopover.value = null }, 250)
}

/** Показывает поповер после задержки (защита от случайного наведения) */
const showPopover = (mode: string) => {
  clearPopoverTimer()
  popoverTimer = setTimeout(() => { activePopover.value = mode }, 350)
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  const saved = localStorage.getItem('selectedDeckIds')
  if (saved) {
    selectedDeckIds.value = JSON.parse(saved)
  }
  await loadDecks()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('wheel', preventWheel)
})

/** Блокировка прокрутки колёсиком при открытой модалке создания колоды */
const preventWheel = (e: WheelEvent) => { e.preventDefault() }
watch(createDeckModalVisible, (open) => {
  if (open) {
    document.addEventListener('wheel', preventWheel, { passive: false })
  } else {
    document.removeEventListener('wheel', preventWheel)
  }
})

/** Сохраняет выбранные колоды в localStorage */
watch(selectedDeckIds, (newVal) => {
  localStorage.setItem('selectedDeckIds', JSON.stringify(newVal))
})
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
  padding: 5rem 2rem;
  border: 2px dashed #222222;
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.empty-state:hover {
  border-color: #ffffff;
  background: rgba(255, 255, 255, 0.02);
}

.empty-state-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #111111;
  border: 2px solid #222222;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  transition: all 0.3s ease;
}

.empty-state:hover .empty-state-icon {
  border-color: #ff0a14;
  background: rgba(255, 10, 20, 0.08);
}

.empty-plus {
  font-size: 2.5rem;
  color: #ff0a14;
  font-weight: 300;
  line-height: 1;
  transition: color 0.3s ease;
}

.empty-state:hover .empty-plus {
  color: #ffffff;
}

.empty-state-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
}

.empty-state-subtitle {
  font-size: 1.15rem;
  color: #c7cdd8;
  margin: 0;
  transition: color 0.3s ease;
}

.empty-state:hover .empty-state-subtitle {
  color: #ff0a14;
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
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.select-all-btn {
  margin-left: auto;
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

.training-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.training-btn-wrapper {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.training-btn {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1.05rem;
  font-weight: 700;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
  min-height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.training-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(255, 10, 20, 0.3);
}

.training-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.training-btn:disabled ~ .corner-trigger {
  pointer-events: none;
  opacity: 0.35;
  cursor: not-allowed;
}

.training-btn:disabled ~ .corner-trigger:hover {
  background: #1a1a1a;
  border-color: #333333;
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.training-btn:disabled ~ .corner-trigger:hover .corner-fold {
  color: rgba(255, 255, 255, 0.45);
}

.corner-trigger {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  z-index: 5;
  cursor: pointer;
  border-radius: 50%;
  background: #1a1a1a;
  border: 1px solid #333333;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.corner-trigger:hover {
  background: #ff0a14;
  border-color: #ff0a14;
  transform: scale(1.15);
  box-shadow: 0 3px 16px rgba(255, 10, 20, 0.45);
}

.corner-fold {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.45);
  transition: color 0.3s ease;
  pointer-events: none;
  user-select: none;
  line-height: 1;
  font-weight: 600;
  display: inline-block;
}

.corner-trigger:hover .corner-fold {
  color: #ffffff;
}

.legend-popover {
  position: absolute;
  bottom: calc(100% + 20px);
  width: auto;
  background: #1a1a1a;
  border: 1px solid #333333;
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 10;
  user-select: none;
}

.popover-title {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #ff0a14;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.popover-desc {
  font-size: 0.85rem;
  line-height: 1.5;
  color: #c7cdd8;
  margin: 0;
}

.popover-enter-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.popover-leave-active {
  transition: all 0.15s ease;
}

.popover-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.popover-leave-to {
  opacity: 0;
  transform: translateY(4px);
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

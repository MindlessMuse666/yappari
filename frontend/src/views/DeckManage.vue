<!--
  Страница управления колодой.

  Позволяет просматривать, создавать, редактировать и удалять
  карточки, а также переименовывать или удалять саму колоду
  и сбрасывать прогресс SM-2.
-->

<template>
  <div class="deck-manage">
    <div class="header">
      <button @click="goBack" class="icon-btn" title="Назад">
        <span class="icon">←</span>
      </button>
      <InputText v-model="deckName" @keyup.enter="updateDeckName" placeholder="Название колоды"
        class="deck-name-input" />
      <div class="header-actions">
        <button @click="resetDeckProgress" class="secondary-btn" title="Сбросить прогресс">
          Сбросить
        </button>
        <button @click="deleteDeck" class="danger-btn" title="Удалить колоду">
          Удалить
        </button>
      </div>
    </div>

    <div class="add-card">
      <button @click="openNewCardForm" class="primary-btn">
        <span class="icon">+</span>
        Добавить карточку <kbd class="hotkey-hint">Ctrl Q</kbd>
      </button>
    </div>

    <div v-if="cards.length === 0" class="empty-state">
      <p>В этой колоде пока нет карточек. Добавь первую!</p>
    </div>

    <div v-else class="cards-grid">
      <div v-for="card in cards" :key="card.ID" class="card-item" @click="editCard(card)">
        <div class="card-main">
          <FuriganaText :KanjiText="card.KanjiText" :FuriganaText="card.FuriganaText" />
        </div>
        <div class="card-translation">
          <FuriganaText :KanjiText="card.Translation" Language="ru" />
        </div>
        <button @click.stop="deleteCardById(card.ID)" class="card-delete-btn" title="Удалить">
          ×
        </button>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования карточки -->
    <Dialog v-model:visible="cardFormModalVisible" :header="editingCard ? 'Редактировать карточку' : 'Новая карточка'"
      class="custom-dialog" :closable="false" :draggable="false" @show="focusKanjiInput" @hide="onDialogHide">
      <div class="form-content" :class="{ shake: shake }">
        <div class="input-group">
          <label for="kanji-text">
            Японское слово <span class="required-asterisk">*</span>
          </label>
          <InputText id="kanji-text" v-model="cardForm.KanjiText" placeholder="Введите японское слово"
            class="custom-input" :class="{ 'input-error': errors.kanjiText }" @keyup.enter="saveCard" />
          <div v-if="errors.kanjiText" class="error">{{ errors.kanjiText }}</div>
        </div>
        <div class="input-group">
          <label for="furigana-text">Чтение (фуригана)</label>
          <InputText id="furigana-text" v-model="cardForm.FuriganaText" placeholder="Введите чтение"
            class="custom-input" @keyup.enter="saveCard" />
        </div>
        <div class="input-group">
          <label for="translation">
            Перевод <span class="required-asterisk">*</span>
          </label>
          <InputText id="translation" v-model="cardForm.Translation" placeholder="Введите перевод" class="custom-input"
            :class="{ 'input-error': errors.translation }" @keyup.enter="saveCard" />
          <div v-if="errors.translation" class="error">{{ errors.translation }}</div>
        </div>
      </div>
      <template #footer>
        <Button label="Отмена" @click="closeCardModal" class="secondary-btn" />
        <Button label="Сохранить" @click="saveCard" class="primary-btn" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * Управление колодой: просмотр, создание, редактирование и удаление карточек.
 *
 * @module views/DeckManage
 */

import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import type { Deck, Card, CardInput } from '../types'
import { useWails } from '../composables/useWails'
import { useAlert } from '../composables/useAlert'
import { playClickSound } from '../composables/useSound'
import FuriganaText from '../components/FuriganaText.vue'

const router = useRouter()
const route = useRoute()
const {
  getDecks, getCardsByDeck, updateDeck,
  resetDeckProgress: resetDeckProgressWails,
  deleteDeck: deleteDeckWails,
  createCard: createCardWails,
  updateCard: updateCardWails,
  deleteCard: deleteCardWails,
} = useWails()
const { alert, confirm } = useAlert()

const deckId = Number(route.params.id)
const deckName = ref('')
const cards = ref<Card[]>([])
const cardFormModalVisible = ref(false)
const editingCard = ref<Card | null>(null)
const cardForm = ref({ KanjiText: '', FuriganaText: '', Translation: '' })
const errors = ref({ kanjiText: '', translation: '' })
const shake = ref(false)

/** Загружает данные колоды */
const loadDeck = async () => {
  try {
    const decksList = await getDecks()
    const deck = decksList.find((d: Deck) => d.ID === deckId)
    if (deck) deckName.value = deck.Name
  } catch (e) {
    console.error('Ошибка загрузки колоды:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось загрузить колоду: ' + e, isError: true })
  }
}

/** Загружает карточки колоды */
const loadCards = async () => {
  try {
    cards.value = await getCardsByDeck(deckId)
  } catch (e) {
    console.error('Ошибка загрузки карточек:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось загрузить карточки: ' + e, isError: true })
  }
}

/** Переход на главную */
const goBack = () => {
  playClickSound()
  router.push({ name: 'Home' })
}

/** Открывает форму создания новой карточки со сбросом состояния */
const openNewCardForm = () => {
  playClickSound()
  editingCard.value = null
  cardForm.value = { KanjiText: '', FuriganaText: '', Translation: '' }
  errors.value = { kanjiText: '', translation: '' }
  cardFormModalVisible.value = true
}

/** Сбрасывает состояние при скрытии диалога (Escape, клик вне окна) */
const onDialogHide = () => {
  editingCard.value = null
  cardForm.value = { KanjiText: '', FuriganaText: '', Translation: '' }
  errors.value = { kanjiText: '', translation: '' }
}

/** Escape → на главную (если не открыта модалка карточки) */
const onKeydown = (e: KeyboardEvent) => {
  // Ctrl/Cmd+Q → новая карточка
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyQ') {
    e.preventDefault()
    if (!cardFormModalVisible.value) {
      openNewCardForm()
    }
    return
  }

  if (e.key === 'Escape' && !cardFormModalVisible.value) {
    e.preventDefault()
    goBack()
  }
}

/** Сохраняет новое название колоды по Enter */
const updateDeckName = async () => {
  playClickSound()
  if (!deckName.value.trim()) return
  try {
    await updateDeck(deckId, deckName.value)
  } catch (e) {
    console.error('Ошибка обновления названия:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось обновить название: ' + e, isError: true })
  }
}

/** Сброс прогресса всей колоды (с подтверждением) */
const resetDeckProgress = async () => {
  playClickSound()
  const ok = await confirm({
    title: 'Сброс прогресса',
    message: 'Сбросить прогресс всей колоды?',
    confirmText: 'Сбросить',
    cancelText: 'Отмена',
  })
  if (!ok) return
  try {
    await resetDeckProgressWails(deckId)
    await alert({ title: 'Успешно', message: 'Прогресс успешно сброшен!' })
  } catch (e) {
    console.error('Ошибка сброса прогресса:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось сбросить прогресс: ' + e, isError: true })
  }
}

/** Удаление колоды (с подтверждением) */
const deleteDeck = async () => {
  playClickSound()
  const ok = await confirm({
    title: 'Удаление колоды',
    message: 'Удалить колоду и все карточки? Это действие необратимо.',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
  })
  if (!ok) return
  try {
    await deleteDeckWails(deckId)
    router.push({ name: 'Home' })
  } catch (e) {
    console.error('Ошибка удаления колоды:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось удалить колоду: ' + e, isError: true })
  }
}

/** Анимация встряхивания при ошибке валидации */
const triggerShake = () => {
  shake.value = true
  setTimeout(() => { shake.value = false }, 500)
}

/** Валидация формы карточки */
const validateCardForm = (): boolean => {
  errors.value = { kanjiText: '', translation: '' }
  let valid = true

  if (!cardForm.value.KanjiText.trim()) {
    errors.value.kanjiText = 'Поле не может быть пустым!'
    valid = false
    triggerShake()
  }

  if (!cardForm.value.Translation.trim()) {
    errors.value.translation = 'Поле не может быть пустым!'
    valid = false
    triggerShake()
  }

  return valid
}

/** Ставит каретку в поле «Японское слово» при открытии модалки */
const focusKanjiInput = () => {
  nextTick(() => document.getElementById('kanji-text')?.focus())
}

/** Открывает форму редактирования карточки */
const editCard = (card: Card) => {
  editingCard.value = card
  cardForm.value = {
    KanjiText: card.KanjiText,
    FuriganaText: card.FuriganaText || '',
    Translation: card.Translation,
  }
  cardFormModalVisible.value = true
}

/** Удаление карточки (с подтверждением) */
const deleteCardById = async (id: number) => {
  playClickSound()
  const ok = await confirm({
    title: 'Удаление карточки',
    message: 'Удалить карточку?',
    confirmText: 'Удалить',
    cancelText: 'Отмена',
  })
  if (!ok) return
  try {
    await deleteCardWails(id)
    await loadCards()
  } catch (e) {
    console.error('Ошибка удаления карточки:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось удалить карточку: ' + e, isError: true })
  }
}

/** Сохраняет карточку (создаёт или обновляет) */
const saveCard = async () => {
  playClickSound()
  if (!validateCardForm()) return

  try {
    const input: CardInput = {
      DeckID: deckId,
      KanjiText: cardForm.value.KanjiText,
      FuriganaText: cardForm.value.FuriganaText.trim() || null,
      Translation: cardForm.value.Translation,
    }

    if (editingCard.value) {
      await updateCardWails(editingCard.value.ID, input)
    } else {
      await createCardWails(input)
    }

    closeCardModal()
    await loadCards()
  } catch (e) {
    console.error('Ошибка сохранения карточки:', e)
    await alert({ title: 'Ошибка', message: 'Не удалось сохранить карточку: ' + e, isError: true })
  }
}

/** Закрывает форму и сбрасывает состояние */
const closeCardModal = () => {
  playClickSound()
  cardFormModalVisible.value = false
  editingCard.value = null
  cardForm.value = { KanjiText: '', FuriganaText: '', Translation: '' }
  errors.value = { kanjiText: '', translation: '' }
}

onMounted(async () => {
  document.addEventListener('keydown', onKeydown)
  await loadDeck()
  await loadCards()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('wheel', preventWheel)
})

/** Блокировка прокрутки колёсиком при открытой модалке карточки */
const preventWheel = (e: WheelEvent) => { e.preventDefault() }
watch(cardFormModalVisible, (open) => {
  if (open) {
    document.addEventListener('wheel', preventWheel, { passive: false })
  } else {
    document.removeEventListener('wheel', preventWheel)
  }
})
</script>

<style scoped>
.deck-manage {
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.header {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.deck-name-input {
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: #111111;
  color: white;
  font-family: inherit;
  font-size: 1.1rem;
  font-weight: 600;
  outline: none;
  transition: all 0.2s;
}

:deep(.deck-name-input.p-inputtext) {
  border: 1px solid #c7cdd8;
}

:deep(.deck-name-input.p-inputtext:focus) {
  border-color: #ffffff;
  box-shadow: none;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
}

.add-card {
  margin-bottom: 2rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #c7cdd8;
  font-size: 1.1rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.card-item {
  background: #111111;
  border: 1px solid #222222;
  border-radius: 1rem;
  padding: 1.25rem;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
}

.card-item:hover {
  border-color: #ff0a14;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 10, 20, 0.1);
}

.card-main {
  font-family: 'Noto Sans JP', sans-serif;
  font-size: 1.3rem;
  color: white;
  margin-bottom: 0.5rem;
}

.card-translation {
  color: #c7cdd8;
  font-size: 1rem;
}

.card-delete-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.card-delete-btn:hover {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
}

.form-content {
  padding: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
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
  border-radius: 0.75rem;
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

.icon-btn {
  background: transparent;
  border: 1px solid #333333;
  color: #c7cdd8;
  padding: 0.75rem 0.75rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  text-align: center;
}

.icon-btn:hover {
  background: #1a1a1a;
  border-color: #ff0a14;
  color: #ffffff;
  transform: translateY(-2px);
}

.icon {
  font-size: 1.25rem;
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
  height: 48px;
  text-align: center;
}

.primary-btn:hover {
  background-color: #e00912;
  transform: translateY(-2px);
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
  height: 48px;
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

.danger-btn {
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
  height: 48px;
  text-align: center;
}

.danger-btn:hover {
  background-color: #e00912;
  transform: translateY(-2px);
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

<template>
  <div class="deck-manage">
    <div class="header">
      <button @click="goBack">← Назад</button>
      <InputText v-model="deckName" @keyup.enter="updateDeckName" placeholder="Название колоды" />
      <button @click="resetDeckProgress">Сбросить прогресс</button>
      <button @click="deleteDeck" class="danger">Удалить колоду</button>
    </div>

    <div class="add-card">
      <Button label="Добавить карточку" @click="cardFormModalVisible = true" />
    </div>

    <div v-if="cards.length === 0" class="empty-state">
      <p>В этой колоде пока нет карточек. Добавь первую!</p>
    </div>

    <DataTable v-else :value="cards" paginator :rows="10" class="data-table">
      <Column field="KanjiText" header="Японский" />
      <Column field="Translation" header="Перевод" />
      <Column header="Действия">
        <template #body="slotProps">
          <div class="actions-cell">
            <Button label="Редактировать" size="small" @click="editCard(slotProps.data)" />
            <Button label="Удалить" size="small" @click="deleteCard(slotProps.data.ID)" />
          </div>
        </template>
      </Column>
    </DataTable>

    <Dialog v-model:visible="cardFormModalVisible" :header="editingCard ? 'Редактировать карточку' : 'Новая карточка'">
      <div class="form">
        <label>Японское слово *</label>
        <InputText v-model="cardForm.KanjiText" placeholder="Например: 食べる" />
        <label>Чтение (фуригана)</label>
        <InputText v-model="cardForm.FuriganaText" placeholder="Например: たべる" />
        <label>Перевод *</label>
        <InputText v-model="cardForm.Translation" placeholder="Например: есть" />
      </div>
      <template #footer>
        <Button label="Отмена" @click="cardFormModalVisible = false" />
        <Button label="Сохранить" @click="saveCard" />
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import type { Deck, Card, CardInput } from '../types'
import { useWails } from '../composables/useWails'

const router = useRouter()
const route = useRoute()
const { getDecks, getCardsByDeck, updateDeck, resetDeckProgress: resetDeckProgressWails, deleteDeck: deleteDeckWails, createCard: createCardWails, updateCard: updateCardWails, deleteCard: deleteCardWails } = useWails()
const deckId = Number(route.params.id)
const deckName = ref('')
const cards = ref<Card[]>([])
const cardFormModalVisible = ref(false)
const editingCard = ref<Card | null>(null)
const cardForm = ref({
  KanjiText: '',
  FuriganaText: '',
  Translation: ''
})

onMounted(async () => {
  await loadDeck()
  await loadCards()
})

const loadDeck = async () => {
  try {
    const decksList = await getDecks()
    const deck = decksList.find((d: Deck) => d.ID === deckId)
    if (deck) {
      deckName.value = deck.Name
    }
  } catch (e) {
    console.error('Ошибка загрузки колоды:', e)
    alert('Не удалось загрузить колоду: ' + e)
  }
}

const loadCards = async () => {
  try {
    cards.value = await getCardsByDeck(deckId)
  } catch (e) {
    console.error('Ошибка загрузки карточек:', e)
    alert('Не удалось загрузить карточки: ' + e)
  }
}

const goBack = () => {
  router.push({ name: 'Home' })
}

const updateDeckName = async () => {
  if (!deckName.value.trim()) return
  try {
    await updateDeck(deckId, deckName.value)
  } catch (e) {
    console.error('Ошибка обновления названия:', e)
    alert('Не удалось обновить название: ' + e)
  }
}

const resetDeckProgress = async () => {
  if (!confirm('Сбросить прогресс всей колоды?')) return
  try {
    await resetDeckProgressWails(deckId)
    alert('Прогресс успешно сброшен!')
  } catch (e) {
    console.error('Ошибка сброса прогресса:', e)
    alert('Не удалось сбросить прогресс: ' + e)
  }
}

const deleteDeck = async () => {
  if (!confirm('Удалить колоду и все карточки?')) return
  try {
    await deleteDeckWails(deckId)
    router.push({ name: 'Home' })
  } catch (e) {
    console.error('Ошибка удаления колоды:', e)
    alert('Не удалось удалить колоду: ' + e)
  }
}

const editCard = (card: Card) => {
  editingCard.value = card
  cardForm.value = {
    KanjiText: card.KanjiText,
    FuriganaText: card.FuriganaText || '',
    Translation: card.Translation
  }
  cardFormModalVisible.value = true
}

const deleteCard = async (id: number) => {
  if (!confirm('Удалить карточку?')) return
  try {
    await deleteCardWails(id)
    await loadCards()
  } catch (e) {
    console.error('Ошибка удаления карточки:', e)
    alert('Не удалось удалить карточку: ' + e)
  }
}

const saveCard = async () => {
  if (!cardForm.value.KanjiText.trim() || !cardForm.value.Translation.trim()) {
    alert('Пожалуйста, заполните обязательные поля!')
    return
  }

  try {
    const input: CardInput = {
      DeckID: deckId,
      KanjiText: cardForm.value.KanjiText,
      FuriganaText: cardForm.value.FuriganaText.trim() || null,
      Translation: cardForm.value.Translation
    }

    if (editingCard.value) {
      await updateCardWails(editingCard.value.ID, input)
    } else {
      await createCardWails(input)
    }

    cardFormModalVisible.value = false
    editingCard.value = null
    cardForm.value = { KanjiText: '', FuriganaText: '', Translation: '' }
    await loadCards()
  } catch (e) {
    console.error('Ошибка сохранения карточки:', e)
    alert('Не удалось сохранить карточку: ' + e)
  }
}
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

.header button {
  white-space: nowrap;
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

.data-table {
  border-radius: 0.75rem;
  overflow: hidden;
}

.actions-cell {
  display: flex;
  gap: 0.5rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form label {
  font-size: 0.9rem;
  color: #c7cdd8;
  margin-bottom: 0.25rem;
}

.danger {
  background-color: #ff4444 !important;
}
</style>

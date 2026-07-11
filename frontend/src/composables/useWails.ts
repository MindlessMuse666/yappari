/**
 * Адаптер для обратной совместимости с useWails.
 *
 * В веб-версии просто реэкспортирует API-методы из useApi.ts.
 * Тот же публичный интерфейс — вьюхи не требуют изменений.
 *
 * @module composables/useWails
 */

import { useApi } from './useApi'

/** В веб-версии Wails-окружения нет */
export const isWails = false

export function useWails() {
  const api = useApi()

  return {
    isWails,
    getDecks: api.getDecks,
    createDeck: api.createDeck,
    updateDeck: api.updateDeck,
    deleteDeck: api.deleteDeck,
    getCardsByDeck: api.getCardsByDeck,
    createCard: api.createCard,
    updateCard: api.updateCard,
    deleteCard: api.deleteCard,
    getTrainingCards: api.getTrainingCards,
    submitReview: api.submitReview,
    resetCardProgress: api.resetCardProgress,
    resetDeckProgress: api.resetDeckProgress,
  }
}

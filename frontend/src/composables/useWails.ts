/**
 * Композабл для IPC-взаимодействия с Go-бэкендом через Wails.
 *
 * Единая точка доступа к методам бэкенда. Все методы типизированы
 * и возвращают Promise. В режиме разработки (без Wails) используются
 * мок-данные.
 *
 * Мок-импорты обёрнуты в `import.meta.env.DEV` — при production-сборке
 * Vite tree-shaken весь блок, и файл `../mocks/data` не попадает в бандл.
 *
 * @module composables/useWails
 */

import type { Deck, Card, CardInput, TrainingCard } from '../types'

/**
 * Флаг: запущены ли мы в среде Wails.
 * Определяется по наличию глобального объекта `window.go.main.App`.
 */
const isWails = typeof window !== 'undefined' && window.go?.main?.App != null

/**
 * Загружает мок-данные колод для разработки.
 * В production-сборке этот блок tree-shaken.
 */
async function getMockDecks(): Promise<Deck[]> {
  if (import.meta.env.DEV) {
    const { mockDecks } = await import('../mocks/data')
    return mockDecks
  }
  return []
}

/**
 * Загружает мок-данные карточек для разработки.
 * В production-сборке этот блок tree-shaken.
 */
async function getMockCards(): Promise<Card[]> {
  if (import.meta.env.DEV) {
    const { mockCards } = await import('../mocks/data')
    return mockCards
  }
  return []
}

/**
 * Возвращает объект с методами для работы с бэкендом.
 *
 * Каждый метод проверяет наличие Wails и вызывает соответствующий
 * IPC-метод, либо использует мок-данные в режиме разработки.
 */
export function useWails() {
  /**
   * Загружает список всех колод.
   */
  const getDecks = async (): Promise<Deck[]> => {
    if (isWails) return window.go!.main.App.GetDecks()
    console.warn('Wails not available, using mock data')
    return getMockDecks()
  }

  /**
   * Создаёт новую колоду.
   * @param name - название колоды
   */
  const createDeck = async (name: string): Promise<Deck> => {
    if (isWails) return window.go!.main.App.CreateDeck(name)
    const decks = await getMockDecks()
    const newDeck: Deck = {
      ID: Date.now(), Name: name, CreatedAt: new Date().toISOString(),
    }
    decks.unshift(newDeck)
    return newDeck
  }

  /**
   * Обновляет название колоды.
   * @param id - ID колоды
   * @param name - новое название
   */
  const updateDeck = async (id: number, name: string): Promise<void> => {
    if (isWails) return window.go!.main.App.UpdateDeck(id, name)
    const decks = await getMockDecks()
    const deck = decks.find(d => d.ID === id)
    if (deck) deck.Name = name
  }

  /**
   * Удаляет колоду и все её карточки.
   * @param id - ID колоды
   */
  const deleteDeck = async (id: number): Promise<void> => {
    if (isWails) return window.go!.main.App.DeleteDeck(id)
    const decks = await getMockDecks()
    const index = decks.findIndex(d => d.ID === id)
    if (index > -1) decks.splice(index, 1)
  }

  /**
   * Загружает все карточки указанной колоды.
   * @param deckId - ID колоды
   */
  const getCardsByDeck = async (deckId: number): Promise<Card[]> => {
    if (isWails) return window.go!.main.App.GetCardsByDeck(deckId)
    const cards = await getMockCards()
    return cards.filter(c => c.DeckID === deckId)
  }

  /**
   * Создаёт новую карточку в колоде.
   * @param input - данные карточки
   */
  const createCard = async (input: CardInput): Promise<Card> => {
    if (isWails) return window.go!.main.App.CreateCard(input)
    const cards = await getMockCards()
    const newCard: Card = {
      ID: Date.now(), DeckID: input.DeckID,
      KanjiText: input.KanjiText, FuriganaText: input.FuriganaText,
      Translation: input.Translation,
      EaseFactor: 2.5, Interval: 0, Repetitions: 0,
      NextReview: new Date().toISOString(),
      CreatedAt: new Date().toISOString(), UpdatedAt: new Date().toISOString(),
    }
    cards.push(newCard)
    return newCard
  }

  /**
   * Обновляет данные карточки.
   * @param id - ID карточки
   * @param input - новые данные
   */
  const updateCard = async (id: number, input: CardInput): Promise<void> => {
    if (isWails) return window.go!.main.App.UpdateCard(id, input)
    const cards = await getMockCards()
    const card = cards.find(c => c.ID === id)
    if (card) {
      card.KanjiText = input.KanjiText
      card.FuriganaText = input.FuriganaText
      card.Translation = input.Translation
    }
  }

  /**
   * Удаляет карточку.
   * @param id - ID карточки
   */
  const deleteCard = async (id: number): Promise<void> => {
    if (isWails) return window.go!.main.App.DeleteCard(id)
    const cards = await getMockCards()
    const index = cards.findIndex(c => c.ID === id)
    if (index > -1) cards.splice(index, 1)
  }

  /**
   * Загружает карточки для тренировки по указанному режиму.
   *
   * Режимы:
   * - `interval` — только карточки с next_review <= now()
   * - `normal` / `free` — все карточки из выбранных колод
   *
   * @param mode - режим тренировки
   * @param deckIDs - список ID колод
   */
  const getTrainingCards = async (mode: string, deckIDs: number[]): Promise<TrainingCard[]> => {
    if (isWails) return window.go!.main.App.GetTrainingCards(mode, deckIDs)
    const cards = await getMockCards()
    return cards.filter(c => deckIDs.includes(c.DeckID)).map(c => ({
      ID: c.ID, KanjiText: c.KanjiText,
      FuriganaText: c.FuriganaText, Translation: c.Translation,
    }))
  }

  /**
   * Отправляет оценку повторения (SM-2) для карточки.
   *
   * Работает только в режиме `interval`.
   * Grade: 0 (повторить), 3 (трудно), 4 (хорошо), 5 (легко).
   *
   * @param cardID - ID карточки
   * @param grade - оценка от 0 до 5
   */
  const submitReview = async (cardID: number, grade: number): Promise<Card> => {
    if (isWails) return window.go!.main.App.SubmitReview(cardID, grade)
    const cards = await getMockCards()
    const card = cards.find(c => c.ID === cardID)
    if (card) return card
    throw new Error('Card not found')
  }

  /**
   * Сбрасывает прогресс SM-2 для одной карточки.
   * @param cardID - ID карточки
   */
  const resetCardProgress = async (cardID: number): Promise<void> => {
    if (isWails) return window.go!.main.App.ResetCardProgress(cardID)
  }

  /**
   * Сбрасывает прогресс SM-2 для всех карточек колоды.
   * @param deckID - ID колоды
   */
  const resetDeckProgress = async (deckID: number): Promise<void> => {
    if (isWails) return window.go!.main.App.ResetDeckProgress(deckID)
  }

  return {
    isWails,
    getDecks,
    createDeck,
    updateDeck,
    deleteDeck,
    getCardsByDeck,
    createCard,
    updateCard,
    deleteCard,
    getTrainingCards,
    submitReview,
    resetCardProgress,
    resetDeckProgress,
  }
}

import type { Deck, Card, CardInput, TrainingCard, VoiceStatus } from '../types'

// Mock data for development without Wails
const mockDecks: Deck[] = [
  { ID: 1, Name: 'Базовые слова', CreatedAt: new Date().toISOString() },
  { ID: 2, Name: 'Глаголы', CreatedAt: new Date().toISOString() },
]

const mockCards: Card[] = [
  {
    ID: 1,
    DeckID: 1,
    KanjiText: '食べる',
    FuriganaText: 'たべる',
    Translation: 'есть',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 2,
    DeckID: 1,
    KanjiText: '飲む',
    FuriganaText: 'のむ',
    Translation: 'пить',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
]

// Check if we're running in Wails environment
const isWails = typeof window !== 'undefined' && window.go?.main?.App != null

export function useWails() {
  const getDecks = async (): Promise<Deck[]> => {
    if (isWails) {
      return window.go!.main.App.GetDecks()
    }
    console.warn('Wails not available, using mock data')
    return mockDecks
  }

  const createDeck = async (name: string): Promise<Deck> => {
    if (isWails) {
      return window.go!.main.App.CreateDeck(name)
    }
    const newDeck: Deck = {
      ID: Date.now(),
      Name: name,
      CreatedAt: new Date().toISOString(),
    }
    mockDecks.unshift(newDeck)
    return newDeck
  }

  const updateDeck = async (id: number, name: string): Promise<void> => {
    if (isWails) {
      return window.go!.main.App.UpdateDeck(id, name)
    }
    const deck = mockDecks.find(d => d.ID === id)
    if (deck) deck.Name = name
  }

  const deleteDeck = async (id: number): Promise<void> => {
    if (isWails) {
      return window.go!.main.App.DeleteDeck(id)
    }
    const index = mockDecks.findIndex(d => d.ID === id)
    if (index > -1) mockDecks.splice(index, 1)
  }

  const getCardsByDeck = async (deckId: number): Promise<Card[]> => {
    if (isWails) {
      return window.go!.main.App.GetCardsByDeck(deckId)
    }
    return mockCards.filter(c => c.DeckID === deckId)
  }

  const createCard = async (input: CardInput): Promise<Card> => {
    if (isWails) {
      return window.go!.main.App.CreateCard(input)
    }
    const newCard: Card = {
      ID: Date.now(),
      DeckID: input.DeckID,
      KanjiText: input.KanjiText,
      FuriganaText: input.FuriganaText,
      Translation: input.Translation,
      EaseFactor: 2.5,
      Interval: 0,
      Repetitions: 0,
      NextReview: new Date().toISOString(),
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    }
    mockCards.push(newCard)
    return newCard
  }

  const updateCard = async (id: number, input: CardInput): Promise<void> => {
    if (isWails) {
      return window.go!.main.App.UpdateCard(id, input)
    }
    const card = mockCards.find(c => c.ID === id)
    if (card) {
      card.KanjiText = input.KanjiText
      card.FuriganaText = input.FuriganaText
      card.Translation = input.Translation
    }
  }

  const deleteCard = async (id: number): Promise<void> => {
    if (isWails) {
      return window.go!.main.App.DeleteCard(id)
    }
    const index = mockCards.findIndex(c => c.ID === id)
    if (index > -1) mockCards.splice(index, 1)
  }

  const getTrainingCards = async (mode: string, deckIDs: number[]): Promise<TrainingCard[]> => {
    if (isWails) {
      return window.go!.main.App.GetTrainingCards(mode, deckIDs)
    }
    return mockCards.filter(c => deckIDs.includes(c.DeckID)).map(c => ({
      ID: c.ID,
      KanjiText: c.KanjiText,
      FuriganaText: c.FuriganaText,
      Translation: c.Translation,
    }))
  }

  const submitReview = async (cardID: number, grade: number): Promise<Card> => {
    if (isWails) {
      return window.go!.main.App.SubmitReview(cardID, grade)
    }
    const card = mockCards.find(c => c.ID === cardID)
    if (card) return card
    throw new Error('Card not found')
  }

  const resetCardProgress = async (cardID: number): Promise<void> => {
    if (isWails) {
      return window.go!.main.App.ResetCardProgress(cardID)
    }
  }

  const resetDeckProgress = async (deckID: number): Promise<void> => {
    if (isWails) {
      return window.go!.main.App.ResetDeckProgress(deckID)
    }
  }

  const checkVoicesAvailability = async (): Promise<VoiceStatus> => {
    if (isWails) {
      return window.go!.main.App.CheckVoicesAvailability()
    }
    return { Ja: true, Ru: true }
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
    checkVoicesAvailability,
  }
}

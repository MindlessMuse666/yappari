/**
 * Композабл для API-взаимодействия с Go-бэкендом через HTTP.
 *
 * Замена useWails.ts для веб-версии. Тот же публичный интерфейс,
 * но вместо Wails IPC используется fetch('/api/...') с JWT-токеном.
 *
 * В DEV-режиме продолжает использовать мок-данные (как и было в useWails.ts).
 *
 * @module composables/useApi
 */

import type { Deck, Card, CardInput, TrainingCard } from '../types'
import { useAuth } from './useAuth'

/**
 * Базовый URL для API-запросов.
 * В production — пустая строка (тот же origin), в dev — проксируется Vite.
 */
const API_BASE = ''

/**
 * Флаг dev-режима: в нём используем мок-данные.
 */
const isDev = import.meta.env.DEV

/**
 * Выполняет fetch-запрос с авторизацией.
 */
async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = useAuth()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  const token = auth.getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    // Токен просрочен — чистим и редирект на логин
    auth.logout()
    window.location.href = '/login'
    throw new Error('Сессия истекла')
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `HTTP ${response.status}`)
  }

  // Для 204 No Content
  if (response.status === 204) return undefined as T

  return response.json()
}

/**
 * Загружает мок-данные колод для разработки.
 * В production-сборке этот блок tree-shaken.
 */
async function getMockDecks(): Promise<Deck[]> {
  if (isDev) {
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
  if (isDev) {
    const { mockCards } = await import('../mocks/data')
    return mockCards
  }
  return []
}

/**
 * Возвращает объект с методами для работы с бэкендом.
 */
export function useApi() {
  const getDecks = async (): Promise<Deck[]> => {
    if (isDev) {
      console.warn('DEV mode, using mock data')
      return getMockDecks()
    }
    return apiFetch<Deck[]>('/api/decks')
  }

  const createDeck = async (name: string): Promise<Deck> => {
    if (isDev) {
      const decks = await getMockDecks()
      const newDeck: Deck = {
        ID: Date.now(), Name: name, CreatedAt: new Date().toISOString(),
      }
      decks.unshift(newDeck)
      return newDeck
    }
    return apiFetch<Deck>('/api/decks', {
      method: 'POST',
      body: JSON.stringify({ name }),
    })
  }

  const updateDeck = async (id: number, name: string): Promise<void> => {
    if (isDev) {
      const decks = await getMockDecks()
      const deck = decks.find(d => d.ID === id)
      if (deck) deck.Name = name
      return
    }
    await apiFetch<void>(`/api/decks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    })
  }

  const deleteDeck = async (id: number): Promise<void> => {
    if (isDev) {
      const decks = await getMockDecks()
      const index = decks.findIndex(d => d.ID === id)
      if (index > -1) decks.splice(index, 1)
      return
    }
    await apiFetch<void>(`/api/decks/${id}`, { method: 'DELETE' })
  }

  const getCardsByDeck = async (deckId: number): Promise<Card[]> => {
    if (isDev) {
      const cards = await getMockCards()
      return cards.filter(c => c.DeckID === deckId)
    }
    return apiFetch<Card[]>(`/api/decks/${deckId}/cards`)
  }

  const createCard = async (input: CardInput): Promise<Card> => {
    if (isDev) {
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
    return apiFetch<Card>(`/api/decks/${input.DeckID}/cards`, {
      method: 'POST',
      body: JSON.stringify({
        kanji_text: input.KanjiText,
        furigana_text: input.FuriganaText,
        translation: input.Translation,
      }),
    })
  }

  const updateCard = async (id: number, input: CardInput): Promise<void> => {
    if (isDev) {
      const cards = await getMockCards()
      const card = cards.find(c => c.ID === id)
      if (card) {
        card.KanjiText = input.KanjiText
        card.FuriganaText = input.FuriganaText
        card.Translation = input.Translation
      }
      return
    }
    await apiFetch<void>(`/api/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        DeckID: input.DeckID,
        KanjiText: input.KanjiText,
        FuriganaText: input.FuriganaText,
        Translation: input.Translation,
      }),
    })
  }

  const deleteCard = async (id: number): Promise<void> => {
    if (isDev) {
      const cards = await getMockCards()
      const index = cards.findIndex(c => c.ID === id)
      if (index > -1) cards.splice(index, 1)
      return
    }
    await apiFetch<void>(`/api/cards/${id}`, { method: 'DELETE' })
  }

  const getTrainingCards = async (mode: string, deckIDs: number[]): Promise<TrainingCard[]> => {
    if (isDev) {
      const cards = await getMockCards()
      return cards.filter(c => deckIDs.includes(c.DeckID)).map(c => ({
        ID: c.ID, KanjiText: c.KanjiText,
        FuriganaText: c.FuriganaText, Translation: c.Translation,
      }))
    }
    const query = `mode=${mode}&deck_ids=${deckIDs.join(',')}`
    return apiFetch<TrainingCard[]>(`/api/training?${query}`)
  }

  const submitReview = async (cardID: number, grade: number): Promise<Card> => {
    if (isDev) {
      const cards = await getMockCards()
      const card = cards.find(c => c.ID === cardID)
      if (card) return card
      throw new Error('Card not found')
    }
    return apiFetch<Card>('/api/training/review', {
      method: 'POST',
      body: JSON.stringify({ card_id: cardID, grade }),
    })
  }

  const resetCardProgress = async (cardID: number): Promise<void> => {
    if (isDev) return
    await apiFetch<void>(`/api/training/reset-card/${cardID}`, { method: 'POST' })
  }

  const resetDeckProgress = async (deckID: number): Promise<void> => {
    if (isDev) return
    await apiFetch<void>(`/api/training/reset-deck/${deckID}`, { method: 'POST' })
  }

  return {
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

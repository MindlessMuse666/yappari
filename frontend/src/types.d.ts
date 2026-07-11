/**
 * Глобальные типы и интерфейсы данных Yappari.
 *
 * Содержит описание структур данных, передаваемых между
 * фронтендом и бэкендом через Wails IPC.
 *
 * @module types
 */

/** Колода карточек */
export interface Deck {
  ID: number
  Name: string
  CreatedAt: string
}

/** Карточка с полным набором полей SM-2 */
export interface Card {
  ID: number
  DeckID: number
  KanjiText: string
  FuriganaText?: string | null
  Translation: string
  EaseFactor: number
  Interval: number
  Repetitions: number
  NextReview: string
  LastReview?: string | null
  CreatedAt: string
  UpdatedAt: string
}

/** Входные данные для создания/редактирования карточки */
export interface CardInput {
  DeckID: number
  KanjiText: string
  FuriganaText?: string | null
  Translation: string
}

/** Карточка для тренировки (без SM-2 полей) */
export interface TrainingCard {
  ID: number
  KanjiText: string
  FuriganaText?: string | null
  Translation: string
}

/** Статус доступности голосов TTS */
export interface VoiceStatus {
  Ja: boolean
  Ru: boolean
}

/** Тип expose-методов компонента CustomAlert */
export interface CustomAlertExposed {
  show: (params: { title?: string; message: string; buttonText?: string; isError?: boolean }) => Promise<void>
  confirm: (params: { title?: string; message: string; confirmText?: string; cancelText?: string }) => Promise<boolean>
}

/**
 * Глобальная декларация Wails IPC.
 *
 * Все методы бэкенда, экспортируемые через Wails, доступны
 * через `window.go.main.App.*`.
 */
declare global {
  interface Window {
    go: {
      main: {
        App: {
          GetDecks: () => Promise<Deck[]>
          CreateDeck: (name: string) => Promise<Deck>
          UpdateDeck: (id: number, name: string) => Promise<void>
          DeleteDeck: (id: number) => Promise<void>
          GetCardsByDeck: (deckId: number) => Promise<Card[]>
          CreateCard: (input: CardInput) => Promise<Card>
          UpdateCard: (id: number, input: CardInput) => Promise<void>
          DeleteCard: (id: number) => Promise<void>
          GetTrainingCards: (mode: string, deckIds: number[]) => Promise<TrainingCard[]>
          SubmitReview: (cardId: number, grade: number) => Promise<Card>
          ResetCardProgress: (cardId: number) => Promise<void>
          ResetDeckProgress: (deckId: number) => Promise<void>
          CheckVoicesAvailability: () => Promise<VoiceStatus>
          SpeakText: (text: string, lang: string) => Promise<{ audio: string; mime: string }>
          CheckTTSAvailability: () => Promise<{ available: boolean; message: string; status: number }>
        }
      }
    }
  }
}

export {}

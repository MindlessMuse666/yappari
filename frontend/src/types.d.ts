/**
 * Глобальные типы и интерфейсы данных Yappari.
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
  /** Какой бэкенд используется для синтеза */
  backend?: 'webspeech' | 'google' | 'none'
}

/** Тип expose-методов компонента CustomAlert */
export interface CustomAlertExposed {
  show: (params: { title?: string; message: string; buttonText?: string; isError?: boolean }) => Promise<void>
  confirm: (params: { title?: string; message: string; confirmText?: string; cancelText?: string }) => Promise<boolean>
}

export {}

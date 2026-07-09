export interface Deck {
  ID: number
  Name: string
  CreatedAt: string
}

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

export interface CardInput {
  DeckID: number
  KanjiText: string
  FuriganaText?: string | null
  Translation: string
}

export interface TrainingCard {
  ID: number
  KanjiText: string
  FuriganaText?: string | null
  Translation: string
}

export interface VoiceStatus {
  Ja: boolean
  Ru: boolean
}

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
        }
      }
    }
  }
}

export {}

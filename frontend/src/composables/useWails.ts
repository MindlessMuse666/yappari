import type { Deck, Card, CardInput, TrainingCard, VoiceStatus } from '../types'

// Mock data for development without Wails
const mockDecks: Deck[] = [
  { ID: 1, Name: 'Базовые слова', CreatedAt: new Date().toISOString() },
  { ID: 2, Name: 'Глаголы', CreatedAt: new Date().toISOString() },
  { ID: 3, Name: 'Прилагательные', CreatedAt: new Date().toISOString() },
  { ID: 4, Name: 'Числа', CreatedAt: new Date().toISOString() },
  { ID: 5, Name: 'Фразы для приветствия', CreatedAt: new Date().toISOString() },
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
  {
    ID: 3,
    DeckID: 1,
    KanjiText: '本',
    FuriganaText: 'ほん',
    Translation: 'книга',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 4,
    DeckID: 1,
    KanjiText: '人',
    FuriganaText: 'ひと',
    Translation: 'человек',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 5,
    DeckID: 1,
    KanjiText: '日',
    FuriganaText: 'ひ',
    Translation: 'день',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 21,
    DeckID: 1,
    KanjiText: '月',
    FuriganaText: 'つき',
    Translation: 'луна, месяц',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 22,
    DeckID: 1,
    KanjiText: '山',
    FuriganaText: 'やま',
    Translation: 'гора',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 23,
    DeckID: 1,
    KanjiText: '川',
    FuriganaText: 'かわ',
    Translation: 'река',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 24,
    DeckID: 1,
    KanjiText: '花',
    FuriganaText: 'はな',
    Translation: 'цветок',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 25,
    DeckID: 1,
    KanjiText: '木',
    FuriganaText: 'き',
    Translation: 'дерево',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 26,
    DeckID: 1,
    KanjiText: '水',
    FuriganaText: 'みず',
    Translation: 'вода',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 27,
    DeckID: 1,
    KanjiText: '火',
    FuriganaText: 'ひ',
    Translation: 'огонь',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 28,
    DeckID: 1,
    KanjiText: '田',
    FuriganaText: 'た',
    Translation: 'поле (риса)',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 29,
    DeckID: 1,
    KanjiText: '道',
    FuriganaText: 'みち',
    Translation: 'дорога',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 30,
    DeckID: 1,
    KanjiText: '門',
    FuriganaText: 'もん',
    Translation: 'ворота',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 31,
    DeckID: 1,
    KanjiText: '目',
    FuriganaText: 'め',
    Translation: 'глаз',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 32,
    DeckID: 1,
    KanjiText: '耳',
    FuriganaText: 'みみ',
    Translation: 'ухо',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 33,
    DeckID: 1,
    KanjiText: '口',
    FuriganaText: 'くち',
    Translation: 'рот',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 34,
    DeckID: 1,
    KanjiText: '手',
    FuriganaText: 'て',
    Translation: 'рука',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 35,
    DeckID: 1,
    KanjiText: '足',
    FuriganaText: 'あし',
    Translation: 'нога',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 36,
    DeckID: 1,
    KanjiText: '犬',
    FuriganaText: 'いぬ',
    Translation: 'собака',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 37,
    DeckID: 1,
    KanjiText: '猫',
    FuriganaText: 'ねこ',
    Translation: 'кошка',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 38,
    DeckID: 1,
    KanjiText: '鳥',
    FuriganaText: 'とり',
    Translation: 'птица',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 39,
    DeckID: 1,
    KanjiText: '魚',
    FuriganaText: 'さかな',
    Translation: 'рыба',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 40,
    DeckID: 1,
    KanjiText: '虫',
    FuriganaText: 'むし',
    Translation: 'насекомое',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 6,
    DeckID: 2,
    KanjiText: '行く',
    FuriganaText: 'いく',
    Translation: 'идти',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 7,
    DeckID: 2,
    KanjiText: '来る',
    FuriganaText: 'くる',
    Translation: 'приходить',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 8,
    DeckID: 2,
    KanjiText: '話す',
    FuriganaText: 'はなす',
    Translation: 'говорить',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 9,
    DeckID: 2,
    KanjiText: '聞く',
    FuriganaText: 'きく',
    Translation: 'слушать',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 10,
    DeckID: 3,
    KanjiText: '大きい',
    FuriganaText: 'おおきい',
    Translation: 'большой',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 11,
    DeckID: 3,
    KanjiText: '小さい',
    FuriganaText: 'ちいさい',
    Translation: 'маленький',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 12,
    DeckID: 3,
    KanjiText: '新しい',
    FuriganaText: 'あたらしい',
    Translation: 'новый',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 13,
    DeckID: 4,
    KanjiText: '一',
    FuriganaText: 'いち',
    Translation: 'один',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 14,
    DeckID: 4,
    KanjiText: '二',
    FuriganaText: 'に',
    Translation: 'два',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 15,
    DeckID: 4,
    KanjiText: '三',
    FuriganaText: 'さん',
    Translation: 'три',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 16,
    DeckID: 4,
    KanjiText: '四',
    FuriganaText: 'し',
    Translation: 'четыре',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 17,
    DeckID: 4,
    KanjiText: '五',
    FuriganaText: 'ご',
    Translation: 'пять',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 18,
    DeckID: 5,
    KanjiText: 'こんにちは',
    FuriganaText: null,
    Translation: 'привет (день)',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 19,
    DeckID: 5,
    KanjiText: 'おはよう',
    FuriganaText: null,
    Translation: 'доброе утро',
    EaseFactor: 2.5,
    Interval: 0,
    Repetitions: 0,
    NextReview: new Date().toISOString(),
    CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 20,
    DeckID: 5,
    KanjiText: 'さようなら',
    FuriganaText: null,
    Translation: 'до свидания',
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
    // Реальная проверка голосов через Web Speech API
    const voices = await loadVoices()
    const jaVoice = voices.some(v => v.lang.startsWith('ja'))
    const ruVoice = voices.some(v => v.lang.startsWith('ru'))
    return { Ja: jaVoice, Ru: ruVoice }
  }

  // Web Speech API: загружаем голоса (на Chrome список приходит асинхронно)
  const loadVoices = (): Promise<SpeechSynthesisVoice[]> => {
    return new Promise((resolve) => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        resolve(voices)
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices())
        }
        // Таймаут на случай, если voiceschanged не сработает
        setTimeout(() => resolve(window.speechSynthesis.getVoices() || []), 3000)
      }
    })
  }

  // Web Speech API: найти голос, подходящий под язык
  const findVoice = (voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined => {
    // Сначала точное совпадение (ja-JP)
    let voice = voices.find(v => v.lang === lang)
    if (voice) return voice
    // Затем по префиксу языка (ja)
    const prefix = lang.split('-')[0]
    voice = voices.find(v => v.lang.startsWith(prefix))
    if (voice) return voice
    // Любой голос, который содержит упоминание языка
    return voices.find(v => v.lang && v.lang.toLowerCase().includes(prefix))
  }

  // Web Speech API: произнести текст без указания голоса (системный умолчание)
  const speakWithDefaultVoice = (text: string, lang: string): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = lang
        utterance.rate = 0.9
        utterance.onend = () => resolve('')
        utterance.onerror = () => resolve('')
        window.speechSynthesis.speak(utterance)
      } catch {
        resolve('')
      }
    })
  }

  // Google Translate TTS как запасной вариант для Web Speech API
  const speakWithGoogleTTS = async (text: string, lang: string): Promise<string> => {
    const tl = lang.split('-')[0]
    const url = `https://translate.googleapis.com/translate_tts?ie=UTF-8&tl=${tl}&client=tw-ob&q=${encodeURIComponent(text)}`

    // Стратегия 1: fetch + blob (позволяет установить Referer и обойти CORS)
    try {
      const response = await fetch(url, {
        headers: { 'Referer': 'https://translate.google.com' },
      })
      if (response.ok) {
        // Google возвращает аудио — проверяем content-type или что размер > 0
        const blob = await response.blob()
        if (blob.size > 500) {
          const blobUrl = URL.createObjectURL(blob)
          return new Promise<string>((resolve) => {
            const audio = new Audio()
            audio.src = blobUrl
            audio.volume = 1
            audio.onended = () => { URL.revokeObjectURL(blobUrl); resolve('ok') }
            audio.onerror = () => { URL.revokeObjectURL(blobUrl); resolve('') }
            audio.play().catch(() => { URL.revokeObjectURL(blobUrl); resolve('') })
          })
        }
      }
    } catch (e) {
      console.warn('Google TTS fetch error, trying direct audio:', e)
    }

    // Стратегия 2: прямая установка src на <audio> (работает в некоторых браузерах)
    try {
      const audio = new Audio(url)
      audio.volume = 1
      return new Promise<string>((resolve) => {
        audio.onended = () => resolve('ok')
        audio.onerror = (e) => {
          console.error(`Google TTS direct error for ${lang}:`, e)
          resolve('')
        }
        audio.play().catch((e) => {
          console.error(`Google TTS play error for ${lang}:`, e)
          resolve('')
        })
      })
    } catch (e) {
      console.error('Google TTS critical error:', e)
      return ''
    }
  }

  const speakText = async (text: string, lang: string): Promise<string> => {
    if (isWails) {
      return window.go!.main.App.SpeakText(text, lang)
    }
    // Web Speech API fallback для разработки без Wails
    try {
      if (!window.speechSynthesis) {
        console.warn('Web Speech API недоступен')
        return ''
      }

      // Отменяем предыдущую озвучку (Chrome иногда зависает в состоянии "paused")
      window.speechSynthesis.cancel()

      // Загружаем голоса и находим подходящий
      const voices = await loadVoices()
      const voice = findVoice(voices, lang)

      if (voice) {
        // Голос найден — используем Web Speech API
        return new Promise<string>((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.lang = lang
          utterance.rate = 0.9
          utterance.voice = voice

          utterance.onend = () => resolve('')
          utterance.onerror = (e) => {
            console.error(`Web Speech API ошибка для ${lang}:`, e)
            resolve('')
          }
          window.speechSynthesis.speak(utterance)
        })
      }

      // Голос не найден — пробуем запасные способы
      console.warn(`Голос для языка ${lang} не найден. Пробуем запасные способы...`)
      console.warn(`Доступные голоса:`, voices.map(v => `${v.lang} - ${v.name}`).join(', '))

      // Запасной способ 1: Google TTS через <audio> (обход Web Speech API)
      const ok = await speakWithGoogleTTS(text, lang)
      if (ok) {
        // Google TTS воспроизвёл через <audio>, возвращаем '' (playAudio пропустит)
        return ''
      }

      // Запасной способ 2: Web Speech API без указания конкретного голоса
      console.warn(`Google TTS не сработал для ${lang}, пробуем Web Speech API без голоса...`)
      await speakWithDefaultVoice(text, lang)
      return ''
    } catch (e) {
      console.error(`speakText критическая ошибка для ${lang}:`, e)
      return ''
    }
  }

  const checkEdgeTTS = async (): Promise<{ available: boolean; message: string }> => {
    if (isWails) {
      return window.go!.main.App.CheckEdgeTTSAvailability()
    }
    return { available: false, message: 'Режим разработки (без Wails)' }
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
    speakText,
    checkEdgeTTS,
  }
}

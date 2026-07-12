/**
 * Мок-данные для разработки без Wails.
 *
 * Предоставляет тестовые наборы колод и карточек для
 * быстрой разработки и отладки фронтенда без сборки Wails.
 *
 * @module mocks/data
 */

import type { Deck, Card } from '../types'

/** Тестовый набор колод */
export const mockDecks: Deck[] = [
  { ID: 1, Name: 'Базовые слова', CreatedAt: new Date().toISOString() },
  { ID: 2, Name: 'Глаголы', CreatedAt: new Date().toISOString() },
  { ID: 3, Name: 'Прилагательные', CreatedAt: new Date().toISOString() },
  { ID: 4, Name: 'Числа', CreatedAt: new Date().toISOString() },
  { ID: 5, Name: 'Фразы для приветствия', CreatedAt: new Date().toISOString() },
]

/** Тестовый набор карточек */
export const mockCards: Card[] = [
  {
    ID: 1, DeckID: 1, KanjiText: '食べる', KanaText: 'たべる',
    Translation: 'есть', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 2, DeckID: 1, KanjiText: '飲む', KanaText: 'のむ',
    Translation: 'пить', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 3, DeckID: 1, KanjiText: '本', KanaText: 'ほん',
    Translation: 'книга', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 4, DeckID: 1, KanjiText: '人', KanaText: 'ひと',
    Translation: 'человек', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 5, DeckID: 1, KanjiText: '日', KanaText: 'ひ',
    Translation: 'день', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 21, DeckID: 1, KanjiText: '月', KanaText: 'つき',
    Translation: 'луна, месяц', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 22, DeckID: 1, KanjiText: '山', KanaText: 'やま',
    Translation: 'гора', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 23, DeckID: 1, KanjiText: '川', KanaText: 'かわ',
    Translation: 'река', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 24, DeckID: 1, KanjiText: '花', KanaText: 'はな',
    Translation: 'цветок', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 25, DeckID: 1, KanjiText: '木', KanaText: 'き',
    Translation: 'дерево', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 26, DeckID: 1, KanjiText: '水', KanaText: 'みず',
    Translation: 'вода', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 27, DeckID: 1, KanjiText: '火', KanaText: 'ひ',
    Translation: 'огонь', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 28, DeckID: 1, KanjiText: '田', KanaText: 'た',
    Translation: 'поле (риса)', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 29, DeckID: 1, KanjiText: '道', KanaText: 'みち',
    Translation: 'дорога', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 30, DeckID: 1, KanjiText: '門', KanaText: 'もん',
    Translation: 'ворота', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 31, DeckID: 1, KanjiText: '目', KanaText: 'め',
    Translation: 'глаз', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 32, DeckID: 1, KanjiText: '耳', KanaText: 'みみ',
    Translation: 'ухо', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 33, DeckID: 1, KanjiText: '口', KanaText: 'くち',
    Translation: 'рот', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 34, DeckID: 1, KanjiText: '手', KanaText: 'て',
    Translation: 'рука', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 35, DeckID: 1, KanjiText: '足', KanaText: 'あし',
    Translation: 'нога', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 36, DeckID: 1, KanjiText: '犬', KanaText: 'いぬ',
    Translation: 'собака', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 37, DeckID: 1, KanjiText: '猫', KanaText: 'ねこ',
    Translation: 'кошка', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 38, DeckID: 1, KanjiText: '鳥', KanaText: 'とり',
    Translation: 'птица', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 39, DeckID: 1, KanjiText: '魚', KanaText: 'さかな',
    Translation: 'рыба', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 40, DeckID: 1, KanjiText: '虫', KanaText: 'むし',
    Translation: 'насекомое', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 6, DeckID: 2, KanjiText: '行く', KanaText: 'いく',
    Translation: 'идти', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 7, DeckID: 2, KanjiText: '来る', KanaText: 'くる',
    Translation: 'приходить', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 8, DeckID: 2, KanjiText: '話す', KanaText: 'はなす',
    Translation: 'говорить', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 9, DeckID: 2, KanjiText: '聞く', KanaText: 'きく',
    Translation: 'слушать', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 10, DeckID: 3, KanjiText: '大きい', KanaText: 'おおきい',
    Translation: 'большой', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 11, DeckID: 3, KanjiText: '小さい', KanaText: 'ちいさい',
    Translation: 'маленький', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 12, DeckID: 3, KanjiText: '新しい', KanaText: 'あたらしい',
    Translation: 'новый', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 13, DeckID: 4, KanjiText: '一', KanaText: 'いち',
    Translation: 'один', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 14, DeckID: 4, KanjiText: '二', KanaText: 'に',
    Translation: 'два', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 15, DeckID: 4, KanjiText: '三', KanaText: 'さん',
    Translation: 'три', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 16, DeckID: 4, KanjiText: '四', KanaText: 'し',
    Translation: 'четыре', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 17, DeckID: 4, KanjiText: '五', KanaText: 'ご',
    Translation: 'пять', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 18, DeckID: 5, KanjiText: 'こんにちは', KanaText: null,
    Translation: 'привет (день)', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 19, DeckID: 5, KanjiText: 'おはよう', KanaText: null,
    Translation: 'доброе утро', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
  {
    ID: 20, DeckID: 5, KanjiText: 'さようなら', KanaText: null,
    Translation: 'до свидания', EaseFactor: 2.5, Interval: 0, Repetitions: 0,
    NextReview: new Date().toISOString(), CreatedAt: new Date().toISOString(),
    UpdatedAt: new Date().toISOString(),
  },
]

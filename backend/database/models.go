// Пакет database предоставляет слой работы с SQLite-базой данных Yappari.
//
// Содержит инициализацию БД, миграции схемы и CRUD-операции для колод и карточек,
// а также логику тренировки с применением алгоритма SM-2.
package database

// Deck представляет колоду карточек.
type Deck struct {
	// ID — уникальный идентификатор колоды.
	ID int `json:"id"`

	// Name — название колоды.
	Name string `json:"name"`

	// CreatedAt — дата и время создания в формате RFC3339.
	CreatedAt string `json:"created_at"`
}

// Card представляет карточку для изучения японского слова.
type Card struct {
	// ID — уникальный идентификатор карточки.
	ID int `json:"id"`

	// DeckID — идентификатор колоды, к которой принадлежит карточка.
	DeckID int `json:"deck_id"`

	// KanjiText — полное написание слова (например "食べる").
	KanjiText string `json:"kanji_text"`

	// FuriganaText — полное чтение каной (например "たべる").
	// Может быть nil, если слово не содержит кандзи.
	FuriganaText *string `json:"furigana_text"`

	// Translation — русский перевод слова.
	Translation string `json:"translation"`

	// EaseFactor — множитель лёгкости SM-2 (по умолчанию 2.5).
	EaseFactor float64 `json:"ease_factor"`

	// Interval — интервал до следующего повторения в днях.
	Interval int `json:"interval"`

	// Repetitions — количество успешных повторений подряд.
	Repetitions int `json:"repetitions"`

	// NextReview — дата следующего запланированного повторения в формате RFC3339.
	NextReview string `json:"next_review"`

	// LastReview — дата последнего повторения в формате RFC3339. Может быть nil.
	LastReview *string `json:"last_review"`

	// CreatedAt — дата и время создания карточки.
	CreatedAt string `json:"created_at"`

	// UpdatedAt — дата и время последнего обновления карточки.
	UpdatedAt string `json:"updated_at"`
}

// CardInput — структура для создания или обновления карточки.
// Не содержит поля SM-2 — они устанавливаются автоматически.
type CardInput struct {
	// DeckID — идентификатор колоды.
	DeckID int `json:"deck_id"`

	// KanjiText — полное написание слова (обязательное поле).
	KanjiText string `json:"kanji_text"`

	// FuriganaText — чтение каной (опционально).
	FuriganaText *string `json:"furigana_text"`

	// Translation — русский перевод (обязательное поле).
	Translation string `json:"translation"`
}

// TrainingCard — облегчённое представление карточки для сессии тренировки.
// Содержит только поля, необходимые для отображения на фронтенде.
type TrainingCard struct {
	// ID — уникальный идентификатор карточки.
	ID int `json:"id"`

	// KanjiText — полное написание слова.
	KanjiText string `json:"kanji_text"`

	// FuriganaText — чтение каной (может быть nil).
	FuriganaText *string `json:"furigana_text"`

	// Translation — русский перевод.
	Translation string `json:"translation"`
}

// VoiceStatus содержит информацию о доступности голосов для синтеза речи.
type VoiceStatus struct {
	// Ja — доступен ли японский голос.
	Ja bool `json:"ja"`

	// Ru — доступен ли русский голос.
	Ru bool `json:"ru"`
}

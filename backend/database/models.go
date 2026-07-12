// Пакет database предоставляет слой работы с SQLite-базой данных Yappari.
//
// Содержит инициализацию БД, миграции схемы и CRUD-операции для колод и карточек,
// а также логику тренировки с применением алгоритма SM-2.
package database

// Deck представляет колоду карточек.
type Deck struct {
	// ID — уникальный идентификатор колоды.
	ID int `json:"ID"`

	// Name — название колоды.
	Name string `json:"Name"`

	// CreatedAt — дата и время создания в формате RFC3339.
	CreatedAt string `json:"CreatedAt"`
}

// Card представляет карточку для изучения японского слова.
type Card struct {
	// ID — уникальный идентификатор карточки.
	ID int `json:"ID"`

	// DeckID — идентификатор колоды, к которой принадлежит карточка.
	DeckID int `json:"DeckID"`

	// KanjiText — полное написание слова (например "食べる").
	KanjiText string `json:"KanjiText"`

	// KanaText — полное чтение каной (например "たべる").
	// Может быть nil, если слово не содержит кандзи.
	KanaText *string `json:"KanaText"`

	// Translation — русский перевод слова.
	Translation string `json:"Translation"`

	// EaseFactor — множитель лёгкости SM-2 (по умолчанию 2.5).
	EaseFactor float64 `json:"EaseFactor"`

	// Interval — интервал до следующего повторения в днях.
	Interval int `json:"Interval"`

	// Repetitions — количество успешных повторений подряд.
	Repetitions int `json:"Repetitions"`

	// NextReview — дата следующего запланированного повторения в формате RFC3339.
	NextReview string `json:"NextReview"`

	// LastReview — дата последнего повторения в формате RFC3339. Может быть nil.
	LastReview *string `json:"LastReview"`

	// CreatedAt — дата и время создания карточки.
	CreatedAt string `json:"CreatedAt"`

	// UpdatedAt — дата и время последнего обновления карточки.
	UpdatedAt string `json:"UpdatedAt"`
}

// CardInput — структура для создания или обновления карточки.
// Не содержит поля SM-2 — они устанавливаются автоматически.
type CardInput struct {
	// DeckID — идентификатор колоды.
	DeckID int `json:"DeckID"`

	// KanjiText — полное написание слова (обязательное поле).
	KanjiText string `json:"KanjiText"`

	// KanaText — чтение каной (опционально).
	KanaText *string `json:"KanaText"`

	// Translation — русский перевод (обязательное поле).
	Translation string `json:"Translation"`
}

// TrainingCard — облегчённое представление карточки для сессии тренировки.
// Содержит только поля, необходимые для отображения на фронтенде.
type TrainingCard struct {
	// ID — уникальный идентификатор карточки.
	ID int `json:"ID"`

	// KanjiText — полное написание слова.
	KanjiText string `json:"KanjiText"`

	// KanaText — чтение каной (может быть nil).
	KanaText *string `json:"KanaText"`

	// Translation — русский перевод.
	Translation string `json:"Translation"`
}

// VoiceStatus содержит информацию о доступности голосов для синтеза речи.
type VoiceStatus struct {
	// Ja — доступен ли японский голос.
	Ja bool `json:"Ja"`

	// Ru — доступен ли русский голос.
	Ru bool `json:"Ru"`
}

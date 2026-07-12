package main

import (
	"context"
	"encoding/base64"
	"fmt"
	"log"

	"github.com/MindlessMuse666/yappari/backend/database"
	"github.com/MindlessMuse666/yappari/backend/tts"
)

// App — главная структура приложения, методы которой экспортируются во фронтенд
// через Wails IPC. Служит тонким контроллером: вся бизнес-логика выполняется
// в пакетах database, sm2 и tts.
type App struct {
	ctx context.Context
}

// NewApp создаёт новый экземпляр App.
func NewApp() *App {
	return &App{}
}

// startup вызывается Wails при запуске приложения. Инициализирует базу данных.
// TTS (Python) больше не инициализируется автоматически — используется Web Speech API
// через WebView2. Python TTS (Kokoro/Silero) будет установлен по запросу пользователя
// через Settings -> "Установить высококачественный TTS".
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := database.InitDB(); err != nil {
		log.Fatalf("Критическая ошибка: не удалось инициализировать базу данных: %v", err)
	}
}

// shutdown вызывается Wails при завершении приложения.
// Закрывает TTS-процесс и базу данных.
func (a *App) shutdown(ctx context.Context) {
	if err := tts.Close(); err != nil {
		fmt.Printf("TTS: ошибка завершения: %v\n", err)
	}
	if err := database.CloseDB(); err != nil {
		panic(err)
	}
}

// ---- Колоды ----

// GetDecks возвращает список всех колод.
func (a *App) GetDecks() ([]database.Deck, error) {
	decks, err := database.GetDecks()
	if err != nil {
		fmt.Printf("ERROR: GetDecks failed: %v\n", err)
	}
	return decks, err
}

// CreateDeck создаёт новую колоду с указанным именем.
func (a *App) CreateDeck(name string) (*database.Deck, error) {
	deck, err := database.CreateDeck(name)
	if err != nil {
		fmt.Printf("ERROR: CreateDeck failed: %v\n", err)
	}
	return deck, err
}

// UpdateDeck обновляет название колоды.
func (a *App) UpdateDeck(id int, name string) error {
	return database.UpdateDeck(id, name)
}

// DeleteDeck удаляет колоду и все её карточки.
func (a *App) DeleteDeck(id int) error {
	return database.DeleteDeck(id)
}

// ---- Карточки ----

// GetCardsByDeck возвращает все карточки указанной колоды.
func (a *App) GetCardsByDeck(deckID int) ([]database.Card, error) {
	cards, err := database.GetCardsByDeck(deckID)
	if err != nil {
		fmt.Printf("ERROR: GetCardsByDeck failed: %v\n", err)
	}
	return cards, err
}

// CreateCard создаёт новую карточку с указанными данными.
func (a *App) CreateCard(input database.CardInput) (*database.Card, error) {
	card, err := database.CreateCard(input)
	if err != nil {
		fmt.Printf("ERROR: CreateCard failed: %v\n", err)
	}
	return card, err
}

// UpdateCard обновляет текстовые поля карточки.
func (a *App) UpdateCard(id int, input database.CardInput) error {
	return database.UpdateCard(id, input)
}

// DeleteCard удаляет карточку по её идентификатору.
func (a *App) DeleteCard(id int) error {
	return database.DeleteCard(id)
}

// ---- Тренировка ----

// GetTrainingCards возвращает карточки для тренировки из указанных колод.
// Параметр mode определяет режим: "interval" — только просроченные, "free" — все.
func (a *App) GetTrainingCards(mode string, deckIDs []int) ([]database.TrainingCard, error) {
	return database.GetTrainingCards(mode, deckIDs)
}

// SubmitReview применяет оценку пользователя к карточке и обновляет её поля SM-2.
func (a *App) SubmitReview(cardID int, grade int) (*database.Card, error) {
	return database.SubmitReview(cardID, grade)
}

// ResetCardProgress сбрасывает прогресс SM-2 указанной карточки.
func (a *App) ResetCardProgress(cardID int) error {
	return database.ResetCardProgress(cardID)
}

// ResetDeckProgress сбрасывает прогресс SM-2 всех карточек колоды.
func (a *App) ResetDeckProgress(deckID int) error {
	return database.ResetDeckProgress(deckID)
}

// ---- Синтез речи ----

// CheckVoicesAvailability проверяет доступность голосов для синтеза речи.
// Возвращает статус на основе TTS-системы.
func (a *App) CheckVoicesAvailability() database.VoiceStatus {
	s := tts.Status()
	ja := false
	ru := false
	if s.State == tts.StateReady {
		// Обе модели загружены — оба языка доступны
		ja = true
		ru = true
	}
	return database.VoiceStatus{
		Ja: ja,
		Ru: ru,
	}
}

// SpeakText синтезирует речь через встроенные TTS-модели (Silero / Kokoro).
// Возвращает карту с полями "audio" (base64-WAV) и "mime" (MIME-тип).
func (a *App) SpeakText(text string, lang string) (map[string]any, error) {
	data, mimeType, err := tts.Speak(text, lang)
	if err != nil {
		return nil, err
	}
	return map[string]any{
		"audio": base64.StdEncoding.EncodeToString(data),
		"mime":  mimeType,
	}, nil
}

// CheckTTSAvailability проверяет доступность TTS в системе.
// Возвращает карту с полями "available" (bool), "message" (string) и "status" (int).
func (a *App) CheckTTSAvailability() map[string]any {
	s := tts.Status()
	return map[string]any{
		"available": s.State == tts.StateReady,
		"message":   s.Message,
		"status":    int(s.State),
	}
}

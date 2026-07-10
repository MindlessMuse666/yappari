package main

import (
	"context"
	"encoding/base64"

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
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := database.InitDB(); err != nil {
		panic(err)
	}
}

// shutdown вызывается Wails при завершении приложения. Закрывает базу данных.
func (a *App) shutdown(ctx context.Context) {
	if err := database.CloseDB(); err != nil {
		panic(err)
	}
}

// ---- Колоды ----

// GetDecks возвращает список всех колод.
func (a *App) GetDecks() ([]database.Deck, error) {
	return database.GetDecks()
}

// CreateDeck создаёт новую колоду с указанным именем.
func (a *App) CreateDeck(name string) (*database.Deck, error) {
	return database.CreateDeck(name)
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
	return database.GetCardsByDeck(deckID)
}

// CreateCard создаёт новую карточку с указанными данными.
func (a *App) CreateCard(input database.CardInput) (*database.Card, error) {
	return database.CreateCard(input)
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

// ---- Голоса (заглушка) ----

// CheckVoicesAvailability проверяет доступность голосов для синтеза речи.
// В текущей реализации всегда возвращает true для обоих языков.
func (a *App) CheckVoicesAvailability() database.VoiceStatus {
	return database.VoiceStatus{
		Ja: true,
		Ru: true,
	}
}

// ---- Синтез речи ----

// SpeakText синтезирует речь через edge-tts. Принимает текст и код языка,
// возвращает аудио в виде base64-строки (MP3).
func (a *App) SpeakText(text string, lang string) (string, error) {
	data, err := tts.Speak(text, lang)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(data), nil
}

// CheckEdgeTTSAvailability проверяет, установлен ли edge-tts в системе.
// Возвращает карту с полями "available" (bool) и "message" (string).
func (a *App) CheckEdgeTTSAvailability() map[string]any {
	ok, msg := tts.CheckAvailability()
	return map[string]any{
		"available": ok,
		"message":   msg,
	}
}

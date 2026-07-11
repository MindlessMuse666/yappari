package database

import (
	"fmt"
	"math/rand"
	"strings"
	"time"

	"github.com/MindlessMuse666/yappari/backend/sm2"
)

// GetTrainingCards возвращает карточки для тренировки из указанных колод
// с проверкой владения пользователем.
//
// Параметры:
//   - mode — режим тренировки: "interval" (только просроченные) или "free" (все)
//   - deckIDs — список идентификаторов колод
//   - userID — идентификатор пользователя
//
// Карточки возвращаются в случайном порядке.
func GetTrainingCards(mode string, deckIDs []int, userID int) ([]TrainingCard, error) {
	if len(deckIDs) == 0 {
		return []TrainingCard{}, nil
	}

	placeholders := make([]any, len(deckIDs))
	for i, id := range deckIDs {
		placeholders[i] = id
	}

	deckPlaceholders := `?` + strings.Repeat(",?", len(deckIDs)-1)

	// Базовый запрос: все карточки из указанных колод с проверкой владения
	baseQuery := `
		SELECT c.id, c.kanji_text, c.furigana_text, c.translation
		FROM cards c
		JOIN decks d ON d.id = c.deck_id
		WHERE c.deck_id IN (` + deckPlaceholders + `) AND d.user_id = ?
	`

	placeholders = append(placeholders, userID)

	if mode == "interval" {
		now := time.Now().UTC().Format(time.RFC3339)
		overdueQuery := baseQuery + ` AND c.next_review <= ?`

		overduePlaceholders := make([]any, 0, len(deckIDs)+2)
		for _, id := range deckIDs {
			overduePlaceholders = append(overduePlaceholders, id)
		}
		overduePlaceholders = append(overduePlaceholders, userID, now)

		cards, err := queryCards(overdueQuery, overduePlaceholders...)
		if err != nil {
			return nil, err
		}
		if len(cards) > 0 {
			return cards, nil
		}
	}

	cards, err := queryCards(baseQuery, placeholders...)
	if err != nil {
		return nil, err
	}
	return cards, nil
}

// queryCards выполняет запрос и возвращает список карточек тренировки.
func queryCards(query string, placeholders ...any) ([]TrainingCard, error) {
	rows, err := DB.Query(query, placeholders...)
	if err != nil {
		return nil, fmt.Errorf("не удалось получить карточки для тренировки: %w", err)
	}
	defer rows.Close()

	cards := make([]TrainingCard, 0)
	for rows.Next() {
		var c TrainingCard
		if err := rows.Scan(&c.ID, &c.KanjiText, &c.FuriganaText, &c.Translation); err != nil {
			return nil, fmt.Errorf("не удалось прочитать карточку тренировки: %w", err)
		}
		cards = append(cards, c)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка при обходе карточек тренировки: %w", err)
	}

	// Перемешиваем карточки в случайном порядке
	rand.Shuffle(len(cards), func(i, j int) {
		cards[i], cards[j] = cards[j], cards[i]
	})

	return cards, nil
}

// SubmitReview применяет алгоритм SM-2 к карточке на основе оценки пользователя
// и обновляет её поля в базе данных. Проверяет владение карточкой через JOIN.
//
// Параметры:
//   - cardID — идентификатор карточки
//   - grade — оценка пользователя (0 — перезаучивание, 3 — трудно, 4 — хорошо, 5 — легко)
//   - userID — идентификатор пользователя для проверки владения
//
// Возвращает обновлённую карточку.
func SubmitReview(cardID int, grade int, userID int) (*Card, error) {
	if err := sm2.ValidateGrade(grade); err != nil {
		return nil, fmt.Errorf("недопустимая оценка: %w", err)
	}

	// Проверяем владение карточкой через JOIN с колодой
	var deckID int
	err := DB.QueryRow(`
		SELECT c.deck_id FROM cards c
		JOIN decks d ON d.id = c.deck_id
		WHERE c.id = ? AND d.user_id = ?
	`, cardID, userID).Scan(&deckID)
	if err != nil {
		return nil, fmt.Errorf("карточка с идентификатором %d не найдена или недоступна: %w", cardID, err)
	}

	card, err := GetCardByID(cardID)
	if err != nil {
		return nil, fmt.Errorf("не удалось найти карточку для обзора: %w", err)
	}

	result := sm2.Calculate(card.EaseFactor, card.Interval, card.Repetitions, grade, time.Now())
	now := time.Now().UTC().Format(time.RFC3339)

	_, err = DB.Exec(`
		UPDATE cards
		SET ease_factor = ?, interval = ?, repetitions = ?,
		    next_review = ?, last_review = ?, updated_at = ?
		WHERE id = ?
	`, result.EaseFactor, result.Interval, result.Repetitions, result.NextReview, now, now, cardID)
	if err != nil {
		return nil, fmt.Errorf("не удалось обновить карточку после обзора: %w", err)
	}

	updatedCard, err := GetCardByID(cardID)
	if err != nil {
		return nil, fmt.Errorf("не удалось получить обновлённую карточку: %w", err)
	}

	return updatedCard, nil
}

// ResetCardProgress сбрасывает прогресс SM-2 для указанной карточки
// с проверкой владения через JOIN.
func ResetCardProgress(cardID int, userID int) error {
	result := sm2.Reset()
	now := time.Now().UTC().Format(time.RFC3339)

	res, err := DB.Exec(`
		UPDATE cards
		SET ease_factor = ?, interval = ?, repetitions = ?,
		    next_review = ?, last_review = NULL, updated_at = ?
		WHERE id = ? AND deck_id IN (
			SELECT id FROM decks WHERE user_id = ?
		)
	`, result.EaseFactor, result.Interval, result.Repetitions, result.NextReview, now, cardID, userID)
	if err != nil {
		return fmt.Errorf("не удалось сбросить прогресс карточки: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("не удалось проверить результат сброса: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("карточка с идентификатором %d не найдена", cardID)
	}

	return nil
}

// ResetDeckProgress сбрасывает прогресс SM-2 для всех карточек указанной колоды
// с проверкой владения.
func ResetDeckProgress(deckID int, userID int) error {
	result := sm2.Reset()
	now := time.Now().UTC().Format(time.RFC3339)

	res, err := DB.Exec(`
		UPDATE cards
		SET ease_factor = ?, interval = ?, repetitions = ?,
		    next_review = ?, last_review = NULL, updated_at = ?
		WHERE deck_id = ? AND deck_id IN (
			SELECT id FROM decks WHERE user_id = ?
		)
	`, result.EaseFactor, result.Interval, result.Repetitions, result.NextReview, now, deckID, userID)
	if err != nil {
		return fmt.Errorf("не удалось сбросить прогресс колоды: %w", err)
	}

	rows, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("не удалось проверить результат сброса колоды: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("колода с идентификатором %d не найдена или не содержит карточек", deckID)
	}

	return nil
}

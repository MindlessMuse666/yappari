package database

import (
	"fmt"
	"time"
)

// GetCardsByDeck возвращает все карточки указанной колоды, отсортированные
// от новых к старым.
func GetCardsByDeck(deckID int) ([]Card, error) {
	rows, err := DB.Query(`
		SELECT id, deck_id, kanji_text, furigana_text, translation,
		       ease_factor, interval, repetitions, next_review,
		       last_review, created_at, updated_at
		FROM cards
		WHERE deck_id = ?
		ORDER BY created_at DESC
	`, deckID)
	if err != nil {
		return nil, fmt.Errorf("не удалось получить карточки колоды %d: %w", deckID, err)
	}
	defer rows.Close()

	var cards []Card
	for rows.Next() {
		var c Card
		err := rows.Scan(
			&c.ID, &c.DeckID, &c.KanjiText, &c.FuriganaText,
			&c.Translation, &c.EaseFactor, &c.Interval,
			&c.Repetitions, &c.NextReview, &c.LastReview,
			&c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("не удалось прочитать карточку: %w", err)
		}
		cards = append(cards, c)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка при обходе карточек: %w", err)
	}

	return cards, nil
}

// GetCardByID возвращает карточку по её идентификатору.
func GetCardByID(id int) (*Card, error) {
	var c Card
	err := DB.QueryRow(`
		SELECT id, deck_id, kanji_text, furigana_text, translation,
		       ease_factor, interval, repetitions, next_review,
		       last_review, created_at, updated_at
		FROM cards WHERE id = ?
	`, id).Scan(
		&c.ID, &c.DeckID, &c.KanjiText, &c.FuriganaText,
		&c.Translation, &c.EaseFactor, &c.Interval,
		&c.Repetitions, &c.NextReview, &c.LastReview,
		&c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("карточка с идентификатором %d не найдена: %w", id, err)
	}
	return &c, nil
}

// CreateCard создаёт новую карточку с указанными данными. Поля SM-2
// устанавливаются в начальные значения (EF=2.5, interval=0, repetitions=0,
// next_review=текущее время).
func CreateCard(input CardInput) (*Card, error) {
	now := time.Now().UTC().Format(time.RFC3339)

	result, err := DB.Exec(`
		INSERT INTO cards (deck_id, kanji_text, furigana_text, translation, next_review)
		VALUES (?, ?, ?, ?, ?)
	`, input.DeckID, input.KanjiText, input.FuriganaText, input.Translation, now)
	if err != nil {
		return nil, fmt.Errorf("не удалось создать карточку: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("не удалось получить идентификатор карточки: %w", err)
	}

	c := &Card{
		ID:           int(id),
		DeckID:       input.DeckID,
		KanjiText:    input.KanjiText,
		FuriganaText: input.FuriganaText,
		Translation:  input.Translation,
		EaseFactor:   2.5,
		Interval:     0,
		Repetitions:  0,
		NextReview:   now,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	return c, nil
}

// UpdateCard обновляет текстовые поля карточки. Поля SM-2 не изменяются.
func UpdateCard(id int, input CardInput) error {
	now := time.Now().UTC().Format(time.RFC3339)

	result, err := DB.Exec(`
		UPDATE cards
		SET deck_id = ?, kanji_text = ?, furigana_text = ?,
		    translation = ?, updated_at = ?
		WHERE id = ?
	`, input.DeckID, input.KanjiText, input.FuriganaText, input.Translation, now, id)
	if err != nil {
		return fmt.Errorf("не удалось обновить карточку: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("не удалось проверить результат обновления: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("карточка с идентификатором %d не найдена", id)
	}

	return nil
}

// DeleteCard удаляет карточку по её идентификатору.
func DeleteCard(id int) error {
	result, err := DB.Exec("DELETE FROM cards WHERE id = ?", id)
	if err != nil {
		return fmt.Errorf("не удалось удалить карточку: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("не удалось проверить результат удаления: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("карточка с идентификатором %d не найдена", id)
	}

	return nil
}

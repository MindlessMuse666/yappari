package database

import (
	"fmt"
)

// GetDecks возвращает список колод указанного пользователя,
// отсортированных от новых к старым.
func GetDecks(userID int) ([]Deck, error) {
	rows, err := DB.Query(
		"SELECT id, name, created_at FROM decks WHERE user_id = ? ORDER BY created_at DESC",
		userID,
	)
	if err != nil {
		return nil, fmt.Errorf("не удалось получить список колод: %w", err)
	}
	defer rows.Close()

	decks := make([]Deck, 0)
	for rows.Next() {
		var d Deck
		if err := rows.Scan(&d.ID, &d.Name, &d.CreatedAt); err != nil {
			return nil, fmt.Errorf("не удалось прочитать колоду: %w", err)
		}
		decks = append(decks, d)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка при обходе колод: %w", err)
	}

	return decks, nil
}

// GetDeckByID возвращает колоду по идентификатору с проверкой владельца.
func GetDeckByID(deckID, userID int) (*Deck, error) {
	var d Deck
	err := DB.QueryRow(
		"SELECT id, name, created_at FROM decks WHERE id = ? AND user_id = ?",
		deckID, userID,
	).Scan(&d.ID, &d.Name, &d.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("колода с идентификатором %d не найдена: %w", deckID, err)
	}
	return &d, nil
}

// CreateDeck создаёт новую колоду для указанного пользователя.
func CreateDeck(name string, userID int) (*Deck, error) {
	result, err := DB.Exec("INSERT INTO decks (name, user_id) VALUES (?, ?)", name, userID)
	if err != nil {
		return nil, fmt.Errorf("не удалось создать колоду: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("не удалось получить идентификатор колоды: %w", err)
	}

	d := &Deck{
		ID:   int(id),
		Name: name,
	}

	err = DB.QueryRow("SELECT created_at FROM decks WHERE id = ?", id).Scan(&d.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать дату создания колоды: %w", err)
	}

	return d, nil
}

// UpdateDeck обновляет название колоды с проверкой владельца.
func UpdateDeck(id, userID int, name string) error {
	result, err := DB.Exec("UPDATE decks SET name = ? WHERE id = ? AND user_id = ?", name, id, userID)
	if err != nil {
		return fmt.Errorf("не удалось обновить колоду: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("не удалось проверить результат обновления: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("колода с идентификатором %d не найдена", id)
	}

	return nil
}

// DeleteDeck удаляет колоду с проверкой владельца.
func DeleteDeck(id, userID int) error {
	result, err := DB.Exec("DELETE FROM decks WHERE id = ? AND user_id = ?", id, userID)
	if err != nil {
		return fmt.Errorf("не удалось удалить колоду: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("не удалось проверить результат удаления: %w", err)
	}
	if rows == 0 {
		return fmt.Errorf("колода с идентификатором %d не найдена", id)
	}

	return nil
}

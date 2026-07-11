package database

import (
	"fmt"
)

// GetDecks возвращает список всех колод, отсортированных по дате создания
// от новых к старым.
func GetDecks() ([]Deck, error) {
	rows, err := DB.Query("SELECT id, name, created_at FROM decks ORDER BY created_at DESC")
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

// CreateDeck создаёт новую колоду с указанным именем.
// Возвращает созданную колоду с заполненными полями.
func CreateDeck(name string) (*Deck, error) {
	result, err := DB.Exec("INSERT INTO decks (name) VALUES (?)", name)
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

	// Читаем created_at из БД, чтобы получить значение datetime('now')
	err = DB.QueryRow("SELECT created_at FROM decks WHERE id = ?", id).Scan(&d.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать дату создания колоды: %w", err)
	}

	return d, nil
}

// UpdateDeck обновляет название колоды.
func UpdateDeck(id int, name string) error {
	result, err := DB.Exec("UPDATE decks SET name = ? WHERE id = ?", name, id)
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

// DeleteDeck удаляет колоду и все её карточки (каскадное удаление).
func DeleteDeck(id int) error {
	result, err := DB.Exec("DELETE FROM decks WHERE id = ?", id)
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

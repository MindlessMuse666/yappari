package database

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

// DB — глобальное подключение к SQLite. Инициализируется в InitDB.
// Допустимо использовать глобальную переменную, так как приложение
// однопользовательское с одним экземпляром БД.
var DB *sql.DB

// dbPath — путь к файлу базы данных. По умолчанию определяется в InitDB,
// но может быть переопределён через SetDBPath для тестов.
var dbPath string

// SetDBPath устанавливает путь к файлу базы данных. Должна вызываться до InitDB.
// Для тестов можно передать ":memory:" для работы с БД в оперативной памяти.
func SetDBPath(path string) {
	dbPath = path
}

// InitDB инициализирует подключение к SQLite. Если путь не был задан через
// SetDBPath, создаёт файл database.db в папке %APPDATA%/Yappari.
// Выполняет миграции схемы при первом запуске.
func InitDB() error {
	if dbPath == "" {
		appData, err := os.UserConfigDir()
		if err != nil {
			return fmt.Errorf("не удалось получить путь к папке пользователя: %w", err)
		}

		appDir := filepath.Join(appData, "Yappari")
		if err := os.MkdirAll(appDir, 0755); err != nil {
			return fmt.Errorf("не удалось создать папку приложения: %w", err)
		}

		dbPath = filepath.Join(appDir, "database.db")
	}

	var err error
	DB, err = sql.Open("sqlite", dbPath)
	if err != nil {
		return fmt.Errorf("не удалось открыть базу данных: %w", err)
	}

	if err := DB.Ping(); err != nil {
		return fmt.Errorf("не удалось подключиться к базе данных: %w", err)
	}

	if err := runMigrations(); err != nil {
		return fmt.Errorf("не удалось выполнить миграции: %w", err)
	}

	return nil
}

// runMigrations создаёт таблицы decks и cards, если они ещё не существуют.
func runMigrations() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS decks (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);`,
		`CREATE TABLE IF NOT EXISTS cards (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			deck_id INTEGER NOT NULL,
			kanji_text TEXT NOT NULL,
			furigana_text TEXT,
			translation TEXT NOT NULL,
			ease_factor REAL NOT NULL DEFAULT 2.5,
			interval INTEGER NOT NULL DEFAULT 0,
			repetitions INTEGER NOT NULL DEFAULT 0,
			next_review TEXT NOT NULL,
			last_review TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			updated_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (deck_id) REFERENCES decks(id) ON DELETE CASCADE
		);`,
	}

	for _, m := range migrations {
		if _, err := DB.Exec(m); err != nil {
			return fmt.Errorf("не удалось выполнить миграцию: %w", err)
		}
	}

	return nil
}

// CloseDB закрывает подключение к базе данных.
func CloseDB() error {
	if DB != nil {
		if err := DB.Close(); err != nil {
			return fmt.Errorf("не удалось закрыть базу данных: %w", err)
		}
	}
	return nil
}

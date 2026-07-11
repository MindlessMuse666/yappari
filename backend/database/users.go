package database

import (
	"fmt"
)

// CreateUser создаёт нового пользователя с указанным email и bcrypt-хешем пароля.
func CreateUser(email, passwordHash string) (*User, error) {
	result, err := DB.Exec(
		"INSERT INTO users (email, password_hash) VALUES (?, ?)",
		email, passwordHash,
	)
	if err != nil {
		return nil, fmt.Errorf("не удалось создать пользователя: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		return nil, fmt.Errorf("не удалось получить идентификатор пользователя: %w", err)
	}

	u := &User{
		ID:    int(id),
		Email: email,
	}

	err = DB.QueryRow("SELECT created_at FROM users WHERE id = ?", id).Scan(&u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать дату создания пользователя: %w", err)
	}

	return u, nil
}

// GetUserByEmail возвращает пользователя по email, включая хеш пароля.
func GetUserByEmail(email string) (*User, error) {
	var u User
	err := DB.QueryRow(
		"SELECT id, email, password_hash, created_at FROM users WHERE email = ?",
		email,
	).Scan(&u.ID, &u.Email, &u.PasswordHash, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("пользователь с email %s не найден: %w", email, err)
	}
	return &u, nil
}

// GetUserByID возвращает пользователя по его идентификатору (без хеша пароля).
func GetUserByID(id int) (*User, error) {
	var u User
	err := DB.QueryRow(
		"SELECT id, email, created_at FROM users WHERE id = ?",
		id,
	).Scan(&u.ID, &u.Email, &u.CreatedAt)
	if err != nil {
		return nil, fmt.Errorf("пользователь с идентификатором %d не найден: %w", id, err)
	}
	return &u, nil
}

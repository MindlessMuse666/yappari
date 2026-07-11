package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"

	"github.com/MindlessMuse666/yappari/backend/auth"
	"github.com/MindlessMuse666/yappari/backend/database"
)

// Register создаёт нового пользователя.
//
//	POST /api/auth/register
//	Body: { "email": "...", "password": "..." }
func Register(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email и пароль обязательны"})
		return
	}

	// Валидация
	if input.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email не может быть пустым"})
		return
	}
	if len(input.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "пароль должен содержать минимум 6 символов"})
		return
	}

	// Хешируем пароль
	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при обработке пароля"})
		return
	}

	// Создаём пользователя
	user, err := database.CreateUser(input.Email, string(hash))
	if err != nil {
		c.JSON(http.StatusConflict, gin.H{"error": "пользователь с таким email уже существует"})
		return
	}

	// Генерируем токен
	secret := getJWTSecret()
	token, err := auth.GenerateToken(user.ID, secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при создании токена"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

// Login аутентифицирует пользователя.
//
//	POST /api/auth/login
//	Body: { "email": "...", "password": "..." }
func Login(c *gin.Context) {
	var input struct {
		Email    string `json:"email" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email и пароль обязательны"})
		return
	}

	// Ищем пользователя
	user, err := database.GetUserByEmail(input.Email)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "неверный email или пароль"})
		return
	}

	// Проверяем пароль
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "неверный email или пароль"})
		return
	}

	// Генерируем токен
	secret := getJWTSecret()
	token, err := auth.GenerateToken(user.ID, secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ошибка при создании токена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":    user.ID,
			"email": user.Email,
		},
	})
}

// getJWTSecret возвращает секрет JWT из переменной окружения.
func getJWTSecret() string {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Только для разработки
		secret = "dev-secret-change-in-production"
	}
	return secret
}

package handlers

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/MindlessMuse666/yappari/backend/auth"
)

// AuthMiddleware проверяет JWT-токен в заголовке Authorization.
// Кладёт userID в контекст Gin при успешной проверке.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "токен не предоставлен"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "неверный формат токена"})
			return
		}

		secret := os.Getenv("JWT_SECRET")
		if secret == "" {
			// Только для разработки
			secret = "dev-secret-change-in-production"
		}

		userID, err := auth.ParseToken(parts[1], secret)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "невалидный или просроченный токен"})
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

// GetUserID извлекает userID из контекста Gin.
func GetUserID(c *gin.Context) int {
	id, _ := c.Get("userID")
	return id.(int)
}

package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/MindlessMuse666/yappari/backend/database"
)

// GetTrainingCards возвращает карточки для тренировки.
//
//	GET /api/training?mode=interval&deck_ids=1,2,3
func GetTrainingCards(c *gin.Context) {
	userID := GetUserID(c)

	mode := c.DefaultQuery("mode", "free")

	deckIDsStr := c.Query("deck_ids")
	if deckIDsStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "deck_ids обязателен"})
		return
	}

	parts := strings.Split(deckIDsStr, ",")
	deckIDs := make([]int, 0, len(parts))
	for _, p := range parts {
		id, err := strconv.Atoi(strings.TrimSpace(p))
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор колоды: "+p})
			return
		}
		deckIDs = append(deckIDs, id)
	}

	cards, err := database.GetTrainingCards(mode, deckIDs, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить карточки для тренировки"})
		return
	}

	c.JSON(http.StatusOK, cards)
}

// SubmitReview принимает оценку пользователя и обновляет SM-2.
//
//	POST /api/training/review
//	Body: { "card_id": ..., "grade": ... }
func SubmitReview(c *gin.Context) {
	userID := GetUserID(c)

	var input struct {
		CardID int `json:"card_id" binding:"required"`
		Grade  int `json:"grade" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "card_id и grade обязательны"})
		return
	}

	card, err := database.SubmitReview(input.CardID, input.Grade, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, card)
}

// ResetCardProgress сбрасывает прогресс SM-2 для карточки.
//
//	POST /api/training/reset-card/:cardID
func ResetCardProgress(c *gin.Context) {
	userID := GetUserID(c)

	cardID, err := strconv.Atoi(c.Param("cardID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор карточки"})
		return
	}

	if err := database.ResetCardProgress(cardID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "карточка не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// ResetDeckProgress сбрасывает прогресс SM-2 для всех карточек колоды.
//
//	POST /api/training/reset-deck/:deckID
func ResetDeckProgress(c *gin.Context) {
	userID := GetUserID(c)

	deckID, err := strconv.Atoi(c.Param("deckID"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор колоды"})
		return
	}

	if err := database.ResetDeckProgress(deckID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колода не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

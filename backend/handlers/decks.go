package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/MindlessMuse666/yappari/backend/database"
)

// GetDecks возвращает список колод текущего пользователя.
//
//	GET /api/decks
func GetDecks(c *gin.Context) {
	userID := GetUserID(c)

	decks, err := database.GetDecks(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось получить колоды"})
		return
	}

	c.JSON(http.StatusOK, decks)
}

// CreateDeck создаёт новую колоду.
//
//	POST /api/decks
//	Body: { "name": "..." }
func CreateDeck(c *gin.Context) {
	userID := GetUserID(c)

	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "название колоды обязательно"})
		return
	}

	deck, err := database.CreateDeck(input.Name, userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось создать колоду"})
		return
	}

	c.JSON(http.StatusCreated, deck)
}

// UpdateDeck обновляет название колоды.
//
//	PUT /api/decks/:id
//	Body: { "name": "..." }
func UpdateDeck(c *gin.Context) {
	userID := GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор колоды"})
		return
	}

	var input struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "название колоды обязательно"})
		return
	}

	if err := database.UpdateDeck(id, userID, input.Name); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колода не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DeleteDeck удаляет колоду.
//
//	DELETE /api/decks/:id
func DeleteDeck(c *gin.Context) {
	userID := GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор колоды"})
		return
	}

	if err := database.DeleteDeck(id, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колода не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

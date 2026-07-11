package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"github.com/MindlessMuse666/yappari/backend/database"
)

// GetCardsByDeck возвращает карточки колоды с проверкой владения.
//
//	GET /api/decks/:id/cards
func GetCardsByDeck(c *gin.Context) {
	userID := GetUserID(c)

	deckID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор колоды"})
		return
	}

	cards, err := database.GetCardsByDeck(deckID, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колода не найдена"})
		return
	}

	c.JSON(http.StatusOK, cards)
}

// CreateCard создаёт новую карточку в колоде.
//
//	POST /api/decks/:id/cards
//	Body: { "kanji_text": "...", "furigana_text": "...", "translation": "..." }
func CreateCard(c *gin.Context) {
	userID := GetUserID(c)

	deckID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор колоды"})
		return
	}

	// Проверяем, что колода принадлежит пользователю
	if _, err := database.GetDeckByID(deckID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колода не найдена"})
		return
	}

	var input database.CardInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверные данные карточки"})
		return
	}

	input.DeckID = deckID

	card, err := database.CreateCard(input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "не удалось создать карточку"})
		return
	}

	c.JSON(http.StatusCreated, card)
}

// UpdateCard обновляет карточку.
//
//	PUT /api/cards/:id
//	Body: { "deck_id": ..., "kanji_text": "...", "furigana_text": "...", "translation": "..." }
func UpdateCard(c *gin.Context) {
	userID := GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор карточки"})
		return
	}

	var input database.CardInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверные данные карточки"})
		return
	}

	// Проверяем, что колода принадлежит пользователю
	if _, err := database.GetDeckByID(input.DeckID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "колода не найдена"})
		return
	}

	if err := database.UpdateCard(id, input); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "карточка не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

// DeleteCard удаляет карточку.
//
//	DELETE /api/cards/:id
func DeleteCard(c *gin.Context) {
	userID := GetUserID(c)

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "неверный идентификатор карточки"})
		return
	}

	// Проверяем владение через получение карточки и проверку колоды
	card, err := database.GetCardByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "карточка не найдена"})
		return
	}

	if _, err := database.GetDeckByID(card.DeckID, userID); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "карточка не найдена"})
		return
	}

	if err := database.DeleteCard(id); err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "карточка не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}

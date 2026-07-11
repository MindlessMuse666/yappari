package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// TTSStatus возвращает статус TTS (в веб-версии всегда browser TTS).
//
//	GET /api/tts/status
func TTSStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"available": true,
		"message":   "Browser TTS (Web Speech API + Google TTS)",
		"status":    2,
	})
}

package main

import (
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"

	"github.com/MindlessMuse666/yappari/backend/database"
	"github.com/MindlessMuse666/yappari/backend/handlers"
)

// main точка входа: инициализирует БД, настраивает Gin-сервер
// с CORS и маршрутизацией API, а также раздаёт статику фронтенда.
func main() {
	// Инициализация БД
	dbPath := os.Getenv("DATABASE_PATH")
	if dbPath == "" {
		dbPath = "./yappari.db"
	}
	if err := database.InitDB(dbPath); err != nil {
		log.Fatalf("Критическая ошибка: не удалось инициализировать базу данных: %v", err)
	}

	// Gin
	ginMode := os.Getenv("GIN_MODE")
	if ginMode == "" {
		ginMode = "release"
	}
	gin.SetMode(ginMode)

	r := gin.Default()

	// CORS для dev-режима (Vite на localhost:5173)
	r.Use(corsMiddleware())

	// API-маршруты
	api := r.Group("/api")
	{
		// Auth (публичные)
		api.POST("/auth/register", handlers.Register)
		api.POST("/auth/login", handlers.Login)

		// Health check (публичный)
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		// TTS статус (публичный)
		api.GET("/tts/status", handlers.TTSStatus)

		// Защищённые маршруты
		protected := api.Group("")
		protected.Use(handlers.AuthMiddleware())
		{
			// Decks
			protected.GET("/decks", handlers.GetDecks)
			protected.POST("/decks", handlers.CreateDeck)
			protected.PUT("/decks/:id", handlers.UpdateDeck)
			protected.DELETE("/decks/:id", handlers.DeleteDeck)

			// Cards
			protected.GET("/decks/:id/cards", handlers.GetCardsByDeck)
			protected.POST("/decks/:id/cards", handlers.CreateCard)
			protected.PUT("/cards/:id", handlers.UpdateCard)
			protected.DELETE("/cards/:id", handlers.DeleteCard)

			// Training
			protected.GET("/training", handlers.GetTrainingCards)
			protected.POST("/training/review", handlers.SubmitReview)
			protected.POST("/training/reset-card/:cardID", handlers.ResetCardProgress)
			protected.POST("/training/reset-deck/:deckID", handlers.ResetDeckProgress)
		}
	}

	// Статические файлы фронтенда
	r.Static("/assets", "./frontend/dist/assets")
	r.StaticFile("/favicon.ico", "./frontend/dist/favicon.ico")
	// SPA fallback: если файл существует — отдаём его, иначе index.html
	r.NoRoute(func(c *gin.Context) {
		path := c.Request.URL.Path
		if path != "/" {
			fullPath := filepath.Join("./frontend/dist", path)
			if info, err := os.Stat(fullPath); err == nil && !info.IsDir() {
				c.File(fullPath)
				return
			}
		}
		c.File("./frontend/dist/index.html")
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Сервер запущен на порту %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}

// corsMiddleware добавляет CORS-заголовки для dev-режима (Vite на localhost:5173).
func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

// Package main — точка входа десктоп-приложения Yappari.
//
// Запускает Wails-приложение, инициализирует бэкенд (App) и связывает его
// с WebView2-окном. Фронтенд (Vue.js) встраивается в бинарник через
// //go:embed.
package main

import (
	"embed"
	"log"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed frontend/dist
var assets embed.FS

// main запускает Wails-приложение: создаёт окно 1280x800 (максимизированное),
// связывает методы App с фронтендом через Bind, и монтирует встроенные
// ассеты фронтенда. При ошибке завершается через log.Fatal.
func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:            "Yappari",
		Width:            1280,
		Height:           800,
		Fullscreen:       false,
		WindowStartState: options.Maximised,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		OnStartup:  app.startup,
		OnShutdown: app.shutdown,
		Bind: []any{
			app,
		},
		Windows: &windows.Options{
			WebviewIsTransparent: false,
			WindowIsTranslucent:  false,
			DisableWindowIcon:    false,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}

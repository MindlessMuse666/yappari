.PHONY: dev build build-prod test test-sm2 test-db fe-dev fe-dev fe-build fe-check fe-install fe-clean lint clean install install-tts

# === Wails (десктоп-приложение) ===

## Запустить приложение в режиме разработки (Wails + hot-reload)
dev:
	wails dev

## Собрать EXE для Windows (production)
build:
	wails build -clean -platform windows/amd64

# === Тестирование ===

## Запустить все тесты бэкенда
test: test-sm2 test-db
	@echo "✅ Все тесты пройдены"

## Тесты алгоритма SM-2
test-sm2:
	go test ./backend/sm2/ -v -count=1 -timeout 30s

## Тесты базы данных
test-db:
	go test ./backend/database/ -v -count=1 -timeout 30s

## Проверить код Go линтером
lint:
	golangci-lint run

# === Frontend (без Wails, мок-данные) ===

## Запустить фронтенд в режиме разработки (без Wails, мок-данные)
fe-dev:
	cd frontend && npm run dev

## Проверить типы TypeScript
fe-check:
	cd frontend && npx vue-tsc -b

## Собрать фронтенд (проверка типов + Vite)
fe-build:
	cd frontend && npm run build

## Установить зависимости фронтенда
fe-install:
	cd frontend && npm install

## Очистить кэш и сборку фронтенда
fe-clean:
	cd frontend && rm -rf node_modules dist

# === Установка зависимостей ===

## Полная установка зависимостей (Go + фронтенд)
install: fe-install
	go mod download
	@echo "✅ Зависимости установлены"

## Установить edge-tts (требуется Python 3 для озвучки)
install-tts:
	pip install edge-tts
	@echo "✅ edge-tts установлен"

## Установка всего: Go + фронтенд + TTS (первый запуск)
setup: install install-tts
	@echo "✅✅✅ Проект готов к запуску! Используйте: make dev"

# === Очистка ===

## Очистить артефакты сборки (бинарники, dist, node_modules)
clean:
	@if exist build rmdir /s /q build
	@cd frontend && if exist dist rmdir /s /q dist
	@echo "✅ Артефакты сборки удалены"

## Полная очистка (включая зависимости)
clean-all: clean
	@cd frontend && if exist node_modules rmdir /s /q node_modules
	@echo "✅ Всё очищено"

# === Сборка для публикации ===

## Собрать production EXE и подготовить архив для распространения
build-prod: test build
	@echo "✅ Production-сборка готова: build/bin/yappari.exe"
	@echo "📦 Размер:"

## Собрать production EXE с NSIS-инсталлятором (требуется NSIS в PATH)
build-installer: build-prod
	@echo "🔧 Сборка инсталлятора через NSIS..."
	@echo "   Установите NSIS: https://nsis.sourceforge.io/Download"
	@echo "   Затем запустите: makensis installer.nsi"
	@echo "   Или используйте готовый build/bin/yappari.exe как portable-версию"

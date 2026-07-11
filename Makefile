.PHONY: dev build test test-sm2 test-db fe-dev fe-check fe-build fe-install fe-clean lint clean

# === Веб-сервер (Go + Gin) ===

## Запустить сервер в режиме разработки (с hot-reload через air)
dev:
	cd frontend && npm run dev

## Запустить Go-сервер (требуется DATABASE_PATH или создаст ./yappari.db)
server:
	go run ./backend/cmd/server

## Собрать бинарник сервера для Linux amd64 (Render/Docker)
build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o yappari-server ./backend/cmd/server

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

# === Frontend (Vue 3 + Vite) ===

## Запустить фронтенд в режиме разработки (Vite dev server)
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

# === Очистка ===

## Очистить артефакты сборки
clean:
	@cd frontend && if exist dist rmdir /s /q dist
	@if exist yappari-server del yappari-server
	@echo "✅ Артефакты сборки удалены"

## Полная очистка (включая зависимости)
clean-all: clean
	@cd frontend && if exist node_modules rmdir /s /q node_modules
	@echo "✅ Всё очищено"

.PHONY: dev build test test-sm2 test-db test-all fe-dev fe-dev fe-build fe-check fe-install fe-clean lint clean

# === Wails ===

dev:
	wails dev

build:
	wails build -clean -platform windows/amd64

# === Backend ===

test: test-sm2 test-db
	@echo "✅ Все тесты пройдены"

test-sm2:
	go test ./backend/sm2/ -v -count=1 -timeout 30s

test-db:
	go test ./backend/database/ -v -count=1 -timeout 30s

test-all:
	go test ./... -v -count=1 -timeout 60s

lint:
	golangci-lint run

clean:
	@if exist build rmdir /s /q build

# === Frontend ===

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

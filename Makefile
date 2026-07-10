.PHONY: dev build test test-sm2 test-db test-all lint clean

dev:
	wails dev

build:
	wails build -clean -platform windows/amd64

test: test-sm2
	@echo "✅ Все тесты пройдены"

test-sm2:
	go test ./sm2/ -v -count=1 -timeout 30s

test-db:
	go test ./db/ -v -count=1 -timeout 30s

test-all:
	go test ./... -v -count=1 -timeout 60s

lint:
	golangci-lint run

clean:
	@if exist build rmdir /s /q build

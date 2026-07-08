.PHONY: dev build test lint

dev:
	wails dev

build:
	wails build -clean -platform windows/amd64

test:
	go test ./...

lint:
	golangci-lint run

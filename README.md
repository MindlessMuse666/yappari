<div align="center">
  <img src="frontend/public/yappari_logo.png" alt="yappari_logo.png" width="200" height="200" />
   <h1>Yappari ⛩️</h1>
   <p><b><i>Веб-приложение для интервального повторения японских слов ٩(◕‿◕)۶</i></b></p>
   <a href="https://go.dev"><img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go" alt="Go" height="35"></a>
   <a href="https://gin-gonic.com"><img src="https://img.shields.io/badge/Gin-1.10-008ECF?style=for-the-badge&logo=go" alt="Gin" height="35"></a>
   <a href="https://vuejs.org"><img src="https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs" alt="Vue.js" height="35"></a>
   <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" height="35"></a>
   <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite" alt="SQLite" height="35"></a>
   <br/>
   <a href="https://render.com"><img src="https://img.shields.io/badge/Render-46E3B7?style=for-the-badge&logo=render&logoColor=000" alt="Render" height="35"></a>
   <a href="https://github.com/MindlessMuse666/yappari/blob/main/LICENSE.md"><img src="https://img.shields.io/badge/AGPLv3-yellow?style=for-the-badge&logo=readme&logoColor=white" alt="AGPL v3" height="35"></a>
</div>

---

## Общее описание

**Yappari** (яп. やっぱり — *«как и ожидалось», «всё-таки»*) — это веб-приложение для изучения японских слов методом интервального повторения по алгоритму SM-2. В отличие от десктопной версии на Wails, работает в браузере, поддерживает много пользователей и развёрнуто на Render.

> **Статус:** v1.0 — стабильный продакшн-релиз 🚀

---

## Возможности

| Функция | Описание |
| ------- | -------- |
| 🧠 **SM-2** | Алгоритм интервального повторения с ручной оценкой |
| 🗂️ **Колоды** | Создавай, редактируй и удаляй тематические наборы карточек |
| 🃏 **Карточки** | Японское слово + чтение каной + русский перевод |
| 🔐 **Мульти-пользователь** | Регистрация, JWT-аутентификация, каждому свои данные |
| 🔊 **Озвучка** | Браузерный Web Speech API + Google TTS (без серверной части) |
| 🎲 **Свободный режим** | Листай карточки без расписания. Есть автовоспроизведение! |
| 🌙 **Тёмная тема** | Чёрный фон, белый текст, акцентный красный `#ff0a14` |

---

## Скриншоты

> *Скриншоты будут добавлены позже.*

<details>
<summary>Главная страница / Список колод</summary>

<!-- TODO: добавить скриншот главной страницы -->
</details>

<details>
<summary>Управление колодой (CRUD карточек)</summary>

<!-- TODO: добавить скриншот управления колодой -->
</details>

<details>
<summary>Тренировка (флип-карточки)</summary>

<!-- TODO: добавить скриншот тренировки -->
</details>

<details>
<summary>Авторизация (вход / регистрация)</summary>

<!-- TODO: добавить скриншот логина -->
</details>

---

## Стек технологий

### Backend

- **Go 1.25+** — бизнес-логика, HTTP API, SM-2
- **Gin** — HTTP-роутер
- **SQLite** (via `modernc.org/sqlite` — без CGO!)
- **JWT** (HS256) — аутентификация

### Frontend

- **Vue.js 3** + **TypeScript** (Composition API, `<script setup>`)
- **PrimeVue 4** (Dialog, Button, Input)
- **Inter** + **Noto Sans JP** (локальные шрифты)
- **Vite** — сборка

### Хостинг

- **Render** — Docker-контейнер, persistent disk для SQLite

---

## Быстрый старт (разработка)

### Требования

- Go 1.25+
- Node.js 18+

### Шаги запуска

```bash
# 1. Склонируй репозиторий
git clone https://github.com/MindlessMuse666/yappari.git
cd yappari

# 2. Установи зависимости фронтенда
cd frontend
npm install
cd ..

# 3. Запусти Go-сервер (порт 8080)
go run ./backend/cmd/server &

# 4. Запусти frontend dev-сервер (порт 5173, прокси на 8080)
cd frontend
npm run dev
```

Открой `http://localhost:5173` в браузере.

### Сборка

```bash
# Go-бинарник
CGO_ENABLED=0 go build -o yappari-server ./backend/cmd/server

# Frontend
cd frontend && npm run build
```

---

## API Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/decks` | Список колод |
| POST | `/api/decks` | Создать колоду |
| PUT | `/api/decks/:id` | Обновить колоду |
| DELETE | `/api/decks/:id` | Удалить колоду |
| GET | `/api/decks/:id/cards` | Карточки колоды |
| POST | `/api/decks/:id/cards` | Создать карточку |
| PUT | `/api/cards/:id` | Обновить карточку |
| DELETE | `/api/cards/:id` | Удалить карточку |
| GET | `/api/training` | Карточки для тренировки |
| POST | `/api/training/review` | Оценка карточки (SM-2) |
| POST | `/api/training/reset-deck/:id` | Сброс прогресса колоды |

Все эндпоинты (кроме `/api/auth/*`) требуют заголовок `Authorization: Bearer <token>`.

---

## Разработка

### Структура проекта

```text
yappari/
├── backend/
│   ├── cmd/server/       # точка входа HTTP-сервера (Gin)
│   ├── handlers/         # HTTP-обработчики
│   ├── database/         # SQLite: модели, CRUD, миграции
│   ├── auth/             # JWT-генерация и валидация
│   └── sm2/              # алгоритм SM-2
├── frontend/
│   ├── src/
│   │   ├── views/        # Home, DeckManage, Training, Login, Register
│   │   ├── components/   # FuriganaText, CustomAlert
│   │   ├── composables/  # API-вызовы, TTS, звуки
│   │   └── router/       # Vue Router + auth guard
│   ├── public/fonts/     # Inter + Noto Sans JP
│   └── Dockerfile        # multi-stage сборка
├── Dockerfile            # production-контейнер
└── render.yaml           # Render Blueprint
```

### Команды

| Команда | Описание |
| ------- | -------- |
| `go run ./backend/cmd/server` | Запуск Go-сервера (порт 8080) |
| `cd frontend && npm run dev` | Frontend dev (порт 5173, прокси на 8080) |
| `cd frontend && npm run build` | Продакшн-сборка фронта |
| `cd frontend && npm run typecheck` | Проверка TypeScript |
| `go test ./...` | Тесты бэкенда |

---

## Деплой (Render)

Приложение развёрнуто на Render через Docker.

- **Dockerfile**: multi-stage (alpine, ~15MB финальный образ)
- **Persistent disk**: `/app/data` → SQLite
- **Free tier**: 512MB RAM, 1GB disk
- **JWT_SECRET**: генерируется автоматически, задаётся через Dashboard

Для собственного деплоя:

1. Форкни репозиторий
2. Создай Web Service на Render, подключи репозиторий
3. Укажи `Dockerfile` как путь сборки
4. Добавь persistent disk, смонтируй в `/app/data`
5. Задеплой — готово ✨

---

## Безопасность

- Пароли: bcrypt (DefaultCost)
- JWT: HS256, 72h expiry
- SQL-инъекции невозможны — только параметризованные запросы
- TTS: только браузерный Web Speech API, данные не покидают клиент

---

## Лицензия

Проект распространяется под лицензией [GNU AGPL v3](LICENSE.md).

---

<div align="center">
  <img src="frontend/public/yappari_logo.png" alt="yappari_logo.png" width="100" height="100" />
  <br>
  <sub><b>Yappari // Интервальное повторение японских слов</b></sub>
  <br>
  <sup><i>made with ❤️ by <a href="https://github.com/MindlessMuse666" target="_blank">MindlessMuse666</a></i></sup>
</div>

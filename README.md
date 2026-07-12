<div align="center">
  <img src="frontend/public/yappari_logo.png" alt="yappari_logo.png" width="200" height="200" />
   <h1>Yappari ⛩️</h1>
   <p><b><i>Десктоп-приложение для интервального повторения японских слов ٩(◕‿◕)۶</i></b></p>
   <a href="https://go.dev"><img src="https://img.shields.io/badge/Go-1.25+-00ADD8?style=for-the-badge&logo=go" alt="Go" height="35"></a>
   <a href="https://wails.io"><img src="https://img.shields.io/badge/Wails-2.13-DF0000?style=for-the-badge&logo=wails" alt="Wails" height="35"></a>
   <a href="https://vuejs.org"><img src="https://img.shields.io/badge/Vue.js-3.5-4FC08D?style=for-the-badge&logo=vuedotjs" alt="Vue.js" height="35"></a>
   <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" height="35"></a>
   <a href="https://www.sqlite.org/"><img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite" alt="SQLite" height="35"></a>
   <br/>
   <a href="https://github.com/MindlessMuse666/yappari/blob/main/LICENSE.md"><img src="https://img.shields.io/badge/AGPLv3-yellow?style=for-the-badge&logo=readme&logoColor=white" alt="AGPL v3" height="35"></a>
   <a href="https://www.microsoft.com/windows"><img src="https://img.shields.io/badge/Windows%2011-0078D4?style=for-the-badge&logo=windows" alt="Windows 11" height="35"></a>
</div>

---

## Общее описание

**Yappari** (яп. やっぱり — *«как и ожидалось», «всё-таки»*) — это десктопное приложение для изучения японских слов методом интервального повторения. Всё локально, никаких аккаунтов и облаков ✨

Проект родился из желания иметь лёгкое, быстрое и красивое приложение для себя и своих близких, чтобы удобно заучивать японскую лексику.

> **Статус:** Версия v1.2-beta — стабильный релиз, хотя и возможны незначительные баги XD
>
> Есть также **веб-версия** приложения (Go + Vue + TypeScript + CSS): [yappari-web](https://github.com/MindlessMuse666/yappari-web)

<details open>
   <summary><b>Нажмите, чтобы скрыть/показать скриншоты</b></summary>
   <table>
     <tr>
       <td align="center"><img src="docs/screenshots/main_view.png" alt="Главная страница" width="350"><br><sub><i>Рис 1. Главная страница: выбор колод и режима</i></sub></td>
       <td align="center"><img src="docs/screenshots/deck_manage_view.png" alt="Управление колодой" width="350"><br><sub><i>Рис 2. Управление колодой: просмотр и редактирование</i></sub></td>
     </tr>
     <tr>
       <td align="center"><img src="docs/screenshots/traning_mode_view.png" alt="Режим тренировки" width="350"><br><sub><i>Рис 3. Интервальное повторение: оценка карточки</i></sub></td>
       <td align="center"><img src="docs/screenshots/free_mode_view.png" alt="Свободный режим" width="350"><br><sub><i>Рис 4. Свободный режим: автовоспроизведение</i></sub></td>
     </tr>
     <tr>
       <td colspan="2" align="center">
         <b>Модальные окна:</b><br><br>
         <img src="docs/screenshots/modal_views/create_deck_modal.png" alt="Создание колоды" width="200">
         <img src="docs/screenshots/modal_views/create_card_modal.png" alt="Создание карточки" width="200">
         <img src="docs/screenshots/modal_views/delete_deck_modal.png" alt="Удаление колоды" width="200">
         <img src="docs/screenshots/modal_views/delete_card_modal.png" alt="Удаление карточки" width="200">
         <img src="docs/screenshots/modal_views/reset_progress_modal.png" alt="Сброс прогресса" width="200">
         <br><sub><i>Рис 5. Модальные окна: создание, удаление, сброс</i></sub>
       </td>
     </tr>
   </table>
</details>

---

## Возможности

| Функция | Описание |
| ------- | -------- |
| 🧠 **SM-2** | Алгоритм интервального повторения с ручной оценкой (1-4) |
| 🗂️ **Колоды** | Создавай, редактируй и удаляй тематические наборы карточек |
| 🃏 **Карточки** | Японское слово + чтение каной + русский перевод |
| 🔊 **Озвучка** | Встроенный офлайн TTS: Silero (русский) + Kokoro (японский). Первый запуск — с интернетом, затем полностью офлайн |
| 🎲 **Свободный режим** | Листай карточки без расписания. Есть автовоспроизведение! |
| ⌨️ **Хоткеи** | Полное управление с клавиатуры (см. таблицу ниже) |
| 🌙 **Тёмная тема** | Чёрный фон, белый текст, акцентный красный `#ff0a14`. Анимированные орбы на фоне |
| 🎬 **Анимации** | Плавная смена карточек, flip-эффект, skeleton-загрузка, confetti при завершении |
| 🖥️ **Полный экран** | Переключение по `F` или через профиль-поповер |

### Хоткеи

| Клавиша | Действие | Страница |
| ------- | -------- | -------- |
| `N` | Создать колоду | Главная |
| `A` | Выбрать все / сбросить | Главная |
| `Q` | Новая карточка | Управление колодой |
| `W` | Автовоспроизведение | Тренировка |
| `Space` | Показать ответ | Тренировка |
| `1` `2` `3` `4` | Оценка карточки (SM-2) | Тренировка |
| `Esc` | Назад / Выход | Все страницы |
| `F` | Полный экран / Окно | Все страницы |

---

## Стек технологий

### Backend

- **Go 1.25+** — бизнес-логика, SM-2, IPC с WebView2
- **SQLite** (via `modernc.org/sqlite` — без CGO!)
- **Silero TTS** (русский) + **Kokoro TTS** (японский) — встроенные офлайн-модели синтеза речи через управляемый Python-подпроцесс

### Frontend

- **Vue.js 3** + **TypeScript**
- **PrimeVue 4** (Dialog, Button, Input, ProgressBar)
- **Inter** + **Noto Sans JP** (локальные шрифты)
- **canvas-confetti** для анимации

### Desktop

- **Wails v2** (Go + WebView2)

---

## Быстрый старт

### Требования

- Windows 10/11 (с WebView2 Runtime)
- Go 1.25+
- Node.js 18+
- Python 3.9+ (для встроенного TTS — устанавливается автоматически при первом запуске)

> **Озвучка:** При первом запуске приложение создаёт Python-окружение и скачивает модели Silero (русский, ~30MB) и Kokoro (японский, ~300-500MB). Требуется интернет. Последующие запуски — полностью офлайн. Процесс автоматический — не требует ручной установки.

### Шаги запуска

```bash
# 1. Склонируй репозиторий
git clone https://github.com/MindlessMuse666/yappari.git
cd yappari

# 2. Установи зависимости фронтенда
cd frontend
npm install
cd ..

# 3. (Опционально) Установи TTS-окружение
make install-tts
#    или вручную:
#    python backend/tts/python/setup_tts.py

# 4. Запусти в режиме разработки
wails dev
```

### Сборка

```bash
wails build -clean -platform windows/amd64
```

Готовый `.exe` появится в папке `build/bin/`.

---

## Разработка

### Структура проекта

```text
yappari/
├── main.go              # точка входа Wails
├── app.go               # IPC-методы
├── backend/
│   ├── database/        # SQLite: модели, CRUD, миграции
│   ├── sm2/             # алгоритм SM-2
│   └── tts/             # Python-подпроцесс Silero + Kokoro TTS
│       └── python/      # tts_server.py, silero_handler.py, kokoro_handler.py
├── frontend/            # Vue.js приложение
│   ├── src/
│   │   ├── views/       # Home, DeckManage, Training
│   │   ├── components/  # KanaText, CustomAlert, TtsStatus
│   │   ├── composables/ # IPC-вызовы + моки
│   │   └── router/      # Vue Router
│   └── public/fonts/    # Inter + Noto Sans JP
└── docs/                # документация
```

### Команды

| Команда | Описание |
| ------- | -------- |
| `wails dev` | Запуск в режиме разработки (hot-reload) |
| `wails build` | Продакшн-сборка |
| `go test ./...` | Запуск тестов Go |
| `ruff check backend/tts/python/` | Линтинг Python-кода |
| `golangci-lint run ./...` | Линтинг Go-кода |

---

## Веб-версия

Существует также **веб-версия** Yappari: [yappari-web](https://github.com/MindlessMuse666/yappari-web).

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

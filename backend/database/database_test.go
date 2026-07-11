package database

import (
	"testing"
)

// testUserID — ID тестового пользователя, создаваемого в setupTestDB.
var testUserID int

// setupTestDB инициализирует БД в памяти для тестов и создаёт тестового пользователя.
func setupTestDB(t *testing.T) {
	t.Helper()
	if err := InitDB(":memory:"); err != nil {
		t.Fatalf("не удалось инициализировать БД: %v", err)
	}

	// Создаём тестового пользователя (bcrypt дорогой, используем заранее готовый хеш)
	user, err := CreateUser("test@example.com", "$2a$10$dummy_hash_for_testing_purposes_only")
	if err != nil {
		t.Fatalf("не удалось создать тестового пользователя: %v", err)
	}
	testUserID = user.ID
}

// cleanupTestDB закрывает БД после теста.
func cleanupTestDB(t *testing.T) {
	t.Helper()
	testUserID = 0
	if err := CloseDB(); err != nil {
		t.Errorf("не удалось закрыть БД: %v", err)
	}
}

func TestInitDB_InMemory(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	// Проверяем, что таблицы созданы — пытаемся вставить данные
	deck, err := CreateDeck("тестовая колода", testUserID)
	if err != nil {
		t.Fatalf("не удалось создать колоду после миграции: %v", err)
	}
	if deck.Name != "тестовая колода" {
		t.Errorf("ожидалось имя 'тестовая колода', получено '%s'", deck.Name)
	}
	if deck.ID == 0 {
		t.Errorf("ожидался непустой ID колоды")
	}
}

// ---- CRUD колод ----

func TestCreateAndGetDecks(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	// Создаём колоду
	deck, err := CreateDeck("моя колода", testUserID)
	if err != nil {
		t.Fatalf("не удалось создать колоду: %v", err)
	}
	if deck.Name != "моя колода" {
		t.Errorf("ожидалось имя 'моя колода', получено '%s'", deck.Name)
	}
	if deck.CreatedAt == "" {
		t.Error("ожидалась непустая дата создания")
	}

	// Получаем список колод
	decks, err := GetDecks(testUserID)
	if err != nil {
		t.Fatalf("не удалось получить колоды: %v", err)
	}
	if len(decks) != 1 {
		t.Fatalf("ожидалась 1 колода, получено %d", len(decks))
	}
	if decks[0].Name != "моя колода" {
		t.Errorf("ожидалось имя 'моя колода', получено '%s'", decks[0].Name)
	}
}

func TestUpdateDeck(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, err := CreateDeck("старое имя", testUserID)
	if err != nil {
		t.Fatalf("не удалось создать колоду: %v", err)
	}

	err = UpdateDeck(deck.ID, testUserID, "новое имя")
	if err != nil {
		t.Fatalf("не удалось обновить колоду: %v", err)
	}

	decks, _ := GetDecks(testUserID)
	if decks[0].Name != "новое имя" {
		t.Errorf("ожидалось имя 'новое имя', получено '%s'", decks[0].Name)
	}
}

func TestDeleteDeck(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, err := CreateDeck("для удаления", testUserID)
	if err != nil {
		t.Fatalf("не удалось создать колоду: %v", err)
	}

	err = DeleteDeck(deck.ID, testUserID)
	if err != nil {
		t.Fatalf("не удалось удалить колоду: %v", err)
	}

	decks, _ := GetDecks(testUserID)
	if len(decks) != 0 {
		t.Errorf("ожидалось 0 колод после удаления, получено %d", len(decks))
	}
}

func TestDeleteDeck_NotFound(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	err := DeleteDeck(999, testUserID)
	if err == nil {
		t.Error("ожидалась ошибка при удалении несуществующей колоды")
	}
}

// ---- CRUD карточек ----

func TestCreateAndGetCards(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	// Создаём колоду
	deck, err := CreateDeck("тестовая", testUserID)
	if err != nil {
		t.Fatalf("не удалось создать колоду: %v", err)
	}

	// Создаём карточку
	furigana := "たべる"
	input := CardInput{
		DeckID:       deck.ID,
		KanjiText:    "食べる",
		FuriganaText: &furigana,
		Translation:  "есть, кушать",
	}

	card, err := CreateCard(input)
	if err != nil {
		t.Fatalf("не удалось создать карточку: %v", err)
	}

	if card.KanjiText != "食べる" {
		t.Errorf("ожидался kanji_text '食べる', получен '%s'", card.KanjiText)
	}
	if card.Translation != "есть, кушать" {
		t.Errorf("ожидался перевод 'есть, кушать', получен '%s'", card.Translation)
	}
	if card.EaseFactor != 2.5 {
		t.Errorf("ожидался EF=2.5, получен %.2f", card.EaseFactor)
	}
	if card.Interval != 0 {
		t.Errorf("ожидался interval=0, получен %d", card.Interval)
	}

	// Получаем карточки колоды
	cards, err := GetCardsByDeck(deck.ID, testUserID)
	if err != nil {
		t.Fatalf("не удалось получить карточки: %v", err)
	}
	if len(cards) != 1 {
		t.Fatalf("ожидалась 1 карточка, получено %d", len(cards))
	}
}

func TestUpdateCard(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)
	card, _ := CreateCard(CardInput{
		DeckID:      deck.ID,
		KanjiText:   "古い",
		Translation: "старый",
	})

	newFurigana := "ふるい"
	err := UpdateCard(card.ID, CardInput{
		DeckID:       deck.ID,
		KanjiText:    "古い",
		FuriganaText: &newFurigana,
		Translation:  "старый (о вещах)",
	})
	if err != nil {
		t.Fatalf("не удалось обновить карточку: %v", err)
	}

	updated, err := GetCardByID(card.ID)
	if err != nil {
		t.Fatalf("не удалось получить обновлённую карточку: %v", err)
	}
	if updated.Translation != "старый (о вещах)" {
		t.Errorf("ожидался перевод 'старый (о вещах)', получен '%s'", updated.Translation)
	}
	if updated.FuriganaText == nil || *updated.FuriganaText != "ふるい" {
		t.Errorf("ожидалась фуригана 'ふるい', получена %v", updated.FuriganaText)
	}
}

func TestDeleteCard(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)
	card, _ := CreateCard(CardInput{
		DeckID:      deck.ID,
		KanjiText:   "test",
		Translation: "тест",
	})

	err := DeleteCard(card.ID)
	if err != nil {
		t.Fatalf("не удалось удалить карточку: %v", err)
	}

	cards, _ := GetCardsByDeck(deck.ID, testUserID)
	if len(cards) != 0 {
		t.Errorf("ожидалось 0 карточек после удаления, получено %d", len(cards))
	}
}

func TestDeleteCard_NotFound(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	err := DeleteCard(999)
	if err == nil {
		t.Error("ожидалась ошибка при удалении несуществующей карточки")
	}
}

// ---- Тренировка ----

func TestGetTrainingCards_FreeMode(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)
	_, _ = CreateCard(CardInput{DeckID: deck.ID, KanjiText: "猫", Translation: "кот"})
	_, _ = CreateCard(CardInput{DeckID: deck.ID, KanjiText: "犬", Translation: "собака"})

	cards, err := GetTrainingCards("free", []int{deck.ID}, testUserID)
	if err != nil {
		t.Fatalf("не удалось получить карточки тренировки: %v", err)
	}
	if len(cards) != 2 {
		t.Errorf("ожидалось 2 карточки в свободном режиме, получено %d", len(cards))
	}
}

func TestGetTrainingCards_IntervalMode(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)

	// Первая карточка — новая, next_review = сейчас (доступна)
	card1, _ := CreateCard(CardInput{DeckID: deck.ID, KanjiText: "猫", Translation: "кот"})

	// Вторая карточка — тоже новая (доступна)
	_, _ = CreateCard(CardInput{DeckID: deck.ID, KanjiText: "犬", Translation: "собака"})

	// Сбрасываем прогресс первой — next_review = сейчас
	_ = ResetCardProgress(card1.ID, testUserID)

	cards, err := GetTrainingCards("interval", []int{deck.ID}, testUserID)
	if err != nil {
		t.Fatalf("не удалось получить карточки для интервального режима: %v", err)
	}

	// Обе карточки доступны (next_review <= now)
	if len(cards) == 0 {
		t.Error("ожидались карточки для интервального режима, получено 0")
	}
}

func TestGetTrainingCards_EmptyDeckIDs(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	cards, err := GetTrainingCards("free", []int{}, testUserID)
	if err != nil {
		t.Fatalf("не удалось получить карточки с пустым списком колод: %v", err)
	}
	if len(cards) != 0 {
		t.Errorf("ожидалось 0 карточек, получено %d", len(cards))
	}
}

// ---- SM-2: SubmitReview ----

func TestSubmitReview_Success(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)
	card, _ := CreateCard(CardInput{DeckID: deck.ID, KanjiText: "勉強", Translation: "учёба"})

	// Отвечаем "хорошо" (grade 4)
	updated, err := SubmitReview(card.ID, 4, testUserID)
	if err != nil {
		t.Fatalf("не удалось выполнить обзор: %v", err)
	}

	if updated.Repetitions != 1 {
		t.Errorf("ожидались repetitions=1, получены %d", updated.Repetitions)
	}
	if updated.Interval != 1 {
		t.Errorf("ожидался interval=1, получен %d", updated.Interval)
	}
	if updated.EaseFactor != 2.5 {
		t.Errorf("ожидался EF=2.5, получен %.2f", updated.EaseFactor)
	}
	if updated.LastReview == nil || *updated.LastReview == "" {
		t.Error("ожидалась непустая дата последнего обзора")
	}
}

func TestSubmitReview_Fail(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)
	card, _ := CreateCard(CardInput{DeckID: deck.ID, KanjiText: "難しい", Translation: "сложный"})

	// Отвечаем "перезаучивание" (grade 0)
	updated, err := SubmitReview(card.ID, 0, testUserID)
	if err != nil {
		t.Fatalf("не удалось выполнить обзор: %v", err)
	}

	if updated.Repetitions != 0 {
		t.Errorf("ожидались repetitions=0 после провала, получены %d", updated.Repetitions)
	}
	if updated.Interval != 1 {
		t.Errorf("ожидался interval=1 после провала, получен %d", updated.Interval)
	}
}

func TestSubmitReview_InvalidGrade(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	_, err := SubmitReview(1, 2, testUserID)
	if err == nil {
		t.Error("ожидалась ошибка при недопустимой оценке")
	}
}

// ---- Сброс прогресса ----

func TestResetCardProgress(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)
	card, _ := CreateCard(CardInput{DeckID: deck.ID, KanjiText: "テスト", Translation: "тест"})

	// Сначала делаем обзор, чтобы изменить SM-2 поля
	_, _ = SubmitReview(card.ID, 4, testUserID)

	// Сбрасываем прогресс
	err := ResetCardProgress(card.ID, testUserID)
	if err != nil {
		t.Fatalf("не удалось сбросить прогресс карточки: %v", err)
	}

	reset, _ := GetCardByID(card.ID)
	if reset.EaseFactor != 2.5 {
		t.Errorf("ожидался EF=2.5 после сброса, получен %.2f", reset.EaseFactor)
	}
	if reset.Interval != 0 {
		t.Errorf("ожидался interval=0 после сброса, получен %d", reset.Interval)
	}
	if reset.Repetitions != 0 {
		t.Errorf("ожидались repetitions=0 после сброса, получены %d", reset.Repetitions)
	}
}

func TestResetDeckProgress(t *testing.T) {
	setupTestDB(t)
	defer cleanupTestDB(t)

	deck, _ := CreateDeck("тестовая", testUserID)
	card1, _ := CreateCard(CardInput{DeckID: deck.ID, KanjiText: "A", Translation: "а"})
	card2, _ := CreateCard(CardInput{DeckID: deck.ID, KanjiText: "B", Translation: "б"})

	_, _ = SubmitReview(card1.ID, 4, testUserID)
	_, _ = SubmitReview(card2.ID, 5, testUserID)

	err := ResetDeckProgress(deck.ID, testUserID)
	if err != nil {
		t.Fatalf("не удалось сбросить прогресс колоды: %v", err)
	}

	cards, _ := GetCardsByDeck(deck.ID, testUserID)
	for _, c := range cards {
		if c.Repetitions != 0 {
			t.Errorf("ожидались repetitions=0 для карточки %d, получены %d", c.ID, c.Repetitions)
		}
	}
}

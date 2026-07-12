package sm2

import (
	"math"
	"testing"
	"time"
)

// withinTolerance проверяет равенство float64 с допуском.
func withinTolerance(a, b, eps float64) bool {
	return math.Abs(a-b) <= eps
}

// ---- Calculate: репетиции ----

func TestCalculate_NewCard_Grade4(t *testing.T) {
	// Новая карточка (repetitions=0), первый успешный ответ
	now := time.Now()
	result := Calculate(2.5, 0, 0, 4, now)

	if result.Interval != 1 {
		t.Errorf("ожидался interval=1, получен %d", result.Interval)
	}
	if result.Repetitions != 1 {
		t.Errorf("ожидались repetitions=1, получены %d", result.Repetitions)
	}
	// Grade 4: EF не меняется (0.1 - 1*(0.08+1*0.02) = 0.0)
	if result.EaseFactor != 2.5 {
		t.Errorf("ожидался EF=2.5, получен %.4f", result.EaseFactor)
	}
	checkNextReview(t, result.NextReview, 1, now)
}

func TestCalculate_NewCard_Grade3(t *testing.T) {
	// Новая карточка, ответ "трудно"
	now := time.Now()
	result := Calculate(2.5, 0, 0, 3, now)

	if result.Interval != 1 {
		t.Errorf("ожидался interval=1, получен %d", result.Interval)
	}
	if result.Repetitions != 1 {
		t.Errorf("ожидались repetitions=1, получены %d", result.Repetitions)
	}
	// EF: 2.5 + (0.1 - 2*(0.08+2*0.02)) = 2.5 + (0.1 - 0.24) = 2.36
	expectedEF := 2.36
	if !withinTolerance(result.EaseFactor, expectedEF, 1e-9) {
		t.Errorf("ожидался EF≈%.10f, получен %.10f", expectedEF, result.EaseFactor)
	}
	checkNextReview(t, result.NextReview, 1, now)
}

func TestCalculate_NewCard_Grade5(t *testing.T) {
	// Новая карточка, ответ "легко"
	now := time.Now()
	result := Calculate(2.5, 0, 0, 5, now)

	if result.Interval != 1 {
		t.Errorf("ожидался interval=1, получен %d", result.Interval)
	}
	if result.Repetitions != 1 {
		t.Errorf("ожидались repetitions=1, получены %d", result.Repetitions)
	}
	// EF: 2.5 + 0.1 = 2.6
	if !withinTolerance(result.EaseFactor, 2.6, 1e-9) {
		t.Errorf("ожидался EF≈2.6, получен %.10f", result.EaseFactor)
	}
	checkNextReview(t, result.NextReview, 1, now)
}

func TestCalculate_SecondRepetition(t *testing.T) {
	// Вторая репетиция (repetitions=1, interval=1)
	now := time.Now()
	result := Calculate(2.5, 1, 1, 4, now)

	if result.Interval != 6 {
		t.Errorf("ожидался interval=6, получен %d", result.Interval)
	}
	if result.Repetitions != 2 {
		t.Errorf("ожидались repetitions=2, получены %d", result.Repetitions)
	}
	checkNextReview(t, result.NextReview, 6, now)
}

func TestCalculate_ThirdRepetition(t *testing.T) {
	// Третья репетиция — interval умножается на EF
	now := time.Now()
	result := Calculate(2.5, 6, 2, 4, now)

	// 2.5 * 6 = 15.0 — точное float64, округление не искажает
	expectedInterval := 15
	if result.Interval != expectedInterval {
		t.Errorf("ожидался interval=%d, получен %d", expectedInterval, result.Interval)
	}
	if result.Repetitions != 3 {
		t.Errorf("ожидались repetitions=3, получены %d", result.Repetitions)
	}
	checkNextReview(t, result.NextReview, expectedInterval, now)
}

func TestCalculate_IntervalRounding(t *testing.T) {
	// Проверка округления interval: round(7 * 2.5) = round(17.5) = 18
	now := time.Now()
	result := Calculate(2.5, 7, 2, 4, now)
	if result.Interval != 18 {
		t.Errorf("ожидался interval=18 (round(17.5)), получен %d", result.Interval)
	}
}

func TestCalculate_IntervalRoundingDown(t *testing.T) {
	// round(7 * 2.4) = round(16.8) = 17
	now := time.Now()
	result := Calculate(2.4, 7, 2, 5, now)
	if result.Interval != 17 {
		t.Errorf("ожидался interval=17 (round(16.8)), получен %d", result.Interval)
	}
}

// ---- Calculate: провал карточки ----

func TestCalculate_FailedCard_Grade0(t *testing.T) {
	// Карточка с прогрессом провалена
	now := time.Now()
	result := Calculate(2.5, 15, 3, 0, now)

	if result.Interval != 1 {
		t.Errorf("ожидался interval=1 после провала, получен %d", result.Interval)
	}
	if result.Repetitions != 0 {
		t.Errorf("ожидались repetitions=0 после провала, получены %d", result.Repetitions)
	}
	// EF: 2.5 + (0.1 - 5*(0.08+5*0.02)) = 2.5 + (0.1 - 0.9) = 1.7
	expectedEF := 1.7
	if !withinTolerance(result.EaseFactor, expectedEF, 1e-9) {
		t.Errorf("ожидался EF≈%.10f, получен %.10f", expectedEF, result.EaseFactor)
	}
	checkNextReview(t, result.NextReview, 1, now)
}

// ---- EF Floor ----

func TestCalculate_EF_Floor(t *testing.T) {
	// Многократные провалы не должны опустить EF ниже 1.3
	now := time.Now()
	ef := 2.5
	for i := 0; i < 20; i++ {
		result := Calculate(ef, 0, 0, 0, now)
		ef = result.EaseFactor
		if ef < 1.3 {
			t.Fatalf("EF опустился ниже 1.3 на итерации %d: %.6f", i, ef)
		}
	}
	// Должен сойтись к 1.3
	if !withinTolerance(ef, 1.3, 1e-9) {
		t.Errorf("ожидался EF=1.3 после множества провалов, получен %.10f", ef)
	}
}

// ---- EF: точные математические значения ----

func TestCalculate_EF_Grade3(t *testing.T) {
	// Grade 3: EF -= 0.14 (для начального EF=2.5 -> 2.36)
	now := time.Now()
	result := Calculate(2.5, 0, 0, 3, now)
	expectedEF := 2.5 + (0.1 - float64(5-3)*(0.08+float64(5-3)*0.02))
	if !withinTolerance(result.EaseFactor, expectedEF, 1e-9) {
		t.Errorf("ожидался EF≈%.10f, получен %.10f", expectedEF, result.EaseFactor)
	}
}

func TestCalculate_EF_Grade4(t *testing.T) {
	// Grade 4: EF не меняется
	now := time.Now()
	cases := []struct {
		startEF float64
	}{
		{1.3},
		{2.5},
		{3.0},
	}
	for _, tc := range cases {
		result := Calculate(tc.startEF, 0, 0, 4, now)
		if !withinTolerance(result.EaseFactor, tc.startEF, 1e-9) {
			t.Errorf("для начального EF=%.2f ожидался EF=%.2f, получен %.10f",
				tc.startEF, tc.startEF, result.EaseFactor)
		}
	}
}

func TestCalculate_EF_Grade5(t *testing.T) {
	// Grade 5: EF += 0.1
	now := time.Now()
	result := Calculate(2.0, 6, 2, 5, now)
	if !withinTolerance(result.EaseFactor, 2.1, 1e-9) {
		t.Errorf("ожидался EF≈2.1, получен %.10f", result.EaseFactor)
	}
}

// ---- ValidateGrade ----

func TestValidateGrade_Valid(t *testing.T) {
	validGrades := []int{0, 3, 4, 5}
	for _, g := range validGrades {
		if err := ValidateGrade(g); err != nil {
			t.Errorf("ожидался nil для grade=%d, получена ошибка: %v", g, err)
		}
	}
}

func TestValidateGrade_Invalid(t *testing.T) {
	invalidGrades := []int{-1, 1, 2, 6, 100}
	for _, g := range invalidGrades {
		if err := ValidateGrade(g); err == nil {
			t.Errorf("ожидалась ошибка для grade=%d, получен nil", g)
		}
	}
}

func TestValidateGrade_ErrorMessage(t *testing.T) {
	err := ValidateGrade(2)
	if err == nil {
		t.Fatal("ожидалась ошибка для grade=2")
	}
	expected := "недопустимая оценка: 2, допустимые значения: 0, 3, 4, 5"
	if err.Error() != expected {
		t.Errorf("ожидалось сообщение %q, получено %q", expected, err.Error())
	}
}

// ---- Reset ----

func TestReset_DefaultValues(t *testing.T) {
	result := Reset()

	if result.EaseFactor != 2.5 {
		t.Errorf("ожидался EF=2.5, получен %.2f", result.EaseFactor)
	}
	if result.Interval != 0 {
		t.Errorf("ожидался interval=0, получен %d", result.Interval)
	}
	if result.Repetitions != 0 {
		t.Errorf("ожидались repetitions=0, получены %d", result.Repetitions)
	}
	// NextReview должен быть сейчас (±2 сек)
	parsed, err := time.Parse(time.RFC3339, result.NextReview)
	if err != nil {
		t.Fatalf("невалидный next_review: %v", err)
	}
	diff := time.Since(parsed)
	if diff > 2*time.Second || diff < -2*time.Second {
		t.Errorf("next_review должен быть близок к now, разница: %v", diff)
	}
}

// ---- Интеграционная проверка: полный цикл жизни карточки ----

func TestCalculate_FullLifecycle(t *testing.T) {
	// Симулируем нормальную жизнь карточки
	now := time.Now()

	// Шаг 1: создана, первый ответ — "легко" (grade 5)
	r1 := Calculate(2.5, 0, 0, 5, now)
	if r1.Interval != 1 || r1.Repetitions != 1 || !withinTolerance(r1.EaseFactor, 2.6, 1e-9) {
		t.Fatalf("шаг 1 неожиданный результат: interval=%d, rep=%d, EF=%.10f",
			r1.Interval, r1.Repetitions, r1.EaseFactor)
	}

	// Шаг 2: второй ответ — "хорошо" (grade 4)
	r2 := Calculate(r1.EaseFactor, r1.Interval, r1.Repetitions, 4, now)
	if r2.Interval != 6 || r2.Repetitions != 2 || !withinTolerance(r2.EaseFactor, 2.6, 1e-9) {
		t.Fatalf("шаг 2 неожиданный результат: interval=%d, rep=%d, EF=%.10f",
			r2.Interval, r2.Repetitions, r2.EaseFactor)
	}

	// Шаг 3: третий ответ — "хорошо" (grade 4) — interval * EF
	r3 := Calculate(r2.EaseFactor, r2.Interval, r2.Repetitions, 4, now)
	expectedInterval3 := int(math.Round(float64(r2.Interval) * r2.EaseFactor))
	if r3.Interval != expectedInterval3 || r3.Repetitions != 3 || !withinTolerance(r3.EaseFactor, 2.6, 1e-9) {
		t.Fatalf("шаг 3 неожиданный результат: interval=%d (ожидался %d), rep=%d, EF=%.10f",
			r3.Interval, expectedInterval3, r3.Repetitions, r3.EaseFactor)
	}

	// Шаг 4: провал (grade 0) — сброс
	r4 := Calculate(r3.EaseFactor, r3.Interval, r3.Repetitions, 0, now)
	if r4.Interval != 1 || r4.Repetitions != 0 {
		t.Fatalf("шаг 4 (провал) неожиданный результат: interval=%d, rep=%d",
			r4.Interval, r4.Repetitions)
	}

	// Шаг 5: снова успех после провала
	r5 := Calculate(r4.EaseFactor, r4.Interval, r4.Repetitions, 5, now)
	if r5.Interval != 1 || r5.Repetitions != 1 {
		t.Fatalf("шаг 5 неожиданный результат: interval=%d, rep=%d",
			r5.Interval, r5.Repetitions)
	}
	if !withinTolerance(r5.EaseFactor, r4.EaseFactor+0.1, 1e-9) {
		t.Errorf("шаг 5: ожидался EF≈%.10f, получен %.10f", r4.EaseFactor+0.1, r5.EaseFactor)
	}
}

// ---- Краевые случаи ----

func TestCalculate_MinEF(t *testing.T) {
	// Минимальный EF (1.3) с grade 5 должен увеличиться
	now := time.Now()
	result := Calculate(1.3, 1, 1, 5, now)
	if !withinTolerance(result.EaseFactor, 1.4, 1e-9) {
		t.Errorf("ожидался EF≈1.4, получен %.10f", result.EaseFactor)
	}
}

func TestCalculate_MinEFWithGrade3(t *testing.T) {
	// Минимальный EF (1.3) с grade 3: 1.3 - 0.14 = 1.16 -> floor 1.3
	now := time.Now()
	result := Calculate(1.3, 0, 0, 3, now)
	if !withinTolerance(result.EaseFactor, 1.3, 1e-9) {
		t.Errorf("ожидался EF=1.3 (floor), получен %.10f", result.EaseFactor)
	}
}

func TestCalculate_ZeroIntervalAtThirdRep(t *testing.T) {
	// Если interval=0 на третьей репетиции (red flag), то round(0 * EF) = 0
	now := time.Now()
	result := Calculate(2.5, 0, 2, 5, now)
	if result.Interval != 0 {
		t.Errorf("ожидался interval=0 (round(0*2.5)), получен %d", result.Interval)
	}
}

// ---- CalculateNow ----

func TestCalculateNow(t *testing.T) {
	// CalculateNow — обёртка, должна давать тот же результат, что и Calculate с time.Now()
	result := CalculateNow(2.5, 0, 0, 4)

	if result.Interval != 1 {
		t.Errorf("ожидался interval=1, получен %d", result.Interval)
	}
	if result.Repetitions != 1 {
		t.Errorf("ожидались repetitions=1, получены %d", result.Repetitions)
	}
	if result.EaseFactor != 2.5 {
		t.Errorf("ожидался EF=2.5, получен %.4f", result.EaseFactor)
	}
}

// ---- NextReview: хелпер ----

func checkNextReview(t *testing.T, nextReview string, expectedInterval int, now time.Time) {
	t.Helper()
	parsed, err := time.Parse(time.RFC3339, nextReview)
	if err != nil {
		t.Fatalf("невалидный next_review: %v", err)
	}

	expectedDate := now.AddDate(0, 0, expectedInterval).UTC()

	// Допускаем расхождение до 3 секунд на время выполнения
	diff := parsed.Sub(expectedDate)
	if diff < -3*time.Second || diff > 3*time.Second {
		t.Errorf("next_review не совпадает: ожидалось %v (±3s), получено %v (разница: %v)",
			expectedDate.Format(time.RFC3339), parsed.Format(time.RFC3339), diff)
	}
}

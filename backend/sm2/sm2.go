// Пакет sm2 реализует алгоритм интервального повторения SM-2 (SuperMemo 2).
//
// Алгоритм рассчитывает интервал до следующего повторения карточки на основе
// оценки пользователя (grade). Оценки: 0 — перезаучивание, 3 — трудно,
// 4 — хорошо, 5 — легко.
//
// Основные функции:
//   - Calculate — чистый расчёт нового состояния карточки
//   - CalculateNow — обёртка с текущим временем
//   - Reset — сброс прогресса к начальным значениям
//   - ValidateGrade — проверка допустимости оценки
package sm2

import (
	"fmt"
	"math"
	"time"
)

// SM2Result содержит результат работы алгоритма SM-2 — новое состояние карточки.
type SM2Result struct {
	// EaseFactor — множитель лёгкости (EF), изменяется от 1.3 и выше.
	EaseFactor float64

	// Interval — интервал до следующего повторения в днях.
	Interval int

	// Repetitions — количество успешных повторений подряд.
	Repetitions int

	// NextReview — дата следующего повторения в формате RFC3339.
	NextReview string
}

// Calculate выполняет расчёт SM-2: принимает текущие параметры карточки, оценку
// и текущее время, возвращает новое состояние. Чистая функция — не имеет
// побочных эффектов и не зависит от глобального состояния.
//
// Параметры:
//   - easeFactor — текущий множитель лёгкости
//   - interval — текущий интервал в днях
//   - repetitions — количество успешных повторений подряд
//   - grade — оценка пользователя (0, 3, 4, 5)
//   - now — текущее время (для расчёта следующей даты повторения)
func Calculate(easeFactor float64, interval int, repetitions int, grade int, now time.Time) *SM2Result {
	if grade >= 3 {
		switch repetitions {
		case 0:
			interval = 1
		case 1:
			interval = 6
		default:
			interval = int(math.Round(float64(interval) * easeFactor))
		}
		repetitions++
	} else {
		repetitions = 0
		interval = 1
	}

	easeFactor = easeFactor + (0.1 - (5-float64(grade))*(0.08+(5-float64(grade))*0.02))
	if easeFactor < 1.3 {
		easeFactor = 1.3
	}

	nextReview := now.AddDate(0, 0, interval).UTC().Format(time.RFC3339)

	return &SM2Result{
		EaseFactor:  easeFactor,
		Interval:    interval,
		Repetitions: repetitions,
		NextReview:  nextReview,
	}
}

// CalculateNow — обёртка над Calculate, использующая текущее системное время.
// Удобна для вызова из кода, где время не передаётся явно.
func CalculateNow(easeFactor float64, interval int, repetitions int, grade int) *SM2Result {
	return Calculate(easeFactor, interval, repetitions, grade, time.Now())
}

// Reset возвращает начальные параметры SM-2 для новой или сброшенной карточки:
//   - EaseFactor = 2.5
//   - Interval = 0
//   - Repetitions = 0
//   - NextReview = текущее время (чтобы карточка была доступна сразу)
func Reset() *SM2Result {
	now := time.Now().UTC().Format(time.RFC3339)
	return &SM2Result{
		EaseFactor:  2.5,
		Interval:    0,
		Repetitions: 0,
		NextReview:  now,
	}
}

// ValidateGrade проверяет, что оценка входит в допустимое множество {0, 3, 4, 5}.
// Возвращает ошибку с описанием, если оценка недопустима.
func ValidateGrade(grade int) error {
	switch grade {
	case 0, 3, 4, 5:
		return nil
	default:
		return fmt.Errorf("недопустимая оценка: %d, допустимые значения: 0, 3, 4, 5", grade)
	}
}

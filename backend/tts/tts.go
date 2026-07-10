// Пакет tts реализует синтез речи через Microsoft Edge TTS (edge-tts).
//
// Для работы требуется установленный Python 3.x и пакет edge-tts:
//
//	pip install edge-tts
//
// Пакет последовательно перебирает способы вызова:
// edge-tts → python -m edge_tts → python3 -m edge_tts.
package tts

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

// voiceFor возвращает имя голоса edge-tts для указанного кода языка.
func voiceFor(lang string) string {
	switch lang {
	case "ja", "ja-JP":
		return "ja-JP-NanamiNeural"
	case "ru", "ru-RU":
		return "ru-RU-SvetlanaNeural"
	default:
		return "ja-JP-NanamiNeural"
	}
}

// tryInvoke пытается выполнить edge-tts с указанными аргументами через три
// возможных способа: прямой вызов edge-tts, python -m edge_tts, python3 -m edge_tts.
// Возвращает первый успешный результат.
func tryInvoke(args []string) error {
	attempts := []struct {
		name string
		args []string
	}{
		{"edge-tts", args},
		{"python", append([]string{"-m", "edge_tts"}, args...)},
		{"python3", append([]string{"-m", "edge_tts"}, args...)},
	}

	var lastErr error
	for _, a := range attempts {
		cmd := exec.Command(a.name, a.args...)
		var stderr bytes.Buffer
		cmd.Stderr = &stderr
		if err := cmd.Run(); err == nil {
			return nil
		}
		lastErr = fmt.Errorf("%s: %s", a.name, stderr.String())
	}

	return fmt.Errorf("edge-tts не найден. Установите: pip install edge-tts\n  %s", lastErr)
}

// tryInvokeWithOutput пытается выполнить edge-tts и вернуть stdout.
// Возвращает первый успешный результат с выводом.
func tryInvokeWithOutput(args []string) (bool, string, error) {
	attempts := []struct {
		name string
		args []string
	}{
		{"edge-tts", args},
		{"python", append([]string{"-m", "edge_tts"}, args...)},
		{"python3", append([]string{"-m", "edge_tts"}, args...)},
	}

	var lastErr error
	for _, a := range attempts {
		cmd := exec.Command(a.name, a.args...)
		var stdout, stderr bytes.Buffer
		cmd.Stdout = &stdout
		cmd.Stderr = &stderr
		if err := cmd.Run(); err == nil {
			return true, stdout.String(), nil
		}
		lastErr = fmt.Errorf("%s: %s", a.name, stderr.String())
	}

	return false, lastErr.Error(), lastErr
}

// Speak вызывает edge-tts для синтеза указанного текста на указанном языке.
// Возвращает MP3-аудио в виде среза байт.
//
// Параметры:
//   - text — текст для озвучивания
//   - lang — код языка ("ja" для японского, "ru" для русского)
func Speak(text, lang string) ([]byte, error) {
	voice := voiceFor(lang)

	tmpDir, err := os.MkdirTemp("", "yappari-tts")
	if err != nil {
		return nil, fmt.Errorf("не удалось создать временную папку: %w", err)
	}
	defer os.RemoveAll(tmpDir)

	outPath := filepath.Join(tmpDir, "speak.mp3")

	args := []string{
		"--voice", voice,
		"--text", text,
		"--write-media", outPath,
	}

	if err := tryInvoke(args); err != nil {
		return nil, err
	}

	data, err := os.ReadFile(outPath)
	if err != nil {
		return nil, fmt.Errorf("не удалось прочитать аудиофайл: %w", err)
	}

	return data, nil
}

// CheckAvailability проверяет, доступен ли edge-tts в системе.
// Возвращает признак доступности и информационное сообщение.
func CheckAvailability() (bool, string) {
	ok, msg, err := tryInvokeWithOutput([]string{"--list-voices"})
	if ok {
		return true, "edge-tts доступен"
	}
	_ = msg
	return false, fmt.Sprintf("edge-tts не найден. Установите: pip install edge-tts\n  %s", err)
}

// Package tts реализует синтез речи через встроенные модели:
//   - Silero TTS (русский) — через управляемый Python-подпроцесс
//   - Kokoro TTS (японский) — через управляемый Python-подпроцесс
//
// Архитектура:
// Go запускает долгоживущий Python-процесс (tts_server.py), который
// загружает обе модели и держит их в памяти. Общение — JSON-строки
// через stdin/stdout.
//
// При первом запуске создаётся виртуальное окружение Python (venv),
// устанавливаются зависимости и скачиваются модели. Все последующие
// запуски — полностью офлайн.
package tts

import (
	"bufio"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

// State представляет состояние TTS-системы.
type State int

const (
	// StateUninitialized — TTS не инициализирован.
	StateUninitialized State = iota
	// StateInitializing — TTS в процессе инициализации.
	StateInitializing
	// StateReady — TTS готов к работе.
	StateReady
	// StateError — ошибка TTS (процесс умер, модель не загружена).
	StateError
)

// TTSStatus содержит текущее состояние TTS-системы.
type TTSStatus struct {
	State   State  `json:"status"`
	Message string `json:"message"`
}

// rpcRequest — JSON-запрос к Python-процессу.
type rpcRequest struct {
	ID     int    `json:"id"`
	Method string `json:"method"`
	Params any    `json:"params,omitempty"`
}

// rpcResponse — JSON-ответ от Python-процесса.
type rpcResponse struct {
	ID         int    `json:"id,omitempty"`
	Type       string `json:"type"`
	Message    string `json:"message,omitempty"`
	Audio      string `json:"audio,omitempty"`
	SampleRate int    `json:"sample_rate,omitempty"`
}

// speakParams — параметры запроса на синтез.
type speakParams struct {
	Text string `json:"text"`
	Lang string `json:"lang"`
}

// ttsManager управляет Python-процессом TTS.
type ttsManager struct {
	cmd        *exec.Cmd
	stdin      io.WriteCloser
	stdout     io.ReadCloser
	stderr     io.ReadCloser
	status     State
	message    string
	modelsDir  string
	venvDir    string
	mu         sync.RWMutex
	pending    map[int]chan<- rpcResponse
	nextID     int
	ready      chan struct{}
	stopHealth chan struct{}
}

// manager — глобальный экземпляр менеджера TTS.
var manager *ttsManager

// getPythonPath возвращает путь к Python в venv или системный Python.
func getPythonPath(venvDir string) string {
	candidates := []string{
		filepath.Join(venvDir, "Scripts", "python.exe"),
		filepath.Join(venvDir, "bin", "python3"),
		filepath.Join(venvDir, "bin", "python"),
	}
	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	// Пробуем системный Python
	for _, name := range []string{"python3", "python"} {
		if p, err := exec.LookPath(name); err == nil {
			return p
		}
	}
	return ""
}

// ensureVenv создаёт venv и устанавливает зависимости, если их нет.
func ensureVenv(venvDir, modelsDir string) error {
	pythonExe := filepath.Join(venvDir, "Scripts", "python.exe")
	if _, err := os.Stat(pythonExe); err == nil {
		return nil // venv уже существует
	}

	log.Printf("TTS: создаю виртуальное окружение в %s", venvDir)

	// Ищем системный Python
	sysPython := ""
	for _, name := range []string{"python3", "python", "py -3"} {
		if p, err := exec.LookPath(name); err == nil {
			sysPython = p
			break
		}
	}
	if sysPython == "" {
		return fmt.Errorf("Python не найден. Установите Python 3.9+")
	}

	// Создаём venv
	if err := exec.Command(sysPython, "-m", "venv", venvDir).Run(); err != nil {
		return fmt.Errorf("не удалось создать venv: %w", err)
	}

	// Определяем путь к setup_tts.py
	setupScript := findSetupScript()
	if setupScript == "" {
		return fmt.Errorf("не найден setup_tts.py")
	}

	log.Printf("TTS: запускаю setup_tts.py (установка зависимостей, скачивание моделей)...")
	cmd := exec.Command(pythonExe, setupScript, "--venv-dir", venvDir, "--models-dir", modelsDir)
	cmd.Stdout = os.Stderr
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("ошибка настройки TTS: %w", err)
	}

	log.Printf("TTS: окружение готово")
	return nil
}

// findSetupScript ищет setup_tts.py относительно исполняемого файла.
func findSetupScript() string {
	candidates := []string{
		"backend/tts/python/setup_tts.py",
		"../backend/tts/python/setup_tts.py",
	}
	// Ищем относительно текущей директории
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			abs, _ := filepath.Abs(c)
			return abs
		}
	}
	// Ищем относительно исполняемого файла
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		for _, c := range candidates {
			p := filepath.Join(dir, c)
			if _, err := os.Stat(p); err == nil {
				return p
			}
		}
	}
	return ""
}

// findTTSServer ищет tts_server.py.
func findTTSServer() string {
	candidates := []string{
		"backend/tts/python/tts_server.py",
		"../backend/tts/python/tts_server.py",
	}
	for _, c := range candidates {
		if _, err := os.Stat(c); err == nil {
			abs, _ := filepath.Abs(c)
			return abs
		}
	}
	if exe, err := os.Executable(); err == nil {
		dir := filepath.Dir(exe)
		for _, c := range candidates {
			p := filepath.Join(dir, c)
			if _, err := os.Stat(p); err == nil {
				return p
			}
		}
	}
	return ""
}

// Init инициализирует TTS-систему.
// Создаёт venv (если нет), запускает Python-процесс с tts_server.py.
// Возвращает nil, если инициализация запущена (может быть асинхронной).
func Init(appDataDir string) error {
	if manager != nil {
		return fmt.Errorf("TTS уже инициализирован")
	}

	venvDir := filepath.Join(appDataDir, "tts_env")
	modelsDir := filepath.Join(appDataDir, "tts_models")

	// Создаём папки
	_ = os.MkdirAll(modelsDir, 0755)

	mgr := &ttsManager{
		status:     StateUninitialized,
		venvDir:    venvDir,
		modelsDir:  modelsDir,
		pending:    make(map[int]chan<- rpcResponse),
		ready:      make(chan struct{}),
		stopHealth: make(chan struct{}),
	}
	manager = mgr

	// Шаг 1: проверяем/создаём venv
	if err := ensureVenv(venvDir, modelsDir); err != nil {
		mgr.status = StateError
		mgr.message = fmt.Sprintf("Ошибка настройки: %v", err)
		return err
	}

	// Шаг 2: запускаем Python-процесс
	if err := mgr.startProcess(); err != nil {
		mgr.status = StateError
		mgr.message = fmt.Sprintf("Ошибка запуска: %v", err)
		return err
	}

	mgr.status = StateInitializing
	mgr.message = "Загрузка моделей..."

	// Шаг 3: асинхронно ждём готовности
	go mgr.waitForReady()

	return nil
}

// startProcess запускает Python-подпроцесс и подключает pipes.
func (m *ttsManager) startProcess() error {
	pythonPath := getPythonPath(m.venvDir)
	if pythonPath == "" {
		return fmt.Errorf("Python не найден в %s и в системе", m.venvDir)
	}

	serverScript := findTTSServer()
	if serverScript == "" {
		return fmt.Errorf("tts_server.py не найден")
	}

	cmd := exec.Command(pythonPath, serverScript, "--models-dir", m.modelsDir)

	stdin, err := cmd.StdinPipe()
	if err != nil {
		return fmt.Errorf("stdin pipe: %w", err)
	}
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("stdout pipe: %w", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return fmt.Errorf("stderr pipe: %w", err)
	}

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("запуск процесса: %w", err)
	}

	m.cmd = cmd
	m.stdin = stdin
	m.stdout = stdout
	m.stderr = stderr

	// Читаем stderr в горутине (логи Python)
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			log.Printf("[Python-stderr] %s", scanner.Text())
		}
	}()

	// Читаем stdout (протокол JSON-RPC)
	go m.readLoop()

	return nil
}

// readLoop читает JSON-строки из stdout Python-процесса.
func (m *ttsManager) readLoop() {
	scanner := bufio.NewScanner(m.stdout)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}

		var resp rpcResponse
		if err := json.Unmarshal([]byte(line), &resp); err != nil {
			log.Printf("TTS: ошибка парсинга JSON: %v (line: %s)", err, line[:min(len(line), 100)])
			continue
		}

		switch resp.Type {
		case "ready":
			m.mu.Lock()
			m.status = StateReady
			m.message = "TTS готов"
			if resp.Message != "" {
				m.message = resp.Message
			}
			m.mu.Unlock()
			close(m.ready)

		case "status":
			m.mu.Lock()
			m.message = resp.Message
			m.mu.Unlock()

		case "result", "error":
			m.mu.Lock()
			ch, ok := m.pending[resp.ID]
			delete(m.pending, resp.ID)
			m.mu.Unlock()
			if ok {
				ch <- resp
			}

		case "shutdown_ack":
			log.Println("TTS: получено подтверждение shutdown")
		}
	}

	// Если scanner завершился — процесс умер
	log.Println("TTS: stdout закрыт, процесс завершён")
	m.mu.Lock()
	if m.status != StateUninitialized {
		m.status = StateError
		m.message = "Процесс TTS неожиданно завершён"
	}
	m.mu.Unlock()
}

// waitForReady ждёт сигнала готовности от Python-процесса с таймаутом.
func (m *ttsManager) waitForReady() {
	select {
	case <-m.ready:
		log.Println("TTS: модели загружены, сервер готов")
	case <-time.After(60 * time.Second):
		m.mu.Lock()
		m.status = StateError
		m.message = "Таймаут ожидания загрузки моделей TTS"
		m.mu.Unlock()
		log.Println("TTS: таймаут ожидания готовности")
	}
}

// Speak синтезирует речь из текста.
// Возвращает аудио (WAV), MIME-тип и ошибку.
func Speak(text, lang string) ([]byte, string, error) {
	if manager == nil {
		return nil, "", fmt.Errorf("TTS не инициализирован")
	}

	m := manager
	m.mu.RLock()
	status := m.status
	msg := m.message
	m.mu.RUnlock()

	if status != StateReady {
		return nil, "", fmt.Errorf("TTS не готов (статус: %d, %s)", status, msg)
	}

	// Создаём канал для ответа
	ch := make(chan rpcResponse, 1)

	m.mu.Lock()
	id := m.nextID
	m.nextID++
	m.pending[id] = ch
	m.mu.Unlock()

	// Отправляем запрос
	req := rpcRequest{
		ID:     id,
		Method: "speak",
		Params: speakParams{Text: text, Lang: lang},
	}
	data, _ := json.Marshal(req)

	m.mu.Lock()
	stdin := m.stdin
	m.mu.Unlock()

	if _, err := fmt.Fprintln(stdin, string(data)); err != nil {
		return nil, "", fmt.Errorf("ошибка отправки запроса: %w", err)
	}

	// Ждём ответ
	select {
	case resp := <-ch:
		if resp.Type == "error" {
			return nil, "", fmt.Errorf("TTS: %s", resp.Message)
		}
		audio, err := base64.StdEncoding.DecodeString(resp.Audio)
		if err != nil {
			return nil, "", fmt.Errorf("ошибка декодирования аудио: %w", err)
		}
		return audio, "audio/wav", nil

	case <-time.After(30 * time.Second):
		m.mu.Lock()
		delete(m.pending, id)
		m.mu.Unlock()
		return nil, "", fmt.Errorf("таймаут ожидания TTS (30с)")
	}
}

// Status возвращает текущее состояние TTS-системы.
func Status() TTSStatus {
	if manager == nil {
		return TTSStatus{State: StateUninitialized, Message: "TTS не инициализирован"}
	}
	m := manager
	m.mu.RLock()
	defer m.mu.RUnlock()

	// Проверяем, жив ли процесс
	if m.cmd != nil {
		if m.cmd.ProcessState != nil && m.cmd.ProcessState.Exited() {
			return TTSStatus{State: StateError, Message: "Процесс TTS завершён"}
		}
	}

	return TTSStatus{State: m.status, Message: m.message}
}

// Close завершает Python-процесс и освобождает ресурсы.
func Close() error {
	if manager == nil {
		return nil
	}

	m := manager
	log.Println("TTS: завершение работы...")

	// Отправляем shutdown
	if m.stdin != nil {
		req := rpcRequest{Method: "shutdown"}
		data, _ := json.Marshal(req)
		_, _ = fmt.Fprintln(m.stdin, string(data))

		// Ждём завершения
		done := make(chan struct{})
		go func() {
			if m.cmd != nil {
				_ = m.cmd.Wait()
			}
			close(done)
		}()

		select {
		case <-done:
			log.Println("TTS: процесс завершён")
		case <-time.After(5 * time.Second):
			log.Println("TTS: принудительное завершение")
			if m.cmd != nil {
				_ = m.cmd.Process.Kill()
			}
		}

		_ = m.stdin.Close()
	}

	// Очищаем pending
	m.mu.Lock()
	for id, ch := range m.pending {
		close(ch)
		delete(m.pending, id)
	}
	m.status = StateUninitialized
	m.message = ""
	m.mu.Unlock()

	manager = nil
	return nil
}

// CheckAvailability проверяет, доступен ли TTS.
// Возвращает true и сообщение, если хотя бы одна модель загружена.
// Совместимость со старой сигнатурой для плавного перехода.
func CheckAvailability() (bool, string) {
	s := Status()
	if s.State == StateReady {
		return true, s.Message
	}
	return false, s.Message
}

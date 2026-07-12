"""
TTS-сервер для Yappari.

Запускается как долгоживущий Python-процесс, управляемый Go-бэкендом.
Читает JSON-команды из stdin, пишет JSON-ответы в stdout.

Протокол (JSON строки):

Запросы (Go -> Python):
  {"id": 1, "method": "speak", "params": {"text": "...", "lang": "ja-JP"}}
  {"id": 2, "method": "shutdown"}

Ответы (Python -> Go):
  {"type": "status", "ready": false, "message": "..."}
  {"type": "ready", "ready": true, "models": {"silero": true, "kokoro": false}}
  {"id": 1, "type": "result", "audio": "<base64-wav>", "sample_rate": 24000}
  {"id": 1, "type": "error", "message": "..."}
  {"type": "shutdown_ack"}
"""

import argparse
import base64
import json
import logging
import signal
import sys


def setup_logging():
    """Настраивает логирование в stderr (stdout занят протоколом)."""
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        stream=sys.stderr,
    )


def send_json(obj: dict) -> None:
    """
    Отправляет JSON-строку в stdout.
    Каждая строка — один JSON-объект.
    """
    sys.stdout.write(json.dumps(obj, ensure_ascii=False) + "\n")
    sys.stdout.flush()


class TTSServer:
    """TTS-сервер, управляющий Silero и Kokoro моделями."""

    def __init__(self, models_dir: str):
        self._silero = None
        self._kokoro = None
        self._models_dir = models_dir
        self._running = True
        self._logger = logging.getLogger("server")

    def load_models(self) -> None:
        """Загружает обе модели последовательно."""
        self._logger.info("Начало загрузки моделей...")

        # Silero (русский)
        self._logger.info("Загрузка Silero TTS...")
        send_json({"type": "status", "ready": False, "message": "Загрузка Silero (русский)..."})
        try:
            from silero_handler import SileroHandler
            self._silero = SileroHandler(self._models_dir)
            self._logger.info("Silero: загружена")
        except Exception as e:
            self._logger.error("Silero: ошибка загрузки: %s", e)
            send_json({"type": "status", "ready": False, "message": f"Silero: {e}"})

        # Kokoro (японский)
        self._logger.info("Загрузка Kokoro TTS...")
        send_json({"type": "status", "ready": False, "message": "Загрузка Kokoro (японский)..."})
        try:
            from kokoro_handler import KokoroHandler
            self._kokoro = KokoroHandler(self._models_dir)
            self._logger.info("Kokoro: загружена")
        except Exception as e:
            self._logger.error("Kokoro: ошибка загрузки: %s", e)
            send_json({"type": "status", "ready": False, "message": f"Kokoro: {e}"})

        # Отправляем сигнал готовности
        models_status = {
            "silero": self._silero is not None and self._silero.is_loaded(),
            "kokoro": self._kokoro is not None and self._kokoro.is_loaded(),
        }
        self._logger.info("Модели загружены: %s", models_status)
        send_json({
            "type": "ready",
            "ready": True,
            "models": models_status,
        })

    def handle_speak(self, req_id: int, params: dict) -> None:
        """
        Обрабатывает запрос на синтез речи.

        Параметры:
            text: текст для озвучивания
            lang: код языка (ru-RU или ja-JP)
        """
        text = params.get("text", "")
        lang = params.get("lang", "ja-JP")

        if not text.strip():
            send_json({"id": req_id, "type": "error", "message": "Текст не может быть пустым"})
            return

        self._logger.info("Speak: lang=%s, text='%s'", lang, text[:50])

        try:
            if lang == "ru-RU":
                if self._silero is None or not self._silero.is_loaded():
                    send_json({"id": req_id, "type": "error", "message": "Silero TTS не загружен"})
                    return
                audio_bytes = self._silero.speak(text)
            elif lang == "ja-JP":
                if self._kokoro is None or not self._kokoro.is_loaded():
                    send_json({"id": req_id, "type": "error", "message": "Kokoro TTS не загружен"})
                    return
                audio_bytes = self._kokoro.speak(text)
            else:
                send_json({
                    "id": req_id,
                    "type": "error",
                    "message": f"Неподдерживаемый язык: {lang}. Используйте ru-RU или ja-JP",
                })
                return

            audio_b64 = base64.b64encode(audio_bytes).decode("utf-8")
            send_json({
                "id": req_id,
                "type": "result",
                "audio": audio_b64,
                "sample_rate": 24000,
            })

        except Exception as e:
            self._logger.error("Ошибка синтеза: %s", e)
            send_json({"id": req_id, "type": "error", "message": str(e)})

    def handle_shutdown(self) -> None:
        """Обрабатывает запрос на завершение работы."""
        self._logger.info("Получен сигнал shutdown")
        self._running = False

        if self._silero:
            self._silero.unload()
        if self._kokoro:
            self._kokoro.unload()

        send_json({"type": "shutdown_ack"})

    def run(self) -> None:
        """Главный цикл: читает JSON из stdin, диспетчеризует запросы."""
        self._logger.info("TTS-сервер запущен, читаю stdin...")

        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue

            try:
                request = json.loads(line)
            except json.JSONDecodeError as e:
                self._logger.error("Ошибка парсинга JSON: %s (line: %s)", e, line[:100])
                continue

            method = request.get("method", "")
            req_id = request.get("id", 0)

            if method == "shutdown":
                self.handle_shutdown()
                break
            elif method == "speak":
                self.handle_speak(req_id, request.get("params", {}))
            else:
                self._logger.warning("Неизвестный метод: %s", method)
                send_json({
                    "id": req_id,
                    "type": "error",
                    "message": f"Неизвестный метод: {method}",
                })

        self._logger.info("TTS-сервер завершён")


def main():
    parser = argparse.ArgumentParser(description="Yappari TTS Server")
    parser.add_argument(
        "--models-dir",
        required=True,
        help="Путь к папке с моделями (tts_models/)",
    )
    args = parser.parse_args()

    setup_logging()

    # Игнорируем SIGINT/SIGTERM — Go управляет процессом
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    signal.signal(signal.SIGTERM, signal.SIG_IGN)

    server = TTSServer(args.models_dir)
    server.load_models()
    server.run()


if __name__ == "__main__":
    main()

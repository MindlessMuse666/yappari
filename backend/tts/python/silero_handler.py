"""
Обработчик Silero TTS для русского языка.

Загружает модель Silero TTS (v4_ru), кэширует её локально,
синтезирует речь в WAV.
"""

import io
import logging
import os

logger = logging.getLogger("silero")


class SileroHandler:
    """Обёртка над Silero TTS для синтеза русской речи."""

    def __init__(self, models_dir: str):
        """
        Загружает Silero модель.
        Если модель не найдена — скачивает через torch.hub.

        Args:
            models_dir: путь к папке с моделями (models/silero/)
        """
        self._model = None
        self._sample_rate = 48000
        model_path = os.path.join(models_dir, "silero", "v4_ru.pt")

        if not os.path.exists(model_path):
            logger.info("Silero: модель не найдена, скачиваю...")
            self._download_model(model_path)
        else:
            logger.info("Silero: загружаю модель из кэша...")

        self._load_model(model_path)

    def _download_model(self, model_path: str) -> None:
        """Скачивает Silero модель через torch.hub."""
        import torch

        os.makedirs(os.path.dirname(model_path), exist_ok=True)

        model, example_text = torch.hub.load(
            repo_or_dir="snakers4/silero-models",
            model="silero_tts",
            language="ru",
            speaker="v4_ru",
        )
        torch.save(model.state_dict(), model_path)
        logger.info("Silero: модель сохранена в %s", model_path)

    def _load_model(self, model_path: str) -> None:
        """Загружает модель из файла."""
        import torch

        device = torch.device("cpu")

        model, _ = torch.hub.load(
            repo_or_dir="snakers4/silero-models",
            model="silero_tts",
            language="ru",
            speaker="v4_ru",
        )
        model.load_state_dict(torch.load(model_path, map_location=device))
        model.to(device)
        model.eval()
        self._model = model
        logger.info("Silero: модель загружена")

    def is_loaded(self) -> bool:
        """Проверяет, загружена ли модель."""
        return self._model is not None

    def speak(self, text: str) -> bytes:
        """
        Синтезирует русскую речь из текста.

        Args:
            text: текст для озвучивания

        Returns:
            WAV-аудио в виде байтов

        Raises:
            RuntimeError: если модель не загружена
        """
        if self._model is None:
            raise RuntimeError("Silero: модель не загружена")

        import torchaudio

        audio_tensor = self._model.apply_tts(
            text=text,
            speaker="xenia",
            sample_rate=self._sample_rate,
        )

        buf = io.BytesIO()
        torchaudio.save(buf, audio_tensor.unsqueeze(0), self._sample_rate, format="wav")
        wav_bytes = buf.getvalue()

        logger.info("Silero: синтезировано %d байт для текста '%s'", len(wav_bytes), text[:30])
        return wav_bytes

    def unload(self) -> None:
        """Выгружает модель из памяти."""
        self._model = None
        import gc
        gc.collect()
        logger.info("Silero: модель выгружена")

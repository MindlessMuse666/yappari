"""
Обработчик Kokoro TTS для японского языка.

Использует легковесную модель Kokoro-82M (HF: hexgrad/Kokoro-82M).
Модель автоматически кэшируется в HuggingFace cache при первой загрузке.
"""

import io
import logging

logger = logging.getLogger("kokoro")


class KokoroHandler:
    """Обёртка над Kokoro TTS для синтеза японской речи."""

    def __init__(self, models_dir: str):
        """
        Инициализирует Kokoro TTS pipeline.
        Модель скачивается один раз и кэшируется в HF cache.

        Args:
            models_dir: путь к папке с моделями (не используется Kokoro,
                       модель кэшируется в HF cache)
        """
        self._pipeline = None
        self._sample_rate = 24000

        logger.info("Kokoro: загружаю модель...")
        self._load_pipeline()
        logger.info("Kokoro: модель загружена")

    def _load_pipeline(self) -> None:
        """Создаёт Kokoro pipeline для японского языка."""
        try:
            from kokoro import KPipeline

            self._pipeline = KPipeline(lang_code="j")
        except ImportError:
            logger.error(
                "Kokoro: пакет не установлен. Выполните: pip install kokoro"
            )
            raise

    def is_loaded(self) -> bool:
        """Проверяет, загружена ли модель."""
        return self._pipeline is not None

    def speak(self, text: str) -> bytes:
        """
        Синтезирует японскую речь из текста.

        Args:
            text: текст для озвучивания

        Returns:
            WAV-аудио в виде байтов

        Raises:
            RuntimeError: если модель не загружена
        """
        if self._pipeline is None:
            raise RuntimeError("Kokoro: модель не загружена")

        import numpy as np
        import soundfile as sf

        generator = self._pipeline(text)

        audio_chunks = []
        for _, _, audio in generator:
            if audio is not None and len(audio) > 0:
                audio_chunks.append(audio)

        if not audio_chunks:
            raise RuntimeError(f"Kokoro: не удалось синтезировать текст '{text[:30]}'")

        combined = np.concatenate(audio_chunks)

        buf = io.BytesIO()
        sf.write(buf, combined, self._sample_rate, format="wav")
        wav_bytes = buf.getvalue()

        logger.info("Kokoro: синтезировано %d байт для текста '%s'", len(wav_bytes), text[:30])
        return wav_bytes

    def unload(self) -> None:
        """Выгружает модель из памяти."""
        self._pipeline = None
        import gc
        gc.collect()
        logger.info("Kokoro: модель выгружена")

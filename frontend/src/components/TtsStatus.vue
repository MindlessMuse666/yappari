<template>
  <div class="tts-status" :class="{ compact }">
    <!-- Компактный режим: строка с индикаторами -->
    <template v-if="compact">
      <span class="tts-indicator" :class="voiceClass(voices.ja)" @click="$emit('expand')">
        JA {{ stateSymbol(voices.ja) }}
      </span>
      <span class="tts-sep">|</span>
      <span class="tts-indicator" :class="voiceClass(voices.ru)" @click="$emit('expand')">
        RU {{ stateSymbol(voices.ru) }}
      </span>
    </template>

    <!-- Детальный режим: панель с информацией -->
    <template v-else>
      <div class="tts-panel">
        <div class="tts-voice-row">
          <span class="tts-lang-label">Японский</span>
          <span class="tts-state-badge" :class="voiceClass(voices.ja)">
            <span class="tts-dot"></span>
            {{ stateLabel(voices.ja) }}
          </span>
        </div>
        <div class="tts-voice-row">
          <span class="tts-lang-label">Русский</span>
          <span class="tts-state-badge" :class="voiceClass(voices.ru)">
            <span class="tts-dot"></span>
            {{ stateLabel(voices.ru) }}
          </span>
        </div>

        <!-- Progress bar загрузки Python TTS -->
        <div v-if="pythonInstalling" class="tts-python-progress">
          <ProgressBar v-if="pythonProgress" :value="Math.round((pythonProgress.ja + pythonProgress.ru) / 2)"
            :show-value="true" class="tts-progress-bar" />
          <p class="tts-progress-label">Установка высококачественного TTS…</p>
        </div>

        <!-- Кнопка установки (если голос не найден) -->
        <button v-if="showInstallBtn" class="tts-install-btn" @click="$emit('install')">
          Установить высококачественный TTS
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * Компонент отображения статуса TTS-голосов.
 *
 * Поддерживает два режима:
 * - compact — строка с индикаторами (JA ● | RU ○)
 * - Детальный — панель с бейджами и кнопкой установки
 *
 * @module components/TtsStatus
 */
import { computed } from 'vue'
import ProgressBar from 'primevue/progressbar'
import type { TtsVoiceState } from '../composables/useTts'

const props = withDefaults(defineProps<{
  compact?: boolean
  voices: { ja: TtsVoiceState; ru: TtsVoiceState }
  pythonInstalling?: boolean
  pythonProgress?: { ja: number; ru: number } | null
}>(), {
  compact: false,
  pythonInstalling: false,
  pythonProgress: null,
})

defineEmits<{
  expand: []
  install: []
}>()

/** Показывать кнопку установки Python TTS */
const showInstallBtn = computed(() => {
  return !props.pythonInstalling && (
    props.voices.ja === 'not_found' || props.voices.ru === 'not_found' ||
    props.voices.ja === 'error' || props.voices.ru === 'error'
  )
})

/** Символ состояния для компактного режима */
const stateSymbol = (state: TtsVoiceState): string => {
  switch (state) {
    case 'ready': return '●'
    case 'checking': return '◌'
    case 'not_found': return '○'
    case 'loading': return '◌'
    case 'error': return '○'
  }
}

/** Текстовое описание состояния для детального режима */
const stateLabel = (state: TtsVoiceState): string => {
  switch (state) {
    case 'checking': return 'Проверка…'
    case 'ready': return 'Готов'
    case 'not_found': return 'Не найден'
    case 'loading': return 'Загрузка…'
    case 'error': return 'Ошибка'
  }
}

/** CSS-класс для состояния */
const voiceClass = (state: TtsVoiceState): string => {
  return `tts-state-${state}`
}
</script>

<style scoped>
/* ===== Контейнер ===== */
.tts-status {
  font-family: 'Inter', sans-serif;
  user-select: none;
}

.tts-status.compact {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  color: #c7cdd8;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
  transition: background 0.2s;
}

.tts-status.compact:hover {
  background: #1a1a1a;
}

.tts-sep {
  color: #333333;
}

/* ===== Индикатор (компактный) ===== */
.tts-indicator {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  transition: color 0.2s;
}

.tts-indicator.tts-state-ready {
  color: #6bcb77;
}

.tts-indicator.tts-state-checking,
.tts-indicator.tts-state-loading {
  color: #c7cdd8;
  animation: ttsPulse 1.5s ease-in-out infinite;
}

.tts-indicator.tts-state-not_found {
  color: #e8904a;
}

.tts-indicator.tts-state-error {
  color: #d62828;
}

@keyframes ttsPulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

/* ===== Панель (детальный режим) ===== */
.tts-panel {
  background: #111111;
  border: 1px solid #222222;
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tts-voice-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.tts-lang-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #ffffff;
}

/* ===== Бейдж состояния ===== */
.tts-state-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 500;
  padding: 0.2rem 0.6rem;
  border-radius: 1rem;
}

.tts-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.tts-state-ready .tts-dot {
  background: #6bcb77;
  box-shadow: 0 0 6px rgba(107, 203, 119, 0.5);
}

.tts-state-ready {
  color: #6bcb77;
  background: rgba(107, 203, 119, 0.1);
}

.tts-state-checking .tts-dot,
.tts-state-loading .tts-dot {
  background: #c7cdd8;
  animation: ttsPulse 1.5s ease-in-out infinite;
}

.tts-state-checking,
.tts-state-loading {
  color: #c7cdd8;
  background: rgba(199, 205, 216, 0.1);
}

.tts-state-not_found .tts-dot {
  background: #e8904a;
}

.tts-state-not_found {
  color: #e8904a;
  background: rgba(232, 144, 74, 0.1);
}

.tts-state-error .tts-dot {
  background: #d62828;
}

.tts-state-error {
  color: #d62828;
  background: rgba(214, 40, 40, 0.1);
}

/* ===== Progress Bar Python TTS ===== */
.tts-python-progress {
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid #222222;
}

.tts-progress-bar {
  margin-bottom: 0.5rem;
}

.tts-progress-label {
  font-size: 0.75rem;
  color: #c7cdd8;
  text-align: center;
}

/* ===== Кнопка установки ===== */
.tts-install-btn {
  width: 100%;
  padding: 0.6rem 1rem;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid #ff0a14;
  background: transparent;
  color: #ff0a14;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tts-install-btn:hover {
  background: #ff0a14;
  color: #ffffff;
}
</style>

<!--
  Кастомное модальное окно для alert/confirm.

  Использует Teleport для рендеринга поверх всего приложения.
  Поддерживает два режима: alert (одна кнопка) и confirm (две кнопки).
-->

<template>
  <Teleport to="body">
    <Transition name="alert">
      <div v-if="visible" class="alert-overlay" @click="handleOverlayClick">
        <div class="alert-modal" @click.stop>
          <div class="alert-header">
            <span class="alert-title">{{ title }}</span>
          </div>
          <div class="alert-body" :class="{ 'alert-body--error': isError }">
            <p class="alert-message">{{ message }}</p>
          </div>
          <div class="alert-footer">
            <!-- Режим alert: одна кнопка -->
            <button v-if="mode === 'alert'" ref="mainBtn" @click="close" class="alert-btn primary">
              {{ buttonText }}
            </button>
            <!-- Режим confirm: две кнопки -->
            <template v-else>
              <button @click="confirmAction(false)" class="alert-btn secondary">
                {{ cancelText }}
              </button>
              <button ref="mainBtn" @click="confirmAction(true)" class="alert-btn primary">
                {{ confirmText }}
              </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
/**
 * Компонент кастомного модального окна с alert/confirm.
 *
 * Предоставляет методы `show` (для alert) и `confirm` (для confirm),
 * которые возвращают Promise. Используется через композабл useAlert.
 *
 * @example
 * ```ts
 * const { alert, confirm } = useAlert()
 * await alert({ title: 'Ошибка', message: 'Что-то пошло не так' })
 * const ok = await confirm({ title: 'Удалить?', message: 'Вы уверены?' })
 * ```
 *
 * @module components/CustomAlert
 */

import { ref, nextTick, onMounted, onUnmounted } from 'vue'

const visible = ref(false)
const mode = ref<'alert' | 'confirm'>('alert')
const title = ref('')
const message = ref('')
const isError = ref(false)
const buttonText = ref('OK')
const confirmText = ref('Подтвердить')
const cancelText = ref('Отмена')
const mainBtn = ref<HTMLButtonElement | null>(null)

let resolveCallback: (() => void) | null = null
let confirmResolveCallback: ((value: boolean) => void) | null = null

/** Показывает alert-окно с одной кнопкой */
const show = (params: { title?: string; message: string; buttonText?: string; isError?: boolean }): Promise<void> => {
  return new Promise((resolve) => {
    mode.value = 'alert'
    title.value = params.title || 'Уведомление'
    message.value = params.message
    isError.value = params.isError ?? false
    buttonText.value = params.buttonText || 'OK'
    visible.value = true
    resolveCallback = resolve
    nextTick(() => mainBtn.value?.focus())
  })
}

/** Показывает confirm-окно с двумя кнопками и возвращает boolean */
const confirm = (
  params: { title?: string; message: string; confirmText?: string; cancelText?: string }
): Promise<boolean> => {
  return new Promise((resolve) => {
    mode.value = 'confirm'
    title.value = params.title || 'Подтверждение'
    message.value = params.message
    confirmText.value = params.confirmText || 'Подтвердить'
    cancelText.value = params.cancelText || 'Отмена'
    visible.value = true
    confirmResolveCallback = resolve
    nextTick(() => mainBtn.value?.focus())
  })
}

/** Закрывает alert-окно */
const close = () => {
  visible.value = false
  if (resolveCallback) {
    resolveCallback()
    resolveCallback = null
  }
}

/** Обрабатывает результат confirm */
const confirmAction = (value: boolean) => {
  visible.value = false
  if (confirmResolveCallback) {
    confirmResolveCallback(value)
    confirmResolveCallback = null
  }
}

/** В alert-режиме клик по оверлею закрывает, в confirm — нет */
const handleOverlayClick = () => {
  if (mode.value === 'alert') {
    close()
  }
}

/** Обработчик клавиш Escape, Enter и блокировка Space */
const onKeydown = (e: KeyboardEvent) => {
  if (!visible.value) return

  if (e.key === 'Escape') {
    e.stopImmediatePropagation()
    if (mode.value === 'confirm') {
      confirmAction(false)
    } else {
      close()
    }
  }
  if (e.key === 'Enter') {
    e.preventDefault()
    if (mode.value === 'confirm') {
      confirmAction(true)
    } else {
      close()
    }
  }
  if (e.key === ' ' || e.code === 'Space') {
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}

/** Блокировка прокрутки колёсиком мыши при открытом модальном окне */
const onWheel = (e: WheelEvent) => {
  if (visible.value) {
    e.preventDefault()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  document.addEventListener('wheel', onWheel, { passive: false })
})
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.removeEventListener('wheel', onWheel)
})

defineExpose({ show, confirm })
</script>

<style scoped>
.alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.alert-modal {
  background: #111111;
  border: 1px solid #c7cdd8;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 460px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5);
  position: relative;
}

.alert-header {
  padding: 2rem 1.75rem 0.75rem;
}

.alert-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: white;
  display: block;
}

.alert-body {
  padding: 0.5rem 1.75rem 1.5rem;
}

.alert-body--error .alert-message {
  color: #ff8a8a;
}

.alert-message {
  color: #c7cdd8;
  font-size: 1rem;
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
}

.alert-footer {
  padding: 1.25rem 1.75rem 1.75rem;
  border-top: 1px solid #222222;
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.alert-btn {
  padding: 0.75rem 2rem;
  border-radius: 0.75rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 120px;
  border: none;
}

.alert-btn.primary {
  background-color: #ff0a14;
  color: white;
}

.alert-btn.primary:hover {
  background-color: #e00912;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 10, 20, 0.35);
}

.alert-btn.primary:active {
  transform: translateY(0);
}

.alert-btn.secondary {
  background-color: #222222;
  color: white;
  border: 1px solid #333333;
}

.alert-btn.secondary:hover {
  background-color: #333333;
  border-color: #ff0a14;
  transform: translateY(-2px);
}

.alert-btn:focus-visible {
  outline: 2px solid #ff0a14;
  outline-offset: 3px;
}

/* Анимации */
.alert-enter-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.alert-leave-active {
  transition: all 0.15s ease;
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
}

.alert-enter-from .alert-modal {
  transform: scale(0.85) translateY(-30px);
}

.alert-leave-to .alert-modal {
  transform: scale(0.9) translateY(10px);
}
</style>

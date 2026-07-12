<!--
  Корневой компонент приложения.

  Содержит глобальный контейнер с тёмной темой, вывод маршрутов
  через `<router-view>` и модальное окно CustomAlert.
-->

<script setup lang="ts">
/**
 * Корневой компонент Yappari.
 *
 * @module App
 */

import { ref, onMounted, onUnmounted } from 'vue'
import CustomAlert from './components/CustomAlert.vue'
import { useAlert } from './composables/useAlert'

const alertRef = ref<InstanceType<typeof CustomAlert>>()
const { registerAlert } = useAlert()

/** Состояние полноэкранного режима */
const isFullscreen = ref(false)

/** Переключает полноэкранный режим через Wails Runtime API */
const toggleFullscreen = async () => {
  try {
    if (window.runtime) {
      const isFull = await window.runtime.WindowIsFullscreen()
      if (isFull) {
        await window.runtime.WindowUnfullscreen()
        isFullscreen.value = false
      } else {
        await window.runtime.WindowFullscreen()
        isFullscreen.value = true
      }
    } else {
      // Fallback: браузерный Fullscreen API (например, в браузере вне Wails)
      if (document.fullscreenElement) {
        await document.exitFullscreen()
        isFullscreen.value = false
      } else {
        await document.documentElement.requestFullscreen()
        isFullscreen.value = true
      }
    }
  } catch {
    // Wails Runtime может быть недоступен — игнорируем
  }
}

/** Глобальный хоткей: F — полноэкранный режим (кроме полей ввода) */
const onGlobalKeydown = (e: KeyboardEvent) => {
  if (e.isComposing) return
  const target = e.target as HTMLElement
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return
  }
  if (e.code === 'KeyF') {
    e.preventDefault()
    toggleFullscreen()
  }
}

onMounted(() => {
  if (alertRef.value) {
    registerAlert(alertRef.value)
  }
  document.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<template>
  <div class="dark">
    <!-- Анимированный фон — один на все страницы, чтобы не перемонтировался -->
    <div class="animated-bg" aria-hidden="true">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
    </div>

    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
    <CustomAlert ref="alertRef" />
  </div>
</template>

<style>
.dark {
  position: relative;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ===== Анимированный фон (один на все страницы) ===== */

.animated-bg {
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: #000000;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  will-change: transform;
  pointer-events: none;
}

.orb-1 {
  width: 700px;
  height: 700px;
  background: radial-gradient(circle at 30% 30%, rgba(255, 10, 20, 0.35), transparent 70%);
  top: -200px;
  left: -200px;
  animation: orbFloat 25s ease-in-out infinite;
}

.orb-2 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle at 70% 70%, rgba(255, 60, 70, 0.25), transparent 70%);
  bottom: -150px;
  right: -150px;
  animation: orbFloat 30s ease-in-out infinite reverse;
}

.orb-3 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle at 50% 50%, rgba(255, 100, 110, 0.15), transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: orbPulse 20s ease-in-out infinite;
}

@keyframes orbFloat {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  25% {
    transform: translate(60px, -80px) scale(1.08);
  }

  50% {
    transform: translate(-40px, 40px) scale(0.92);
  }

  75% {
    transform: translate(70px, 50px) scale(1.04);
  }
}

@keyframes orbPulse {

  0%,
  100% {
    opacity: 0.4;
    transform: translate(-50%, -50%) scale(1);
  }

  50% {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1.3);
  }
}
</style>

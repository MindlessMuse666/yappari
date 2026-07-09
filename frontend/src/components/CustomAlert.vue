<template>
  <Teleport to="body">
    <Transition name="alert">
      <div v-if="visible" class="custom-alert-overlay" @click="handleOverlayClick">
        <div class="custom-alert" @click.stop>
          <div class="custom-alert-header">
            <span class="custom-alert-title">{{ title }}</span>
          </div>
          <div class="custom-alert-content">
            <p class="custom-alert-message">{{ message }}</p>
          </div>
          <div class="custom-alert-footer">
            <button @click="close" class="primary-btn">{{ buttonText }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
const title = ref('')
const message = ref('')
const buttonText = ref('OK')
let resolveCallback: (() => void) | null = null

const show = (params: { title?: string; message: string; buttonText?: string }): Promise<void> => {
  return new Promise((resolve) => {
    title.value = params.title || 'Уведомление'
    message.value = params.message
    buttonText.value = params.buttonText || 'OK'
    visible.value = true
    resolveCallback = resolve
  })
}

const close = () => {
  visible.value = false
  if (resolveCallback) {
    resolveCallback()
    resolveCallback = null
  }
}

const handleOverlayClick = () => {
  close()
}

defineExpose({ show })
</script>

<style scoped>
.custom-alert-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.custom-alert {
  background: #111111;
  border: 1px solid #c7cdd8;
  border-radius: 1.5rem;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: alertIn 0.3s ease-out;
}

@keyframes alertIn {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
}

.alert-enter-from .custom-alert,
.alert-leave-to .custom-alert {
  transform: scale(0.9) translateY(-20px);
}

.custom-alert-header {
  padding: 1.75rem 1.75rem 1rem;
  border-bottom: 1px solid #222222;
}

.custom-alert-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: white;
}

.custom-alert-content {
  padding: 1.25rem 1.75rem;
}

.custom-alert-message {
  color: #c7cdd8;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.custom-alert-footer {
  padding: 1rem 1.75rem 1.75rem;
  border-top: 1px solid #222222;
  display: flex;
  justify-content: center;
}

.primary-btn {
  background-color: #ff0a14;
  color: white;
  border: none;
  padding: 0.75rem 1.75rem;
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
}

.primary-btn:hover {
  background-color: #e00912;
  transform: translateY(-2px);
}
</style>

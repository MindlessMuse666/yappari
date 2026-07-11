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

import { ref, onMounted } from 'vue'
import CustomAlert from './components/CustomAlert.vue'
import { useAlert } from './composables/useAlert'

const alertRef = ref<InstanceType<typeof CustomAlert>>()
const { registerAlert } = useAlert()

onMounted(() => {
  if (alertRef.value) {
    registerAlert(alertRef.value)
  }
})
</script>

<template>
  <div class="dark">
    <router-view v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </router-view>
    <CustomAlert ref="alertRef" />
  </div>
</template>

<style>
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
</style>

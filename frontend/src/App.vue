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
    <router-view />
    <CustomAlert ref="alertRef" />
  </div>
</template>

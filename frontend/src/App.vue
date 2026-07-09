<script setup lang="ts">
import CustomAlert from './components/CustomAlert.vue'
import { useAlert } from './composables/useAlert'
import { ref, onMounted } from 'vue'

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

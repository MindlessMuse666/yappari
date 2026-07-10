/**
 * Точка входа Vue-приложения.
 *
 * Инициализирует Vue 3, подключает роутер и PrimeVue.
 *
 * @module main
 */

import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import PrimeVue from 'primevue/config'

const app = createApp(App)
app.use(router)
app.use(PrimeVue)
app.mount('#app')

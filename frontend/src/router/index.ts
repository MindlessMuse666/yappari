/**
 * Конфигурация маршрутов Vue Router.
 *
 * Определяет три основных маршрута приложения:
 * - `/` — главная страница (список колод)
 * - `/deck/:id` — управление колодой
 * - `/training` — тренировка
 *
 * Используется хэш-история (`createWebHashHistory`) для совместимости
 * с Wails (файловая схема не поддерживает HTML5 History API).
 *
 * @module router/index
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '../views/Home.vue'
import DeckManage from '../views/DeckManage.vue'
import Training from '../views/Training.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/deck/:id', name: 'DeckManage', component: DeckManage },
  { path: '/training', name: 'Training', component: Training },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router

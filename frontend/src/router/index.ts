/**
 * Конфигурация маршрутов Vue Router.
 *
 * Определяет маршруты приложения, включая страницы аутентификации.
 * Использует HTML5 History API (createWebHistory).
 * Auth-гард перенаправляет неаутентифицированных пользователей на /login.
 *
 * @module router/index
 */

import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import DeckManage from '../views/DeckManage.vue'
import Training from '../views/Training.vue'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/deck/:id', name: 'DeckManage', component: DeckManage },
  { path: '/training', name: 'Training', component: Training },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Auth-гард: проверяем наличие токена
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('yappari_token')

  // Публичные маршруты
  if (to.name === 'Login' || to.name === 'Register') {
    // Если уже аутентифицирован — на главную
    if (token) {
      next({ name: 'Home' })
    } else {
      next()
    }
    return
  }

  // Защищённые маршруты
  if (!token) {
    next({ name: 'Login' })
  } else {
    next()
  }
})

export default router

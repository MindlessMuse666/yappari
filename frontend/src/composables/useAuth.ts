/**
 * Композабл для аутентификации.
 *
 * Управляет JWT-токеном в localStorage.
 *
 * @module composables/useAuth
 */

import { ref } from 'vue'

const TOKEN_KEY = 'yappari_token'
const USER_KEY = 'yappari_user'

/** Реактивное состояние аутентификации */
const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
const user = ref<{ id: number; email: string } | null>(
  JSON.parse(localStorage.getItem(USER_KEY) || 'null'),
)

/**
 * Возвращает объект с методами для аутентификации.
 */
export function useAuth() {
  /**
   * Отправляет запрос на логин.
   */
  const login = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Ошибка входа')
    }

    const data = await response.json()
    token.value = data.token
    user.value = data.user
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  }

  /**
   * Отправляет запрос на регистрацию.
   */
  const register = async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Ошибка регистрации')
    }

    const data = await response.json()
    token.value = data.token
    user.value = data.user
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
  }

  /**
   * Выход из системы.
   */
  const logout = (): void => {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  /**
   * Проверяет, аутентифицирован ли пользователь.
   */
  const isAuthenticated = (): boolean => {
    return token.value !== null
  }

  /**
   * Возвращает токен для API-запросов.
   */
  const getToken = (): string | null => {
    return token.value
  }

  return {
    token,
    user,
    login,
    register,
    logout,
    isAuthenticated,
    getToken,
  }
}

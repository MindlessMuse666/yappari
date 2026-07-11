<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="header">
        <img src="/yappari_logo.png" alt="Yappari Logo" class="logo" draggable="false" />
        <h1>Yappari</h1>
      </div>
      <h2 class="auth-title">Вход</h2>

      <form @submit.prevent="handleLogin" class="auth-form" :class="{ shake: shake }" novalidate>
        <div class="input-group">
          <label for="email">Email</label>
          <InputText id="email" v-model="email" type="email" placeholder="Введите ваш email"
            class="custom-input" :class="{ 'input-error': errors.email }"
            autocomplete="email"
            @blur="onBlur('email')" @input="clearError('email')" />
          <div v-if="errors.email" class="field-error">{{ errors.email }}</div>
        </div>

        <div class="input-group">
          <label for="password">Пароль</label>
          <InputText id="password" v-model="password" type="password" placeholder="Введите пароль"
            class="custom-input" :class="{ 'input-error': errors.password }"
            autocomplete="current-password"
            @blur="onBlur('password')" @input="clearError('password')" />
          <div v-if="errors.password" class="field-error">{{ errors.password }}</div>
        </div>

        <div class="submit-error-space"><div v-if="submitError" class="submit-error">{{ submitError }}</div></div>

        <Button label="Войти" type="submit" class="primary-btn auth-btn" :loading="loading" />
      </form>

      <p class="auth-link">
        Нет аккаунта?
        <router-link to="/register">Зарегистрироваться</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useAuth } from '../composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const errors = ref({ email: '', password: '' })
const touched = ref({ email: false, password: false })
const submitError = ref('')
const loading = ref(false)
const shake = ref(false)

const triggerShake = () => {
  shake.value = true
  setTimeout(() => { shake.value = false }, 500)
}

const clearError = (field: keyof typeof errors.value) => {
  errors.value[field] = ''
}

const validateField = (field: keyof typeof errors.value): boolean => {
  switch (field) {
    case 'email':
      if (!email.value.trim()) {
        errors.value.email = 'Введите ваш email'
        return false
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
        errors.value.email = 'Некорректный формат email'
        return false
      }
      errors.value.email = ''
      return true
    case 'password':
      if (!password.value) {
        errors.value.password = 'Введите пароль'
        return false
      }
      if (password.value.length < 6) {
        errors.value.password = 'Минимум 6 символов'
        return false
      }
      errors.value.password = ''
      return true
  }
}

const onBlur = (field: keyof typeof errors.value) => {
  touched.value[field] = true
  validateField(field)
}

const validate = (): boolean => {
  touched.value.email = true
  touched.value.password = true
  const emailValid = validateField('email')
  const passwordValid = validateField('password')
  const valid = emailValid && passwordValid
  if (!valid) triggerShake()
  return valid
}

const handleLogin = async () => {
  submitError.value = ''
  if (!validate()) return

  loading.value = true
  try {
    await login(email.value.trim(), password.value)
    router.push('/')
  } catch (e: any) {
    submitError.value = e.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
  overflow: hidden;
  box-sizing: border-box;
}

/* ===== Карточка ===== */
.auth-card {
  position: relative;
  z-index: 1;
  background: #111111;
  border: 1px solid #222222;
  border-radius: 1rem;
  padding: 2.5rem;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 0.5rem;
  user-select: none;
  -webkit-user-drag: none;
  pointer-events: none;
}

.header h1 {
  font-size: 1.5rem;
  margin: 0;
  color: #ffffff;
}

.auth-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #c7cdd8;
  font-size: 1.2rem;
  font-weight: 500;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ===== Input group (как в DeckManage) ===== */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  color: #c7cdd8;
  font-size: 0.9rem;
  font-weight: 500;
}

.custom-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #c7cdd8;
  background: #111111;
  color: white;
  font-family: inherit;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
}

.custom-input::placeholder {
  color: #555555;
}

.custom-input:focus {
  border-color: #ffffff;
}

.custom-input.input-error {
  border-color: #ff0a14 !important;
}

.field-error {
  color: #ff4444;
  font-size: 0.85rem;
  margin-top: 0.1rem;
}

.submit-error {
  color: #ff0a14;
  font-size: 0.9rem;
  text-align: center;
  padding: 0.5rem;
  background: rgba(255, 10, 20, 0.06);
  border: 1px solid rgba(255, 10, 20, 0.15);
  border-radius: 0.5rem;
}

.submit-error-space {
  min-height: 0;
}

.auth-btn {
  width: 100%;
  margin-top: 0;
  padding: 0.85rem 1.5rem;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #c7cdd8;
  font-size: 0.9rem;
}

.auth-link a {
  color: #ff0a14;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s;
}

.auth-link a:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* ===== Shake ===== */
.shake {
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}
</style>

<style>
.p-dialog-mask {
  backdrop-filter: blur(8px);
  background: rgba(0, 0, 0, 0.5) !important;
  pointer-events: auto !important;
}

.auth-btn.p-button {
  border-radius: 0.75rem !important;
  font-weight: 600 !important;
  transition: all 0.2s !important;
  background: #ff0a14 !important;
  border: none !important;
  color: white !important;
  gap: 0.5rem !important;
}

.auth-btn.p-button:hover:not(:disabled) {
  background: #e00912 !important;
  transform: translateY(-2px) !important;
}

.auth-btn.p-button:disabled {
  opacity: 0.5 !important;
}
</style>

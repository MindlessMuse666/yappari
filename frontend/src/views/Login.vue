<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="header">
        <img src="/yappari_logo.png" alt="Yappari Logo" class="logo" draggable="false" />
        <h1>Yappari</h1>
      </div>
      <h2 class="auth-title">Вход</h2>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="input-group">
          <label for="email">Email</label>
          <InputText id="email" v-model="email" type="email" placeholder="your@email.com"
            class="custom-input" :class="{ 'input-error': error }" autocomplete="email" />
        </div>
        <div class="input-group">
          <label for="password">Пароль</label>
          <InputText id="password" v-model="password" type="password" placeholder="Минимум 6 символов"
            class="custom-input" :class="{ 'input-error': error }" autocomplete="current-password" />
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>

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
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''

  if (!email.value) {
    error.value = 'Введите email'
    return
  }
  if (!password.value || password.value.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов'
    return
  }

  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || 'Ошибка входа'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 1rem;
}

.auth-card {
  background: #111111;
  border: 1px solid #222222;
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 400px;
}

.header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.logo {
  width: 64px;
  height: 64px;
  margin-bottom: 0.5rem;
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
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group label {
  color: #c7cdd8;
  font-size: 0.9rem;
  margin-bottom: 0.3rem;
  display: block;
}

.custom-input {
  width: 100%;
}

.input-error {
  border-color: #ff0a14 !important;
}

.error-message {
  color: #ff0a14;
  font-size: 0.9rem;
  text-align: center;
}

.auth-btn {
  width: 100%;
  margin-top: 0.5rem;
}

.auth-link {
  text-align: center;
  margin-top: 1rem;
  color: #c7cdd8;
  font-size: 0.9rem;
}

.auth-link a {
  color: #ff0a14;
  text-decoration: none;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>

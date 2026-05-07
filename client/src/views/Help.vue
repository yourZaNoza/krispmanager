<template>
  <v-app>
    <Sidebar v-model="sidebarOpen" />

    <v-app-bar flat border="b" height="56" class="toolbar-no-padding">
      <div class="d-flex align-center" style="padding-left: 6px; gap: 6px; height: 100%">
        <v-btn
          :icon="sidebarOpen ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          variant="outlined"
          color="grey-darken-1"
          rounded="sm"
          class="toggle-btn"
          @click="sidebarOpen = !sidebarOpen"
        />
        <SearchBar style="width: 400px" />
      </div>
      <v-spacer />
    </v-app-bar>

    <v-main>
      <div class="page-header d-flex align-center px-6">
        <span style="font-size: 24px; font-weight: 700">Помощь</span>
      </div>

      <div class="help-content px-6 pb-10">
        <div class="help-card">
          <!-- Card header -->
          <div class="help-header">
            <div class="help-icon">
              <v-icon size="28" color="white">mdi-help</v-icon>
            </div>
            <div>
              <h2 class="help-title">Вам нужна помощь?</h2>
              <p class="help-subtitle">Отправьте запрос, и мы свяжемся с вами в ближайшее время.</p>
            </div>
          </div>

          <!-- Success state -->
          <div v-if="sent" class="help-success">
            <v-icon size="48" color="success" class="mb-3">mdi-check-circle-outline</v-icon>
            <p class="help-success-text">Ваше обращение отправлено!</p>
            <p class="help-success-sub">Мы ответим на указанный адрес электронной почты.</p>
            <v-btn
              variant="outlined"
              color="success"
              class="text-none mt-4"
              @click="reset"
            >Отправить ещё одно</v-btn>
          </div>

          <!-- Form -->
          <v-form v-else ref="formRef" @submit.prevent="submit">
            <div class="help-field-group">
              <label class="help-label">Укажите тему вашего обращения</label>
              <v-select
                v-model="form.topic"
                :items="TOPICS"
                placeholder="-"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />
            </div>

            <div class="help-field-group">
              <label class="help-label">
                Ваш адрес электронной почты
                <span class="help-required">*</span>
              </label>
              <v-text-field
                v-model="form.email"
                placeholder="example@domain.com"
                type="email"
                variant="outlined"
                density="comfortable"
                :rules="emailRules"
                hide-details="auto"
              />
            </div>

            <div class="help-field-group">
              <label class="help-label">
                Опишите вашу проблему
                <span class="help-required">*</span>
              </label>
              <p class="help-hint">
                Введите здесь свой вопрос или описание проблемы, которую вы пытаетесь решить.
                Пожалуйста, постарайтесь быть как можно более конкретным.
              </p>
              <v-textarea
                v-model="form.description"
                variant="outlined"
                rows="5"
                :rules="requiredRules"
                hide-details="auto"
                no-resize
              />
            </div>

            <p v-if="errorMsg" class="help-error">{{ errorMsg }}</p>

            <v-btn
              type="submit"
              color="success"
              class="text-none help-submit"
              :loading="loading"
              size="large"
            >Отправить</v-btn>
          </v-form>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive } from 'vue'
import axios from 'axios'
import Sidebar   from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

const TOPICS = [
  'Технические проблемы',
  'Вопрос по функционалу',
  'Предложение по улучшению',
  'Ошибка в данных',
  'Другое',
]

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const sidebarOpen = ref(true)
const formRef     = ref(null)
const loading     = ref(false)
const sent        = ref(false)
const errorMsg    = ref('')

const form = reactive({ topic: '', email: '', description: '' })

const emailRules    = [
  v => !!v          || 'Укажите email',
  v => /.+@.+\..+/.test(v) || 'Некорректный email',
]
const requiredRules = [v => !!v?.trim() || 'Поле обязательно']

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  loading.value  = true
  errorMsg.value = ''
  try {
    await api.post('/api/help', { topic: form.topic, email: form.email, description: form.description })
    sent.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.message || 'Не удалось отправить обращение. Попробуйте позже.'
  } finally {
    loading.value = false
  }
}

function reset() {
  sent.value = false
  form.topic = ''
  form.email = ''
  form.description = ''
  errorMsg.value = ''
  formRef.value?.resetValidation()
}
</script>

<style scoped>
.page-header {
  height: 56px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.help-content {
  display: flex;
  justify-content: center;
  padding-top: 40px;
}

.help-card {
  width: 100%;
  max-width: 560px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 36px 40px 40px;
}

.help-header {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 32px;
}

.help-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #037247;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.help-title {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 4px;
  line-height: 1.2;
}

.help-subtitle {
  font-size: 13px;
  color: #757575;
  margin: 0;
  line-height: 1.4;
}

.help-field-group {
  margin-bottom: 24px;
}

.help-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
  margin-bottom: 8px;
}

.help-required {
  color: #e53935;
  margin-left: 2px;
}

.help-hint {
  font-size: 12px;
  color: #9e9e9e;
  margin: 0 0 8px;
  line-height: 1.5;
}

.help-submit {
  width: 100%;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  margin-top: 8px;
}

.help-error {
  font-size: 13px;
  color: #e53935;
  margin-bottom: 8px;
}

.help-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 0 8px;
}

.help-success-text {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 6px;
}

.help-success-sub {
  font-size: 13px;
  color: #757575;
  margin: 0;
}

/* Dark theme */
:global(.v-theme--dark) .help-card {
  background: #1e1e1e;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
:global(.v-theme--dark) .help-title  { color: #ffffff; }
:global(.v-theme--dark) .help-label  { color: #e0e0e0; }
:global(.v-theme--dark) .help-success-text { color: #ffffff; }
:global(.v-theme--dark) .page-header { border-color: rgba(255, 255, 255, 0.08); }
</style>

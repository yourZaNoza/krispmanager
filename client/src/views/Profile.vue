<template>
  <v-app>
    <Sidebar v-model="sidebarOpen" />

    <v-app-bar flat border="b" height="56" class="toolbar-no-padding">
      <div class="d-flex align-center" style="padding-left: 6px; gap: 6px; height: 100%;">
        <v-btn
          :icon="sidebarOpen ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          variant="outlined"
          color="grey-darken-1"
          rounded="sm"
          class="toggle-btn"
          @click="sidebarOpen = !sidebarOpen"
        />
        <SearchBar style="width: 400px;" />
      </div>
      <v-spacer />
    </v-app-bar>

    <v-main>
      <div class="profile-header d-flex align-center px-6">
        <span style="font-size: 24px; font-weight: 700;">Профиль</span>
      </div>

      <div class="px-6 pb-6" style="max-width: 600px;">
        <!-- Аватар -->
        <div class="d-flex align-center mb-8" style="gap: 20px;">
          <v-avatar size="80" color="grey-lighten-2">
            <span class="text-h5 font-weight-medium text-grey-darken-2">
              {{ initials }}
            </span>
          </v-avatar>
          <div>
            <p class="text-subtitle-1 font-weight-medium mb-0">{{ form.name || '—' }}</p>
            <p class="text-body-2 text-grey">{{ form.email }}</p>
          </div>
        </div>

        <v-divider class="mb-6" />

        <!-- Форма -->
        <v-form ref="profileForm" @submit.prevent="save">
          <div class="d-flex flex-column" style="gap: 20px;">
            <div>
              <p class="text-caption text-grey mb-1">Имя</p>
              <v-text-field
                v-model="form.name"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :rules="[v => !!v || 'Обязательное поле']"
              />
            </div>

            <div>
              <p class="text-caption text-grey mb-1">Email</p>
              <v-text-field
                v-model="form.email"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                type="email"
                :rules="[v => !!v || 'Обязательное поле', v => /.+@.+\..+/.test(v) || 'Некорректный email']"
              />
            </div>

            <div>
              <p class="text-caption text-grey mb-1">Должность</p>
              <v-text-field
                v-model="form.position"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                placeholder="Не указана"
              />
            </div>

            <div>
              <p class="text-caption text-grey mb-1">Роль</p>
              <v-select
                v-model="form.role"
                :items="ROLES"
                variant="outlined"
                density="comfortable"
                hide-details
              />
            </div>
          </div>

          <v-divider class="my-6" />

          <div class="d-flex" style="gap: 12px;">
            <v-btn
              type="submit"
              style="background-color: #037247;"
              class="text-white text-none"
            >
              Сохранить
            </v-btn>
            <v-btn
              variant="outlined"
              color="grey-darken-1"
              class="text-none"
              @click="reset"
            >
              Отменить
            </v-btn>
          </div>
        </v-form>

        <v-snackbar v-model="saved" color="success" timeout="2000" location="bottom right">
          Изменения сохранены
        </v-snackbar>
        <v-snackbar v-model="showError" color="error" timeout="3000" location="bottom right">
          {{ saveError }}
        </v-snackbar>
      </div>

      <!-- Совместные задачи -->
      <div class="px-6 pb-8" style="max-width: 800px;">
        <v-divider class="mb-6" />
        <div class="d-flex align-center mb-4" style="gap: 10px;">
          <span style="font-size: 18px; font-weight: 600;">Совместные задачи</span>
          <v-chip size="small" color="success" variant="tonal">{{ participatingTasks.length }}</v-chip>
        </div>

        <div v-if="loadingTasks" class="d-flex justify-center py-6">
          <v-progress-circular indeterminate color="success" size="28" />
        </div>

        <div v-else-if="!participatingTasks.length" class="text-grey text-body-2 py-4">
          Вы не добавлены ни в одну задачу другого сотрудника
        </div>

        <div v-else class="d-flex flex-column" style="gap: 8px;">
          <div
            v-for="task in participatingTasks"
            :key="task.id"
            class="part-task-row"
          >
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex flex-column" style="gap: 2px; min-width: 0;">
                <span class="text-body-2 font-weight-medium text-truncate">{{ task.title }}</span>
                <span v-if="task.enterprise" class="text-caption text-grey text-truncate">{{ task.enterprise }}</span>
              </div>
              <div class="d-flex align-center flex-shrink-0" style="gap: 8px; margin-left: 12px;">
                <v-chip
                  v-if="task.completed"
                  size="x-small"
                  color="success"
                  variant="tonal"
                >Выполнена</v-chip>
                <span class="text-caption text-grey" style="white-space: nowrap;">
                  <v-icon size="12" class="mr-1">mdi-calendar-outline</v-icon>{{ task.deadline }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const ROLES = ['сотрудник', 'менеджер', 'администратор']

const sidebarOpen = ref(true)
const saved = ref(false)
const saveError = ref('')
const showError = ref(false)
const profileForm = ref(null)

const participatingTasks = ref([])
const loadingTasks = ref(false)

const form = ref({ name: '', email: '', position: '', role: 'сотрудник' })
const original = ref({ name: '', email: '', position: '', role: 'сотрудник' })

onMounted(async () => {
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      form.value = {
        name: user.name || '',
        email: user.email || '',
        position: user.position || '',
        role: user.role || 'сотрудник',
      }
      original.value = { ...form.value }
    }
  } catch {}

  loadingTasks.value = true
  try {
    const { data } = await api.get('/api/tasks/participating')
    participatingTasks.value = data
  } catch (e) {
    console.error('Failed to load participating tasks:', e)
  } finally {
    loadingTasks.value = false
  }
})

const initials = computed(() => {
  const parts = (form.value.name || '').trim().split(' ')
  return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?'
})

const save = async () => {
  const { valid } = await profileForm.value.validate()
  if (!valid) return
  saveError.value = ''

  try {
    const { data } = await api.put('/api/auth/profile', {
      name: form.value.name,
      email: form.value.email,
      position: form.value.position,
      role: form.value.role,
    })

    const stored = localStorage.getItem('user')
    const user = stored ? JSON.parse(stored) : {}
    const updated = { ...user, name: data.name, email: data.email, position: data.position, role: data.role }
    localStorage.setItem('user', JSON.stringify(updated))
    original.value = { ...form.value }
    saved.value = true
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Ошибка сохранения'
    showError.value = true
  }
}

const reset = () => {
  form.value = { ...original.value }
}
</script>

<style scoped>
.profile-header {
  height: 64px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.toggle-btn {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  flex-shrink: 0;
}

.toolbar-no-padding :deep(.v-toolbar__content) {
  padding: 0 !important;
}

.part-task-row {
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #fafafa;
}
</style>

<style>
.v-theme--dark .part-task-row {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}
</style>

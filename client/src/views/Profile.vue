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

      <div class="profile-content">
        <!-- Аватар -->
        <div class="avatar-section">
          <div class="avatar-wrap" @click="triggerAvatarPick">
            <UserAvatar :user-id="userId" :name="form.name" :size="80" />
            <div class="avatar-overlay">
              <v-progress-circular v-if="avatarLoading" indeterminate size="22" color="white" width="2" />
              <v-icon v-else size="22" color="white">mdi-camera-outline</v-icon>
            </div>
          </div>
          <input
            ref="avatarInput"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            style="display: none"
            @change="onAvatarPick"
          />
          <div class="avatar-info">
            <p class="avatar-name">{{ form.name || '—' }}</p>
            <p class="avatar-email">{{ form.email }}</p>
            <span class="avatar-hint">Нажмите на аватар для загрузки (до 25 МБ)</span>
          </div>
        </div>

        <v-divider class="section-divider" />

        <!-- Форма -->
        <v-form ref="profileForm" @submit.prevent="save">
          <div class="form-fields">
            <div class="field-group">
              <label class="field-label">Имя</label>
              <v-text-field
                v-model="form.name"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                :rules="[v => !!v || 'Обязательное поле']"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Email</label>
              <v-text-field
                v-model="form.email"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                type="email"
                :rules="[v => !!v || 'Обязательное поле', v => /.+@.+\..+/.test(v) || 'Некорректный email']"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Должность</label>
              <v-text-field
                v-model="form.position"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
                placeholder="Не указана"
              />
            </div>

            <div class="field-group">
              <label class="field-label">Роль</label>
              <v-select
                v-if="canEditRole"
                v-model="form.role"
                :items="ROLES"
                variant="outlined"
                density="comfortable"
                hide-details
              />
              <div v-else class="field-readonly">{{ form.role || '—' }}</div>
            </div>
          </div>

          <v-divider class="section-divider" />

          <div class="form-actions">
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
      <div class="tasks-section">
        <v-divider class="section-divider" />
        <div class="d-flex align-center mb-5" style="gap: 10px;">
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
      </div><!-- /tasks-section -->
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Sidebar     from '@/components/Sidebar.vue'
import SearchBar   from '@/components/SearchBar.vue'
import UserAvatar  from '@/components/UserAvatar.vue'
import { setAvatarUrl } from '@/utils/avatarCache'
import { getStoredUser, setStoredUser } from '@/utils/authStorage'

const api = axios.create({ withCredentials: true })

const ROLES = ['сотрудник', 'менеджер', 'администратор']
const ADMIN_EMAIL = 'test@gmail.com'

const sidebarOpen = ref(true)
const saved = ref(false)
const saveError = ref('')
const showError = ref(false)
const profileForm = ref(null)

const participatingTasks = ref([])
const loadingTasks = ref(false)

const form     = ref({ name: '', email: '', position: '', role: 'сотрудник' })
const original = ref({ name: '', email: '', position: '', role: 'сотрудник' })
const userId          = ref(null)
const currentUserEmail = ref('')

const canEditRole = computed(() => currentUserEmail.value === ADMIN_EMAIL)

const avatarInput   = ref(null)
const avatarLoading = ref(false)
const avatarError   = ref('')

function triggerAvatarPick() { avatarInput.value?.click() }

async function onAvatarPick(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return
  if (file.size > 25 * 1024 * 1024) {
    avatarError.value = 'Файл слишком большой (максимум 25 МБ)'
    showError.value = true
    saveError.value = avatarError.value
    return
  }
  avatarLoading.value = true
  try {
    const fd = new FormData()
    fd.append('avatar', file)
    const { data } = await api.post('/api/auth/avatar', fd)
    setAvatarUrl(userId.value, data.avatar)
    const user = getStoredUser()
    setStoredUser({ ...user, avatar: data.avatar })
  } catch (err) {
    saveError.value = err.response?.data?.message || 'Ошибка загрузки аватара'
    showError.value = true
  } finally {
    avatarLoading.value = false
  }
}

onMounted(async () => {
  const user = getStoredUser()
  userId.value = user.id || null
  currentUserEmail.value = user.email || ''
  form.value = {
    name: user.name || '',
    email: user.email || '',
    position: user.position || '',
    role: user.role || null,
  }
  original.value = { ...form.value }

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

    const user = getStoredUser()
    const updated = { ...user, name: data.name, email: data.email, position: data.position, role: data.role }
    setStoredUser(updated)
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
/* App bar */
.toolbar-no-padding :deep(.v-toolbar__content) { padding: 0 !important; }
.toggle-btn {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  flex-shrink: 0;
}

/* Page header */
.profile-header {
  height: 56px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 0 24px;
}

/* Main content wrapper */
.profile-content {
  max-width: 560px;
  padding: 28px 24px 8px;
}

/* Avatar interactive wrapper */
.avatar-wrap {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  flex-shrink: 0;
}
.avatar-wrap:hover .avatar-overlay { opacity: 1; }
.avatar-overlay {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.18s;
}

/* Avatar block */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 28px;
}
.avatar-info { display: flex; flex-direction: column; gap: 3px; }
.avatar-name  { font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 0; }
.avatar-email { font-size: 13px; color: #757575; margin: 0; }
.avatar-hint  { font-size: 12px; color: #9e9e9e; }

/* Dividers */
.section-divider { margin-bottom: 24px; }

/* Form fields */
.form-fields { display: flex; flex-direction: column; gap: 20px; margin-bottom: 24px; }
.field-group { display: flex; flex-direction: column; gap: 6px; }
.field-label { font-size: 12px; color: #757575; font-weight: 400; }

/* Read-only role field — matches v-text-field outlined comfortable */
.field-readonly {
  border: 1px solid rgba(0, 0, 0, 0.38);
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 16px;
  color: rgba(0, 0, 0, 0.6);
  min-height: 48px;
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.03);
}

/* Form action buttons */
.form-actions { display: flex; gap: 12px; padding-bottom: 8px; }

/* Shared tasks section */
.tasks-section {
  max-width: 560px;
  padding: 0 24px 40px;
}
.part-task-row {
  padding: 10px 14px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  background: #fafafa;
}
</style>

<style>
/* Dark theme overrides */
.v-theme--dark .avatar-name  { color: #ffffff !important; }
.v-theme--dark .profile-header { border-color: rgba(255, 255, 255, 0.08) !important; }
.v-theme--dark .field-readonly {
  border-color: rgba(255, 255, 255, 0.3) !important;
  color: rgba(255, 255, 255, 0.7) !important;
  background: rgba(255, 255, 255, 0.04) !important;
}
.v-theme--dark .part-task-row {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.12) !important;
}
</style>

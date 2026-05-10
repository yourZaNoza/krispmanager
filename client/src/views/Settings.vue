<template>
  <v-app>
    <Sidebar v-model="sidebarOpen" />

    <v-app-bar flat border="b" height="56" class="toolbar-no-padding">
      <div class="d-flex align-center" style="padding-left: 6px; gap: 6px; height: 100%;">
        <v-btn
          :icon="sidebarOpen ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          variant="outlined" color="grey-darken-1" rounded="sm" class="toggle-btn"
          @click="sidebarOpen = !sidebarOpen"
        />
        <SearchBar style="width: 400px;" />
      </div>
      <v-spacer />
    </v-app-bar>

    <v-main>
      <div class="page-header d-flex align-center px-6">
        <span style="font-size: 24px; font-weight: 700;">Настройки</span>
      </div>

      <div class="px-6 py-6" style="max-width: 800px;">

        <!-- Тема -->
        <div class="d-flex align-center justify-space-between mb-6 pb-6" style="border-bottom: 1px solid rgba(0,0,0,0.08);">
          <div>
            <p class="text-body-1 font-weight-bold mb-0">Тема оформления</p>
            <p class="text-caption text-grey mb-0">{{ isDark ? 'Тёмная' : 'Светлая' }}</p>
          </div>
          <div class="d-flex align-center" style="gap: 16px;">
            <v-icon size="22" color="grey-darken-1">{{ isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny' }}</v-icon>
            <v-switch
              :model-value="isDark" color="success" hide-details density="compact"
              @update:model-value="toggleTheme"
            />
          </div>
        </div>

        <!-- Панель администратора -->
        <template v-if="isAdmin">

          <!-- Заголовок панели -->
          <div class="mb-8">
            <p style="font-size: 22px; font-weight: 700; margin-bottom: 4px;">Панель администратора</p>
            <p class="text-body-2 text-grey mb-0">Управление глобальными настройками системы</p>
          </div>

          <!-- 1. Категории задач -->
          <AdminSection
            title="Категории задач"
            description="Видны всем пользователям. Определяют колонки на канбан-доске."
            :loading="loading.taskCats"
            :items="taskCats"
            @add="openDialog('taskCat')"
            @edit="openEdit('taskCat', $event)"
            @delete="deleteItem('taskCat', $event)"
          />

          <!-- 2. Категории контактов -->
          <AdminSection
            title="Категории контактов"
            description="Группы для организации контактов."
            :loading="loading.contactCats"
            :items="contactCats"
            @add="openDialog('contactCat')"
            @edit="openEdit('contactCat', $event)"
            @delete="deleteItem('contactCat', $event)"
          />

          <!-- 3. Категории предприятий -->
          <AdminSection
            title="Категории предприятий"
            description="Группы для организации предприятий."
            :loading="loading.entCats"
            :items="entCats"
            @add="openDialog('entCat')"
            @edit="openEdit('entCat', $event)"
            @delete="deleteItem('entCat', $event)"
          />

          <!-- 4. Отметки для задач -->
          <AdminSection
            title="Отметки для задач"
            description="Цветные теги, доступные при создании и редактировании задач."
            :loading="loading.taskTags"
            :items="taskTags"
            :is-tag="true"
            @add="openDialog('taskTag')"
            @edit="openEdit('taskTag', $event)"
            @delete="deleteItem('taskTag', $event)"
          />

          <!-- 5. Отметки для заметок -->
          <AdminSection
            title="Отметки для заметок"
            description="Цветные теги, доступные при создании и редактировании заметок."
            :loading="loading.noteTags"
            :items="noteTags"
            :is-tag="true"
            @add="openDialog('noteTag')"
            @edit="openEdit('noteTag', $event)"
            @delete="deleteItem('noteTag', $event)"
          />

          <!-- 6. Пользователи -->
          <div class="mb-8">
            <div class="section-header mb-2">
              <p class="text-body-1 font-weight-bold mb-0">Пользователи</p>
              <p class="text-caption text-grey mb-0">Просмотр зарегистрированных сотрудников и назначение ролей.</p>
            </div>
            <v-card variant="outlined" rounded="lg">
              <div v-if="loading.users" class="text-center py-6">
                <v-progress-circular indeterminate size="24" color="success" />
              </div>
              <div v-else-if="!users.length" class="text-center py-6 text-grey text-body-2">Нет пользователей</div>
              <template v-else>
                <div
                  v-for="(user, i) in users" :key="user.id"
                  class="d-flex align-center px-4 py-3"
                  :style="{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.07)' : 'none' }"
                >
                  <UserAvatar :user-id="user.id" :name="user.name" :size="32" style="margin-right: 14px; flex-shrink: 0;" />
                  <div style="flex: 1; min-width: 0;">
                    <p class="text-body-2 font-weight-medium mb-0 text-truncate">{{ user.name }}</p>
                    <p class="text-caption text-grey mb-0 text-truncate">{{ user.email }}</p>
                  </div>
                  <v-select
                    :model-value="user.role"
                    :items="ROLES"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="max-width: 160px;"
                    class="ml-3"
                    @update:model-value="updateRole(user, $event)"
                  />
                </div>
              </template>
            </v-card>
          </div>

        </template>

        <template v-else>
          <div class="text-center text-grey" style="margin-top: 80px;">
            <v-icon size="48" color="grey-lighten-1">mdi-cog-outline</v-icon>
            <p class="text-body-1 mt-3">Настройки профиля доступны в разделе «Профиль»</p>
          </div>
        </template>

      </div>
    </v-main>

    <!-- Диалог создания/редактирования -->
    <CategoryDialog
      v-model="dialog.open"
      :item="dialog.item"
      :dialog-title="dialog.title"
      :has-bg="dialog.hasBg"
      @save="onDialogSave"
    />

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500" location="bottom right">
      {{ snack.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useTheme } from 'vuetify'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import CategoryDialog from '@/components/tasks/CategoryDialog.vue'
import AdminSection from '@/components/admin/AdminSection.vue'
import UserAvatar from '@/components/UserAvatar.vue'

const { global: vTheme } = useTheme()
const isDark = computed(() => vTheme.current.value.dark)
const toggleTheme = (val) => { vTheme.name.value = val ? 'dark' : 'light'; localStorage.setItem('theme', val ? 'dark' : 'light') }

const sidebarOpen = ref(true)
const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const isAdmin = computed(() => {
  try { return JSON.parse(localStorage.getItem('user') || '{}').role === 'администратор' } catch { return false }
})

const ROLES = ['сотрудник', 'менеджер', 'администратор']

const taskCats   = ref([])
const contactCats = ref([])
const entCats    = ref([])
const taskTags   = ref([])
const noteTags   = ref([])
const users      = ref([])

const loading = ref({ taskCats: false, contactCats: false, entCats: false, taskTags: false, noteTags: false, users: false })
const snack   = ref({ show: false, text: '', color: 'success' })

const dialog = ref({ open: false, type: '', title: '', hasBg: false, item: null })

const showSnack = (text, color = 'success') => { snack.value = { show: true, text, color } }

const initials = (name) => (name || '').trim().split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || '?'

onMounted(async () => {
  if (!isAdmin.value) return
  await Promise.all([loadTaskCats(), loadContactCats(), loadEntCats(), loadTaskTags(), loadNoteTags(), loadUsers()])
})

async function loadTaskCats() {
  loading.value.taskCats = true
  try { const { data } = await api.get('/api/tasks/categories/global'); taskCats.value = data.map(c => ({ id: c.id, title: c.title, color: c.dotColor || c.color })) }
  catch { showSnack('Ошибка загрузки категорий задач', 'error') }
  finally { loading.value.taskCats = false }
}
async function loadContactCats() {
  loading.value.contactCats = true
  try { const { data } = await api.get('/api/contacts'); contactCats.value = data.map(c => ({ id: c.id, title: c.title, color: c.color })) }
  catch { showSnack('Ошибка загрузки категорий контактов', 'error') }
  finally { loading.value.contactCats = false }
}
async function loadEntCats() {
  loading.value.entCats = true
  try { const { data } = await api.get('/api/enterprises'); entCats.value = data.map(c => ({ id: c.id, title: c.title, color: c.color })) }
  catch { showSnack('Ошибка загрузки категорий предприятий', 'error') }
  finally { loading.value.entCats = false }
}
async function loadTaskTags() {
  loading.value.taskTags = true
  try { const { data } = await api.get('/api/tags?scope=task'); taskTags.value = data }
  catch { showSnack('Ошибка загрузки тегов задач', 'error') }
  finally { loading.value.taskTags = false }
}
async function loadNoteTags() {
  loading.value.noteTags = true
  try { const { data } = await api.get('/api/tags?scope=note'); noteTags.value = data }
  catch { showSnack('Ошибка загрузки тегов заметок', 'error') }
  finally { loading.value.noteTags = false }
}
async function loadUsers() {
  loading.value.users = true
  try { const { data } = await api.get('/api/auth/users'); users.value = data }
  catch { showSnack('Ошибка загрузки пользователей', 'error') }
  finally { loading.value.users = false }
}

function openDialog(type) {
  const cfg = dialogConfig(type)
  dialog.value = { open: true, type, title: cfg.createTitle, hasBg: cfg.hasBg, item: null }
}
function openEdit(type, item) {
  const cfg = dialogConfig(type)
  dialog.value = { open: true, type, title: cfg.editTitle, hasBg: cfg.hasBg, item }
}

function dialogConfig(type) {
  const map = {
    taskCat:    { createTitle: 'Новая категория задач',        editTitle: 'Редактировать категорию задач',        hasBg: false },
    contactCat: { createTitle: 'Новая категория контактов',    editTitle: 'Редактировать категорию контактов',    hasBg: false },
    entCat:     { createTitle: 'Новая категория предприятий',  editTitle: 'Редактировать категорию предприятий',  hasBg: false },
    taskTag:    { createTitle: 'Новая отметка для задач',      editTitle: 'Редактировать отметку задачи',         hasBg: true  },
    noteTag:    { createTitle: 'Новая отметка для заметок',    editTitle: 'Редактировать отметку заметки',        hasBg: true  },
  }
  return map[type]
}

async function onDialogSave({ name, color, bg }) {
  const { type, item } = dialog.value
  try {
    if (type === 'taskCat') {
      if (item) {
        await api.put(`/api/tasks/categories/${item.id}`, { name, color })
        const idx = taskCats.value.findIndex(c => c.id === item.id)
        if (idx >= 0) taskCats.value[idx] = { ...taskCats.value[idx], title: name, color }
        showSnack('Категория обновлена')
      } else {
        const { data } = await api.post('/api/tasks/categories/global', { name, color })
        taskCats.value.push({ id: data.id, title: data.title, color: data.dotColor || data.color })
        showSnack('Категория добавлена')
      }
    } else if (type === 'contactCat') {
      if (item) {
        await api.put(`/api/contacts/categories/${item.id}`, { title: name, color })
        const idx = contactCats.value.findIndex(c => c.id === item.id)
        if (idx >= 0) contactCats.value[idx] = { ...contactCats.value[idx], title: name, color }
        showSnack('Категория обновлена')
      } else {
        const { data } = await api.post('/api/contacts/categories', { title: name, color })
        contactCats.value.push(data)
        showSnack('Категория добавлена')
      }
    } else if (type === 'entCat') {
      if (item) {
        await api.put(`/api/enterprises/categories/${item.id}`, { title: name, color })
        const idx = entCats.value.findIndex(c => c.id === item.id)
        if (idx >= 0) entCats.value[idx] = { ...entCats.value[idx], title: name, color }
        showSnack('Категория обновлена')
      } else {
        const { data } = await api.post('/api/enterprises/categories', { title: name, color })
        entCats.value.push(data)
        showSnack('Категория добавлена')
      }
    } else if (type === 'taskTag') {
      if (item) {
        await api.put(`/api/tags/${item.id}`, { label: name, bg, color })
        const idx = taskTags.value.findIndex(t => t.id === item.id)
        if (idx >= 0) taskTags.value[idx] = { ...taskTags.value[idx], label: name, bg, color }
        showSnack('Отметка обновлена')
      } else {
        const { data } = await api.post('/api/tags', { scope: 'task', label: name, bg, color })
        taskTags.value.push(data)
        showSnack('Отметка добавлена')
      }
    } else if (type === 'noteTag') {
      if (item) {
        await api.put(`/api/tags/${item.id}`, { label: name, bg, color })
        const idx = noteTags.value.findIndex(t => t.id === item.id)
        if (idx >= 0) noteTags.value[idx] = { ...noteTags.value[idx], label: name, bg, color }
        showSnack('Отметка обновлена')
      } else {
        const { data } = await api.post('/api/tags', { scope: 'note', label: name, bg, color })
        noteTags.value.push(data)
        showSnack('Отметка добавлена')
      }
    }
  } catch (err) {
    showSnack(err.response?.data?.message || 'Ошибка', 'error')
  }
}

async function deleteItem(type, item) {
  try {
    if (type === 'taskCat') {
      await api.delete(`/api/tasks/categories/${item.id}`)
      taskCats.value = taskCats.value.filter(c => c.id !== item.id)
    } else if (type === 'contactCat') {
      await api.delete(`/api/contacts/categories/${item.id}`)
      contactCats.value = contactCats.value.filter(c => c.id !== item.id)
    } else if (type === 'entCat') {
      await api.delete(`/api/enterprises/categories/${item.id}`)
      entCats.value = entCats.value.filter(c => c.id !== item.id)
    } else if (type === 'taskTag') {
      await api.delete(`/api/tags/${item.id}`)
      taskTags.value = taskTags.value.filter(t => t.id !== item.id)
    } else if (type === 'noteTag') {
      await api.delete(`/api/tags/${item.id}`)
      noteTags.value = noteTags.value.filter(t => t.id !== item.id)
    }
    showSnack('Удалено')
  } catch (err) {
    showSnack(err.response?.data?.message || 'Ошибка удаления', 'error')
  }
}

async function updateRole(user, role) {
  try {
    await api.put(`/api/auth/users/${user.id}/role`, { role })
    user.role = role
    showSnack(`Роль ${user.name} обновлена`)
  } catch (err) {
    showSnack(err.response?.data?.message || 'Ошибка', 'error')
  }
}
</script>

<style scoped>
.page-header { height: 64px; border-bottom: 1px solid rgba(0,0,0,0.12); }
.toggle-btn { width: 36px !important; height: 36px !important; min-width: 36px !important; flex-shrink: 0; }
.toolbar-no-padding :deep(.v-toolbar__content) { padding: 0 !important; }
.section-header { padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 12px; }
</style>

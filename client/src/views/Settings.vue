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
            @delete="askDelete('taskCat', $event)"
          />

          <!-- 2. Категории контактов -->
          <AdminSection
            title="Категории контактов"
            description="Группы для организации контактов."
            :loading="loading.contactCats"
            :items="contactCats"
            @add="openDialog('contactCat')"
            @edit="openEdit('contactCat', $event)"
            @delete="askDelete('contactCat', $event)"
          />

          <!-- 3. Категории предприятий -->
          <AdminSection
            title="Категории предприятий"
            description="Группы для организации предприятий."
            :loading="loading.entCats"
            :items="entCats"
            @add="openDialog('entCat')"
            @edit="openEdit('entCat', $event)"
            @delete="askDelete('entCat', $event)"
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
            @delete="askDelete('taskTag', $event)"
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
            @delete="askDelete('noteTag', $event)"
          />

          <!-- 6. Правила для аналитики -->
          <div class="mb-8">
            <div class="section-header mb-2">
              <p class="text-body-1 font-weight-bold mb-0">Правила для аналитики</p>
              <p class="text-caption text-grey mb-0">Настройка правил подсчёта и отображения аналитических данных.</p>
            </div>
            <v-card variant="outlined" rounded="lg">
              <div class="text-center py-8 text-grey text-body-2">Раздел в разработке</div>
            </v-card>
          </div>

          <!-- 7. Правила выгрузки отчётов -->
          <div class="mb-8">
            <div class="section-header mb-2">
              <p class="text-body-1 font-weight-bold mb-0">Правила выгрузки отчётов</p>
              <p class="text-caption text-grey mb-0">Настройка шаблонов и параметров экспорта отчётов.</p>
            </div>
            <v-card variant="outlined" rounded="lg">
              <div class="text-center py-8 text-grey text-body-2">Раздел в разработке</div>
            </v-card>
          </div>

          <!-- 8. Пользователи -->
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
                  <div class="d-flex align-center" style="gap: 8px; margin-left: 12px; flex-shrink: 0;">
                    <v-select
                      :model-value="pendingRoleOf(user)"
                      :items="ROLE_OPTIONS"
                      item-title="title"
                      item-value="value"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="width: 170px;"
                      @update:model-value="setPendingRole(user, $event)"
                    />
                    <v-btn
                      icon size="x-small" variant="plain" density="compact"
                      title="Удалить пользователя"
                      @click.stop="askDeleteUser(user)"
                    >
                      <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
                    </v-btn>
                  </div>
                </div>
              </template>
            </v-card>
            <div class="d-flex justify-end mt-3">
              <v-btn
                color="success"
                variant="flat"
                class="text-none"
                :loading="savingRoles"
                :disabled="!hasPendingRoles"
                @click="saveRoles"
              >
                Сохранить роли
              </v-btn>
            </div>
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

    <!-- Delete item confirmation -->
    <v-dialog v-model="deleteItemDialog" max-width="420">
      <v-card rounded="lg" class="pa-6">
        <p class="text-body-1 font-weight-medium mb-6 text-center">
          Вы уверены, что хотите удалить
          <span class="font-weight-bold">«{{ pendingDelete?.item?.title ?? pendingDelete?.item?.label }}»?</span>
        </p>
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="deleteItemDialog = false">
            Отмена
          </v-btn>
          <v-btn variant="flat" color="red" class="text-none text-white" :loading="deleteLoading" @click="confirmDeleteItem">
            Удалить
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Delete user confirmation -->
    <v-dialog v-model="deleteUserDialog" max-width="420">
      <v-card rounded="lg" class="pa-6">
        <p class="text-body-1 font-weight-medium mb-6 text-center">
          Вы уверены, что хотите удалить пользователя
          <span class="font-weight-bold">{{ pendingDeleteUser?.name }}?</span>
        </p>
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="deleteUserDialog = false">
            Отмена
          </v-btn>
          <v-btn variant="flat" color="red" class="text-none text-white" :loading="deleteLoading" @click="confirmDeleteUser">
            Удалить
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
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

const ROLE_OPTIONS = [
  { title: 'нет роли',       value: null            },
  { title: 'сотрудник',      value: 'сотрудник'     },
  { title: 'менеджер',       value: 'менеджер'       },
  { title: 'администратор',  value: 'администратор'  },
]

const taskCats    = ref([])
const contactCats = ref([])
const entCats     = ref([])
const taskTags    = ref([])
const noteTags    = ref([])
const users       = ref([])

const loading     = ref({ taskCats: false, contactCats: false, entCats: false, taskTags: false, noteTags: false, users: false })
const snack       = ref({ show: false, text: '', color: 'success' })
const dialog      = ref({ open: false, type: '', title: '', hasBg: false, item: null })

// Pending role changes: { userId: newRole }
const pendingRoles  = ref({})
const savingRoles   = ref(false)
const hasPendingRoles = computed(() => Object.keys(pendingRoles.value).length > 0)

// Delete confirmations
const deleteItemDialog   = ref(false)
const deleteUserDialog   = ref(false)
const pendingDelete      = ref(null)   // { type, item }
const pendingDeleteUser  = ref(null)
const deleteLoading      = ref(false)

const showSnack = (text, color = 'success') => { snack.value = { show: true, text, color } }

function pendingRoleOf(user) {
  return pendingRoles.value[user.id] !== undefined ? pendingRoles.value[user.id] : (user.role ?? null)
}

function setPendingRole(user, value) {
  if (value === (user.role ?? null)) {
    // Вернули к исходному — убираем из pending
    const p = { ...pendingRoles.value }
    delete p[user.id]
    pendingRoles.value = p
  } else {
    pendingRoles.value = { ...pendingRoles.value, [user.id]: value }
  }
}

async function saveRoles() {
  savingRoles.value = true
  try {
    await Promise.all(
      Object.entries(pendingRoles.value).map(([userId, role]) =>
        api.put(`/api/auth/users/${userId}/role`, { role })
      )
    )
    Object.entries(pendingRoles.value).forEach(([userId, role]) => {
      const u = users.value.find(x => x.id === Number(userId))
      if (u) u.role = role
    })
    pendingRoles.value = {}
    showSnack('Роли сохранены')
  } catch (err) {
    showSnack(err.response?.data?.message || 'Ошибка сохранения ролей', 'error')
  } finally {
    savingRoles.value = false
  }
}

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

function askDelete(type, item) {
  pendingDelete.value    = { type, item }
  deleteItemDialog.value = true
}

async function confirmDeleteItem() {
  if (!pendingDelete.value) return
  const { type, item } = pendingDelete.value
  deleteLoading.value = true
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
    deleteItemDialog.value = false
    pendingDelete.value = null
  } catch (err) {
    showSnack(err.response?.data?.message || 'Ошибка удаления', 'error')
  } finally {
    deleteLoading.value = false
  }
}

function askDeleteUser(user) {
  pendingDeleteUser.value = user
  deleteUserDialog.value  = true
}

async function confirmDeleteUser() {
  if (!pendingDeleteUser.value) return
  deleteLoading.value = true
  try {
    await api.delete(`/api/auth/users/${pendingDeleteUser.value.id}`)
    users.value = users.value.filter(u => u.id !== pendingDeleteUser.value.id)
    showSnack('Пользователь удалён')
    deleteUserDialog.value  = false
    pendingDeleteUser.value = null
  } catch (err) {
    showSnack(err.response?.data?.message || 'Ошибка удаления', 'error')
  } finally {
    deleteLoading.value = false
  }
}

</script>

<style scoped>
.page-header { height: 64px; border-bottom: 1px solid rgba(0,0,0,0.12); }
.toggle-btn { width: 36px !important; height: 36px !important; min-width: 36px !important; flex-shrink: 0; }
.toolbar-no-padding :deep(.v-toolbar__content) { padding: 0 !important; }
.section-header { padding-bottom: 12px; border-bottom: 1px solid rgba(0,0,0,0.06); margin-bottom: 12px; }
</style>

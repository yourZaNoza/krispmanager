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
      <div class="page-header d-flex align-center px-6">
        <span style="font-size: 24px; font-weight: 700;">Архив</span>
      </div>

      <div class="px-6 py-4">
        <!-- Employees table -->
        <v-card variant="outlined" rounded="lg" class="mb-6">
          <div class="px-4 pt-3 pb-2" style="font-size: 15px; font-weight: 600;">Контакты</div>

          <!-- Header row -->
          <div class="archive-table-header d-flex align-center px-4 py-2">
            <div style="width: 44px; flex-shrink: 0;" />
            <div class="col-name d-flex align-center" style="gap: 4px; cursor: default;">
              Имя <v-icon size="13" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div class="col-email d-flex align-center" style="gap: 4px; cursor: default;">
              Почта <v-icon size="13" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div class="col-position d-flex align-center" style="gap: 4px; cursor: default;">
              Должность <v-icon size="13" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div class="col-role d-flex align-center" style="gap: 4px; cursor: default;">
              Роль <v-icon size="13" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div style="width: 40px; flex-shrink: 0;" />
          </div>

          <v-divider />

          <!-- Loading -->
          <div v-if="loadingEmployees" class="text-center py-8">
            <v-progress-circular indeterminate size="28" color="success" />
          </div>

          <!-- Empty -->
          <div v-else-if="!employees.length" class="text-center py-8 text-grey text-body-2">
            Нет зарегистрированных сотрудников
          </div>

          <!-- Rows -->
          <template v-else>
            <div
              v-for="emp in employees"
              :key="emp.id"
              class="archive-row d-flex align-center px-4"
              :class="{ 'archive-row-selected': selectedId === emp.id }"
            >
              <div style="width: 44px; flex-shrink: 0;">
                <v-checkbox
                  :model-value="selectedId === emp.id"
                  hide-details
                  density="compact"
                  color="success"
                  @update:model-value="val => selectedId = val ? emp.id : null"
                />
              </div>

              <div class="col-name d-flex align-center" style="gap: 10px;">
                <v-avatar size="34" :color="avatarColor(emp.name)" class="flex-shrink-0">
                  <span class="text-caption font-weight-bold text-white">{{ initials(emp.name) }}</span>
                </v-avatar>
                <span class="text-body-2 font-weight-medium">{{ emp.name }}</span>
              </div>

              <div class="col-email">
                <div class="d-flex align-center" style="gap: 5px;">
                  <v-icon size="13" color="grey-darken-1">mdi-email-outline</v-icon>
                  <span class="text-body-2 email-link">{{ emp.email }}</span>
                </div>
              </div>

              <div class="col-position">
                <span class="text-body-2 text-grey-darken-1">{{ emp.position || '—' }}</span>
              </div>

              <div class="col-role">
                <v-chip size="x-small" rounded="sm" :style="roleStyle(emp.role)">
                  {{ roleLabel(emp.role) }}
                </v-chip>
              </div>

              <div style="width: 40px; flex-shrink: 0; display: flex; justify-content: flex-end;">
                <v-btn icon size="x-small" variant="plain">
                  <v-icon size="16" color="grey">mdi-dots-vertical</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
        </v-card>

        <!-- Archive panel for selected employee -->
        <template v-if="selectedEmployee">
          <!-- Section header -->
          <div class="d-flex align-center mb-3" style="gap: 8px;">
            <span class="text-body-1 font-weight-bold">Архив контакта</span>
            <v-avatar size="26" :color="avatarColor(selectedEmployee.name)">
              <span style="font-size: 10px; font-weight: 700; color: white;">
                {{ initials(selectedEmployee.name) }}
              </span>
            </v-avatar>
            <span class="text-body-1">{{ selectedEmployee.name }}</span>
            <v-spacer />
            <v-btn variant="outlined" color="grey-darken-2" size="small" class="text-none">
              <v-icon start size="14">mdi-filter-variant</v-icon>
              Фильтры
            </v-btn>
          </div>

          <!-- Tabs -->
          <v-tabs v-model="activeTab" color="success" density="compact" class="mb-4">
            <v-tab value="tasks" class="text-none">
              Задачи
              <v-chip size="x-small" class="ml-2" color="success" variant="tonal">
                {{ tasks.length }}
              </v-chip>
            </v-tab>
            <v-tab value="notes" class="text-none">
              Заметки
              <v-chip size="x-small" class="ml-2" variant="tonal">
                {{ notes.length }}
              </v-chip>
            </v-tab>
          </v-tabs>

          <!-- Loading items -->
          <div v-if="loadingItems" class="text-center py-8">
            <v-progress-circular indeterminate size="28" color="success" />
          </div>

          <v-tabs-window v-else v-model="activeTab">
            <!-- Tasks tab -->
            <v-tabs-window-item value="tasks">
              <div v-if="tasks.length" style="display: flex; flex-direction: column; gap: 12px;">
                <TaskCard
                  v-for="task in tasks"
                  :key="task.id"
                  :task="task"
                  @click="() => {}"
                  @delete-click="() => {}"
                />
              </div>
              <div v-else class="text-center py-8 text-grey text-body-2">Нет задач</div>
            </v-tabs-window-item>

            <!-- Notes tab -->
            <v-tabs-window-item value="notes">
              <div v-if="notes.length" style="display: flex; flex-direction: column; gap: 12px;">
                <NoteCard
                  v-for="note in notes"
                  :key="note.id"
                  :note="note"
                  @open="() => {}"
                  @delete="() => {}"
                />
              </div>
              <div v-else class="text-center py-8 text-grey text-body-2">Нет заметок</div>
            </v-tabs-window-item>
          </v-tabs-window>
        </template>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import TaskCard from '@/components/tasks/TaskCard.vue'
import NoteCard from '@/components/notes/NoteCard.vue'

const sidebarOpen = ref(true)
const employees   = ref([])
const selectedId  = ref(null)
const tasks       = ref([])
const notes       = ref([])
const activeTab   = ref('tasks')
const loadingEmployees = ref(false)
const loadingItems     = ref(false)

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const selectedEmployee = computed(() =>
  employees.value.find(e => e.id === selectedId.value) ?? null
)

const AVATAR_COLORS = ['#7B5EA7', '#1565C0', '#E65100', '#2E7D32', '#6A1B9A', '#00695C']

function initials(name) {
  const parts = (name || '').trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
}

function avatarColor(name) {
  const code = (name || '').charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

const ROLE_STYLES = {
  'сотрудник':     { backgroundColor: '#E3F2FD', color: '#1565C0', borderColor: 'transparent' },
  'менеджер':      { backgroundColor: '#FFF3E0', color: '#E65100', borderColor: 'transparent' },
  'администратор': { backgroundColor: '#F3E5F5', color: '#6A1B9A', borderColor: 'transparent' },
}

function roleStyle(role) {
  return ROLE_STYLES[role] ?? { backgroundColor: '#f5f5f5', color: '#616161', borderColor: 'transparent' }
}

function roleLabel(role) {
  if (role === 'сотрудник')     return 'Сотрудник'
  if (role === 'менеджер')      return 'Менеджер'
  if (role === 'администратор') return 'Администратор'
  return role || '—'
}

onMounted(async () => {
  loadingEmployees.value = true
  try {
    const { data } = await api.get('/api/archive/employees')
    employees.value = data
  } catch (err) {
    console.error('Ошибка загрузки сотрудников:', err)
  } finally {
    loadingEmployees.value = false
  }
})

watch(selectedId, async (id) => {
  tasks.value = []
  notes.value = []
  activeTab.value = 'tasks'
  if (!id) return
  loadingItems.value = true
  try {
    const [tRes, nRes] = await Promise.all([
      api.get(`/api/archive/users/${id}/tasks`),
      api.get(`/api/archive/users/${id}/notes`),
    ])
    tasks.value = tRes.data
    notes.value = nRes.data
  } catch (err) {
    console.error('Ошибка загрузки данных сотрудника:', err)
  } finally {
    loadingItems.value = false
  }
})
</script>

<style scoped>
.page-header {
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

.archive-table-header {
  background: #fafafa;
  font-size: 12px;
  color: #757575;
  font-weight: 500;
}

.archive-row {
  height: 56px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.1s;
}

.archive-row:hover {
  background: #f7f7f7;
}

.archive-row-selected {
  background: #f0faf4;
  border-left: 3px solid #037247;
}

/* Column widths */
.col-name {
  flex: 0 0 230px;
  min-width: 0;
}

.col-email {
  flex: 1 1 0;
  min-width: 0;
}

.col-position {
  flex: 0 0 180px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-role {
  flex: 0 0 130px;
  min-width: 0;
}

.email-link {
  color: #1565c0;
  text-decoration: underline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

</style>

<style>
.v-theme--dark .archive-table-header { background: transparent !important; }
.v-theme--dark .archive-row { border-color: rgba(255, 255, 255, 0.08); }
.v-theme--dark .archive-row:hover { background: rgba(255, 255, 255, 0.04) !important; }
.v-theme--dark .archive-row-selected { background: rgba(3, 114, 71, 0.2) !important; }
</style>

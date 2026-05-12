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
      <!-- Page title -->
      <div class="page-header d-flex align-center px-6">
        <span style="font-size: 24px; font-weight: 700">Архив</span>
      </div>

      <div class="px-6 pt-5 pb-6">

        <!-- Employees table -->
        <v-card variant="outlined" rounded="lg" class="mb-5">
          <div class="table-title">Контакты</div>

          <div class="archive-table-header d-flex align-center px-4 py-2">
            <div class="col-check" />
            <div class="col-name th-cell">
              Имя <v-icon size="12" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div class="col-email th-cell">
              Почта <v-icon size="12" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div class="col-position th-cell">
              Должность <v-icon size="12" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div class="col-role th-cell">
              Роль <v-icon size="12" color="grey">mdi-unfold-more-horizontal</v-icon>
            </div>
            <div class="col-actions" />
          </div>

          <v-divider />

          <div v-if="loadingEmployees" class="text-center py-8">
            <v-progress-circular indeterminate size="28" color="success" />
          </div>

          <div v-else-if="!employees.length" class="text-center py-8 text-grey text-body-2">
            Нет зарегистрированных сотрудников
          </div>

          <template v-else>
            <div
              v-for="emp in employees"
              :key="emp.id"
              class="archive-row d-flex align-center px-4"
              :class="{ 'archive-row-selected': selectedId === emp.id }"
              @click="selectedId = selectedId === emp.id ? null : emp.id"
            >
              <div class="col-check">
                <v-checkbox
                  :model-value="selectedId === emp.id"
                  hide-details density="compact" color="success"
                  @click.stop
                  @update:model-value="val => selectedId = val ? emp.id : null"
                />
              </div>

              <div class="col-name d-flex align-center" style="gap: 10px">
                <UserAvatar :user-id="emp.id" :name="emp.name" :size="32" class="flex-shrink-0" />
                <span class="text-body-2 font-weight-medium">{{ emp.name }}</span>
              </div>

              <div class="col-email">
                <div class="d-flex align-center" style="gap: 5px">
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

              <div class="col-actions d-flex justify-end">
                <v-btn icon size="x-small" variant="plain" @click.stop>
                  <v-icon size="16" color="grey">mdi-dots-vertical</v-icon>
                </v-btn>
              </div>
            </div>
          </template>
        </v-card>

        <!-- Archive panel -->
        <template v-if="selectedEmployee">

          <!-- Section header: title + avatar + name + filter btn -->
          <div class="archive-panel-header">
            <span class="text-body-1 font-weight-bold" style="white-space: nowrap">Архив контакта</span>
            <UserAvatar :user-id="selectedEmployee.id" :name="selectedEmployee.name" :size="26" />
            <span class="text-body-1">{{ selectedEmployee.name }}</span>
            <v-badge
              :content="activeFilterCount"
              :model-value="activeFilterCount > 0"
              color="#037247"
              floating
            >
              <v-btn
                variant="outlined"
                :color="filterOpen || activeFilterCount > 0 ? '#037247' : 'grey-darken-2'"
                size="small"
                class="text-none"
                @click="filterOpen = !filterOpen"
              >
                <v-icon start size="14">mdi-filter-variant</v-icon>
                Фильтры
              </v-btn>
            </v-badge>
          </div>

          <!-- Filter panel -->
          <Transition name="filter">
            <div v-if="filterOpen" class="filter-bar py-3">
              <div class="d-flex align-center flex-wrap" style="gap: 10px">

                <!-- Tasks filters -->
                <template v-if="activeTab === 'tasks'">
                  <v-select
                    v-model="filters.status"
                    :items="STATUS_OPTIONS"
                    item-title="title"
                    item-value="value"
                    label="Статус"
                    density="compact" variant="outlined" hide-details
                    class="filter-sel"
                    style="min-width: 130px; max-width: 160px"
                  />
                  <v-select
                    v-model="filters.tags"
                    :items="allTaskTags"
                    label="Метки"
                    multiple chips closable-chips
                    density="compact" variant="outlined" hide-details
                    no-data-text="Нет меток"
                    class="filter-sel"
                  />
                  <v-select
                    v-model="filters.enterprises"
                    :items="allEnterprises"
                    label="Предприятие"
                    multiple chips closable-chips
                    density="compact" variant="outlined" hide-details
                    no-data-text="Нет предприятий"
                    class="filter-sel"
                  />
                  <v-text-field
                    v-model="filters.dateFrom"
                    label="Срок с"
                    type="date"
                    density="compact" variant="outlined" hide-details clearable
                    class="filter-date"
                  />
                  <v-text-field
                    v-model="filters.dateTo"
                    label="Срок по"
                    type="date"
                    density="compact" variant="outlined" hide-details clearable
                    class="filter-date"
                  />
                </template>

                <!-- Notes filters -->
                <template v-else>
                  <v-select
                    v-model="filters.status"
                    :items="STATUS_OPTIONS"
                    item-title="title"
                    item-value="value"
                    label="Статус"
                    density="compact" variant="outlined" hide-details
                    class="filter-sel"
                    style="min-width: 130px; max-width: 160px"
                  />
                  <v-select
                    v-model="filters.tags"
                    :items="allNoteTags"
                    label="Метки"
                    multiple chips closable-chips
                    density="compact" variant="outlined" hide-details
                    no-data-text="Нет меток"
                    class="filter-sel"
                  />
                  <v-text-field
                    v-model="filters.dateFrom"
                    label="Дата с"
                    type="date"
                    density="compact" variant="outlined" hide-details clearable
                    class="filter-date"
                  />
                  <v-text-field
                    v-model="filters.dateTo"
                    label="Дата по"
                    type="date"
                    density="compact" variant="outlined" hide-details clearable
                    class="filter-date"
                  />
                </template>

                <v-btn
                  v-if="activeFilterCount > 0"
                  variant="text" size="small" color="grey-darken-1" class="text-none"
                  @click="resetFilters"
                >
                  <v-icon start size="14">mdi-close-circle-outline</v-icon>
                  Сбросить
                </v-btn>
              </div>
            </div>
          </Transition>

          <!-- Tabs -->
          <v-tabs v-model="activeTab" color="success" density="compact" class="archive-tabs">
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

          <!-- Loading -->
          <div v-if="loadingItems" class="text-center py-8">
            <v-progress-circular indeterminate size="28" color="success" />
          </div>

          <v-tabs-window v-else v-model="activeTab" class="pt-4">

            <!-- Tasks tab -->
            <v-tabs-window-item value="tasks">
              <div v-if="filteredTasks.length" class="d-flex flex-column" style="gap: 12px">
                <TaskCard
                  v-for="task in filteredTasks"
                  :key="task.id"
                  :task="task"
                  :deleted="task.deleted"
                  @click="() => {}"
                  @delete-click="askDeleteTask(task)"
                  @restore-click="askRestoreTask(task)"
                />
              </div>
              <div v-else class="text-center py-8 text-grey text-body-2">
                {{ tasks.length ? 'Нет задач, подходящих под фильтры' : 'Нет задач' }}
              </div>
            </v-tabs-window-item>

            <!-- Notes tab -->
            <v-tabs-window-item value="notes">
              <div v-if="filteredNotes.length" class="d-flex flex-column" style="gap: 12px">
                <NoteCard
                  v-for="note in filteredNotes"
                  :key="note.id"
                  :note="note"
                  :deleted="note.deleted"
                  :archive-mode="true"
                  @open="() => {}"
                  @delete="askDeleteNote(note)"
                  @restore-click="askRestoreNote(note)"
                />
              </div>
              <div v-else class="text-center py-8 text-grey text-body-2">
                {{ notes.length ? 'Нет заметок, подходящих под фильтры' : 'Нет заметок' }}
              </div>
            </v-tabs-window-item>

          </v-tabs-window>
        </template>

      </div>
    </v-main>

    <!-- Delete task confirmation -->
    <v-dialog v-model="deleteTaskDialog" max-width="420">
      <v-card rounded="lg" class="pa-6">
        <p class="text-body-1 font-weight-medium mb-6 text-center">
          Вы уверены, что хотите удалить задачу
          <span class="font-weight-bold">«{{ pendingTask?.title }}»</span>
          из профиля
          <span class="font-weight-bold">{{ selectedEmployee?.name }}?</span>
        </p>
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="deleteTaskDialog = false">
            Отмена
          </v-btn>
          <v-btn variant="flat" color="red" class="text-none text-white" :loading="actionLoading" @click="confirmDeleteTask">
            Удалить
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Restore task confirmation -->
    <v-dialog v-model="restoreTaskDialog" max-width="420">
      <v-card rounded="lg" class="pa-6">
        <p class="text-body-1 font-weight-medium mb-6 text-center">
          Вы уверены, что хотите восстановить задачу
          <span class="font-weight-bold">«{{ pendingTask?.title }}»</span>
          в профиле
          <span class="font-weight-bold">{{ selectedEmployee?.name }}?</span>
        </p>
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="restoreTaskDialog = false">
            Отмена
          </v-btn>
          <v-btn variant="flat" style="background-color: #037247" class="text-none text-white" :loading="actionLoading" @click="confirmRestoreTask">
            Восстановить
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Delete note confirmation -->
    <v-dialog v-model="deleteNoteDialog" max-width="420">
      <v-card rounded="lg" class="pa-6">
        <p class="text-body-1 font-weight-medium mb-6 text-center">
          Вы уверены, что хотите удалить заметку
          <span class="font-weight-bold">«{{ pendingNote?.title }}»</span>
          из профиля
          <span class="font-weight-bold">{{ selectedEmployee?.name }}?</span>
        </p>
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="deleteNoteDialog = false">
            Отмена
          </v-btn>
          <v-btn variant="flat" color="red" class="text-none text-white" :loading="actionLoading" @click="confirmDeleteNote">
            Удалить
          </v-btn>
        </div>
      </v-card>
    </v-dialog>

    <!-- Restore note confirmation -->
    <v-dialog v-model="restoreNoteDialog" max-width="420">
      <v-card rounded="lg" class="pa-6">
        <p class="text-body-1 font-weight-medium mb-6 text-center">
          Вы уверены, что хотите восстановить заметку
          <span class="font-weight-bold">«{{ pendingNote?.title }}»</span>
          в профиле
          <span class="font-weight-bold">{{ selectedEmployee?.name }}?</span>
        </p>
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="restoreNoteDialog = false">
            Отмена
          </v-btn>
          <v-btn variant="flat" style="background-color: #037247" class="text-none text-white" :loading="actionLoading" @click="confirmRestoreNote">
            Восстановить
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import Sidebar    from '@/components/Sidebar.vue'
import SearchBar  from '@/components/SearchBar.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import TaskCard   from '@/components/tasks/TaskCard.vue'
import NoteCard   from '@/components/notes/NoteCard.vue'

const sidebarOpen      = ref(true)
const employees        = ref([])
const selectedId       = ref(null)
const tasks            = ref([])
const notes            = ref([])
const activeTab        = ref('tasks')
const loadingEmployees = ref(false)
const loadingItems     = ref(false)

// ── Filters ────────────────────────────────────────────────
const filterOpen = ref(false)
const filters = reactive({ tags: [], enterprises: [], dateFrom: '', dateTo: '', status: 'all' })

const STATUS_OPTIONS = [
  { title: 'Все',       value: 'all' },
  { title: 'Активные',  value: 'active' },
  { title: 'Удалённые', value: 'deleted' },
]

const resetFilters = () => {
  filters.tags = []
  filters.enterprises = []
  filters.dateFrom = ''
  filters.dateTo = ''
  filters.status = 'all'
}

watch(activeTab, () => resetFilters())

// Task filter derived data
const allTaskTags = computed(() => {
  const s = new Set()
  for (const t of tasks.value)
    for (const tag of (t.tags || []))
      if (tag.label) s.add(tag.label)
  return [...s]
})

const allEnterprises = computed(() => {
  const s = new Set()
  for (const t of tasks.value)
    if (t.enterprise) s.add(t.enterprise)
  return [...s]
})

// Note filter derived data
const allNoteTags = computed(() => {
  const s = new Set()
  for (const n of notes.value)
    for (const tag of (n.tags || []))
      if (tag) s.add(tag)
  return [...s]
})

const activeFilterCount = computed(() => {
  const base = (filters.tags.length ? 1 : 0) + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0) + (filters.status !== 'all' ? 1 : 0)
  return activeTab.value === 'tasks' ? base + (filters.enterprises.length ? 1 : 0) : base
})

const filteredTasks = computed(() => {
  const { tags, enterprises, dateFrom, dateTo, status } = filters
  return tasks.value.filter(task => {
    if (status === 'active'  && task.deleted)  return false
    if (status === 'deleted' && !task.deleted) return false
    if (tags.length) {
      const labels = (task.tags || []).map(t => t.label)
      if (!tags.some(f => labels.includes(f))) return false
    }
    if (enterprises.length && !enterprises.includes(task.enterprise)) return false
    if (dateFrom && task.deadlineRaw && new Date(task.deadlineRaw) < new Date(dateFrom)) return false
    if (dateTo  && task.deadlineRaw && new Date(task.deadlineRaw) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })
})

const filteredNotes = computed(() => {
  const { tags, dateFrom, dateTo, status } = filters
  return notes.value.filter(note => {
    if (status === 'active'  && note.deleted)  return false
    if (status === 'deleted' && !note.deleted) return false
    if (tags.length && !tags.some(f => (note.tags || []).includes(f))) return false
    if (dateFrom && note.date && note.date < dateFrom) return false
    if (dateTo  && note.date && note.date > dateTo)   return false
    return true
  })
})

// ── Task actions (delete / restore) ───────────────────────
const deleteTaskDialog  = ref(false)
const restoreTaskDialog = ref(false)
const pendingTask       = ref(null)
const actionLoading     = ref(false)

const askDeleteTask = (task) => {
  pendingTask.value      = task
  deleteTaskDialog.value = true
}

const askRestoreTask = (task) => {
  pendingTask.value       = task
  restoreTaskDialog.value = true
}

const confirmDeleteTask = async () => {
  if (!pendingTask.value) return
  actionLoading.value = true
  try {
    await api.delete(`/api/archive/tasks/${pendingTask.value.id}`)
    const t = tasks.value.find(t => t.id === pendingTask.value.id)
    if (t) t.deleted = true
    deleteTaskDialog.value = false
    pendingTask.value = null
  } catch (err) {
    console.error('Ошибка удаления задачи:', err)
  } finally {
    actionLoading.value = false
  }
}

const confirmRestoreTask = async () => {
  if (!pendingTask.value) return
  actionLoading.value = true
  try {
    await api.put(`/api/archive/tasks/${pendingTask.value.id}/restore`)
    const t = tasks.value.find(t => t.id === pendingTask.value.id)
    if (t) t.deleted = false
    restoreTaskDialog.value = false
    pendingTask.value = null
  } catch (err) {
    console.error('Ошибка восстановления задачи:', err)
  } finally {
    actionLoading.value = false
  }
}

// ── Note actions (delete / restore) ───────────────────────
const deleteNoteDialog  = ref(false)
const restoreNoteDialog = ref(false)
const pendingNote       = ref(null)

const askDeleteNote = (note) => {
  pendingNote.value      = note
  deleteNoteDialog.value = true
}

const askRestoreNote = (note) => {
  pendingNote.value       = note
  restoreNoteDialog.value = true
}

const confirmDeleteNote = async () => {
  if (!pendingNote.value) return
  actionLoading.value = true
  try {
    await api.delete(`/api/archive/notes/${pendingNote.value.id}`)
    const n = notes.value.find(n => n.id === pendingNote.value.id)
    if (n) n.deleted = true
    deleteNoteDialog.value = false
    pendingNote.value = null
  } catch (err) {
    console.error('Ошибка удаления заметки:', err)
  } finally {
    actionLoading.value = false
  }
}

const confirmRestoreNote = async () => {
  if (!pendingNote.value) return
  actionLoading.value = true
  try {
    await api.put(`/api/archive/notes/${pendingNote.value.id}/restore`)
    const n = notes.value.find(n => n.id === pendingNote.value.id)
    if (n) n.deleted = false
    restoreNoteDialog.value = false
    pendingNote.value = null
  } catch (err) {
    console.error('Ошибка восстановления заметки:', err)
  } finally {
    actionLoading.value = false
  }
}

// ── Data ───────────────────────────────────────────────────
const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const selectedEmployee = computed(() =>
  employees.value.find(e => e.id === selectedId.value) ?? null
)

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
  filterOpen.value = false
  resetFilters()
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

// ── Helpers ────────────────────────────────────────────────
const ROLE_STYLES = {
  'сотрудник':     { backgroundColor: '#E3F2FD', color: '#1565C0', borderColor: 'transparent' },
  'менеджер':      { backgroundColor: '#FFF3E0', color: '#E65100', borderColor: 'transparent' },
  'администратор': { backgroundColor: '#F3E5F5', color: '#6A1B9A', borderColor: 'transparent' },
}
function roleStyle(role)  { return ROLE_STYLES[role] ?? { backgroundColor: '#f5f5f5', color: '#616161', borderColor: 'transparent' } }
function roleLabel(role)  {
  if (role === 'сотрудник')     return 'Сотрудник'
  if (role === 'менеджер')      return 'Менеджер'
  if (role === 'администратор') return 'Администратор'
  return role || '—'
}
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

/* Table */
.table-title {
  padding: 12px 16px 8px;
  font-size: 15px;
  font-weight: 600;
}
.archive-table-header {
  background: #fafafa;
  font-size: 12px;
  color: #757575;
  font-weight: 500;
}
.th-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}
.archive-row {
  height: 52px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  transition: background 0.1s;
  cursor: pointer;
}
.archive-row:hover          { background: #f7f7f7; }
.archive-row-selected       { background: #f0faf4; border-left: 3px solid #037247; }

/* Column widths */
.col-check    { width: 44px; flex-shrink: 0; }
.col-name     { flex: 0 0 220px; min-width: 0; }
.col-email    { flex: 1 1 0; min-width: 0; overflow: hidden; }
.col-position { flex: 0 0 170px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.col-role     { flex: 0 0 120px; min-width: 0; }
.col-actions  { width: 40px; flex-shrink: 0; }

.email-link {
  color: #1565c0;
  text-decoration: underline;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Archive panel */
.archive-panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  margin-bottom: 0;
}

.filter-bar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: #fafafa;
}
.filter-sel  { min-width: 160px; max-width: 220px; }
.filter-date { max-width: 170px; }

.filter-enter-active, .filter-leave-active { transition: opacity 0.15s, transform 0.15s; }
.filter-enter-from, .filter-leave-to       { opacity: 0; transform: translateY(-6px); }

.archive-tabs {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
</style>

<style>
.v-theme--dark .archive-table-header   { background: transparent !important; }
.v-theme--dark .archive-row            { border-color: rgba(255, 255, 255, 0.08); }
.v-theme--dark .archive-row:hover      { background: rgba(255, 255, 255, 0.04) !important; }
.v-theme--dark .archive-row-selected   { background: rgba(3, 114, 71, 0.2) !important; }
.v-theme--dark .archive-panel-header   { border-color: rgba(255, 255, 255, 0.1); }
.v-theme--dark .filter-bar             { background: transparent !important; border-color: rgba(255, 255, 255, 0.08); }
.v-theme--dark .archive-tabs           { border-color: rgba(255, 255, 255, 0.1) !important; }
</style>

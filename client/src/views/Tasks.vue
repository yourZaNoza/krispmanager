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
      <div class="tasks-header d-flex align-center px-5" style="gap: 16px">
        <span style="font-size: 24px; font-weight: 700; white-space: nowrap">Задачи</span>

        <v-tabs v-model="viewTab" density="compact" color="#037247" style="min-width: 0">
          <v-tab value="list">
            <span
              class="tab-icon"
              style="margin-right: 8px"
              :style="{ color: viewTab === 'list' ? '#037247' : '#727272' }"
              v-html="ListSvg"
            />
            Список
          </v-tab>
          <v-tab value="columns">
            <span
              class="tab-icon"
              style="margin-right: 8px"
              :style="{ color: viewTab === 'columns' ? '#037247' : '#727272' }"
              v-html="KanbanSvg"
            />
            Колонки
          </v-tab>
        </v-tabs>

        <v-spacer />

        <v-badge :content="activeFilterCount" :model-value="activeFilterCount > 0" color="#037247" floating>
          <v-btn
            variant="outlined"
            :color="filterOpen || activeFilterCount > 0 ? '#037247' : 'grey-darken-2'"
            class="text-none"
            @click="filterOpen = !filterOpen"
          >
            <v-icon start size="16">mdi-filter-variant</v-icon>
            Фильтры
          </v-btn>
        </v-badge>
        <v-btn
          style="background-color: #037247"
          class="text-none text-white"
          prepend-icon="mdi-plus"
          @click="openCreate"
        >
          Добавить задачу
        </v-btn>
      </div>

      <!-- Filter panel -->
      <Transition name="filter">
        <div v-if="filterOpen" class="filter-bar px-5 py-3">
          <div class="d-flex align-center flex-wrap" style="gap: 10px">
            <v-select
              v-model="filters.catIds"
              :items="columns.map(c => ({ value: c.id, title: c.title }))"
              item-value="value"
              item-title="title"
              label="Категория"
              multiple chips closable-chips
              density="compact" variant="outlined" hide-details
              no-data-text="Нет вариантов"
              class="filter-sel"
            />
            <v-select
              v-model="filters.tags"
              :items="allTags"
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

      <div class="px-5 pb-5">
        <div v-if="viewTab === 'columns'" class="kanban-board" style="margin-top: 32px">
          <KanbanColumn
            v-for="column in visibleColumns"
            :key="column.id"
            :column="column"
            :task-filter="taskFilter"
            @task-click="openDetail"
            @rename-column="onRenameColumn"
            @delete-column="onDeleteColumn"
          />
        </div>
        <TaskListView
          v-else
          :columns="visibleColumns"
          :task-filter="taskFilter"
          style="margin-top: 32px"
          @task-click="openDetail"
          @delete-task="onDeleteTask"
        />
      </div>

      <CookieConsent />

      <TaskDialog
        v-model="taskDialog"
        :initial-form="taskInitialForm"
        :columns="columns"
        @save="onTaskSave"
      />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import KanbanColumn from '@/components/tasks/KanbanColumn.vue'
import TaskListView from '@/components/tasks/TaskListView.vue'
import TaskDialog from '@/components/tasks/TaskDialog.vue'
import CookieConsent from '@/components/CookieConsent.vue'
import ListRaw from '@/assets/List.svg?raw'
import KanbanRaw from '@/assets/Kanban.svg?raw'

const dyn = (raw) => raw.replace(/stroke="#[^"]+"/g, 'stroke="currentColor"')
const ListSvg = dyn(ListRaw)
const KanbanSvg = dyn(KanbanRaw)

const sidebarOpen = ref(true)
const viewTab = ref('columns')
const taskDialog = ref(false)
const taskInitialForm = ref(null)
const columns = ref([])

// ── Filters ────────────────────────────────────────────────
const filterOpen = ref(false)
const filters = reactive({ catIds: [], tags: [], dateFrom: '', dateTo: '', enterprises: [] })

const allTags = computed(() => {
  const s = new Set()
  for (const col of columns.value)
    for (const t of col.tasks)
      for (const tag of (t.tags || []))
        if (tag.label) s.add(tag.label)
  return [...s]
})

const allEnterprises = computed(() => {
  const s = new Set()
  for (const col of columns.value)
    for (const t of col.tasks)
      if (t.enterprise) s.add(t.enterprise)
  return [...s]
})

const activeFilterCount = computed(() => {
  return (filters.catIds.length ? 1 : 0)
    + (filters.tags.length ? 1 : 0)
    + (filters.dateFrom ? 1 : 0)
    + (filters.dateTo ? 1 : 0)
    + (filters.enterprises.length ? 1 : 0)
})

const visibleColumns = computed(() =>
  filters.catIds.length ? columns.value.filter(c => filters.catIds.includes(c.id)) : columns.value
)

const taskFilter = computed(() => {
  const hasTag = filters.tags.length > 0
  const hasFrom = !!filters.dateFrom
  const hasTo = !!filters.dateTo
  const hasEnt = filters.enterprises.length > 0
  if (!hasTag && !hasFrom && !hasTo && !hasEnt) return null
  return (task) => {
    if (hasTag) {
      const labels = (task.tags || []).map(t => t.label)
      if (!filters.tags.some(f => labels.includes(f))) return false
    }
    if (hasFrom && task.deadlineRaw) {
      if (new Date(task.deadlineRaw) < new Date(filters.dateFrom)) return false
    }
    if (hasTo && task.deadlineRaw) {
      if (new Date(task.deadlineRaw) > new Date(filters.dateTo + 'T23:59:59')) return false
    }
    if (hasEnt && !filters.enterprises.includes(task.enterprise)) return false
    return true
  }
})

const resetFilters = () => {
  filters.catIds = []; filters.tags = []; filters.dateFrom = ''; filters.dateTo = ''; filters.enterprises = []
}

const api = axios.create({ withCredentials: true })

// ── Helpers ────────────────────────────────────────────
const toDate = (d) => {
  if (!d) return null
  return d instanceof Date ? d : new Date(d)
}
const fmtShort = (d) => {
  const dt = toDate(d)
  if (!dt || isNaN(dt)) return '—'
  return `${String(dt.getDate()).padStart(2, '0')}.${String(dt.getMonth() + 1).padStart(2, '0')}.${dt.getFullYear()}`
}

// ── Загрузка с сервера ─────────────────────────────────
onMounted(async () => {
  try {
    const { data } = await api.get('/api/tasks/categories')
    columns.value = data
  } catch (err) {
    console.error('Не удалось загрузить задачи:', err)
  }
})

// ── Open dialogs ───────────────────────────────────────
const openCreate = () => {
  taskInitialForm.value = null
  taskDialog.value = true
}

const openDetail = (task, column) => {
  taskInitialForm.value = {
    id: task.id,
    title: task.title,
    description: task.description || '',
    lists: task.lists || [],
    deadlineRaw: task.deadlineRaw || null,
    dateFromRaw: task.dateFromRaw || null,
    participants: task.participants || [],
    tags: task.tags || [],
    enterprise: task.enterprise || '',
    catId: column.id,
    attachments: Array.isArray(task.attachments) ? task.attachments : [],
    comments: Array.isArray(task.comments) ? task.comments : [],
    history: task.history || [],
  }
  taskDialog.value = true
}

// ── Save handlers ──────────────────────────────────────

const onDeleteTask = async (task, col) => {
  try {
    await api.delete(`/api/tasks/${task.id}`)
    const idx = col.tasks.findIndex((t) => t.id === task.id)
    if (idx >= 0) col.tasks.splice(idx, 1)
  } catch (err) {
    console.error('Ошибка удаления задачи:', err)
  }
}

const onRenameColumn = async ({ id, title, color }) => {
  try {
    await api.put(`/api/tasks/categories/${id}`, { name: title, color })
    const col = columns.value.find((c) => c.id === id)
    if (col) col.title = title
  } catch (err) {
    console.error('Ошибка переименования категории:', err)
  }
}

const onDeleteColumn = async (id) => {
  try {
    await api.delete(`/api/tasks/categories/${id}`)
    const idx = columns.value.findIndex((c) => c.id === id)
    if (idx >= 0) columns.value.splice(idx, 1)
  } catch (err) {
    console.error('Ошибка удаления категории:', err)
  }
}

const onTaskSave = async (formData) => {
  const deadlineRaw = formData.deadlineRaw ? new Date(formData.deadlineRaw) : null
  const dateFromRaw = formData.dateFromRaw ? new Date(formData.dateFromRaw) : null
  const targetCol   = columns.value.find((c) => c.id === formData.catId) || columns.value[0]

  try {
    if (formData.id) {
      await api.put(`/api/tasks/${formData.id}`, {
        catId:        formData.catId,
        title:        formData.title,
        description:  formData.description,
        deadlineRaw:  deadlineRaw ? deadlineRaw.toISOString() : null,
        dateFromRaw:  dateFromRaw ? dateFromRaw.toISOString() : null,
        enterprise:   formData.enterprise,
        tags:         formData.tags,
        lists:        formData.lists,
        participants: formData.participants,
        attachments:  formData.attachments,
        comments:     formData.comments,
        history:      formData.history,
      })

      for (const col of columns.value) {
        const idx = col.tasks.findIndex((t) => t.id === formData.id)
        if (idx < 0) continue
        const orig = col.tasks[idx]
        col.tasks[idx] = {
          ...orig,
          title:        formData.title,
          description:  formData.description,
          lists:        formData.lists,
          deadlineRaw,
          deadline:     deadlineRaw ? fmtShort(deadlineRaw) : orig.deadline,
          dateFromRaw,
          dateFrom:     dateFromRaw ? fmtShort(dateFromRaw) : orig.dateFrom,
          tags:         formData.tags,
          enterprise:   formData.enterprise,
          participants: formData.participants,
          avatarCount:  formData.participants.length,
          attachments:  formData.attachments.length ? formData.attachments : orig.attachments,
          comments:     formData.comments.length ? formData.comments : orig.comments,
          history:      formData.history,
        }
        if (formData.catId && col.id !== formData.catId) {
          const [moved] = col.tasks.splice(idx, 1)
          targetCol.tasks.push(moved)
        }
        break
      }
    } else {
      const { data: newTask } = await api.post('/api/tasks', {
        catId:        formData.catId || (targetCol ? targetCol.id : null),
        title:        formData.title,
        description:  formData.description,
        deadlineRaw:  deadlineRaw ? deadlineRaw.toISOString() : null,
        dateFromRaw:  dateFromRaw ? dateFromRaw.toISOString() : null,
        enterprise:   formData.enterprise,
        tags:         formData.tags,
        lists:        formData.lists,
        participants: formData.participants,
        attachments:  formData.attachments,
        comments:     formData.comments,
      })
      if (targetCol) targetCol.tasks.push(newTask)
    }
  } catch (err) {
    console.error('Ошибка сохранения задачи:', err)
    alert(err.response?.data?.message || 'Не удалось сохранить задачу')
  }
}
</script>

<style scoped>
.toggle-btn {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  flex-shrink: 0;
}
.toolbar-no-padding :deep(.v-toolbar__content) {
  padding: 0 !important;
}
.tasks-header {
  height: 64px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
  padding-bottom: 16px;
}
.filter-bar {
  border-bottom: 1px solid rgba(0,0,0,0.08);
  background: #fafafa;
}
.filter-sel {
  min-width: 160px;
  max-width: 220px;
}
.filter-date {
  max-width: 170px;
}
.filter-enter-active,
.filter-leave-active { transition: opacity 0.15s, transform 0.15s; }
.filter-enter-from,
.filter-leave-to { opacity: 0; transform: translateY(-6px); }
</style>

<style>
.tab-icon svg path {
  stroke: currentColor !important;
}

.v-theme--dark .tasks-header {
  border-bottom-color: rgba(255, 255, 255, 0.12);
}
.v-theme--dark .filter-bar {
  background: transparent !important;
  border-bottom-color: rgba(255, 255, 255, 0.08);
}
</style>

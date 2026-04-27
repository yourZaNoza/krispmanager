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

        <v-btn variant="outlined" color="grey-darken-2" class="text-none">
          <v-icon start size="16">mdi-filter-variant</v-icon>
          Фильтры
        </v-btn>
        <v-btn
          style="background-color: #037247"
          class="text-none text-white"
          prepend-icon="mdi-plus"
          @click="openCreate"
        >
          Добавить задачу
        </v-btn>
        <v-btn
          variant="outlined"
          color="success"
          class="text-none"
          prepend-icon="mdi-plus"
          @click="catDialog = true"
        >
          Добавить категорию
        </v-btn>
      </div>

      <div class="px-5 pb-5">
        <div v-if="viewTab === 'columns'" class="kanban-board" style="margin-top: 32px">
          <KanbanColumn
            v-for="column in columns"
            :key="column.id"
            :column="column"
            @task-click="openDetail"
            @rename-column="onRenameColumn"
            @delete-column="onDeleteColumn"
          />
        </div>
        <TaskListView
          v-else
          :columns="columns"
          style="margin-top: 32px"
          @task-click="openDetail"
          @toggle-complete="onToggleComplete"
          @delete-task="onDeleteTask"
        />
      </div>

      <CookieConsent />

      <CategoryDialog v-model="catDialog" @save="onCatSave" />

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
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import KanbanColumn from '@/components/tasks/KanbanColumn.vue'
import TaskListView from '@/components/tasks/TaskListView.vue'
import TaskDialog from '@/components/tasks/TaskDialog.vue'
import CategoryDialog from '@/components/tasks/CategoryDialog.vue'
import CookieConsent from '@/components/CookieConsent.vue'
import ListRaw from '@/assets/List.svg?raw'
import KanbanRaw from '@/assets/Kanban.svg?raw'

const dyn = (raw) => raw.replace(/stroke="#[^"]+"/g, 'stroke="currentColor"')
const ListSvg = dyn(ListRaw)
const KanbanSvg = dyn(KanbanRaw)

const sidebarOpen = ref(true)
const viewTab = ref('columns')
const catDialog = ref(false)
const taskDialog = ref(false)
const taskInitialForm = ref(null)
const columns = ref([])

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

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
const onCatSave = async ({ name, color }) => {
  try {
    const { data } = await api.post('/api/tasks/categories', { name, color })
    columns.value.push(data)
  } catch (err) {
    console.error('Ошибка сохранения категории:', err)
    alert(err.response?.data?.message || 'Не удалось сохранить категорию')
  }
}

const onToggleComplete = async (task, completed) => {
  task.completed = completed
  const col = columns.value.find((c) => c.tasks.some((t) => t.id === task.id))
  if (!col) return
  try {
    await api.put(`/api/tasks/${task.id}`, {
      catId:        col.id,
      title:        task.title,
      description:  task.description,
      deadlineRaw:  task.deadlineRaw ? new Date(task.deadlineRaw).toISOString() : null,
      enterprise:   task.enterprise,
      tags:         task.tags,
      lists:        task.lists,
      participants: task.participants,
      attachments:  task.attachments,
      comments:     task.comments,
      history:      task.history,
      completed:    completed ? 1 : 0,
    })
  } catch (err) {
    task.completed = !completed
    console.error('Ошибка обновления задачи:', err)
  }
}

const onDeleteTask = (task, col) => {
  const idx = col.tasks.findIndex((t) => t.id === task.id)
  if (idx >= 0) col.tasks.splice(idx, 1)
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
  const targetCol = columns.value.find((c) => c.id === formData.catId) || columns.value[0]

  try {
    if (formData.id) {
      await api.put(`/api/tasks/${formData.id}`, {
        catId:        formData.catId,
        title:        formData.title,
        description:  formData.description,
        deadlineRaw:  deadlineRaw ? deadlineRaw.toISOString() : null,
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
</style>

<style>
.tab-icon svg path {
  stroke: currentColor !important;
}
</style>

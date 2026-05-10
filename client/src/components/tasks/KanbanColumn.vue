<template>
  <div class="kanban-column">
    <div class="kanban-column-body">
      <div class="d-flex align-center column-header">
        <v-icon :color="column.dotColor" size="12" style="flex-shrink: 0">mdi-circle</v-icon>

        <!-- Inline edit input -->
        <input
          v-if="editing"
          ref="titleInput"
          v-model="editTitle"
          class="title-input"
          @blur="commitRename"
          @keydown.enter.prevent="commitRename"
          @keydown.escape="cancelRename"
        />
        <span
          v-else
          class="column-title text-subtitle-2 font-weight-bold"
          title="Нажмите для переименования"
          @click="startEdit"
        >{{ column.title }}</span>

        <span class="task-badge ml-2">{{ visibleTasks.length }}</span>

        <v-spacer />

        <v-btn
          icon
          size="x-small"
          variant="plain"
          class="delete-cat-btn"
          @click.stop="deleteCatDialog = true"
        >
          <v-icon size="16" color="grey-darken-1">mdi-delete-outline</v-icon>
        </v-btn>
      </div>

      <div class="d-flex flex-column" style="gap: 10px">
        <TaskCard
          v-for="task in visibleTasks"
          :key="task.id"
          :task="task"
          @click="$emit('task-click', task, column)"
          @delete-click="askDelete(task)"
        />
      </div>
    </div>
  </div>

  <!-- Task delete dialog -->
  <v-dialog v-model="deleteTaskDialog" max-width="360">
    <v-card rounded="lg" class="pa-6">
      <p class="text-body-1 font-weight-medium mb-6 text-center">
        Вы уверены, что хотите удалить задачу?
      </p>
      <div class="d-flex justify-center" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="red"
          class="text-none"
          @click="deleteTaskDialog = false; pendingTask = null"
        >
          Отмена
        </v-btn>
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          class="text-none"
          @click="confirmDeleteTask"
        >
          Удалить
        </v-btn>
      </div>
    </v-card>
  </v-dialog>

  <!-- Category delete dialog -->
  <v-dialog v-model="deleteCatDialog" max-width="400">
    <v-card rounded="lg" class="pa-6">
      <p class="text-body-1 font-weight-medium mb-2 text-center">
        Удалить категорию «{{ column.title }}»?
      </p>
      <p v-if="column.tasks.length > 0" class="text-caption text-grey-darken-1 text-center mb-6">
        Вместе с ней будут удалены {{ taskCountLabel }} в этой категории.
      </p>
      <p v-else class="mb-6" />
      <div class="d-flex justify-center" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          class="text-none"
          @click="deleteCatDialog = false"
        >
          Отмена
        </v-btn>
        <v-btn
          variant="flat"
          color="red"
          class="text-none text-white"
          @click="confirmDeleteCat"
        >
          Удалить
        </v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import TaskCard from './TaskCard.vue'

const props = defineProps({
  column:     { type: Object,   required: true },
  taskFilter: { default: null },
})
const emit = defineEmits(['task-click', 'rename-column', 'delete-column'])

const visibleTasks = computed(() =>
  props.taskFilter ? props.column.tasks.filter(props.taskFilter) : props.column.tasks
)

// ── Task delete ───────────────────────────────────────────
const deleteTaskDialog = ref(false)
const pendingTask = ref(null)

const askDelete = (task) => {
  pendingTask.value = task
  deleteTaskDialog.value = true
}

const confirmDeleteTask = () => {
  if (!pendingTask.value) return
  const idx = props.column.tasks.findIndex((t) => t.id === pendingTask.value.id)
  if (idx >= 0) props.column.tasks.splice(idx, 1)
  deleteTaskDialog.value = false
  pendingTask.value = null
}

// ── Category rename ───────────────────────────────────────
const editing = ref(false)
const editTitle = ref('')
const titleInput = ref(null)

const startEdit = () => {
  editTitle.value = props.column.title
  editing.value = true
  nextTick(() => titleInput.value?.focus())
}

const commitRename = () => {
  const newTitle = editTitle.value.trim()
  if (newTitle && newTitle !== props.column.title) {
    emit('rename-column', { id: props.column.id, title: newTitle, color: props.column.dotColor })
  }
  editing.value = false
}

const cancelRename = () => {
  editing.value = false
}

// ── Category delete ───────────────────────────────────────
const deleteCatDialog = ref(false)

const confirmDeleteCat = () => {
  emit('delete-column', props.column.id)
  deleteCatDialog.value = false
}

// ── Helpers ───────────────────────────────────────────────
const taskCountLabel = computed(() => {
  const n = props.column.tasks.length
  if (n === 1) return '1 задача'
  if (n >= 2 && n <= 4) return `${n} задачи`
  return `${n} задач`
})
</script>

<style scoped>
.kanban-column {
  min-width: 280px;
  width: 280px;
  flex-shrink: 0;
}
.kanban-column-body {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
}
.column-header {
  margin-bottom: 20px;
  gap: 6px;
}
.column-title {
  cursor: pointer;
  border-radius: 4px;
  padding: 1px 3px;
  margin: 0 -3px;
  transition: background 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}
.column-title:hover {
  background: #f0f0f0;
}
.title-input {
  font-size: 14px;
  font-weight: 700;
  border: none;
  border-bottom: 2px solid #037247;
  outline: none;
  background: transparent;
  min-width: 0;
  width: 140px;
  padding: 1px 3px;
}
.task-badge {
  background: #f0f0f0;
  border-radius: 10px;
  padding: 1px 7px;
  font-size: 11px;
  font-weight: 600;
  color: #616161;
  flex-shrink: 0;
}
.delete-cat-btn {
  opacity: 0;
  transition: opacity 0.15s;
}
.kanban-column-body:hover .delete-cat-btn {
  opacity: 1;
}
</style>

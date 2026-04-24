<template>
  <div class="task-list-view">
    <div v-for="col in columns" :key="col.id" class="category-section">

      <!-- Category header -->
      <div class="cat-header d-flex align-center" @click="toggle(col.id)">
        <v-icon size="16" color="grey-darken-1" class="chevron">
          {{ collapsed[col.id] ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
        </v-icon>
        <v-icon :color="col.dotColor" size="10" class="mx-2">mdi-circle</v-icon>
        <span class="cat-title">{{ col.title }}</span>
        <span class="cat-count ml-2">{{ pluralCount(col.tasks.length) }}</span>
      </div>

      <!-- Task rows -->
      <template v-if="!collapsed[col.id]">
        <div
          v-for="task in col.tasks"
          :key="task.id"
          class="task-row d-flex align-center"
          :class="{ 'task-row--done': task.completed }"
        >
          <!-- Checkbox -->
          <v-checkbox
            :model-value="task.completed"
            density="compact"
            hide-details
            color="grey-darken-2"
            class="task-checkbox"
            @update:model-value="$emit('toggle-complete', task, $event)"
            @click.stop
          />

          <!-- Title -->
          <span
            class="task-title flex-grow-1"
            :class="{ 'task-title--done': task.completed }"
            @click="$emit('task-click', task, col)"
          >{{ task.title }}</span>

          <!-- Deadline -->
          <span
            v-if="task.deadline && task.deadline !== '—'"
            class="deadline-cell d-flex align-center text-caption text-grey-darken-1"
          >
            <v-icon size="13" class="mr-1">mdi-calendar-outline</v-icon>
            Срок до {{ task.deadline }}
          </span>

          <!-- Participant avatars -->
          <div v-if="task.participants?.length" class="avatars-wrap">
            <v-avatar
              v-for="(_, i) in task.participants.slice(0, 3)"
              :key="i"
              size="24"
              color="grey-lighten-2"
              :style="{ marginLeft: i > 0 ? '-6px' : '0', border: '2px solid white', zIndex: 10 - i }"
            >
              <v-icon size="13" color="grey-darken-1">mdi-account</v-icon>
            </v-avatar>
          </div>

          <!-- Tags -->
          <div v-if="task.tags?.length" class="tags-wrap">
            <span
              v-for="tag in task.tags"
              :key="tag.label"
              class="tag-pill"
              :style="{ backgroundColor: tag.bg, color: tag.color }"
            >{{ tag.label }}</span>
          </div>

          <!-- Three-dot menu -->
          <v-menu location="bottom end" :close-on-content-click="true">
            <template #activator="{ props: mp }">
              <v-btn icon size="x-small" variant="plain" v-bind="mp" @click.stop>
                <v-icon size="16" color="grey-darken-1">mdi-dots-vertical</v-icon>
              </v-btn>
            </template>
            <v-list density="compact" rounded="lg" min-width="160">
              <v-list-item @click="$emit('task-click', task, col)">
                <v-list-item-title>Редактировать</v-list-item-title>
              </v-list-item>
              <v-list-item @click="askDelete(task)">
                <v-list-item-title class="text-red">Удалить</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>

    </div>
  </div>

  <!-- Delete confirmation dialog -->
  <v-dialog v-model="deleteDialog" max-width="360">
    <v-card rounded="lg" class="pa-6">
      <p class="text-body-1 font-weight-medium mb-6 text-center">
        Вы уверены, что хотите удалить задачу?
      </p>
      <div class="d-flex justify-center" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="grey-darken-1"
          class="text-none"
          @click="deleteDialog = false"
        >Отмена</v-btn>
        <v-btn
          variant="flat"
          color="red"
          class="text-none text-white"
          @click="confirmDelete"
        >Удалить</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
})
const emit = defineEmits(['task-click', 'toggle-complete', 'delete-task'])

// ── Collapse state ──────────────────────────────────────
const collapsed = reactive({})
const toggle = (id) => { collapsed[id] = !collapsed[id] }

// ── Delete dialog ───────────────────────────────────────
const deleteDialog = ref(false)
const pendingTask  = ref(null)
const pendingCol   = ref(null)

const askDelete = (task) => {
  const col = props.columns.find(c => c.tasks.some(t => t.id === task.id))
  pendingTask.value = task
  pendingCol.value  = col
  deleteDialog.value = true
}

const confirmDelete = () => {
  if (pendingTask.value && pendingCol.value) {
    emit('delete-task', pendingTask.value, pendingCol.value)
  }
  deleteDialog.value = false
  pendingTask.value  = null
  pendingCol.value   = null
}

// ── Helpers ─────────────────────────────────────────────
const pluralCount = (n) =>
  n === 1 ? `${n} объект` : n >= 2 && n <= 4 ? `${n} объекта` : `${n} объектов`
</script>

<style scoped>
.task-list-view {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

/* Category header */
.cat-header {
  height: 48px;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  user-select: none;
  background: #fff;
}
.cat-header:hover { background: #fafafa; }
.cat-title {
  font-size: 14px;
  font-weight: 700;
}
.cat-count {
  font-size: 12px;
  color: #757575;
}

/* Task row */
.task-row {
  min-height: 52px;
  padding: 6px 16px 6px 8px;
  border-bottom: 1px solid #f0f0f0;
  gap: 8px;
  background: #fff;
  transition: background 0.12s;
}
.task-row:last-child { border-bottom: none; }
.task-row:hover { background: #fafafa; }
.task-row--done { background: #fafafa; }

.task-checkbox {
  flex-shrink: 0;
}

.task-title {
  font-size: 14px;
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-title:hover { text-decoration: underline; }
.task-title--done {
  text-decoration: line-through;
  color: #9e9e9e;
}

.deadline-cell {
  white-space: nowrap;
  flex-shrink: 0;
  margin-right: 12px;
}

.avatars-wrap {
  display: flex;
  flex-shrink: 0;
  margin-right: 8px;
}

.tags-wrap {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
  flex-shrink: 0;
}

.tag-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

/* Remove default checkbox padding/margin */
.task-checkbox :deep(.v-input__control) { flex: 0 0 auto; }
.task-checkbox :deep(.v-selection-control) { min-height: unset; }
</style>

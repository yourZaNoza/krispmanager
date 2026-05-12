<template>
  <div class="task-list-view" v-bind="$attrs">

    <div v-for="(col, colIdx) in columns" :key="col.id" class="category-section">

      <!-- Category header -->
      <div
        class="cat-header"
        :class="{ 'cat-header--not-first': colIdx > 0 }"
        @click="toggle(col.id)"
      >
        <v-icon size="15" color="grey-darken-1" class="chevron-icon">
          {{ collapsed[col.id] ? 'mdi-chevron-down' : 'mdi-chevron-up' }}
        </v-icon>
        <v-icon :color="col.dotColor" size="10">mdi-circle</v-icon>
        <span class="cat-title">{{ col.title }}</span>
        <span class="cat-count">{{ pluralCount(getVisibleTasks(col).length) }}</span>
      </div>

      <!-- Task rows -->
      <template v-if="!collapsed[col.id]">
        <div
          v-for="task in getVisibleTasks(col)"
          :key="task.id"
          class="task-row"
          :class="{ 'task-row--done': task.completed }"
          @click="$emit('task-click', task, col)"
        >
          <!-- Title -->
          <span class="task-title" :class="{ 'task-title--done': task.completed }">
            {{ task.title }}
          </span>

          <!-- Deadline -->
          <span
            v-if="task.deadline && task.deadline !== '—'"
            class="deadline-cell"
          >
            <v-icon size="13" class="mr-1" style="opacity: 0.6">mdi-calendar-outline</v-icon>
            Срок до {{ task.deadline }}
          </span>
          <span v-else class="deadline-cell" />

          <!-- Participant avatars -->
          <div class="avatars-wrap">
            <template v-if="task.participants?.length">
              <v-tooltip
                v-for="(p, i) in task.participants.slice(0, 3)"
                :key="i"
                :text="p.name || ''"
                location="top"
              >
                <template #activator="{ props: tp }">
                  <UserAvatar
                    v-bind="tp"
                    :user-id="p.id"
                    :name="p.name"
                    :size="24"
                    :style="{ marginLeft: i > 0 ? '-6px' : '0', border: '2px solid white', zIndex: 10 - i }"
                  />
                </template>
              </v-tooltip>
            </template>
          </div>

          <!-- Tags -->
          <div class="tags-wrap">
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
              <v-list-item @click.stop="$emit('task-click', task, col)">
                <v-list-item-title>Редактировать</v-list-item-title>
              </v-list-item>
              <v-list-item @click.stop="askDelete(task)">
                <v-list-item-title class="text-red">Удалить</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>

    </div>

    <!-- Delete confirmation dialog -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card rounded="lg" class="pa-6">
        <p class="text-body-1 font-weight-medium mb-6 text-center">
          Вы уверены, что хотите удалить задачу?
        </p>
        <div class="d-flex justify-center" style="gap: 12px">
          <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn variant="flat" color="red" class="text-none text-white" @click="confirmDelete">Удалить</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  columns:    { type: Array, required: true },
  taskFilter: { default: null },
})
const emit = defineEmits(['task-click', 'delete-task'])

function getVisibleTasks(col) {
  return props.taskFilter ? col.tasks.filter(props.taskFilter) : col.tasks
}

const collapsed = reactive({})
const toggle    = (id) => { collapsed[id] = !collapsed[id] }

const deleteDialog = ref(false)
const pendingTask  = ref(null)
const pendingCol   = ref(null)

const askDelete = (task) => {
  const col = props.columns.find(c => c.tasks.some(t => t.id === task.id))
  pendingTask.value  = task
  pendingCol.value   = col
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

const pluralCount = (n) =>
  n === 1 ? `${n} объект` : n >= 2 && n <= 4 ? `${n} объекта` : `${n} объектов`
</script>

<style scoped>
.task-list-view {
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
}

/* ── Category section ───────────────────────────────────── */
.category-section {
  background: #fff;
}

/* Category header */
.cat-header {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 48px;
  padding: 0 16px;
  cursor: pointer;
  border-bottom: 1px solid #e8e8e8;
  user-select: none;
}
.cat-header--not-first {
  border-top: 8px solid #f5f5f5;
}
.cat-header:hover { background: #fafafa; }

.chevron-icon { flex-shrink: 0; }

.cat-title {
  font-size: 14px;
  font-weight: 700;
}
.cat-count {
  font-size: 12px;
  color: #9e9e9e;
  margin-left: 4px;
}

/* ── Task row ───────────────────────────────────────────── */
.task-row {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 8px 12px 8px 20px;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  transition: background 0.1s;
  cursor: pointer;
}
.task-row:last-child { border-bottom: none; }
.task-row:hover      { background: #fafafa; }
.task-row--done      { background: #fafafa; }

/* Title — takes all free space */
.task-title {
  flex: 1 1 0;
  font-size: 14px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.task-title--done {
  color: #9e9e9e;
}

/* Deadline — fixed width so it sits in the "middle" */
.deadline-cell {
  flex: 0 0 190px;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #757575;
  white-space: nowrap;
}

/* Avatars */
.avatars-wrap {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  min-width: 32px;
}

/* Tags */
.tags-wrap {
  flex: 0 0 auto;
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}
.tag-pill {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
</style>

<style>
.v-theme--dark .task-list-view                      { border-color: rgba(255,255,255,0.12); }
.v-theme--dark .task-list-view .category-section    { background: transparent !important; }
.v-theme--dark .task-list-view .cat-header          { background: transparent !important; border-color: rgba(255,255,255,0.1); }
.v-theme--dark .task-list-view .cat-header--not-first { border-top-color: rgba(255,255,255,0.06) !important; }
.v-theme--dark .task-list-view .cat-header:hover    { background: rgba(255,255,255,0.04) !important; }
.v-theme--dark .task-list-view .task-row            { background: transparent !important; border-color: rgba(255,255,255,0.06); }
.v-theme--dark .task-list-view .task-row:hover      { background: rgba(255,255,255,0.04) !important; }
</style>

<template>
  <div class="kanban-board">
    <div v-for="column in columns" :key="column.id" class="kanban-column">
      <!-- Заголовок колонки -->
      <div class="d-flex align-center mb-3" style="gap: 8px">
        <v-icon :color="column.dotColor" size="12">mdi-circle</v-icon>
        <span class="text-subtitle-2 font-weight-bold">{{ column.title }}</span>
        <span class="text-caption text-grey-darken-1">{{ pluralCount(column.tasks.length) }}</span>
      </div>

      <!-- Кнопка создать задачу -->
      <v-btn
        variant="tonal"
        color="grey"
        block
        class="text-none mb-3 create-task-btn"
        prepend-icon="mdi-plus"
      >
        Создать задачу
      </v-btn>

      <!-- Карточки задач -->
      <div class="d-flex flex-column" style="gap: 10px">
        <v-card
          v-for="task in column.tasks"
          :key="task.id"
          variant="outlined"
          rounded="lg"
          class="task-card pa-3"
        >
          <!-- Теги + меню -->
          <div class="d-flex align-center justify-space-between mb-2">
            <div class="d-flex flex-wrap" style="gap: 5px">
              <v-chip
                v-for="tag in task.tags"
                :key="tag.label"
                size="x-small"
                rounded="sm"
                label
                :style="{ backgroundColor: tag.bg, color: tag.color, fontWeight: '500' }"
              >
                {{ tag.label }}
              </v-chip>
            </div>
            <v-btn icon size="x-small" variant="plain" density="compact">
              <v-icon size="16" color="grey">mdi-dots-horizontal</v-icon>
            </v-btn>
          </div>

          <!-- Название задачи -->
          <p class="text-body-2 font-weight-medium mb-3" style="line-height: 1.4">
            {{ task.title }}
          </p>

          <!-- Срок + подзадачи -->
          <div class="d-flex align-center text-caption text-grey-darken-1 mb-1" style="gap: 14px">
            <span class="d-flex align-center" style="gap: 4px">
              <v-icon size="13">mdi-calendar-outline</v-icon>
              Срок до {{ task.deadline }}
            </span>
            <span class="d-flex align-center" style="gap: 4px">
              <v-icon size="13">mdi-format-list-checks</v-icon>
              {{ task.subtasks }}
            </span>
          </div>

          <!-- Вложения + комментарии + аватары -->
          <div class="d-flex align-center text-caption text-grey-darken-1" style="gap: 14px">
            <span class="d-flex align-center" style="gap: 4px">
              <v-icon size="13">mdi-paperclip</v-icon>
              {{ task.attachments }}
            </span>
            <span class="d-flex align-center" style="gap: 4px">
              <v-icon size="13">mdi-comment-outline</v-icon>
              {{ task.comments }}
            </span>
            <div v-if="task.avatarCount" class="ml-auto d-flex">
              <v-avatar
                v-for="i in task.avatarCount"
                :key="i"
                size="22"
                color="grey-lighten-2"
                style="margin-left: -4px; border: 2px solid white"
              >
                <v-icon size="16" color="grey-darken-1">mdi-account</v-icon>
              </v-avatar>
            </div>
          </div>
        </v-card>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    required: true,
  },
})

const pluralCount = (n) => {
  if (n === 1) return `${n} объект`
  if (n >= 2 && n <= 4) return `${n} объекта`
  return `${n} объектов`
}
</script>

<style scoped>
.kanban-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
  padding-bottom: 16px;
  margin-top: 32px;
}

.kanban-column {
  min-width: 280px;
  width: 280px;
  flex-shrink: 0;
}

.create-task-btn {
  background-color: #f5f5f5 !important;
  color: #757575 !important;
  border: 1px dashed #bdbdbd !important;
}

.task-card {
  border-color: #e0e0e0 !important;
  transition: box-shadow 0.15s;
}

.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
</style>

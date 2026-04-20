<template>
  <div class="list-view mt-4">
    <div v-for="column in columns" :key="column.id" class="list-group mb-2">
      <!-- Заголовок группы -->
      <div
        class="list-group-header d-flex align-center"
        style="gap: 8px; cursor: pointer"
        @click="toggleGroup(column.id)"
      >
        <v-icon size="16" color="grey-darken-1">
          {{ collapsedGroups[column.id] ? 'mdi-chevron-right' : 'mdi-chevron-down' }}
        </v-icon>
        <v-icon :color="column.dotColor" size="10">mdi-circle</v-icon>
        <span class="text-subtitle-2 font-weight-bold" style="color: #1a1a1a">
          {{ column.title }}
        </span>
        <span class="text-caption text-grey-darken-1">
          {{ pluralCount(column.tasks.length) }}
        </span>
      </div>

      <!-- Строки задач -->
      <div v-if="!collapsedGroups[column.id]">
        <!-- Кнопка создать задачу -->
        <div class="list-create-row d-flex align-center justify-center">
          <v-btn
            variant="plain"
            color="grey-darken-1"
            class="text-none text-caption"
            prepend-icon="mdi-plus"
            size="small"
          >
            Create Task
          </v-btn>
        </div>

        <!-- Задачи -->
        <div
          v-for="task in column.tasks"
          :key="task.id"
          class="list-row d-flex align-center"
          :class="{ 'list-row--done': column.id === 'done' }"
        >
          <!-- Чекбокс -->
          <div class="list-col-check">
            <v-checkbox-btn
              :model-value="column.id === 'done'"
              color="success"
              density="compact"
              hide-details
            />
          </div>

          <!-- Название -->
          <div class="list-col-title">
            <span
              class="text-body-2"
              :style="
                column.id === 'done'
                  ? 'color: #9e9e9e; text-decoration: line-through;'
                  : 'color: #1a1a1a;'
              "
            >
              {{ task.title }}
            </span>
          </div>

          <!-- Срок -->
          <div class="list-col-date d-flex align-center" style="gap: 5px">
            <v-icon size="13" :color="column.id === 'done' ? 'grey-lighten-1' : 'grey-darken-1'">
              mdi-calendar-outline
            </v-icon>
            <span
              class="text-caption"
              :style="column.id === 'done' ? 'color: #bdbdbd;' : 'color: #616161;'"
            >
              Срок до {{ task.deadline }}
            </span>
          </div>

          <!-- Аватары -->
          <div class="list-col-avatars">
            <div v-if="task.avatarCount" class="d-flex">
              <v-avatar
                v-for="i in task.avatarCount"
                :key="i"
                size="22"
                color="grey-lighten-2"
                style="margin-left: -4px; border: 2px solid white"
              >
                <v-icon size="14" color="grey-darken-1">mdi-account</v-icon>
              </v-avatar>
            </div>
          </div>

          <!-- Теги -->
          <div class="list-col-tags" style="gap: 5px">
            <v-chip
              v-for="tag in task.tags"
              :key="tag.label"
              size="x-small"
              rounded="sm"
              label
              :style="{
                backgroundColor: column.id === 'done' ? '#f5f5f5' : tag.bg,
                color: column.id === 'done' ? '#bdbdbd' : tag.color,
                fontWeight: '500',
              }"
            >
              {{ tag.label }}
            </v-chip>
          </div>

          <!-- Меню -->
          <div class="list-col-menu">
            <v-btn icon size="x-small" variant="plain" density="compact">
              <v-icon size="16" color="grey-lighten-1">mdi-dots-vertical</v-icon>
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

defineProps({
  columns: {
    type: Array,
    required: true,
  },
})

const collapsedGroups = reactive({})

const toggleGroup = (id) => {
  collapsedGroups[id] = !collapsedGroups[id]
}

const pluralCount = (n) => {
  if (n === 1) return `${n} объект`
  if (n >= 2 && n <= 4) return `${n} объекта`
  return `${n} объектов`
}
</script>

<style scoped>
.list-view {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.list-group:not(:last-child) {
  border-bottom: 1px solid #eeeeee;
}

.list-group-header {
  padding: 10px 16px;
  background: #ffffff;
  user-select: none;
}
.list-group-header:hover {
  background: #fafafa;
}

.list-create-row {
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  padding: 4px 0;
  background: #fafafa;
}

.list-row {
  border-bottom: 1px solid #f0f0f0;
  padding: 0 8px 0 4px;
  min-height: 48px;
  background: #ffffff;
  transition: background 0.1s;
}
.list-row:last-child {
  border-bottom: none;
}
.list-row:hover {
  background: #fafafa;
}
.list-row--done {
  background: #fafafa;
}

.list-col-check {
  flex: 0 0 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.list-col-title {
  flex: 1 1 auto;
  min-width: 0;
  padding-right: 16px;
}
.list-col-date {
  flex: 0 0 180px;
  white-space: nowrap;
}
.list-col-avatars {
  flex: 0 0 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.list-col-tags {
  flex: 0 0 220px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: nowrap;
}
.list-col-menu {
  flex: 0 0 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
}
</style>

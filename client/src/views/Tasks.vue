<template>
  <v-app>
    <Sidebar v-model="sidebarOpen" />

    <!-- Верхняя панель с поиском -->
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
      <!-- Заголовок 64px — выравнивается с шапкой Sidebar -->
      <div class="tasks-header d-flex align-center px-5" style="gap: 16px;">
        <span style="font-size: 24px; font-weight: 700; white-space: nowrap;">Задачи</span>

        <v-tabs v-model="viewTab" density="compact" color="#037247" style="min-width: 0;">
          <v-tab value="list">
            <span
              class="tab-icon" style="margin-right: 8px;"
              :style="{ color: viewTab === 'list' ? '#037247' : '#727272' }"
              v-html="ListSvg"
            />
            Список
          </v-tab>
          <v-tab value="columns">
            <span
              class="tab-icon" style="margin-right: 8px;"
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

        <v-btn style="background-color: #037247;" class="text-none text-white" prepend-icon="mdi-plus">
          Добавить задачу
        </v-btn>

        <v-btn variant="outlined" color="success" class="text-none" prepend-icon="mdi-plus">
          Добавить категорию
        </v-btn>
      </div>

      <div class="px-5 pb-5">
        <!-- Канбан-доска -->
        <div v-if="viewTab === 'columns'" class="kanban-board" style="margin-top: 32px;">
          <div
            v-for="column in columns"
            :key="column.id"
            class="kanban-column"
          >
            <!-- Заголовок колонки -->
            <div class="d-flex align-center mb-3" style="gap: 8px;">
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
            <div class="d-flex flex-column" style="gap: 10px;">
              <v-card
                v-for="task in column.tasks"
                :key="task.id"
                variant="outlined"
                rounded="lg"
                class="task-card pa-3"
              >
                <!-- Теги + меню -->
                <div class="d-flex align-center justify-space-between mb-2">
                  <div class="d-flex flex-wrap" style="gap: 5px;">
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
                <p class="text-body-2 font-weight-medium mb-3" style="line-height: 1.4;">
                  {{ task.title }}
                </p>

                <!-- Срок + подзадачи -->
                <div class="d-flex align-center text-caption text-grey-darken-1 mb-1" style="gap: 14px;">
                  <span class="d-flex align-center" style="gap: 4px;">
                    <v-icon size="13">mdi-calendar-outline</v-icon>
                    Срок до {{ task.deadline }}
                  </span>
                  <span class="d-flex align-center" style="gap: 4px;">
                    <v-icon size="13">mdi-format-list-checks</v-icon>
                    {{ task.subtasks }}
                  </span>
                </div>

                <!-- Вложения + комментарии + аватары -->
                <div class="d-flex align-center text-caption text-grey-darken-1" style="gap: 14px;">
                  <span class="d-flex align-center" style="gap: 4px;">
                    <v-icon size="13">mdi-paperclip</v-icon>
                    {{ task.attachments }}
                  </span>
                  <span class="d-flex align-center" style="gap: 4px;">
                    <v-icon size="13">mdi-comment-outline</v-icon>
                    {{ task.comments }}
                  </span>
                  <div v-if="task.avatarCount" class="ml-auto d-flex" style="gap: -4px;">
                    <v-avatar
                      v-for="i in task.avatarCount"
                      :key="i"
                      size="22"
                      color="grey-lighten-2"
                      style="margin-left: -4px; border: 2px solid white;"
                    >
                      <v-icon size="16" color="grey-darken-1">mdi-account</v-icon>
                    </v-avatar>
                  </div>
                </div>
              </v-card>
            </div>
          </div>
        </div>

        <!-- Вид списком (заглушка) -->
        <div v-else class="d-flex align-center justify-center pa-16 text-grey" style="margin-top: 32px;">
          <span>Список задач</span>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import ListRaw   from '@/assets/List.svg?raw'
import KanbanRaw from '@/assets/Kanban.svg?raw'

const dyn = (raw) => raw.replace(/stroke="#[^"]+"/g, 'stroke="currentColor"')
const ListSvg   = dyn(ListRaw)
const KanbanSvg = dyn(KanbanRaw)

const sidebarOpen = ref(true)

const viewTab = ref('columns')

const pluralCount = (n) => {
  if (n === 1) return `${n} объект`
  if (n >= 2 && n <= 4) return `${n} объекта`
  return `${n} объектов`
}

const TAGS = {
  urgent:   { label: 'Срочная',    bg: '#FFF3E0', color: '#E65100' },
  event:    { label: 'Мероприятие', bg: '#E0F2F1', color: '#00695C' },
  report:   { label: 'Отчет',      bg: '#E8F5E9', color: '#2E7D32' },
  docs:     { label: 'Документы',  bg: '#E8EAF6', color: '#3949AB' },
  dept:     { label: 'Отдел',      bg: '#FFF8E1', color: '#F57F17' },
}

const columns = [
  {
    id: 'planned',
    title: 'Планируемые',
    dotColor: 'amber-darken-1',
    tasks: [
      {
        id: 1,
        tags: [TAGS.urgent, TAGS.event],
        title: 'Совещание о стратегии продвижения',
        deadline: '24.03.2026',
        subtasks: '10/124',
        attachments: 5,
        comments: 19,
        avatarCount: 2,
      },
      {
        id: 2,
        tags: [TAGS.event, TAGS.urgent],
        title: 'Улучшение качества обслуживания',
        deadline: '18.03.2026',
        subtasks: '12/52',
        attachments: 1,
        comments: 1,
        avatarCount: 0,
      },
      {
        id: 3,
        tags: [TAGS.dept, TAGS.docs],
        title: 'Создание отчета о доходах за месяц',
        deadline: '19.03.2026',
        subtasks: '4/5',
        attachments: 2,
        comments: 0,
        avatarCount: 0,
      },
    ],
  },
  {
    id: 'current',
    title: 'Текущие',
    dotColor: 'blue',
    tasks: [
      {
        id: 4,
        tags: [TAGS.report, TAGS.event, TAGS.urgent],
        title: 'Акт сверки (I Квартал)',
        deadline: '11.04.2026',
        subtasks: '4/12',
        attachments: 0,
        comments: 1,
        avatarCount: 0,
      },
      {
        id: 5,
        tags: [TAGS.report, TAGS.docs],
        title: 'Оформить контракт №26-213',
        deadline: '18.03.2026',
        subtasks: '12/64',
        attachments: 1,
        comments: 23,
        avatarCount: 0,
      },
      {
        id: 6,
        tags: [TAGS.dept, TAGS.urgent],
        title: 'Счета по напиткам (МБОУ СОШ №8)',
        deadline: '24.01.2026',
        subtasks: '3/4',
        attachments: 2,
        comments: 51,
        avatarCount: 0,
      },
      {
        id: 7,
        tags: [TAGS.event, TAGS.urgent],
        title: 'Встреча с поставщиком ООО "Фудсток"',
        deadline: '15.01.2026',
        subtasks: '0/12',
        attachments: 4,
        comments: 3,
        avatarCount: 0,
      },
    ],
  },
  {
    id: 'done',
    title: 'Завершенные',
    dotColor: 'success',
    tasks: [
      {
        id: 8,
        tags: [TAGS.report, TAGS.docs],
        title: 'Оформить контракт №25-201',
        deadline: '01.12.2025',
        subtasks: '2/15',
        attachments: 12,
        comments: 1,
        avatarCount: 0,
      },
      {
        id: 9,
        tags: [TAGS.dept, TAGS.docs],
        title: 'Отчет по доходам, 2025 г.',
        deadline: '24.12.2025',
        subtasks: '1/53',
        attachments: 2,
        comments: 21,
        avatarCount: 0,
      },
    ],
  },
]
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

/* Заголовок Tasks: 64px = совпадает с высотой шапки Sidebar */
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

<style>
.tab-icon svg path {
  stroke: currentColor !important;
}
</style>

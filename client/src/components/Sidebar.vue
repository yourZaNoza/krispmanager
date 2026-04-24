<template>
  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="256"
  >
    <!-- Шапка — высота 64px, выравнивается с заголовком Tasks -->
    <template #prepend>
      <div class="sidebar-header">
        <img src="@/assets/logo.svg" width="66" height="28" alt="logo" />
        <span class="sidebar-title">KrispManager</span>
      </div>
    </template>

    <!-- Основная навигация -->
    <v-list density="compact" nav class="py-2">
      <v-list-item
        v-for="item in mainNavItems"
        :key="item.path"
        :to="item.path"
        :title="item.label"
        rounded="0"
        class="nav-list-item"
      >
        <template #prepend>
          <span
            class="nav-icon"
            :style="{ color: isActive(item.path) ? '#0C693B' : '#727272' }"
            v-html="item.svg"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-divider class="my-1" />

    <v-list density="compact" nav class="py-1">
      <v-list-item to="/analytics" title="Аналитика" rounded="0" class="nav-list-item">
        <template #prepend>
          <span
            class="nav-icon"
            :style="{ color: isActive('/analytics') ? '#0C693B' : '#727272' }"
            v-html="ChartSvg"
          />
        </template>
      </v-list-item>
    </v-list>

    <v-divider class="my-1" />

    <v-list density="compact" nav class="py-1">
      <v-list-item to="/settings" title="Настройки" rounded="0" class="nav-list-item">
        <template #prepend>
          <span
            class="nav-icon"
            :style="{ color: isActive('/settings') ? '#0C693B' : '#727272' }"
            v-html="GearSvg"
          />
        </template>
      </v-list-item>

      <v-list-item to="/help" title="Помощь" rounded="0" class="nav-list-item">
        <template #prepend>
          <span
            class="nav-icon"
            :style="{ color: isActive('/help') ? '#0C693B' : '#727272' }"
            v-html="QuestionSvg"
          />
        </template>
      </v-list-item>
    </v-list>

    <!-- Низ: пользователь + ссылки -->
    <template #append>
      <v-divider />
      <div class="pa-3">
        <v-list-item class="px-0 user-item" style="margin-bottom: 12px" to="/profile">
          <template #prepend>
            <v-avatar size="34" color="grey-lighten-2">
              <span class="text-caption font-weight-medium text-grey-darken-2">
                {{ initials }}
              </span>
            </v-avatar>
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ userName || '—' }}
          </v-list-item-title>
          <template #append>
            <v-btn
              icon
              size="x-small"
              variant="plain"
              title="Выйти"
              @click.prevent="logout"
            >
              <v-icon size="18" color="grey-darken-1">mdi-logout</v-icon>
            </v-btn>
          </template>
        </v-list-item>

        <div class="d-flex flex-column" style="gap: 4px">
          <router-link to="/user-agreement" class="footer-link"
            >Пользовательское соглашение</router-link
          >
          <router-link to="/personal-data-policy" class="footer-link"
            >Политика персональных данных</router-link
          >
          <span class="footer-copy">Copyright to ООО "Крис"</span>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BellRaw from '@/assets/Bell.svg?raw'
import ClipboardRaw from '@/assets/ClipboardText.svg?raw'
import NoteRaw from '@/assets/NoteBlank.svg?raw'
import AddressRaw from '@/assets/AddressBook.svg?raw'
import BriefcaseRaw from '@/assets/Briefcase.svg?raw'
import ChartRaw from '@/assets/ChartLineUp.svg?raw'
import GearRaw from '@/assets/Gear.svg?raw'
import QuestionRaw from '@/assets/Question.svg?raw'

defineProps({
  modelValue: { type: Boolean, default: true },
})
defineEmits(['update:modelValue'])

const route = useRoute()
const router = useRouter()
const isActive = (path) => route.path === path

const logout = () => {
  localStorage.removeItem('user')
  router.push('/')
}

const userName = ref('')
const initials = computed(() => {
  const parts = (userName.value || '').trim().split(' ')
  return (
    parts
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?'
  )
})

onMounted(() => {
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      userName.value = user.name || ''
    }
  } catch {
    userName.value = ''
  }
})

// Заменяем хардкод-цвета на currentColor для управления через CSS
const dyn = (raw) => raw.replace(/stroke="#[^"]+"/g, 'stroke="currentColor"')

const ChartSvg = dyn(ChartRaw)
const GearSvg = dyn(GearRaw)
const QuestionSvg = dyn(QuestionRaw)

const mainNavItems = [
  { path: '/notifications', svg: dyn(BellRaw), label: 'Уведомления' },
  { path: '/tasks', svg: dyn(ClipboardRaw), label: 'Задачи' },
  { path: '/notes', svg: dyn(NoteRaw), label: 'Заметки' },
  { path: '/contacts', svg: dyn(AddressRaw), label: 'Контакты' },
  { path: '/companies', svg: dyn(BriefcaseRaw), label: 'Предприятия' },
]
</script>

<style scoped>
/* Шапка: 64px — выравнивается с заголовком Tasks */
.sidebar-header {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 55.99px;
  padding: 0 16px;
  border-bottom: 1px solid #e0e0e0;
}

.sidebar-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  white-space: nowrap;
}

/* SVG иконки */
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-right: 10px;
  flex-shrink: 0;
}

/* Тайтл у неактивных пунктов */
:deep(.nav-list-item:not(.v-list-item--active) .v-list-item-title) {
  color: #727272;
}

/* Активный пункт: фон #F2F2F2, тайтл #0C693B */
:deep(.nav-list-item.v-list-item--active) {
  background-color: #f2f2f2 !important;
}
:deep(.nav-list-item.v-list-item--active > .v-list-item__overlay) {
  opacity: 0 !important;
}
:deep(.nav-list-item.v-list-item--active .v-list-item-title) {
  color: #0c693b;
}

.footer-link {
  font-size: 12px;
  color: #9e9e9e;
  text-decoration: none;
  line-height: 1.6;
}
:deep(.user-item) {
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s;
}
:deep(.user-item:hover) {
  background: #f5f5f5;
}
:deep(.user-item.v-list-item--active) {
  background: transparent !important;
}

.footer-link:hover {
  color: #616161;
  text-decoration: underline;
}

.footer-copy {
  font-size: 8px;
  color: #bdbdbd;
  line-height: 1.6;
}
</style>

<!-- Глобальный стиль: SVG-иконки используют currentColor для stroke -->
<style>
.nav-icon svg path {
  stroke: currentColor !important;
}
</style>

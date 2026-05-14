<template>
  <NotificationsPanel
    v-model="notifOpen"
    @unread-count="unreadCount = $event"
  />

  <v-navigation-drawer
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    width="256"
  >
    <!-- Header -->
    <template #prepend>
      <div class="sidebar-header">
        <img src="@/assets/logo.svg" width="66" height="28" alt="logo" />
        <span class="sidebar-title">KrispManager</span>
      </div>
    </template>

    <!-- Main nav -->
    <v-list v-if="!hasNoRole" density="compact" nav class="nav-list py-2">

      <v-list-item
        rounded="0"
        class="nav-list-item"
        :class="{ 'v-list-item--active': notifOpen }"
        @click.prevent="notifOpen = !notifOpen"
      >
        <div class="nav-row">
          <span class="nav-icon" :style="{ color: notifOpen ? activeColor : idleColor }" v-html="BellSvg" />
          <span class="nav-text" :style="{ color: notifOpen ? activeColor : idleColor }">Уведомления</span>
          <v-chip v-if="unreadCount > 0" size="x-small" color="success" class="nav-badge ml-auto">{{ unreadCount }}</v-chip>
        </div>
      </v-list-item>

      <v-list-item
        v-for="item in mainNavItems"
        :key="item.path"
        :to="item.path"
        rounded="0"
        class="nav-list-item"
      >
        <div class="nav-row">
          <span class="nav-icon" :style="{ color: isActive(item.path) ? activeColor : idleColor }" v-html="item.svg" />
          <span class="nav-text" :style="{ color: isActive(item.path) ? activeColor : idleColor }">{{ item.label }}</span>
        </div>
      </v-list-item>
    </v-list>

    <v-divider v-if="!hasNoRole" class="my-1" />

    <v-list v-if="!hasNoRole" density="compact" nav class="nav-list py-1">
      <v-list-item to="/analytics" rounded="0" class="nav-list-item">
        <div class="nav-row">
          <span class="nav-icon" :style="{ color: isActive('/analytics') ? activeColor : idleColor }" v-html="ChartSvg" />
          <span class="nav-text" :style="{ color: isActive('/analytics') ? activeColor : idleColor }">Аналитика</span>
        </div>
      </v-list-item>

      <v-list-item v-if="hasArchiveAccess" to="/archive" rounded="0" class="nav-list-item">
        <div class="nav-row">
          <span class="nav-icon" :style="{ color: isActive('/archive') ? activeColor : idleColor }" v-html="FoldersSvg" />
          <span class="nav-text" :style="{ color: isActive('/archive') ? activeColor : idleColor }">Архив</span>
        </div>
      </v-list-item>
    </v-list>

    <v-divider class="my-1" />

    <v-list density="compact" nav class="nav-list py-1">
      <v-list-item v-if="!hasNoRole" to="/settings" rounded="0" class="nav-list-item">
        <div class="nav-row">
          <span class="nav-icon" :style="{ color: isActive('/settings') ? activeColor : idleColor }" v-html="GearSvg" />
          <span class="nav-text" :style="{ color: isActive('/settings') ? activeColor : idleColor }">Настройки</span>
        </div>
      </v-list-item>

      <v-list-item to="/help" rounded="0" class="nav-list-item">
        <div class="nav-row">
          <span class="nav-icon" :style="{ color: isActive('/help') ? activeColor : idleColor }" v-html="QuestionSvg" />
          <span class="nav-text" :style="{ color: isActive('/help') ? activeColor : idleColor }">Помощь</span>
        </div>
      </v-list-item>
    </v-list>

    <!-- Bottom: user + footer links -->
    <template #append>
      <v-divider />
      <div class="pa-3">
        <v-list-item class="px-0 user-item" style="margin-bottom: 12px" to="/profile">
          <template #prepend>
            <UserAvatar :user-id="sidebarUserId" :name="userName" :size="34" />
          </template>
          <v-list-item-title class="text-body-2 font-weight-medium">
            {{ userName || '—' }}
          </v-list-item-title>
          <template #append>
            <v-btn icon size="x-small" variant="plain" title="Выйти" @click.prevent="logout">
              <v-icon size="18" color="grey-darken-1">mdi-logout</v-icon>
            </v-btn>
          </template>
        </v-list-item>

        <div class="d-flex flex-column" style="gap: 4px">
          <router-link to="/user-agreement" class="footer-link">Пользовательское соглашение</router-link>
          <router-link to="/personal-data-policy" class="footer-link">Политика персональных данных</router-link>
          <span class="footer-copy">Copyright to ООО "Крис"</span>
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import axios from 'axios'
import NotificationsPanel from '@/components/NotificationsPanel.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useEvents } from '@/composables/useEvents'
import { loadAvatars } from '@/utils/avatarCache'

import BellRaw from '@/assets/Bell.svg?raw'
import ClipboardRaw from '@/assets/ClipboardText.svg?raw'
import NoteRaw from '@/assets/NoteBlank.svg?raw'
import AddressRaw from '@/assets/AddressBook.svg?raw'
import BriefcaseRaw from '@/assets/Briefcase.svg?raw'
import ChartRaw from '@/assets/ChartLineUp.svg?raw'
import GearRaw from '@/assets/Gear.svg?raw'
import QuestionRaw from '@/assets/Question.svg?raw'
import FoldersRaw from '@/assets/Folders.svg?raw'

defineProps({
  modelValue: { type: Boolean, default: true },
})
defineEmits(['update:modelValue'])

const route  = useRoute()
const router = useRouter()
const isActive = (path) => route.path === path

const { global: vTheme } = useTheme()
const isDark = computed(() => vTheme.current.value.dark)

const activeColor = computed(() => isDark.value ? '#ffffff' : '#0C693B')
const idleColor   = '#727272'

const notifOpen   = ref(false)
const unreadCount = ref(0)

const api = axios.create({ withCredentials: true })

async function fetchUnreadCount() {
  try {
    const { data } = await api.get('/api/notifications/unread-count')
    unreadCount.value = data.unread
  } catch { /* silent */ }
}

const logout = () => {
  localStorage.removeItem('user')
  router.push('/')
}

const userName     = ref('')
const userRole     = ref('сотрудник')
const sidebarUserId = ref(null)

const hasNoRole = computed(() => !userRole.value)

const hasArchiveAccess = computed(() =>
  userRole.value === 'менеджер' || userRole.value === 'администратор'
)

onMounted(() => {
  try {
    const stored = localStorage.getItem('user')
    if (stored) {
      const user = JSON.parse(stored)
      userName.value      = user.name || ''
      userRole.value      = user.role || null
      sidebarUserId.value = user.id   || null
    }
  } catch {
    userName.value = ''
  }

  fetchUnreadCount()
  loadAvatars()
})

useEvents((event) => {
  if (event.type === 'notification' && !notifOpen.value) {
    unreadCount.value++
  }
})

const dyn = (raw) => raw.replace(/stroke="#[^"]+"/g, 'stroke="currentColor"')

const BellSvg     = dyn(BellRaw)
const ChartSvg    = dyn(ChartRaw)
const GearSvg     = dyn(GearRaw)
const QuestionSvg = dyn(QuestionRaw)
const FoldersSvg  = dyn(FoldersRaw)

const mainNavItems = [
  { path: '/tasks',    svg: dyn(ClipboardRaw), label: 'Задачи'      },
  { path: '/notes',    svg: dyn(NoteRaw),      label: 'Заметки'     },
  { path: '/contacts', svg: dyn(AddressRaw),   label: 'Контакты'    },
  { path: '/companies', svg: dyn(BriefcaseRaw), label: 'Предприятия' },
]
</script>

<style scoped>
/* ── Header ──────────────────────────────────────────────── */
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

/* ── Nav list: remove Vuetify's nav horizontal padding ───── */
:deep(.nav-list.v-list--nav) {
  padding-inline: 0 !important;
}

/* ── Nav item: fixed height, no border-radius ────────────── */
:deep(.nav-list-item.v-list-item) {
  min-height: 40px !important;
  max-height: 40px !important;
  padding-inline: 0 !important;
  border-radius: 0 !important;
}

/* Remove Vuetify's content padding */
:deep(.nav-list-item .v-list-item__content) {
  padding: 0 !important;
  overflow: visible !important;
}

/* ── Row inside each item ─────────────────────────────────── */
.nav-row {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
  height: 40px;
  padding: 0 16px;
}

/* ── Icon: fixed 20×20 box ───────────────────────────────── */
.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-right: 12px;
}

/* Force all SVGs inside nav-icon to be exactly 20×20 */
.nav-icon :deep(svg) {
  width: 20px !important;
  height: 20px !important;
  flex-shrink: 0;
}

/* ── Label text ──────────────────────────────────────────── */
.nav-text {
  font-size: 14px;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
}

/* ── Notification badge ──────────────────────────────────── */
.nav-badge {
  font-size: 10px !important;
  height: 16px !important;
  min-width: 16px !important;
}

/* ── Active item background ──────────────────────────────── */
:deep(.nav-list-item.v-list-item--active) {
  background-color: #f2f2f2 !important;
}
:deep(.nav-list-item.v-list-item--active > .v-list-item__overlay) {
  opacity: 0 !important;
}

/* ── User item at bottom ─────────────────────────────────── */
:deep(.user-item) {
  border-radius: 8px !important;
  cursor: pointer;
  transition: background 0.15s;
}
:deep(.user-item:hover) {
  background: rgba(0, 0, 0, 0.04);
}
:deep(.user-item.v-list-item--active) {
  background: transparent !important;
}

/* ── Footer links ────────────────────────────────────────── */
.footer-link {
  font-size: 12px;
  color: #9e9e9e;
  text-decoration: none;
  line-height: 1.6;
}
.footer-link:hover {
  color: #616161;
  text-decoration: underline;
}
.footer-copy {
  font-size: 12px;
  color: #bdbdbd;
  line-height: 1.6;
  padding-left: 3px;
}
</style>

<!-- Global: SVG stroke + dark theme -->
<style>
.nav-icon svg path {
  stroke: currentColor !important;
}

.v-theme--dark .sidebar-title {
  color: white !important;
}

.v-theme--dark .nav-list-item.v-list-item--active {
  background-color: transparent !important;
  outline: 1px solid rgba(255, 255, 255, 0.55);
  outline-offset: -1px;
  border-radius: 0 !important;
}
.v-theme--dark .nav-list-item.v-list-item--active > .v-list-item__overlay {
  opacity: 0 !important;
}
.v-theme--dark .user-item:hover {
  background: rgba(255, 255, 255, 0.08) !important;
}
</style>

<template>
  <transition name="notif-slide">
    <div v-if="modelValue" class="notif-panel" @click.stop>
      <!-- Header -->
      <div class="notif-header">
        <div class="d-flex align-center" style="gap: 8px">
          <v-icon size="18">mdi-bell-outline</v-icon>
          <span class="notif-title">Уведомления</span>
          <v-chip v-if="unread > 0" size="x-small" color="success" class="notif-badge">{{ unread }}</v-chip>
        </div>
        <div class="d-flex align-center" style="gap: 4px">
          <v-btn
            v-if="unread > 0"
            variant="outlined"
            size="x-small"
            class="text-none"
            style="font-size: 12px"
            @click="markAllRead"
          >Всё прочитано</v-btn>
          <v-btn icon size="x-small" variant="plain" @click="$emit('update:modelValue', false)">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- List -->
      <div class="notif-list">
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate size="24" color="success" />
        </div>

        <div v-else-if="!notifications.length" class="text-center py-8 text-grey text-body-2">
          Нет уведомлений
        </div>

        <template v-else>
          <div
            v-for="n in notifications"
            :key="n.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.is_read }"
            @click="markRead(n)"
          >
            <!-- Unread dot -->
            <div class="notif-dot-wrap">
              <span v-if="!n.is_read" class="notif-dot" />
            </div>

            <!-- Avatar -->
            <UserAvatar :user-id="n.actor_id" :name="n.actor_name" :size="36" class="flex-shrink-0" />

            <!-- Content -->
            <div class="notif-content">
              <p class="notif-text mb-1">
                <strong>{{ n.actor_name || 'Пользователь' }}</strong>
                {{ n.message }}
              </p>
              <p v-if="n.task_title" class="notif-task mb-1">
                <v-icon size="12" class="mr-1">mdi-clipboard-text-outline</v-icon>
                {{ n.task_title }}
              </p>
              <span class="notif-time">{{ relativeTime(n.created_at) }}</span>
            </div>

            <!-- Menu -->
            <v-menu location="bottom end" :close-on-content-click="true">
              <template #activator="{ props: mp }">
                <v-btn icon size="x-small" variant="plain" v-bind="mp" @click.stop>
                  <v-icon size="16" color="grey">mdi-dots-vertical</v-icon>
                </v-btn>
              </template>
              <v-list density="compact" rounded="lg" min-width="150">
                <v-list-item @click="markRead(n)">
                  <v-list-item-title class="text-body-2">Отметить прочитанным</v-list-item-title>
                </v-list-item>
                <v-list-item @click="remove(n)">
                  <v-list-item-title class="text-body-2 text-red">Удалить</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </template>
      </div>

      <!-- Load more -->
      <div v-if="hasMore && !loading" class="notif-footer">
        <v-btn
          variant="flat"
          color="success"
          class="text-none w-100"
          style="border-radius: 0 0 12px 12px"
          :loading="loadingMore"
          @click="loadMore"
        >Ещё</v-btn>
      </div>
    </div>
  </transition>

  <!-- Overlay to close on outside click -->
  <div v-if="modelValue" class="notif-overlay" @click="$emit('update:modelValue', false)" />
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useEvents } from '@/composables/useEvents'
import UserAvatar from '@/components/UserAvatar.vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
})
const emit = defineEmits(['update:modelValue', 'unread-count'])

const api = axios.create({ withCredentials: true })

const notifications = ref([])
const unread        = ref(0)
const loading       = ref(false)
const loadingMore   = ref(false)
const hasMore       = ref(false)
const offset        = ref(0)
const LIMIT         = 15

watch(() => props.modelValue, async (open) => {
  if (open) await fetchNotifications(true)
})

async function fetchNotifications(reset = false) {
  if (reset) { offset.value = 0; notifications.value = [] }
  loading.value = true
  try {
    const { data } = await api.get('/api/notifications', { params: { limit: LIMIT, offset: offset.value } })
    notifications.value = reset ? data.notifications : [...notifications.value, ...data.notifications]
    unread.value  = data.unread
    hasMore.value = data.notifications.length === LIMIT
    offset.value += data.notifications.length
    emit('unread-count', unread.value)
  } catch (e) {
    console.error('Notifications fetch error:', e)
  } finally {
    loading.value = false
  }
}

async function loadMore() {
  loadingMore.value = true
  await fetchNotifications(false)
  loadingMore.value = false
}

async function markRead(n) {
  if (n.is_read) return
  try {
    await api.patch(`/api/notifications/${n.id}/read`)
    n.is_read = 1
    unread.value = Math.max(0, unread.value - 1)
    emit('unread-count', unread.value)
  } catch (e) { console.error(e) }
}

async function markAllRead() {
  try {
    await api.patch('/api/notifications/read-all')
    notifications.value.forEach(n => { n.is_read = 1 })
    unread.value = 0
    emit('unread-count', 0)
  } catch (e) { console.error(e) }
}

async function remove(n) {
  try {
    await api.delete(`/api/notifications/${n.id}`)
    const idx = notifications.value.findIndex(x => x.id === n.id)
    if (idx >= 0) {
      if (!n.is_read) unread.value = Math.max(0, unread.value - 1)
      notifications.value.splice(idx, 1)
      emit('unread-count', unread.value)
    }
  } catch (e) { console.error(e) }
}

// ── Helpers ──────────────────────────────────────────────
function relativeTime(dateStr) {
  if (!dateStr) return ''
  const now  = new Date()
  const then = new Date(dateStr)
  const diff = now - then
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)   return 'Только что'
  if (mins < 60)  return `${mins} мин. назад`
  if (hours < 24) return `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'} назад`
  if (days === 1) return 'Вчера'
  return `${String(then.getDate()).padStart(2,'0')}.${String(then.getMonth()+1).padStart(2,'0')}.${then.getFullYear()}`
}

// Prepend real-time notifications when panel is open; always update unread count
useEvents((event) => {
  if (event.type !== 'notification') return
  if (props.modelValue) {
    notifications.value.unshift({
      id:         event.id,
      actor_name: event.actor_name,
      actor_id:   event.actor_id,
      message:    event.message,
      task_title: event.task_title,
      task_id:    event.task_id,
      is_read:    0,
      created_at: event.created_at,
    })
  }
  unread.value++
  emit('unread-count', unread.value)
})

// Expose for parent polling
defineExpose({ fetchUnreadCount: async () => {
  try {
    const { data } = await api.get('/api/notifications/unread-count')
    unread.value = data.unread
    emit('unread-count', data.unread)
    return data.unread
  } catch { return 0 }
}})
</script>

<style scoped>
.notif-panel {
  position: fixed;
  top: 0;
  left: 256px;
  width: 400px;
  max-height: 100vh;
  background: #fff;
  border-right: 1px solid rgba(0,0,0,0.1);
  border-bottom: 1px solid rgba(0,0,0,0.1);
  border-radius: 0 0 12px 0;
  box-shadow: 4px 4px 24px rgba(0,0,0,0.12);
  display: flex;
  flex-direction: column;
  z-index: 1100;
  overflow: hidden;
}

.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 1099;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  flex-shrink: 0;
}

.notif-title {
  font-size: 15px;
  font-weight: 600;
}

.notif-badge {
  font-size: 11px !important;
  height: 18px !important;
  min-width: 18px !important;
}

.notif-list {
  overflow-y: auto;
  flex: 1;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px 12px 8px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;
  transition: background 0.1s;
}
.notif-item:hover { background: #f8f8f8; }
.notif-item--unread { background: #f0faf4; }
.notif-item--unread:hover { background: #e8f5e9; }

.notif-dot-wrap {
  width: 10px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  padding-top: 14px;
}
.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #037247;
  flex-shrink: 0;
}

.notif-content { flex: 1; min-width: 0; }

.notif-text {
  font-size: 13px;
  line-height: 1.45;
  margin: 0;
  color: #1a1a1a;
}

.notif-task {
  font-size: 11px;
  color: #616161;
  display: flex;
  align-items: center;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-time {
  font-size: 11px;
  color: #9e9e9e;
}

.notif-footer { flex-shrink: 0; }

/* Transition */
.notif-slide-enter-active,
.notif-slide-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.notif-slide-enter-from,
.notif-slide-leave-to { transform: translateX(-16px); opacity: 0; }

</style>

<style>
.v-theme--dark .notif-panel {
  background: #1e1e1e;
  border-color: rgba(255,255,255,0.1);
}
.v-theme--dark .notif-header  { border-color: rgba(255,255,255,0.08); }
.v-theme--dark .notif-item    { border-bottom-color: rgba(255,255,255,0.06); }
.v-theme--dark .notif-item:hover          { background: rgba(255,255,255,0.05); }
.v-theme--dark .notif-item--unread        { background: rgba(3,114,71,0.15); }
.v-theme--dark .notif-item--unread:hover  { background: rgba(3,114,71,0.22); }
.v-theme--dark .notif-text { color: #ffffff; }
.v-theme--dark .notif-task { color: #9e9e9e; }
.v-theme--dark .notif-time { color: #757575; }
</style>

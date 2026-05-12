<template>
  <v-card
    variant="outlined"
    rounded="lg"
    class="task-card pa-3"
    :class="{ 'task-card--deleted': deleted }"
    style="cursor: pointer"
    @click="$emit('click')"
  >
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="d-flex flex-wrap" style="gap: 5px">
        <v-chip
          v-for="tag in task.tags"
          :key="tag.label"
          size="x-small"
          rounded="sm"
          label
          :style="{ backgroundColor: tag.bg, color: tag.color, fontWeight: '500' }"
        >{{ tag.label }}</v-chip>
      </div>
      <div class="d-flex align-center" style="gap: 6px">
        <span v-if="deleted" class="deleted-badge">удалена</span>
        <v-btn
          v-if="deleted"
          icon size="x-small" variant="plain" density="compact"
          title="Восстановить задачу"
          @click.stop="$emit('restore-click')"
        >
          <v-icon size="16" color="#037247">mdi-restore</v-icon>
        </v-btn>
        <v-btn v-else icon size="x-small" variant="plain" density="compact" @click.stop="$emit('delete-click')">
          <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
        </v-btn>
      </div>
    </div>

    <p class="text-body-2 font-weight-medium mb-3" :class="{ 'text-grey': deleted }" style="line-height: 1.4">{{ task.title }}</p>

    <div class="d-flex align-center text-caption text-grey-darken-1 mb-1" style="gap: 14px; flex-wrap: nowrap">
      <span class="d-flex align-center" style="gap: 4px; white-space: nowrap; flex-shrink: 0">
        <v-icon size="13" style="flex-shrink: 0">mdi-calendar-outline</v-icon>
        Срок до {{ displayDeadline }}
      </span>
      <span class="d-flex align-center" style="gap: 4px; white-space: nowrap">
        <v-icon size="13">mdi-format-list-checks</v-icon>
        {{ subtasksText }}
      </span>
    </div>

    <div class="d-flex align-center text-caption text-grey-darken-1" style="gap: 14px">
      <span class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-paperclip</v-icon>
        {{ attachCount }}
      </span>
      <span class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-comment-outline</v-icon>
        {{ commentCount }}
      </span>
      <div v-if="task.participants?.length" class="ml-auto d-flex">
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
              :size="22"
              style="margin-left: -4px; border: 2px solid white"
            />
          </template>
        </v-tooltip>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'

const props = defineProps({
  task:    { type: Object,  required: true },
  deleted: { type: Boolean, default: false },
})
defineEmits(['click', 'delete-click', 'restore-click'])

const toDate = (d) => { if (!d) return null; return d instanceof Date ? d : new Date(d) }
const fmtShort = (d) => {
  const dt = toDate(d)
  if (!dt || isNaN(dt)) return '—'
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`
}

const displayDeadline = computed(() =>
  props.task.deadlineRaw ? fmtShort(props.task.deadlineRaw) : (props.task.deadline || '—')
)

const subtasksText = computed(() => {
  if (props.task.lists?.length) {
    const total = props.task.lists.reduce((a, l) => a + l.items.length, 0)
    const done  = props.task.lists.reduce((a, l) => a + l.items.filter(i => i.done).length, 0)
    if (total > 0) return `${done}/${total}`
  }
  return props.task.subtasks || ''
})

const attachCount  = computed(() => Array.isArray(props.task.attachments) ? props.task.attachments.length : props.task.attachments)
const commentCount = computed(() => Array.isArray(props.task.comments)    ? props.task.comments.length    : props.task.comments)

</script>

<style scoped>
.task-card {
  border-color: #e0e0e0 !important;
  transition: box-shadow 0.15s;
}
.task-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
.task-card--deleted {
  opacity: 0.75;
}
.deleted-badge {
  font-size: 11px;
  font-weight: 600;
  color: #D32F2F;
  border: 1px solid #D32F2F;
  border-radius: 4px;
  padding: 1px 7px;
  white-space: nowrap;
  line-height: 18px;
}
</style>

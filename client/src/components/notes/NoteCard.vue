<template>
  <v-card
    variant="outlined"
    rounded="lg"
    class="note-card pa-4"
    :class="{ 'note-card--deleted': deleted }"
    :style="(deleted || archiveMode) ? 'cursor: default; position: relative' : 'position: relative'"
    @click="(deleted || archiveMode) ? undefined : $emit('open')"
  >
    <!-- Archive top-right controls -->
    <div v-if="archiveMode" class="note-archive-controls" @click.stop>
      <template v-if="deleted">
        <span class="deleted-badge">удалена</span>
        <v-btn icon size="x-small" variant="plain" density="compact"
          title="Восстановить заметку"
          @click.stop="$emit('restore-click')"
        >
          <v-icon size="16" color="#037247">mdi-restore</v-icon>
        </v-btn>
      </template>
      <v-btn v-else icon size="x-small" variant="plain" density="compact"
        @click.stop="$emit('delete')"
      >
        <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
      </v-btn>
    </div>

    <!-- Tags -->
    <div
      v-if="note.tags.length"
      class="d-flex flex-wrap mb-2"
      :style="archiveMode ? 'gap: 6px; padding-right: 32px' : 'gap: 6px'"
    >
      <v-chip
        v-for="tag in note.tags"
        :key="tag"
        size="x-small"
        :style="tagStyle(tag)"
        class="font-weight-medium"
      >{{ tag }}</v-chip>
    </div>

    <!-- Title -->
    <p
      class="text-body-1 font-weight-bold mb-2 note-title"
      :class="{ 'text-grey': deleted }"
      :style="archiveMode && !note.tags.length ? 'padding-right: 32px' : ''"
    >{{ note.title }}</p>

    <!-- Content preview: first list items -->
    <template v-if="previewList">
      <div class="text-body-2 text-grey-darken-2 mb-2 preview-content">
        <div
          v-for="(item, i) in previewList.items.slice(0, 3)"
          :key="i"
          class="d-flex align-start preview-item"
          style="gap: 6px"
        >
          <span v-if="previewList.type === 'bullet'" class="preview-bullet">•</span>
          <span v-else-if="previewList.type === 'numbered'" class="preview-bullet">{{ i + 1 }}.</span>
          <v-icon v-else size="13" class="mt-1 flex-shrink-0" color="grey-darken-1">mdi-checkbox-blank-circle-outline</v-icon>
          <span class="preview-text">{{ item.text }}</span>
        </div>
      </div>
    </template>

    <!-- Footer -->
    <div class="d-flex align-center justify-space-between mt-2">
      <span class="text-caption text-grey-darken-1">{{ footerDate }}</span>

      <!-- Normal state: dots menu -->
      <v-btn v-if="!archiveMode" icon size="x-small" variant="plain" @click.stop>
        <v-icon size="16" color="grey">mdi-dots-horizontal</v-icon>
        <v-menu activator="parent" location="bottom end">
          <v-list density="compact" rounded="lg" class="pa-1">
            <v-list-item rounded="lg" @click.stop="$emit('open')">
              <v-list-item-title class="text-body-2">Редактировать</v-list-item-title>
            </v-list-item>
            <v-list-item rounded="lg" @click.stop="$emit('delete')">
              <v-list-item-title class="text-body-2 text-red">Удалить</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import { tagStyle } from '@/composables/noteTags'

const props = defineProps({
  note:        { type: Object,  required: true },
  deleted:     { type: Boolean, default: false },
  archiveMode: { type: Boolean, default: false },
})
defineEmits(['open', 'delete', 'restore-click'])

const SHORT_MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

const previewList = computed(() =>
  props.note.lists?.find(l => l.items?.length) ?? null
)

const footerDate = computed(() => {
  const d = props.note.date ? new Date(props.note.date + 'T00:00:00') : null
  const datePart = d ? `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}` : ''
  const timePart = props.note.time || ''
  if (datePart && timePart) return `${datePart} / ${timePart}`
  return datePart || timePart || '—'
})
</script>

<style scoped>
.note-card {
  border-color: #e0e0e0 !important;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.note-card:hover {
  box-shadow: 0 2px 10px rgba(0,0,0,0.09) !important;
}
.note-card--deleted {
  opacity: 0.75;
}
.note-archive-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
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
.note-title {
  line-height: 1.4;
  margin: 0 0 6px;
}
.preview-bullet {
  flex-shrink: 0;
  line-height: 1.5;
}
.preview-text {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-height: 1.5;
}

</style>

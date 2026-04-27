<template>
  <v-card variant="outlined" rounded="lg" class="contact-card pa-3" style="cursor: pointer" @click="$emit('edit')">
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="d-flex align-center" style="gap: 10px">
        <v-avatar size="36" :color="avatarColor" class="flex-shrink-0">
          <span class="text-caption font-weight-bold text-white">{{ initials }}</span>
        </v-avatar>
        <p class="text-body-2 font-weight-medium card-name">{{ contact.name }}</p>
      </div>
      <v-btn icon size="x-small" variant="plain" density="compact" @click.stop="$emit('delete')">
        <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
      </v-btn>
    </div>

    <div class="d-flex flex-column text-caption text-grey-darken-1" style="gap: 4px">
      <span v-if="contact.city" class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-map-marker-outline</v-icon>
        {{ contact.city }}
      </span>
      <span v-if="contact.email" class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-email-outline</v-icon>
        <span class="email-link">{{ contact.email }}</span>
      </span>
      <span v-if="contact.phone" class="d-flex align-center" style="gap: 4px">
        <v-icon size="13">mdi-phone-outline</v-icon>
        {{ contact.phone }}
      </span>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  contact: { type: Object, required: true },
})
defineEmits(['edit', 'delete'])

const AVATAR_COLORS = ['#7B5EA7', '#1565C0', '#E65100', '#2E7D32', '#6A1B9A', '#00695C']

const initials = computed(() => {
  const parts = (props.contact.name || '').trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return (parts[0]?.[0] || '?').toUpperCase()
})

const avatarColor = computed(() => {
  const code = (props.contact.name || '').charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
})
</script>

<style scoped>
.contact-card {
  border-color: #e0e0e0 !important;
  transition: box-shadow 0.15s;
}
.contact-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}
.card-name {
  margin: 0;
  line-height: 1.4;
}
.email-link {
  color: #1565c0;
  text-decoration: underline;
}
</style>

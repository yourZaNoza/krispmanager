<template>
  <v-card
    variant="outlined" rounded="lg" class="contact-card pa-3"
    :class="{ 'contact-card--clickable': !contact.isEmployee }"
    @click="!contact.isEmployee && $emit('edit')"
  >
    <!-- Header -->
    <div class="card-header">
      <UserAvatar
        v-if="contact.isEmployee"
        :user-id="contact.employeeId"
        :name="contact.name"
        :size="34"
        class="flex-shrink-0"
      />
      <v-avatar v-else size="34" :color="avatarColor" class="flex-shrink-0">
        <span class="text-caption font-weight-bold text-white">{{ initials }}</span>
      </v-avatar>

      <div class="card-name-block">
        <div class="d-flex align-center" style="gap: 4px">
          <span class="card-name text-body-2 font-weight-medium">{{ contact.name }}</span>
          <v-icon v-if="contact.isRegistered && !contact.isEmployee" size="14" color="#4CAF50">mdi-check-circle</v-icon>
        </div>
        <span v-if="contact.isEmployee && contact.position" class="card-sub text-caption text-grey-darken-1">
          {{ contact.position }}
        </span>
      </div>

      <v-btn
        v-if="!contact.isEmployee"
        icon size="x-small" variant="plain" density="compact"
        class="flex-shrink-0"
        @click.stop="$emit('delete')"
      >
        <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
      </v-btn>
    </div>

    <!-- Details -->
    <div v-if="hasDetails" class="card-details text-caption text-grey-darken-1">
      <div v-if="contact.isEmployee && contact.role" class="info-row">
        <v-icon size="14" class="info-icon">mdi-shield-account-outline</v-icon>
        <span>{{ contact.role }}</span>
      </div>
      <div v-if="contact.city" class="info-row">
        <v-icon size="14" class="info-icon">mdi-map-marker-outline</v-icon>
        <span>{{ contact.city }}</span>
      </div>
      <div v-if="contact.email" class="info-row">
        <v-icon size="14" class="info-icon">mdi-email-outline</v-icon>
        <span class="email-link text-truncate">{{ contact.email }}</span>
      </div>
      <div v-if="contact.phone" class="info-row">
        <v-icon size="14" class="info-icon">mdi-phone-outline</v-icon>
        <span>{{ contact.phone }}</span>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue'
import UserAvatar from '@/components/UserAvatar.vue'

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

const hasDetails = computed(() =>
  (props.contact.isEmployee && (props.contact.role || props.contact.position)) ||
  props.contact.city || props.contact.email || props.contact.phone
)
</script>

<style scoped>
.contact-card {
  border-color: #e0e0e0 !important;
  transition: box-shadow 0.15s;
}
.contact-card--clickable {
  cursor: pointer;
}
.contact-card--clickable:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
}

/* Header row: avatar | name block | delete btn */
.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.card-name-block {
  flex: 1;
  min-width: 0;
}
.card-name {
  display: block;
  margin: 0;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.card-sub {
  display: block;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Details rows */
.card-details {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.info-row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 16px;
}
.info-icon {
  flex-shrink: 0;
}
.email-link {
  color: #1565c0;
  text-decoration: underline;
  min-width: 0;
}
</style>

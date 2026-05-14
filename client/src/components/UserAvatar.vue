<template>
  <v-avatar :size="size" :color="src ? undefined : bg" style="flex-shrink: 0">
    <img
      v-if="src"
      :src="src"
      :alt="name"
      style="width: 100%; height: 100%; object-fit: cover; border-radius: inherit"
      @error="broken = true"
    />
    <span v-else :style="textStyle">{{ initials }}</span>
  </v-avatar>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getAvatarUrl } from '@/utils/avatarCache'

const props = defineProps({
  userId: { default: null },
  name:   { type: String, default: '' },
  size:   { type: [Number, String], default: 32 },
})

const broken = ref(false)
watch(() => props.userId, () => { broken.value = false })

const src = computed(() => {
  if (broken.value) return null
  const url = getAvatarUrl(props.userId)
  return url || null
})

const COLORS = ['#7B5EA7','#1565C0','#E65100','#2E7D32','#6A1B9A','#00695C','#37474F','#BF360C']
const bg = computed(() => {
  const c = (props.name || '').charCodeAt(0) || 0
  return COLORS[c % COLORS.length]
})

const initials = computed(() => {
  const parts = (props.name || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return parts.length === 1
    ? parts[0].slice(0, 2).toUpperCase()
    : (parts[0][0] + parts[1][0]).toUpperCase()
})

const textStyle = computed(() => ({
  color:      '#fff',
  fontWeight: '600',
  fontSize:   `${Math.max(10, Math.floor(Number(props.size) / 2.8))}px`,
  lineHeight: '1',
  userSelect: 'none',
}))
</script>

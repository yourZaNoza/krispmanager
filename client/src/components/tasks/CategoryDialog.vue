<template>
  <v-dialog
    :model-value="modelValue"
    max-width="460"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <span class="text-h6 font-weight-medium">{{ dialogTitle }}</span>
        <div class="d-flex">
          <v-btn icon size="small" variant="plain" @click="save"><v-icon>mdi-check</v-icon></v-btn>
          <v-btn icon size="small" variant="plain" @click="$emit('update:modelValue', false)"><v-icon>mdi-close</v-icon></v-btn>
        </div>
      </div>

      <div class="mb-4">
        <p class="field-label">Наименование</p>
        <v-text-field v-model="form.name" variant="outlined" density="compact" hide-details />
      </div>

      <div class="d-flex" :style="hasBg ? 'gap: 24px' : ''">
        <div>
          <p class="field-label">{{ hasBg ? 'Цвет текста' : 'Цвет' }}</p>
          <div class="color-grid">
            <div
              v-for="c in COLORS"
              :key="c"
              class="color-dot"
              :class="{ 'color-dot--active': form.color === c }"
              :style="{ backgroundColor: c }"
              @click="form.color = c"
            />
          </div>
        </div>
        <div v-if="hasBg">
          <p class="field-label">Фон</p>
          <div class="color-grid">
            <div
              v-for="c in BG_COLORS"
              :key="c"
              class="color-dot"
              :class="{ 'color-dot--active': form.bg === c }"
              :style="{ backgroundColor: c }"
              @click="form.bg = c"
            />
          </div>
        </div>
      </div>

      <!-- preview for tags -->
      <div v-if="hasBg && form.name" class="mt-4">
        <v-chip size="small" rounded="sm" :style="{ backgroundColor: form.bg, color: form.color }">
          {{ form.name }}
        </v-chip>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  item:        { type: Object,  default: null },
  dialogTitle: { type: String,  default: 'Новая категория' },
  hasBg:       { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save'])

const COLORS    = ['#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336', '#FF9800', '#212121', '#E65100', '#1565C0', '#2E7D32', '#F57F17', '#C62828']
const BG_COLORS = ['#E8F5E9', '#E3F2FD', '#FFFDE7', '#F3E5F5', '#FFEBEE', '#FFF3E0', '#F5F5F5', '#E0F2F1', '#FFF8E1', '#E8EAF6', '#FCE4EC', '#E1F5FE']

const form = ref({ name: '', color: COLORS[0], bg: BG_COLORS[0] })

watch(() => props.modelValue, (v) => {
  if (!v) return
  if (props.item) {
    form.value = { name: props.item.label || props.item.title || '', color: props.item.color || COLORS[0], bg: props.item.bg || BG_COLORS[0] }
  } else {
    form.value = { name: '', color: COLORS[0], bg: BG_COLORS[0] }
  }
})

const save = () => {
  if (!form.value.name.trim()) return
  emit('save', { ...form.value })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.field-label { font-size: 12px; color: #616161; margin-bottom: 4px; font-weight: 500; }
.color-grid { display: grid; grid-template-columns: repeat(4, 24px); gap: 8px; }
.color-dot { width: 24px; height: 24px; border-radius: 50%; cursor: pointer; transition: transform 0.1s; outline: 2px solid transparent; outline-offset: 2px; }
.color-dot:hover { transform: scale(1.15); }
.color-dot--active { outline-color: #555 !important; }
</style>

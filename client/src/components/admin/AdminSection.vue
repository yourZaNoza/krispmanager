<template>
  <div class="mb-8">
    <div class="d-flex align-center justify-space-between mb-2">
      <div>
        <p class="text-body-1 font-weight-bold mb-0">{{ title }}</p>
        <p class="text-caption text-grey mb-0">{{ description }}</p>
      </div>
      <v-btn
        style="background-color: #037247;"
        class="text-white text-none"
        prepend-icon="mdi-plus"
        size="small"
        @click="$emit('add')"
      >
        Добавить
      </v-btn>
    </div>

    <v-card variant="outlined" rounded="lg">
      <div v-if="loading" class="text-center py-6">
        <v-progress-circular indeterminate size="24" color="success" />
      </div>

      <div v-else-if="!items.length" class="text-center py-5 text-grey text-body-2">
        Нет элементов
      </div>

      <template v-else>
        <div
          v-for="(item, i) in items"
          :key="item.id"
          class="d-flex align-center px-4 py-3"
          :style="{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.07)' : 'none' }"
        >
          <!-- tag preview -->
          <template v-if="isTag">
            <v-chip
              size="small"
              rounded="sm"
              :style="{ backgroundColor: item.bg, color: item.color, marginRight: '10px', borderColor: 'transparent' }"
            >
              {{ item.label }}
            </v-chip>
          </template>
          <!-- category dot -->
          <template v-else>
            <v-icon size="10" :color="item.color" style="margin-right: 8px;">mdi-circle</v-icon>
            <span class="text-body-2 font-weight-medium" style="flex: 1;">{{ item.title }}</span>
          </template>

          <v-spacer v-if="isTag" />

          <v-btn icon size="x-small" variant="plain" @click="$emit('edit', item)">
            <v-icon size="16" color="grey">mdi-pencil-outline</v-icon>
          </v-btn>
          <v-btn icon size="x-small" variant="plain" @click="$emit('delete', item)">
            <v-icon size="16" color="grey">mdi-delete-outline</v-icon>
          </v-btn>
        </div>
      </template>
    </v-card>
  </div>
</template>

<script setup>
defineProps({
  title:       { type: String,  required: true },
  description: { type: String,  default: '' },
  items:       { type: Array,   default: () => [] },
  loading:     { type: Boolean, default: false },
  isTag:       { type: Boolean, default: false },
})
defineEmits(['add', 'edit', 'delete'])
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <span class="text-h6 font-weight-medium">
          {{ form.id ? 'Редактировать контакт' : 'Новый контакт' }}
        </span>
        <v-btn icon size="small" variant="plain" @click="$emit('update:modelValue', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <p class="field-label">Категория</p>
      <v-select
        v-model="form.categoryId"
        :items="categoryOptions"
        item-value="id"
        item-title="title"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
      />

      <p class="field-label">Имя и фамилия *</p>
      <v-text-field
        v-model="form.name"
        variant="outlined"
        density="compact"
        hide-details
        :error="nameError"
        class="mb-4"
      />

      <p class="field-label">Город</p>
      <v-text-field
        v-model="form.city"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
      />

      <p class="field-label">Email</p>
      <v-text-field
        v-model="form.email"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-4"
      />

      <p class="field-label">Телефон</p>
      <v-text-field
        :model-value="form.phone"
        variant="outlined"
        density="compact"
        hide-details
        placeholder="8 ___ ___ __ __"
        class="mb-6"
        @update:model-value="form.phone = formatPhone($event)"
      />

      <div class="d-flex justify-end" style="gap: 12px">
        <v-btn
          variant="outlined"
          color="grey-darken-2"
          class="text-none"
          @click="$emit('update:modelValue', false)"
        >Отмена</v-btn>
        <v-btn
          style="background-color: #037247"
          class="text-none text-white"
          @click="save"
        >Сохранить</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { formatPhone } from '@/composables/phoneFormat'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  columns:     { type: Array, default: () => [] },
  initialData: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'save'])

const nameError = ref(false)

const blankForm = (defaultCatId = null) => ({
  id:         null,
  categoryId: defaultCatId,
  name:       '',
  city:       '',
  email:      '',
  phone:      '',
})

const form = ref(blankForm())

watch(() => props.modelValue, (open) => {
  if (!open) return
  nameError.value = false
  form.value = props.initialData ? { ...props.initialData } : blankForm(props.columns[0]?.id ?? null)
})

const categoryOptions = computed(() =>
  props.columns.map(c => ({ id: c.id, title: c.title }))
)

const save = () => {
  if (!form.value.name.trim()) { nameError.value = true; return }
  emit('save', { ...form.value })
  emit('update:modelValue', false)
}
</script>

<style scoped>
.field-label {
  font-size: 12px;
  color: #616161;
  margin-bottom: 4px;
  font-weight: 500;
}
</style>

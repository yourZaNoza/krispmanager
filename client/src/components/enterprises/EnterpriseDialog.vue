<template>
  <v-dialog
    :model-value="modelValue"
    max-width="480"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card rounded="lg" class="pa-6">
      <div class="d-flex align-center justify-space-between mb-6">
        <span class="text-h6 font-weight-medium">
          {{ form.id ? 'Редактировать предприятие' : 'Новое предприятие' }}
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

      <p class="field-label">Название *</p>
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

      <p class="field-label">Адрес</p>
      <v-text-field
        v-model="form.address"
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
        class="mb-4"
        @update:model-value="form.phone = formatPhone($event)"
      />

      <p class="field-label">Контактное лицо</p>
      <v-autocomplete
        v-model="form.contact_id"
        :items="representatives"
        item-value="id"
        item-title="name"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        placeholder="Выбрать из представителей"
        no-data-text="Нет контактов в категории «Представители»"
        class="mb-6"
        @update:model-value="onContactSelect"
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
import { ref, watch, computed, onMounted } from 'vue'
import axios from 'axios'
import { formatPhone } from '@/composables/phoneFormat'

const props = defineProps({
  modelValue:  { type: Boolean, default: false },
  columns:     { type: Array, default: () => [] },
  initialData: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'save'])

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const nameError      = ref(false)
const representatives = ref([])

const blankForm = (defaultCatId = null) => ({
  id:             null,
  categoryId:     defaultCatId,
  name:           '',
  city:           '',
  address:        '',
  phone:          '',
  contact_person: '',
  contact_id:     null,
})

const form = ref(blankForm())

onMounted(async () => {
  try {
    const { data } = await api.get('/api/contacts')
    const repCat = data.find(cat =>
      cat.title.toLowerCase().includes('представител')
    )
    representatives.value = repCat ? repCat.contacts : []
  } catch (e) {
    console.error('Ошибка загрузки контактов:', e)
  }
})

watch(() => props.modelValue, (open) => {
  if (!open) return
  nameError.value = false
  if (props.initialData) {
    form.value = { ...blankForm(), ...props.initialData }
  } else {
    form.value = blankForm(props.columns[0]?.id ?? null)
  }
})

const categoryOptions = computed(() =>
  props.columns.map(c => ({ id: c.id, title: c.title }))
)

function onContactSelect(id) {
  if (!id) {
    form.value.contact_person = ''
    return
  }
  const contact = representatives.value.find(r => r.id === id)
  form.value.contact_person = contact?.name || ''
}

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

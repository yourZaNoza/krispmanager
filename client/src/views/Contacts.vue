<template>
  <v-app>
    <Sidebar v-model="sidebarOpen" />

    <v-app-bar flat border="b" height="56" class="toolbar-no-padding">
      <div class="d-flex align-center" style="padding-left: 6px; gap: 6px; height: 100%">
        <v-btn
          :icon="sidebarOpen ? 'mdi-chevron-left' : 'mdi-chevron-right'"
          variant="outlined"
          color="grey-darken-1"
          rounded="sm"
          class="toggle-btn"
          @click="sidebarOpen = !sidebarOpen"
        />
        <SearchBar style="width: 400px" />
      </div>
      <v-spacer />
    </v-app-bar>

    <v-main>
      <!-- Page header -->
      <div class="page-header d-flex align-center px-6" style="gap: 16px">
        <span style="font-size: 24px; font-weight: 700; white-space: nowrap">Контакты</span>
        <v-spacer />
        <v-badge :content="activeFilterCount" :model-value="activeFilterCount > 0" color="#037247" floating>
          <v-btn
            variant="outlined"
            :color="filterOpen || activeFilterCount > 0 ? '#037247' : 'grey-darken-2'"
            class="text-none"
            @click="filterOpen = !filterOpen"
          >
            <v-icon start size="16">mdi-filter-variant</v-icon>
            Фильтры
          </v-btn>
        </v-badge>
        <v-btn
          style="background-color: #037247"
          class="text-none text-white"
          prepend-icon="mdi-plus"
          @click="openCreate"
        >
          Добавить контакт
        </v-btn>
      </div>

      <!-- Filter panel -->
      <Transition name="filter">
        <div v-if="filterOpen" class="filter-bar px-6 py-3">
          <div class="d-flex align-center flex-wrap" style="gap: 10px">
            <v-select
              v-model="filters.catIds"
              :items="columns.map(c => ({ value: c.id, title: c.title }))"
              item-value="value"
              item-title="title"
              label="Категория"
              multiple chips closable-chips
              density="compact" variant="outlined" hide-details
              no-data-text="Нет вариантов"
              class="filter-sel"
            />
            <v-select
              v-model="filters.cities"
              :items="allCities"
              label="Город"
              multiple chips closable-chips
              density="compact" variant="outlined" hide-details
              no-data-text="Нет городов"
              class="filter-sel"
            />
            <v-btn
              v-if="activeFilterCount > 0"
              variant="text" size="small" color="grey-darken-1" class="text-none"
              @click="resetFilters"
            >
              <v-icon start size="14">mdi-close-circle-outline</v-icon>
              Сбросить
            </v-btn>
          </div>
        </div>
      </Transition>

      <!-- Columns board -->
      <div class="px-6 pb-6">
        <div class="contact-board">
          <ContactColumn
            v-for="col in filteredColumns"
            :key="col.id"
            :column="col"
            @edit="openEdit"
            @delete="onDelete"
          />
        </div>
      </div>

      <!-- Dialog -->
      <ContactDialog
        v-model="dialog"
        :columns="columns"
        :initial-data="dialogData"
        @save="onSave"
      />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import ContactColumn from '@/components/contacts/ContactColumn.vue'
import ContactDialog from '@/components/contacts/ContactDialog.vue'

const sidebarOpen = ref(true)
const columns = ref([])
const dialog = ref(false)
const dialogData = ref(null)

// ── Filters ────────────────────────────────────────────────
const filterOpen = ref(false)
const filters = reactive({ catIds: [], cities: [] })

const allCities = computed(() => {
  const s = new Set()
  for (const col of columns.value)
    for (const c of col.contacts)
      if (c.city) s.add(c.city)
  return [...s]
})

const activeFilterCount = computed(() =>
  (filters.catIds.length ? 1 : 0) + (filters.cities.length ? 1 : 0)
)

const filteredColumns = computed(() => {
  if (!activeFilterCount.value) return columns.value
  return columns.value
    .filter(col => !filters.catIds.length || filters.catIds.includes(col.id))
    .map(col => ({
      ...col,
      contacts: col.contacts.filter(c => !filters.cities.length || filters.cities.includes(c.city)),
    }))
})

const resetFilters = () => { filters.catIds = []; filters.cities = [] }

const api = axios.create({ withCredentials: true })

onMounted(async () => {
  try {
    const { data } = await api.get('/api/contacts')
    columns.value = data
  } catch (err) {
    console.error('Ошибка загрузки контактов:', err)
  }
})

const openCreate = () => {
  dialogData.value = null
  dialog.value = true
}

const openEdit = (contact) => {
  dialogData.value = { ...contact }
  dialog.value = true
}

const onSave = async (form) => {
  try {
    if (form.id) {
      const { data } = await api.put(`/api/contacts/${form.id}`, {
        categoryId: form.categoryId,
        name: form.name,
        city: form.city,
        email: form.email,
        phone: form.phone,
      })
      for (const col of columns.value) {
        const idx = col.contacts.findIndex((c) => c.id === form.id)
        if (idx < 0) continue
        if (col.id === form.categoryId) {
          col.contacts[idx] = { ...col.contacts[idx], ...data }
        } else {
          col.contacts.splice(idx, 1)
          const target = columns.value.find((c) => c.id === form.categoryId)
          if (target) target.contacts.push(data)
        }
        break
      }
    } else {
      const { data } = await api.post('/api/contacts', {
        categoryId: form.categoryId,
        name: form.name,
        city: form.city,
        email: form.email,
        phone: form.phone,
      })
      const target = columns.value.find((c) => c.id === form.categoryId)
      if (target) target.contacts.push(data)
    }
  } catch (err) {
    console.error('Ошибка сохранения контакта:', err)
    alert(err.response?.data?.message || 'Не удалось сохранить контакт')
  }
}

const onDelete = async (contact) => {
  try {
    await api.delete(`/api/contacts/${contact.id}`)
    for (const col of columns.value) {
      const idx = col.contacts.findIndex((c) => c.id === contact.id)
      if (idx >= 0) {
        col.contacts.splice(idx, 1)
        break
      }
    }
  } catch (err) {
    console.error('Ошибка удаления контакта:', err)
  }
}
</script>

<style scoped>
.filter-bar {
  border-bottom: 1px solid rgba(0,0,0,0.08);
  background: #fafafa;
}
.filter-sel { min-width: 160px; max-width: 220px; }
.filter-enter-active, .filter-leave-active { transition: opacity 0.15s, transform 0.15s; }
.filter-enter-from, .filter-leave-to { opacity: 0; transform: translateY(-6px); }
.toggle-btn {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  flex-shrink: 0;
}
.toolbar-no-padding :deep(.v-toolbar__content) {
  padding: 0 !important;
}
.page-header {
  height: 64px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.contact-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
  padding-top: 32px;
  padding-bottom: 16px;
}
</style>

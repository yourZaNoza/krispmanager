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
        <span style="font-size: 24px; font-weight: 700; white-space: nowrap">Заметки</span>
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
          Добавить заметку
        </v-btn>
      </div>

      <!-- Filter panel -->
      <Transition name="filter">
        <div v-if="filterOpen" class="filter-bar px-6 py-3">
          <div class="d-flex align-center flex-wrap" style="gap: 10px">
            <v-select
              v-model="filters.tags"
              :items="allTags"
              label="Метки"
              multiple chips closable-chips
              density="compact" variant="outlined" hide-details
              no-data-text="Нет меток"
              class="filter-sel"
            />
            <v-text-field
              v-model="filters.dateFrom"
              label="Дата с"
              type="date"
              density="compact" variant="outlined" hide-details clearable
              class="filter-date"
            />
            <v-text-field
              v-model="filters.dateTo"
              label="Дата по"
              type="date"
              density="compact" variant="outlined" hide-details clearable
              class="filter-date"
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

      <!-- Notes grid -->
      <div class="px-6 py-6">
        <div v-if="filteredNotes.length" class="notes-grid">
          <NoteCard
            v-for="note in filteredNotes"
            :key="note.id"
            :note="note"
            @open="openEdit(note)"
            @delete="askDelete(note)"
          />
        </div>
        <div v-else class="d-flex align-center justify-center" style="height: 300px">
          <div class="text-center text-grey">
            <v-icon size="48" color="grey-lighten-1">mdi-note-outline</v-icon>
            <p class="text-body-1 mt-3">Заметок пока нет</p>
            <p class="text-body-2">Нажмите «Добавить заметку» чтобы создать первую</p>
          </div>
        </div>
      </div>

      <!-- Dialog -->
      <NoteDialog
        v-model="dialog"
        :note="dialogNote"
        :current-user="currentUser"
        @save="onSave"
      />

      <!-- Delete confirmation -->
      <v-dialog v-model="deleteDialog" max-width="360">
        <v-card rounded="lg" class="pa-6">
          <p class="text-body-1 font-weight-medium mb-6 text-center">
            Удалить заметку «{{ pendingNote?.title }}»?
          </p>
          <div class="d-flex justify-center" style="gap: 12px">
            <v-btn variant="outlined" color="grey-darken-1" class="text-none" @click="deleteDialog = false">
              Отмена
            </v-btn>
            <v-btn variant="flat" color="red" class="text-none text-white" @click="confirmDelete">
              Удалить
            </v-btn>
          </div>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import Sidebar    from '@/components/Sidebar.vue'
import SearchBar  from '@/components/SearchBar.vue'
import NoteCard   from '@/components/notes/NoteCard.vue'
import NoteDialog from '@/components/notes/NoteDialog.vue'

const sidebarOpen  = ref(true)
const notes        = ref([])
const dialog       = ref(false)
const dialogNote   = ref(null)
const deleteDialog = ref(false)
const pendingNote  = ref(null)
const currentUser  = ref({ name: 'Пользователь' })

// ── Filters ────────────────────────────────────────────────
const filterOpen = ref(false)
const filters = reactive({ tags: [], dateFrom: '', dateTo: '' })

const allTags = computed(() => {
  const s = new Set()
  for (const n of notes.value)
    for (const t of (n.tags || []))
      if (t) s.add(t)
  return [...s]
})

const activeFilterCount = computed(() =>
  (filters.tags.length ? 1 : 0) + (filters.dateFrom ? 1 : 0) + (filters.dateTo ? 1 : 0)
)

const filteredNotes = computed(() => {
  if (!activeFilterCount.value) return notes.value
  return notes.value.filter(note => {
    if (filters.tags.length && !filters.tags.some(f => (note.tags || []).includes(f))) return false
    if (filters.dateFrom && note.date && note.date < filters.dateFrom) return false
    if (filters.dateTo && note.date && note.date > filters.dateTo) return false
    return true
  })
})

const resetFilters = () => { filters.tags = []; filters.dateFrom = ''; filters.dateTo = '' }

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

onMounted(async () => {
  try {
    const [notesRes, meRes] = await Promise.all([
      api.get('/api/notes'),
      api.get('/api/auth/me'),
    ])
    notes.value       = notesRes.data
    currentUser.value = meRes.data
  } catch (err) {
    console.error('Ошибка загрузки заметок:', err)
  }
})

const openCreate = () => { dialogNote.value = null; dialog.value = true }
const openEdit   = (note) => { dialogNote.value = { ...note }; dialog.value = true }

const onSave = async (form) => {
  try {
    if (form.id) {
      await api.put(`/api/notes/${form.id}`, form)
      const idx = notes.value.findIndex(n => n.id === form.id)
      if (idx >= 0) notes.value[idx] = { ...form }
    } else {
      const { data } = await api.post('/api/notes', form)
      notes.value.unshift(data)
    }
  } catch (err) {
    console.error('Ошибка сохранения заметки:', err)
    alert(err.response?.data?.message || 'Не удалось сохранить заметку')
  }
}

const askDelete = (note) => { pendingNote.value = note; deleteDialog.value = true }

const confirmDelete = async () => {
  try {
    await api.delete(`/api/notes/${pendingNote.value.id}`)
    notes.value = notes.value.filter(n => n.id !== pendingNote.value.id)
  } catch (err) {
    console.error('Ошибка удаления заметки:', err)
  } finally {
    deleteDialog.value = false
    pendingNote.value  = null
  }
}
</script>

<style scoped>
.filter-bar {
  border-bottom: 1px solid rgba(0,0,0,0.08);
  background: #fafafa;
}
.filter-sel { min-width: 160px; max-width: 220px; }
.filter-date { max-width: 170px; }
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
  border-bottom: 1px solid rgba(0,0,0,0.12);
}
.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: start;
}
@media (max-width: 900px) {
  .notes-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

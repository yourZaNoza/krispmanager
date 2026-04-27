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
        <span style="font-size: 24px; font-weight: 700; white-space: nowrap">Предприятия</span>
        <v-spacer />
        <v-btn variant="outlined" color="grey-darken-2" class="text-none">
          <v-icon start size="16">mdi-filter-variant</v-icon>
          Фильтры
        </v-btn>
        <v-btn
          style="background-color: #037247"
          class="text-none text-white"
          prepend-icon="mdi-plus"
          @click="openCreate"
        >
          Добавить предприятие
        </v-btn>
      </div>

      <!-- Columns board -->
      <div class="px-6 pb-6">
        <div class="ent-board">
          <EnterpriseColumn
            v-for="col in columns"
            :key="col.id"
            :column="col"
            @edit="openEdit"
            @delete="onDelete"
          />
        </div>
      </div>

      <!-- Dialog -->
      <EnterpriseDialog
        v-model="dialog"
        :columns="columns"
        :initial-data="dialogData"
        @save="onSave"
      />
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import EnterpriseColumn from '@/components/enterprises/EnterpriseColumn.vue'
import EnterpriseDialog from '@/components/enterprises/EnterpriseDialog.vue'

const sidebarOpen = ref(true)
const columns     = ref([])
const dialog      = ref(false)
const dialogData  = ref(null)

const api = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

onMounted(async () => {
  try {
    const { data } = await api.get('/api/enterprises')
    columns.value = data
  } catch (err) {
    console.error('Ошибка загрузки предприятий:', err)
  }
})

const openCreate = () => {
  dialogData.value = null
  dialog.value = true
}

const openEdit = (ent) => {
  dialogData.value = { ...ent }
  dialog.value = true
}

const onSave = async (form) => {
  try {
    if (form.id) {
      await api.put(`/api/enterprises/${form.id}`, {
        categoryId: form.categoryId,
        name:       form.name,
        city:       form.city,
        address:    form.address,
        phone:      form.phone,
      })
      // Move between categories if changed, otherwise update in place
      for (const col of columns.value) {
        const idx = col.enterprises.findIndex(e => e.id === form.id)
        if (idx < 0) continue
        if (col.id === form.categoryId) {
          col.enterprises[idx] = { ...col.enterprises[idx], ...form }
        } else {
          const [moved] = col.enterprises.splice(idx, 1)
          const target = columns.value.find(c => c.id === form.categoryId)
          if (target) target.enterprises.push({ ...moved, ...form, categoryId: form.categoryId })
        }
        break
      }
    } else {
      const { data } = await api.post('/api/enterprises', {
        categoryId: form.categoryId,
        name:       form.name,
        city:       form.city,
        address:    form.address,
        phone:      form.phone,
      })
      const target = columns.value.find(c => c.id === form.categoryId)
      if (target) target.enterprises.push(data)
    }
  } catch (err) {
    console.error('Ошибка сохранения предприятия:', err)
    alert(err.response?.data?.message || 'Не удалось сохранить предприятие')
  }
}

const onDelete = async (ent) => {
  try {
    await api.delete(`/api/enterprises/${ent.id}`)
    for (const col of columns.value) {
      const idx = col.enterprises.findIndex(e => e.id === ent.id)
      if (idx >= 0) { col.enterprises.splice(idx, 1); break }
    }
  } catch (err) {
    console.error('Ошибка удаления предприятия:', err)
  }
}
</script>

<style scoped>
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
.ent-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
  padding-top: 32px;
  padding-bottom: 16px;
}
</style>

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
          variant="outlined"
          color="grey-darken-2"
          class="text-none"
          prepend-icon="mdi-file-download-outline"
          @click="showExportDialog = true"
        >Выгрузить отчет</v-btn>
        <v-btn
          style="background-color: #037247"
          class="text-none text-white"
          prepend-icon="mdi-plus"
          @click="openCreate"
        >
          Добавить предприятие
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
        <div class="ent-board">
          <EnterpriseColumn
            v-for="col in filteredColumns"
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

      <!-- Export dialog -->
      <v-dialog v-model="showExportDialog" max-width="420" persistent>
        <v-card rounded="lg">
          <v-card-title class="pt-5 px-6 pb-0" style="font-size: 16px; font-weight: 600">
            Выгрузить отчет по предприятиям
          </v-card-title>
          <v-card-text class="px-6 pt-5 pb-2" style="display: flex; flex-direction: column; gap: 20px">

            <!-- Формат -->
            <div>
              <p class="text-caption text-grey-darken-1 mb-2" style="font-weight: 500; letter-spacing: 0.3px">ФОРМАТ</p>
              <v-radio-group v-model="exportFormat" density="compact" hide-details inline style="margin-top: -4px">
                <v-radio label="PDF" value="pdf" color="#037247" />
                <v-radio label="Word (DOC)" value="docx" color="#037247" style="margin-left: 12px" />
              </v-radio-group>
            </div>

            <!-- Выборка -->
            <div>
              <p class="text-caption text-grey-darken-1 mb-2" style="font-weight: 500; letter-spacing: 0.3px">ВЫБОРКА</p>
              <v-radio-group v-model="exportFilterType" density="compact" hide-details style="margin-top: -4px; margin-bottom: 14px">
                <v-radio label="По категории" value="category" color="#037247" />
                <v-radio label="По наименованию" value="name" color="#037247" style="margin-top: 4px" />
              </v-radio-group>

              <v-select
                v-if="exportFilterType === 'category'"
                v-model="exportCatId"
                :items="exportCategoryOptions"
                item-title="title"
                item-value="value"
                label="Категория"
                variant="outlined"
                density="compact"
                hide-details
              />
              <v-autocomplete
                v-if="exportFilterType === 'name'"
                v-model="exportEntId"
                :items="allEnterprisesList"
                item-title="name"
                item-value="id"
                label="Наименование"
                variant="outlined"
                density="compact"
                hide-details
                no-data-text="Нет предприятий"
              />
            </div>

          </v-card-text>
          <v-card-actions class="px-6 pb-6 pt-2" style="gap: 8px; justify-content: flex-end">
            <v-btn variant="text" class="text-none" @click="showExportDialog = false">Отмена</v-btn>
            <v-btn
              color="#037247"
              variant="flat"
              class="text-none"
              :loading="exportLoading"
              @click="generateEnterpriseReport"
            >Выгрузить</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import axios from 'axios'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'
import EnterpriseColumn from '@/components/enterprises/EnterpriseColumn.vue'
import EnterpriseDialog from '@/components/enterprises/EnterpriseDialog.vue'

const sidebarOpen = ref(true)
const columns     = ref([])
const dialog      = ref(false)
const dialogData  = ref(null)

// ── Filters ────────────────────────────────────────────────
const filterOpen = ref(false)
const filters = reactive({ catIds: [], cities: [] })

const allCities = computed(() => {
  const s = new Set()
  for (const col of columns.value)
    for (const e of col.enterprises)
      if (e.city) s.add(e.city)
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
      enterprises: col.enterprises.filter(e => !filters.cities.length || filters.cities.includes(e.city)),
    }))
})

const resetFilters = () => { filters.catIds = []; filters.cities = [] }

const api = axios.create({ withCredentials: true })

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
        categoryId:     form.categoryId,
        name:           form.name,
        city:           form.city,
        address:        form.address,
        phone:          form.phone,
        contact_person: form.contact_person,
        contact_id:     form.contact_id,
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
        categoryId:     form.categoryId,
        name:           form.name,
        city:           form.city,
        address:        form.address,
        phone:          form.phone,
        contact_person: form.contact_person,
        contact_id:     form.contact_id,
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

// ── Export ────────────────────────────────────────────────
const showExportDialog = ref(false)
const exportFormat     = ref('pdf')
const exportFilterType = ref('category')
const exportCatId      = ref('all')
const exportEntId      = ref(null)
const exportLoading    = ref(false)

const exportCategoryOptions = computed(() => [
  { value: 'all', title: 'Все категории' },
  ...columns.value.map(c => ({ value: String(c.id), title: c.title })),
])

const allEnterprisesList = computed(() => {
  const list = []
  for (const col of columns.value)
    for (const e of col.enterprises)
      list.push({ id: e.id, name: e.name })
  return list.sort((a, b) => a.name.localeCompare(b.name, 'ru'))
})

function openBlob(url) {
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtDate(d) {
  if (!d) return null
  const dt = new Date(d)
  if (isNaN(dt)) return null
  return `${String(dt.getDate()).padStart(2,'0')}.${String(dt.getMonth()+1).padStart(2,'0')}.${dt.getFullYear()}`
}

function buildEnterpriseReportHtml(enterprises) {
  const now = new Date()
  const dateStr = fmtDate(now)

  const entSections = enterprises.map(ent => {
    const infoParts = [
      ent.city           && `Город: ${escHtml(ent.city)}`,
      ent.address        && `Адрес: ${escHtml(ent.address)}`,
      ent.phone          && `Тел.: ${escHtml(ent.phone)}`,
      ent.contact_person && `Контактное лицо: ${escHtml(ent.contact_person)}`,
    ].filter(Boolean)

    const tasksHtml = ent.tasks.length
      ? ent.tasks.map(t => {
          const from = fmtDate(t.date_from)
          const to   = fmtDate(t.deadline)
          const dates = [from, to].filter(Boolean).join(' — ')

          const listsHtml = Array.isArray(t.lists) && t.lists.length
            ? t.lists.map(lst => {
                const items = Array.isArray(lst.items)
                  ? lst.items.map(i => `<span style="margin-right:10px">${i.done ? '&#9989;' : '&#9723;'} ${escHtml(i.text)}</span>`).join('')
                  : ''
                return `<div style="margin-top:4px;font-size:11px"><strong>${escHtml(lst.name || 'Список')}:</strong> ${items || '—'}</div>`
              }).join('')
            : ''

          const parts = Array.isArray(t.participants) && t.participants.length
            ? t.participants.map(p => escHtml(p.name || `#${p.id}`)).join(', ')
            : '—'

          return `<div style="margin-bottom:14px;padding:12px 14px;border:1px solid #e5e7eb;border-radius:6px;page-break-inside:avoid">
            <div style="font-weight:600;font-size:13px;margin-bottom:5px">${escHtml(t.title)}</div>
            ${dates ? `<div style="font-size:11px;color:#616161;margin-bottom:4px">Сроки: ${dates}</div>` : ''}
            ${t.description ? `<div style="font-size:12px;color:#424242;margin-bottom:5px;white-space:pre-wrap">${escHtml(t.description)}</div>` : ''}
            ${listsHtml ? `<div style="margin-bottom:5px">${listsHtml}</div>` : ''}
            <div style="font-size:11px;color:#757575;margin-bottom:3px">Комментарии: ${t.commentCount} &nbsp;&nbsp; Файлы: ${t.fileCount}</div>
            <div style="font-size:11px;color:#757575">Участники: ${parts}</div>
          </div>`
        }).join('')
      : `<p style="color:#9e9e9e;font-size:12px;font-style:italic;margin:0">Нет прикреплённых задач</p>`

    return `<div style="margin-bottom:36px;page-break-inside:avoid">
      <div style="border-left:4px solid #037247;padding-left:12px;margin-bottom:8px">
        <div style="font-size:16px;font-weight:700;color:#1a1a1a">${escHtml(ent.name)}</div>
        ${ent.catTitle ? `<div style="font-size:11px;color:#037247;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;margin-top:2px">${escHtml(ent.catTitle)}</div>` : ''}
      </div>
      ${infoParts.length ? `<div style="font-size:11px;color:#616161;margin-bottom:10px;line-height:1.8">${infoParts.join(' &nbsp;·&nbsp; ')}</div>` : ''}
      <div style="font-size:12px;font-weight:600;color:#424242;margin-bottom:8px">Задачи (${ent.tasks.length}):</div>
      ${tasksHtml}
    </div>`
  }).join('<hr style="border:none;border-top:1px solid #e5e7eb;margin:0 0 32px">')

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Отчет по предприятиям</title>
<style>
  @page{size:A4;margin:15mm 15mm 20mm}
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1a1a1a;margin:0}
  .toolbar{display:flex;justify-content:flex-end;gap:8px;padding:10px 20px;background:#f5f5f5;border-bottom:1px solid #e0e0e0;position:sticky;top:0;z-index:99}
  .btn-p{background:#037247;color:#fff;border:none;padding:7px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial}
  .btn-c{background:#fff;color:#424242;border:1px solid #d1d5db;padding:7px 18px;border-radius:6px;font-size:13px;cursor:pointer;font-family:Arial}
  .wrap{padding:24px 32px;max-width:900px;margin:0 auto}
  @media print{.toolbar{display:none!important}.wrap{padding:0;max-width:100%}}
</style></head><body>
<div class="toolbar">
  <button class="btn-c" onclick="window.close()">Закрыть</button>
  <button class="btn-p" onclick="window.print()">Сохранить как PDF</button>
</div>
<div class="wrap">
  <h1 style="font-size:20px;font-weight:700;margin:0 0 4px">Отчет по предприятиям</h1>
  <p style="color:#757575;font-size:12px;margin:0 0 28px">Дата составления: ${dateStr}</p>
  ${enterprises.length
    ? entSections
    : '<p style="color:#9e9e9e;text-align:center;padding:32px 0">Нет предприятий для выгрузки</p>'}
</div>
</body></html>`
}

async function generateEnterpriseReport() {
  if (exportFilterType.value === 'name' && !exportEntId.value) return
  exportLoading.value = true
  try {
    const params = {}
    if (exportFilterType.value === 'category') {
      if (exportCatId.value !== 'all') params.categoryId = exportCatId.value
    } else {
      params.enterpriseId = exportEntId.value
    }

    const { data: enterprises } = await api.get('/api/enterprises/report', { params })
    const html = buildEnterpriseReportHtml(enterprises)

    if (exportFormat.value === 'pdf') {
      const blob = new Blob([html], { type: 'text/html; charset=utf-8' })
      const url  = URL.createObjectURL(blob)
      openBlob(url)
    } else {
      const blob = new Blob(['﻿', html], { type: 'application/msword' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `Отчет_предприятия_${new Date().toISOString().split('T')[0]}.doc`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    }

    showExportDialog.value = false
  } catch (err) {
    console.error('generateEnterpriseReport error:', err)
  } finally {
    exportLoading.value = false
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
.ent-board {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  align-items: flex-start;
  padding-top: 32px;
  padding-bottom: 16px;
}
</style>

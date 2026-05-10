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
      <div class="page-header d-flex align-center px-6">
        <span style="font-size: 24px; font-weight: 700">Аналитика</span>
      </div>

      <div class="analytics-body px-6 py-5">

        <!-- ── Блок 1: Счётчики ── -->
        <div class="stat-cards">
          <div
            v-for="card in statCards"
            :key="card.key"
            class="stat-card"
            @click="router.push(card.path)"
          >
            <div class="stat-card__top">
              <v-icon size="20" color="grey-darken-1">{{ card.icon }}</v-icon>
              <v-icon size="18" color="grey-lighten-1" class="ml-auto">mdi-chevron-right</v-icon>
            </div>
            <div class="stat-card__label">{{ card.label }}</div>
            <div class="stat-card__count">
              <template v-if="summaryLoading">—</template>
              <template v-else>{{ summary[card.key] }}</template>
            </div>
          </div>
        </div>

        <!-- ── Блок 2: Совместные задачи + Статистика ── -->
        <div class="bottom-row">

          <!-- Левая колонка: совместные задачи -->
          <div class="shared-card">
            <p class="block-title mb-3">Совместные задачи</p>

            <div v-if="participatingLoading" class="d-flex justify-center py-6">
              <v-progress-circular indeterminate size="24" color="success" />
            </div>

            <div v-else-if="!participating.length" class="empty-state">
              Нет совместных задач
            </div>

            <div v-else class="task-list">
              <div
                v-for="task in participating"
                :key="task.id"
                class="task-item"
              >
                <div class="task-item__meta">
                  <span class="task-deadline" :style="{ color: task.catColor }">
                    {{ formatDeadline(task.deadline) }}
                  </span>
                  <v-btn
                    icon
                    size="x-small"
                    variant="plain"
                    class="task-arrow-btn"
                    @click="router.push('/tasks')"
                  >
                    <v-icon size="16" color="grey-darken-1">mdi-arrow-right</v-icon>
                  </v-btn>
                </div>
                <div class="task-item__title">{{ task.title }}</div>
                <div v-if="task.ownerName" class="task-item__owner">
                  <v-icon size="12" color="grey-lighten-1">mdi-account-outline</v-icon>
                  {{ task.ownerName }}
                </div>
              </div>
            </div>
          </div>

          <!-- Правая колонка: статистика -->
          <div class="stats-card">
            <!-- Заголовок + фильтр по году -->
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="block-title">Средний показатель нагрузки</p>
              <div class="d-flex align-center" style="gap: 8px">
                <v-btn
                  variant="outlined"
                  size="small"
                  class="text-none"
                  prepend-icon="mdi-download-outline"
                  style="font-size: 12px"
                  @click="showExportDialog = true"
                >Выгрузить отчет</v-btn>
                <v-select
                  v-model="selectedYear"
                  :items="availableYears"
                  variant="outlined"
                  density="compact"
                  hide-details
                  style="width: 140px; font-size: 13px"
                  @update:model-value="loadTaskStats"
                />
              </div>
            </div>

            <!-- Текущий % + дельта -->
            <div class="d-flex align-center" style="gap: 12px; margin-bottom: 4px">
              <span class="cur-pct">{{ statsLoading ? '—' : curPct + '%' }}</span>
              <span v-if="!statsLoading && delta !== 0" class="delta-badge" :class="delta > 0 ? 'delta--up' : 'delta--down'">
                <v-icon size="14">{{ delta > 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}</v-icon>
                {{ Math.abs(delta) }}%
              </span>
            </div>
            <p class="text-caption text-grey mb-4">Средний процент выполненных задач</p>

            <!-- Диаграмма -->
            <div class="chart-wrap" v-if="!statsLoading">
              <svg
                ref="chartSvgRef"
                :viewBox="`0 0 ${VW} ${VH}`"
                style="width: 100%; display: block; overflow: visible"
              >
                <!-- Горизонтальные сетки -->
                <g v-for="(pct, gi) in Y_TICKS" :key="'g'+gi">
                  <line
                    :x1="CL" :y1="yp(pct)"
                    :x2="CL + CW" :y2="yp(pct)"
                    :stroke="isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'"
                    stroke-dasharray="3 3"
                    stroke-width="1"
                  />
                  <text
                    :x="CL - 6" :y="yp(pct) + 4"
                    text-anchor="end"
                    font-size="10"
                    fill="#9e9e9e"
                  >{{ pct }}%</text>
                </g>

                <!-- Столбцы -->
                <g
                  v-for="(bar, i) in chartMonths"
                  :key="i"
                  style="cursor: pointer"
                  @mouseenter="hoveredBar = i"
                  @mouseleave="hoveredBar = null"
                >
                  <!-- Столбец -->
                  <rect
                    :x="bx(i)"
                    :y="yp(bar.pct)"
                    :width="BW"
                    :height="Math.max(2, yp(0) - yp(bar.pct))"
                    :fill="hoveredBar === i ? '#037247' : (isDark ? '#3a3a3a' : '#d1d5db')"
                    rx="3"
                    style="transition: fill 0.15s"
                  />

                  <!-- Подпись месяца -->
                  <text
                    :x="bx(i) + BW / 2"
                    :y="CB + 18"
                    text-anchor="middle"
                    font-size="10"
                    fill="#9e9e9e"
                  >{{ MONTHS[i] }}</text>

                  <!-- Тултип -->
                  <g v-if="hoveredBar === i && bar.total > 0">
                    <rect
                      :x="tooltipX(i)"
                      :y="yp(bar.pct) - 46"
                      width="100"
                      height="38"
                      :fill="isDark ? '#2a2a2a' : 'white'"
                      :stroke="isDark ? 'rgba(255,255,255,0.15)' : '#e0e0e0'"
                      stroke-width="1"
                      rx="6"
                    />
                    <text
                      :x="tooltipX(i) + 50"
                      :y="yp(bar.pct) - 29"
                      text-anchor="middle"
                      font-size="11"
                      font-weight="600"
                      :fill="isDark ? '#e0e0e0' : '#1a1a1a'"
                    >{{ MONTHS[i] }} {{ selectedYear }}</text>
                    <text
                      :x="tooltipX(i) + 50"
                      :y="yp(bar.pct) - 14"
                      text-anchor="middle"
                      font-size="10"
                      fill="#9e9e9e"
                    >Выполнено {{ bar.pct }}%</text>
                  </g>
                </g>
              </svg>
            </div>

            <div v-else class="d-flex justify-center py-8">
              <v-progress-circular indeterminate size="24" color="success" />
            </div>
          </div>

        </div>

        <!-- ── Блок 3: Аналитика предприятий ── -->
        <div class="ent-row">

          <!-- Таблица -->
          <div class="ent-table-card">
            <div class="d-flex align-center justify-space-between mb-4">
              <p class="block-title">Предприятия</p>
              <v-btn
                variant="outlined"
                size="small"
                class="text-none"
                prepend-icon="mdi-download-outline"
                style="font-size: 12px"
              >Выгрузить отчет</v-btn>
            </div>

            <div v-if="entLoading" class="d-flex justify-center py-8">
              <v-progress-circular indeterminate size="24" color="success" />
            </div>

            <table v-else class="ent-table">
              <thead>
                <tr>
                  <th @click="sortBy('name')">
                    Наименование
                    <v-icon size="12" class="sort-icon">{{ sortIcon('name') }}</v-icon>
                  </th>
                  <th @click="sortBy('catTitle')">
                    Вид
                    <v-icon size="12" class="sort-icon">{{ sortIcon('catTitle') }}</v-icon>
                  </th>
                  <th @click="sortBy('city')">
                    Город
                    <v-icon size="12" class="sort-icon">{{ sortIcon('city') }}</v-icon>
                  </th>
                  <th @click="sortBy('taskCount')">
                    Задачи
                    <v-icon size="12" class="sort-icon">{{ sortIcon('taskCount') }}</v-icon>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!sortedEnterprises.length">
                  <td colspan="4" class="ent-empty">Нет предприятий</td>
                </tr>
                <tr v-for="ent in sortedEnterprises" :key="ent.id">
                  <td>{{ ent.name }}</td>
                  <td>
                    <div class="d-flex align-center" style="gap: 6px">
                      <span class="cat-dot" :style="{ background: ent.catColor }" />
                      {{ ent.catTitle }}
                    </div>
                  </td>
                  <td>
                    <span v-if="ent.city" class="d-flex align-center" style="gap: 3px">
                      <v-icon size="13" color="grey-darken-1">mdi-map-marker-outline</v-icon>
                      {{ ent.city }}
                    </span>
                    <span v-else class="text-grey">—</span>
                  </td>
                  <td class="task-count-cell">{{ ent.taskCount }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Круговая диаграмма -->
          <div class="ent-chart-card">
            <p class="block-title mb-3">Предприятия</p>

            <div v-if="entLoading" class="d-flex justify-center py-8">
              <v-progress-circular indeterminate size="24" color="success" />
            </div>

            <template v-else>
              <svg viewBox="0 0 200 200" style="width: 100%; max-width: 200px; display: block; margin: 0 auto">
                <!-- Фоновое кольцо -->
                <circle :cx="PCX" :cy="PCY" :r="(PR+Pr)/2" fill="none" :stroke="isDark ? 'rgba(255,255,255,0.08)' : '#f0f0f0'" :stroke-width="PR-Pr" />

                <!-- Одна категория — полное кольцо -->
                <template v-if="pieSlices.length === 1">
                  <circle :cx="PCX" :cy="PCY" :r="(PR+Pr)/2" fill="none" :stroke="pieSlices[0].color" :stroke-width="PR-Pr" />
                </template>

                <!-- Несколько категорий — дуги -->
                <template v-else>
                  <path
                    v-for="(sl, i) in pieSlices"
                    :key="i"
                    :d="describeArc(PCX, PCY, PR, Pr, sl.startAngle, sl.endAngle)"
                    :fill="sl.color"
                  />
                </template>

                <!-- Центральный текст -->
                <text :x="PCX" :y="PCY - 5" text-anchor="middle" font-size="24" font-weight="700" :fill="isDark ? '#ffffff' : '#1a1a1a'">{{ entData.total }}</text>
                <text :x="PCX" :y="PCY + 14" text-anchor="middle" font-size="11" fill="#9e9e9e">Предприятий</text>
              </svg>

              <!-- Легенда -->
              <div class="pie-legend mt-4">
                <div v-for="cat in (entData.categories || [])" :key="cat.title" class="pie-legend-item">
                  <span class="pie-dot" :style="{ background: cat.color }" />
                  <span class="pie-label">{{ cat.title }}</span>
                </div>
              </div>
            </template>
          </div>

        </div>

      </div>
    </v-main>
    <!-- ── Export dialog ── -->
    <v-dialog v-model="showExportDialog" max-width="400" persistent>
      <v-card rounded="lg">
        <v-card-title class="pt-5 px-6 pb-0" style="font-size: 16px; font-weight: 600">
          Выгрузить отчет
        </v-card-title>
        <v-card-text class="px-6 pt-4 pb-2">
          <p class="text-caption text-grey mb-3">Выберите период</p>
          <v-radio-group v-model="exportPeriodType" density="compact" hide-details class="mb-4">
            <v-radio label="За год" value="year" color="#037247" />
            <v-radio label="За месяц" value="month" color="#037247" />
          </v-radio-group>
          <v-select
            v-if="exportPeriodType === 'month'"
            v-model="exportMonth"
            :items="MONTH_OPTIONS"
            item-title="title"
            item-value="value"
            label="Месяц"
            variant="outlined"
            density="compact"
            hide-details
          />
        </v-card-text>
        <v-card-actions class="px-6 pb-5 pt-3" style="gap: 8px; justify-content: flex-end">
          <v-btn variant="text" class="text-none" @click="showExportDialog = false">Отмена</v-btn>
          <v-btn
            color="#037247"
            variant="flat"
            class="text-none"
            :loading="exportLoading"
            @click="generateReport"
          >Выгрузить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTheme } from 'vuetify'
import axios from 'axios'
import Sidebar   from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

const router      = useRouter()
const sidebarOpen = ref(true)
const api         = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

const theme  = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

// ── SVG chart constants ──────────────────────────────────────
const VW = 500, VH = 210
const CL = 38, CT = 8, CB = 175
const CW = VW - CL - 8
const CH = CB - CT
const BS = CW / 12        // bar slot width
const BW = BS * 0.52      // bar width

const Y_TICKS  = [100, 75, 50, 25, 0]
const MONTHS   = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

function yp(pct)  { return CB - (pct / 100) * CH }
function bx(i)    { return CL + i * BS + (BS - BW) / 2 }
function tooltipX(i) {
  const cx = bx(i) + BW / 2
  return Math.min(Math.max(cx - 50, CL), CL + CW - 100)
}

// ── Stat cards ───────────────────────────────────────────────
const statCards = [
  { key: 'tasks',       label: 'Всего задач',       icon: 'mdi-clipboard-text-outline', path: '/tasks'    },
  { key: 'notes',       label: 'Всего заметок',     icon: 'mdi-note-outline',           path: '/notes'    },
  { key: 'contacts',    label: 'Всего контактов',   icon: 'mdi-account-box-outline',    path: '/contacts' },
  { key: 'enterprises', label: 'Всего предприятий', icon: 'mdi-briefcase-outline',      path: '/companies'},
]

const summary        = ref({ tasks: 0, notes: 0, contacts: 0, enterprises: 0 })
const summaryLoading = ref(true)

const participating        = ref([])
const participatingLoading = ref(true)

const selectedYear   = ref(new Date().getFullYear())
const availableYears = ref([new Date().getFullYear()])
const chartMonths    = ref(Array.from({ length: 12 }, (_, i) => ({ month: i + 1, total: 0, done: 0, pct: 0 })))
const curPct         = ref(0)
const delta          = ref(0)
const hoveredBar     = ref(null)
const statsLoading   = ref(true)

// ── Data loading ─────────────────────────────────────────────
async function loadSummary() {
  summaryLoading.value = true
  try {
    const { data } = await api.get('/api/analytics/summary')
    summary.value = data
  } catch { /* silent */ } finally {
    summaryLoading.value = false
  }
}

async function loadParticipating() {
  participatingLoading.value = true
  try {
    const { data } = await api.get('/api/analytics/participating')
    participating.value = data
  } catch { /* silent */ } finally {
    participatingLoading.value = false
  }
}

async function loadTaskStats() {
  statsLoading.value = true
  try {
    const { data } = await api.get('/api/analytics/task-stats', { params: { year: selectedYear.value } })
    chartMonths.value    = data.months
    curPct.value         = data.curPct
    delta.value          = data.delta
    if (data.years?.length) availableYears.value = data.years
  } catch { /* silent */ } finally {
    statsLoading.value = false
  }
}

// ── Enterprise analytics ─────────────────────────────────────
const PCX = 100, PCY = 100, PR = 80, Pr = 52

function describeArc(cx, cy, R, r, startAngle, endAngle) {
  const toRad = a => (a - 90) * Math.PI / 180
  const x1 = cx + R * Math.cos(toRad(startAngle))
  const y1 = cy + R * Math.sin(toRad(startAngle))
  const x2 = cx + R * Math.cos(toRad(endAngle))
  const y2 = cy + R * Math.sin(toRad(endAngle))
  const x3 = cx + r * Math.cos(toRad(endAngle))
  const y3 = cy + r * Math.sin(toRad(endAngle))
  const x4 = cx + r * Math.cos(toRad(startAngle))
  const y4 = cy + r * Math.sin(toRad(startAngle))
  const largeArc = (endAngle - startAngle) > 180 ? 1 : 0
  return `M ${x1} ${y1} A ${R} ${R} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r} ${r} 0 ${largeArc} 0 ${x4} ${y4} Z`
}

const entData     = ref({ enterprises: [], categories: [], total: 0 })
const entLoading  = ref(true)
const entSortKey  = ref('taskCount')
const entSortDir  = ref('desc')

const sortedEnterprises = computed(() => {
  const list = [...(entData.value.enterprises || [])]
  return list.sort((a, b) => {
    if (entSortKey.value === 'taskCount') {
      return entSortDir.value === 'desc' ? b.taskCount - a.taskCount : a.taskCount - b.taskCount
    }
    const va = (a[entSortKey.value] || '').toString().toLowerCase()
    const vb = (b[entSortKey.value] || '').toString().toLowerCase()
    const cmp = va.localeCompare(vb, 'ru')
    return entSortDir.value === 'asc' ? cmp : -cmp
  })
})

const pieSlices = computed(() => {
  const cats  = entData.value?.categories || []
  const total = entData.value?.total || 0
  if (!total || !cats.length) return []
  let angle = 0
  return cats.map(cat => {
    const sweep = (cat.count / total) * 360
    const sl = { ...cat, startAngle: angle, endAngle: angle + sweep - 0.001 }
    angle += sweep
    return sl
  })
})

function sortBy(key) {
  if (entSortKey.value === key) {
    entSortDir.value = entSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    entSortKey.value = key
    entSortDir.value = key === 'taskCount' ? 'desc' : 'asc'
  }
}

function sortIcon(key) {
  if (entSortKey.value !== key) return 'mdi-unfold-more-horizontal'
  return entSortDir.value === 'asc' ? 'mdi-chevron-up' : 'mdi-chevron-down'
}

async function loadEnterprises() {
  entLoading.value = true
  try {
    const { data } = await api.get('/api/analytics/enterprises')
    entData.value = data
  } catch { /* silent */ } finally {
    entLoading.value = false
  }
}

// ── Export / PDF ─────────────────────────────────────────────
const chartSvgRef      = ref(null)
const showExportDialog = ref(false)
const exportPeriodType = ref('year')
const exportMonth      = ref(new Date().getMonth() + 1)
const exportLoading    = ref(false)

const MONTHS_FULL = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const MONTH_OPTIONS = MONTHS_FULL.map((title, i) => ({ value: i + 1, title }))

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function fmtList(lst) {
  if (!lst || typeof lst !== 'object') return String(lst)
  const done  = Array.isArray(lst.items) ? lst.items.filter(i => i.done).length : 0
  const total = Array.isArray(lst.items) ? lst.items.length : 0
  return `${lst.name || 'Список'} (${done}/${total})`
}

function buildReportHtml(reportData, svgString) {
  const { period, months } = reportData
  const nonEmpty = months.filter(m => m.total > 0)
  const avgPct   = nonEmpty.length
    ? Math.round(nonEmpty.reduce((s, m) => s + m.pct, 0) / nonEmpty.length)
    : 0

  const TH = (w, txt) =>
    `<th style="text-align:left;padding:6px 10px;background:#f5f5f5;color:#757575;font-weight:500;border-bottom:1px solid #e0e0e0;width:${w}">${txt}</th>`

  const monthsHtml = months.map(m => {
    if (!m.total) return ''
    const rows = m.tasks.map(t => {
      const lists = Array.isArray(t.lists) && t.lists.length
        ? t.lists.map(fmtList).join('; ') : '—'
      const parts = Array.isArray(t.participants) && t.participants.length
        ? t.participants.map(p => p.name || p.email || `#${p.id}`).join(', ') : '—'
      return `<tr>
        <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top">${escHtml(t.title)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top">${escHtml(t.description || '—')}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top">${escHtml(lists)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top">${escHtml(parts)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top">${escHtml(t.enterprise || '—')}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;vertical-align:top;white-space:nowrap">${escHtml(t.deadline)}</td>
        <td style="padding:7px 10px;border-bottom:1px solid #f0f0f0;text-align:center;font-weight:700;color:#037247">${t.contribution}%</td>
      </tr>`
    }).join('')
    return `<div style="margin-bottom:28px;page-break-inside:avoid">
      <div style="font-size:13px;font-weight:600;color:#424242;margin-bottom:8px;padding-top:10px;border-top:1px solid #e5e7eb">
        ${escHtml(m.monthName)} &mdash; выполнено ${m.pct}% (${m.done} из ${m.total})
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr>
          ${TH('18%','Задача')}${TH('20%','Описание')}${TH('14%','Списки')}
          ${TH('14%','Участники')}${TH('14%','Предприятие')}${TH('12%','Срок')}${TH('8%','%')}
        </tr></thead>
        <tbody>${rows || `<tr><td colspan="7" style="text-align:center;padding:14px;color:#9e9e9e">Нет задач</td></tr>`}</tbody>
      </table>
    </div>`
  }).join('')

  return `<!DOCTYPE html><html lang="ru"><head>
<meta charset="UTF-8"><title>Отчет &mdash; ${escHtml(period)}</title>
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
  <h1 style="font-size:20px;font-weight:700;margin:0 0 4px">Отчет по выполнению задач</h1>
  <p style="color:#757575;font-size:12px;margin:0 0 24px">Период: ${escHtml(period)}</p>

  <div style="margin-bottom:24px">
    <div style="font-size:14px;font-weight:600;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e5e7eb">Средний показатель нагрузки</div>
    <div style="font-size:30px;font-weight:700;margin-bottom:2px">${avgPct}%</div>
    <p style="font-size:11px;color:#757575;margin:0 0 14px">Средний процент выполненных задач</p>
    <div style="width:100%">${svgString}</div>
  </div>

  <div>
    <div style="font-size:14px;font-weight:600;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #e5e7eb">Задачи</div>
    ${monthsHtml || '<p style="color:#9e9e9e;text-align:center;padding:24px 0">Нет задач за выбранный период</p>'}
  </div>
</div>
</body></html>`
}

async function generateReport() {
  exportLoading.value = true
  try {
    const params = { year: selectedYear.value }
    if (exportPeriodType.value === 'month') params.month = exportMonth.value

    const { data: reportData } = await api.get('/api/analytics/task-report', { params })

    const svgEl = chartSvgRef.value
    const svgString = svgEl
      ? new XMLSerializer().serializeToString(svgEl).replace(/style="[^"]*"/, (m) =>
          m.replace('overflow: visible', 'overflow: visible; width: 100%; height: auto'))
      : ''

    const win = window.open('', '_blank', 'width=960,height=720,scrollbars=yes')
    if (win) {
      win.document.write(buildReportHtml(reportData, svgString))
      win.document.close()
    }
    showExportDialog.value = false
  } catch (err) {
    console.error('generateReport error:', err)
  } finally {
    exportLoading.value = false
  }
}

onMounted(() => {
  loadSummary()
  loadParticipating()
  loadTaskStats()
  loadEnterprises()
})

// ── Helpers ──────────────────────────────────────────────────
const SHORT_MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']

function formatDeadline(dateStr) {
  if (!dateStr) return 'Без срока'
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d)) return '—'
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
</script>

<style scoped>
.page-header {
  height: 56px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.toggle-btn {
  width: 36px !important; height: 36px !important; min-width: 36px !important; flex-shrink: 0;
}
.toolbar-no-padding :deep(.v-toolbar__content) { padding: 0 !important; }

.analytics-body { display: flex; flex-direction: column; gap: 20px; }

/* ── Stat cards ── */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 18px 18px;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.stat-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.09); }
.stat-card__top { display: flex; align-items: center; margin-bottom: 10px; }
.stat-card__label { font-size: 13px; color: #757575; margin-bottom: 4px; }
.stat-card__count { font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1; }

/* ── Bottom row ── */
.bottom-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 14px;
  align-items: start;
}

/* ── Shared tasks card ── */
.shared-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 20px 16px;
  min-height: 300px;
}
.task-list {
  max-height: 380px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.task-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.task-item:last-child { border-bottom: none; }
.task-item__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.task-deadline {
  font-size: 11px;
  font-weight: 600;
}
.task-arrow-btn {
  flex-shrink: 0;
  margin-right: -6px;
}
.task-item__title {
  font-size: 13px;
  font-weight: 500;
  color: #1a1a1a;
  line-height: 1.45;
  margin-bottom: 4px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.task-item__owner {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #9e9e9e;
}

/* ── Stats card ── */
.stats-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 22px;
}
.block-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}
.cur-pct {
  font-size: 36px;
  font-weight: 700;
  color: #1a1a1a;
  line-height: 1;
}
.delta-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 20px;
}
.delta--up   { background: #e8f5e9; color: #2e7d32; }
.delta--down { background: #ffebee; color: #c62828; }

.chart-wrap { width: 100%; }
.empty-state {
  text-align: center;
  padding: 32px 0;
  font-size: 13px;
  color: #9e9e9e;
}

/* ── Enterprise row ── */
.ent-row {
  display: grid;
  grid-template-columns: 1fr 230px;
  gap: 14px;
  align-items: start;
}
.ent-table-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px 22px;
}
.ent-chart-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

/* Table */
.ent-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.ent-table thead th {
  text-align: left;
  padding: 10px 16px;
  font-size: 12px;
  color: #757575;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}
.ent-table thead th:first-child { padding-left: 0; }
.ent-table thead th:last-child  { text-align: right; padding-right: 0; }
.ent-table thead th:hover { color: #1a1a1a; }
.ent-table tbody tr { border-bottom: 1px solid #f0f0f0; }
.ent-table tbody tr:last-child { border-bottom: none; }
.ent-table tbody td { padding: 14px 16px; color: #1a1a1a; vertical-align: middle; }
.ent-table tbody td:first-child { padding-left: 0; }
.ent-table tbody td:last-child  { text-align: right; padding-right: 0; }
.task-count-cell { font-weight: 600; }
.ent-empty { text-align: center; padding: 40px; color: #9e9e9e; }
.sort-icon { opacity: 0.5; margin-left: 3px; vertical-align: middle; }
.cat-dot {
  width: 8px; height: 8px; border-radius: 50%;
  flex-shrink: 0; display: inline-block;
}

/* Pie legend */
.pie-legend { display: flex; flex-direction: column; gap: 8px; }
.pie-legend-item { display: flex; align-items: center; gap: 8px; }
.pie-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
.pie-label { font-size: 13px; color: #424242; }
</style>

<style>
.v-theme--dark .page-header { border-bottom-color: rgba(255, 255, 255, 0.08); }
.v-theme--dark .stat-card,
.v-theme--dark .shared-card,
.v-theme--dark .stats-card,
.v-theme--dark .ent-table-card,
.v-theme--dark .ent-chart-card { background: #1e1e1e; border-color: rgba(255, 255, 255, 0.1); }
.v-theme--dark .stat-card__count,
.v-theme--dark .task-item__title,
.v-theme--dark .block-title,
.v-theme--dark .cur-pct { color: #fff; }
.v-theme--dark .stat-card__label { color: #9e9e9e; }
.v-theme--dark .task-item__owner { color: #757575; }
.v-theme--dark .task-item { border-color: rgba(255, 255, 255, 0.06); }
.v-theme--dark .ent-table tbody td { color: #e0e0e0; }
.v-theme--dark .ent-table tbody tr { border-color: rgba(255, 255, 255, 0.06); }
.v-theme--dark .ent-table thead th { border-color: rgba(255, 255, 255, 0.1); color: #9e9e9e; }
.v-theme--dark .ent-table thead th:hover { color: #ffffff; }
.v-theme--dark .pie-label { color: #bdbdbd; }
.v-theme--dark .delta--up   { background: rgba(46, 125, 50, 0.2); color: #81c784; }
.v-theme--dark .delta--down { background: rgba(198, 40, 40, 0.2); color: #e57373; }
</style>

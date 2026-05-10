<template>
  <div class="mc" @click.stop>
    <!-- Header -->
    <div class="mc__header">
      <button class="mc__title" @click.stop="showMonths = !showMonths">
        {{ MONTHS[viewMonth] }} {{ viewYear }}
        <svg class="mc__chevron" :class="{ open: showMonths }" width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="mc__nav">
        <button class="mc__nav-btn" @click.stop="step(-1)" title="Предыдущий месяц">↑</button>
        <button class="mc__nav-btn" @click.stop="step(1)"  title="Следующий месяц">↓</button>
      </div>
    </div>

    <!-- Month picker overlay -->
    <div v-if="showMonths" class="mc__months">
      <button
        v-for="(m, i) in MONTHS"
        :key="i"
        class="mc__month"
        :class="{ cur: i === viewMonth }"
        @click.stop="pickMonth(i)"
      >{{ m }}</button>
    </div>

    <template v-else>
      <!-- Day-of-week headers -->
      <div class="mc__dow">
        <span v-for="d in DOW" :key="d">{{ d }}</span>
      </div>

      <!-- Day grid -->
      <div class="mc__grid">
        <button
          v-for="cell in cells"
          :key="cell.k"
          class="mc__cell"
          :class="{
            out: cell.out,
            td:  cell.isTd && !cell.isSel,
            sel: cell.isSel,
          }"
          @click.stop="pick(cell)"
        >{{ cell.d }}</button>
      </div>

      <!-- Footer -->
      <div class="mc__foot">
        <button class="mc__foot-btn" @click.stop="$emit('update:modelValue', null)">Удалить</button>
        <button class="mc__foot-btn mc__foot-today" @click.stop="pickToday">Сегодня</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({ modelValue: { default: null } })
const emit  = defineEmits(['update:modelValue'])

const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь']
const DOW    = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']

function today0() { const d = new Date(); d.setHours(0,0,0,0); return d }

const viewYear   = ref(today0().getFullYear())
const viewMonth  = ref(today0().getMonth())
const showMonths = ref(false)

watch(() => props.modelValue, (v) => {
  const d = v instanceof Date ? v : (v ? new Date(v) : null)
  if (d && !isNaN(d)) {
    viewYear.value  = d.getFullYear()
    viewMonth.value = d.getMonth()
  } else {
    const t = today0()
    viewYear.value  = t.getFullYear()
    viewMonth.value = t.getMonth()
  }
}, { immediate: true })

function step(dir) {
  viewMonth.value += dir
  if (viewMonth.value > 11) { viewMonth.value = 0;  viewYear.value++ }
  if (viewMonth.value < 0)  { viewMonth.value = 11; viewYear.value-- }
}

function pickMonth(i) { viewMonth.value = i; showMonths.value = false }

const cells = computed(() => {
  const y = viewYear.value
  const m = viewMonth.value
  const tod = today0()
  const sel = (() => {
    const v = props.modelValue
    const d = v instanceof Date ? v : (v ? new Date(v) : null)
    return d && !isNaN(d) ? d : null
  })()

  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7
  const dimCur   = new Date(y, m + 1, 0).getDate()
  const dimPrev  = new Date(y, m, 0).getDate()

  const res = []
  for (let i = firstDow - 1; i >= 0; i--)
    res.push(mk(new Date(y, m - 1, dimPrev - i), true, tod, sel))
  for (let d = 1; d <= dimCur; d++)
    res.push(mk(new Date(y, m, d), false, tod, sel))
  const tail = (7 - (res.length % 7)) % 7
  for (let d = 1; d <= tail; d++)
    res.push(mk(new Date(y, m + 1, d), true, tod, sel))
  return res
})

function mk(dt, out, tod, sel) {
  return {
    k:    dt.toISOString(),
    d:    dt.getDate(),
    out,
    isTd: dt.getTime() === tod.getTime(),
    isSel: sel ? dt.toDateString() === sel.toDateString() : false,
    dt,
  }
}

function pick(cell)  { emit('update:modelValue', new Date(cell.dt)) }
function pickToday() {
  const t = today0()
  viewYear.value  = t.getFullYear()
  viewMonth.value = t.getMonth()
  emit('update:modelValue', t)
}
</script>

<style scoped>
.mc {
  width: 248px;
  padding: 12px 14px 10px;
  background: #fff;
  font-size: 13px;
  user-select: none;
}

/* Header */
.mc__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.mc__title {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  font-size: 13px;
  color: #1a1a1a;
  cursor: pointer;
  background: none;
  border: none;
  padding: 3px 5px;
  border-radius: 4px;
  font-family: inherit;
  line-height: 1.4;
}
.mc__title:hover { background: #f5f5f5; }
.mc__chevron { flex-shrink: 0; color: #616161; transition: transform 0.15s; }
.mc__chevron.open { transform: rotate(180deg); }
.mc__nav { display: flex; gap: 2px; }
.mc__nav-btn {
  border: none;
  background: none;
  cursor: pointer;
  color: #9e9e9e;
  font-size: 14px;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}
.mc__nav-btn:hover { background: #f0f0f0; color: #424242; }

/* Month grid */
.mc__months {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
  padding: 2px 0 6px;
}
.mc__month {
  text-align: center;
  padding: 7px 2px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  color: #424242;
  background: none;
  border: none;
  font-family: inherit;
  line-height: 1.3;
}
.mc__month:hover { background: #f0f0f0; }
.mc__month.cur { background: #037247; color: #fff; font-weight: 600; }

/* Day-of-week headers */
.mc__dow {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
}
.mc__dow span {
  text-align: center;
  font-size: 11px;
  color: #9e9e9e;
  padding: 2px 0;
}

/* Day cells */
.mc__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.mc__cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  font-size: 12px;
  color: #1a1a1a;
  cursor: pointer;
  border: none;
  background: none;
  border-radius: 4px;
  font-family: inherit;
  line-height: 1;
  padding: 0;
}
.mc__cell:hover:not(.sel) { background: #f0f0f0; }
.mc__cell.out { color: #c0c0c0; }
.mc__cell.out:hover { background: #fafafa; }
.mc__cell.td { color: #037247; font-weight: 700; }
.mc__cell.sel {
  background: #1565c0;
  color: #fff;
  font-weight: 600;
  border-radius: 4px;
}
.mc__cell.sel:hover { background: #0d47a1; }

/* Footer */
.mc__foot {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
.mc__foot-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #9e9e9e;
  padding: 3px 4px;
  border-radius: 4px;
  font-family: inherit;
}
.mc__foot-btn:hover { color: #424242; background: #f5f5f5; }
.mc__foot-today { color: #1565c0; }
.mc__foot-today:hover { color: #0d47a1; background: #e8f0fe; }
</style>

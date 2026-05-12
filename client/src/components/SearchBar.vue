<template>
  <div class="search-wrapper" ref="wrapperRef">
    <v-text-field
      v-model="query"
      placeholder="Поиск"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      hide-details
      rounded="lg"
      autocomplete="off"
      style="width: 100%;"
      @input="onInput"
      @focus="onFocus"
      @keydown.escape="close"
      @keydown.down.prevent="moveDown"
      @keydown.up.prevent="moveUp"
      @keydown.enter.prevent="selectHighlighted"
    />

    <Teleport to="body">
      <div
        v-if="showDropdown"
        class="search-dropdown"
        :style="dropdownStyle"
      >
        <!-- Loading -->
        <div v-if="loading" class="search-state">
          <v-progress-circular indeterminate size="18" width="2" color="grey-darken-1" />
        </div>

        <!-- Empty -->
        <div v-else-if="!results.length" class="search-state search-state--empty">
          Ничего не найдено
        </div>

        <!-- Results -->
        <template v-else>
          <div
            v-for="(item, i) in results"
            :key="i"
            class="search-item"
            :class="{ 'search-item--active': i === highlighted }"
            @mousedown.prevent="navigate(item)"
            @mouseenter="highlighted = i"
          >
            <span class="search-item-section">{{ item.section }}</span>
            <span class="search-item-sep">|</span>
            <span class="search-item-label">{{ item.label }}</span>
          </div>
        </template>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const query        = ref('')
const results      = ref([])
const loading      = ref(false)
const showDropdown = ref(false)
const highlighted  = ref(-1)
const wrapperRef   = ref(null)

// Position of the dropdown — updated whenever it opens or window resizes
const anchorRect = ref({ left: 0, top: 0, width: 0 })

function updateAnchor() {
  if (!wrapperRef.value) return
  const r = wrapperRef.value.getBoundingClientRect()
  anchorRect.value = { left: r.left, top: r.bottom + 6, width: r.width }
}

const dropdownStyle = computed(() => ({
  position: 'fixed',
  left:     anchorRect.value.left + 'px',
  top:      anchorRect.value.top  + 'px',
  width:    anchorRect.value.width + 'px',
  zIndex:   99999,
}))

const router = useRouter()
const api    = axios.create({ baseURL: 'http://localhost:3000', withCredentials: true })

let debounceTimer = null

function onInput() {
  clearTimeout(debounceTimer)
  const q = query.value.trim()
  if (!q) { close(); return }
  updateAnchor()
  showDropdown.value = true
  loading.value      = true
  debounceTimer = setTimeout(doSearch, 500)
}

function onFocus() {
  if (query.value.trim() && results.value.length) {
    updateAnchor()
    showDropdown.value = true
  }
}

async function doSearch() {
  try {
    const { data } = await api.get('/api/search', { params: { q: query.value.trim() } })
    results.value    = data
    highlighted.value = -1
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function navigate(item) {
  router.push(item.path)
  close()
}

function close() {
  showDropdown.value = false
  highlighted.value  = -1
}

function moveDown() {
  if (!showDropdown.value || !results.value.length) return
  highlighted.value = Math.min(highlighted.value + 1, results.value.length - 1)
}

function moveUp() {
  highlighted.value = Math.max(highlighted.value - 1, -1)
}

function selectHighlighted() {
  const item = results.value[highlighted.value]
  if (item) navigate(item)
}

function onOutsideClick(e) {
  if (wrapperRef.value && !wrapperRef.value.contains(e.target)) close()
}

onMounted(() => {
  document.addEventListener('mousedown', onOutsideClick)
  window.addEventListener('resize', updateAnchor)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onOutsideClick)
  window.removeEventListener('resize', updateAnchor)
})
</script>

<style scoped>
.search-wrapper {
  position: relative;
  max-width: 400px;
  width: 100%;
}

.search-wrapper :deep(.v-field__overlay) {
  background-color: transparent !important;
  opacity: 0 !important;
}
.search-wrapper :deep(.v-field) {
  background-color: transparent !important;
}

/* Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12);
  z-index: 9999;
  overflow: hidden;
  max-height: 360px;
  overflow-y: auto;
}

.search-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.search-state--empty {
  font-size: 13px;
  color: #9e9e9e;
}

.search-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.search-item:last-child { border-bottom: none; }
.search-item:hover,
.search-item--active { background: #f5f5f5; }

.search-item-section {
  font-size: 11px;
  font-weight: 600;
  color: #037247;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}

.search-item-sep {
  font-size: 12px;
  color: #bdbdbd;
  flex-shrink: 0;
}

.search-item-label {
  font-size: 13px;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dropdown always light — regardless of app theme */
.search-dropdown {
  background: #ffffff !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12) !important;
}
.search-item { border-color: rgba(0, 0, 0, 0.05) !important; }
.search-item:hover,
.search-item--active { background: #f5f5f5 !important; }
.search-item-label { color: #1a1a1a !important; }
.search-state--empty { color: #9e9e9e !important; }
</style>

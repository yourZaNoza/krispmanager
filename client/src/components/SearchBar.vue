<template>
  <div class="search-wrapper">
    <v-text-field
      v-model="query"
      placeholder="Поиск"
      prepend-inner-icon="mdi-magnify"
      variant="outlined"
      density="compact"
      hide-details
      rounded="lg"
      style="width: 100%;"
      @keyup.enter="search"
      @click:prepend-inner="search"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const query = ref('')
const router = useRouter()

const search = () => {
  if (query.value.trim()) {
    router.push({ path: '/search', query: { q: query.value.trim() } })
  }
}
</script>

<style scoped>
.search-wrapper {
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
</style>

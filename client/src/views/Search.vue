<template>
  <v-app>
    <Sidebar />

    <v-app-bar flat border="b" height="56">
      <v-spacer />
      <SearchBar style="width: 400px" />
      <v-spacer />
    </v-app-bar>

    <v-main>
      <div class="pa-6">
        <p class="text-h6 mb-4">
          Результаты поиска<span v-if="q">: «{{ q }}»</span>
        </p>
        <v-divider class="mb-6" />
        <p class="text-grey text-body-2">Нет результатов</p>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

const route = useRoute()
const q = computed(() => route.query.q || '')
</script>

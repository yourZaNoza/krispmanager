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
      <div class="norole-wrap">
        <div class="norole-card">
          <div class="norole-icon-wrap">
            <v-icon size="32" color="white">mdi-account-clock-outline</v-icon>
          </div>
          <h1 class="norole-title">Добро пожаловать, {{ userName }}!</h1>
          <p class="norole-text">У вас ещё нет роли. Обратитесь к вашему администратору.</p>
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar   from '@/components/Sidebar.vue'
import SearchBar from '@/components/SearchBar.vue'

const sidebarOpen = ref(true)
const userName    = ref('')

onMounted(() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    userName.value = user.name || ''
  } catch {
    userName.value = ''
  }
})
</script>

<style scoped>
.norole-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 56px);
  padding: 40px 24px;
}

.norole-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  padding: 52px 56px 48px;
  max-width: 480px;
  width: 100%;
}

.norole-icon-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #037247;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 28px;
  flex-shrink: 0;
}

.norole-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 14px;
  line-height: 1.3;
}

.norole-text {
  font-size: 15px;
  color: #757575;
  margin: 0;
  line-height: 1.6;
}

/* Dark theme */
:global(.v-theme--dark) .norole-card {
  background: #1e1e1e;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
}
:global(.v-theme--dark) .norole-title { color: #ffffff; }
</style>

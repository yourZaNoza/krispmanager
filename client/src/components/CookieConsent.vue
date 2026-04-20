<template>
  <v-dialog
    v-model="dialog"
    max-width="540"
    persistent
    :scrim="false"
    location="bottom end"
    class="cookie-dialog"
  >
    <v-card rounded="lg" elevation="6" class="pa-1">
      <v-card-text class="pt-5 pb-3 px-5">
        <!-- Заголовок -->
        <div class="d-flex align-center mb-3" style="gap: 10px">
          <v-icon color="#0C693B" size="22">mdi-cookie-outline</v-icon>
          <span class="text-body-1 font-weight-semibold" style="color: #1a1a1a">
            Использование файлов cookie
          </span>
        </div>

        <!-- Текст -->
        <p class="text-body-2" style="color: #424242; line-height: 1.65">
          ООО «Крис» обрабатывает файлы cookie. Они помогают нам делать этот сайт удобнее для
          пользователей. Продолжая работу с сайтом
          <a href="https://krispmanager.ru" target="_blank" class="cookie-link">
            https://krispmanager.ru </a
          >, вы соглашаетесь с обработкой файлов cookie вашего браузера.
        </p>
        <p class="text-body-2 mt-3" style="color: #424242; line-height: 1.65">
          Вы можете запретить обработку некоторых типов файлов cookie в настройках вашего браузера
          либо на странице
          <a href="#" class="cookie-link">«Уведомление об использовании файлов cookie»</a>.
        </p>
      </v-card-text>

      <v-card-actions class="px-5 pb-5 pt-1 d-flex flex-column flex-sm-row" style="gap: 10px">
        <!-- Принять все -->
        <v-btn
          @click="acceptAll"
          flat
          style="background-color: #0c693b; color: #ffffff"
          class="cookie-btn flex-grow-1 text-none"
          rounded="lg"
          height="42"
        >
          Принять все cookie
        </v-btn>

        <!-- Принять только необходимые -->
        <v-btn
          @click="acceptNecessary"
          variant="outlined"
          color="#0C693B"
          class="cookie-btn flex-grow-1 text-none"
          rounded="lg"
          height="42"
        >
          Принять только необходимые
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const dialog = ref(false)

onMounted(() => {
  // Показываем диалог только если пользователь ещё не давал согласие
  const consent = localStorage.getItem('cookie_consent')
  if (!consent) {
    dialog.value = true
  }
})

function acceptAll() {
  localStorage.setItem('cookie_consent', 'all')
  dialog.value = false
}

function acceptNecessary() {
  localStorage.setItem('cookie_consent', 'necessary')
  dialog.value = false
}
</script>

<style scoped>
.cookie-dialog {
  align-items: flex-end;
  justify-content: flex-end;
}

.cookie-link {
  color: #0c693b;
  text-decoration: none;
  font-weight: 500;
}

.cookie-link:hover {
  text-decoration: underline;
}

.cookie-btn {
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0;
}
</style>

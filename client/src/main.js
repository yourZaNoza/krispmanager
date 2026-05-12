import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary:    '#2e7d32',
          secondary:  '#66bb6a',
          success:    '#43a047',
          background: '#ffffff',
          surface:    '#ffffff',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary:    '#66bb6a',
          secondary:  '#2e7d32',
          success:    '#66bb6a',
          background: '#121212',
          surface:    '#1e1e1e',
        },
      },
    },
  },
})

// Применяем сохранённую тему ДО монтирования — компоненты сразу видят нужную тему
const saved = localStorage.getItem('theme')
if (saved === 'dark') {
  vuetify.theme.global.name.value = 'dark'
}

const app = createApp(App)
app.use(router)
app.use(vuetify)
app.mount('#app')

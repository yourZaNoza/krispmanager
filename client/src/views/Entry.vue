<!-- src/App.vue -->
<template>
  <v-app class="landing-page">
    <v-main>
      <div class="d-flex flex-column align-center justify-center min-vh-100 spacing-30">
        <div class="logo-container mb-4">
          <img alt="Vue logo" class="logo" src="@/assets/logo.svg" width="245" height="125" />
        </div>

        <h2 class="text-h5 mb-8 text-center">KrispManager</h2>

        <div class="d-flex gap-4">
          <v-btn color="#C7FFBA" variant="flat" size="large" @click="registrationDialog = true">
            Регистрация
          </v-btn>

          <v-btn color="#C7FFBA" variant="flat" size="large" @click="loginDialog = true">
            Авторизация
          </v-btn>
        </div>
      </div>

      <v-dialog v-model="registrationDialog" max-width="500">
        <v-card class="dialog-left-spacing">
          <v-card-title class="text-h5 font-weight-bold mb-4"> Регистрация </v-card-title>

          <v-card-text>
            <v-form ref="registrationForm" v-model="registrationValid" lazy-validation>
              <!-- Поле Имя -->
              <v-text-field
                v-model="registrationData.name"
                :counter="50"
                :rules="nameRules"
                placeholder="Имя"
                required
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                type="name"
                class="field-no-margin"
              ></v-text-field>

              <!-- Поле E-mail-->
              <v-text-field
                v-model="registrationData.email"
                :rules="emailRules"
                placeholder="E-mail"
                required
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                type="email"
                class="field-with-margin"
              ></v-text-field>

              <!-- Поле Пароль-->
              <v-text-field
                v-model="registrationData.password"
                :rules="passwordRules"
                placeholder="Пароль"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                required
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                class="field-with-margin"
              ></v-text-field>

              <!-- Поле Подтверждение пароля-->
              <v-text-field
                v-model="registrationData.confirmPassword"
                :rules="confirmPasswordRules"
                placeholder="Подтверждение пароля"
                :type="showConfirmPassword ? 'text' : 'password'"
                :append-inner-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showConfirmPassword = !showConfirmPassword"
                required
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                class="field-no-margin"
              ></v-text-field>

              <!-- Чекбоксы согласий -->
              <v-checkbox
                v-model="registrationData.privacyPolicy"
                :rules="[(v) => !!v || 'Необходимо согласие']"
                color="success"
                class="mb-3"
                hide-details="auto"
              >
                <template v-slot:label>
                  <span>
                    Я согласен с
                    <a
                      href="/user-agreement"
                      target="_blank"
                      class="text-success text-decoration-underline"
                      @click.prevent="openUserAgreement"
                    >
                      пользовательским соглашением
                    </a>
                  </span>
                </template>
              </v-checkbox>

              <v-checkbox
                v-model="registrationData.personalData"
                :rules="[(v) => !!v || 'Необходимо согласие']"
                color="success"
                class="mb-6"
                hide-details="auto"
              >
                <template v-slot:label>
                  <span>
                    Я согласен с
                    <a
                      href="/personal-data-policy"
                      target="_blank"
                      class="text-success text-decoration-underline"
                      @click.prevent="openPersonalDataPolicy"
                    >
                      политикой персональных данных
                    </a>
                  </span>
                </template>
              </v-checkbox>
            </v-form>
          </v-card-text>

          <!-- Кнопки -->
          <v-card-actions class="d-flex justify-start px-6 pb-6">
            <v-btn
              color="success"
              variant="flat"
              class="text-none mr-3"
              :disabled="!registrationValid"
              @click="register"
            >
              ПОДТВЕРДИТЬ
            </v-btn>

            <v-btn color="success" variant="outlined" class="text-none" @click="closeRegistration">
              ЗАКРЫТЬ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="loginDialog" max-width="500">
        <v-card class="dialog-left-spacing">
          <v-card-title class="text-h5 font-weight-bold mb-4"> Авторизация </v-card-title>

          <v-card-text>
            <v-form ref="loginForm" v-model="loginValid">
              <!-- Поле E-mail-->
              <v-text-field
                v-model="loginData.email"
                :rules="emailRules"
                placeholder="E-mail"
                required
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                type="email"
                class="field-with-margin"
              ></v-text-field>

              <!-- Поле Пароль-->
              <v-text-field
                v-model="loginData.password"
                :rules="passwordRules"
                placeholder="Пароль"
                :type="showPassword ? 'text' : 'password'"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                required
                variant="outlined"
                hide-details="auto"
                density="comfortable"
                class="field-with-margin"
              ></v-text-field>

              <v-checkbox
                v-model="loginData.remember"
                hide-details="auto"
                color="success"
                label="Запомнить меня"
              ></v-checkbox>
              <v-checkbox
                v-model="loginData.privacyPolicy"
                :rules="[(v) => !!v || 'Необходимо согласие']"
                color="success"
                class="mb-3"
                hide-details="auto"
              >
                <template v-slot:label>
                  <span>
                    Я ознакомлен с
                    <a
                      href="/user-agreement"
                      target="_blank"
                      class="text-success text-decoration-underline"
                      @click.prevent="openUserAgreement"
                    >
                      пользовательским соглашением
                    </a>
                  </span>
                </template>
              </v-checkbox>

              <v-checkbox
                v-model="loginData.personalData"
                :rules="[(v) => !!v || 'Необходимо согласие']"
                color="success"
                class="mb-6"
                hide-details="auto"
              >
                <template v-slot:label>
                  <span>
                    Я ознакомлен с
                    <a
                      href="/personal-data-policy"
                      target="_blank"
                      class="text-success text-decoration-underline"
                      @click.prevent="openPersonalDataPolicy"
                    >
                      политикой персональных данных
                    </a>
                  </span>
                </template>
              </v-checkbox>
            </v-form>
          </v-card-text>

          <v-card-actions class="d-flex justify-start px-6 pb-6">
            <v-btn
              color="success"
              variant="flat"
              class="text-none mr-3"
              :disabled="!loginValid"
              @click="login"
            >
              ПОДТВЕРДИТЬ
            </v-btn>

            <v-btn color="success" variant="outlined" class="text-none" @click="closeLogin">
              ЗАКРЫТЬ
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios' // Импортируем axios для HTTP-запросов

const router = useRouter()

const openUserAgreement = () => {
  window.open('/user-agreement', '_blank')
}

const openPersonalDataPolicy = () => {
  window.open('/personal-data-policy', '_blank')
}

const registrationDialog = ref(false)
const loginDialog = ref(false)

const registrationForm = ref(null)
const loginForm = ref(null)
const registrationValid = ref(false)
const loginValid = ref(false)

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showLoginPassword = ref(false)

const registrationData = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  privacyPolicy: false,
  personalData: false,
})

const loginData = reactive({
  email: '',
  password: '',
  remember: false,
  privacyPolicy: false,
  personalData: false,
})

const nameRules = [
  (v) => !!v || 'Имя обязательно',
  (v) => v.length <= 50 || 'Имя не должно превышать 50 символов',
]

const emailRules = [
  (v) => !!v || 'Email обязателен',
  (v) => /.+@.+\..+/.test(v) || 'Введите корректный email',
]

const passwordRules = [
  (v) => !!v || 'Пароль обязателен',
  (v) => v.length >= 6 || 'Пароль должен содержать минимум 6 символов',
]

const confirmPasswordRules = [
  (v) => !!v || 'Подтвердите пароль',
  (v) => v === registrationData.password || 'Пароли не совпадают',
]

const closeRegistration = () => {
  registrationDialog.value = false
  registrationForm.value?.reset()
  showPassword.value = false
  showConfirmPassword.value = false
}

const closeLogin = () => {
  loginDialog.value = false
  loginForm.value?.reset()
  showLoginPassword.value = false
}

// ЛОГИКА РЕГИСТРАЦИИ
const register = async () => {
  const { valid } = await registrationForm.value.validate()

  if (valid) {
    try {
      // POST запрос
      const response = await axios.post('http://localhost:3000/api/auth/register', {
        name: registrationData.name,
        email: registrationData.email,
        password: registrationData.password,
      })

      console.log('Успешная регистрация:', response.data)
      alert('Регистрация прошла успешно! Теперь вы можете войти.')

      closeRegistration()

      loginDialog.value = true
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      const errorMessage =
        error.response?.data?.message || 'Произошла ошибка при соединении с сервером'
      alert(errorMessage)
    }
  }
}

const login = async () => {
  const { valid } = await loginForm.value.validate()

  if (valid) {
    try {
      const response = await axios.post(
        'http://localhost:3000/api/auth/login',
        {
          email: loginData.email,
          password: loginData.password,
          remember: loginData.remember,
        },
        {
          withCredentials: true, // Условие принятие браузером Cookie с токеном
        },
      )

      console.log('Успешная авторизация:', response.data)

      closeLogin()

      // Здесь буде перенаправление на главную страницу приложения:
      // router.push('/dashboard');
    } catch (error) {
      console.error(error)
      alert(error.response?.data?.message || 'Произошла ошибка при входе')
    }
  }
}
</script>

<style scoped>
.spacing-30 > * {
  margin-bottom: 30px;
}

.spacing-30 > *:last-child {
  margin-bottom: 0;
}

.min-vh-100 {
  min-height: 100vh;
}

.logo-container {
  position: relative;
}

.gap-4 {
  gap: 30px;
}

.field-with-margin {
  margin-bottom: 24px !important;
}

.field-no-margin {
  margin-bottom: 5px !important;
}

.v-form .v-text-field {
  margin-top: 0 !important;
}

.dialog-left-spacing {
  padding: 0 !important;
}

.dialog-left-spacing :deep(.v-card-title) {
  padding: 16px 16px 0 16px !important;
}

.dialog-left-spacing :deep(.v-card-text) {
  padding: 16px !important;
}

.dialog-left-spacing :deep(.v-checkbox) {
  margin-left: 0 !important;
}

.dialog-actions {
  padding: 0 16px 16px 16px !important;
  margin: 0 !important;
}

.dialog-left-spacing :deep(.v-text-field) {
  margin-left: 0 !important;
}

@media (max-width: 600px) {
  .logo-text {
    font-size: 3rem;
  }

  .gap-4 {
    flex-direction: column;
    width: 100%;
    padding: 0 20px;
  }

  .gap-4 .v-btn {
    width: 100%;
  }
}
</style>

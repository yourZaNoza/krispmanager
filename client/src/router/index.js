import { createRouter, createWebHistory } from 'vue-router'
import Entry from '../views/Entry.vue'
import UserAgreement from '../views/UserAgreement.vue'
import PersonalDataPolicy from '../views/PersonalDataPolicy.vue'
import Tasks from '../views/Tasks.vue'
import Search from '../views/Search.vue'
import Profile from '../views/Profile.vue'
import Notes from '../views/Notes.vue'
import Contacts from '../views/Contacts.vue'
import Companies from '../views/Companies.vue'
import Analytics from '../views/Analytics.vue'
import Settings from '../views/Settings.vue'
import Archive from '../views/Archive.vue'
import Help from '../views/Help.vue'
import NoRole from '../views/NoRole.vue'

const routes = [
  {
    path: '/',
    name: 'Entry',
    component: Entry,
  },
  {
    path: '/no-role',
    name: 'NoRole',
    component: NoRole,
  },
  {
    path: '/tasks',
    name: 'Tasks',
    component: Tasks,
  },
  {
    path: '/search',
    name: 'Search',
    component: Search,
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
  },
  {
    path: '/notes',
    name: 'Notes',
    component: Notes,
  },
  {
    path: '/contacts',
    name: 'Contacts',
    component: Contacts,
  },
  {
    path: '/companies',
    name: 'Companies',
    component: Companies,
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: Analytics,
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
  },
  {
    path: '/archive',
    name: 'Archive',
    component: Archive,
  },
  {
    path: '/help',
    name: 'Help',
    component: Help,
  },
  {
    path: '/user-agreement',
    name: 'UserAgreement',
    component: UserAgreement,
  },
  {
    path: '/personal-data-policy',
    name: 'PersonalDataPolicy',
    component: PersonalDataPolicy,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

const ALLOWED_WITHOUT_ROLE = new Set([
  '/',
  '/no-role',
  '/search',
  '/profile',
  '/help',
  '/user-agreement',
  '/personal-data-policy',
])

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

router.beforeEach((to, _from, next) => {
  const user = getStoredUser()

  if (user?.id && !user.role) {
    // Пользователь без роли — разрешаем только разрешённые маршруты
    if (!ALLOWED_WITHOUT_ROLE.has(to.path)) {
      return next('/no-role')
    }
  } else if (user?.id && user.role && to.path === '/no-role') {
    // Пользователь с ролью не должен оставаться на /no-role
    return next('/tasks')
  }

  next()
})

export default router

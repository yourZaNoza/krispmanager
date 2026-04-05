import { createRouter, createWebHistory } from 'vue-router'
import Entry from '../views/Entry.vue'
import UserAgreement from '../views/UserAgreement.vue'
import PersonalDataPolicy from '../views/PersonalDataPolicy.vue'

const routes = [
  {
    path: '/',
    name: 'Entry',
    component: Entry,
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

export default router

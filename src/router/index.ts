import { createRouter, createWebHistory } from 'vue-router'
import { EUROPE_QUIZ_CATEGORIES, EUROPE_QUIZ_ENABLED, type QuizMode } from '@/types/quiz'

const europeQuizModes = new Set<QuizMode>(EUROPE_QUIZ_CATEGORIES.map((category) => category.id))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/espana',
      name: 'spain-hub',
      component: () => import('@/views/quizzes/SpainQuizHubView.vue'),
    },
    {
      path: '/europa',
      name: 'europe-hub',
      component: () => import('@/views/quizzes/EuropeQuizHubView.vue'),
    },
    {
      path: '/quiz/:mode',
      name: 'quiz-play',
      component: () => import('@/views/quizzes/QuizPlayView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (EUROPE_QUIZ_ENABLED) return true

  if (to.name === 'europe-hub' || europeQuizModes.has(to.params.mode as QuizMode)) {
    return { name: 'home' }
  }

  return true
})

export default router

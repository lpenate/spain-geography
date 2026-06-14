import { createRouter, createWebHistory } from 'vue-router'
import { EUROPE_QUIZ_CATEGORIES, EUROPE_QUIZ_ENABLED, type QuizMode } from '@/types/quiz'

const europeQuizModes = new Set<QuizMode>(EUROPE_QUIZ_CATEGORIES.map((category) => category.id))

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/espana',
      redirect: '/',
    },
    {
      path: '/europa',
      redirect: '/',
    },
    {
      path: '/quiz/capitales-provincia',
      redirect: '/quiz/provincias',
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

  if (europeQuizModes.has(to.params.mode as QuizMode)) {
    return { name: 'home' }
  }

  return true
})

export default router

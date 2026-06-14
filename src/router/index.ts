import { createRouter, createWebHistory } from 'vue-router'

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

export default router

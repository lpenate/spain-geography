import {
  EUROPE_QUIZ_CATEGORIES,
  EUROPE_QUIZ_ENABLED,
  SPAIN_QUIZ_CATEGORIES,
  type QuizCategory,
  type QuizMode,
} from '@/types/quiz'

export const availableQuizCategories = (): QuizCategory[] =>
  (EUROPE_QUIZ_ENABLED
    ? [...SPAIN_QUIZ_CATEGORIES, ...EUROPE_QUIZ_CATEGORIES]
    : SPAIN_QUIZ_CATEGORIES
  ).filter((category) => category.available)

export const quizPlayRoute = (mode: QuizMode) => ({
  name: 'quiz-play' as const,
  params: { mode },
})

export interface PageHeaderContext {
  eyebrow: string
  title: string
}

export const pageHeaderContext = (
  routeName: string | symbol | null | undefined,
  mode?: string,
): PageHeaderContext | null => {
  if (routeName === 'home') {
    return {
      eyebrow: 'Aprende geografía con mapas interactivos',
      title: 'Quiz de geografía de España',
    }
  }

  if (routeName === 'quiz-play' && mode) {
    const category = availableQuizCategories().find((entry) => entry.id === mode)
    if (!category) return null

    return {
      eyebrow: category.region === 'spain' ? 'España' : 'Europa',
      title: category.title,
    }
  }

  return null
}

export const quizNavLabel = (category: QuizCategory): string => {
  if (category.id === 'comunidades') return 'Comunidades'
  if (category.id === 'provincias') return 'Provincias'
  if (category.id === 'paises') return 'Países'
  if (category.id === 'capitales') return 'Capitales EU'

  return category.title
}

import {
  ALL_QUIZ_CATEGORIES,
  EUROPE_QUIZ_ENABLED,
  type QuizCategory,
  type QuizMode,
} from '@/types/quiz'

export const availableQuizCategories = (): QuizCategory[] =>
  (EUROPE_QUIZ_ENABLED
    ? ALL_QUIZ_CATEGORIES
    : ALL_QUIZ_CATEGORIES.filter((c) => c.region === 'spain')
  ).filter((category) => category.available)

export const quizCategoryByMode = (mode: QuizMode): QuizCategory | undefined =>
  availableQuizCategories().find((category) => category.id === mode)

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
      title: 'Quiz de geografía de España y Europa',
    }
  }

  if (routeName === 'quiz-play' && mode) {
    const category = quizCategoryByMode(mode as QuizMode)
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
  if (category.id === 'paises') return 'Países EU'
  if (category.id === 'paises-ubicacion') return 'Ubicación EU'

  return category.title
}

export const quizRegionLabel = (region: QuizCategory['region']): string =>
  region === 'spain' ? 'España' : 'Europa'

export const quizInteractionLabel = (category: QuizCategory): string => {
  if (category.interaction === 'click-timed') {
    return `Clic · ${category.timerSeconds ?? 20}s`
  }

  return 'Escribir nombres'
}

export const quizCategoriesByRegion = (): Record<QuizCategory['region'], QuizCategory[]> => {
  const grouped: Record<QuizCategory['region'], QuizCategory[]> = {
    spain: [],
    europe: [],
  }

  for (const category of availableQuizCategories()) {
    grouped[category.region].push(category)
  }

  return grouped
}

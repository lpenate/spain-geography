import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  EUROPE_QUIZ_CATEGORIES,
  SPAIN_QUIZ_CATEGORIES,
  type QuizCategory,
  type QuizMode,
  type QuizProgress,
  type QuizRegion,
} from '@/types/quiz'

const emptyProgress = (): QuizProgress => ({
  correct: 0,
  total: 0,
  streak: 0,
})

export const useQuizStore = defineStore('quiz', () => {
  const activeRegion = ref<QuizRegion | null>(null)
  const activeMode = ref<QuizMode | null>(null)
  const progress = ref<QuizProgress>(emptyProgress())

  const spainCategories = computed(() => SPAIN_QUIZ_CATEGORIES)
  const europeCategories = computed(() => EUROPE_QUIZ_CATEGORIES)

  const activeCategory = computed<QuizCategory | null>(() => {
    if (!activeMode.value) return null

    const categories =
      activeRegion.value === 'spain' ? SPAIN_QUIZ_CATEGORIES : EUROPE_QUIZ_CATEGORIES

    return categories.find((category) => category.id === activeMode.value) ?? null
  })

  const selectRegion = (region: QuizRegion) => {
    activeRegion.value = region
    activeMode.value = null
    progress.value = emptyProgress()
  }

  const selectMode = (mode: QuizMode) => {
    activeMode.value = mode
    progress.value = emptyProgress()
  }

  const resetSession = () => {
    activeRegion.value = null
    activeMode.value = null
    progress.value = emptyProgress()
  }

  return {
    activeRegion,
    activeMode,
    progress,
    spainCategories,
    europeCategories,
    activeCategory,
    selectRegion,
    selectMode,
    resetSession,
  }
})

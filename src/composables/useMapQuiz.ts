import { type MaybeRefOrGetter, computed, ref, toValue } from 'vue'
import { fetchQuizDataset } from '@/services/quizData'
import type { QuizAnswerResult, QuizDataset, QuizMode, QuizSessionItem } from '@/types/quiz'
import { assignQuizItemColors } from '@/utils/quizColors'
import { countCorrectAnswers, evaluateAnswers, pickHiddenItems } from '@/utils/quizSession'

export const useMapQuiz = (mode: MaybeRefOrGetter<QuizMode>) => {
  const dataset = ref<QuizDataset | null>(null)
  const sessionItems = ref<QuizSessionItem[]>([])
  const answers = ref<Record<string, string>>({})
  const results = ref<QuizAnswerResult[]>([])
  const itemColorsById = ref<Record<string, string>>({})
  const corrected = ref(false)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const hiddenItems = computed(() => sessionItems.value.filter((item) => item.isHidden))

  const score = computed(() => ({
    correct: countCorrectAnswers(results.value),
    total: hiddenItems.value.length,
  }))

  const resultsByItemId = computed(() =>
    Object.fromEntries(results.value.map((result) => [result.itemId, result])),
  )

  const initializeSession = () => {
    if (!dataset.value) return

    sessionItems.value = pickHiddenItems(dataset.value.items, dataset.value.hiddenCount)
    const hiddenIds = sessionItems.value.filter((item) => item.isHidden).map((item) => item.id)
    itemColorsById.value = assignQuizItemColors(hiddenIds)
    answers.value = Object.fromEntries(hiddenIds.map((itemId) => [itemId, '']))
    results.value = []
    corrected.value = false
  }

  const loadDataset = async () => {
    loading.value = true
    error.value = null

    try {
      dataset.value = await fetchQuizDataset(toValue(mode))
      initializeSession()
    } catch (loadError) {
      error.value = loadError instanceof Error ? loadError.message : 'Error al cargar el quiz'
    } finally {
      loading.value = false
    }
  }

  const correctAnswers = () => {
    results.value = evaluateAnswers(sessionItems.value, answers.value)
    corrected.value = true
  }

  const restartQuiz = async () => {
    initializeSession()
  }

  return {
    dataset,
    sessionItems,
    answers,
    results,
    itemColorsById,
    corrected,
    loading,
    error,
    hiddenItems,
    score,
    resultsByItemId,
    loadDataset,
    correctAnswers,
    restartQuiz,
  }
}

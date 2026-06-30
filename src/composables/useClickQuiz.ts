import { type MaybeRefOrGetter, computed, onUnmounted, ref, toValue, watch } from 'vue'
import { fetchQuizDataset } from '@/services/quizData'
import type { QuizClickResult, QuizDataset, QuizItem, QuizMode } from '@/types/quiz'
import { pickQuestionItems } from '@/utils/quizSession'
import { isClickQuizAnswerCorrect } from '@/utils/clickQuizMatch'
import { quizCategoryByMode } from '@/utils/quizNav'

const FEEDBACK_DELAY_MS = 1400

export type ClickQuizPhase = 'playing' | 'feedback' | 'finished'

export const useClickQuiz = (mode: MaybeRefOrGetter<QuizMode>) => {
  const dataset = ref<QuizDataset | null>(null)
  const questions = ref<QuizItem[]>([])
  const currentIndex = ref(0)
  const results = ref<QuizClickResult[]>([])
  const phase = ref<ClickQuizPhase>('playing')
  const timeLeft = ref(0)
  const loading = ref(true)
  const error = ref<string | null>(null)
  const feedback = ref<{
    clickedPathId: string | null
    answerPathId: string
    state: 'correct' | 'incorrect' | 'reveal'
  } | null>(null)

  let timerId: ReturnType<typeof setInterval> | null = null
  let advanceTimeoutId: ReturnType<typeof setTimeout> | null = null

  const category = computed(() => quizCategoryByMode(toValue(mode)))
  const timerSeconds = computed(() => category.value?.timerSeconds ?? 20)
  const currentItem = computed(() => questions.value[currentIndex.value] ?? null)
  const interactionLocked = computed(() => phase.value !== 'playing')

  const score = computed(() => ({
    correct: results.value.filter((result) => result.isCorrect).length,
    total: questions.value.length,
  }))

  const clearTimers = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }

    if (advanceTimeoutId) {
      clearTimeout(advanceTimeoutId)
      advanceTimeoutId = null
    }
  }

  const stopTimer = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  const startTimer = () => {
    stopTimer()
    timeLeft.value = timerSeconds.value

    timerId = setInterval(() => {
      if (timeLeft.value <= 1) {
        stopTimer()
        handleTimeout()
        return
      }

      timeLeft.value -= 1
    }, 1000)
  }

  const beginQuestion = () => {
    feedback.value = null
    phase.value = 'playing'
    startTimer()
  }

  const scheduleAdvance = () => {
    advanceTimeoutId = setTimeout(() => {
      advanceTimeoutId = null
      goToNextQuestion()
    }, FEEDBACK_DELAY_MS)
  }

  const recordResult = (result: QuizClickResult) => {
    results.value = [...results.value, result]
  }

  const goToNextQuestion = () => {
    if (currentIndex.value >= questions.value.length - 1) {
      phase.value = 'finished'
      feedback.value = null
      stopTimer()
      return
    }

    currentIndex.value += 1
    beginQuestion()
  }

  const handleTimeout = () => {
    if (!currentItem.value || phase.value !== 'playing') return

    phase.value = 'feedback'
    feedback.value = {
      clickedPathId: null,
      answerPathId: currentItem.value.svgPathId,
      state: 'reveal',
    }

    recordResult({
      itemId: currentItem.value.id,
      countryName: currentItem.value.name,
      clickedPathId: null,
      isCorrect: false,
      timedOut: true,
    })

    scheduleAdvance()
  }

  const handlePathClick = (pathId: string) => {
    if (!currentItem.value || phase.value !== 'playing') return

    stopTimer()
    phase.value = 'feedback'

    const isCorrect = isClickQuizAnswerCorrect(currentItem.value.svgPathId, pathId)

    feedback.value = {
      clickedPathId: pathId,
      answerPathId: currentItem.value.svgPathId,
      state: isCorrect ? 'correct' : 'incorrect',
    }

    recordResult({
      itemId: currentItem.value.id,
      countryName: currentItem.value.name,
      clickedPathId: pathId,
      isCorrect,
      timedOut: false,
    })

    scheduleAdvance()
  }

  const initializeSession = () => {
    if (!dataset.value) return

    clearTimers()
    questions.value = pickQuestionItems(dataset.value.items, dataset.value.hiddenCount)
    currentIndex.value = 0
    results.value = []
    feedback.value = null

    if (questions.value.length === 0) {
      phase.value = 'finished'
      return
    }

    beginQuestion()
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

  const restartQuiz = () => {
    initializeSession()
  }

  watch(
    () => toValue(mode),
    () => {
      loadDataset()
    },
  )

  onUnmounted(() => {
    clearTimers()
  })

  return {
    dataset,
    questions,
    currentItem,
    currentIndex,
    results,
    phase,
    timeLeft,
    timerSeconds,
    loading,
    error,
    feedback,
    interactionLocked,
    score,
    loadDataset,
    restartQuiz,
    handlePathClick,
  }
}

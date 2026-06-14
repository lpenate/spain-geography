import { isApproximateMatch } from '@/utils/textMatch'
import type { QuizAnswerResult, QuizItem, QuizSessionItem } from '@/types/quiz'

export const pickHiddenItems = (items: QuizItem[], hiddenCount: number): QuizSessionItem[] => {
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  const hiddenIds = new Set(
    shuffled.slice(0, Math.min(hiddenCount, items.length)).map((item) => item.id),
  )

  return items.map((item) => ({
    ...item,
    isHidden: hiddenIds.has(item.id),
  }))
}

export const sortItemsNorthToSouth = <T extends { label: { x: number; y: number } }>(
  items: T[],
): T[] =>
  [...items].sort((left, right) => {
    const verticalDelta = left.label.y - right.label.y
    if (verticalDelta !== 0) return verticalDelta

    return left.label.x - right.label.x
  })

export const buildExpectedAnswers = (item: QuizItem): string[] => [item.name, ...item.aliases]

export const evaluateAnswers = (
  hiddenItems: QuizSessionItem[],
  answers: Record<string, string>,
): QuizAnswerResult[] =>
  hiddenItems
    .filter((item) => item.isHidden)
    .map((item) => {
      const userAnswer = answers[item.id] ?? ''
      const expectedAnswers = buildExpectedAnswers(item)
      const isCorrect = isApproximateMatch(userAnswer, expectedAnswers)

      return {
        itemId: item.id,
        userAnswer,
        expectedAnswer: item.name,
        isCorrect,
      }
    })

export const countCorrectAnswers = (results: QuizAnswerResult[]): number =>
  results.filter((result) => result.isCorrect).length

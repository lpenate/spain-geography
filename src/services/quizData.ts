import type { QuizDataset, QuizMode } from '@/types/quiz'
import { QUIZ_DATA_URLS } from '@/types/quiz'

export const fetchQuizDataset = async (mode: QuizMode): Promise<QuizDataset> => {
  const response = await fetch(QUIZ_DATA_URLS[mode])

  if (!response.ok) {
    throw new Error(`No se pudo cargar el dataset del quiz (${mode})`)
  }

  return response.json() as Promise<QuizDataset>
}

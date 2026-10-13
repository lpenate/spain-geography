import type { MapQuizMode, QuizDataset } from '@/types/quiz'
import { QUIZ_DATA_URLS } from '@/types/quiz'
import { assetUrl } from '@/utils/assetUrl'

export const fetchQuizDataset = async (mode: MapQuizMode): Promise<QuizDataset> => {
  const response = await fetch(assetUrl(QUIZ_DATA_URLS[mode]))

  if (!response.ok) {
    throw new Error(`No se pudo cargar el dataset del quiz (${mode})`)
  }

  return response.json() as Promise<QuizDataset>
}

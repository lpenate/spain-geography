import { shallowRef } from 'vue'
import type { PageHeaderContext } from '@/utils/quizNav'

const headerOverride = shallowRef<PageHeaderContext | null>(null)

export const setQuizPlayHeader = (context: PageHeaderContext | null) => {
  headerOverride.value = context
}

export const useQuizPlayHeader = () => headerOverride

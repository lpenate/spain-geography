import type {
  GentilicioAnswerResult,
  GentilicioItem,
  GentilicioKind,
  GentilicioMistakes,
} from '@/types/gentilicio'
import { isCloseMatch, normalizeAnswer } from '@/utils/textMatch'

export const GENTILICIO_ROUND_SIZE = 10
export const GENTILICIO_MISTAKES_KEY = 'spain-geography:gentilicio-mistakes'

const KIND_LABELS: Record<GentilicioKind, string> = {
  ciudad: 'Ciudad',
  comunidad: 'Comunidad autónoma',
  provincia: 'Provincia',
  ambos: 'Ciudad o comunidad',
}

export const gentilicioKindLabel = (kind: GentilicioKind): string => KIND_LABELS[kind]

export const gentilicioAnswerCandidates = (item: GentilicioItem): string[] => [
  item.gentilicio,
  ...(item.gentilicioAliases ?? []),
]

export const formatExpectedAnswer = (item: GentilicioItem): string => {
  const alternatives = item.gentilicioAliases ?? []
  if (alternatives.length === 0) return item.gentilicio

  return [item.gentilicio, ...alternatives].join(' / ')
}

export const isGentilicioAnswerCorrect = (userAnswer: string, item: GentilicioItem): boolean =>
  isCloseMatch(userAnswer, gentilicioAnswerCandidates(item))

const shuffle = <T>(items: T[], random: () => number): T[] => {
  const copy = [...items]

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex] as T
    copy[swapIndex] = current as T
  }

  return copy
}

export const pickGentilicioRound = (
  items: GentilicioItem[],
  mistakes: GentilicioMistakes,
  count = GENTILICIO_ROUND_SIZE,
  random: () => number = Math.random,
): GentilicioItem[] => {
  const target = Math.min(count, items.length)
  const priorityPool = items
    .filter((item) => (mistakes[item.id] ?? 0) > 0)
    .sort((left, right) => {
      const priorityDelta = (mistakes[right.id] ?? 0) - (mistakes[left.id] ?? 0)
      if (priorityDelta !== 0) return priorityDelta
      return left.id.localeCompare(right.id)
    })

  const prioritized = priorityPool.slice(0, target)
  const selectedIds = new Set(prioritized.map((item) => item.id))
  const filler = shuffle(
    items.filter((item) => !selectedIds.has(item.id)),
    random,
  ).slice(0, Math.max(0, target - prioritized.length))

  const round = shuffle([...prioritized, ...filler], random)

  if (round.length < target) {
    throw new Error(`El test de gentilicios debe tener ${target} preguntas`)
  }

  return round
}

export const evaluateGentilicioAnswers = (
  round: GentilicioItem[],
  answers: Record<string, string>,
): GentilicioAnswerResult[] =>
  round.map((item) => {
    const userAnswer = answers[item.id] ?? ''

    return {
      itemId: item.id,
      userAnswer,
      expectedAnswer: formatExpectedAnswer(item),
      isCorrect: isGentilicioAnswerCorrect(userAnswer, item),
    }
  })

export const countGentilicioScore = (results: GentilicioAnswerResult[]): number =>
  results.filter((result) => result.isCorrect).length

const isMistakeMap = (value: unknown): value is GentilicioMistakes => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false

  return Object.values(value).every((count) => Number.isInteger(count) && (count as number) > 0)
}

export const readGentilicioMistakes = (
  storage: Pick<Storage, 'getItem'> = localStorage,
): GentilicioMistakes => {
  try {
    const raw = storage.getItem(GENTILICIO_MISTAKES_KEY)
    if (!raw) return {}

    const parsed: unknown = JSON.parse(raw)
    if (!isMistakeMap(parsed)) return {}

    return parsed
  } catch {
    return {}
  }
}

export const writeGentilicioMistakes = (
  mistakes: GentilicioMistakes,
  storage: Pick<Storage, 'setItem'> = localStorage,
): void => {
  storage.setItem(GENTILICIO_MISTAKES_KEY, JSON.stringify(mistakes))
}

export const applyGentilicioResults = (
  mistakes: GentilicioMistakes,
  results: GentilicioAnswerResult[],
): GentilicioMistakes => {
  const next: GentilicioMistakes = { ...mistakes }

  results.forEach((result) => {
    if (result.isCorrect) {
      delete next[result.itemId]
      return
    }

    next[result.itemId] = (next[result.itemId] ?? 0) + 1
  })

  return next
}

export const promptPlaceLabel = (item: GentilicioItem): string => {
  if (item.kind !== 'ambos') return item.name

  const alternate = item.aliases.find(
    (alias) => normalizeAnswer(alias) !== normalizeAnswer(item.name),
  )

  if (!alternate) return item.name
  return `${item.name} / ${alternate}`
}

export type GentilicioViewMode = 'test' | 'repaso'

const KIND_ORDER: GentilicioKind[] = ['comunidad', 'provincia', 'ambos', 'ciudad']

export const sortGentiliciosForReview = (items: GentilicioItem[]): GentilicioItem[] =>
  [...items].sort((left, right) => {
    const kindDelta = KIND_ORDER.indexOf(left.kind) - KIND_ORDER.indexOf(right.kind)
    if (kindDelta !== 0) return kindDelta
    return left.name.localeCompare(right.name, 'es')
  })

export const filterGentiliciosForReview = (
  items: GentilicioItem[],
  query: string,
): GentilicioItem[] => {
  const normalizedQuery = normalizeAnswer(query)
  if (!normalizedQuery) return sortGentiliciosForReview(items)

  return sortGentiliciosForReview(items).filter((item) => {
    const haystack = [
      item.name,
      ...item.aliases,
      item.gentilicio,
      ...(item.gentilicioAliases ?? []),
      gentilicioKindLabel(item.kind),
    ]
      .map((value) => normalizeAnswer(value))
      .join(' ')

    return haystack.includes(normalizedQuery)
  })
}

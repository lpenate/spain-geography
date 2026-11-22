import type { RiverAnswerResult, RiverItem, RiverVertiente } from '@/types/river'
import { RIVER_ROUND_SIZE } from '@/types/river'
import { isApproximateMatch } from '@/utils/textMatch'

const shuffleArray = <T>(array: T[], random: () => number): T[] => {
  const copy = [...array]
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const current = copy[index]
    copy[index] = copy[swapIndex]
    copy[swapIndex] = current
  }
  return copy
}

/** Ríos y lagos que entran en el examen (apuntes «Los ríos de España»), por vertiente. */
export const EXAM_RIVER_IDS: ReadonlySet<string> = new Set([
  // Cantábrica
  'rio-bidasoa',
  'rio-saja',
  'rio-narcea',
  'rio-eo',
  'rio-nervion',
  'rio-nalon',
  'rio-navia',
  // Atlántica
  'rio-tambre',
  'rio-duero',
  'rio-guadiana',
  'rio-mino',
  'rio-sil',
  'rio-tajo',
  'rio-guadalquivir',
  // Mediterránea
  'rio-guadalhorce',
  'rio-almanzora',
  'rio-ter',
  'rio-jucar',
  'rio-guadalfeo',
  'rio-ebro',
  'rio-llobregat',
  'rio-segura',
  // Lagos y lagunas
  'lago-covadonga',
  'lago-sanabria',
  'lago-laguna-negra',
  'lago-ruidera',
  'lago-gallocanta',
])

/** Solo los elementos del mapa que se preguntan en el examen. */
export const filterExamRivers = (items: RiverItem[]): RiverItem[] =>
  items.filter((item) => EXAM_RIVER_IDS.has(item.id))

export const pickRiverRound = (
  items: RiverItem[],
  count = RIVER_ROUND_SIZE,
  random: () => number = Math.random,
): RiverItem[] => {
  if (items.length <= count) {
    return shuffleArray(items, random)
  }

  const lakes = items.filter((item) => item.type === 'lago')
  const rivers = items.filter((item) => item.type !== 'lago')

  const shuffledLakes = shuffleArray(lakes, random)
  const shuffledRivers = shuffleArray(rivers, random)

  // Seleccionamos al menos 1 lago por ronda (si está disponible) y el resto ríos
  const selectedLakes = shuffledLakes.slice(0, Math.min(1, shuffledLakes.length))
  const remainingCount = count - selectedLakes.length
  const selectedRivers = shuffledRivers.slice(0, remainingCount)

  return shuffleArray([...selectedLakes, ...selectedRivers], random)
}

export const isRiverAnswerCorrect = (
  item: RiverItem,
  nameAnswer: string,
  selectedVertiente: RiverVertiente | null,
): RiverAnswerResult => {
  const nameCorrect = isApproximateMatch(nameAnswer, [item.name, ...item.aliases])
  const vertienteCorrect = selectedVertiente === item.vertiente

  // 100% de puntos (1.0) si acierta río + vertiente; 50% de puntos (0.5) si acierta solo el río; 0% si falla el río
  let score = 0
  if (nameCorrect && vertienteCorrect) {
    score = 1
  } else if (nameCorrect) {
    score = 0.5
  }

  return {
    nameCorrect,
    vertienteCorrect,
    isCorrect: nameCorrect && vertienteCorrect,
    score,
  }
}

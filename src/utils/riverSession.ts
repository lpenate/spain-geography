import type {
  RiverAnswerResult,
  RiverItem,
  RiverItemType,
  RiverQuizMode,
  RiverVertiente,
} from '@/types/river'
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

/** Solo los ríos se preguntan con vertiente; los lagos y los mares, solo por el nombre. */
export const asksVertiente = (item: RiverItem): boolean =>
  item.type === 'rio' && item.vertiente !== undefined

export const isRiverAnswerCorrect = (
  item: RiverItem,
  nameAnswer: string,
  selectedVertiente: RiverVertiente | null,
): RiverAnswerResult => {
  const nameCorrect = isApproximateMatch(nameAnswer, [item.name, ...item.aliases])

  // Sin vertiente (lagos, y todo el mapa de Europa): solo cuenta el nombre
  if (!asksVertiente(item) || !item.vertiente) {
    return {
      nameCorrect,
      vertienteCorrect: true,
      isCorrect: nameCorrect,
      score: nameCorrect ? 1 : 0,
    }
  }
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

export interface RiverQuizConfig {
  mode: RiverQuizMode
  dataUrl: string
  mapUrl: string
  /** Texto corto del encabezado durante el test. */
  eyebrow: string
  /** Elementos del mapa que entran en las preguntas. */
  selectItems: (items: RiverItem[]) => RiverItem[]
}

export const RIVER_QUIZ_CONFIGS: Record<RiverQuizMode, RiverQuizConfig> = {
  rios: {
    mode: 'rios',
    dataUrl: '/data/spain-rios.json',
    mapUrl: '/maps/spain-rios.svg',
    eyebrow: 'Ríos y lagos',
    selectItems: filterExamRivers,
  },
  'rios-europa': {
    mode: 'rios-europa',
    dataUrl: '/data/europe-rios.json',
    mapUrl: '/maps/europe-rios.svg',
    eyebrow: 'Europa',
    selectItems: (items) => items,
  },
}

export interface RiverTypeText {
  question: string
  label: string
  placeholder: string
  /** Delante del nombre en la corrección: «Era el río Duero». */
  article: string
}

export const RIVER_TYPE_TEXT: Record<RiverItemType, RiverTypeText> = {
  rio: {
    question: '¿Cómo se llama este río?',
    label: 'Nombre del río',
    placeholder: 'Escribe el nombre del río...',
    article: 'el río ',
  },
  lago: {
    question: '¿Cómo se llama este lago o laguna?',
    label: 'Nombre del lago o laguna',
    placeholder: 'Escribe el nombre del lago...',
    article: '',
  },
  mar: {
    question: '¿Cómo se llama este mar?',
    label: 'Nombre del mar',
    placeholder: 'Escribe el nombre del mar...',
    article: 'el ',
  },
}

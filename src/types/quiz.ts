export interface MapLabel {
  x: number
  y: number
}

export interface QuizItem {
  id: string
  name: string
  aliases: string[]
  svgPathId: string
  label: MapLabel
  province?: string
  provinceAliases?: string[]
  country?: string
  countryAliases?: string[]
  capital?: {
    name: string
    aliases: string[]
    label: MapLabel
  }
}

export interface QuizDataset {
  id: string
  region: QuizRegion
  title: string
  map: string
  viewBox: string
  hiddenCount: number
  layer: string
  items: QuizItem[]
}

export type QuizRegion = 'spain' | 'europe'

export const EUROPE_QUIZ_ENABLED = true

export type QuizInteraction = 'text-batch' | 'click-timed'

export type SpainQuizMode = 'comunidades' | 'provincias'

export type EuropeQuizMode = 'paises' | 'paises-ubicacion'

export type QuizMode = SpainQuizMode | EuropeQuizMode

export interface QuizCategory {
  id: QuizMode
  title: string
  description: string
  region: QuizRegion
  mapUrl: string
  dataUrl: string
  interaction: QuizInteraction
  timerSeconds?: number
  available: boolean
}

export interface QuizProgress {
  correct: number
  total: number
  streak: number
}

export interface QuizAnswerResult {
  itemId: string
  userAnswer: string
  expectedAnswer: string
  isCorrect: boolean
}

export interface QuizClickResult {
  itemId: string
  countryName: string
  clickedPathId: string | null
  isCorrect: boolean
  timedOut: boolean
}

export interface QuizSessionItem extends QuizItem {
  isHidden: boolean
}

export const QUIZ_MAP_URLS = {
  spain: '/maps/spain.svg',
  europe: '/maps/europe.svg',
} as const

export const QUIZ_DATA_URLS: Record<QuizMode, string> = {
  comunidades: '/data/spain-comunidades.json',
  provincias: '/data/spain-provincias.json',
  paises: '/data/europe-paises.json',
  'paises-ubicacion': '/data/europe-paises.json',
}

export const SPAIN_QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'comunidades',
    title: 'Comunidades autónomas',
    description: 'Identifica las comunidades autónomas en el mapa de España.',
    region: 'spain',
    mapUrl: QUIZ_MAP_URLS.spain,
    dataUrl: QUIZ_DATA_URLS.comunidades,
    interaction: 'text-batch',
    available: true,
  },
  {
    id: 'provincias',
    title: 'Provincias',
    description: 'Identifica las provincias en el mapa de España.',
    region: 'spain',
    mapUrl: QUIZ_MAP_URLS.spain,
    dataUrl: QUIZ_DATA_URLS.provincias,
    interaction: 'text-batch',
    available: true,
  },
]

export const EUROPE_QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'paises',
    title: 'Países de Europa',
    description: 'Escribe el nombre de cada país sobre el mapa de Europa.',
    region: 'europe',
    mapUrl: QUIZ_MAP_URLS.europe,
    dataUrl: QUIZ_DATA_URLS.paises,
    interaction: 'text-batch',
    available: EUROPE_QUIZ_ENABLED,
  },
  {
    id: 'paises-ubicacion',
    title: 'Ubicación en Europa',
    description: 'Localiza cada país en el mapa antes de que se acabe el tiempo.',
    region: 'europe',
    mapUrl: QUIZ_MAP_URLS.europe,
    dataUrl: QUIZ_DATA_URLS['paises-ubicacion'],
    interaction: 'click-timed',
    timerSeconds: 20,
    available: EUROPE_QUIZ_ENABLED,
  },
]

export const ALL_QUIZ_CATEGORIES: QuizCategory[] = [
  ...SPAIN_QUIZ_CATEGORIES,
  ...EUROPE_QUIZ_CATEGORIES,
]

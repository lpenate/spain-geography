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
  id: QuizMode
  region: QuizRegion
  title: string
  map: string
  viewBox: string
  hiddenCount: number
  layer: string
  items: QuizItem[]
}

export type QuizRegion = 'spain' | 'europe'

export const EUROPE_QUIZ_ENABLED = false

export type SpainQuizMode = 'comunidades' | 'provincias'

export type EuropeQuizMode = 'paises' | 'capitales'

export type QuizMode = SpainQuizMode | EuropeQuizMode

export interface QuizCategory {
  id: QuizMode
  title: string
  description: string
  region: QuizRegion
  dataUrl: string
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

export interface QuizSessionItem extends QuizItem {
  isHidden: boolean
}

export const QUIZ_DATA_URLS: Record<QuizMode, string> = {
  comunidades: '/data/spain-comunidades.json',
  provincias: '/data/spain-provincias.json',
  paises: '/data/europe-paises.json',
  capitales: '/data/europe-capitales.json',
}

export const SPAIN_QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'comunidades',
    title: 'Comunidades autónomas',
    description: 'Identifica las comunidades autónomas en el mapa de España.',
    region: 'spain',
    dataUrl: QUIZ_DATA_URLS.comunidades,
    available: true,
  },
  {
    id: 'provincias',
    title: 'Provincias',
    description: 'Identifica las provincias en el mapa de España.',
    region: 'spain',
    dataUrl: QUIZ_DATA_URLS.provincias,
    available: true,
  },
]

export const EUROPE_QUIZ_CATEGORIES: QuizCategory[] = [
  {
    id: 'paises',
    title: 'Países de Europa',
    description: 'Identifica los países europeos en el mapa.',
    region: 'europe',
    dataUrl: QUIZ_DATA_URLS.paises,
    available: EUROPE_QUIZ_ENABLED,
  },
  {
    id: 'capitales',
    title: 'Capitales europeas',
    description: 'Localiza las capitales de los países europeos.',
    region: 'europe',
    dataUrl: QUIZ_DATA_URLS.capitales,
    available: EUROPE_QUIZ_ENABLED,
  },
]

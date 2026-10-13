export type GentilicioKind = 'ciudad' | 'comunidad' | 'provincia' | 'ambos'

export interface GentilicioItem {
  id: string
  kind: GentilicioKind
  name: string
  aliases: string[]
  gentilicio: string
}

export interface GentilicioDataset {
  id: 'gentilicios'
  title: string
  items: GentilicioItem[]
}

export interface GentilicioAnswerResult {
  itemId: string
  userAnswer: string
  expectedAnswer: string
  isCorrect: boolean
}

export type GentilicioMistakes = Record<string, number>

import type { MapLabel } from '@/types/quiz'

export type RiverVertiente = 'cantabrica' | 'atlantica' | 'mediterranea'

/** Rectángulo en coordenadas del viewBox del SVG. */
export interface RiverBBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

export interface RiverItem {
  /** Coincide con el atributo `data-river` del trazado en el SVG. */
  id: string
  name: string
  aliases: string[]
  vertiente: RiverVertiente
  type: 'rio' | 'lago'
  /** Punto ancla (sobre el trazado) en % del mapa, para el marcador y la flecha. */
  label: MapLabel
  /** Punto ancla en coordenadas del viewBox. */
  anchor: { x: number; y: number }
  bbox: RiverBBox
}

export interface RiverDataset {
  id: 'rios'
  region: 'spain'
  title: string
  map: string
  viewBox: string
  attribution: string
  items: RiverItem[]
}

export interface RiverAnswerResult {
  nameCorrect: boolean
  vertienteCorrect: boolean
  isCorrect: boolean
  score: number
}

export const RIVER_ROUND_SIZE = 8

export const VERTIENTE_LABEL: Record<RiverVertiente, string> = {
  cantabrica: 'cantábrica',
  atlantica: 'atlántica',
  mediterranea: 'mediterránea',
}

export const VERTIENTE_OPTIONS: Array<{ id: RiverVertiente; label: string }> = [
  { id: 'cantabrica', label: 'Cantábrica' },
  { id: 'atlantica', label: 'Atlántica' },
  { id: 'mediterranea', label: 'Mediterránea' },
]

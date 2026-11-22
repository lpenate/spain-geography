import type { MapLabel } from '@/types/quiz'

export const MAP_MIN_ZOOM = 1
export const MAP_MAX_ZOOM = 8
export const MAP_ZOOM_STEP = 1.25
export const MAP_FOCUS_ZOOM = 3

export const DEFAULT_MAP_ORIGIN: MapLabel = { x: 50, y: 50 }

export interface MapZoomState {
  scale: number
  origin: MapLabel
}

export const DEFAULT_MAP_ZOOM_STATE: MapZoomState = {
  scale: MAP_MIN_ZOOM,
  origin: DEFAULT_MAP_ORIGIN,
}

export const clampMapZoom = (scale: number): number =>
  Math.min(MAP_MAX_ZOOM, Math.max(MAP_MIN_ZOOM, scale))

export const increaseMapZoom = (scale: number): number =>
  clampMapZoom(Number((scale * MAP_ZOOM_STEP).toFixed(2)))

export const decreaseMapZoom = (scale: number): number =>
  clampMapZoom(Number((scale / MAP_ZOOM_STEP).toFixed(2)))

export const mapZoomTransform = (scale: number, origin: MapLabel = DEFAULT_MAP_ORIGIN) => ({
  transform: `scale(${scale})`,
  transformOrigin: `${origin.x}% ${origin.y}%`,
})

export const mapZoomLabelPosition = (
  scale: number,
  origin: MapLabel,
  label: MapLabel,
): MapLabel => ({
  x: origin.x + (label.x - origin.x) * scale,
  y: origin.y + (label.y - origin.y) * scale,
})

/** Caja en % del mapa (0-100 en ambos ejes). */
export interface MapBox {
  x0: number
  y0: number
  x1: number
  y1: number
}

/**
 * Zoom que muestra una caja completa: se escala alrededor de su centro y el factor
 * se limita para que ningún borde de la caja (con margen) salga del mapa.
 */
export const mapZoomForBox = (box: MapBox, maxScale = 4, margin = 0.8): MapZoomState => {
  const origin = { x: (box.x0 + box.x1) / 2, y: (box.y0 + box.y1) / 2 }
  const halfWidth = Math.max((box.x1 - box.x0) / 2, 0.5)
  const halfHeight = Math.max((box.y1 - box.y0) / 2, 0.5)
  const fitX = Math.min(origin.x, 100 - origin.x) / halfWidth
  const fitY = Math.min(origin.y, 100 - origin.y) / halfHeight
  const scale = Math.min(maxScale, MAP_MAX_ZOOM, Math.min(fitX, fitY) * margin)

  if (scale <= MAP_MIN_ZOOM) return { ...DEFAULT_MAP_ZOOM_STATE }

  return { scale: Number(scale.toFixed(2)), origin }
}

/**
 * Zoom que deja `point` (en %) exactamente en el centro del mapa visible.
 * Con transform-origin `o`, un punto `p` se dibuja en `o + (p - o) * s`; igualándolo a 50
 * se despeja `o = (50 - p * s) / (1 - s)`. El origen puede caer fuera de 0-100.
 */
export const mapZoomCenteredOn = (point: MapLabel, scale: number): MapZoomState => {
  const s = Math.max(scale, MAP_MIN_ZOOM + 0.01)
  const center = (p: number) => Number(((50 - p * s) / (1 - s)).toFixed(3))
  return { scale: s, origin: { x: center(point.x), y: center(point.y) } }
}

export const mapMarkerTransform = (scale: number): string =>
  `translate(-50%, -50%) scale(${1 / scale})`

export const mapZoomedTextTransform = (scale: number): string => {
  void scale
  return 'translate(-50%, -50%)'
}

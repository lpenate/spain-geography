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

export const mapMarkerTransform = (scale: number): string =>
  `translate(-50%, -50%) scale(${1 / scale})`

export const mapZoomedTextTransform = (scale: number): string =>
  `translate(-50%, -50%) scale(${scale})`

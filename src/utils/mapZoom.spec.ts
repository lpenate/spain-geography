import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAP_ZOOM_STATE,
  MAP_FOCUS_ZOOM,
  decreaseMapZoom,
  increaseMapZoom,
  mapMarkerTransform,
  mapZoomTransform,
} from '@/utils/mapZoom'

describe('mapZoomTransform', () => {
  it('returns neutral transform at minimum zoom', () => {
    expect(mapZoomTransform(1)).toEqual({
      transform: 'scale(1)',
      transformOrigin: '50% 50%',
    })
  })

  it('zooms around the provided origin', () => {
    expect(mapZoomTransform(MAP_FOCUS_ZOOM, { x: 42.5, y: 61.2 })).toEqual({
      transform: 'scale(3)',
      transformOrigin: '42.5% 61.2%',
    })
  })
})

describe('mapMarkerTransform', () => {
  it('keeps markers at neutral size without zoom', () => {
    expect(mapMarkerTransform(1)).toBe('translate(-50%, -50%) scale(1)')
  })

  it('counter-scales markers when the map is zoomed in', () => {
    expect(mapMarkerTransform(MAP_FOCUS_ZOOM)).toBe(
      'translate(-50%, -50%) scale(0.3333333333333333)',
    )
  })
})

describe('map zoom helpers', () => {
  it('increases and decreases zoom within bounds', () => {
    expect(increaseMapZoom(1)).toBe(1.25)
    expect(decreaseMapZoom(1.25)).toBe(1)
    expect(increaseMapZoom(8)).toBe(8)
    expect(decreaseMapZoom(1)).toBe(1)
  })

  it('exposes a default zoom state', () => {
    expect(DEFAULT_MAP_ZOOM_STATE).toEqual({
      scale: 1,
      origin: { x: 50, y: 50 },
    })
  })
})

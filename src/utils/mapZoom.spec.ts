import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MAP_ZOOM_STATE,
  MAP_FOCUS_ZOOM,
  decreaseMapZoom,
  increaseMapZoom,
  mapMarkerTransform,
  mapZoomLabelPosition,
  mapZoomTransform,
  mapZoomedTextTransform,
  mapZoomCenteredOn,
  mapZoomForBox,
  type MapBox,
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

describe('mapZoomLabelPosition', () => {
  it('keeps labels in place without zoom', () => {
    expect(mapZoomLabelPosition(1, { x: 50, y: 50 }, { x: 42.5, y: 61.2 })).toEqual({
      x: 42.5,
      y: 61.2,
    })
  })

  it('moves labels with the zoom origin', () => {
    expect(mapZoomLabelPosition(MAP_FOCUS_ZOOM, { x: 50, y: 50 }, { x: 40, y: 60 })).toEqual({
      x: 20,
      y: 80,
    })
  })
})

describe('mapZoomedTextTransform', () => {
  it('keeps labels at neutral size without zoom', () => {
    expect(mapZoomedTextTransform(1)).toBe('translate(-50%, -50%)')
  })

  it('keeps labels at a stable size regardless of zoom', () => {
    expect(mapZoomedTextTransform(MAP_FOCUS_ZOOM)).toBe('translate(-50%, -50%)')
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

describe('mapZoomForBox', () => {
  const corners = (state: ReturnType<typeof mapZoomForBox>, box: MapBox) =>
    [
      { x: box.x0, y: box.y0 },
      { x: box.x1, y: box.y1 },
    ].map((point) => mapZoomLabelPosition(state.scale, state.origin, point))

  it('keeps the whole box inside the map after zooming', () => {
    const box = { x0: 60, y0: 40, x1: 70, y1: 55 }
    const state = mapZoomForBox(box)

    expect(state.scale).toBeGreaterThan(1)
    for (const point of corners(state, box)) {
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(100)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThanOrEqual(100)
    }
  })

  it('does not zoom on boxes that span most of the map', () => {
    expect(mapZoomForBox({ x0: 5, y0: 35, x1: 56, y1: 60 })).toEqual(DEFAULT_MAP_ZOOM_STATE)
  })

  it('caps the zoom for tiny boxes such as lakes', () => {
    expect(mapZoomForBox({ x0: 33, y0: 11, x1: 34, y1: 12 }, 3).scale).toBe(3)
  })
})

describe('mapZoomCenteredOn', () => {
  it('places the point in the centre of the visible map', () => {
    for (const point of [
      { x: 20, y: 80 },
      { x: 75.5, y: 12.3 },
    ]) {
      const state = mapZoomCenteredOn(point, 3)
      const shown = mapZoomLabelPosition(state.scale, state.origin, point)
      expect(shown.x).toBeCloseTo(50, 2)
      expect(shown.y).toBeCloseTo(50, 2)
    }
  })

  it('never returns a zoom of 1, where centring is impossible', () => {
    expect(mapZoomCenteredOn({ x: 30, y: 30 }, 1).scale).toBeGreaterThan(1)
  })
})

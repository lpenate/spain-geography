import { describe, expect, it } from 'vitest'
import { MIN_SUPPORTED_WIDTH } from '@/composables/useViewport'
import { mountUseViewport } from '@/test/mountUseViewport'
import { setViewportWidth } from '@/test/viewport'

describe('useViewport', () => {
  it('rechaza anchos inferiores al mínimo soportado', () => {
    setViewportWidth(MIN_SUPPORTED_WIDTH - 1)

    const wrapper = mountUseViewport()

    expect(wrapper.vm.isSupportedViewport).toBe(false)
    expect(wrapper.vm.width).toBe(MIN_SUPPORTED_WIDTH - 1)
  })

  it('acepta el ancho mínimo soportado', () => {
    setViewportWidth(MIN_SUPPORTED_WIDTH)

    const wrapper = mountUseViewport()

    expect(wrapper.vm.isSupportedViewport).toBe(true)
    expect(wrapper.vm.width).toBe(MIN_SUPPORTED_WIDTH)
  })

  it('acepta anchos superiores al mínimo soportado', () => {
    setViewportWidth(1280)

    const wrapper = mountUseViewport()

    expect(wrapper.vm.isSupportedViewport).toBe(true)
  })
})

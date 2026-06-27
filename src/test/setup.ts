import { beforeEach } from 'vitest'
import { MIN_SUPPORTED_WIDTH } from '@/composables/useViewport'
import { setViewportWidth } from '@/test/viewport'

beforeEach(() => {
  setViewportWidth(MIN_SUPPORTED_WIDTH)
})

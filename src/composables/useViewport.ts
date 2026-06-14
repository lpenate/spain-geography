import { computed, onMounted, onUnmounted, ref } from 'vue'

const MOBILE_MAX_WIDTH = 639
const TABLET_MAX_WIDTH = 1024

export function useViewport() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)
  const hasTouch = ref(window.matchMedia('(pointer: coarse)').matches)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
    hasTouch.value = window.matchMedia('(pointer: coarse)').matches
  }

  onMounted(() => {
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
  })

  const isMobile = computed(() => width.value <= MOBILE_MAX_WIDTH)
  const isTablet = computed(() => width.value > MOBILE_MAX_WIDTH && width.value <= TABLET_MAX_WIDTH)
  const isDesktop = computed(() => width.value > TABLET_MAX_WIDTH)
  const isPortrait = computed(() => height.value >= width.value)

  return {
    width,
    height,
    hasTouch,
    isMobile,
    isTablet,
    isDesktop,
    isPortrait,
  }
}

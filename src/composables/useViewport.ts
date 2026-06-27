import { computed, onMounted, onUnmounted, ref } from 'vue'

export const MIN_SUPPORTED_WIDTH = 920

export function useViewport() {
  const width = ref(window.innerWidth)

  const update = () => {
    width.value = window.innerWidth
  }

  onMounted(() => {
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', update, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', update)
  })

  const isSupportedViewport = computed(() => width.value >= MIN_SUPPORTED_WIDTH)

  return {
    width,
    isSupportedViewport,
  }
}

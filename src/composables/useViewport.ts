import { computed, onMounted, onUnmounted, ref } from 'vue'

/** Ancho CSS de la ventana (no pulgadas del monitor). */
export const MIN_SUPPORTED_WIDTH = 640

export function useViewport() {
  const width = ref(typeof window === 'undefined' ? MIN_SUPPORTED_WIDTH : window.innerWidth)

  const update = () => {
    width.value = window.innerWidth
  }

  // Tras girar el dispositivo, innerWidth a menudo aún no se ha actualizado.
  const updateAfterOrientationChange = () => {
    requestAnimationFrame(() => {
      update()
      window.setTimeout(update, 150)
    })
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update, { passive: true })
    window.addEventListener('orientationchange', updateAfterOrientationChange, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
    window.removeEventListener('orientationchange', updateAfterOrientationChange)
  })

  const isSupportedViewport = computed(() => width.value >= MIN_SUPPORTED_WIDTH)

  return {
    width,
    isSupportedViewport,
  }
}

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { MapLabel, QuizAnswerResult, QuizSessionItem } from '@/types/quiz'
import { withAlpha } from '@/utils/quizColors'
import {
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  mapZoomLabelPosition,
  mapZoomTransform,
  mapZoomedTextTransform,
} from '@/utils/mapZoom'

const props = defineProps<{
  mapUrl: string
  sessionItems: QuizSessionItem[]
  corrected: boolean
  resultsByItemId: Record<string, QuizAnswerResult>
  itemColorsById: Record<string, string>
  zoomScale: number
  zoomOrigin: MapLabel
}>()

const emit = defineEmits<{
  'zoom-in': []
  'zoom-out': []
  'zoom-fit': []
}>()

const svgMarkup = ref('')
const mapRoot = ref<HTMLElement | null>(null)
const isSpainMap = computed(() => props.mapUrl.includes('spain'))
const zoomStyle = computed(() => mapZoomTransform(props.zoomScale, props.zoomOrigin))

const visibleItems = computed(() => props.sessionItems.filter((item) => !item.isHidden))

const visibleLabelStyle = (label: MapLabel) => {
  const position = mapZoomLabelPosition(props.zoomScale, props.zoomOrigin, label)

  return {
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: mapZoomedTextTransform(props.zoomScale),
  }
}

const loadMap = async () => {
  const response = await fetch(props.mapUrl)
  svgMarkup.value = await response.text()
}

const highlightPaths = () => {
  if (!mapRoot.value) return

  const svgElement = mapRoot.value.querySelector('svg')
  if (!svgElement) return

  props.sessionItems.forEach((item) => {
    const path = svgElement.querySelector(`#${CSS.escape(item.svgPathId)}`)
    if (!path || !(path instanceof SVGGraphicsElement)) return

    path.classList.remove('map-region--hidden', 'map-region--correct', 'map-region--incorrect')
    path.style.removeProperty('fill')
    path.style.removeProperty('stroke')
    path.style.removeProperty('stroke-width')

    if (!item.isHidden) return

    const itemColor = props.itemColorsById[item.id]

    if (!props.corrected && itemColor) {
      path.style.fill = withAlpha(itemColor, 0.2)
      path.style.stroke = itemColor
      path.style.strokeWidth = '1.6'
      return
    }

    path.classList.add('map-region--hidden')

    if (!props.corrected) return

    const result = props.resultsByItemId[item.id]
    path.classList.add(result?.isCorrect ? 'map-region--correct' : 'map-region--incorrect')
  })
}

onMounted(async () => {
  await loadMap()
  highlightPaths()
})

watch(
  () => [
    props.sessionItems,
    props.corrected,
    props.resultsByItemId,
    props.itemColorsById,
    svgMarkup.value,
  ],
  () => highlightPaths(),
  { deep: true },
)

defineExpose({
  mapCanvas: mapRoot,
})
</script>

<template>
  <div class="svg-quiz-map" :class="{ 'svg-quiz-map--spain': isSpainMap }">
    <div ref="mapRoot" class="svg-quiz-map__canvas">
      <div class="svg-quiz-map__zoom" :style="zoomStyle">
        <!-- eslint-disable vue/no-v-html, vue/html-self-closing -- SVG cargado desde assets locales del proyecto -->
        <div class="svg-quiz-map__svg" v-html="svgMarkup" />
        <!-- eslint-enable vue/no-v-html, vue/html-self-closing -->
      </div>

      <div class="svg-quiz-map__overlay">
        <div
          v-for="item in visibleItems"
          :key="`visible-${item.id}`"
          class="map-label map-label--visible"
          :class="{ 'map-label--spain': isSpainMap }"
          :style="visibleLabelStyle(item.label)"
        >
          {{ item.name }}
        </div>
      </div>

      <div class="svg-quiz-map__controls" role="toolbar" aria-label="Controles de zoom del mapa">
        <button
          class="svg-quiz-map__control"
          type="button"
          aria-label="Acercar mapa"
          :disabled="zoomScale >= MAP_MAX_ZOOM"
          @click="emit('zoom-in')"
        >
          +
        </button>
        <button
          class="svg-quiz-map__control"
          type="button"
          aria-label="Alejar mapa"
          :disabled="zoomScale <= MAP_MIN_ZOOM"
          @click="emit('zoom-out')"
        >
          −
        </button>
        <button
          class="svg-quiz-map__control"
          type="button"
          aria-label="Mostrar todo el mapa"
          :disabled="zoomScale <= MAP_MIN_ZOOM"
          @click="emit('zoom-fit')"
        >
          <svg
            class="svg-quiz-map__control-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M4 9V4h5" />
            <path d="M4 4l5 5" />
            <path d="M20 9V4h-5" />
            <path d="M20 4l-5 5" />
            <path d="M4 15v5h5" />
            <path d="M4 20l5-5" />
            <path d="M20 15v5h-5" />
            <path d="M20 20l-5-5" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.svg-quiz-map {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
}

.svg-quiz-map__canvas {
  position: relative;
  width: min(100cqw, calc(100cqh * 1000 / 860));
  height: min(100cqh, calc(100cqw * 860 / 1000));
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  touch-action: manipulation;
}

.svg-quiz-map__zoom {
  width: 100%;
  height: 100%;
  transition: transform 0.25s ease;
  will-change: transform;
}

.svg-quiz-map__controls {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 4;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.svg-quiz-map__control {
  display: grid;
  place-items: center;
  min-width: 2.25rem;
  min-height: 2.25rem;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.95);
  color: var(--text-strong);
  font-size: 1.1rem;
  font-weight: 700;
  line-height: 1;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
  touch-action: manipulation;
}

.svg-quiz-map__control-icon {
  width: 1rem;
  height: 1rem;
}

.svg-quiz-map__control:hover:not(:disabled) {
  border-color: var(--accent-strong);
  color: var(--accent-strong);
  background: var(--accent);
}

.svg-quiz-map__control:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.svg-quiz-map--spain .svg-quiz-map__canvas {
  width: min(100cqw, calc(100cqh * 5 / 4));
  height: min(100cqh, calc(100cqw * 4 / 5));
}

.svg-quiz-map__svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  line-height: 0;
}

.svg-quiz-map__svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

.svg-quiz-map__svg :deep(path) {
  transition:
    fill 0.2s ease,
    stroke 0.2s ease;
}

.svg-quiz-map__svg :deep(.map-region--hidden) {
  fill: var(--map-highlight-fill);
  stroke: var(--map-highlight-stroke);
  stroke-width: 1.4;
}

.svg-quiz-map__svg :deep(.map-region--correct) {
  fill: rgba(26, 127, 55, 0.28);
  stroke: var(--success);
}

.svg-quiz-map__svg :deep(.map-region--incorrect) {
  fill: rgba(196, 30, 30, 0.22);
  stroke: var(--error);
}

.svg-quiz-map__overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.map-label {
  position: absolute;
  pointer-events: none;
}

.map-label--visible {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-strong);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: var(--radius-sm);
  padding: 0.12rem 0.35rem;
  text-align: center;
  line-height: 1.2;
  max-width: 5.5rem;
}

.map-label--spain {
  font-size: 0.68rem;
  max-width: 4.5rem;
}
</style>

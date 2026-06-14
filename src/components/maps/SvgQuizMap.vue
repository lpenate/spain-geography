<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { QuizAnswerResult, QuizSessionItem } from '@/types/quiz'
import { withAlpha } from '@/utils/quizColors'

const props = defineProps<{
  mapUrl: string
  sessionItems: QuizSessionItem[]
  corrected: boolean
  resultsByItemId: Record<string, QuizAnswerResult>
  itemColorsById: Record<string, string>
}>()

const svgMarkup = ref('')
const mapRoot = ref<HTMLElement | null>(null)
const isSpainMap = computed(() => props.mapUrl.includes('spain'))

const visibleItems = computed(() => props.sessionItems.filter((item) => !item.isHidden))

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
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="svg-quiz-map__svg" v-html="svgMarkup" />

      <div class="svg-quiz-map__overlay">
        <div
          v-for="item in visibleItems"
          :key="`visible-${item.id}`"
          class="map-label map-label--visible"
          :style="{ left: `${item.label.x}%`, top: `${item.label.y}%` }"
        >
          {{ item.name }}
        </div>
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
  width: min(100cqw, calc(100cqh * 10 / 7));
  height: min(100cqh, calc(100cqw * 7 / 10));
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  touch-action: manipulation;
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
  fill: rgba(37, 99, 235, 0.18);
  stroke: #2563eb;
  stroke-width: 1.4;
}

.svg-quiz-map__svg :deep(.map-region--correct) {
  fill: rgba(22, 163, 74, 0.28);
  stroke: #16a34a;
}

.svg-quiz-map__svg :deep(.map-region--incorrect) {
  fill: rgba(220, 38, 38, 0.22);
  stroke: #dc2626;
}

.svg-quiz-map__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.map-label {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.map-label--visible {
  font-size: clamp(0.58rem, 1.2vw, 0.72rem);
  font-weight: 600;
  color: var(--text-strong);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 6px;
  padding: 0.12rem 0.35rem;
  text-align: center;
  line-height: 1.2;
  max-width: min(22vw, 5.5rem);
}

.svg-quiz-map--spain .map-label--visible {
  font-size: clamp(0.54rem, 1vw, 0.68rem);
  max-width: min(18vw, 4.5rem);
}

@media (max-width: 900px) {
  .svg-quiz-map {
    display: block;
    width: 100%;
    height: auto;
  }

  .svg-quiz-map__canvas {
    width: 100%;
    height: auto;
    aspect-ratio: 10 / 7;
  }

  .svg-quiz-map--spain .svg-quiz-map__canvas {
    aspect-ratio: 5 / 4;
  }
}
</style>

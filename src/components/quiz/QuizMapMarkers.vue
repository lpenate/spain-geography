<script setup lang="ts">
import { computed } from 'vue'
import type { MapLabel, QuizAnswerResult, QuizSessionItem } from '@/types/quiz'
import { mapMarkerTransform, mapZoomTransform } from '@/utils/mapZoom'

const props = defineProps<{
  items: QuizSessionItem[]
  hiddenItemIndexById: Record<string, number>
  itemColorsById: Record<string, string>
  corrected: boolean
  resultsByItemId: Record<string, QuizAnswerResult>
  bounds: { left: number; top: number; width: number; height: number }
  zoomScale: number
  zoomOrigin: MapLabel
}>()

const zoomStyle = computed(() => mapZoomTransform(props.zoomScale, props.zoomOrigin))

const markerStyle = (itemId: string) => {
  if (props.corrected) {
    const result = props.resultsByItemId[itemId]
    if (result?.isCorrect) return { background: '#16a34a' }
    if (result) return { background: '#dc2626' }
  }

  const color = props.itemColorsById[itemId]
  return color ? { background: color } : undefined
}
</script>

<template>
  <div
    v-if="bounds.width > 0"
    class="quiz-map-markers"
    :style="{
      left: `${bounds.left}px`,
      top: `${bounds.top}px`,
      width: `${bounds.width}px`,
      height: `${bounds.height}px`,
    }"
  >
    <div class="quiz-map-markers__zoom" :style="zoomStyle">
      <div
        v-for="item in items"
        :key="item.id"
        class="quiz-map-markers__marker"
        :style="{
          left: `${item.label.x}%`,
          top: `${item.label.y}%`,
          transform: mapMarkerTransform(zoomScale),
          ...markerStyle(item.id),
        }"
      >
        {{ hiddenItemIndexById[item.id] }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.quiz-map-markers {
  position: absolute;
  z-index: 3;
  pointer-events: none;
  overflow: hidden;
}

.quiz-map-markers__zoom {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.25s ease;
  will-change: transform;
}

.quiz-map-markers__marker {
  position: absolute;
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  border: 2.5px solid #fff;
  box-shadow:
    0 0 0 1px rgba(15, 23, 42, 0.18),
    0 2px 6px rgba(15, 23, 42, 0.28);
}
</style>

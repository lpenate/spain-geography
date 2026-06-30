<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import SvgQuizMap from '@/components/maps/SvgQuizMap.vue'
import { useClickQuiz } from '@/composables/useClickQuiz'
import { setQuizPlayHeader } from '@/composables/useQuizPlayHeader'
import type { QuizMode, QuizSessionItem } from '@/types/quiz'
import { isMicrostateSvgPathId } from '@/utils/clickQuizMatch'
import { assetUrl } from '@/utils/assetUrl'
import {
  DEFAULT_MAP_ZOOM_STATE,
  decreaseMapZoom,
  increaseMapZoom,
  type MapZoomState,
} from '@/utils/mapZoom'

const props = defineProps<{
  mode: QuizMode
}>()

const {
  dataset,
  questions,
  currentItem,
  currentIndex,
  phase,
  timeLeft,
  timerSeconds,
  loading,
  error,
  feedback,
  interactionLocked,
  score,
  loadDataset,
  restartQuiz,
  handlePathClick,
} = useClickQuiz(() => props.mode)

const mapZoom = ref<MapZoomState>({ ...DEFAULT_MAP_ZOOM_STATE })

const sessionItems = computed<QuizSessionItem[]>(() => {
  if (!dataset.value) return []

  return dataset.value.items.map((item) => ({
    ...item,
    isHidden: true,
  }))
})

const timerProgress = computed(() => {
  if (timerSeconds.value <= 0) return 0

  return Math.max(0, Math.min(100, (timeLeft.value / timerSeconds.value) * 100))
})

const statusMessage = computed(() => {
  if (phase.value === 'finished') {
    return `Puntuación final: ${score.value.correct} / ${score.value.total}`
  }

  if (phase.value === 'feedback' && feedback.value?.state === 'correct') {
    return '¡Correcto!'
  }

  if (phase.value === 'feedback' && feedback.value?.state === 'incorrect') {
    return 'Incorrecto'
  }

  if (phase.value === 'feedback' && feedback.value?.state === 'reveal') {
    return 'Tiempo agotado'
  }

  return 'Haz clic en el país correcto del mapa'
})

const mapHeaderTitle = computed(() => {
  if (phase.value === 'finished' || !currentItem.value) return undefined

  return currentItem.value.name
})

const proximityClickTarget = computed(() => {
  if (phase.value !== 'playing' || !currentItem.value) return null
  if (!isMicrostateSvgPathId(currentItem.value.svgPathId)) return null

  return {
    answerPathId: currentItem.value.svgPathId,
    label: currentItem.value.label,
  }
})

const updateHeader = () => {
  if (!currentItem.value || phase.value === 'finished') {
    if (phase.value === 'finished') {
      setQuizPlayHeader({
        eyebrow: 'Resultado',
        title: `${score.value.correct} / ${score.value.total} aciertos`,
      })
    }
    return
  }

  setQuizPlayHeader({
    eyebrow: `Ubicación · ${timeLeft.value}s`,
    title: `¿Dónde está ${currentItem.value.name}?`,
  })
}

watch([currentItem, timeLeft, phase, score], updateHeader, { immediate: true })

onMounted(async () => {
  await loadDataset()
  updateHeader()
})

onUnmounted(() => {
  setQuizPlayHeader(null)
})

const zoomIn = () => {
  mapZoom.value = {
    scale: increaseMapZoom(mapZoom.value.scale),
    origin: mapZoom.value.origin,
  }
}

const zoomOut = () => {
  mapZoom.value = {
    scale: decreaseMapZoom(mapZoom.value.scale),
    origin: mapZoom.value.origin,
  }
}

const zoomFitAll = () => {
  mapZoom.value = { ...DEFAULT_MAP_ZOOM_STATE }
}
</script>

<template>
  <section class="click-quiz">
    <p v-if="loading" class="click-quiz__status">Cargando mapa y datos...</p>

    <p v-else-if="error" class="click-quiz__status click-quiz__status--error">
      {{ error }}
    </p>

    <div v-else-if="dataset" class="click-quiz__panel">
      <div class="click-quiz__map">
        <SvgQuizMap
          :map-url="assetUrl(dataset.map)"
          :session-items="sessionItems"
          :corrected="false"
          :results-by-item-id="{}"
          :item-colors-by-id="{}"
          :zoom-scale="mapZoom.scale"
          :zoom-origin="mapZoom.origin"
          :map-header-title="mapHeaderTitle"
          :proximity-click-target="proximityClickTarget"
          interactive
          interactive-layer="pais"
          :interaction-locked="interactionLocked"
          :map-feedback="feedback"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @zoom-fit="zoomFitAll"
          @region-click="handlePathClick"
        />
      </div>

      <aside class="click-quiz__sidebar">
        <div class="click-quiz__progress">
          <p class="click-quiz__label">Pregunta</p>
          <p class="click-quiz__value">
            {{ Math.min(currentIndex + 1, questions.length) }} / {{ questions.length }}
          </p>
        </div>

        <div v-if="phase !== 'finished'" class="click-quiz__timer" role="status" aria-live="polite">
          <div class="click-quiz__timer-head">
            <p class="click-quiz__label">Tiempo</p>
            <p class="click-quiz__value">{{ timeLeft }}s</p>
          </div>
          <div class="click-quiz__timer-track" aria-hidden="true">
            <div class="click-quiz__timer-fill" :style="{ width: `${timerProgress}%` }" />
          </div>
        </div>

        <p
          class="click-quiz__message"
          :class="{ 'click-quiz__message--finished': phase === 'finished' }"
        >
          {{ statusMessage }}
        </p>

        <button
          v-if="phase === 'finished'"
          class="button button-primary click-quiz__button"
          type="button"
          @click="restartQuiz"
        >
          Nuevo intento
        </button>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.click-quiz {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.click-quiz__status {
  margin: 0;
  color: var(--text-muted);
}

.click-quiz__status--error {
  color: var(--error);
}

.click-quiz__panel {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  flex: 1;
  min-height: 0;
}

.click-quiz__map {
  flex: 1;
  min-width: 0;
  min-height: 0;
  container-type: size;
  display: grid;
  place-items: center;
}

.click-quiz__sidebar {
  width: min(100%, 17.5rem);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.25rem;
}

.click-quiz__label {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.click-quiz__value {
  margin: 0.15rem 0 0;
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-strong);
}

.click-quiz__timer-track {
  margin-top: 0.5rem;
  height: 0.45rem;
  border-radius: 999px;
  background: #e8e8e8;
  overflow: hidden;
}

.click-quiz__timer-fill {
  height: 100%;
  background: linear-gradient(90deg, #ffe066 0%, var(--accent) 55%, #d9a600 100%);
  transition: width 1s linear;
}

.click-quiz__message {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.55;
  font-size: 0.95rem;
}

.click-quiz__message--finished {
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--text-strong);
}

.click-quiz__button {
  width: 100%;
  margin-top: auto;
}
</style>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import SvgQuizMap from '@/components/maps/SvgQuizMap.vue'
import QuizAnswerSidebar from '@/components/quiz/QuizAnswerSidebar.vue'
import QuizMapMarkers from '@/components/quiz/QuizMapMarkers.vue'
import { useMapQuiz } from '@/composables/useMapQuiz'
import type { QuizMode } from '@/types/quiz'
import { sortItemsNorthToSouth } from '@/utils/quizSession'
import { shortenLineFromEnd } from '@/utils/connectorLines'
import { assetUrl } from '@/utils/assetUrl'

interface ConnectorLine {
  itemId: string
  color: string
  x1: number
  y1: number
  x2: number
  y2: number
}

const props = defineProps<{
  mode: QuizMode
}>()

const {
  dataset,
  sessionItems,
  answers,
  corrected,
  loading,
  error,
  score,
  resultsByItemId,
  itemColorsById,
  loadDataset,
  correctAnswers,
  restartQuiz,
} = useMapQuiz(props.mode)

const panelRef = ref<HTMLElement | null>(null)
const mapComponentRef = ref<InstanceType<typeof SvgQuizMap> | null>(null)
const inputRowRefs = ref<Record<string, HTMLElement | null>>({})
const connectorLines = ref<ConnectorLine[]>([])
const panelSize = ref({ width: 0, height: 0 })
const mapBounds = ref({ left: 0, top: 0, width: 0, height: 0 })

const hiddenItems = computed(() => sessionItems.value.filter((item) => item.isHidden))

const orderedHiddenItems = computed(() => sortItemsNorthToSouth(hiddenItems.value))

const hiddenItemIndexById = computed(() =>
  Object.fromEntries(orderedHiddenItems.value.map((item, index) => [item.id, index + 1])),
)

const updateAnswers = (value: Record<string, string>) => {
  answers.value = value
}

const registerInputRow = (itemId: string, element: HTMLElement | null) => {
  inputRowRefs.value[itemId] = element
}

const updateConnectorLines = () => {
  const panel = panelRef.value
  const mapCanvas = mapComponentRef.value?.mapCanvas ?? null

  if (!panel || !mapCanvas) {
    connectorLines.value = []
    mapBounds.value = { left: 0, top: 0, width: 0, height: 0 }
    return
  }

  const panelRect = panel.getBoundingClientRect()
  panelSize.value = { width: panelRect.width, height: panelRect.height }
  const mapRect = mapCanvas.getBoundingClientRect()
  mapBounds.value = {
    left: mapRect.left - panelRect.left,
    top: mapRect.top - panelRect.top,
    width: mapRect.width,
    height: mapRect.height,
  }

  connectorLines.value = orderedHiddenItems.value
    .map((item) => {
      const row = inputRowRefs.value[item.id]
      if (!row) return null

      const rowRect = row.getBoundingClientRect()
      const indexBadge = row.querySelector('.quiz-sidebar__index')
      const anchor = indexBadge?.getBoundingClientRect() ?? rowRect

      const mapPoint = {
        x: mapRect.left - panelRect.left + (item.label.x / 100) * mapRect.width,
        y: mapRect.top - panelRect.top + (item.label.y / 100) * mapRect.height,
      }

      const segment = shortenLineFromEnd(
        {
          x: anchor.left - panelRect.left,
          y: anchor.top - panelRect.top + anchor.height / 2,
        },
        mapPoint,
      )

      return {
        itemId: item.id,
        color: itemColorsById.value[item.id] ?? '#2563eb',
        x1: segment.start.x,
        y1: segment.start.y,
        x2: segment.end.x,
        y2: segment.end.y,
      }
    })
    .filter((line): line is ConnectorLine => line !== null)
}

let resizeObserver: ResizeObserver | null = null

onMounted(async () => {
  await loadDataset()
  await nextTick()
  updateConnectorLines()

  resizeObserver = new ResizeObserver(() => updateConnectorLines())
  if (panelRef.value) resizeObserver.observe(panelRef.value)
  window.addEventListener('resize', updateConnectorLines, { passive: true })
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateConnectorLines)
})

watch(
  () => [sessionItems.value, corrected.value, loading.value, answers.value, itemColorsById.value],
  async () => {
    await nextTick()
    updateConnectorLines()
  },
  { deep: true },
)
</script>

<template>
  <section class="quiz-exercise">
    <header class="quiz-exercise__header">
      <div>
        <p class="quiz-exercise__eyebrow">
          {{ dataset?.region === 'spain' ? 'España' : 'Europa' }}
        </p>
        <h1>{{ dataset?.title ?? 'Cargando quiz...' }}</h1>
        <p class="quiz-exercise__lead">
          Completa los 10 campos de la derecha. Cada color une su input con su punto en el mapa.
        </p>
      </div>
      <RouterLink
        class="button button-secondary quiz-exercise__back"
        :to="dataset?.region === 'spain' ? '/espana' : '/europa'"
      >
        Volver
      </RouterLink>
    </header>

    <p v-if="loading" class="quiz-exercise__status">Cargando mapa y datos...</p>

    <p v-else-if="error" class="quiz-exercise__status quiz-exercise__status--error">
      {{ error }}
    </p>

    <div v-else-if="dataset" ref="panelRef" class="quiz-exercise__panel">
      <div class="quiz-exercise__map">
        <SvgQuizMap
          ref="mapComponentRef"
          :map-url="assetUrl(dataset.map)"
          :session-items="sessionItems"
          :corrected="corrected"
          :results-by-item-id="resultsByItemId"
          :item-colors-by-id="itemColorsById"
        />
      </div>

      <QuizAnswerSidebar
        :hidden-items="orderedHiddenItems"
        :hidden-item-index-by-id="hiddenItemIndexById"
        :item-colors-by-id="itemColorsById"
        :answers="answers"
        :corrected="corrected"
        :results-by-item-id="resultsByItemId"
        :score-correct="score.correct"
        :score-total="score.total"
        @update:answers="updateAnswers"
        @correct="correctAnswers"
        @restart="restartQuiz"
        @register-row="registerInputRow"
      />

      <svg
        class="quiz-exercise__connectors"
        :viewBox="`0 0 ${panelSize.width} ${panelSize.height}`"
        aria-hidden="true"
      >
        <defs>
          <marker
            v-for="line in connectorLines"
            :id="`quiz-arrowhead-${line.itemId}`"
            :key="`marker-${line.itemId}`"
            markerWidth="7"
            markerHeight="7"
            refX="6"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 Z" :fill="line.color" />
          </marker>
        </defs>
        <line
          v-for="line in connectorLines"
          :key="line.itemId"
          :x1="line.x1"
          :y1="line.y1"
          :x2="line.x2"
          :y2="line.y2"
          :stroke="line.color"
          stroke-width="2"
          stroke-dasharray="5 4"
          stroke-opacity="0.85"
          :marker-end="`url(#quiz-arrowhead-${line.itemId})`"
        />
      </svg>

      <QuizMapMarkers
        :items="orderedHiddenItems"
        :hidden-item-index-by-id="hiddenItemIndexById"
        :item-colors-by-id="itemColorsById"
        :corrected="corrected"
        :results-by-item-id="resultsByItemId"
        :bounds="mapBounds"
      />
    </div>
  </section>
</template>

<style scoped>
.quiz-exercise__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.quiz-exercise__eyebrow {
  margin: 0 0 0.35rem;
  color: var(--accent);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.quiz-exercise__header h1 {
  margin: 0 0 0.35rem;
}

.quiz-exercise__lead {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.quiz-exercise__back {
  flex-shrink: 0;
}

.quiz-exercise__status {
  margin: 0;
  color: var(--text-muted);
}

.quiz-exercise__status--error {
  color: #dc2626;
}

.quiz-exercise__panel {
  position: relative;
  display: flex;
  align-items: stretch;
  gap: 1rem;
  min-height: 420px;
  overflow: hidden;
  isolation: isolate;
}

.quiz-exercise__map {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}

.quiz-exercise__connectors {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: visible;
}

@media (max-width: 900px) {
  .quiz-exercise__panel {
    flex-direction: column;
    min-height: auto;
  }

  .quiz-exercise__map {
    min-height: 300px;
  }

  .quiz-exercise__connectors {
    display: none;
  }
}

@media (max-width: 639px) {
  .quiz-exercise__header {
    flex-direction: column;
  }

  .quiz-exercise__back {
    width: 100%;
  }
}
</style>

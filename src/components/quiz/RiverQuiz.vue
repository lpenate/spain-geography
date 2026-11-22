<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { setQuizPlayHeader } from '@/composables/useQuizPlayHeader'
import { fetchRiverDataset } from '@/services/riverData'
import type { RiverAnswerResult, RiverItem, RiverVertiente } from '@/types/river'
import { VERTIENTE_LABEL, VERTIENTE_OPTIONS } from '@/types/river'
import { assetUrl } from '@/utils/assetUrl'
import { shortenLineFromEnd } from '@/utils/connectorLines'
import {
  DEFAULT_MAP_ZOOM_STATE,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
  decreaseMapZoom,
  increaseMapZoom,
  mapMarkerTransform,
  mapZoomCenteredOn,
  mapZoomForBox,
  mapZoomLabelPosition,
  mapZoomTransform,
  type MapZoomState,
} from '@/utils/mapZoom'
import { filterExamRivers, isRiverAnswerCorrect, pickRiverRound } from '@/utils/riverSession'
import type { MapLabel } from '@/types/quiz'

const VIEWBOX_WIDTH = 1183.412
const VIEWBOX_HEIGHT = 1015.165
const STATE_CLASSES = ['is-target', 'is-correct', 'is-partial', 'is-wrong']
const COURSE_STEPS = 1000
const COURSE_MIN_ZOOM = 2.5

const dataset = ref<Awaited<ReturnType<typeof fetchRiverDataset>> | null>(null)
const round = ref<RiverItem[]>([])
const index = ref(0)
const answer = ref('')
const selectedVertiente = ref<RiverVertiente | null>(null)
const phase = ref<'playing' | 'feedback' | 'finished'>('playing')
const lastResult = ref<RiverAnswerResult | null>(null)
const totalPoints = ref(0)
const loading = ref(true)
const error = ref<string | null>(null)
const svgMarkup = ref('')
const panelRef = ref<HTMLElement | null>(null)
const mapRoot = ref<HTMLElement | null>(null)
const formRef = ref<HTMLElement | null>(null)
const answerInput = ref<HTMLInputElement | null>(null)
const mapZoom = ref<MapZoomState>({ ...DEFAULT_MAP_ZOOM_STATE })

interface ArrowLine {
  x1: number
  y1: number
  x2: number
  y2: number
  color: string
}

const connectorArrow = ref<ArrowLine | null>(null)

const current = computed(() => round.value[index.value] ?? null)
const isLake = computed(() => current.value?.type === 'lago')
// Unidades del viewBox que ocupa 1 px de pantalla sin zoom (se recalcula al redimensionar)
const unitsPerPixel = ref(1)
const measureCanvas = () => {
  const width = mapRoot.value?.getBoundingClientRect().width
  if (width) unitsPerPixel.value = VIEWBOX_WIDTH / width
}

// --hydro-px: 1 px de pantalla en unidades del SVG, ya compensado el zoom. Así el grosor
// de los ríos se define en píxeles reales y no cambia con el tamaño del mapa ni con el zoom.
const zoomStyle = computed(() => ({
  ...mapZoomTransform(mapZoom.value.scale, mapZoom.value.origin),
  '--hydro-px': String(unitsPerPixel.value / mapZoom.value.scale),
}))

// Posición del slider a lo largo del cauce y punto que recorre el río (null = ancla del build)
const courseValue = ref(COURSE_STEPS / 2)
const trackPoint = ref<MapLabel | null>(null)
const activeLabel = computed<MapLabel | null>(
  () => trackPoint.value ?? current.value?.label ?? null,
)

const markerStyle = computed(() => {
  if (!activeLabel.value) return {}

  return {
    left: `${activeLabel.value.x}%`,
    top: `${activeLabel.value.y}%`,
    transform: mapMarkerTransform(mapZoom.value.scale),
  }
})

const coursePath = (): SVGPathElement | null => {
  if (!current.value) return null
  const el = mapRoot.value?.querySelector(
    `path[data-river="${CSS.escape(current.value.id)}"][data-course]`,
  )
  return el instanceof SVGPathElement ? el : null
}

const pointOnCourse = (path: SVGPathElement, fraction: number): MapLabel => {
  const point = path.getPointAtLength(path.getTotalLength() * fraction)
  return { x: (point.x / VIEWBOX_WIDTH) * 100, y: (point.y / VIEWBOX_HEIGHT) * 100 }
}

// Coloca el slider en la posición del cauce más cercana al ancla del elemento
const syncCourseToAnchor = () => {
  trackPoint.value = null
  const path = coursePath()
  const anchor = current.value?.label
  if (!path || !anchor) return

  let best = { step: COURSE_STEPS / 2, distance: Infinity }
  for (let step = 0; step <= COURSE_STEPS; step += 5) {
    const point = pointOnCourse(path, step / COURSE_STEPS)
    const distance = Math.hypot(point.x - anchor.x, point.y - anchor.y)
    if (distance < best.distance) best = { step, distance }
  }
  courseValue.value = best.step
}

// Mover el slider desplaza el punto por el río y mantiene el mapa centrado en él
const onCourseInput = (event: Event) => {
  courseValue.value = Number((event.target as HTMLInputElement).value)
  const path = coursePath()
  if (!path) return

  trackPoint.value = pointOnCourse(path, courseValue.value / COURSE_STEPS)
  mapZoom.value = mapZoomCenteredOn(
    trackPoint.value,
    Math.max(mapZoom.value.scale, COURSE_MIN_ZOOM),
  )
}

const feedbackColorClass = computed(() => {
  if (!lastResult.value) return ''
  if (lastResult.value.score === 1) return 'feedback--correct'
  if (lastResult.value.score === 0.5) return 'feedback--partial'
  return 'feedback--wrong'
})

const feedbackText = computed(() => {
  if (!current.value || !lastResult.value || phase.value !== 'feedback') return ''

  const vLabel = VERTIENTE_LABEL[current.value.vertiente]
  const prefix = isLake.value ? '' : 'el río '

  if (lastResult.value.score === 1) {
    return `+1 pto (100%): ¡Acierto completo! Es ${prefix}${current.value.name}, vertiente ${vLabel}.`
  }

  if (lastResult.value.score === 0.5) {
    return `+0,5 ptos (50%): ¡Nombre correcto (${current.value.name})!, pero la vertiente es ${vLabel}.`
  }

  return `0 ptos: Era ${prefix}${current.value.name}, de la vertiente ${vLabel}.`
})

const updateConnectorArrow = () => {
  const panel = panelRef.value
  const mapCanvas = mapRoot.value
  const formEl = formRef.value

  if (!panel || !mapCanvas || !activeLabel.value || phase.value === 'finished') {
    connectorArrow.value = null
    return
  }

  const panelRect = panel.getBoundingClientRect()
  const mapRect = mapCanvas.getBoundingClientRect()
  const formRect = formEl ? formEl.getBoundingClientRect() : null

  const zoomedLabel = mapZoomLabelPosition(
    mapZoom.value.scale,
    mapZoom.value.origin,
    activeLabel.value,
  )

  const mapPoint = {
    x: mapRect.left - panelRect.left + (zoomedLabel.x / 100) * mapRect.width,
    y: mapRect.top - panelRect.top + (zoomedLabel.y / 100) * mapRect.height,
  }

  const startPoint = {
    x: formRect ? formRect.left - panelRect.left : panelRect.width - 260,
    y: formRect ? formRect.top - panelRect.top + 45 : panelRect.height / 2,
  }

  // Acortamos para que la flecha aterrice justo antes del círculo del marcador
  const segment = shortenLineFromEnd(startPoint, mapPoint, 16)

  let color = '#2563eb'
  if (phase.value === 'feedback' && lastResult.value) {
    if (lastResult.value.score === 1) color = '#16a34a'
    else if (lastResult.value.score === 0.5) color = '#ea580c'
    else color = '#dc2626'
  }

  connectorArrow.value = {
    x1: segment.start.x,
    y1: segment.start.y,
    x2: segment.end.x,
    y2: segment.end.y,
    color,
  }
}

const paintFeature = () => {
  const svg = mapRoot.value?.querySelector('svg')
  if (!svg) return

  svg.querySelectorAll('.hydro').forEach((node) => node.classList.remove(...STATE_CLASSES))

  if (!current.value || phase.value === 'finished') return

  const pieces = svg.querySelectorAll(`[data-river="${CSS.escape(current.value.id)}"]`)
  if (!pieces.length) return

  let stateClass = 'is-target'
  if (phase.value === 'feedback' && lastResult.value) {
    if (lastResult.value.score === 1) stateClass = 'is-correct'
    else if (lastResult.value.score === 0.5) stateClass = 'is-partial'
    else stateClass = 'is-wrong'
  }

  pieces.forEach((piece) => {
    piece.classList.add(stateClass)
    // Al final del grupo para que el resaltado quede por encima de otros ríos
    piece.parentNode?.appendChild(piece)
  })
}

const focusQuestion = (item: RiverItem | null) => {
  if (!item) {
    mapZoom.value = { ...DEFAULT_MAP_ZOOM_STATE }
    return
  }

  const box = {
    x0: (item.bbox.x0 / VIEWBOX_WIDTH) * 100,
    y0: (item.bbox.y0 / VIEWBOX_HEIGHT) * 100,
    x1: (item.bbox.x1 / VIEWBOX_WIDTH) * 100,
    y1: (item.bbox.y1 / VIEWBOX_HEIGHT) * 100,
  }
  mapZoom.value = mapZoomForBox(box, item.type === 'lago' ? 3 : 4)
}

const startRound = () => {
  if (!dataset.value) return

  round.value = pickRiverRound(filterExamRivers(dataset.value.items))
  index.value = 0
  answer.value = ''
  selectedVertiente.value = null
  totalPoints.value = 0
  lastResult.value = null
  phase.value = 'playing'
  focusQuestion(round.value[0] ?? null)
  nextTick(() => {
    updateConnectorArrow()
    answerInput.value?.focus()
  })
}

const updateHeader = () => {
  if (phase.value === 'finished') {
    const totalMax = round.value.length
    const pct = totalMax > 0 ? Math.round((totalPoints.value / totalMax) * 100) : 0
    setQuizPlayHeader({
      eyebrow: 'Resultado',
      title: `${totalPoints.value} / ${totalMax} puntos (${pct}%)`,
    })
    return
  }

  if (!current.value) return

  setQuizPlayHeader({
    eyebrow: `Ríos · ${index.value + 1} de ${round.value.length}`,
    title:
      phase.value === 'feedback'
        ? current.value.name
        : isLake.value
          ? '¿Cómo se llama este lago o laguna?'
          : '¿Cómo se llama este río?',
  })
}

const submitAnswer = () => {
  if (
    phase.value !== 'playing' ||
    !current.value ||
    !answer.value.trim() ||
    !selectedVertiente.value
  )
    return

  const result = isRiverAnswerCorrect(current.value, answer.value, selectedVertiente.value)
  lastResult.value = result
  totalPoints.value += result.score
  phase.value = 'feedback'
  nextTick(updateConnectorArrow)
}

const goNext = () => {
  if (phase.value !== 'feedback') return

  if (index.value >= round.value.length - 1) {
    phase.value = 'finished'
    focusQuestion(null)
    connectorArrow.value = null
    return
  }

  index.value += 1
  answer.value = ''
  selectedVertiente.value = null
  lastResult.value = null
  phase.value = 'playing'
  focusQuestion(current.value)
  nextTick(() => {
    updateConnectorArrow()
    answerInput.value?.focus()
  })
}

const zoomIn = () => {
  const scale = increaseMapZoom(mapZoom.value.scale)
  mapZoom.value = trackPoint.value
    ? mapZoomCenteredOn(trackPoint.value, scale)
    : { scale, origin: current.value?.label ?? mapZoom.value.origin }
}

const zoomOut = () => {
  const nextScale = decreaseMapZoom(mapZoom.value.scale)
  if (trackPoint.value && nextScale > MAP_MIN_ZOOM) {
    mapZoom.value = mapZoomCenteredOn(trackPoint.value, nextScale)
    return
  }
  mapZoom.value = {
    scale: nextScale,
    origin: nextScale === MAP_MIN_ZOOM ? DEFAULT_MAP_ZOOM_STATE.origin : mapZoom.value.origin,
  }
}

const zoomFitAll = () => {
  mapZoom.value = { ...DEFAULT_MAP_ZOOM_STATE }
}

let resizeObserver: ResizeObserver | null = null

watch([current, phase, totalPoints], updateHeader, { immediate: true })

watch([current, phase, mapZoom, trackPoint], async () => {
  await nextTick()
  updateConnectorArrow()
  paintFeature()
})

// Nueva pregunta: el punto vuelve al ancla. Al corregir se conserva donde lo dejó el slider.
watch(current, async () => {
  await nextTick()
  syncCourseToAnchor()
})

// Solo al cambiar de pregunta o de fase: el slider no debe perder el foco al moverlo
watch([current, phase], async () => {
  await nextTick()
  if (phase.value === 'playing') answerInput.value?.focus()
})

onMounted(async () => {
  try {
    const [nextDataset, mapResponse] = await Promise.all([
      fetchRiverDataset(),
      fetch(assetUrl('/maps/spain-rios.svg')),
    ])

    if (!mapResponse.ok) throw new Error('No se pudo cargar el mapa de ríos')

    dataset.value = nextDataset
    svgMarkup.value = await mapResponse.text()
    // El panel (y el SVG inline) solo existe cuando loading es false: hay que pintarlo antes de empezar
    loading.value = false
    await nextTick()
    startRound()
    await nextTick()
    updateHeader()
    measureCanvas()
    updateConnectorArrow()
    paintFeature()
    syncCourseToAnchor()

    resizeObserver = new ResizeObserver(() => {
      measureCanvas()
      updateConnectorArrow()
    })
    if (panelRef.value) resizeObserver.observe(panelRef.value)
    window.addEventListener('resize', updateConnectorArrow, { passive: true })
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el mapa de ríos'
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateConnectorArrow)
  setQuizPlayHeader(null)
})
</script>

<template>
  <section class="river-quiz">
    <p v-if="loading" class="river-quiz__status">Cargando mapa físico y datos...</p>
    <p v-else-if="error" class="river-quiz__status river-quiz__status--error" role="alert">
      {{ error }}
    </p>

    <div v-else ref="panelRef" class="river-quiz__panel">
      <!-- Overlay SVG de la flecha conector desde el input al punto -->
      <svg v-if="connectorArrow" class="river-quiz__connectors-layer" aria-hidden="true">
        <defs>
          <marker
            id="arrow-marker"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" :fill="connectorArrow.color" />
          </marker>
        </defs>
        <line
          :x1="connectorArrow.x1"
          :y1="connectorArrow.y1"
          :x2="connectorArrow.x2"
          :y2="connectorArrow.y2"
          :stroke="connectorArrow.color"
          stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="6 4"
          marker-end="url(#arrow-marker)"
        />
      </svg>

      <div class="river-quiz__map">
        <div ref="mapRoot" class="river-quiz__canvas">
          <div class="river-quiz__zoom" :style="zoomStyle">
            <!-- eslint-disable vue/no-v-html, vue/html-self-closing -- SVG del mapa físico de España -->
            <div class="river-quiz__svg" v-html="svgMarkup" />
            <!-- eslint-enable vue/no-v-html, vue/html-self-closing -->

            <!-- Marcador del punto sobre el río / lago -->
            <div
              v-if="current && phase !== 'finished'"
              class="river-quiz__point-target"
              :class="{
                'river-quiz__point-target--correct':
                  phase === 'feedback' && lastResult?.score === 1,
                'river-quiz__point-target--partial':
                  phase === 'feedback' && lastResult?.score === 0.5,
                'river-quiz__point-target--wrong': phase === 'feedback' && lastResult?.score === 0,
              }"
              :style="markerStyle"
            >
              <span class="target-ring" />
              <span class="target-core" />
            </div>

            <!-- Nombre revelado al corregir -->
            <span
              v-if="current && phase === 'feedback'"
              class="river-quiz__revealed-name"
              :style="markerStyle"
            >
              {{ current.name }}
            </span>
          </div>

          <div class="river-quiz__controls" role="toolbar" aria-label="Controles de zoom del mapa">
            <button
              class="river-quiz__control"
              type="button"
              aria-label="Acercar mapa"
              :disabled="mapZoom.scale >= MAP_MAX_ZOOM"
              @click="zoomIn"
            >
              +
            </button>
            <button
              class="river-quiz__control"
              type="button"
              aria-label="Alejar mapa"
              :disabled="mapZoom.scale <= MAP_MIN_ZOOM"
              @click="zoomOut"
            >
              −
            </button>
            <button
              class="river-quiz__control"
              type="button"
              aria-label="Mostrar todo el mapa"
              :disabled="mapZoom.scale <= MAP_MIN_ZOOM"
              @click="zoomFitAll"
            >
              Todo
            </button>
          </div>

          <label v-if="current && !isLake && phase !== 'finished'" class="river-quiz__course">
            <span class="river-quiz__course-text">Recorre el cauce</span>
            <input
              :value="courseValue"
              class="river-quiz__course-input"
              type="range"
              min="0"
              :max="COURSE_STEPS"
              step="1"
              aria-label="Mover el punto a lo largo del río"
              @input="onCourseInput"
            />
          </label>

          <p v-if="dataset" class="river-quiz__attribution">{{ dataset.attribution }}</p>
        </div>
      </div>

      <aside class="river-quiz__sidebar">
        <div class="river-quiz__score-box">
          <div>
            <p class="river-quiz__label">Progreso</p>
            <p class="river-quiz__value">
              {{ phase === 'finished' ? round.length : index + 1 }} / {{ round.length }}
            </p>
          </div>
          <div>
            <p class="river-quiz__label">Puntos</p>
            <p class="river-quiz__value">{{ totalPoints }} / {{ round.length }}</p>
          </div>
        </div>

        <form
          v-if="phase === 'playing'"
          ref="formRef"
          class="river-quiz__form"
          @submit.prevent="submitAnswer"
        >
          <div class="river-quiz__field">
            <label class="river-quiz__label" for="river-answer">
              {{ isLake ? 'Nombre del lago o laguna' : 'Nombre del río' }}
            </label>
            <input
              id="river-answer"
              ref="answerInput"
              v-model="answer"
              class="river-quiz__input"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              :placeholder="
                isLake ? 'Escribe el nombre del lago...' : 'Escribe el nombre del río...'
              "
            />
          </div>

          <div class="river-quiz__field">
            <fieldset class="river-quiz__fieldset">
              <legend class="river-quiz__label">Vertiente (obligatorio)</legend>
              <div class="river-quiz__radios" role="radiogroup">
                <label
                  v-for="opt in VERTIENTE_OPTIONS"
                  :key="opt.id"
                  class="river-quiz__radio-label"
                  :class="{
                    'river-quiz__radio-label--active': selectedVertiente === opt.id,
                    [`river-quiz__radio-label--${opt.id}`]: selectedVertiente === opt.id,
                  }"
                >
                  <input
                    v-model="selectedVertiente"
                    type="radio"
                    name="vertiente"
                    :value="opt.id"
                    class="river-quiz__radio-input"
                  />
                  <span class="swatch" :class="`swatch--${opt.id}`" />
                  <span class="river-quiz__radio-text">{{ opt.label }}</span>
                </label>
              </div>
            </fieldset>
          </div>

          <button
            class="button button-primary river-quiz__button"
            type="submit"
            :disabled="!answer.trim() || !selectedVertiente"
          >
            Comprobar
          </button>
        </form>

        <div v-else-if="phase === 'feedback'" ref="formRef" class="river-quiz__feedback">
          <p class="river-quiz__message" :class="feedbackColorClass" role="status">
            {{ feedbackText }}
          </p>
          <button class="button button-primary river-quiz__button" type="button" @click="goNext">
            {{ index >= round.length - 1 ? 'Ver resultado' : 'Siguiente' }}
          </button>
        </div>

        <div v-else class="river-quiz__feedback">
          <div class="river-quiz__summary-card">
            <p class="river-quiz__summary-title">Resultado final</p>
            <p class="river-quiz__summary-score">{{ totalPoints }} de {{ round.length }} puntos</p>
            <p class="river-quiz__summary-pct">
              {{ Math.round((totalPoints / round.length) * 100) }}% de acierto
            </p>
          </div>
          <button
            class="button button-primary river-quiz__button"
            type="button"
            @click="startRound"
          >
            Otro test
          </button>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.river-quiz {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
}

.river-quiz__status {
  margin: 0;
  color: var(--text-muted);
}

.river-quiz__status--error {
  color: var(--error);
}

.river-quiz__panel {
  display: flex;
  align-items: stretch;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  position: relative;
}

.river-quiz__connectors-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
}

.river-quiz__map {
  flex: 1;
  min-width: 0;
  min-height: 0;
  container-type: size;
}

.river-quiz__canvas {
  position: relative;
  width: min(100cqw, calc(100cqh * 1183.412 / 1015.165));
  height: min(100cqh, calc(100cqw * 1015.165 / 1183.412));
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: #c6ecff;
}

.river-quiz__zoom {
  width: 100%;
  height: 100%;
  position: relative;
  transition: transform 0.25s ease;
}

.river-quiz__svg,
.river-quiz__svg :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}

/* Hidrografía del SVG inline: el grosor se divide por el zoom para que no engorde */
.river-quiz__svg :deep(.hydro--context) {
  opacity: 0.35;
}

.river-quiz__svg :deep(.hydro--rio) {
  fill: none;
  stroke: #0978ab;
  stroke-width: calc(2.5 * var(--hydro-px, 1));
  stroke-linecap: round;
  stroke-linejoin: round;
}

.river-quiz__svg :deep(.hydro--lago) {
  fill: #6fc3ec;
  stroke: #0978ab;
  stroke-width: calc(1.5 * var(--hydro-px, 1));
}

.river-quiz__svg :deep(.hydro.is-target) {
  stroke: #2563eb;
  stroke-width: calc(6 * var(--hydro-px, 1));
  animation: hydro-pulse 1.6s ease-in-out infinite;
}

.river-quiz__svg :deep(.hydro--lago.is-target) {
  fill: #2563eb;
}

.river-quiz__svg :deep(.hydro.is-correct) {
  stroke: #16a34a;
  stroke-width: calc(6 * var(--hydro-px, 1));
}

.river-quiz__svg :deep(.hydro.is-partial) {
  stroke: #ea580c;
  stroke-width: calc(6 * var(--hydro-px, 1));
}

.river-quiz__svg :deep(.hydro.is-wrong) {
  stroke: #dc2626;
  stroke-width: calc(6 * var(--hydro-px, 1));
}

.river-quiz__svg :deep(.hydro--lago.is-correct) {
  fill: #16a34a;
}

.river-quiz__svg :deep(.hydro--lago.is-partial) {
  fill: #ea580c;
}

.river-quiz__svg :deep(.hydro--lago.is-wrong) {
  fill: #dc2626;
}

@keyframes hydro-pulse {
  50% {
    stroke-opacity: 0.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .river-quiz__svg :deep(.hydro.is-target) {
    animation: none;
  }
}

.river-quiz__course {
  position: absolute;
  left: 50%;
  bottom: 1.6rem;
  z-index: 6;
  transform: translateX(-50%);
  width: min(70%, 26rem);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.river-quiz__course-text {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  white-space: nowrap;
  color: var(--text-muted);
}

.river-quiz__course-input {
  flex: 1;
  min-width: 0;
  min-height: 1.75rem;
  accent-color: #2563eb;
  cursor: pointer;
}

@media (max-width: 600px) {
  .river-quiz__course {
    width: calc(100% - 1rem);
    bottom: 1.4rem;
  }

  .river-quiz__course-text {
    display: none;
  }
}

.river-quiz__attribution {
  position: absolute;
  left: 0.4rem;
  bottom: 0.3rem;
  z-index: 6;
  margin: 0;
  padding: 0.1rem 0.35rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.8);
  font-size: 0.65rem;
  color: var(--text-muted);
}

.river-quiz__point-target {
  position: absolute;
  width: 1.8rem;
  height: 1.8rem;
  z-index: 4;
  pointer-events: none;
  display: grid;
  place-items: center;
}

.target-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 3px solid #2563eb;
  background: rgba(37, 99, 235, 0.2);
  animation: pulse-ring 1.8s cubic-bezier(0.2, 0.8, 0.2, 1) infinite;
}

.target-core {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  background: #2563eb;
  border: 2px solid #ffffff;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
}

.river-quiz__point-target--correct .target-ring {
  border-color: var(--success);
  background: rgba(22, 163, 74, 0.25);
  animation: none;
}

.river-quiz__point-target--correct .target-core {
  background: var(--success);
}

.river-quiz__point-target--partial .target-ring {
  border-color: #ea580c;
  background: rgba(234, 88, 12, 0.25);
  animation: none;
}

.river-quiz__point-target--partial .target-core {
  background: #ea580c;
}

.river-quiz__point-target--wrong .target-ring {
  border-color: var(--error);
  background: rgba(220, 38, 38, 0.25);
  animation: none;
}

.river-quiz__point-target--wrong .target-core {
  background: var(--error);
}

@keyframes pulse-ring {
  0% {
    transform: scale(0.85);
    opacity: 0.9;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.3;
  }
  100% {
    transform: scale(0.85);
    opacity: 0.9;
  }
}

.river-quiz__revealed-name {
  position: absolute;
  z-index: 5;
  pointer-events: none;
  margin-top: 1.4rem;
  padding: 0.2rem 0.5rem;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  white-space: nowrap;
}

.river-quiz__controls {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  z-index: 6;
  display: flex;
  gap: 0.4rem;
}

.river-quiz__control {
  min-width: 2.4rem;
  min-height: 2.4rem;
  padding: 0 0.55rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.95);
  font-family: var(--font-display);
  font-weight: 700;
  cursor: pointer;
}

.river-quiz__control:disabled {
  opacity: 0.45;
  cursor: default;
}

.river-quiz__sidebar {
  width: min(100%, 20rem);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding-top: 0.25rem;
}

.river-quiz__score-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: var(--surface-raised, #f8fafc);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.river-quiz__label {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.river-quiz__value {
  margin: 0.15rem 0 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 700;
}

.river-quiz__form,
.river-quiz__feedback {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.river-quiz__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.river-quiz__fieldset {
  margin: 0;
  padding: 0;
  border: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.river-quiz__input {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0.65rem 0.8rem;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  font: inherit;
  transition: border-color 0.2s ease;
}

.river-quiz__input:focus {
  border-color: #2563eb;
  outline: none;
}

.river-quiz__radios {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.river-quiz__radio-label {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0.75rem;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  background: #ffffff;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.river-quiz__radio-label:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.river-quiz__radio-input {
  width: 1.15rem;
  height: 1.15rem;
  accent-color: #2563eb;
  cursor: pointer;
}

.river-quiz__radio-label--active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1e3a8a;
}

.river-quiz__radio-label--cantabrica.river-quiz__radio-label--active {
  border-color: #16a34a;
  background: #f0fdf4;
  color: #14532d;
}
.river-quiz__radio-label--cantabrica .river-quiz__radio-input {
  accent-color: #16a34a;
}

.river-quiz__radio-label--atlantica.river-quiz__radio-label--active {
  border-color: #0284c7;
  background: #f0f9ff;
  color: #0c4a6e;
}
.river-quiz__radio-label--atlantica .river-quiz__radio-input {
  accent-color: #0284c7;
}

.river-quiz__radio-label--mediterranea.river-quiz__radio-label--active {
  border-color: #9333ea;
  background: #faf5ff;
  color: #581c87;
}
.river-quiz__radio-label--mediterranea .river-quiz__radio-input {
  accent-color: #9333ea;
}

.swatch {
  width: 0.85rem;
  height: 0.85rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.swatch--cantabrica {
  background: #16a34a;
}

.swatch--atlantica {
  background: #0284c7;
}

.swatch--mediterranea {
  background: #9333ea;
}

.river-quiz__button {
  width: 100%;
}

.river-quiz__message {
  margin: 0;
  line-height: 1.5;
  padding: 0.85rem;
  border-radius: var(--radius-sm);
  background: #f1f5f9;
}

.feedback--correct {
  color: #15803d;
  background: #f0fdf4;
  border-left: 4px solid #16a34a;
  font-weight: 700;
}

.feedback--partial {
  color: #c2410c;
  background: #fff7ed;
  border-left: 4px solid #ea580c;
  font-weight: 600;
}

.feedback--wrong {
  color: #b91c1c;
  background: #fef2f2;
  border-left: 4px solid #dc2626;
  font-weight: 700;
}

.river-quiz__summary-card {
  padding: 1.25rem;
  border-radius: var(--radius-sm);
  background: #f8fafc;
  border: 1px solid var(--border);
  text-align: center;
}

.river-quiz__summary-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.river-quiz__summary-score {
  margin: 0.4rem 0 0.15rem;
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
}

.river-quiz__summary-pct {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-muted);
}
</style>

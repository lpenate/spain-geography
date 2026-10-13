<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { fetchGentilicioDataset } from '@/services/gentilicioData'
import type { GentilicioAnswerResult, GentilicioItem } from '@/types/gentilicio'
import {
  GENTILICIO_ROUND_SIZE,
  applyGentilicioResults,
  countGentilicioScore,
  evaluateGentilicioAnswers,
  gentilicioKindLabel,
  pickGentilicioRound,
  promptPlaceLabel,
  readGentilicioMistakes,
  writeGentilicioMistakes,
} from '@/utils/gentilicioSession'

const items = ref<GentilicioItem[]>([])
const round = ref<GentilicioItem[]>([])
const answers = ref<Record<string, string>>({})
const results = ref<GentilicioAnswerResult[]>([])
const corrected = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)
const prioritizedCount = ref(0)

const resultsByItemId = computed(() =>
  Object.fromEntries(results.value.map((result) => [result.itemId, result])),
)

const score = computed(() => countGentilicioScore(results.value))

const priorityLabel = computed(() => {
  if (prioritizedCount.value === 1) {
    return 'Incluye 1 gentilicio que fallaste antes.'
  }

  return `Incluye ${prioritizedCount.value} gentilicios que fallaste antes.`
})

const startRound = () => {
  const mistakes = readGentilicioMistakes()
  const nextRound = pickGentilicioRound(items.value, mistakes, GENTILICIO_ROUND_SIZE)

  round.value = nextRound
  answers.value = Object.fromEntries(nextRound.map((entry) => [entry.id, '']))
  results.value = []
  corrected.value = false
  prioritizedCount.value = nextRound.filter((entry) => (mistakes[entry.id] ?? 0) > 0).length
}

const updateAnswer = (itemId: string, value: string) => {
  answers.value = {
    ...answers.value,
    [itemId]: value,
  }
}

const correctRound = () => {
  if (corrected.value || round.value.length === 0) return

  const nextResults = evaluateGentilicioAnswers(round.value, answers.value)
  writeGentilicioMistakes(applyGentilicioResults(readGentilicioMistakes(), nextResults))
  results.value = nextResults
  corrected.value = true
}

onMounted(async () => {
  try {
    const dataset = await fetchGentilicioDataset()
    items.value = dataset.items
    startRound()
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'No se pudo cargar el test de gentilicios'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="gentilicio">
    <p class="gentilicio__lead">
      Cada test tiene {{ GENTILICIO_ROUND_SIZE }} preguntas. Se muestra una localidad, provincia o
      comunidad y debes escribir su gentilicio.
    </p>

    <p v-if="loading" class="gentilicio__status">Cargando gentilicios…</p>
    <p v-else-if="error" class="gentilicio__status gentilicio__status--error" role="alert">
      {{ error }}
    </p>

    <form v-else class="gentilicio__form" @submit.prevent="correctRound">
      <p class="gentilicio__meta" aria-live="polite">
        {{ round.length }} / {{ GENTILICIO_ROUND_SIZE }} preguntas
      </p>
      <p v-if="prioritizedCount > 0" class="gentilicio__priority">{{ priorityLabel }}</p>

      <ol class="gentilicio__list">
        <li v-for="(entry, index) in round" :key="entry.id" class="gentilicio__item">
          <label class="gentilicio__label" :for="`gentilicio-${entry.id}`">
            <span class="gentilicio__index">{{ index + 1 }}</span>
            <span class="gentilicio__prompt">
              <span class="gentilicio__name">{{ promptPlaceLabel(entry) }}</span>
              <span class="gentilicio__kind">{{ gentilicioKindLabel(entry.kind) }}</span>
            </span>
          </label>

          <div class="gentilicio__field">
            <input
              :id="`gentilicio-${entry.id}`"
              :value="answers[entry.id] ?? ''"
              class="gentilicio__input"
              :class="{
                'gentilicio__input--correct': corrected && resultsByItemId[entry.id]?.isCorrect,
                'gentilicio__input--incorrect': corrected && !resultsByItemId[entry.id]?.isCorrect,
              }"
              type="text"
              autocomplete="off"
              autocapitalize="off"
              spellcheck="false"
              placeholder="Gentilicio"
              :readonly="corrected"
              @input="updateAnswer(entry.id, ($event.target as HTMLInputElement).value)"
            />
            <p
              v-if="corrected && !resultsByItemId[entry.id]?.isCorrect"
              class="gentilicio__feedback"
            >
              Respuesta correcta: {{ resultsByItemId[entry.id]?.expectedAnswer }}
            </p>
          </div>
        </li>
      </ol>

      <div class="gentilicio__actions">
        <button class="button button-primary" type="submit" :disabled="corrected">Corregir</button>
        <button class="button button-secondary" type="button" @click="startRound">
          Nuevo test
        </button>
      </div>

      <p v-if="corrected" class="gentilicio__score" role="status">
        <span class="gentilicio__score-caption">Puntuación</span>
        <span class="gentilicio__score-value">{{ score }}</span>
        <span class="gentilicio__score-total">/ {{ round.length }}</span>
        <span v-if="score === round.length" class="gentilicio__score-note">Todo correcto.</span>
      </p>
    </form>
  </section>
</template>

<style scoped>
.gentilicio {
  width: min(100%, 40rem);
  padding-bottom: 1rem;
}

.gentilicio__lead,
.gentilicio__status {
  margin: 0 0 1.25rem;
  color: var(--text-muted);
  line-height: 1.6;
}

.gentilicio__status--error {
  color: var(--error);
}

.gentilicio__meta {
  margin: 0 0 0.75rem;
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-strong);
}

.gentilicio__priority {
  margin: 0 0 1rem;
  padding: 0.75rem 0.9rem;
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  color: var(--text-strong);
  font-size: 0.95rem;
}

.gentilicio__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.gentilicio__item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.45rem;
  padding-bottom: 0.85rem;
  border-bottom: 1px solid var(--border);
}

@media (min-width: 640px) {
  .gentilicio__item {
    grid-template-columns: minmax(14rem, 1.1fr) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }
}

.gentilicio__label {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  min-height: var(--touch-target);
}

.gentilicio__index {
  display: inline-grid;
  place-items: center;
  width: 1.7rem;
  height: 1.7rem;
  flex-shrink: 0;
  background: var(--accent-strong);
  color: var(--accent);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.85rem;
}

.gentilicio__prompt {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.gentilicio__name {
  font-family: var(--font-display);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.1;
}

.gentilicio__kind {
  color: var(--text-muted);
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.gentilicio__input {
  width: 100%;
  min-height: var(--touch-target);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.55rem 0.7rem;
  font: inherit;
  font-size: 16px;
  color: var(--text-strong);
  background: var(--surface);
}

.gentilicio__input:focus {
  outline: 2px solid var(--accent-soft);
  outline-offset: 1px;
  border-color: var(--accent-strong);
}

.gentilicio__input--correct {
  border-color: var(--success);
  background: var(--success-soft);
}

.gentilicio__input--incorrect {
  border-color: var(--error);
  background: var(--error-soft);
}

.gentilicio__feedback {
  margin: 0.35rem 0 0;
  color: var(--success);
  font-size: 0.92rem;
  font-weight: 600;
}

.gentilicio__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.25rem;
}

.gentilicio__score {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.55rem;
  margin: 1.25rem 0 0;
  padding-top: 1rem;
  border-top: 3px solid var(--accent);
}

.gentilicio__score-caption,
.gentilicio__score-total,
.gentilicio__score-note {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.gentilicio__score-caption {
  width: 100%;
  font-size: 0.78rem;
}

.gentilicio__score-value {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 3.5rem);
  font-weight: 700;
  line-height: 0.9;
}

.gentilicio__score-total {
  font-size: 1.25rem;
}

.gentilicio__score-note {
  color: var(--success);
  font-size: 0.95rem;
}
</style>

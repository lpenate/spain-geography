<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchGentilicioDataset } from '@/services/gentilicioData'
import type { GentilicioAnswerResult, GentilicioItem } from '@/types/gentilicio'
import {
  GENTILICIO_ROUND_SIZE,
  type GentilicioViewMode,
  applyGentilicioResults,
  countGentilicioScore,
  evaluateGentilicioAnswers,
  filterGentiliciosForReview,
  formatExpectedAnswer,
  gentilicioKindLabel,
  pickGentilicioRound,
  promptPlaceLabel,
  readGentilicioMistakes,
  writeGentilicioMistakes,
} from '@/utils/gentilicioSession'

const route = useRoute()
const router = useRouter()

const items = ref<GentilicioItem[]>([])
const round = ref<GentilicioItem[]>([])
const answers = ref<Record<string, string>>({})
const results = ref<GentilicioAnswerResult[]>([])
const corrected = ref(false)
const loading = ref(true)
const error = ref<string | null>(null)
const prioritizedCount = ref(0)
const reviewQuery = ref('')

const viewMode = computed<GentilicioViewMode>(() =>
  route.query.vista === 'repaso' ? 'repaso' : 'test',
)

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

const reviewItems = computed(() => filterGentiliciosForReview(items.value, reviewQuery.value))

const setViewMode = (mode: GentilicioViewMode) => {
  const query = mode === 'repaso' ? { vista: 'repaso' } : {}
  void router.replace({ query })
}

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

watch(viewMode, (mode) => {
  if (mode === 'test' && round.value.length === 0 && items.value.length > 0) {
    startRound()
  }
})

onMounted(async () => {
  try {
    const dataset = await fetchGentilicioDataset()
    items.value = dataset.items
    startRound()
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : 'No se pudo cargar el test de gentilicios'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="gentilicio">
    <div class="gentilicio__tabs" role="tablist" aria-label="Modo de gentilicios">
      <button
        type="button"
        role="tab"
        class="gentilicio__tab"
        :class="{ 'gentilicio__tab--active': viewMode === 'test' }"
        :aria-selected="viewMode === 'test'"
        @click="setViewMode('test')"
      >
        Test
      </button>
      <button
        type="button"
        role="tab"
        class="gentilicio__tab"
        :class="{ 'gentilicio__tab--active': viewMode === 'repaso' }"
        :aria-selected="viewMode === 'repaso'"
        @click="setViewMode('repaso')"
      >
        Repaso
      </button>
    </div>

    <p v-if="loading" class="gentilicio__status">Cargando gentilicios…</p>
    <p v-else-if="error" class="gentilicio__status gentilicio__status--error" role="alert">
      {{ error }}
    </p>

    <template v-else-if="viewMode === 'repaso'">
      <p class="gentilicio__lead">
        Lista completa para estudiar: lugar y gentilicio. Usa el buscador para filtrar.
      </p>

      <label class="gentilicio__search">
        <span class="gentilicio__search-label">Buscar</span>
        <input
          v-model="reviewQuery"
          class="gentilicio__input gentilicio__search-input"
          type="search"
          enterkeyhint="search"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="Lugar o gentilicio"
        />
      </label>

      <p class="gentilicio__meta">{{ reviewItems.length }} / {{ items.length }} gentilicios</p>

      <ul class="gentilicio__review-list">
        <li v-for="entry in reviewItems" :key="entry.id" class="gentilicio__review-item">
          <div class="gentilicio__review-place">
            <span class="gentilicio__name">{{ promptPlaceLabel(entry) }}</span>
            <span class="gentilicio__kind">{{ gentilicioKindLabel(entry.kind) }}</span>
          </div>
          <p class="gentilicio__review-answer">{{ formatExpectedAnswer(entry) }}</p>
        </li>
      </ul>

      <p v-if="reviewItems.length === 0" class="gentilicio__status">
        No hay resultados para esa búsqueda.
      </p>
    </template>

    <form v-else class="gentilicio__form" @submit.prevent="correctRound">
      <p class="gentilicio__lead">
        {{ GENTILICIO_ROUND_SIZE }} preguntas: escribe el gentilicio de cada lugar y pulsa corregir.
      </p>

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
              enterkeyhint="next"
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
        <button
          class="button button-primary gentilicio__action"
          type="submit"
          :disabled="corrected"
        >
          Corregir
        </button>
        <button
          class="button button-secondary gentilicio__action"
          type="button"
          @click="startRound"
        >
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
  max-width: 100%;
  padding-bottom: max(5.5rem, calc(1rem + env(safe-area-inset-bottom)));
}

.gentilicio__tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.35rem;
  margin: 0 0 1rem;
  padding: 0.3rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-muted);
}

.gentilicio__tab {
  min-height: var(--touch-target);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-muted);
  font-family: var(--font-display);
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  touch-action: manipulation;
}

.gentilicio__tab--active {
  background: var(--accent-strong);
  color: var(--accent);
}

.gentilicio__lead,
.gentilicio__status {
  margin: 0 0 1rem;
  color: var(--text-muted);
  line-height: 1.55;
  font-size: 0.98rem;
}

.gentilicio__status--error {
  color: var(--error);
}

.gentilicio__search {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin: 0 0 0.85rem;
}

.gentilicio__search-label {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.gentilicio__meta {
  margin: 0 0 0.75rem;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-strong);
}

.gentilicio__priority {
  margin: 0 0 1rem;
  padding: 0.7rem 0.8rem;
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  color: var(--text-strong);
  font-size: 0.92rem;
  line-height: 1.4;
}

.gentilicio__list,
.gentilicio__review-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.gentilicio__item,
.gentilicio__review-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.4rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

@media (min-width: 640px) {
  .gentilicio {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }

  .gentilicio__item {
    grid-template-columns: minmax(12rem, 1.1fr) minmax(0, 1fr);
    gap: 1rem;
    align-items: start;
  }

  .gentilicio__review-item {
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
    gap: 1rem;
    align-items: baseline;
  }

  .gentilicio__actions {
    position: static;
    padding: 0;
    border: 0;
    background: transparent;
    box-shadow: none;
  }
}

.gentilicio__label,
.gentilicio__review-place {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  min-width: 0;
}

.gentilicio__index {
  display: inline-grid;
  place-items: center;
  width: 1.65rem;
  height: 1.65rem;
  flex-shrink: 0;
  background: var(--accent-strong);
  color: var(--accent);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 0.82rem;
}

.gentilicio__prompt {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.gentilicio__name {
  font-family: var(--font-display);
  font-size: clamp(1rem, 4.2vw, 1.15rem);
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  line-height: 1.15;
  overflow-wrap: anywhere;
}

.gentilicio__kind {
  color: var(--text-muted);
  font-size: 0.72rem;
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

.gentilicio__feedback,
.gentilicio__review-answer {
  margin: 0.3rem 0 0;
  color: var(--success);
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1.35;
}

.gentilicio__review-answer {
  margin: 0;
  color: var(--text-strong);
  font-family: var(--font-display);
  font-size: 1.05rem;
  letter-spacing: 0.02em;
  text-transform: lowercase;
}

.gentilicio__actions {
  position: sticky;
  bottom: 0;
  z-index: 5;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
  margin-top: 1.15rem;
  padding: 0.75rem 0 max(0.75rem, env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, var(--bg) 28%, var(--bg) 100%);
}

.gentilicio__action {
  width: 100%;
}

@media (min-width: 480px) {
  .gentilicio__actions {
    grid-template-columns: 1fr 1fr;
  }
}

.gentilicio__score {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.55rem;
  margin: 1rem 0 0;
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
  font-size: clamp(2.25rem, 10vw, 3.5rem);
  font-weight: 700;
  line-height: 0.9;
}

.gentilicio__score-total {
  font-size: 1.15rem;
}

.gentilicio__score-note {
  color: var(--success);
  font-size: 0.9rem;
}
</style>

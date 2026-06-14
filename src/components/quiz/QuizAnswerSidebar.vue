<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useViewport } from '@/composables/useViewport'
import type { QuizAnswerResult, QuizSessionItem } from '@/types/quiz'

const props = defineProps<{
  hiddenItems: QuizSessionItem[]
  hiddenItemIndexById: Record<string, number>
  itemColorsById: Record<string, string>
  answers: Record<string, string>
  corrected: boolean
  resultsByItemId: Record<string, QuizAnswerResult>
  scoreCorrect: number
  scoreTotal: number
}>()

const emit = defineEmits<{
  'update:answers': [value: Record<string, string>]
  correct: []
  restart: []
  'register-row': [itemId: string, element: HTMLElement | null]
  'focus-item': [itemId: string]
  'blur-item': []
}>()

const { isMobile } = useViewport()

const listRef = ref<HTMLElement | null>(null)
const showTopFade = ref(false)
const showBottomFade = ref(false)
const hasOverflow = ref(false)
const scrollProgress = ref(0)
const thumbHeightPercent = ref(100)
const visibleRangeStart = ref(1)
const visibleRangeEnd = ref(1)

const itemCount = computed(() => props.hiddenItems.length)

const visibleRangeLabel = computed(() => {
  if (visibleRangeStart.value === visibleRangeEnd.value) {
    return `${visibleRangeStart.value}`
  }

  return `${visibleRangeStart.value}–${visibleRangeEnd.value}`
})

const thumbStyle = computed(() => {
  const travel = Math.max(0, 100 - thumbHeightPercent.value)

  return {
    height: `${thumbHeightPercent.value}%`,
    top: `${scrollProgress.value * travel}%`,
  }
})

const segmentState = (index: number) => {
  const position = index + 1

  if (position < visibleRangeStart.value) return 'passed'
  if (position <= visibleRangeEnd.value) return 'visible'
  return 'pending'
}

const resultClass = (itemId: string) => {
  const result = props.resultsByItemId[itemId]
  if (!result) return ''
  return result.isCorrect ? 'quiz-sidebar__input--correct' : 'quiz-sidebar__input--incorrect'
}

const updateAnswer = (itemId: string, value: string) => {
  emit('update:answers', {
    ...props.answers,
    [itemId]: value,
  })
}

const indexStyle = (itemId: string) => ({
  background: props.itemColorsById[itemId] ?? 'var(--accent)',
})

const inputStyle = (itemId: string) => {
  const color = props.itemColorsById[itemId]
  if (!color || props.corrected) return undefined

  return {
    borderLeftWidth: '3px',
    borderLeftColor: color,
  }
}

const registerRow = (itemId: string, element: Element | ComponentPublicInstance | null) => {
  const htmlElement =
    element instanceof HTMLElement
      ? element
      : element && '$el' in element && element.$el instanceof HTMLElement
        ? element.$el
        : null

  emit('register-row', itemId, htmlElement)
}

const updateVisibleRange = (list: HTMLElement) => {
  const { scrollTop, clientHeight } = list
  const rows = Array.from(list.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  )

  let firstVisible = 0
  let lastVisible = 0

  rows.forEach((row, index) => {
    const rowTop = row.offsetTop
    const rowBottom = rowTop + row.offsetHeight
    const isVisible = rowBottom > scrollTop + 2 && rowTop < scrollTop + clientHeight - 2

    if (!isVisible) return

    if (!firstVisible) firstVisible = index + 1
    lastVisible = index + 1
  })

  visibleRangeStart.value = firstVisible || 1
  visibleRangeEnd.value = lastVisible || firstVisible || 1
}

const updateScrollState = () => {
  const list = listRef.value
  if (!list || !isMobile.value) {
    showTopFade.value = false
    showBottomFade.value = false
    hasOverflow.value = false
    scrollProgress.value = 0
    thumbHeightPercent.value = 100
    visibleRangeStart.value = 1
    visibleRangeEnd.value = Math.max(1, itemCount.value)
    return
  }

  const { scrollTop, scrollHeight, clientHeight } = list
  const overflow = scrollHeight > clientHeight + 1
  const maxScroll = scrollHeight - clientHeight

  hasOverflow.value = overflow
  showTopFade.value = overflow && scrollTop > 4
  showBottomFade.value = overflow && scrollTop + clientHeight < scrollHeight - 4
  scrollProgress.value = maxScroll > 0 ? scrollTop / maxScroll : 0
  thumbHeightPercent.value = overflow ? (clientHeight / scrollHeight) * 100 : 100
  updateVisibleRange(list)
}

const focusItem = async (itemId: string) => {
  emit('focus-item', itemId)

  if (!isMobile.value) return

  await nextTick()
  const index = props.hiddenItems.findIndex((item) => item.id === itemId)
  const row = listRef.value?.children[index]
  row?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  resizeObserver = new ResizeObserver(() => updateScrollState())
  if (listRef.value) resizeObserver.observe(listRef.value)
  updateScrollState()
})

onUnmounted(() => {
  resizeObserver?.disconnect()
})

watch(
  () => [props.hiddenItems.length, props.corrected, isMobile.value],
  async () => {
    await nextTick()
    updateScrollState()
  },
)
</script>

<template>
  <aside class="quiz-sidebar" :class="{ 'quiz-sidebar--mobile': isMobile }">
    <div class="quiz-sidebar__header">
      <div class="quiz-sidebar__title-row">
        <p class="quiz-sidebar__title">Respuestas ocultas</p>
        <p v-if="isMobile && hasOverflow" class="quiz-sidebar__range" aria-live="polite">
          Viendo {{ visibleRangeLabel }} de {{ itemCount }}
        </p>
      </div>

      <div
        v-if="isMobile && hasOverflow"
        class="quiz-sidebar__segments"
        role="presentation"
        aria-hidden="true"
      >
        <span
          v-for="(_, index) in hiddenItems"
          :key="`segment-${index}`"
          class="quiz-sidebar__segment"
          :class="`quiz-sidebar__segment--${segmentState(index)}`"
        />
      </div>
    </div>

    <div
      class="quiz-sidebar__scroll-shell"
      :class="{
        'quiz-sidebar__scroll-shell--active': isMobile && hasOverflow,
        'quiz-sidebar__scroll-shell--top': showTopFade,
        'quiz-sidebar__scroll-shell--bottom': showBottomFade,
      }"
    >
      <div class="quiz-sidebar__viewport">
        <div
          v-if="showTopFade"
          class="quiz-sidebar__scroll-edge quiz-sidebar__scroll-edge--top"
          aria-hidden="true"
        >
          <span class="quiz-sidebar__scroll-edge-icon">↑</span>
          <span class="quiz-sidebar__scroll-edge-label">Hay más arriba</span>
        </div>

        <ol
          ref="listRef"
          class="quiz-sidebar__list"
          :class="{ 'quiz-sidebar__list--scrollable': isMobile }"
          @scroll.passive="updateScrollState"
        >
          <li
            v-for="item in hiddenItems"
            :key="item.id"
            :ref="(element) => registerRow(item.id, element)"
            class="quiz-sidebar__item"
          >
            <span class="quiz-sidebar__index" :style="indexStyle(item.id)">{{
              hiddenItemIndexById[item.id]
            }}</span>
            <div class="quiz-sidebar__field">
              <input
                :value="answers[item.id] ?? ''"
                class="quiz-sidebar__input"
                :class="corrected ? resultClass(item.id) : ''"
                :style="inputStyle(item.id)"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                :readonly="corrected"
                :aria-label="`Respuesta ${hiddenItemIndexById[item.id]}`"
                :placeholder="`Respuesta ${hiddenItemIndexById[item.id]}`"
                @input="updateAnswer(item.id, ($event.target as HTMLInputElement).value)"
                @focus="focusItem(item.id)"
                @blur="emit('blur-item')"
              />
              <p
                v-if="corrected && !resultsByItemId[item.id]?.isCorrect"
                class="quiz-sidebar__feedback"
              >
                {{ item.name }}
              </p>
            </div>
          </li>
        </ol>

        <div
          v-if="showBottomFade"
          class="quiz-sidebar__scroll-edge quiz-sidebar__scroll-edge--bottom"
          aria-hidden="true"
        >
          <span class="quiz-sidebar__scroll-edge-label">Hay más abajo</span>
          <span class="quiz-sidebar__scroll-edge-icon">↓</span>
        </div>
      </div>

      <div v-if="isMobile && hasOverflow" class="quiz-sidebar__rail" aria-hidden="true">
        <div class="quiz-sidebar__rail-track">
          <div class="quiz-sidebar__rail-thumb" :style="thumbStyle" />
        </div>
      </div>
    </div>

    <div class="quiz-sidebar__actions">
      <button
        class="button button-primary quiz-sidebar__button"
        type="button"
        :disabled="corrected"
        @click="emit('correct')"
      >
        Corregir
      </button>
      <button
        class="button button-secondary quiz-sidebar__button"
        type="button"
        @click="emit('restart')"
      >
        Nuevo intento
      </button>
    </div>

    <p v-if="corrected" class="quiz-sidebar__score" role="status">
      Puntuación: {{ scoreCorrect }} / {{ scoreTotal }}
    </p>
  </aside>
</template>

<style scoped>
.quiz-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: min(100%, 17.5rem);
  flex-shrink: 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.quiz-sidebar--mobile {
  width: 100%;
  overflow: visible;
  overscroll-behavior: auto;
}

.quiz-sidebar__header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-sidebar__title-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}

.quiz-sidebar__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.12em;
}

.quiz-sidebar__range {
  margin: 0;
  flex-shrink: 0;
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-strong);
}

.quiz-sidebar__segments {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0.45rem, 1fr));
  gap: 0.3rem;
}

.quiz-sidebar__segment {
  height: 0.45rem;
  border-radius: 999px;
  background: #d8d8d8;
  border: 1px solid #c8c8c8;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.quiz-sidebar__segment--passed {
  background: #8f8f8f;
  border-color: #707070;
}

.quiz-sidebar__segment--visible {
  background: var(--accent);
  border-color: var(--accent-strong);
  transform: scaleY(1.35);
}

.quiz-sidebar__segment--pending {
  background: #ececec;
  border-color: #d0d0d0;
}

.quiz-sidebar__scroll-shell {
  position: relative;
  min-height: 0;
}

.quiz-sidebar__scroll-shell--active {
  display: flex;
  align-items: stretch;
  gap: 0.35rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface-muted);
  padding: 0.35rem 0.35rem 0.35rem 0.5rem;
}

.quiz-sidebar__viewport {
  position: relative;
  flex: 1;
  min-width: 0;
}

.quiz-sidebar__scroll-edge {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 0.3rem 0.5rem;
  pointer-events: none;
  font-family: var(--font-display);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-strong);
}

.quiz-sidebar__scroll-edge--top {
  top: 0;
  background: linear-gradient(to bottom, var(--surface-muted) 45%, transparent);
}

.quiz-sidebar__scroll-edge--bottom {
  bottom: 0;
  background: linear-gradient(to top, var(--surface-muted) 45%, transparent);
}

.quiz-sidebar__scroll-edge-icon {
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 999px;
  background: var(--accent);
  color: var(--accent-strong);
  font-size: 0.72rem;
  line-height: 1;
}

.quiz-sidebar__rail {
  width: 1.35rem;
  flex-shrink: 0;
  padding: 0.15rem 0;
}

.quiz-sidebar__rail-track {
  position: relative;
  height: 100%;
  border-radius: 999px;
  background: #d0d0d0;
  border: 2px solid #b8b8b8;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

.quiz-sidebar__rail-thumb {
  position: absolute;
  left: 0.1rem;
  right: 0.1rem;
  min-height: 2.5rem;
  border-radius: 999px;
  background: linear-gradient(180deg, #ffe066 0%, var(--accent) 55%, #d9a600 100%);
  border: 2px solid var(--accent-strong);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}

.quiz-sidebar__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.quiz-sidebar__list--scrollable {
  max-height: min(13.5rem, 36svh);
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  padding: 0.15rem 0.15rem 0.15rem 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.quiz-sidebar__list--scrollable::-webkit-scrollbar {
  display: none;
}

.quiz-sidebar__item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.quiz-sidebar__index {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  margin-top: 0.45rem;
}

.quiz-sidebar__field {
  flex: 1;
  min-width: 0;
}

.quiz-sidebar__input {
  width: 100%;
  min-height: 2.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.4rem 0.55rem;
  font-size: 0.9rem;
  color: var(--text-strong);
  background: var(--surface);
  touch-action: manipulation;
}

.quiz-sidebar__input:focus {
  outline: 2px solid var(--accent-soft);
  outline-offset: 1px;
  border-color: var(--accent-strong);
}

.quiz-sidebar__input--correct {
  border-color: var(--success);
  background: var(--success-soft);
}

.quiz-sidebar__input--incorrect {
  border-color: var(--error);
  background: var(--error-soft);
}

.quiz-sidebar__feedback {
  margin: 0.2rem 0 0;
  font-size: 0.72rem;
  color: var(--success);
  font-weight: 600;
}

.quiz-sidebar__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.quiz-sidebar__button {
  width: 100%;
}

.quiz-sidebar__score {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-strong);
  text-align: center;
}

@media (max-width: 639px) {
  .quiz-sidebar__input {
    min-height: var(--touch-target);
    font-size: 16px;
  }

  .quiz-sidebar__rail {
    width: 1.6rem;
  }
}
</style>

<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
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
}>()

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
</script>

<template>
  <aside class="quiz-sidebar">
    <p class="quiz-sidebar__title">Respuestas ocultas</p>

    <ol class="quiz-sidebar__list">
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

.quiz-sidebar__title {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.quiz-sidebar__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
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
  border-radius: 8px;
  padding: 0.4rem 0.55rem;
  font-size: 0.9rem;
  color: var(--text-strong);
  background: var(--surface);
}

.quiz-sidebar__input:focus {
  outline: 2px solid rgba(37, 99, 235, 0.3);
  outline-offset: 1px;
  border-color: var(--accent);
}

.quiz-sidebar__input--correct {
  border-color: #16a34a;
  background: #f0fdf4;
}

.quiz-sidebar__input--incorrect {
  border-color: #dc2626;
  background: #fef2f2;
}

.quiz-sidebar__feedback {
  margin: 0.2rem 0 0;
  font-size: 0.72rem;
  color: #16a34a;
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
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-strong);
  text-align: center;
}

@media (max-width: 639px) {
  .quiz-sidebar {
    width: 100%;
  }

  .quiz-sidebar__input {
    min-height: var(--touch-target);
    font-size: 16px;
  }
}
</style>

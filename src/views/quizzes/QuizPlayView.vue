<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ClickQuizExercise from '@/components/quiz/ClickQuizExercise.vue'
import GentilicioQuiz from '@/components/quiz/GentilicioQuiz.vue'
import MapQuizExercise from '@/components/quiz/MapQuizExercise.vue'
import type { MapQuizMode, QuizMode } from '@/types/quiz'
import { availableQuizCategories, quizCategoryByMode } from '@/utils/quizNav'

const route = useRoute()

const validModes = availableQuizCategories().map((category) => category.id)

const mode = computed(() => route.params.mode as QuizMode)
const category = computed(() => quizCategoryByMode(mode.value))
const isValidMode = computed(() => validModes.includes(mode.value))
const isGentilicioQuiz = computed(() => isValidMode.value && mode.value === 'gentilicios')
const isClickTimed = computed(() => category.value?.interaction === 'click-timed')
const mapMode = computed((): MapQuizMode | null => {
  if (!isValidMode.value || mode.value === 'gentilicios') return null
  return mode.value
})
</script>

<template>
  <GentilicioQuiz v-if="isGentilicioQuiz" />
  <ClickQuizExercise
    v-else-if="mapMode && isClickTimed"
    :key="mapMode"
    class="quiz-play"
    :mode="mapMode"
  />
  <MapQuizExercise v-else-if="mapMode" :key="mapMode" class="quiz-play" :mode="mapMode" />
  <section v-else>
    <h1>Quiz no encontrado</h1>
    <p>El modo de quiz solicitado no existe.</p>
  </section>
</template>

<style scoped>
.quiz-play {
  flex: 1;
  min-height: 0;
}
</style>

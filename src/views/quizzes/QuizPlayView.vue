<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import MapQuizExercise from '@/components/quiz/MapQuizExercise.vue'
import type { QuizMode } from '@/types/quiz'
import { EUROPE_QUIZ_CATEGORIES, EUROPE_QUIZ_ENABLED, SPAIN_QUIZ_CATEGORIES } from '@/types/quiz'

const route = useRoute()

const availableCategories = EUROPE_QUIZ_ENABLED
  ? [...SPAIN_QUIZ_CATEGORIES, ...EUROPE_QUIZ_CATEGORIES]
  : SPAIN_QUIZ_CATEGORIES

const validModes = availableCategories.map((category) => category.id)

const mode = computed(() => route.params.mode as QuizMode)
const isValidMode = computed(() => validModes.includes(mode.value))
</script>

<template>
  <MapQuizExercise v-if="isValidMode" class="quiz-play" :mode="mode" />
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

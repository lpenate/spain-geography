<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import ClickQuizExercise from '@/components/quiz/ClickQuizExercise.vue'
import MapQuizExercise from '@/components/quiz/MapQuizExercise.vue'
import type { QuizMode } from '@/types/quiz'
import { availableQuizCategories, quizCategoryByMode } from '@/utils/quizNav'

const route = useRoute()

const validModes = availableQuizCategories().map((category) => category.id)

const mode = computed(() => route.params.mode as QuizMode)
const category = computed(() => quizCategoryByMode(mode.value))
const isValidMode = computed(() => validModes.includes(mode.value))
const isClickTimed = computed(() => category.value?.interaction === 'click-timed')
</script>

<template>
  <ClickQuizExercise
    v-if="isValidMode && isClickTimed"
    :key="mode"
    class="quiz-play"
    :mode="mode"
  />
  <MapQuizExercise v-else-if="isValidMode" :key="mode" class="quiz-play" :mode="mode" />
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

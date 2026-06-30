<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { QuizCategory } from '@/types/quiz'
import { assetUrl } from '@/utils/assetUrl'
import { quizInteractionLabel, quizPlayRoute, quizRegionLabel } from '@/utils/quizNav'

const props = defineProps<{
  category: QuizCategory
}>()

const interactionLabel = computed(() => quizInteractionLabel(props.category))
const regionLabel = computed(() => quizRegionLabel(props.category.region))
const mapAlt = computed(() => `Vista previa del mapa: ${props.category.title}`)
const cardLink = computed(() =>
  props.category.available ? { to: quizPlayRoute(props.category.id) } : {},
)
</script>

<template>
  <component
    :is="category.available ? RouterLink : 'article'"
    v-bind="cardLink"
    class="category-card"
    :class="{
      'category-card--available': category.available,
      'category-card--spain': category.region === 'spain',
      'category-card--europe': category.region === 'europe',
    }"
  >
    <div class="category-card__thumb" aria-hidden="true">
      <img
        class="category-card__map"
        :src="assetUrl(category.mapUrl)"
        :alt="mapAlt"
        loading="lazy"
        decoding="async"
      />
      <span class="category-card__region">{{ regionLabel }}</span>
      <span
        class="category-card__mode"
        :class="{ 'category-card__mode--click': category.interaction === 'click-timed' }"
      >
        {{ interactionLabel }}
      </span>
    </div>

    <div class="category-card__body">
      <h3 class="category-card__title">{{ category.title }}</h3>
      <p class="category-card__description">{{ category.description }}</p>
    </div>
  </component>
</template>

<style scoped>
.category-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.category-card--available {
  cursor: pointer;
}

.category-card--available:hover,
.category-card--available:focus-visible {
  border-color: var(--accent-strong);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.category-card--available:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.category-card__thumb {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.85rem 1rem 0.75rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(244, 244, 244, 0.96) 100%),
    repeating-linear-gradient(
      -45deg,
      rgba(0, 0, 0, 0.025) 0,
      rgba(0, 0, 0, 0.025) 1px,
      transparent 1px,
      transparent 10px
    );
  border-bottom: 1px solid var(--border);
}

.category-card--spain .category-card__thumb {
  background:
    linear-gradient(180deg, rgba(219, 234, 254, 0.45) 0%, rgba(255, 255, 255, 0.96) 100%),
    repeating-linear-gradient(
      -45deg,
      rgba(37, 99, 235, 0.04) 0,
      rgba(37, 99, 235, 0.04) 1px,
      transparent 1px,
      transparent 10px
    );
}

.category-card--europe .category-card__thumb {
  background:
    linear-gradient(180deg, rgba(220, 252, 231, 0.55) 0%, rgba(255, 255, 255, 0.96) 100%),
    repeating-linear-gradient(
      -45deg,
      rgba(22, 163, 74, 0.04) 0,
      rgba(22, 163, 74, 0.04) 1px,
      transparent 1px,
      transparent 10px
    );
}

.category-card__map {
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
  filter: saturate(0.92);
}

.category-card:not(.category-card--available) .category-card__map {
  opacity: 0.45;
  filter: grayscale(0.85);
}

.category-card__region,
.category-card__mode {
  position: absolute;
  font-family: var(--font-display);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1;
  padding: 0.28rem 0.45rem;
  border-radius: var(--radius-sm);
}

.category-card__region {
  top: 0.55rem;
  left: 0.55rem;
  background: rgba(0, 0, 0, 0.78);
  color: #ffffff;
}

.category-card__mode {
  top: 0.55rem;
  right: 0.55rem;
  background: rgba(255, 255, 255, 0.94);
  color: var(--text-strong);
  border: 1px solid var(--border);
}

.category-card__mode--click {
  background: var(--accent);
  border-color: var(--accent-strong);
  color: var(--accent-strong);
}

.category-card__body {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.7rem 0.9rem 0.8rem;
}

.category-card__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.category-card__description {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.4;
  font-size: 0.84rem;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>

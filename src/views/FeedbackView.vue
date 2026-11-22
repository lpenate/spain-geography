<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { sendFeedback } from '@/services/feedback'

type Phase = 'form' | 'sending' | 'sent' | 'error'

const isMinor = ref<'si' | 'no' | null>(null)
const who = ref('')
const contact = ref('')
const comment = ref('')
const phase = ref<Phase>('form')

const canSend = computed(
  () => isMinor.value === 'no' && comment.value.trim().length > 0 && phase.value !== 'sending',
)

const submit = async () => {
  if (!canSend.value) return

  phase.value = 'sending'
  try {
    await sendFeedback({ who: who.value, contact: contact.value, comment: comment.value })
    phase.value = 'sent'
  } catch {
    phase.value = 'error'
  }
}

const reset = () => {
  who.value = ''
  contact.value = ''
  comment.value = ''
  phase.value = 'form'
}
</script>

<template>
  <section class="feedback">
    <header class="feedback__intro">
      <p class="eyebrow">Tu opinión</p>
      <h1 class="feedback__title">Envíanos tus comentarios</h1>
      <p class="feedback__lead">
        ¿Has encontrado un error, echas en falta un ejercicio o tienes una idea? Cuéntanoslo.
      </p>
    </header>

    <div v-if="phase === 'sent'" class="feedback__card feedback__card--done" role="status">
      <p class="feedback__done-title">¡Gracias por tu comentario!</p>
      <p class="feedback__text">Lo leeremos con atención.</p>
      <div class="feedback__actions">
        <RouterLink class="button button-primary" :to="{ name: 'home' }">
          Volver a los ejercicios
        </RouterLink>
        <button class="button button-secondary" type="button" @click="reset">Enviar otro</button>
      </div>
    </div>

    <form v-else class="feedback__card" @submit.prevent="submit">
      <fieldset class="feedback__fieldset">
        <legend class="feedback__label">¿Eres menor de edad?</legend>
        <div class="feedback__choices">
          <label class="feedback__choice" :class="{ 'is-active': isMinor === 'si' }">
            <input v-model="isMinor" type="radio" name="menor" value="si" />
            <span>Sí</span>
          </label>
          <label class="feedback__choice" :class="{ 'is-active': isMinor === 'no' }">
            <input v-model="isMinor" type="radio" name="menor" value="no" />
            <span>No</span>
          </label>
        </div>
      </fieldset>

      <p v-if="isMinor === 'si'" class="feedback__notice" role="note">
        Si eres menor de edad no podemos recoger tus datos. Pide a un adulto (tu madre, tu padre, tu
        tutor o tu profe) que nos escriba por ti.
      </p>

      <template v-else-if="isMinor === 'no'">
        <div class="feedback__field">
          <label class="feedback__label" for="feedback-who">¿Quién eres? (opcional)</label>
          <input
            id="feedback-who"
            v-model="who"
            class="feedback__input"
            type="text"
            autocomplete="name"
            maxlength="120"
            placeholder="Por ejemplo: Ana, madre de un alumno de 5.º"
          />
        </div>

        <div class="feedback__field">
          <label class="feedback__label" for="feedback-contact">
            ¿Cómo podemos contactarte? (opcional)
          </label>
          <input
            id="feedback-contact"
            v-model="contact"
            class="feedback__input"
            type="text"
            autocomplete="email"
            maxlength="160"
            placeholder="Correo o teléfono, si quieres que te respondamos"
          />
        </div>

        <div class="feedback__field">
          <label class="feedback__label" for="feedback-comment">Comentario</label>
          <textarea
            id="feedback-comment"
            v-model="comment"
            class="feedback__input feedback__textarea"
            rows="6"
            maxlength="4000"
            required
            placeholder="Escribe aquí tu comentario"
          />
        </div>

        <p v-if="phase === 'error'" class="feedback__error" role="alert">
          No se ha podido enviar. Comprueba tu conexión a internet y vuelve a intentarlo.
        </p>

        <button class="button button-primary feedback__submit" type="submit" :disabled="!canSend">
          {{ phase === 'sending' ? 'Enviando...' : 'Enviar comentario' }}
        </button>
      </template>
    </form>
  </section>
</template>

<style scoped>
.feedback {
  width: min(40rem, 100%);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.feedback__intro {
  padding-bottom: 0.75rem;
  border-bottom: 3px solid var(--accent);
}

.feedback__intro .eyebrow {
  margin-bottom: 0.3rem;
}

.feedback__title {
  margin: 0;
  font-size: clamp(1.45rem, 7vw, 1.75rem);
  line-height: 1.05;
}

.feedback__lead,
.feedback__text {
  margin: 0.6rem 0 0;
  color: var(--text-muted);
  line-height: 1.5;
}

.feedback__card {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.25rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.feedback__fieldset {
  margin: 0;
  padding: 0;
  border: 0;
}

.feedback__label {
  display: block;
  margin: 0 0 0.45rem;
  padding: 0;
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
}

.feedback__choices {
  display: flex;
  gap: 0.6rem;
}

.feedback__choice {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  min-height: var(--touch-target);
  padding: 0 1.1rem;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}

.feedback__choice.is-active {
  border-color: var(--accent-strong);
  background: var(--accent-soft);
}

.feedback__choice input {
  accent-color: var(--accent-strong);
}

.feedback__notice {
  margin: 0;
  padding: 0.85rem 1rem;
  border-left: 4px solid var(--accent);
  background: var(--accent-soft);
  line-height: 1.5;
}

.feedback__field {
  display: flex;
  flex-direction: column;
}

.feedback__input {
  width: 100%;
  min-height: var(--touch-target);
  padding: 0.65rem 0.8rem;
  border: 2px solid var(--border);
  border-radius: var(--radius-sm);
  font: inherit;
  transition: border-color 0.2s ease;
}

.feedback__input:focus {
  border-color: var(--accent-strong);
  outline: none;
}

.feedback__textarea {
  resize: vertical;
  min-height: 8rem;
}

.feedback__error {
  margin: 0;
  color: var(--error);
}

.feedback__submit {
  align-self: flex-start;
}

.feedback__submit:disabled {
  opacity: 0.45;
  cursor: default;
}

.feedback__card--done {
  gap: 0.25rem;
}

.feedback__done-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 700;
}

.feedback__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}
</style>

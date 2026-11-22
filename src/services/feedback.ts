// Comentarios de los usuarios. El formulario visible es nuestro (FeedbackView); las respuestas
// se guardan en un Formulario de Google que solo hace de buzón y avisa por correo al recibir
// una nueva. Así la dirección de correo no aparece en ningún sitio de la web.

const FORM_RESPONSE_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSfxnXNzsFUjq91Ku24y9fD8h-qBLga4ZrR80qVt5nM1ecbg2Q/formResponse'

/** Identificadores de cada pregunta del Formulario de Google («entry.N»). */
const FIELDS = {
  isMinor: 'entry.1289958486',
  who: 'entry.1430570442',
  contact: 'entry.1678696505',
  comment: 'entry.901256983',
} as const

export interface FeedbackMessage {
  who: string
  contact: string
  comment: string
}

/**
 * Cuerpo del envío. Solo se envía feedback de adultos: a los menores la web no les deja
 * escribir (les pide que lo haga un adulto), así que «¿Eres menor de edad?» siempre es «No».
 */
export const buildFeedbackBody = (message: FeedbackMessage): URLSearchParams =>
  new URLSearchParams({
    [FIELDS.isMinor]: 'No',
    [FIELDS.who]: message.who.trim(),
    [FIELDS.contact]: message.contact.trim(),
    [FIELDS.comment]: message.comment.trim(),
  })

/**
 * Google no permite leer la respuesta desde otra web (modo no-cors): solo se detectan los
 * fallos de red. Si Google rechazara el envío, la web no lo sabría.
 */
export const sendFeedback = async (message: FeedbackMessage): Promise<void> => {
  await fetch(FORM_RESPONSE_URL, {
    method: 'POST',
    mode: 'no-cors',
    body: buildFeedbackBody(message),
  })
}

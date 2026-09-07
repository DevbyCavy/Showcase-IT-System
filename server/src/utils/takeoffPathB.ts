// Path B of the AI Takeoff / BOQ Generator pipeline (see design doc §3.2 and the v0.2 plan) —
// sends every page/view of a design to Claude in ONE message so it can (1) transcribe visible
// labels the text layer missed, (2) predict unlabeled furniture/electrical items, and (3) ask a
// clarifying question when something genuinely can't be determined at all. Always runs alongside
// Path A (see takeoffExtraction.service.ts) since it's the only source of predicted items and
// questions; every item it produces is source: 'Predicted' or 'Inferred', never 'Extracted'.
//
// v0.2 change from v0.1: this used to call Claude once per page, independently — a multi-page
// design where each page is a different camera angle of the same physical booth produced the same
// item detected 3-4x over. Now every page/view image goes into a single message, with the model
// explicitly told they're the same physical design seen from different angles.

import Anthropic from '@anthropic-ai/sdk'
import { env } from '../config/env'
import type { TakeoffExtractedItem } from '../types/takeoff.types'
import type { TakeoffItemCategory, TakeoffItemConfidence, TakeoffClarificationTopic } from '#prisma-client'

const MAX_IMAGES = 20

const CATEGORIES: TakeoffItemCategory[] = ['Structure', 'Cladding', 'Electrical', 'Furniture', 'Other']
const CONFIDENCES: TakeoffItemConfidence[] = ['High', 'Medium', 'Low']
const TOPICS: TakeoffClarificationTopic[] = ['Material', 'Measurement', 'Other']

export interface TakeoffPageImage {
  data: Buffer
  mediaType: 'image/png' | 'image/jpeg'
}

export interface TakeoffKnownFact {
  question: string
  answer: string
}

export interface TakeoffExtractionContext {
  materialNames: string[]
  // Globally Answered clarifications from prior designs — this design's own memory across the
  // whole app, not scoped to one project. See takeoffExtraction.service.ts.
  knownFacts: TakeoffKnownFact[]
  // This design's own freshly-answered clarifications, folded in as authoritative for this
  // specific design (as opposed to knownFacts, which are precedent from other designs).
  designAnswers?: TakeoffKnownFact[]
  // Set on the second pass (after the user has answered) — the prompt tells the model not to ask
  // further questions and to make its best judgment call instead. Any questions it returns anyway
  // are discarded by the caller, capping clarification at exactly one round.
  isFinalizationPass?: boolean
}

export interface TakeoffClarificationQuestion {
  topic: TakeoffClarificationTopic
  question: string
}

export interface TakeoffExtractionResult {
  items: TakeoffExtractedItem[]
  questions: TakeoffClarificationQuestion[]
}

function buildSystemPrompt(imageCount: number, context: TakeoffExtractionContext): string {
  const materialsLine =
    context.materialNames.length > 0
      ? `Known material vocabulary so far (not exhaustive — you are not limited to these, this is just what's been used before): ${context.materialNames.join(', ')}.`
      : ''

  const knownFactsBlock =
    context.knownFacts.length > 0
      ? `\nKnown facts from previous designs — do not ask about these again unless this specific design clearly contradicts them:\n${context.knownFacts.map((f) => `- Q: ${f.question}\n  A: ${f.answer}`).join('\n')}`
      : ''

  const designAnswersBlock =
    context.designAnswers && context.designAnswers.length > 0
      ? `\nAnswers the user just gave for THIS design — authoritative, apply them directly:\n${context.designAnswers.map((f) => `- Q: ${f.question}\n  A: ${f.answer}`).join('\n')}`
      : ''

  const questionsInstruction = context.isFinalizationPass
    ? `This is the FINAL pass — do not ask further questions. Return an empty "questions" array no matter what. Make your best judgment call for anything still unclear and produce a "Predicted" or "Inferred" item at "Low" confidence instead of asking.`
    : `If — and only if — something is genuinely impossible to determine at all (e.g. no scale reference anywhere so no dimension can be estimated, or a structural element whose purpose/material truly can't be inferred from what's visible), add a question to "questions" instead of guessing. Do NOT ask about anything you can produce a reasonable Predicted/Inferred item for at Low confidence — that's the normal case, not a question. Keep questions rare — most designs should need 0-2, not one per item.`

  return `You are assisting a quantity surveyor by reading ${imageCount} image${imageCount === 1 ? '' : 's'} — different pages or angle-views of ONE single physical design (an exhibition stand, shopfitting, or interior build). Treat them as one thing seen from different angles, not ${imageCount} separate designs: merge everything into a single deduplicated item list. Do not repeat the same physical item (e.g. the same TV, the same sofa, the same reception counter) just because it appears in more than one image — recognize it as one item once.

${materialsLine}${knownFactsBlock}${designAnswersBlock}

Respond with ONLY a JSON object (no markdown code fences, no commentary before or after it) shaped exactly like this:
{
  "items": [
    {
      "description": string,
      "category": "Structure" | "Cladding" | "Electrical" | "Furniture" | "Other",
      "material": string or null,
      "widthMm": number or null,
      "heightMm": number or null,
      "lengthMm": number or null,
      "unit": "m2" | "linear_m" | "each",
      "quantity": number,
      "source": "predicted" | "inferred",
      "confidence": "high" | "medium" | "low",
      "notes": string or null
    }
  ],
  "questions": [
    { "topic": "material" | "measurement" | "other", "question": string }
  ]
}

Rules for items:
- Use "inferred" for a surface/structure whose material you can identify by visual appearance alone (no text label on the page) — e.g. a panel that looks like it's Dibond or Supawood.
- Use "predicted" for furniture and electrical items visible in the render that have no callout at all (chairs, counters, spotlights, power points, TVs, etc.) — estimate quantity and, where a scale reference makes it inferable, approximate size.
- Do NOT include items that already have a clear printed dimension/material label on the page — those are handled separately from the text layer.
- Every "notes" field must briefly say what visual cue led to the guess.

${questionsInstruction}

If nothing qualifies for either array, return an empty array for it.`
}

function loadImageContentBlock(image: TakeoffPageImage): Anthropic.Messages.ImageBlockParam {
  return {
    type: 'image',
    source: { type: 'base64', media_type: image.mediaType, data: image.data.toString('base64') },
  }
}

function coerceCategory(value: unknown): TakeoffItemCategory {
  const match = CATEGORIES.find((c) => c.toLowerCase() === String(value).toLowerCase())
  return match ?? 'Other'
}

function coerceConfidence(value: unknown): TakeoffItemConfidence {
  const match = CONFIDENCES.find((c) => c.toLowerCase() === String(value).toLowerCase())
  return match ?? 'Low'
}

function coerceTopic(value: unknown): TakeoffClarificationTopic {
  const match = TOPICS.find((t) => t.toLowerCase() === String(value).toLowerCase())
  return match ?? 'Other'
}

function parseExtractionResult(rawText: string): TakeoffExtractionResult {
  // Models are instructed not to wrap the response in markdown fences, but strip them
  // defensively — fence-wrapped JSON is still a common enough response shape to guard against.
  const cleaned = rawText.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    return { items: [], questions: [] }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { items: [], questions: [] }
  }

  const rawItems = Array.isArray((parsed as Record<string, unknown>).items) ? (parsed as Record<string, unknown[]>).items : []
  const rawQuestions = Array.isArray((parsed as Record<string, unknown>).questions)
    ? (parsed as Record<string, unknown[]>).questions
    : []

  const items: TakeoffExtractedItem[] = rawItems
    .filter((raw): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null)
    .map((raw) => ({
      description: String(raw.description ?? 'Predicted item'),
      category: coerceCategory(raw.category),
      material: raw.material == null ? null : String(raw.material),
      widthMm: typeof raw.widthMm === 'number' ? raw.widthMm : null,
      heightMm: typeof raw.heightMm === 'number' ? raw.heightMm : null,
      lengthMm: typeof raw.lengthMm === 'number' ? raw.lengthMm : null,
      unit: typeof raw.unit === 'string' ? raw.unit : 'each',
      quantity: typeof raw.quantity === 'number' && raw.quantity > 0 ? raw.quantity : 1,
      // Path B never produces 'Extracted' — coerce anything unexpected to 'predicted' rather than
      // let a malformed response silently claim text-layer-grade certainty.
      source: String(raw.source).toLowerCase() === 'inferred' ? ('Inferred' as const) : ('Predicted' as const),
      confidence: coerceConfidence(raw.confidence),
      notes: raw.notes == null ? null : String(raw.notes),
    }))

  const questions: TakeoffClarificationQuestion[] = rawQuestions
    .filter((raw): raw is Record<string, unknown> => typeof raw === 'object' && raw !== null)
    .filter((raw) => typeof raw.question === 'string')
    .map((raw) => ({ topic: coerceTopic(raw.topic), question: String(raw.question) }))

  return { items, questions }
}

export async function extractPathB(images: TakeoffPageImage[], context: TakeoffExtractionContext): Promise<TakeoffExtractionResult> {
  if (!env.ANTHROPIC_API_KEY || images.length === 0) {
    // Not an error — Path A alone still produces a usable (if less complete) result. The design
    // is marked Ready either way; see takeoffExtraction.service.ts.
    return { items: [], questions: [] }
  }
  if (images.length > MAX_IMAGES) {
    throw new Error(`Design has ${images.length} pages/images — Path B is capped at ${MAX_IMAGES} per design.`)
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system: buildSystemPrompt(images.length, context),
    messages: [
      {
        role: 'user',
        content: [
          ...images.map((img, i) => [loadImageContentBlock(img), { type: 'text' as const, text: `Image ${i + 1} of ${images.length}.` }]).flat(),
          { type: 'text', text: 'Analyze all images above as one single design and respond with the JSON object described in your instructions.' },
        ],
      },
    ],
  })

  const textBlock = response.content.find((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
  if (!textBlock) {
    return { items: [], questions: [] }
  }

  const result = parseExtractionResult(textBlock.text)
  if (context.isFinalizationPass && result.questions.length > 0) {
    console.warn(`Path B returned ${result.questions.length} question(s) on a finalization pass — discarding, per the one-round cap.`)
    return { items: result.items, questions: [] }
  }
  return result
}

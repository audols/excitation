import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import { citations, events } from '../schema';
import { BoundingRegion, Review, Event } from '../types'

const queryClient = postgres(process.env.POSTGRES);
const db = drizzle(queryClient);

// ============================================================================
// db operations
// ============================================================================

// Inserts into db citations table
async function insertCitation(form_id: number, question_id: number, document_id: number, excerpt: string, bounds: BoundingRegion[], review: Review, creator: string) {
  return await db.insert(citations).values({
    form_id,
    question_id,
    document_id,
    excerpt,
    bounds,
    bounds_created_at: sql`now()`,
    review,
    creator
  }).returning();
}

// Updates db citations table
async function updateCitationBounds(citation_id: number, bounds: BoundingRegion[]) {
  return db.update(citations).set({
    bounds,
    bounds_created_at: sql`now()`
  }).where(eq(citations.id, citation_id)).returning();
}

async function updateCitationReview(citation_id: number, review: Review) {
  return db.update(citations).set({
    review
  }).where(eq(citations.id, citation_id)).returning();
}

// Inserts into db events table
async function insertAddEvent(form_id: number, question_id: number, document_id: number, citation_id: number, excerpt: string, bounds: BoundingRegion[], review: ReviewStatus, creator: string) {
  return db.insert(events).values({
    type: 'add',
    form_id,
    question_id,
    document_id,
    citation_id,
    excerpt,
    bounds,
    review,
    creator
  }).returning();
}

// Inserts into db events table
async function insertReviewEvent(citation_id: number, review: Review, creator: string) {
  return db.insert(events).values({
    type: 'review',
    citation_id,
    review,
    creator
  }).returning();
}

// Inserts into db events table
async function insertUpdateEvent(citation_id: number, bounds: BoundingRegion[], creator: string) {
  return db.insert(events).values({
    type: 'update',
    citation_id,
    bounds,
    creator
  }).returning();
}

// ============================================================================
// event handling
// ============================================================================

// Adding a citation involves creating a new citation and a new event
async function addCitation(context: InvocationContext, form_id: number, question_id: number, document_id: number, excerpt: string, bounds: BoundingRegion[], review: Review, creator: string) {
  let citation = await insertCitation(form_id, question_id, document_id, excerpt, bounds, review, creator);
  context.log("Created citation:", citation);
  let citation_id = citation[0].id;
  let event = await insertAddEvent(form_id, question_id, document_id, citation_id, excerpt, bounds, review, creator);
  context.log("Created event:", event);
}

// Adding a review involves creating a new event
async function addReview(context: InvocationContext, citation_id: number, review: Review, creator: string) {
  const citation = await updateCitationReview(citation_id, review);
  context.log("Updated citation:", citation);
  const event = await insertReviewEvent(citation_id, review, creator);
  context.log("Created event:", event);
}

// Updating bounds data involves updating an existing citation
async function updateBounds(context: InvocationContext, citation_id: number, bounds: BoundingRegion[], creator: string) {
  let citation = await updateCitationBounds(citation_id, bounds);
  context.log("Updated citation:", citation);
  let event = await insertUpdateEvent(citation_id, bounds, creator);
  context.log("Created event:", event);
}

// ============================================================================
// main
// ============================================================================
export async function post(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log(`Http function processed request for url "${request.url}"`);

  const body = await request.json() as Event[];
  for await (const event of body) {
    switch (event.type) {
      case 'addCitation':
        await addCitation(context, event.formId, event.questionId, event.documentId, event.excerpt, event.bounds, event.review, event.creator);
        break;
      case 'updateReview':
        await addReview(context, event.citationId, event.review, event.creator);
        break;
      case 'updateBounds':
        await updateBounds(context, event.citationId, event.bounds, event.creator);
        break;
    }
  }

  return { status: 200 };
};

app.http('post', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: '',
  handler: post
});
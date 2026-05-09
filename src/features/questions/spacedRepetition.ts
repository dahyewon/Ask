import type { DifficultyRating, ReviewState } from "./question.types";

export function createInitialReviewState(questionId: string, now = new Date()): ReviewState {
  return {
    questionId,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitionCount: 0,
    difficultyLevel: "medium",
    dueAt: now.toISOString()
  };
}

export function updateReviewState(
  state: ReviewState,
  rating: DifficultyRating,
  now = new Date()
): ReviewState {
  const next = { ...state };
  next.lastReviewedAt = now.toISOString();
  next.difficultyLevel = rating;

  if (rating === "hard") {
    next.easeFactor = Math.max(1.3, next.easeFactor - 0.2);
    next.intervalDays = 0;
    next.repetitionCount = 0;
    next.dueAt = addMinutes(now, 10).toISOString();
    return next;
  }

  if (rating === "medium") {
    next.easeFactor = Math.max(1.3, next.easeFactor - 0.05);
    next.repetitionCount += 1;
    next.intervalDays = next.repetitionCount <= 1 ? 1 : Math.max(2, Math.round(next.intervalDays * next.easeFactor));
    next.dueAt = addDays(now, next.intervalDays).toISOString();
    return next;
  }

  next.easeFactor = Math.min(3.2, next.easeFactor + 0.15);
  next.repetitionCount += 1;
  next.intervalDays = next.repetitionCount <= 1 ? 3 : Math.max(4, Math.round(next.intervalDays * next.easeFactor));
  next.dueAt = addDays(now, next.intervalDays).toISOString();
  return next;
}

export function resetReviewState(state: ReviewState, now = new Date()): ReviewState {
  return {
    ...state,
    easeFactor: 2.5,
    intervalDays: 0,
    repetitionCount: 0,
    difficultyLevel: "medium",
    dueAt: now.toISOString(),
    lastReviewedAt: undefined
  };
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMinutes(date: Date, minutes: number) {
  const next = new Date(date);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

"use client";

import type { InterviewSession } from "../sessions/session.types";
import { createInitialReviewState, resetReviewState, updateReviewState } from "./spacedRepetition";
import { seedQuestions, seedReviewStates, seedTags } from "./seed";
import type { DifficultyRating, Question, ReviewState, Tag } from "./question.types";
import { createId } from "@/lib/utils/id";

const QUESTIONS_KEY = "ask.questions";
const TAGS_KEY = "ask.tags";
const REVIEW_KEY = "ask.reviewStates";
const SESSIONS_KEY = "ask.sessions";
const VERSION_KEY = "ask.dataVersion";
const DATA_VERSION = "2026-05-07-question-crud";

export type AppData = {
  questions: Question[];
  tags: Tag[];
  reviewStates: ReviewState[];
  sessions: InterviewSession[];
};

export type BulkQuestionInput = {
  content: string;
  tagNames: string[];
};

export function loadAppData(): AppData {
  if (typeof window === "undefined") {
    return {
      questions: seedQuestions,
      tags: seedTags,
      reviewStates: seedReviewStates,
      sessions: []
    };
  }

  const version = window.localStorage.getItem(VERSION_KEY);
  if (version !== DATA_VERSION) {
    writeLocal(QUESTIONS_KEY, seedQuestions);
    writeLocal(TAGS_KEY, seedTags);
    writeLocal(REVIEW_KEY, seedReviewStates);
    window.localStorage.setItem(VERSION_KEY, DATA_VERSION);
  }

  const questions = readLocal<Question[]>(QUESTIONS_KEY) ?? seedQuestions;
  const tags = readLocal<Tag[]>(TAGS_KEY) ?? seedTags;
  const reviewStates = readLocal<ReviewState[]>(REVIEW_KEY) ?? seedReviewStates;
  const sessions = readLocal<InterviewSession[]>(SESSIONS_KEY) ?? [];

  writeLocal(QUESTIONS_KEY, questions);
  writeLocal(TAGS_KEY, tags);
  writeLocal(REVIEW_KEY, reviewStates);
  writeLocal(SESSIONS_KEY, sessions);

  return { questions, tags, reviewStates, sessions };
}

export function saveSession(session: InterviewSession) {
  const sessions = readLocal<InterviewSession[]>(SESSIONS_KEY) ?? [];
  writeLocal(SESSIONS_KEY, [session, ...sessions]);
}

export function deleteSession(sessionId: string) {
  const sessions = readLocal<InterviewSession[]>(SESSIONS_KEY) ?? [];
  writeLocal(
    SESSIONS_KEY,
    sessions.filter((session) => session.id !== sessionId)
  );
  return loadAppData();
}

export function updateSavedAnswerTranscript(
  sessionId: string,
  answerId: string,
  transcript: string,
  status: "completed" | "failed"
) {
  const sessions = readLocal<InterviewSession[]>(SESSIONS_KEY) ?? [];
  const next = sessions.map((session) =>
    session.id === sessionId
      ? {
          ...session,
          answers: session.answers.map((answer) =>
            answer.id === answerId
              ? { ...answer, transcript, transcriptStatus: status }
              : answer
          )
        }
      : session
  );
  writeLocal(SESSIONS_KEY, next);
  return next;
}

export function createQuestion(input: { content: string; tagIds: string[] }) {
  const questions = readLocal<Question[]>(QUESTIONS_KEY) ?? seedQuestions;
  const reviewStates = readLocal<ReviewState[]>(REVIEW_KEY) ?? seedReviewStates;
  const question: Question = {
    id: createId("question"),
    content: input.content.trim(),
    tagIds: input.tagIds,
    isActive: true,
    createdAt: new Date().toISOString()
  };

  writeLocal(QUESTIONS_KEY, [question, ...questions]);
  writeLocal(REVIEW_KEY, [createInitialReviewState(question.id), ...reviewStates]);
  return loadAppData();
}

export function importQuestions(inputs: BulkQuestionInput[]) {
  const questions = readLocal<Question[]>(QUESTIONS_KEY) ?? seedQuestions;
  const tags = readLocal<Tag[]>(TAGS_KEY) ?? seedTags;
  const reviewStates = readLocal<ReviewState[]>(REVIEW_KEY) ?? seedReviewStates;
  const tagByName = new Map(tags.map((tag) => [normalizeTagName(tag.name), tag]));
  const nextTags = [...tags];
  const nextQuestions = [...questions];
  const nextReviewStates = [...reviewStates];
  const colors = ["#2563eb", "#16a34a", "#ea580c", "#7c3aed", "#dc2626", "#0891b2", "#4f46e5"];
  let added = 0;
  let skipped = 0;

  inputs.forEach((input) => {
    const content = input.content.trim();
    const tagNames = unique(input.tagNames.map((name) => name.trim()).filter(Boolean));

    if (!content || tagNames.length === 0) {
      skipped += 1;
      return;
    }

    const tagIds = tagNames.map((tagName) => {
      const normalized = normalizeTagName(tagName);
      const existing = tagByName.get(normalized);
      if (existing) return existing.id;

      const tag: Tag = {
        id: createId("tag"),
        name: tagName,
        color: colors[nextTags.length % colors.length]
      };
      tagByName.set(normalized, tag);
      nextTags.push(tag);
      return tag.id;
    });

    const question: Question = {
      id: createId("question"),
      content,
      tagIds,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    nextQuestions.unshift(question);
    nextReviewStates.unshift(createInitialReviewState(question.id));
    added += 1;
  });

  writeLocal(TAGS_KEY, nextTags);
  writeLocal(QUESTIONS_KEY, nextQuestions);
  writeLocal(REVIEW_KEY, nextReviewStates);

  return {
    data: loadAppData(),
    added,
    skipped
  };
}

export function updateQuestion(input: { id: string; content: string; tagIds: string[] }) {
  const questions = readLocal<Question[]>(QUESTIONS_KEY) ?? seedQuestions;
  const next = questions.map((question) =>
    question.id === input.id
      ? {
          ...question,
          content: input.content.trim(),
          tagIds: input.tagIds
        }
      : question
  );

  writeLocal(QUESTIONS_KEY, next);
  return loadAppData();
}

export function deleteQuestion(questionId: string) {
  const questions = readLocal<Question[]>(QUESTIONS_KEY) ?? seedQuestions;
  const reviewStates = readLocal<ReviewState[]>(REVIEW_KEY) ?? seedReviewStates;

  writeLocal(
    QUESTIONS_KEY,
    questions.filter((question) => question.id !== questionId)
  );
  writeLocal(
    REVIEW_KEY,
    reviewStates.filter((state) => state.questionId !== questionId)
  );

  return loadAppData();
}

export function createTag(input: { name: string; color: string }) {
  const tags = readLocal<Tag[]>(TAGS_KEY) ?? seedTags;
  const tag: Tag = {
    id: createId("tag"),
    name: input.name.trim(),
    color: input.color
  };

  writeLocal(TAGS_KEY, [...tags, tag]);
  return loadAppData();
}

export function updateTag(input: { id: string; name: string; color: string }) {
  const tags = readLocal<Tag[]>(TAGS_KEY) ?? seedTags;
  const next = tags.map((tag) =>
    tag.id === input.id
      ? {
          ...tag,
          name: input.name.trim(),
          color: input.color
        }
      : tag
  );

  writeLocal(TAGS_KEY, next);
  return loadAppData();
}

export function deleteTag(tagId: string) {
  const tags = readLocal<Tag[]>(TAGS_KEY) ?? seedTags;
  const questions = readLocal<Question[]>(QUESTIONS_KEY) ?? seedQuestions;

  writeLocal(
    TAGS_KEY,
    tags.filter((tag) => tag.id !== tagId)
  );
  writeLocal(
    QUESTIONS_KEY,
    questions.map((question) => ({
      ...question,
      tagIds: question.tagIds.filter((id) => id !== tagId)
    }))
  );

  return loadAppData();
}

export function updateReview(questionId: string, rating: DifficultyRating) {
  const reviewStates = readLocal<ReviewState[]>(REVIEW_KEY) ?? seedReviewStates;
  const current = reviewStates.find((state) => state.questionId === questionId);
  const nextState = updateReviewState(current ?? createInitialReviewState(questionId), rating);
  const next = reviewStates.some((state) => state.questionId === questionId)
    ? reviewStates.map((state) => (state.questionId === questionId ? nextState : state))
    : [...reviewStates, nextState];
  writeLocal(REVIEW_KEY, next);
  return next;
}

export function resetAllReviews() {
  const reviewStates = readLocal<ReviewState[]>(REVIEW_KEY) ?? seedReviewStates;
  const next = reviewStates.map((state) => resetReviewState(state));
  writeLocal(REVIEW_KEY, next);
  return next;
}

function readLocal<T>(key: string): T | null {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

function writeLocal<T>(key: string, value: T) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function normalizeTagName(value: string) {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

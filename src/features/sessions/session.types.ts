import type { DifficultyRating, Question } from "../questions/question.types";

export type InterviewStatus = "completed" | "stopped";

export type InterviewAnswer = {
  id: string;
  questionId: string;
  question: string;
  questionOrder: number;
  transcript: string;
  transcriptStatus?: "pending" | "completed" | "failed";
  audioUrl?: string;
  durationSec: number;
  difficultyRating: DifficultyRating;
  answeredAt: string;
};

export type InterviewSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: InterviewStatus;
  selectedTags: string[];
  questionCount: number;
  questions: Question[];
  answers: InterviewAnswer[];
};

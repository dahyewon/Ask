import type { ScheduledQuestion } from "../questions/question.types";
import type { InterviewAnswer } from "../sessions/session.types";

export type InterviewPhase = "idle" | "setup" | "question" | "answering" | "result";

export type InterviewDraft = {
  sessionId: string;
  selectedTags: string[];
  questionCount: number;
  questions: ScheduledQuestion[];
  currentIndex: number;
  startedAt: string;
  answers: InterviewAnswer[];
};

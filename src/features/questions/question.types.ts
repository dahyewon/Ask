export type DifficultyRating = "easy" | "medium" | "hard";

export type Tag = {
  id: string;
  name: string;
  color: string;
};

export type Question = {
  id: string;
  content: string;
  tagIds: string[];
  isActive: boolean;
  createdAt: string;
};

export type ReviewState = {
  questionId: string;
  easeFactor: number;
  intervalDays: number;
  repetitionCount: number;
  difficultyLevel: DifficultyRating;
  dueAt: string;
  lastReviewedAt?: string;
};

export type ScheduledQuestion = Question & {
  reviewState: ReviewState;
  priorityScore: number;
};

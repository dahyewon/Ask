import { createInitialReviewState } from "./spacedRepetition";
import type { Question, ReviewState, ScheduledQuestion } from "./question.types";

type ScheduleInput = {
  questions: Question[];
  reviewStates: ReviewState[];
  selectedTagIds: string[];
  count: number;
  now?: Date;
};

export function scheduleQuestions({
  questions,
  reviewStates,
  selectedTagIds,
  count,
  now = new Date()
}: ScheduleInput): ScheduledQuestion[] {
  const reviewByQuestion = new Map(reviewStates.map((state) => [state.questionId, state]));
  const activeQuestions = questions.filter((question) => question.isActive);
  const filtered = selectedTagIds.length
    ? activeQuestions.filter((question) => question.tagIds.some((tagId) => selectedTagIds.includes(tagId)))
    : activeQuestions;

  return filtered
    .map((question) => {
      const reviewState = reviewByQuestion.get(question.id) ?? createInitialReviewState(question.id, now);
      return {
        ...question,
        reviewState,
        priorityScore: getPriorityScore(reviewState, now)
      };
    })
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return stableShuffleScore(a.id) - stableShuffleScore(b.id);
    })
    .slice(0, count);
}

function getPriorityScore(reviewState: ReviewState, now: Date) {
  const dueAt = new Date(reviewState.dueAt).getTime();
  const overdueHours = Math.max(0, now.getTime() - dueAt) / 1000 / 60 / 60;
  const dueBonus = dueAt <= now.getTime() ? 100 : 0;
  const difficultyBonus = reviewState.difficultyLevel === "hard" ? 50 : reviewState.difficultyLevel === "medium" ? 15 : 0;
  const newQuestionBonus = reviewState.repetitionCount === 0 ? 20 : 0;
  return dueBonus + difficultyBonus + newQuestionBonus + overdueHours;
}

function stableShuffleScore(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

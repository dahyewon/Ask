"use client";

import { create } from "zustand";
import { createId } from "@/lib/utils/id";
import type { ScheduledQuestion } from "../questions/question.types";
import type { InterviewAnswer, InterviewSession, InterviewStatus } from "../sessions/session.types";
import type { InterviewDraft, InterviewPhase } from "./interview.types";

type InterviewStore = {
  phase: InterviewPhase;
  draft?: InterviewDraft;
  lastSession?: InterviewSession;
  beginInterview: (input: {
    selectedTags: string[];
    questionCount: number;
    questions: ScheduledQuestion[];
  }) => void;
  addAnswer: (answer: Omit<InterviewAnswer, "id" | "questionOrder" | "answeredAt">) => InterviewAnswer | undefined;
  updateAnswerTranscript: (answerId: string, transcript: string, status: "completed" | "failed") => void;
  nextQuestion: () => boolean;
  finishInterview: (status: InterviewStatus) => InterviewSession | undefined;
  clear: () => void;
};

export const useInterviewStore = create<InterviewStore>((set, get) => ({
  phase: "setup",
  beginInterview: ({ selectedTags, questionCount, questions }) => {
    set({
      phase: "question",
      draft: {
        sessionId: createId("session"),
        selectedTags,
        questionCount,
        questions,
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        answers: []
      },
      lastSession: undefined
    });
  },
  addAnswer: (answer) => {
    const draft = get().draft;
    if (!draft) return undefined;
    const completedAnswer: InterviewAnswer = {
      ...answer,
      id: createId("answer"),
      questionOrder: draft.answers.length + 1,
      answeredAt: new Date().toISOString()
    };
    set({
      draft: {
        ...draft,
        answers: [...draft.answers, completedAnswer]
      }
    });
    return completedAnswer;
  },
  updateAnswerTranscript: (answerId, transcript, status) => {
    const draft = get().draft;
    const lastSession = get().lastSession;

    if (draft) {
      set({
        draft: {
          ...draft,
          answers: draft.answers.map((answer) =>
            answer.id === answerId
              ? { ...answer, transcript, transcriptStatus: status }
              : answer
          )
        }
      });
    }

    if (lastSession) {
      set({
        lastSession: {
          ...lastSession,
          answers: lastSession.answers.map((answer) =>
            answer.id === answerId
              ? { ...answer, transcript, transcriptStatus: status }
              : answer
          )
        }
      });
    }
  },
  nextQuestion: () => {
    const draft = get().draft;
    if (!draft) return false;
    const nextIndex = draft.currentIndex + 1;
    if (nextIndex >= draft.questions.length) {
      return false;
    }
    set({
      phase: "question",
      draft: {
        ...draft,
        currentIndex: nextIndex
      }
    });
    return true;
  },
  finishInterview: (status) => {
    const draft = get().draft;
    if (!draft) return undefined;
    const session: InterviewSession = {
      id: draft.sessionId,
      startedAt: draft.startedAt,
      endedAt: new Date().toISOString(),
      status,
      selectedTags: draft.selectedTags,
      questionCount: draft.questionCount,
      questions: draft.questions,
      answers: draft.answers
    };
    set({
      phase: "result",
      lastSession: session,
      draft: undefined
    });
    return session;
  },
  clear: () => set({ phase: "setup", draft: undefined, lastSession: undefined })
}));

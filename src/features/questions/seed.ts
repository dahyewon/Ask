import type { Question, ReviewState, Tag } from "./question.types";

const now = new Date().toISOString();

export const seedTags: Tag[] = [
  { id: "tag-common", name: "공통", color: "#2563eb" },
  { id: "tag-personality", name: "인성", color: "#16a34a" },
  { id: "tag-experience", name: "경험", color: "#ea580c" },
  { id: "tag-tech", name: "직무/기술", color: "#7c3aed" },
  { id: "tag-pressure", name: "압박", color: "#dc2626" }
];

export const seedQuestions: Question[] = [
  {
    id: "q-self-intro",
    content: "1분 자기소개를 해주세요.",
    tagIds: ["tag-common"],
    isActive: true,
    createdAt: now
  },
  {
    id: "q-strength",
    content: "본인의 가장 큰 강점과 그것을 증명한 경험을 말해주세요.",
    tagIds: ["tag-common", "tag-experience"],
    isActive: true,
    createdAt: now
  },
  {
    id: "q-conflict",
    content: "팀원과 의견이 충돌했을 때 어떻게 해결했나요?",
    tagIds: ["tag-personality", "tag-experience"],
    isActive: true,
    createdAt: now
  },
  {
    id: "q-failure",
    content: "최근 실패 경험과 그 경험에서 배운 점을 설명해주세요.",
    tagIds: ["tag-personality", "tag-experience"],
    isActive: true,
    createdAt: now
  },
  {
    id: "q-company",
    content: "우리 회사에 지원한 이유는 무엇인가요?",
    tagIds: ["tag-common"],
    isActive: true,
    createdAt: now
  },
  {
    id: "q-project",
    content: "가장 자신 있는 프로젝트를 문제, 행동, 결과 중심으로 설명해주세요.",
    tagIds: ["tag-tech", "tag-experience"],
    isActive: true,
    createdAt: now
  },
  {
    id: "q-weakness",
    content: "본인의 약점은 무엇이며 어떻게 보완하고 있나요?",
    tagIds: ["tag-personality", "tag-pressure"],
    isActive: true,
    createdAt: now
  },
  {
    id: "q-why-you",
    content: "다른 지원자보다 본인을 뽑아야 하는 이유는 무엇인가요?",
    tagIds: ["tag-common", "tag-pressure"],
    isActive: true,
    createdAt: now
  }
];

export const seedReviewStates: ReviewState[] = seedQuestions.map((question) => ({
  questionId: question.id,
  easeFactor: 2.5,
  intervalDays: 0,
  repetitionCount: 0,
  difficultyLevel: "medium",
  dueAt: now
}));

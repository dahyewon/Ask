"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAppData, resetAllReviews } from "@/features/questions/question.repository";
import { scheduleQuestions } from "@/features/questions/scheduler";
import type { AppData } from "@/features/questions/question.repository";
import { useInterviewStore } from "@/features/interview/interview.store";

export default function HomePage() {
  const router = useRouter();
  const beginInterview = useInterviewStore((state) => state.beginInterview);
  const [data, setData] = useState<AppData | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(["tag-common"]);
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    setData(loadAppData());
  }, []);

  const scheduled = useMemo(() => {
    if (!data) return [];
    return scheduleQuestions({
      questions: data.questions,
      reviewStates: data.reviewStates,
      selectedTagIds: selectedTags,
      count: questionCount
    });
  }, [data, questionCount, selectedTags]);

  if (!data) {
    return <main className="app-shell">불러오는 중...</main>;
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((current) =>
      current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]
    );
  };

  const start = () => {
    beginInterview({
      selectedTags,
      questionCount,
      questions: scheduled
    });
    router.push("/interview");
  };

  const reset = () => {
    const reviewStates = resetAllReviews();
    setData({ ...data, reviewStates });
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <h1>Ask Interview Practice</h1>
          <p>음성 답변과 반복 복습으로 준비하는 비대면 면접 연습</p>
        </div>
        <nav className="nav">
          <button className="btn ghost" onClick={() => router.push("/history")}>기록</button>
          <button className="btn ghost" onClick={() => router.push("/questions")}>질문</button>
        </nav>
      </header>

      <section className="screen setup-screen">
        <div className="panel setup-panel">
          <h2 className="section-title">연습 조건</h2>
          <p className="muted">태그와 질문 수를 고르면 복습 우선순위에 따라 면접이 바로 시작됩니다.</p>

          <div className="tag-grid">
            {data.tags.map((tag) => (
              <button
                key={tag.id}
                className={`tag-button ${selectedTags.includes(tag.id) ? "active" : ""}`}
                onClick={() => toggleTag(tag.id)}
                type="button"
              >
                {tag.name}
              </button>
            ))}
          </div>

          <label className="field">
            질문 개수
            <input
              min={1}
              max={data.questions.length}
              type="number"
              value={questionCount}
              onChange={(event) => setQuestionCount(Number(event.target.value))}
            />
          </label>

          <div className="actions">
            <button className="btn primary" disabled={!scheduled.length} onClick={start}>
              면접 시작
            </button>
            <button className="btn" onClick={reset}>복습 주기 Reset</button>
          </div>
        </div>
      </section>
    </main>
  );
}

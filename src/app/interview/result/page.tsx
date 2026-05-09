"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadAppData, resetAllReviews } from "@/features/questions/question.repository";
import { useInterviewStore } from "@/features/interview/interview.store";
import type { InterviewSession } from "@/features/sessions/session.types";

export default function ResultPage() {
  const router = useRouter();
  const lastSession = useInterviewStore((state) => state.lastSession);
  const clear = useInterviewStore((state) => state.clear);
  const [session, setSession] = useState<InterviewSession | undefined>(lastSession);

  useEffect(() => {
    if (lastSession) {
      setSession(lastSession);
      return;
    }

    const data = loadAppData();
    setSession(data.sessions[0]);
  }, [lastSession]);

  const copyAll = async () => {
    if (!session) return;
    const text = session.answers
      .map((answer) => `Q. ${answer.question}\nA. ${answer.transcript}`)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
  };

  const restart = () => {
    clear();
    router.push("/");
  };

  if (!session) {
    return (
      <main className="app-shell">
        <section className="screen panel">
          <h1>결과가 없습니다</h1>
          <button className="btn primary" onClick={restart}>홈으로</button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <h1>면접 결과</h1>
          <p>{session.status === "completed" ? "완료된 세션" : "중단된 세션"} · 답변 {session.answers.length}개</p>
        </div>
        <nav className="nav">
          <button className="btn" onClick={copyAll}>전체 복사</button>
          <button className="btn" onClick={() => resetAllReviews()}>복습 주기 Reset</button>
          <button className="btn primary" onClick={restart}>새 면접</button>
        </nav>
      </header>

      <section className="screen result-grid">
        <div className="panel">
          <h2 className="section-title">질문/답변</h2>
          {session.answers.length ? (
            session.answers.map((answer) => (
              <article className="answer-card" key={answer.id}>
                <h3>{answer.questionOrder}. {answer.question}</h3>
                <p>{answer.transcript}</p>
                {answer.transcriptStatus === "pending" ? (
                  <p className="muted">STT가 백그라운드에서 처리 중입니다.</p>
                ) : null}
                <div className="rating-row">
                  <span className="muted">평가: {labelRating(answer.difficultyRating)}</span>
                  <span className="muted">답변 시간: {answer.durationSec}초</span>
                  <button
                    className="btn"
                    onClick={() => navigator.clipboard.writeText(`Q. ${answer.question}\nA. ${answer.transcript}`)}
                  >
                    복사
                  </button>
                </div>
              </article>
            ))
          ) : (
            <p className="muted">저장된 답변 없이 면접이 중단되었습니다.</p>
          )}
        </div>

        <aside className="panel">
          <h2 className="section-title">세션 정보</h2>
          <p>시작: {formatDate(session.startedAt)}</p>
          <p>종료: {session.endedAt ? formatDate(session.endedAt) : "-"}</p>
          <p>선택 태그: {session.selectedTags.length}개</p>
          <p>목표 질문: {session.questionCount}개</p>
        </aside>
      </section>
    </main>
  );
}

function labelRating(value: string) {
  if (value === "easy") return "쉬움";
  if (value === "hard") return "어려움";
  return "중간";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

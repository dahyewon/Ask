"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { deleteSession, loadAppData } from "@/features/questions/question.repository";
import type { InterviewSession } from "@/features/sessions/session.types";

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<InterviewSession[]>([]);

  useEffect(() => {
    setSessions(loadAppData().sessions);
  }, []);

  const removeSession = (sessionId: string) => {
    const data = deleteSession(sessionId);
    setSessions(data.sessions);
  };

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div className="brand">
          <h1>면접 기록</h1>
          <p>과거 세션의 질문과 STT 답변을 다시 확인합니다.</p>
        </div>
        <button className="btn primary" onClick={() => router.push("/")}>홈</button>
      </header>

      <section className="screen panel">
        {sessions.length ? (
          sessions.map((session) => (
            <article className="history-item" key={session.id}>
              <div className="history-heading">
                <div>
                  <strong>{formatDate(session.startedAt)}</strong>
                  <p className="muted">
                    {session.status === "completed" ? "완료" : "중단"} · 답변 {session.answers.length}개 · 목표 {session.questionCount}개
                  </p>
                </div>
                <button className="btn danger" onClick={() => removeSession(session.id)}>기록 삭제</button>
              </div>

              <div className="question-list">
                {session.answers.map((answer) => (
                  <div className="question-row" key={answer.id}>
                    <strong>Q. {answer.question}</strong>
                    <p>A. {answer.transcript}</p>
                    {answer.transcriptStatus === "pending" ? (
                      <p className="muted">STT가 백그라운드에서 처리 중입니다.</p>
                    ) : null}
                    <button
                      className="btn"
                      onClick={() => navigator.clipboard.writeText(`Q. ${answer.question}\nA. ${answer.transcript}`)}
                    >
                      복사
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))
        ) : (
          <p className="muted">아직 저장된 면접 기록이 없습니다.</p>
        )}
      </section>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraPreview } from "@/components/interview/CameraPreview";
import { useInterviewStore } from "@/features/interview/interview.store";
import {
  saveSession,
  updateReview,
  updateSavedAnswerTranscript
} from "@/features/questions/question.repository";
import { transcribeAudio } from "@/features/stt/stt.client";
import type { DifficultyRating } from "@/features/questions/question.types";

type InterviewMode = "question" | "answer";

export default function InterviewPage() {
  const router = useRouter();
  const draft = useInterviewStore((state) => state.draft);
  const addAnswer = useInterviewStore((state) => state.addAnswer);
  const updateAnswerTranscript = useInterviewStore((state) => state.updateAnswerTranscript);
  const nextQuestion = useInterviewStore((state) => state.nextQuestion);
  const finishInterview = useInterviewStore((state) => state.finishInterview);
  const [mode, setMode] = useState<InterviewMode>("question");
  const [remainingMs, setRemainingMs] = useState(3000);
  const [elapsed, setElapsed] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [rating, setRating] = useState<DifficultyRating>("medium");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaError, setMediaError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const answerStartedAtRef = useRef(0);

  const currentQuestion = draft?.questions[draft.currentIndex];

  useEffect(() => {
    if (!draft || !currentQuestion) {
      router.replace("/");
    }
  }, [currentQuestion, draft, router]);

  useEffect(() => {
    let activeStream: MediaStream | null = null;

    async function startCamera() {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        setStream(activeStream);
        setMediaError("");
      } catch {
        setMediaError("카메라/마이크 권한을 허용하면 영상과 음성 답변이 함께 기록됩니다.");
      }
    }

    startCamera();

    return () => {
      activeStream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (!currentQuestion) return;
    setMode("question");
    setRemainingMs(3000);
    setElapsed(0);
    setRating("medium");
    setIsMoving(false);
  }, [currentQuestion?.id]);

  useEffect(() => {
    if (mode !== "question" || !currentQuestion) return;

    const startedAt = Date.now();
    const tick = window.setInterval(() => {
      setRemainingMs(Math.max(0, 3000 - (Date.now() - startedAt)));
    }, 100);
    const timeout = window.setTimeout(() => {
      setMode("answer");
    }, 3000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timeout);
    };
  }, [currentQuestion, mode]);

  useEffect(() => {
    if (mode !== "answer" || !stream) return;

    chunksRef.current = [];
    answerStartedAtRef.current = Date.now();
    setElapsed(0);

    const interval = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - answerStartedAtRef.current) / 1000));
    }, 250);

    try {
      const audioStream = new MediaStream(stream.getAudioTracks());
      const options = MediaRecorder.isTypeSupported("audio/webm") ? { mimeType: "audio/webm" } : undefined;
      const recorder = new MediaRecorder(audioStream, options);
      recorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.start();
    } catch {
      setMediaError("마이크 녹음을 시작하지 못했습니다. 권한을 확인해주세요.");
    }

    return () => {
      window.clearInterval(interval);
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
      }
    };
  }, [mode, stream]);

  const countdown = useMemo(() => Math.max(1, Math.ceil(remainingMs / 1000)), [remainingMs]);
  const timeText = useMemo(() => {
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const seconds = (elapsed % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [elapsed]);

  const stopInterview = async () => {
    if (isMoving) return;
    if (mode === "answer") {
      await stopRecorder();
    }
    const session = finishInterview("stopped");
    if (session) saveSession(session);
    router.replace("/history");
  };

  const finishAnswer = async () => {
    if (!draft || !currentQuestion || isMoving || mode !== "answer") return;
    setIsMoving(true);

    const sessionId = draft.sessionId;
    const audioBlob = await stopRecorder();
    updateReview(currentQuestion.id, rating);

    const answer = addAnswer({
      questionId: currentQuestion.id,
      question: currentQuestion.content,
      transcript: "STT 처리 중...",
      transcriptStatus: "pending",
      durationSec: elapsed,
      difficultyRating: rating
    });

    if (answer && audioBlob.size > 0) {
      void transcribeAudio(audioBlob)
        .then((transcript) => {
          updateAnswerTranscript(answer.id, transcript, "completed");
          updateSavedAnswerTranscript(sessionId, answer.id, transcript, "completed");
        })
        .catch(() => {
          const transcript = "STT 처리에 실패했습니다. 음성 답변은 완료된 것으로 기록했습니다.";
          updateAnswerTranscript(answer.id, transcript, "failed");
          updateSavedAnswerTranscript(sessionId, answer.id, transcript, "failed");
        });
    }

    const hasNext = nextQuestion();
    if (hasNext) {
      return;
    }

    window.setTimeout(() => {
      const session = finishInterview("completed");
      if (session) saveSession(session);
      router.replace("/interview/result");
    }, 0);
  };

  const stopRecorder = () => {
    return new Promise<Blob>((resolve) => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
        return;
      }

      recorder.onstop = () => {
        resolve(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorder.stop();
    });
  };

  if (!draft || !currentQuestion) {
    return null;
  }

  return (
    <main className={`interview-shell unified-interview ${mode}`}>
      <header className="interview-header">
        <div>
          <p className="eyebrow">
            {mode === "question" ? "Question" : "Answer"} {draft.currentIndex + 1} / {draft.questions.length}
          </p>
          <h1>{mode === "question" ? "질문을 보고 답변을 준비하세요" : "실제 면접처럼 답변하세요"}</h1>
        </div>
        <button className="btn danger" onClick={stopInterview}>면접 중단</button>
      </header>

      <section className="interview-composer">
        <CameraPreview className="camera-tile morph-camera" stream={stream} />
        {mediaError ? <p className="media-warning">{mediaError}</p> : null}

        <article className="morph-question-card">
          <p className="answer-label">현재 질문</p>
          <h2>{currentQuestion.content}</h2>
        </article>

        <aside className="interview-control-panel">
          {mode === "question" ? (
            <div className="countdown-pill inline">
              <span>답변 시작까지</span>
              <strong>{countdown}</strong>
            </div>
          ) : (
            <>
              <div className="recording-meter">
                <span className="recording-dot" />
                <strong>{timeText}</strong>
              </div>
              <div className="answer-actions">
                <div className="segmented" aria-label="질문 난이도 평가">
                  {[
                    ["easy", "쉬움"],
                    ["medium", "중간"],
                    ["hard", "어려움"]
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      className={rating === value ? "active" : ""}
                      onClick={() => setRating(value as DifficultyRating)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <button className="btn primary large" onClick={finishAnswer} disabled={isMoving}>
                  {isMoving ? "넘어가는 중" : "답변 종료"}
                </button>
              </div>
            </>
          )}
        </aside>
      </section>
    </main>
  );
}

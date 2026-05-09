"use client";

export async function transcribeAudio(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio", audioBlob, "answer.webm");

  const response = await fetch("/api/stt", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("음성 변환에 실패했습니다.");
  }

  const data = (await response.json()) as { transcript: string };
  return data.transcript;
}

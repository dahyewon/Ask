import { NextResponse } from "next/server";

const STT_ENDPOINT = "http://localhost:8000/stt";

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof File)) {
    return NextResponse.json({ error: "audio file is required" }, { status: 400 });
  }

  const upstreamFormData = new FormData();
  upstreamFormData.append("file", audio, normalizeFileName(audio));

  try {
    const response = await fetch(STT_ENDPOINT, {
      method: "POST",
      body: upstreamFormData
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `STT server responded with ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { text?: string; transcript?: string };
    return NextResponse.json({ transcript: data.text ?? data.transcript ?? "" });
  } catch {
    return NextResponse.json(
      { error: "STT server is not reachable at http://localhost:8000/stt" },
      { status: 502 }
    );
  }
}

function normalizeFileName(file: File) {
  if (file.name && /\.(mp3|wav|m4a|webm)$/i.test(file.name)) {
    return file.name;
  }
  if (file.type.includes("mpeg")) return "answer.mp3";
  if (file.type.includes("wav")) return "answer.wav";
  if (file.type.includes("mp4")) return "answer.m4a";
  return "answer.webm";
}

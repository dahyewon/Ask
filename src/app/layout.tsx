import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ask Interview Practice",
  description: "비대면 면접 음성 답변 및 반복 학습 MVP"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

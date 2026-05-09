"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LegacyAnswerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/interview");
  }, [router]);

  return null;
}

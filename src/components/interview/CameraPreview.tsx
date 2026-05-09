"use client";

import { useEffect, useRef, useState } from "react";

type CameraPreviewProps = {
  className?: string;
  stream?: MediaStream | null;
  muted?: boolean;
};

export function CameraPreview({ className, stream, muted = true }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const ownStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function attachCamera() {
      try {
        if (stream === null) {
          if (videoRef.current) videoRef.current.srcObject = null;
          setCameraError("카메라/마이크 권한을 허용하면 실제 면접 화면이 표시됩니다.");
          return;
        }

        const nextStream = stream ?? (await navigator.mediaDevices.getUserMedia({ video: true, audio: false }));
        if (!isMounted) {
          if (!stream) nextStream.getTracks().forEach((track) => track.stop());
          return;
        }
        if (!stream) ownStreamRef.current = nextStream;
        if (videoRef.current) {
          videoRef.current.srcObject = nextStream;
        }
        setCameraError("");
      } catch {
        setCameraError("카메라 권한을 허용하면 실제 면접 화면이 표시됩니다.");
      }
    }

    attachCamera();

    return () => {
      isMounted = false;
      ownStreamRef.current?.getTracks().forEach((track) => track.stop());
      ownStreamRef.current = null;
    };
  }, [stream]);

  return (
    <div className={`camera-preview ${className ?? ""}`}>
      <video ref={videoRef} autoPlay playsInline muted={muted} />
      {cameraError ? <div className="camera-fallback">{cameraError}</div> : null}
    </div>
  );
}

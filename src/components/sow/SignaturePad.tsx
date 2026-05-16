"use client";
import { useRef, useEffect, useCallback } from "react";

interface SignaturePadProps {
  onSigned: (dataUrl: string) => void;
}

export function SignaturePad({ onSigned }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<{ isEmpty: () => boolean; clear: () => void; toDataURL: (type?: string) => string; off: () => void } | null>(null);

  useEffect(() => {
    async function init() {
      if (!canvasRef.current) return;
      const { default: SignaturePadLib } = await import("signature_pad");
      padRef.current = new SignaturePadLib(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "#1a1f5e",
      });
    }
    init();
    return () => { padRef.current?.off(); };
  }, []);

  const handleConfirm = useCallback(() => {
    if (!padRef.current || padRef.current.isEmpty()) {
      alert("Please draw your signature before confirming.");
      return;
    }
    onSigned(padRef.current.toDataURL("image/png"));
  }, [onSigned]);

  const handleClear = useCallback(() => {
    padRef.current?.clear();
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm font-600 text-[#1a1f5e]">Draw your signature below:</p>
      <div className="border-2 border-[#e2e4f0] rounded-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={500}
          height={150}
          className="w-full bg-white cursor-crosshair block"
          style={{ touchAction: "none" }}
        />
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm border border-[#e2e4f0] rounded-lg hover:bg-[#f4f5fb] text-gray-600 transition-colors"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-4 py-2 text-sm bg-[#1a1f5e] text-[#d4a017] rounded-lg hover:bg-[#3d2d8e] font-600 transition-colors"
        >
          Confirm Signature
        </button>
      </div>
    </div>
  );
}

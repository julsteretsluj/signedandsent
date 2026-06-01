"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import {
  SIGNATURE_FONTS,
  SignatureFontId,
  SignatureMethod,
  normalizeSignatureDataUrl,
  renderTypedSignatureToDataUrl,
} from "@/lib/signature";

type SignaturePanelProps = {
  onSignatureReady: (dataUrl: string | null, method: SignatureMethod | null) => void;
};

type Tab = SignatureMethod;

export function SignaturePanel({ onSignatureReady }: SignaturePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("drawn");
  const [typedName, setTypedName] = useState("");
  const [fontId, setFontId] = useState<SignatureFontId>("dancing");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(ratio, ratio);
    padRef.current?.clear();
  }, []);

  useEffect(() => {
    if (tab !== "drawn" || !canvasRef.current) return;

    const pad = new SignaturePad(canvasRef.current, {
      backgroundColor: "rgba(0, 0, 0, 0)",
      penColor: "#0f172a",
    });
    padRef.current = pad;
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const onEnd = async () => {
      if (pad.isEmpty()) {
        onSignatureReady(null, null);
      } else {
        const normalized = await normalizeSignatureDataUrl(
          pad.toDataURL("image/png")
        );
        onSignatureReady(normalized, "drawn");
      }
    };
    pad.addEventListener("endStroke", onEnd);

    return () => {
      pad.removeEventListener("endStroke", onEnd);
      window.removeEventListener("resize", resizeCanvas);
      pad.off();
      padRef.current = null;
    };
  }, [tab, onSignatureReady, resizeCanvas]);

  useEffect(() => {
    if (tab !== "typed") return;
    if (!typedName.trim()) {
      onSignatureReady(null, null);
      return;
    }
    const font = SIGNATURE_FONTS.find((f) => f.id === fontId)!;
    const dataUrl = renderTypedSignatureToDataUrl(typedName.trim(), font.family);
    onSignatureReady(dataUrl, "typed");
  }, [tab, typedName, fontId, onSignatureReady]);

  useEffect(() => {
    if (tab !== "uploaded") return;
    if (!uploadPreview) {
      onSignatureReady(null, null);
      return;
    }
    let cancelled = false;
    normalizeSignatureDataUrl(uploadPreview).then((normalized) => {
      if (!cancelled) onSignatureReady(normalized, "uploaded");
    });
    return () => {
      cancelled = true;
    };
  }, [tab, uploadPreview, onSignatureReady]);

  function clearDrawn() {
    padRef.current?.clear();
    onSignatureReady(null, null);
  }

  function handleUpload(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, etc.).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadPreview(result);
    };
    reader.readAsDataURL(file);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "drawn", label: "Draw" },
    { id: "typed", label: "Type" },
    { id: "uploaded", label: "Upload" },
  ];

  return (
    <div className="brand-panel overflow-hidden">
      <div className="border-b border-brand-navy/8 px-4 pt-4">
        <p className="mb-3 text-sm font-medium text-brand-navy">Your signature</p>
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-white text-brand-royal shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {tab === "drawn" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Sign with your finger, stylus, or mouse on the pad below.
            </p>
            <div
              className="overflow-hidden rounded-lg border border-dashed border-slate-300 bg-[length:12px_12px] bg-white"
              style={{
                backgroundImage:
                  "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0",
              }}
            >
              <canvas
                ref={canvasRef}
                className="h-40 w-full touch-none bg-transparent"
                aria-label="Signature drawing pad"
              />
            </div>
            <button
              type="button"
              onClick={clearDrawn}
              className="text-sm text-slate-600 underline hover:text-slate-900"
            >
              Clear signature
            </button>
          </div>
        )}

        {tab === "typed" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Type your full name as you would sign it.
            </p>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Parent / Guardian full name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-brand-navy focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
            />
            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">Font style</p>
              <div className="flex flex-wrap gap-2">
                {SIGNATURE_FONTS.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => setFontId(font.id)}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${
                      fontId === font.id
                        ? "border-brand-royal bg-brand-royal-muted text-brand-royal"
                        : "border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                    style={{ fontFamily: `"${font.family}", cursive` }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>
            {typedName.trim() && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p
                  className="text-4xl text-slate-900"
                  style={{
                    fontFamily: `"${SIGNATURE_FONTS.find((f) => f.id === fontId)?.family}", cursive`,
                  }}
                >
                  {typedName}
                </p>
                <p className="mt-2 text-xs text-slate-500">Preview</p>
              </div>
            )}
          </div>
        )}

        {tab === "uploaded" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              Upload a photo or scan of your handwritten signature (PNG or JPG).
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleUpload(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-lg border-2 border-dashed border-slate-300 px-4 py-8 text-sm text-slate-600 transition hover:border-brand-royal hover:text-brand-royal"
            >
              {uploadPreview ? "Choose a different image" : "Click to upload signature image"}
            </button>
            {uploadPreview && (
              <div
                className="flex justify-center rounded-lg border border-slate-200 p-4"
                style={{
                  backgroundImage:
                    "linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)",
                  backgroundSize: "12px 12px",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadPreview}
                  alt="Uploaded signature preview"
                  className="max-h-24 object-contain"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

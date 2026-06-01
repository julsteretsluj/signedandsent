"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CodeEntryForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not find that code.");
        return;
      }

      router.push(`/sign/${data.code}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-700">
          Your access code
        </span>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. AB12CD34"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-lg tracking-widest text-brand-navy uppercase placeholder:normal-case placeholder:tracking-normal placeholder:text-slate-400 shadow-sm focus:border-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/25"
          autoComplete="off"
          spellCheck={false}
          required
          minLength={4}
        />
      </label>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || code.trim().length < 4}
        className="w-full rounded-xl bg-gradient-to-r from-brand-royal to-brand-royal-dark px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-royal/30 transition hover:from-brand-royal-dark hover:to-brand-navy disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Looking up…" : "View my form"}
      </button>
    </form>
  );
}

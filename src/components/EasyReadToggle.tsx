"use client";

import { useEasyRead } from "./EasyReadProvider";

export function EasyReadToggle() {
  const { easyRead, toggleEasyRead } = useEasyRead();

  return (
    <button
      type="button"
      onClick={toggleEasyRead}
      aria-pressed={easyRead}
      aria-label={
        easyRead
          ? "Switch to handwriting style fonts"
          : "Switch to easy-read fonts for better accessibility"
      }
      title={
        easyRead
          ? "Return to handwriting style"
          : "Use plain, easy-to-read fonts"
      }
      className="inline-flex items-center gap-2 rounded-full border border-brand-navy/12 bg-white px-3 py-1.5 text-xs font-medium text-brand-navy shadow-sm transition hover:border-brand-royal/40 hover:text-brand-royal focus:outline-none focus:ring-2 focus:ring-brand-royal/30 sm:text-sm"
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-royal-muted text-sm leading-none">
        {easyRead ? "Aa" : "✎"}
      </span>
      <span className="hidden sm:inline">
        {easyRead ? "Handwriting style" : "Easy read"}
      </span>
      <span className="sm:hidden">{easyRead ? "Script" : "Easy read"}</span>
    </button>
  );
}

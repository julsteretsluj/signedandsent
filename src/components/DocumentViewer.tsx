type DocumentViewerProps = {
  documentUrl: string;
};

export function DocumentViewer({ documentUrl }: DocumentViewerProps) {
  return (
    <div className="brand-panel overflow-hidden">
      <div className="border-b border-brand-navy/8 bg-brand-royal-muted/50 px-4 py-3">
        <p className="text-sm font-medium text-brand-navy">
          SEAMUN I 2027 — Parental consent &amp; data privacy form
        </p>
        <p className="text-xs text-brand-ink">
          Preview of the official form. Your Section 1 answers and signature are
          added automatically on submit.
        </p>
      </div>
      <iframe
        src={documentUrl}
        title="SEAMUN I 2027 parental consent form"
        className="h-[min(60vh,520px)] w-full bg-white"
      />
    </div>
  );
}

import type { FormKind } from "@/lib/form-kind";
import { getFormKindLabel } from "@/lib/form-kind";

type DocumentViewerProps = {
  documentUrl: string;
  formKind: FormKind;
};

export function DocumentViewer({ documentUrl, formKind }: DocumentViewerProps) {
  const formLabel = getFormKindLabel(formKind);
  const title =
    formKind === "visaLetter"
      ? `SEAMUN I 2027 — ${formLabel}`
      : `SEAMUN I 2027 — ${formLabel} & data privacy form`;
  return (
    <div className="brand-panel overflow-hidden">
      <div className="border-b border-brand-navy/8 bg-brand-royal-muted/50 px-4 py-3">
        <p className="text-sm font-medium text-brand-navy">
          {title.replace("&", "&amp;")}
        </p>
        <p className="text-xs text-brand-ink">
          Preview of the official form. Your Section 1 answers and signature are
          added automatically on submit.
        </p>
      </div>
      <iframe
        src={documentUrl}
        title={`SEAMUN I 2027 ${formLabel} form`}
        className="h-[min(60vh,520px)] w-full bg-white"
      />
    </div>
  );
}

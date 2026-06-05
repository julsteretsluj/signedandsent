import { notFound } from "next/navigation";
import { SignForm } from "@/components/SignForm";
import { findAccessCode } from "@/lib/access-codes";
import { getFormKind, getFormKindLabel } from "@/lib/form-kind";

type PageProps = {
  params: Promise<{ code: string }>;
};

export default async function SignPage({ params }: PageProps) {
  const { code: rawCode } = await params;
  const code = rawCode.trim().toUpperCase();

  const accessCode = await findAccessCode(code);

  if (!accessCode) {
    notFound();
  }

  const formKind = getFormKind({
    code,
    documentPath: accessCode.documentPath,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-brand-navy sm:text-3xl">
          Sign {getFormKindLabel(formKind)}
        </h1>
        <p className="mt-2 text-brand-ink">
          Access code{" "}
          <span className="font-mono text-base font-semibold tracking-wide text-brand-royal">
            {code}
          </span>
        </p>
      </div>
      <SignForm
        code={code}
        documentUrl={`/${accessCode.documentPath}`}
        formKind={formKind}
      />
    </div>
  );
}

"use client";

type SignaturePreviewProps = {
  signature: string;
};

export function SignaturePreview({ signature }: SignaturePreviewProps) {
  if (!signature) return null;
  const lines = signature.split("\n");
  return (
    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm font-medium text-muted-foreground">
      {lines.map((line, idx) => (
        <p className="leading-tight" key={`${line}-${idx}`}>
          {line || <span>&nbsp;</span>}
        </p>
      ))}
    </div>
  );
}

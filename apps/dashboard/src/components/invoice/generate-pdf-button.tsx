"use client";

import { pdf } from "@react-pdf/renderer";
import { Download, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { InvoicePDF } from "./invoice-pdf";
import QRCode from "qrcode";

function extractPlainText(json: any): string {
  if (!json) return "";
  const lines: string[] = [];
  const walk = (node: any) => {
    if (!node) return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.type === "text" && node.text) lines.push(String(node.text));
    if (node.content) walk(node.content);
  };
  walk(json);
  // Join with spaces, compress whitespace
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

interface GeneratePDFButtonProps {
  invoice: any;
  items: any[];
  currency?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  template?: Record<string, any> | null;
  fromDetails?: any | null;
  customerDetails?: any | null;
  paymentDetails?: any | null;
  noteDetails?: any | null;
  topBlock?: any | null;
  bottomBlock?: any | null;
}

export function GeneratePDFButton({
  invoice,
  items,
  currency = "GHS",
  variant = "outline",
  size = "sm",
  template,
  fromDetails,
  customerDetails,
  paymentDetails,
  noteDetails,
  topBlock,
  bottomBlock,
}: GeneratePDFButtonProps) {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const fromText = useMemo(() => extractPlainText(fromDetails), [fromDetails]);
  const toText = useMemo(() => extractPlainText(customerDetails), [customerDetails]);
  const paymentText = useMemo(() => extractPlainText(paymentDetails), [paymentDetails]);
  const noteRich = useMemo(() => extractPlainText(noteDetails), [noteDetails]);
  const topText = useMemo(() => extractPlainText(topBlock), [topBlock]);
  const bottomText = useMemo(() => extractPlainText(bottomBlock), [bottomBlock]);

  const handleGeneratePDF = async () => {
    setGenerating(true);

    try {
      let qrDataUrl: string | null = null;
      if (template?.includeQr && invoice?.invoiceUrl) {
        try {
          qrDataUrl = await QRCode.toDataURL(String(invoice.invoiceUrl), { margin: 0 });
        } catch {}
      }
      // Prepare data for PDF
      const pdfData = {
        invoice: {
          invoiceNumber: invoice.invoiceNumber || "INV-000",
          issueDate: invoice.createdAt || new Date().toISOString(),
          dueDate: invoice.dueDate,
          subtotal: Number(invoice.subtotal) || 0,
          tax: Number(invoice.tax) || 0,
          discount: Number(invoice.discount) || 0,
          amount: Number(invoice.amount) || 0,
          notes: invoice.notes || noteRich,
          logoUrl: invoice.logoUrl,
          status: invoice.status || "draft",
        },
        items: items.map((item) => ({
          name: item.name,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          total: Number(item.total),
        })),
        currency,
        pageSize: ((template?.size as any) || "a4").toLowerCase() === "letter" ? ("LETTER" as const) : ("A4" as const),
        decimals: template?.includeDecimals ? 2 : 0,
        qrDataUrl,
        topText,
        bottomText,
        labels: {
          from: (template?.fromLabel as string) || "From",
          to: (template?.customerLabel as string) || "Bill To",
          payment: (template?.paymentLabel as string) || "Payment Details",
        },
        paymentText,
        from: (() => {
          if (fromText) {
            const [name, ...rest] = fromText.split("\n");
            return { name: name || "", address: rest.join(" ") || "", phone: "" };
          }
          return { name: "", address: "", phone: "" };
        })(),
        to: (() => {
          if (toText) {
            const [name, ...rest] = toText.split("\n");
            return { name: name || (invoice.clientName || "Customer"), address: rest.join(" ") || undefined };
          }
          return { name: invoice.clientName || "Customer", address: invoice.clientAddress || undefined };
        })(),
      };

      // Generate PDF
      const blob = await pdf(<InvoicePDF {...pdfData} />).toBlob();

      // Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${invoice.invoiceNumber || "invoice"}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF generated successfully!",
        description: `${invoice.invoiceNumber}.pdf downloaded`,
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Failed to generate PDF",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button
      data-generate-pdf
      className="gap-2"
      disabled={generating}
      onClick={handleGeneratePDF}
      size={size}
      variant={variant}
    >
      {generating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download PDF
        </>
      )}
    </Button>
  );
}

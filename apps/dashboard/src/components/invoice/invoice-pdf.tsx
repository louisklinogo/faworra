import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

// Register fonts (optional - for better typography)
// Register fonts (optional - for better typography)
// Using standard fonts for PDF to ensure reliability and speed
// Helvetica is standard in PDF and fits Swiss Style perfectly

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1f2937",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  invoiceInfo: {
    textAlign: "right",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
  },
  invoiceNumber: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 3,
  },
  date: {
    fontSize: 10,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#6b7280",
    textTransform: "uppercase",
  },
  addressBlock: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  companyName: {
    fontWeight: "bold",
    fontSize: 11,
    marginBottom: 3,
  },
  fromToGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  fromToSection: {
    width: "48%",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f3f4f6",
  },
  tableColDesc: {
    width: "50%",
  },
  tableColQty: {
    width: "15%",
    textAlign: "right",
  },
  tableColPrice: {
    width: "17.5%",
    textAlign: "right",
  },
  tableColAmount: {
    width: "17.5%",
    textAlign: "right",
  },
  tableHeaderText: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableCellText: {
    fontSize: 10,
  },
  totalsSection: {
    marginLeft: "auto",
    width: "40%",
    marginTop: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 10,
    textAlign: "right",
  },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "right",
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#6b7280",
  },
  notesText: {
    fontSize: 9,
    lineHeight: 1.5,
    color: "#4b5563",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 8,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: "#e5e7eb",
  },
});

interface InvoicePDFProps {
  invoice: {
    invoiceNumber: string;
    issueDate: string;
    dueDate?: string;
    subtotal: number;
    tax: number;
    discount: number;
    amount: number;
    notes?: string;
    logoUrl?: string;
    status: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  currency: string;
  pageSize?: "A4" | "LETTER";
  decimals?: number;
  qrDataUrl?: string | null;
  from: {
    name: string;
    address: string;
    phone: string;
  };
  to: {
    name: string;
    address?: string;
  };
  labels?: { from?: string; to?: string; payment?: string };
  paymentText?: string;
  topText?: string;
  bottomText?: string;
}

export function InvoicePDF({ invoice, items, from, to, currency, pageSize = "A4", decimals = 2, qrDataUrl, labels, paymentText, topText, bottomText }: InvoicePDFProps) {
  const fmt = (amount: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency, minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(
      amount || 0,
    );
  return (
    <Document>
      <Page size={pageSize} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>{invoice.logoUrl && <Image src={invoice.logoUrl} style={styles.logo} />}</View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <Text style={styles.date}>
              Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
            </Text>
            {invoice.dueDate && (
              <Text style={styles.date}>
                Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
              </Text>
            )}
            {qrDataUrl && <Image src={qrDataUrl} style={{ width: 80, height: 80, marginTop: 8, marginLeft: "auto" }} />}
          </View>
        </View>

        {topText && (
          <View style={[styles.section, { marginTop: -10 }]}>
            <Text style={styles.notesText}>{topText}</Text>
          </View>
        )}

        {/* From/To Section */}
        <View style={styles.fromToGrid}>
          <View style={styles.fromToSection}>
            <Text style={styles.sectionTitle}>{labels?.from || "From"}</Text>
            <View style={styles.addressBlock}>
              <Text style={styles.companyName}>{from.name}</Text>
              <Text>{from.address}</Text>
              <Text>{from.phone}</Text>
            </View>
          </View>

          <View style={styles.fromToSection}>
            <Text style={styles.sectionTitle}>{labels?.to || "Bill To"}</Text>
            <View style={styles.addressBlock}>
              <Text style={styles.companyName}>{to.name}</Text>
              {to.address && <Text>{to.address}</Text>}
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, styles.tableColDesc]}>Description</Text>
            <Text style={[styles.tableHeaderText, styles.tableColQty]}>Qty</Text>
            <Text style={[styles.tableHeaderText, styles.tableColPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderText, styles.tableColAmount]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {items.map((item, index) => (
            <View key={`${item.name}-${index}`} style={styles.tableRow}>
              <Text style={[styles.tableCellText, styles.tableColDesc]}>{item.name}</Text>
              <Text style={[styles.tableCellText, styles.tableColQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCellText, styles.tableColPrice]}>{fmt(item.unitPrice)}</Text>
              <Text style={[styles.tableCellText, styles.tableColAmount]}>{fmt(item.total)}</Text>
            </View>
          ))}
        </View>

        {/* Totals Section */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{fmt(invoice.subtotal)}</Text>
          </View>

          {invoice.tax > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalValue}>{fmt(invoice.tax)}</Text>
            </View>
          )}

          {invoice.discount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.totalValue}>-{fmt(invoice.discount)}</Text>
            </View>
          )}

          <View style={styles.grandTotal}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{fmt(invoice.amount)}</Text>
          </View>
        </View>

        {/* Payment Details */}
        {paymentText && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{labels?.payment || "Payment Details"}</Text>
            <Text style={styles.notesText}>{paymentText}</Text>
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {bottomText && (
          <View style={[styles.section, { marginTop: 10 }]}>
            <Text style={styles.notesText}>{bottomText}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business!</Text>
          <Text>Invoice generated on {new Date().toLocaleDateString()}</Text>
        </View>
      </Page>
    </Document>
  );
}

import type { TaxRateConfig } from "../types";

// Tax rate configurations by country (copied from Midday)
export const TAX_RATE_CONFIGS: Record<string, TaxRateConfig> = {
  // Sweden
  SE: {
    countryCode: "SE",
    taxType: "vat",
    defaultRate: 25,
    categoryRates: {
      meals: 12,
      // Income categories (VAT rate 0%)
      revenue: 0,
      income: 0,
      "product-sales": 0,
      "service-revenue": 0,
      "consulting-revenue": 0,
      "subscription-revenue": 0,
      "interest-income": 0,
      "other-income": 0,
      "customer-refunds": 0,
      "chargebacks-disputes": 0,
      // Other exempt categories
      insurance: 0,
      benefits: 0,
      salary: 0,
      "employer-taxes": 0,
      taxes: 0,
      "vat-gst-pst-qst-payments": 0,
      "sales-use-tax-payments": 0,
      "income-tax-payments": 0,
      "payroll-tax-remittances": 0,
      "government-fees": 0,
      "credit-card-payment": 0,
      "loan-proceeds": 0,
      "loan-principal-repayment": 0,
      "interest-expense": 0,
      "payment-platform-payouts": 0,
      // Banking & Finance categories (VAT rate 0%)
      "banking-finance": 0,
      "banking-fees": 0,
      transfer: 0,
      "internal-transfer": 0,
      payouts: 0,
      "processor-fees": 0,
      fees: 0,
      // Assets categories (VAT rate 0%)
      "assets-capex": 0,
      "fixed-assets": 0,
      "prepaid-expenses": 0,
      // Owner/Equity categories (VAT rate 0%)
      "owner-equity": 0,
      "owner-draws": 0,
      "capital-investment": 0,
      "charitable-donations": 0,
      uncategorized: 0,
    },
  },
  // ... truncated for brevity in this copy; mirror Midday dataset if/when needed
  DEFAULT: {
    countryCode: "DEFAULT",
    taxType: null,
    defaultRate: 0,
    categoryRates: {},
  },
};

export function getTaxRateForCategory(
  countryCode: string | undefined | null,
  categorySlug: string,
): number {
  const effectiveCountryCode = countryCode || "DEFAULT";
  const config =
    TAX_RATE_CONFIGS[effectiveCountryCode] || TAX_RATE_CONFIGS.DEFAULT;
  if (config?.categoryRates?.[categorySlug] !== undefined) {
    return config.categoryRates[categorySlug];
  }
  return config?.defaultRate || 0;
}

export function getTaxTypeForCountry(
  countryCode: string | undefined | null,
): string | null {
  const effectiveCountryCode = countryCode || "DEFAULT";
  const config =
    TAX_RATE_CONFIGS[effectiveCountryCode] || TAX_RATE_CONFIGS.DEFAULT;
  return config?.taxType || null;
}

export function getSupportedCountries(): string[] {
  return Object.keys(TAX_RATE_CONFIGS).filter((code) => code !== "DEFAULT");
}

export function isCountrySupported(countryCode: string | undefined): boolean {
  if (!countryCode) return false;
  return countryCode in TAX_RATE_CONFIGS;
}

"use client";

import { useMemo } from "react";
import { AnimatedNumber } from "@/components/animated-number";
import { FormatAmount } from "@/components/format-amount";
import { PaymentScoreVisualizer } from "@/components/payment-score-visualizer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInvoicesFilters } from "../_hooks/use-invoices-filters";
import { useUserQuery } from "@/hooks/use-user";
import { useTRPC } from "@/trpc/client";

const OPEN_STATUSES = ["draft", "sent", "partially_paid"] as const;
const OVERDUE_STATUSES = ["overdue"] as const;
const PAID_STATUSES = ["paid"] as const;

type SummaryData = {
  totalAmount: number;
  invoiceCount: number;
  currency: string;
  breakdown?: Array<{
    currency: string;
    originalAmount: number;
    convertedAmount: number;
    count: number;
  }>;
};

type SummaryCardProps = {
  title: string;
  data?: SummaryData;
  isLoading: boolean;
  onClick: () => void;
  isSelected: boolean;
  description?: string;
};

function SummaryCard({ title, data, isLoading, onClick, isSelected }: SummaryCardProps) {
  const { data: user } = useUserQuery();

  if (isLoading) {
    return <SummaryCardSkeleton />;
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          No data
        </CardContent>
      </Card>
    );
  }

  const baseCurrency = user?.baseCurrency ?? data.currency ?? "USD";
  const hasMultipleCurrencies = data.breakdown && data.breakdown.length > 1;

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left"
    >
      <Card className={isSelected ? "border-primary" : "transition-colors hover:border-muted-foreground/40"}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-mono text-2xl font-medium">
            <AnimatedNumber
              key={`${title}-${data.currency}`}
              value={data.totalAmount}
              currency={data.currency ?? baseCurrency}
              locale={user?.locale}
              maximumFractionDigits={0}
            />
          </CardTitle>

          {hasMultipleCurrencies && data.breakdown ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-muted-foreground">
                    <Icons.InfoOutline className="h-4 w-4" />
                  </span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs space-y-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Currency breakdown</p>
                  <div className="space-y-1">
                    {data.breakdown.map((item) => (
                      <div key={item.currency} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.currency}</span>
                          <span className="text-muted-foreground">({item.count})</span>
                        </div>
                        <div className="text-right font-mono">
                          <FormatAmount
                            amount={item.originalAmount}
                            currency={item.currency}
                            maximumFractionDigits={0}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </CardHeader>

        <CardContent className="space-y-1">
          <div className="font-medium">{title}</div>
          <div className="text-sm text-muted-foreground">
            {data.invoiceCount} {data.invoiceCount === 1 ? "invoice" : "invoices"}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

function SummaryCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>
          <Skeleton className="h-7 w-24" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

type PaymentCardProps = {
  score?: number;
  paymentStatus?: string;
  isLoading: boolean;
};

function PaymentStatusCard({ score, paymentStatus, isLoading }: PaymentCardProps) {
  const normalizedScore = useMemo(() => Math.max(0, Math.min(10, score ?? 0)), [score]);

  const label =
    paymentStatus === "good"
      ? "Good"
      : paymentStatus === "bad"
        ? "Needs attention"
        : "Average";

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>
            <Skeleton className="h-7 w-20" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-2 pb-3">
        <CardTitle className="font-mono text-2xl font-medium">{normalizedScore}/10</CardTitle>
        <PaymentScoreVisualizer score={normalizedScore} paymentStatus={paymentStatus} />
      </CardHeader>
      <CardContent className="space-y-1 text-sm text-muted-foreground">
        <div className="font-medium text-foreground">{label}</div>
        <p>Based on recent invoice payments.</p>
      </CardContent>
    </Card>
  );
}

export function InvoicesOverview() {
  const trpc = useTRPC();
  const { statuses, setStatuses } = useInvoicesFilters();

  const openQuery = trpc.invoices.invoiceSummary.useQuery({ statuses: [...OPEN_STATUSES] }, { staleTime: 60_000 });
  const overdueQuery = trpc.invoices.invoiceSummary.useQuery({ statuses: [...OVERDUE_STATUSES] }, { staleTime: 60_000 });
  const paidQuery = trpc.invoices.invoiceSummary.useQuery({ statuses: [...PAID_STATUSES] }, { staleTime: 60_000 });
  const paymentStatusQuery = trpc.invoices.paymentStatus.useQuery(undefined, { staleTime: 60_000 });

  const isSelected = (target: readonly string[]) => {
    if (!statuses.length && target.length === 0) return true;
    if (statuses.length !== target.length) return false;
    const current = statuses.slice().sort();
    const next = [...target].sort();
    return current.every((value, index) => value === next[index]);
  };

  const toggleStatuses = (target: readonly string[]) => {
    if (isSelected(target)) {
      setStatuses(null);
    } else {
      setStatuses([...target]);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Open"
        data={openQuery.data}
        isLoading={openQuery.isLoading}
        onClick={() => toggleStatuses(OPEN_STATUSES)}
        isSelected={isSelected(OPEN_STATUSES)}
      />
      <SummaryCard
        title="Overdue"
        data={overdueQuery.data}
        isLoading={overdueQuery.isLoading}
        onClick={() => toggleStatuses(OVERDUE_STATUSES)}
        isSelected={isSelected(OVERDUE_STATUSES)}
      />
      <SummaryCard
        title="Paid"
        data={paidQuery.data}
        isLoading={paidQuery.isLoading}
        onClick={() => toggleStatuses(PAID_STATUSES)}
        isSelected={isSelected(PAID_STATUSES)}
      />
      <PaymentStatusCard
        score={paymentStatusQuery.data?.score}
        paymentStatus={paymentStatusQuery.data?.paymentStatus}
        isLoading={paymentStatusQuery.isLoading}
      />
    </div>
  );
}

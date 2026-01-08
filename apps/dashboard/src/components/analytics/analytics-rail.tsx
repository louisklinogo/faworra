"use client";

import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/format-currency";

export interface RailMetric {
  label: string;
  value: number;
  currency: string;
  trend?: number;
  trendDirection?: 'up' | 'down' | 'neutral';
}

interface AnalyticsRailProps {
  metrics: RailMetric[];
  onOpenAnalytics?: () => void;
  className?: string;
}

export function AnalyticsRail({ 
  metrics, 
  onOpenAnalytics,
  className
}: AnalyticsRailProps) {
  return (
    <div className={cn("w-full mb-8 border-y border-[#DCDCDC]", className)}>
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#DCDCDC]">
        {metrics.map((metric, idx) => (
          <div 
            key={idx} 
            className="flex-1 py-6 md:px-6 first:pl-0 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4 z-10">
              <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-medium flex items-center gap-2">
                {metric.label}
              </span>
              {metric.trend !== undefined && (
                  <div className={cn(
                    "text-[10px] font-mono transition-colors duration-500",
                    metric.trendDirection === 'up' ? "text-[var(--color-braun-green)]" : 
                    metric.trendDirection === 'down' ? "text-[var(--color-braun-orange)]" : "text-neutral-400"
                  )}>
                     {metric.trendDirection === 'up' ? '+' : ''}{metric.trend}%
                  </div>
              )}
            </div>

            {/* Content */}
            <div className="flex items-baseline gap-3 z-10">
              <span className="font-sans font-medium text-4xl text-[#111111] tracking-tight">
                {metric.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="font-mono text-[10px] text-neutral-400">{metric.currency}</span>
            </div>
          </div>
        ))}

        {/* Action Module: Deep Dive Trigger */}
        <div className="w-full md:w-[180px] flex items-center justify-center md:justify-end py-6 md:pl-6">
            <button 
                onClick={onOpenAnalytics}
                title="Open System Analytics"
                className="group relative h-12 w-12 rounded-full border border-[#DCDCDC] hover:border-[#111111] bg-[#F4F4F0] hover:bg-white text-[#111111] flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md"
            >
                <ArrowUpRight size={20} strokeWidth={1.5} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (n: number) => string;
  currency?: string;
  locale?: string;
  maximumFractionDigits?: number;
}

export function AnimatedNumber({
  value,
  duration = 300,
  className = "",
  formatter,
  currency,
  locale,
  maximumFractionDigits,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function for smooth animation
      const easeOutQuart = 1 - (1 - progress) ** 4;
      const current = easeOutQuart * value;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  const text = formatter
    ? formatter(displayValue)
    : new Intl.NumberFormat(locale, {
        style: currency ? "currency" : "decimal",
        currency,
        maximumFractionDigits,
      }).format(displayValue);
  return <span className={className}>{text}</span>;
}

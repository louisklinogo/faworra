"use client";

import { motion } from "framer-motion";

type PaymentScoreVisualizerProps = {
  score?: number | null;
  paymentStatus?: string | null;
};

export function PaymentScoreVisualizer({ score, paymentStatus }: PaymentScoreVisualizerProps) {
  const numericScore = typeof score === "number" ? score : 0;
  const clampedScore = Math.max(0, Math.min(10, Math.round(numericScore)));

  const resolveColor = () => {
    switch (paymentStatus) {
      case "good":
        return "bg-emerald-500";
      case "average":
        return "bg-primary";
      case "bad":
        return "bg-red-500";
      default:
        return "bg-primary";
    }
  };

  const color = resolveColor();

  return (
    <div className="flex items-end gap-1.5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div className="relative" key={index}>
          <motion.div
            className={`w-1.5 rounded-sm ${color}`}
            initial={{
              scaleY: 0,
              opacity: 0.2,
              height: index >= 8 ? 24 : 20,
            }}
            animate={{
              scaleY: 1,
              opacity: index < clampedScore ? 1 : 0.25,
              height: 20,
            }}
            transition={{
              duration: 0.2,
              delay: index * 0.03,
            }}
            style={{ originY: 1 }}
          />
        </div>
      ))}
    </div>
  );
}

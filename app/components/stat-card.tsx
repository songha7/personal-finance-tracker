"use client";

import type { ReactNode } from "react";
import { Sparkline } from "./charts/sparkline";
import { TrendDownIcon, TrendUpIcon } from "./icons";

// Follows the dataviz "stat tile" contract: label, value, an optional
// signed delta (colored by direction × whether up is actually good — a
// rising Expenses number is bad news, even though it's a positive delta),
// and an optional trend sparkline.
type StatCardProps = {
  label: string;
  value: string;
  /** e.g. "+12% vs last month" — already formatted, sign and all. */
  deltaLabel?: string;
  /** Does an *up* arrow mean something good here? (false for Expenses.) */
  isUpGood?: boolean;
  /** Positive = trending up, used only to pick the arrow direction. */
  deltaDirection?: "up" | "down" | "flat";
  sparkline?: number[];
  /** Any CSS color — the card's background. */
  accent: string;
  icon?: ReactNode;
};

export function StatCard({
  label,
  value,
  deltaLabel,
  isUpGood = true,
  deltaDirection = "flat",
  sparkline,
  accent,
  icon,
}: StatCardProps) {
  const deltaIsGood =
    deltaDirection === "flat" ? null : (deltaDirection === "up") === isUpGood;

  return (
    <div
      className="flex flex-col justify-between rounded-2xl p-5 text-white shadow-sm"
      style={{ background: accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-white/80">{label}</p>
          {deltaLabel && (
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold">
              {deltaDirection !== "flat" &&
                (deltaDirection === "up" ? (
                  <TrendUpIcon size={12} />
                ) : (
                  <TrendDownIcon size={12} />
                ))}
              <span
                className={
                  deltaIsGood === null
                    ? "text-white/70"
                    : deltaIsGood
                      ? "text-white"
                      : "text-white/90"
                }
              >
                {deltaLabel}
              </span>
            </p>
          )}
        </div>
        {icon && <span className="text-white/70">{icon}</span>}
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-white/70">Current value</p>
          <p className="text-2xl font-semibold">{value}</p>
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="text-white/90">
            <Sparkline data={sparkline} width={88} height={30} />
          </div>
        )}
      </div>
    </div>
  );
}

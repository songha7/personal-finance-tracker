"use client";

// The category-breakdown donut. Multi-series, so per the dataviz method it
// always ships with a legend (color-matching alone is never the only way
// to read a segment) — here the legend doubles as a per-row hover target
// that highlights the matching arc, and the center label echoes whichever
// segment (or the grand total) is currently hovered.

import { useState } from "react";

export type DonutSegment = {
  label: string;
  value: number;
  color: string;
};

type DonutChartProps = {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  valueFormatter?: (value: number) => string;
  centerLabel?: string;
};

const GAP_PX = 3; // the "surface gap" that visually separates adjacent arcs

export function DonutChart({
  segments,
  size = 176,
  thickness = 26,
  valueFormatter = (v) => String(v),
  centerLabel = "Total",
}: DonutChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  if (total <= 0) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center rounded-full border-2 border-dashed border-(--chart-grid) text-center text-xs text-(--ink-muted)"
      >
        No expenses yet
      </div>
    );
  }

  // Each arc's offset is "how far around the circle the prior segments
  // already used" — computed from the slice before it rather than a
  // running accumulator, so nothing gets mutated while rendering. `n` here
  // never exceeds 4 (three categories + "Other"), so the O(n²) slice-sum
  // is essentially free.
  const arcs = segments.map((segment, i) => {
    const priorValue = segments.slice(0, i).reduce((sum, s) => sum + s.value, 0);
    const priorLength = (priorValue / total) * circumference;
    const fraction = segment.value / total;
    const length = fraction * circumference;
    const dashArray = `${Math.max(length - GAP_PX, 0)} ${circumference - Math.max(length - GAP_PX, 0)}`;
    return { ...segment, dashArray, dashOffset: -priorLength, fraction, index: i };
  });

  const hovered = hoverIndex !== null ? arcs[hoverIndex] : null;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="var(--chart-grid)"
            strokeWidth={thickness}
          />
          {arcs.map((arc) => (
            <circle
              key={arc.label}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arc.color}
              strokeWidth={hoverIndex === arc.index ? thickness + 4 : thickness}
              strokeDasharray={arc.dashArray}
              strokeDashoffset={arc.dashOffset}
              className="cursor-pointer transition-[stroke-width]"
              onPointerEnter={() => setHoverIndex(arc.index)}
              onPointerLeave={() => setHoverIndex(null)}
            />
          ))}
        </svg>

        {/* Center label — not rotated, sits on top of the (rotated) arcs. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-(--ink-muted)">
            {hovered ? hovered.label : centerLabel}
          </span>
          <span className="text-lg font-semibold text-(--ink-primary)">
            {valueFormatter(hovered ? hovered.value : total)}
          </span>
        </div>
      </div>

      <ul className="flex w-full flex-col gap-2">
        {arcs.map((arc) => (
          <li
            key={arc.label}
            onPointerEnter={() => setHoverIndex(arc.index)}
            onPointerLeave={() => setHoverIndex(null)}
            className={`flex cursor-default items-center justify-between rounded-md px-2 py-1 text-sm transition-colors ${
              hoverIndex === arc.index ? "bg-(--surface-muted)" : ""
            }`}
          >
            <span className="flex items-center gap-2 text-(--ink-secondary)">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: arc.color }}
              />
              {arc.label}
            </span>
            <span className="font-medium text-(--ink-primary)">
              {Math.round(arc.fraction * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

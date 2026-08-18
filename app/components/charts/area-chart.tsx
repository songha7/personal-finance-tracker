"use client";

// The "Wallet Analytics" chart — a single-series area/line chart with a
// hover crosshair and tooltip. Single series, so per the dataviz method it
// needs no legend box (the card title already says what's plotted); what
// it does need is the interactive layer, since an SVG/HTML chart is
// interactive by default, not as an upgrade.
//
// Coordinates are computed in a fixed viewBox (0..VIEW_WIDTH,
// 0..`height`) and the SVG is stretched to the container's actual pixel
// width with preserveAspectRatio="none". Because that stretch is linear,
// a pointer's fractional position across the container (0..1) maps
// directly onto the same fraction of the data array — no need to know the
// container's real pixel width to find "which point is the mouse nearest".

import { useMemo, useRef, useState } from "react";

export type AreaChartPoint = { label: string; value: number };

type AreaChartProps = {
  data: AreaChartPoint[];
  color?: string; // any valid CSS color, including a var(--data-*) token
  height?: number;
  valueFormatter?: (value: number) => string;
};

const VIEW_WIDTH = 800;
const PADDING = { top: 16, right: 8, bottom: 24, left: 8 };

export function AreaChart({
  data,
  color = "var(--data-blue)",
  height = 260,
  valueFormatter = (v) => String(v),
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const plotWidth = VIEW_WIDTH - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const chart = useMemo(() => {
    if (data.length === 0) return null;

    const values = data.map((d) => d.value);
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const stepX = data.length > 1 ? plotWidth / (data.length - 1) : 0;

    const points = data.map((d, i) => ({
      x: PADDING.left + i * stepX,
      y: PADDING.top + plotHeight - ((d.value - min) / range) * plotHeight,
    }));

    // 4 evenly-spaced horizontal gridlines between the data's min and max.
    const tickCount = 4;
    const yTicks = Array.from({ length: tickCount + 1 }, (_, i) => min + (range * i) / tickCount);

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");
    const baseline = PADDING.top + plotHeight;
    const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${baseline} L${points[0].x.toFixed(1)},${baseline} Z`;

    return { points, yTicks, min, max, linePath, areaPath };
  }, [data, plotWidth, plotHeight]);

  if (!chart) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center text-sm text-(--ink-muted)"
      >
        Not enough data yet
      </div>
    );
  }

  const { points, yTicks, min, max, linePath, areaPath } = chart;
  const valueRange = max - min || 1;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const fraction = (e.clientX - rect.left) / rect.width;
    const index = Math.round(fraction * (data.length - 1));
    setHoverIndex(Math.min(data.length - 1, Math.max(0, index)));
  };

  // Show at most ~6 x-axis labels — labeling every point is unreadable
  // once there are more than a handful of days.
  const labelStride = Math.max(1, Math.ceil(data.length / 6));

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoveredDatum = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        className="overflow-visible"
      >
        {yTicks.map((tick, i) => {
          const y = PADDING.top + plotHeight - ((tick - min) / valueRange) * plotHeight;
          return (
            <g key={i}>
              <line
                x1={PADDING.left}
                x2={VIEW_WIDTH - PADDING.right}
                y1={y}
                y2={y}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
              <text
                x={VIEW_WIDTH - PADDING.right}
                y={y - 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--ink-muted)"
              >
                {valueFormatter(tick)}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill={color} opacity={0.1} stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hovered && (
          <>
            <line
              x1={hovered.x}
              x2={hovered.x}
              y1={PADDING.top}
              y2={PADDING.top + plotHeight}
              stroke="var(--chart-axis)"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle
              cx={hovered.x}
              cy={hovered.y}
              r={5}
              fill={color}
              stroke="var(--surface-card)"
              strokeWidth={2}
            />
          </>
        )}

        {data.map((d, i) => {
          if (i % labelStride !== 0 && i !== data.length - 1) return null;
          return (
            <text
              key={i}
              x={points[i].x}
              y={height - 4}
              textAnchor="middle"
              fontSize={11}
              fill="var(--ink-muted)"
            >
              {d.label}
            </text>
          );
        })}
      </svg>

      {hovered && hoveredDatum && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-lg px-3 py-1.5 text-xs whitespace-nowrap text-white shadow-lg"
          style={{
            left: `${(hovered.x / VIEW_WIDTH) * 100}%`,
            top: `${(hovered.y / height) * 100}%`,
            background: color,
          }}
        >
          <div className="font-semibold">{valueFormatter(hoveredDatum.value)}</div>
          <div className="text-[10px] opacity-80">{hoveredDatum.label}</div>
        </div>
      )}
    </div>
  );
}

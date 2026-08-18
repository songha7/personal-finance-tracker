"use client";

// A tiny trend line with no axes — the "12-point sparkline" that rides
// inside a stat tile. It's decorative-but-real: the shape is computed from
// actual data, just rendered small enough that only the trend (not the
// exact values) matters. Lives on a colored card, so it draws in a light
// wash of the card's own foreground color rather than a chart data-color.

type SparklineProps = {
  data: number[];
  width?: number;
  height?: number;
};

export function Sparkline({ data, width = 96, height = 32 }: SparklineProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // avoid /0 when every point is equal
  const stepX = width / (data.length - 1);

  const points = data.map((value, i) => {
    const x = i * stepX;
    const y = height - ((value - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path d={areaPath} fill="currentColor" opacity={0.22} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/* Small hook: track an element's pixel width for crisp responsive SVG */
/* ------------------------------------------------------------------ */
function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? 0;
      setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

function niceCeil(value) {
  if (value <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(value)));
  const n = value / pow;
  let step;
  if (n <= 1) step = 1;
  else if (n <= 2) step = 2;
  else if (n <= 5) step = 5;
  else step = 10;
  return step * pow;
}

/* ------------------------------------------------------------------ */
/* Area + line chart — dual series (revenue area, orders line)        */
/* ------------------------------------------------------------------ */
export function AreaChart({
  data = [],
  height = 300,
  formatRevenue = (v) => v,
  formatOrders = (v) => v,
}) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 30;

  const innerW = Math.max(0, width - padL - padR);
  const innerH = height - padT - padB;

  if (!data.length) {
    return (
      <div
        ref={ref}
        style={{ height }}
        className="flex items-center justify-center text-sm text-zinc-400"
      >
        No sales data for this period.
      </div>
    );
  }

  const maxRev = niceCeil(Math.max(...data.map((d) => d.revenue), 1));
  const maxOrd = niceCeil(Math.max(...data.map((d) => d.orders), 1));

  const n = data.length;
  const x = (i) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yRev = (v) => padT + innerH - (v / maxRev) * innerH;
  const yOrd = (v) => padT + innerH - (v / maxOrd) * innerH;

  const revLine = data.map((d, i) => `${x(i)},${yRev(d.revenue)}`).join(" ");
  const ordLine = data.map((d, i) => `${x(i)},${yOrd(d.orders)}`).join(" ");
  const areaPath = `M ${x(0)},${padT + innerH} L ${data
    .map((d, i) => `${x(i)},${yRev(d.revenue)}`)
    .join(" L ")} L ${x(n - 1)},${padT + innerH} Z`;

  const gridVals = [0, 0.25, 0.5, 0.75, 1].map((t) => maxRev * t);

  // x-axis label thinning
  const labelStep = Math.ceil(n / 8);

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    // rect's left edge maps to svg x = padL, so px is already relative
    // to the plot area (0 … innerW).
    const px = e.clientX - rect.left;
    if (n === 1) {
      setHover(0);
      return;
    }
    const t = px / (rect.width || innerW);
    let idx = Math.round(t * (n - 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHover(idx);
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#18181b" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#18181b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* grid + y labels */}
          {gridVals.map((v, i) => (
            <g key={i}>
              <line
                x1={padL}
                x2={padL + innerW}
                y1={yRev(v)}
                y2={yRev(v)}
                stroke="#f4f4f5"
                strokeWidth="1"
              />
              <text
                x={padL - 10}
                y={yRev(v) + 4}
                textAnchor="end"
                className="fill-zinc-400"
                fontSize="11"
              >
                {formatRevenue(Math.round(v))}
              </text>
            </g>
          ))}

          {/* x labels */}
          {data.map((d, i) =>
            i % labelStep === 0 || i === n - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={height - 8}
                textAnchor="middle"
                className="fill-zinc-400"
                fontSize="11"
              >
                {d.label}
              </text>
            ) : null,
          )}

          {/* revenue area + line */}
          <path d={areaPath} fill="url(#areaFill)" />
          <polyline
            points={revLine}
            fill="none"
            stroke="#18181b"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* orders line (dashed, lighter) */}
          <polyline
            points={ordLine}
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="1.75"
            strokeDasharray="5 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* hover */}
          {hover !== null && (
            <g>
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={padT}
                y2={padT + innerH}
                stroke="#d4d4d8"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={x(hover)} cy={yRev(data[hover].revenue)} r="4" fill="#18181b" />
              <circle
                cx={x(hover)}
                cy={yOrd(data[hover].orders)}
                r="3.5"
                fill="#fff"
                stroke="#a1a1aa"
                strokeWidth="1.75"
              />
            </g>
          )}

          {/* interaction layer */}
          <rect
            x={padL}
            y={padT}
            width={Math.max(innerW, 1)}
            height={innerH}
            fill="transparent"
            onMouseMove={handleMove}
            onMouseLeave={() => setHover(null)}
          />
        </svg>
      )}

      {/* tooltip */}
      {hover !== null && width > 0 && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-lg"
          style={{
            left: Math.min(Math.max(x(hover), 70), width - 70),
            top: padT,
          }}
        >
          <p className="text-[11px] font-medium text-zinc-500">
            {data[hover].label}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-900" />
            <span className="text-[11px] text-zinc-500">Revenue</span>
            <span className="ml-auto text-[11px] font-semibold text-zinc-900">
              {formatRevenue(data[hover].revenue)}
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
            <span className="text-[11px] text-zinc-500">Orders</span>
            <span className="ml-auto text-[11px] font-semibold text-zinc-900">
              {formatOrders(data[hover].orders)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Donut / radial progress gauge                                      */
/* ------------------------------------------------------------------ */
export function DonutGauge({ percent = 0, size = 168, label = "Sales Growth" }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, Math.abs(percent)));
  const dash = (clamped / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#f4f4f5"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#18181b"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-zinc-900">
          {percent >= 0 ? "" : "-"}
          {clamped.toFixed(1)}%
        </span>
        <span className="mt-0.5 text-xs text-zinc-500">{label}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline for KPI cards                                            */
/* ------------------------------------------------------------------ */
export function Sparkline({ data = [], width = 96, height = 36, color = "#18181b" }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const n = data.length;
  const x = (i) => (n === 1 ? width / 2 : (i / (n - 1)) * width);
  const y = (v) => height - 2 - ((v - min) / range) * (height - 4);
  const points = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = `M ${x(0)},${height} L ${data
    .map((v, i) => `${x(i)},${y(v)}`)
    .join(" L ")} L ${x(n - 1)},${height} Z`;
  const gid = `spark-${color.replace("#", "")}`;

  return (
    <svg width={width} height={height}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal bars (e.g. orders by channel / top categories)         */
/* ------------------------------------------------------------------ */
export function BarList({ items = [], formatValue = (v) => v }) {
  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-zinc-400">No data available.</p>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((it, i) => (
        <div key={i}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-zinc-600">{it.label}</span>
            <span className="font-semibold text-zinc-900">
              {formatValue(it.value)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-zinc-900"
              style={{ width: `${(it.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

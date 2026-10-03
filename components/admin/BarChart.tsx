"use client";

// Minimal accessible bar chart (revenue per day). Bars have <title> tooltips and a table-friendly aria-label.
export default function BarChart({ data }: { data: { date: string; revenue: number; orders: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const w = 100 / data.length;
  const total = data.reduce((a, d) => a + d.revenue, 0);
  return (
    <figure>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={`Revenue over ${data.length} days, total ₹${total.toLocaleString("en-IN")}`} className="h-48 w-full">
        {[0.25, 0.5, 0.75].map((g) => <line key={g} x1="0" x2="100" y1={40 - 38 * g} y2={40 - 38 * g} stroke="currentColor" strokeOpacity="0.08" strokeWidth="0.3" vectorEffect="non-scaling-stroke" />)}
        {data.map((d, i) => {
          const h = (d.revenue / max) * 38;
          return (
            <rect key={d.date} x={i * w + w * 0.15} y={40 - h} width={w * 0.7} height={Math.max(h, d.revenue ? 0.6 : 0)} rx="0.4" fill="#f43f5e">
              <title>{`${d.date}: ₹${d.revenue.toLocaleString("en-IN")} · ${d.orders} order${d.orders === 1 ? "" : "s"}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-ink/50"><span>{data[0]?.date}</span><span>Peak day ₹{max === 1 ? 0 : max.toLocaleString("en-IN")}</span><span>{data[data.length - 1]?.date}</span></figcaption>
    </figure>
  );
}

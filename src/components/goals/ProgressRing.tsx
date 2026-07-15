/* eslint-disable prettier/prettier */
import { motion } from "framer-motion";

export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color = "var(--neon)",
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;

  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90 overflow-visible">
        {/* Lingkaran Background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
          className="opacity-20"
        />
        {/* Lingkaran Progres Beranimasi */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          // 🌟 FIX UTAMA: Paksa framer motion membaca transisi perubahan offset secara real-time
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center select-none">
        <div>
          <div className="text-xl font-bold tracking-tight" style={{ color }}>
            {label ?? `${pct}%`}
          </div>
          {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
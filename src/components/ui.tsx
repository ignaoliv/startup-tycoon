"use client";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", title, right }: { children: ReactNode; className?: string; title?: ReactNode; right?: ReactNode }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <header className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-black uppercase tracking-wide text-ink/70">{title}</h3>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Btn({ children, variant = "primary", size = "md", className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "amber" | "green"; size?: "sm" | "md" | "lg" }) {
  const v = {
    primary: "bg-indigo text-white border-ink hover:bg-indigo/90",
    amber: "bg-amber text-ink border-ink hover:bg-amber/90",
    green: "bg-green text-white border-ink hover:bg-green/90",
    danger: "bg-red text-white border-ink hover:bg-red/90",
    ghost: "bg-white text-ink border-ink/30 hover:border-ink",
  }[variant];
  const s = { sm: "px-2.5 py-1.5 text-xs", md: "px-3.5 py-2 text-sm", lg: "px-5 py-3 text-base" }[size];
  return (
    <button {...rest} className={`btn ${v} ${s} ${className}`}>
      {children}
    </button>
  );
}

export function Bar({ value, max = 100, color = "bg-indigo", className = "" }: { value: number; max?: number; color?: string; className?: string }) {
  const p = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`h-2.5 w-full overflow-hidden rounded-full border border-ink/20 bg-ink/5 ${className}`}>
      <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${p}%` }} />
    </div>
  );
}

export function Stat({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl border-2 border-ink/10 bg-white px-2.5 py-2">
      <span className="text-xl leading-none">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-wider text-ink/50">{label}</div>
        <div className="truncate text-sm font-black tabular-nums">{value}</div>
        {sub && <div className={`truncate text-[10px] font-semibold tabular-nums ${tone === "good" ? "text-green" : tone === "bad" ? "text-red" : "text-ink/50"}`}>{sub}</div>}
      </div>
    </div>
  );
}

export function Pill({ children, tone = "ink" }: { children: ReactNode; tone?: "ink" | "good" | "bad" | "amber" | "indigo" }) {
  const t = { ink: "bg-ink/10 text-ink", good: "bg-green/15 text-green", bad: "bg-red/15 text-red", amber: "bg-amber/25 text-ink", indigo: "bg-indigo/15 text-indigo" }[tone];
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${t}`}>{children}</span>;
}

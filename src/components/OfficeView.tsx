"use client";
import { OFFICES } from "@/lib/game/data";
import type { GameState } from "@/lib/game/types";

const DECOR = ["🪴", "☕", "🖨️", "🏓", "📚", "🎸", "🧃", "🐕", "🛋️", "🎮"];

export function OfficeView({ state, compact = false }: { state: GameState; compact?: boolean }) {
  const office = OFFICES[state.office];
  const cols = office.cols;
  const rows = office.rows;
  const cell = 64;
  const pad = 24;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2 + 20;
  const floor = ["#e9dcc4", "#dfe7f0", "#e6e9e0", "#ece3f3", "#dcefdd", "#e3e8f7"][state.office] ?? "#e9dcc4";
  const wall = ["#c9b28c", "#9fb4c8", "#a9b8a0", "#b9a7cc", "#9fc6a2", "#a5b3d9"][state.office] ?? "#c9b28c";
  const seats = cols * rows;
  const emps = state.employees.slice(0, seats);
  const hour = state.day % 2 === 0;

  return (
    <div className="office-wrap w-full overflow-x-auto">
      <svg viewBox={`0 0 ${w} ${h}`} className={`mx-auto block w-full ${compact ? "max-h-56" : "max-h-[420px]"}`} style={{ minWidth: Math.min(w, 320) }} role="img" aria-label={`Oficina: ${office.name} con ${state.employees.length} personas`}>
        {/* pared */}
        <rect x={0} y={0} width={w} height={h} rx={14} fill={wall} />
        <rect x={pad - 8} y={pad + 10} width={w - pad * 2 + 16} height={h - pad * 2 - 2} rx={8} fill={floor} />
        {/* baldosas */}
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => (
            <rect key={`t${r}-${c}`} x={pad + c * cell} y={pad + 18 + r * cell} width={cell - 2} height={cell - 2} fill="rgba(0,0,0,0.03)" stroke="rgba(0,0,0,0.06)" />
          )),
        )}
        {/* ventanas */}
        {Array.from({ length: Math.max(1, Math.floor(cols / 2)) }).map((_, i) => (
          <rect key={`w${i}`} x={pad + i * cell * 2 + 8} y={4} width={cell + 20} height={14} rx={3} fill="#bfe3ff" stroke="rgba(0,0,0,0.2)" />
        ))}
        {/* cartel */}
        <text x={w / 2} y={h - 6} textAnchor="middle" fontSize={11} fontWeight={800} fill="rgba(0,0,0,0.5)">
          {office.icon} {office.name} · {state.employees.length}/{office.capacity}
        </text>
        {/* escritorios */}
        {Array.from({ length: seats }).map((_, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = pad + c * cell;
          const y = pad + 18 + r * cell;
          const e = emps[i];
          const decor = !e && state.office > 0 && i % 3 === 1 ? DECOR[(i + state.office) % DECOR.length] : null;
          return (
            <g key={i} transform={`translate(${x},${y})`}>
              {/* escritorio */}
              <rect x={8} y={30} width={cell - 18} height={18} rx={4} fill={e ? "#8b5e3c" : "rgba(0,0,0,0.08)"} stroke="rgba(0,0,0,0.25)" />
              {e && <rect x={16} y={24} width={16} height={11} rx={2} fill="#222" />}
              {e && <rect x={17} y={25} width={14} height={9} fill={e.role === "ai" ? "#22d3ee" : e.role === "dev" ? "#1e293b" : e.role === "design" ? "#f472b6" : e.role === "marketing" ? "#fb923c" : e.role === "sales" ? "#34d399" : e.role === "qa" ? "#a78bfa" : "#60a5fa"} />}
              {e && (
                <text x={cell / 2 - 1} y={24} textAnchor="middle" fontSize={22} className="emp" style={{ animationDelay: `${(i * 137) % 900}ms` }}>
                  {e.avatar}
                </text>
              )}
              {e?.founder && (
                <text x={cell - 14} y={14} fontSize={11}>
                  👑
                </text>
              )}
              {e && (
                <text x={cell / 2 - 1} y={cell - 6} textAnchor="middle" fontSize={8} fontWeight={700} fill="rgba(0,0,0,0.6)">
                  {e.name.split(" ")[0]}
                </text>
              )}
              {decor && (
                <text x={cell / 2} y={40} textAnchor="middle" fontSize={20}>
                  {decor}
                </text>
              )}
            </g>
          );
        })}
        {/* bugs volando */}
        {state.bugs > 3 &&
          Array.from({ length: Math.min(6, Math.floor(state.bugs / 3)) }).map((_, i) => (
            <text key={`b${i}`} x={pad + ((i * 97 + (hour ? 20 : 0)) % (w - pad * 2))} y={pad + 30 + ((i * 53) % (h - pad * 2 - 40))} fontSize={12} className="bug" style={{ animationDelay: `${i * 300}ms` }}>
              🐛
            </text>
          ))}
        {state.cash < 0 && (
          <text x={w / 2} y={pad + 14} textAnchor="middle" fontSize={12} fontWeight={900} fill="#c0392b">
            ⚠️ SIN PLATA
          </text>
        )}
      </svg>
    </div>
  );
}

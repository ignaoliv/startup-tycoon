"use client";
import { OFFICES } from "@/lib/game/data";
import type { Employee, GameState } from "@/lib/game/types";

/**
 * Escena de la oficina dibujada en SVG. Cada nivel tiene su propio fondo:
 * paredes, ventanas, muebles y detalles distintos.
 */

const W = 800;
const H = 420; // más piso: los escritorios entran grandes y en grilla
const FLOOR_Y = 196; // línea donde termina la pared y empieza el piso

interface Scene {
  wall: string;
  wallShade: string;
  floor: string;
  floorShade: string;
  rug: string;
  desk: string;
  deskDark: string;
}

const SCENES: Scene[] = [
  // garage
  { wall: "#e0cfae", wallShade: "#d2bd97", floor: "#c9ab84", floorShade: "#b8946a", rug: "#8d6a49", desk: "#9a6b43", deskDark: "#7d5636" },
  // coworking
  { wall: "#d8a382", wallShade: "#c48f6e", floor: "#ded4c4", floorShade: "#cabfab", rug: "#7fa2ad", desk: "#b98a5e", deskDark: "#9a7049" },
  // oficina
  { wall: "#d5dde8", wallShade: "#c2ccdb", floor: "#cdbba6", floorShade: "#bda88f", rug: "#8ba2b8", desk: "#8f9aa8", deskDark: "#77808c" },
  // loft tech
  { wall: "#b98572", wallShade: "#a5715f", floor: "#a9a7a2", floorShade: "#95938e", rug: "#5f6f7e", desk: "#6f7681", deskDark: "#5b616b" },
  // campus
  { wall: "#cfe0d2", wallShade: "#bcd2c0", floor: "#ddd8c8", floorShade: "#cbc5b2", rug: "#8fb392", desk: "#a98f6d", deskDark: "#8d7657" },
  // torre HQ
  { wall: "#c3cfe2", wallShade: "#aebbd2", floor: "#e9e5df", floorShade: "#d7d2c9", rug: "#9aa8c4", desk: "#7c8598", deskDark: "#666e7e" },
];

/* ---------- piezas reutilizables ---------- */

function Window({ x, y, w = 120, h = 78, view = "trees" }: { x: number; y: number; w?: number; h?: number; view?: "trees" | "city" | "garden" | "sky" }) {
  const sky = view === "sky" ? "#9fc6ee" : view === "city" ? "#b9d8f0" : "#bfe3ff";
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-4} y={-4} width={w + 8} height={h + 8} rx={4} fill="#8a6a4b" />
      <rect width={w} height={h} fill={sky} />
      {view === "trees" && (
        <>
          <rect y={h * 0.62} width={w} height={h * 0.38} fill="#8fbf6a" />
          <circle cx={w * 0.28} cy={h * 0.5} r={h * 0.24} fill="#5a9a4a" />
          <circle cx={w * 0.6} cy={h * 0.42} r={h * 0.3} fill="#4e8c41" />
          <circle cx={w * 0.85} cy={h * 0.55} r={h * 0.2} fill="#5a9a4a" />
        </>
      )}
      {view === "garden" && (
        <>
          <rect y={h * 0.55} width={w} height={h * 0.45} fill="#9ec97c" />
          <circle cx={w * 0.22} cy={h * 0.45} r={h * 0.26} fill="#57a05a" />
          <circle cx={w * 0.7} cy={h * 0.38} r={h * 0.3} fill="#468b4c" />
          <rect x={w * 0.45} y={h * 0.62} width={4} height={h * 0.3} fill="#7a5a3c" />
        </>
      )}
      {view === "city" && (
        <>
          {[0.05, 0.22, 0.4, 0.58, 0.78].map((p, i) => (
            <rect key={i} x={w * p} y={h * (0.3 + (i % 3) * 0.12)} width={w * 0.13} height={h} fill={i % 2 ? "#8fa6bd" : "#7e94ac"} />
          ))}
          <rect y={h * 0.9} width={w} height={h * 0.1} fill="#6d8199" />
        </>
      )}
      {view === "sky" && (
        <>
          <circle cx={w * 0.75} cy={h * 0.25} r={h * 0.12} fill="#fff3c4" />
          <ellipse cx={w * 0.3} cy={h * 0.35} rx={w * 0.2} ry={h * 0.09} fill="#ffffff" opacity={0.8} />
          {[0.1, 0.3, 0.55, 0.8].map((p, i) => (
            <rect key={i} x={w * p} y={h * (0.62 + (i % 2) * 0.08)} width={w * 0.12} height={h} fill="#93a9c4" opacity={0.75} />
          ))}
        </>
      )}
      <rect width={w} height={h} fill="none" stroke="#8a6a4b" strokeWidth={5} />
      <line x1={w / 2} y1={0} x2={w / 2} y2={h} stroke="#8a6a4b" strokeWidth={4} />
      <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="#8a6a4b" strokeWidth={4} />
    </g>
  );
}

function Plant({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M-9 0 L9 0 L7 16 L-7 16 Z" fill="#c0714f" />
      <circle cx={-6} cy={-6} r={7} fill="#5c9e55" />
      <circle cx={6} cy={-7} r={8} fill="#4e8c48" />
      <circle cx={0} cy={-14} r={7} fill="#67ad5e" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <line x1={0} y1={-46} x2={0} y2={0} stroke="#3f3a34" strokeWidth={4} />
      <path d="M-24 0 L24 0 L14 18 L-14 18 Z" fill="#3f3a34" />
      <circle cy={20} r={9} fill="#ffdf8a" />
      <circle cy={22} r={26} fill="#ffdf8a" opacity={0.2} />
    </g>
  );
}

function Poster({ x, y, lines, fill = "#f5c53d" }: { x: number; y: number; lines: string[]; fill?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={64} height={72} rx={3} fill={fill} stroke="rgba(0,0,0,0.25)" strokeWidth={2} />
      {lines.map((l, i) => (
        <text key={i} x={32} y={26 + i * 20} textAnchor="middle" fontSize={15} fontWeight={900} fill="#5b4a12">
          {l}
        </text>
      ))}
    </g>
  );
}

function Whiteboard({ x, y, w = 150, h = 86, title = "MVP v0.2" }: { x: number; y: number; w?: number; h?: number; title?: string }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-5} y={-5} width={w + 10} height={h + 10} rx={4} fill="#8d949c" />
      <rect width={w} height={h} fill="#f7f7f4" />
      <text x={14} y={22} fontSize={13} fontWeight={800} fill="#6b6b6b">
        {title}
      </text>
      <polyline points={`14,${h - 16} 40,${h - 34} 62,${h - 26} 88,${h - 52}`} fill="none" stroke="#9aa0a6" strokeWidth={3} />
      {[0, 1, 2].map((i) => (
        <line key={i} x1={w * 0.6} y1={38 + i * 14} x2={w - 14} y2={38 + i * 14} stroke="#c3c7cb" strokeWidth={3} />
      ))}
      <rect x={w - 42} y={16} width={22} height={22} fill="#ffe27a" transform="rotate(-6)" />
    </g>
  );
}

function Shelf({ x, y, w = 96 }: { x: number; y: number; w?: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={w} height={7} fill="#8a5f3c" />
      <rect x={10} y={-24} width={9} height={24} fill="#a8484a" />
      <rect x={21} y={-28} width={8} height={28} fill="#4a6ea8" />
      <rect x={31} y={-20} width={10} height={20} fill="#c9a24a" />
      <rect x={w - 34} y={-14} width={16} height={14} rx={2} fill="#6d7278" />
      <Plant x={w - 12} y={0} s={0.55} />
    </g>
  );
}

function Cabinet({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect width={58} height={74} rx={3} fill="#9aa0a6" stroke="rgba(0,0,0,0.2)" strokeWidth={2} />
      {[0, 1].map((i) => (
        <g key={i}>
          <rect x={8} y={12 + i * 32} width={42} height={24} rx={2} fill="#b4bac0" />
          <rect x={22} y={21 + i * 32} width={14} height={5} rx={2} fill="#7d8388" />
        </g>
      ))}
    </g>
  );
}

/* ---------- decorado por oficina ---------- */

function Decor({ office }: { office: number }) {
  if (office === 0)
    return (
      <g>
        <rect y={0} width={W} height={26} fill="rgba(0,0,0,0.06)" />
        {[120, 300, 480, 660].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={FLOOR_Y} stroke="rgba(0,0,0,0.05)" strokeWidth={3} />
        ))}
        <Window x={38} y={54} view="trees" />
        <Poster x={214} y={52} lines={["SHIP", "FAST"]} />
        <Lamp x={380} y={26} />
        <Whiteboard x={452} y={44} />
        <Shelf x={604} y={78} w={104} />
        <Shelf x={604} y={136} w={104} />
        <rect x={0} y={150} width={150} height={12} fill="#a87a52" />
        <rect x={16} y={162} width={12} height={34} fill="#8a5f3c" />
        <rect x={122} y={162} width={12} height={34} fill="#8a5f3c" />
        <text x={40} y={146} fontSize={16}>☕</text>
        <Cabinet x={730} y={122} />
        <g transform="translate(556,168)">
          <rect width={46} height={28} rx={2} fill="#b7b2a8" />
          <line x1={15} y1={0} x2={15} y2={28} stroke="#8f8a80" strokeWidth={2} />
          <line x1={31} y1={0} x2={31} y2={28} stroke="#8f8a80" strokeWidth={2} />
        </g>
      </g>
    );

  if (office === 1)
    return (
      <g>
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 11 }).map((_, c) => (
            <rect key={`${r}-${c}`} x={c * 76 + (r % 2 ? -38 : 0)} y={r * 28} width={72} height={24} rx={2} fill="rgba(0,0,0,0.05)" />
          )),
        )}
        <Window x={44} y={48} w={140} h={90} view="city" />
        <g transform="translate(268,54)">
          <rect width={104} height={44} rx={8} fill="#2f2b28" />
          <text x={52} y={32} textAnchor="middle" fontSize={26}>☕</text>
          <rect y={46} width={104} height={4} rx={2} fill="#ffb84d" opacity={0.7} />
        </g>
        <Whiteboard x={432} y={44} w={140} title="Roadmap" />
        <Shelf x={630} y={92} w={120} />
        <g transform="translate(618,120)">
          <rect width={160} height={14} rx={3} fill="#3f3a34" />
          <rect x={12} y={14} width={10} height={62} fill="#3f3a34" />
          <rect x={138} y={14} width={10} height={62} fill="#3f3a34" />
          <text x={40} y={-2} fontSize={16}>🫖</text>
          <text x={96} y={-2} fontSize={16}>🥐</text>
        </g>
        <g transform="translate(210,120)">
          <text fontSize={22}>🪴</text>
        </g>
      </g>
    );

  if (office === 2)
    return (
      <g>
        <rect y={0} width={W} height={20} fill="rgba(255,255,255,0.5)" />
        <rect y={FLOOR_Y - 16} width={W} height={16} fill="rgba(0,0,0,0.06)" />
        <Window x={40} y={44} w={190} h={110} view="city" />
        <Window x={520} y={44} w={190} h={110} view="city" />
        <Whiteboard x={280} y={48} w={190} h={96} title="Q3 · OKRs" />
        <g transform="translate(300,168)">
          <rect width={150} height={10} rx={3} fill="#b0b6be" />
        </g>
        <circle cx={745} cy={62} r={20} fill="#f4f2ee" stroke="#9aa1a9" strokeWidth={3} />
        <line x1={745} y1={62} x2={745} y2={50} stroke="#5c6169" strokeWidth={3} />
        <line x1={745} y1={62} x2={753} y2={66} stroke="#5c6169" strokeWidth={3} />
        <g transform="translate(742,120)">
          <rect width={30} height={54} rx={4} fill="#dbe6ef" stroke="#9aa1a9" strokeWidth={2} />
          <rect x={5} y={6} width={20} height={22} rx={3} fill="#8fd0f0" />
        </g>
        <Plant x={264} y={190} s={1.5} />
        <Plant x={492} y={190} s={1.2} />
      </g>
    );

  if (office === 3)
    return (
      <g>
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 11 }).map((_, c) => (
            <rect key={`${r}-${c}`} x={c * 76 + (r % 2 ? -38 : 0)} y={r * 28} width={72} height={24} rx={2} fill="rgba(0,0,0,0.07)" />
          )),
        )}
        <g stroke="#7c8590" strokeWidth={9} fill="none">
          <path d="M0 22 H300 M340 22 H800" />
          <circle cx={320} cy={22} r={12} fill="#7c8590" stroke="none" />
        </g>
        <g>
          <rect x={30} y={44} width={220} height={126} fill="#a9d3ef" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1={30 + i * 55} y1={44} x2={30 + i * 55} y2={170} stroke="#4f5a66" strokeWidth={5} />
          ))}
          <line x1={30} y1={107} x2={250} y2={107} stroke="#4f5a66" strokeWidth={5} />
          <rect x={30} y={44} width={220} height={126} fill="none" stroke="#4f5a66" strokeWidth={7} />
        </g>
        <g transform="translate(300,60)">
          <rect width={130} height={46} rx={10} fill="#241f2c" />
          <text x={65} y={33} textAnchor="middle" fontSize={22} fill="#ff6bd6" fontWeight={900}>
            SHIP IT
          </text>
        </g>
        <g transform="translate(470,52)">
          <rect width={70} height={100} rx={8} fill="#3a3f4b" />
          <rect x={9} y={12} width={52} height={40} rx={3} fill="#7fe3ff" />
          <circle cx={24} cy={72} r={7} fill="#ff6b6b" />
          <circle cx={46} cy={72} r={7} fill="#ffd166" />
        </g>
        <Shelf x={600} y={96} w={140} />
        <g transform="translate(596,128)">
          <rect width={170} height={12} rx={4} fill="#2f7f4f" />
          <rect x={78} y={-16} width={6} height={16} fill="#dcdcdc" />
          <text x={20} y={-2} fontSize={16}>🏓</text>
        </g>
      </g>
    );

  if (office === 4)
    return (
      <g>
        <rect y={0} width={W} height={FLOOR_Y} fill="#d6ead9" />
        <rect y={0} width={W} height={FLOOR_Y} fill="url(#glass)" opacity={0.5} />
        {[70, 250, 430, 610].map((x) => (
          <g key={x}>
            <circle cx={x + 40} cy={120} r={44} fill="#7cb87f" opacity={0.85} />
            <circle cx={x + 92} cy={140} r={30} fill="#68a86d" opacity={0.85} />
            <rect x={x + 36} y={150} width={9} height={46} fill="#8a6a4b" />
          </g>
        ))}
        <rect y={FLOOR_Y - 8} width={W} height={8} fill="rgba(0,0,0,0.12)" />
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={i} x1={i * 160} y1={0} x2={i * 160} y2={FLOOR_Y} stroke="#e8f2e9" strokeWidth={10} opacity={0.9} />
        ))}
        <g transform="translate(60,150)">
          <text fontSize={26}>🚲</text>
        </g>
        <g transform="translate(690,146)">
          <text fontSize={26}>🌳</text>
        </g>
        <Plant x={380} y={192} s={1.6} />
      </g>
    );

  return (
    <g>
      <rect y={0} width={W} height={FLOOR_Y} fill="#aebfd8" />
      <rect y={0} width={W} height={FLOOR_Y} fill="url(#glass)" opacity={0.55} />
      {[30, 120, 250, 340, 470, 600, 690].map((x, i) => (
        <rect key={x} x={x} y={70 + (i % 3) * 22} width={62} height={FLOOR_Y} fill="#8ea4c4" opacity={0.55} />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <line key={i} x1={i * 133} y1={0} x2={i * 133} y2={FLOOR_Y} stroke="#e6ecf5" strokeWidth={9} opacity={0.85} />
      ))}
      <line x1={0} y1={92} x2={W} y2={92} stroke="#e6ecf5" strokeWidth={7} opacity={0.7} />
      <g transform="translate(330,120)">
        <rect width={150} height={54} rx={10} fill="#ffffff" opacity={0.92} />
        <text x={75} y={36} textAnchor="middle" fontSize={26}>🦄</text>
      </g>
      <g transform="translate(60,150)">
        <text fontSize={24}>🏆</text>
      </g>
      <g transform="translate(700,150)">
        <text fontSize={24}>🏆</text>
      </g>
      <rect y={FLOOR_Y - 10} width={W} height={10} fill="rgba(255,255,255,0.55)" />
    </g>
  );
}

/* ---------- escritorios y gente ---------- */

const ROLE_SCREEN: Record<string, string> = {
  ai: "#22d3ee",
  dev: "#1e293b",
  design: "#f472b6",
  marketing: "#fb923c",
  sales: "#34d399",
  qa: "#a78bfa",
  ops: "#60a5fa",
};

/** Lugar libre: se ve el escritorio pero sin nadie, para que se note lo que falta. */
function EscritorioLibre({ x, y, s, scene }: { x: number; y: number; s: number; scene: Scene }) {
  const w = 104 * s;
  const h = 26 * s;
  return (
    <g transform={`translate(${x},${y})`} opacity={0.42}>
      <rect x={-w / 2} y={0} width={w} height={h} rx={4 * s} fill={scene.desk} />
      <rect x={-w / 2} y={h - 5 * s} width={w} height={5 * s} rx={2 * s} fill={scene.deskDark} />
      <rect
        x={-w / 2 + 3 * s}
        y={-26 * s}
        width={w - 6 * s}
        height={24 * s}
        rx={6 * s}
        fill="none"
        stroke="rgba(31,27,22,0.35)"
        strokeWidth={2 * s}
        strokeDasharray={`${6 * s} ${5 * s}`}
      />
      <text x={0} y={-8 * s} textAnchor="middle" fontSize={13 * s} fontWeight={800} fill="rgba(31,27,22,0.5)">
        libre
      </text>
    </g>
  );
}

function Desk({ e, x, y, s, scene, showName }: { e: Employee; x: number; y: number; s: number; scene: Scene; showName: boolean }) {
  const w = 104 * s;
  const h = 26 * s;
  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={h + 6 * s} rx={w * 0.55} ry={5 * s} fill="rgba(0,0,0,0.13)" />
      <text x={0} y={-6 * s} textAnchor="middle" fontSize={38 * s} className="emp">
        {e.avatar}
      </text>
      {e.founder && (
        <text x={w * 0.34} y={-30 * s} textAnchor="middle" fontSize={17 * s}>
          👑
        </text>
      )}
      <rect x={-w / 2} y={0} width={w} height={h} rx={4 * s} fill={scene.desk} />
      <rect x={-w / 2} y={h - 5 * s} width={w} height={5 * s} rx={2 * s} fill={scene.deskDark} />
      <g transform={`translate(0,${-2 * s})`}>
        <rect x={-15 * s} y={-13 * s} width={30 * s} height={19 * s} rx={2 * s} fill="#2c2f34" />
        <rect x={-13 * s} y={-11 * s} width={26 * s} height={15 * s} fill={ROLE_SCREEN[e.role] ?? "#94a3b8"} />
        <rect x={-18 * s} y={5 * s} width={36 * s} height={3 * s} rx={1.5 * s} fill="#3c4046" />
      </g>
      {showName && (
        <text x={0} y={h + 15 * s} textAnchor="middle" fontSize={12.5 * s} fontWeight={800} fill="rgba(0,0,0,0.62)">
          {e.name.split(" ")[0]}
        </text>
      )}
    </g>
  );
}

export function OfficeView({ state, compact = false }: { state: GameState; compact?: boolean }) {
  const office = OFFICES[state.office];
  const scene = SCENES[state.office] ?? SCENES[0];
  const emps = state.employees;

  // la sala dibuja los lugares de la oficina, ocupados y vacíos, en su grilla.
  // Se topean las columnas y las filas para que los escritorios no se achiquen
  // hasta ser ilegibles en las oficinas grandes.
  const cols = Math.min(office.cols, 5);
  const cupos = Math.min(office.capacity, cols * 3);
  const filas = Math.ceil(cupos / cols);
  const shown = emps.slice(0, cupos);
  const extra = emps.length - shown.length;

  // perspectiva: las filas de atrás quedan más arriba y más chicas
  // cada lugar necesita alto para el personaje, el escritorio y el nombre; las
  // filas se separan lo suficiente para que la de adelante no tape los nombres
  const GEOM: Record<number, { y: number; s: number }[]> = {
    1: [{ y: 322, s: 1.6 }],
    2: [
      { y: 252, s: 1.12 },
      { y: 360, s: 1.24 },
    ],
    3: [
      { y: 236, s: 0.76 },
      { y: 304, s: 0.84 },
      { y: 376, s: 0.96 },
    ],
  };
  const geom = GEOM[filas] ?? GEOM[3];

  const placed: { e: Employee | null; x: number; y: number; s: number; key: string }[] = [];
  for (let idx = 0; idx < cupos; idx++) {
    const fila = Math.floor(idx / cols);
    const enFila = Math.min(cols, cupos - fila * cols);
    const col = idx - fila * cols;
    const gap = W / (enFila + 1);
    placed.push({ e: shown[idx] ?? null, x: gap * (col + 1), y: geom[fila].y, s: geom[fila].s, key: shown[idx]?.id ?? `libre-${idx}` });
  }

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className={`block w-full ${compact ? "max-h-52" : "max-h-[420px]"}`} role="img" aria-label={`${office.name}: ${emps.length} de ${office.capacity} lugares`}>
        <defs>
          <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="floorGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={scene.floorShade} />
            <stop offset="100%" stopColor={scene.floor} />
          </linearGradient>
          <clipPath id="room">
            <rect width={W} height={H} rx={12} />
          </clipPath>
        </defs>

        <g clipPath="url(#room)">
          {/* pared y piso */}
          <rect width={W} height={FLOOR_Y} fill={scene.wall} />
          <rect y={FLOOR_Y} width={W} height={H - FLOOR_Y} fill="url(#floorGrad)" />
          <Decor office={state.office} />
          <rect y={FLOOR_Y - 5} width={W} height={5} fill="rgba(0,0,0,0.14)" />
          {/* alfombra */}
          <path d={`M120 ${H} L${W - 120} ${H} L${W - 190} ${FLOOR_Y + 18} L190 ${FLOOR_Y + 18} Z`} fill={scene.rug} opacity={0.75} />

          {/* gente */}
          {placed.map((p) =>
            p.e ? (
              <Desk key={p.key} e={p.e} x={p.x} y={p.y} s={p.s} scene={scene} showName />
            ) : (
              <EscritorioLibre key={p.key} x={p.x} y={p.y} s={p.s} scene={scene} />
            ),
          )}

          {/* deuda técnica volando */}
          {state.bugs > 3 &&
            Array.from({ length: Math.min(7, Math.floor(state.bugs / 3)) }).map((_, k) => (
              <text key={k} x={70 + ((k * 137) % (W - 140))} y={60 + ((k * 53) % (FLOOR_Y - 40))} fontSize={17} className="bug" style={{ animationDelay: `${k * 300}ms` }}>
                🐛
              </text>
            ))}

          {extra > 0 && (
            <g transform={`translate(${W - 96},14)`}>
              <rect width={84} height={24} rx={12} fill="rgba(31,27,22,0.72)" />
              <text x={42} y={17} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">
                +{extra} más
              </text>
            </g>
          )}

          {state.cash < 0 && (
            <g transform={`translate(${W / 2},34)`}>
              <rect x={-92} y={-20} width={184} height={28} rx={14} fill="#c0392b" />
              <text y={0} textAnchor="middle" fontSize={15} fontWeight={900} fill="#fff">
                ⚠️ SIN PLATA
              </text>
            </g>
          )}
        </g>

        <rect width={W} height={H} rx={12} fill="none" stroke="rgba(31,27,22,0.15)" strokeWidth={3} />
      </svg>

      <div className="mt-1 text-center text-sm font-black text-ink/70">
        {office.icon} {office.name} · {emps.length}/{office.capacity}
      </div>
    </div>
  );
}

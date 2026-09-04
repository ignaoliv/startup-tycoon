import type { FeatureDef, GameEventDef, OfficeDef, Role, SectorDef, StageDef } from "./types";

/** Duración de un día: arranca tranquilo y se acelera a medida que crece la empresa. */
export const TICK_MS_START = 5500;
export const TICK_MS_MIN = 2500;
export const TICK_RAMP_DAYS = 110;
export const TICK_MS = TICK_MS_START; // referencia para textos

export function dayMs(day: number) {
  const t = Math.min(1, Math.max(0, (day - 1) / TICK_RAMP_DAYS));
  return Math.round(TICK_MS_START + (TICK_MS_MIN - TICK_MS_START) * t);
}

/** Ideas para arrancar la startup. */
export const IDEAS = [
  "Un Uber para paseadores de perros",
  "Un ChatGPT para contadores",
  "Netflix pero de recetas",
  "Mercado Libre para plantas",
  "Un CRM para kioscos",
  "Tinder para encontrar cofundador",
  "Rappi para trámites",
  "Un agente IA que contesta mails",
  "Notion para clubes de barrio",
  "Duolingo para aprender a programar",
  "Un marketplace de mate",
  "IA que corrige exámenes",
  "Un Excel que se explica solo",
  "Turnos médicos por WhatsApp",
  "Un banco para adolescentes",
  "IA que arma la lista del súper",
  "Airbnb para cocheras",
  "Un Trello para obras en construcción",
  "Facturación automática para monotributistas",
  "Un asistente que negocia tus cuentas",
  "Fotos de producto hechas con IA",
  "Un buscador de becas",
  "Sueldos en cripto para nómades",
  "Un GPS para colectivos del interior",
];
export const OFFLINE_MAX_DAYS = 240;
export const START_CASH = 30000;

export const ROLES: Record<Role, { name: string; plural: string; icon: string; baseSalary: number; desc: string; payLabel: string }> = {
  ai: { name: "Agente IA", plural: "Agentes IA", icon: "🤖", baseSalary: 900, desc: "Vibecodea rapidísimo y barato. Deja mucha deuda técnica.", payLabel: "tokens/mes" },
  dev: { name: "Dev humano", plural: "Devs", icon: "👩‍💻", baseSalary: 3400, desc: "Más lento, pero revisa lo que escribe la IA y limpia deuda.", payLabel: "/mes" },
  design: { name: "Diseño", plural: "Diseñadores", icon: "🎨", baseSalary: 2800, desc: "Que no parezca hecho por un bot. Sube calidad, baja churn.", payLabel: "/mes" },
  marketing: { name: "Growth", plural: "Growth", icon: "📣", baseSalary: 2600, desc: "Threads en X, demos en video. Trae usuarios y hype.", payLabel: "/mes" },
  sales: { name: "Ventas", plural: "Vendedores", icon: "🤝", baseSalary: 3000, desc: "Convierte curiosos en clientes que pagan. Sube el ARPU.", payLabel: "/mes" },
  qa: { name: "QA", plural: "Testers", icon: "🧪", baseSalary: 2400, desc: "Encuentra lo que la IA alucinó antes que los usuarios.", payLabel: "/mes" },
  ops: { name: "DevOps", plural: "DevOps", icon: "🛠️", baseSalary: 2900, desc: "Baja la factura de servidores y tokens. Sube la moral.", payLabel: "/mes" },
  pm: { name: "Project Manager", plural: "Project Managers", icon: "📋", baseSalary: 1500, desc: "Decide qué se construye después, sin que tengas que elegir vos.", payLabel: "/mes" },
};

/** Lo que sale contratar al PM por mes. */
export const PM_SALARY = 1500;

export const LEVEL_NAMES = ["", "Junior", "Semi", "Senior"] as const;
export const AI_LEVEL_NAMES = ["", "Mini", "Pro", "Ultra"] as const;

export const OFFICES: OfficeDef[] = [
  { id: "garage", name: "Garage", icon: "🏚️", capacity: 3, rent: 0, cost: 0, morale: 55, cols: 3, rows: 1 },
  { id: "cowork", name: "Coworking", icon: "☕", capacity: 8, rent: 2500, cost: 6000, morale: 65, cols: 4, rows: 2 },
  { id: "office", name: "Oficina", icon: "🏢", capacity: 16, rent: 12000, cost: 60000, morale: 75, cols: 4, rows: 4 },
  { id: "loft", name: "Loft tech", icon: "🏙️", capacity: 32, rent: 45000, cost: 400000, morale: 85, cols: 8, rows: 4 },
  { id: "campus", name: "Campus", icon: "🌳", capacity: 64, rent: 180000, cost: 3000000, morale: 92, cols: 8, rows: 8 },
  { id: "hq", name: "Torre HQ", icon: "🗼", capacity: 120, rent: 700000, cost: 25000000, morale: 100, cols: 12, rows: 10 },
];

export const STAGES: StageDef[] = [
  { id: "bootstrap", name: "Bootstrap", minValuation: 0, raise: 0, equity: 0, multiple: 3 },
  { id: "preseed", name: "Pre-seed", minValuation: 120000, raise: 100000, equity: 10, multiple: 4 },
  { id: "seed", name: "Seed", minValuation: 1200000, raise: 800000, equity: 15, multiple: 5 },
  { id: "a", name: "Serie A", minValuation: 12000000, raise: 6000000, equity: 20, multiple: 6 },
  { id: "b", name: "Serie B", minValuation: 70000000, raise: 30000000, equity: 15, multiple: 8 },
  { id: "c", name: "Serie C", minValuation: 300000000, raise: 100000000, equity: 10, multiple: 10 },
  { id: "unicorn", name: "Unicornio 🦄", minValuation: 1000000000, raise: 0, equity: 0, multiple: 10 },
];

export const IPO_VALUATION = 1_000_000_000;

export const SECTORS: SectorDef[] = [
  { id: "saas", name: "SaaS con IA", icon: "☁️", desc: "Un ChatGPT para X. Equilibrado, el clásico.", growth: 0, arpu: 0.8, tam: 3_000_000 },
  { id: "fintech", name: "Fintech", icon: "💳", desc: "Cobrás bien por usuario, pero crecer cuesta.", growth: -0.1, arpu: 1.5, tam: 6_000_000 },
  { id: "devtools", name: "Dev tools", icon: "🧰", desc: "Herramientas para otros vibecoders. Usuarios fieles.", growth: -0.1, arpu: 1.0, tam: 1_500_000 },
  { id: "delivery", name: "Marketplace", icon: "🛵", desc: "Crecés rápido, márgenes finitos.", growth: 0.35, arpu: -0.6, tam: 25_000_000 },
  { id: "crypto", name: "Cripto", icon: "🪙", desc: "Hype volátil, eventos locos.", growth: 0.2, arpu: 0.3, tam: 8_000_000 },
  { id: "ai", name: "Agentes IA", icon: "🤖", desc: "Todos quieren invertir. Los tokens salen carísimos.", growth: 0.25, arpu: 0.5, tam: 12_000_000 },
];

export const FEATURES: FeatureDef[] = [
  { id: "mvp", name: "MVP de un finde", icon: "🚀", desc: "Un prompt, un deploy. Sin producto no hay usuarios.", cost: 8, effects: { quality: 20, growth: 1 } },
  { id: "landing", name: "Landing con IA", icon: "🌐", desc: "Generada en 5 minutos. Dice 'revolucionario' tres veces.", cost: 30, requires: ["mvp"], effects: { growth: 0.3, hype: 10 } },
  { id: "auth", name: "Auth de verdad", icon: "🔐", desc: "Resulta que cualquiera podía ver los datos de cualquiera.", cost: 42, requires: ["mvp"], effects: { churn: 0.004, quality: 10 } },
  { id: "pagos", name: "Pagos", icon: "💰", desc: "Stripe en dos prompts. Empezar a cobrar en serio.", cost: 66, requires: ["mvp"], effects: { arpu: 1.2 } },
  { id: "onboarding", name: "Onboarding", icon: "🧭", desc: "Que la gente entienda el producto en 2 minutos.", cost: 54, requires: ["auth"], effects: { churn: 0.004, quality: 8 } },
  { id: "mobile", name: "App móvil", icon: "📱", desc: "iOS y Android. Todos la piden.", cost: 120, requires: ["landing"], effects: { growth: 0.5, quality: 10 } },
  { id: "referidos", name: "Referidos", icon: "🔗", desc: "Invitá a un amigo y ganá créditos.", cost: 90, requires: ["landing"], effects: { growth: 0.6 } },
  { id: "analytics", name: "Analytics", icon: "📊", desc: "Medir para mejorar (y para el pitch deck).", cost: 78, requires: ["onboarding"], effects: { churn: 0.003, arpu: 0.3 } },
  { id: "darkmode", name: "Modo oscuro", icon: "🌙", desc: "No cambia nada, pero X lo festeja.", cost: 36, requires: ["mobile"], effects: { hype: 25, quality: 3 } },
  { id: "pro", name: "Plan Pro", icon: "⭐", desc: "Cobrar más a los que más usan.", cost: 135, requires: ["pagos", "analytics"], effects: { arpu: 2 } },
  { id: "soporte", name: "Soporte con chatbot", icon: "🎧", desc: "Responde 24/7. A veces hasta bien.", cost: 150, requires: ["analytics"], effects: { churn: 0.006, quality: 10 } },
  { id: "api", name: "API pública", icon: "🔌", desc: "Que otros vibecodeen sobre vos.", cost: 210, requires: ["pro"], effects: { growth: 0.5, arpu: 0.8 } },
  { id: "agente", name: "Agente propio", icon: "🧠", desc: "Tu propio agente IA dentro del producto. Los VCs deliran.", cost: 270, requires: ["api"], effects: { hype: 40, growth: 0.6, arpu: 1 } },
  { id: "i18n", name: "Internacional", icon: "🌎", desc: "LATAM, después el mundo.", cost: 360, requires: ["mobile", "soporte"], effects: { growth: 1.2 } },
  { id: "enterprise", name: "Enterprise (SOC2)", icon: "🏛️", desc: "Contratos con bancos. Auditorías de seguridad. Dolor.", cost: 600, requires: ["api", "soporte"], effects: { arpu: 4, churn: 0.004 } },
  { id: "marketplace", name: "Marketplace de agentes", icon: "🏪", desc: "Un ecosistema. La palabra favorita de los VCs.", cost: 780, requires: ["i18n", "enterprise"], effects: { growth: 1, arpu: 2, hype: 30 } },
];

export const FIRST_NAMES = ["Sofi", "Nico", "Juli", "Mati", "Cami", "Lucas", "Vale", "Fede", "Agus", "Flor", "Tomi", "Male", "Santi", "Cata", "Facu", "Pili", "Gonza", "Meli", "Nacho", "Lu", "Rodri", "Caro", "Manu", "Ro", "Franco", "Juana", "Ivo", "Guada", "Bruno", "Abril"];
export const LAST_NAMES = ["Pérez", "Gómez", "López", "Fernández", "Díaz", "Romero", "Suárez", "Molina", "Castro", "Ortiz", "Silva", "Rojas", "Acosta", "Benítez", "Medina", "Herrera", "Aguirre", "Giménez", "Flores", "Vega", "Cabrera", "Ríos", "Sosa", "Ledesma"];
export const AI_NAMES = ["Claudio", "Cursorito", "Copilotín", "Gepeto", "Gemi", "Lovabella", "Boltito", "Replito", "Devin Jr.", "Windsurfer", "Codex", "Sonnetto", "Opusito", "Haikú", "Llamita", "Mistralina", "Groki", "Perplex"];
export const AVATARS: Record<Role, string[]> = {
  ai: ["🤖", "🤖", "👾", "🧠"],
  dev: ["👩‍💻", "👨‍💻", "🧑‍💻"],
  design: ["👩‍🎨", "👨‍🎨", "🧑‍🎨"],
  marketing: ["🙋‍♀️", "🙋‍♂️", "🙋"],
  sales: ["👩‍💼", "👨‍💼", "🧑‍💼"],
  qa: ["👩‍🔬", "👨‍🔬", "🧑‍🔬"],
  ops: ["👩‍🔧", "👨‍🔧", "🧑‍🔧"],
  pm: ["🧑‍💼", "👩‍💼", "👨‍💼"],
};

export const STARTUP_NAME_PARTS = {
  a: ["Prompt", "Vibe", "Nube", "Zap", "Mango", "Agent", "Kilo", "Neuro", "Pixel", "Token", "Chip", "Data", "Loop", "Rama", "Synth"],
  b: ["ly", "fy", "io", "ar", "go", "hub", "lab", "ify", "app", "wave", "ito", "nauta", "mind", "base", "flow"],
};

export const EVENTS: GameEventDef[] = [
  {
    id: "viral",
    title: "Tweet viral",
    icon: "🐦",
    text: "Publicaste 'Built this in a weekend with AI, no code written by hand' y explotó. 4 millones de views.",
    minUsers: 20,
    choices: [
      { label: "Aprovechar la ola", desc: "+35 hype y usuarios, pero el equipo no da abasto", apply: (s) => { s.hype = Math.min(100, s.hype + 35); const n = Math.round(s.users * 0.15 + 50); s.users += n; s.morale = Math.max(0, s.morale - 8); s.bugs += 3; return `+${n} usuarios y el hype por las nubes. Tres noches sin dormir y algo se rompió.`; } },
      { label: "Bajo perfil", desc: "+10 hype y el equipo descansa", apply: (s) => { s.hype = Math.min(100, s.hype + 10); s.morale = Math.min(100, s.morale + 5); return "Un poquito de hype y nadie tuvo que trabajar el fin de semana."; } },
    ],
  },
  {
    id: "droptable",
    title: "La IA borró la base de datos",
    icon: "🔥",
    text: "Un agente 'limpió' la base de producción para que pasen los tests. No había backup. Bueno, sí, pero de hace tres semanas.",
    minUsers: 50,
    choices: [
      { label: "Pagar consultores de recovery", desc: "-$8.000, se recupera casi todo", apply: (s) => { s.cash -= 8000; const lost = Math.round(s.users * 0.02); s.users -= lost; return `Recuperaron casi todo. Se perdieron ${lost} usuarios.`; } },
      { label: "Restaurar el backup viejo", desc: "Perdés usuarios y +deuda técnica", apply: (s) => { const lost = Math.round(s.users * 0.12); s.users -= lost; s.bugs += 6; s.hype = Math.max(0, s.hype - 10); return `Volvieron tres semanas al pasado. Se fueron ${lost} usuarios.`; } },
    ],
  },
  {
    id: "leak",
    title: "Filtraste la API key",
    icon: "🔑",
    text: "Commiteaste la key de la IA al repo público. Alguien la está usando para minar prompts a tu nombre.",
    minDay: 10,
    choices: [
      { label: "Rotar todo ya", desc: "-$3.000 y un día perdido", apply: (s) => { s.cash -= 3000; s.featureProgress = Math.max(0, s.featureProgress - 2); return "Keys rotadas. Prometés usar variables de entorno."; } },
      { label: "Ver qué pasa", desc: "Llega una factura enorme", apply: (s) => { const bill = Math.round(6000 + s.users * 2); s.cash -= bill; return `Factura de tokens: $${bill.toLocaleString("es-AR")}. Aprendiste a la fuerza.`; } },
    ],
  },
  {
    id: "clone",
    title: "Te clonaron en dos horas",
    icon: "🐑",
    text: "Alguien le pasó tu landing a una IA y lanzó una copia exacta esa misma tarde. Hasta el color del botón.",
    minUsers: 100,
    choices: [
      { label: "Guerra de precios", desc: "Retenés usuarios, sufre la caja", apply: (s) => { s.hype = Math.min(100, s.hype + 5); s.cash -= Math.round(s.users * 0.5); return "Bajaste precios. Los usuarios se quedaron, la caja sufrió."; } },
      { label: "Ignorarlos", desc: "Perdés algunos usuarios", apply: (s) => { const lost = Math.round(s.users * 0.08); s.users -= lost; return `Se fueron ${lost} usuarios al clon. Que les vaya bien.`; } },
    ],
  },
  {
    id: "angel",
    title: "Un ángel inversor te escribe",
    icon: "😇",
    text: "Un ex fundador exitoso vio tu demo en X y quiere poner plata. Sin due diligence, pero quiere equity.",
    minDay: 20,
    choices: [
      { label: "Aceptar $50.000 por 5%", desc: "+cash, -5% equity", apply: (s) => { s.cash += 50000; s.equity -= 5; s.stats.raised += 50000; return "Entró la plata. Ahora tenés un ángel en el grupo de WhatsApp."; } },
      { label: "Rechazar", desc: "Mantenés tu equity, +moral", apply: (s) => { s.morale = Math.min(100, s.morale + 5); return "Bootstrapper de corazón."; } },
    ],
  },
  {
    id: "press",
    title: "Te llamó la prensa",
    icon: "📰",
    text: "Un medio tech grande quiere una nota: 'El fundador que no escribió una línea de código'.",
    minUsers: 200,
    choices: [
      { label: "Dar la entrevista", desc: "+25 hype y usuarios, perdés dos días de trabajo", apply: (s) => { s.hype = Math.min(100, s.hype + 25); const n = Math.round(s.users * 0.1 + 100); s.users += n; s.featureProgress = Math.max(0, s.featureProgress - 4); return `Salió la nota. +${n} usuarios, y el roadmap se atrasó dos días.`; } },
      { label: "Mandar al de growth", desc: "+10 hype, vos seguís shippeando", apply: (s) => { s.hype = Math.min(100, s.hype + 10); s.featureProgress += 2; return "Salió bien, nadie se acuerda del nombre, pero vos avanzaste."; } },
    ],
  },
  {
    id: "quit",
    title: "Renuncia sorpresa",
    icon: "🚪",
    text: "Tu mejor humano recibió una oferta de una big tech. Dice que está cansado de arreglar código de la IA.",
    minDay: 30,
    choices: [
      { label: "Igualar la oferta", desc: "Sube su salario 60%", apply: (s) => { const e = [...s.employees].filter((x) => !x.founder && x.role !== "ai").sort((a, b) => b.level - a.level)[0]; if (!e) return "No tenés humanos para retener. Los agentes no renuncian."; e.salary = Math.round(e.salary * 1.6); return `${e.name} se queda, cobrando bastante más.`; } },
      { label: "Dejar que se vaya", desc: "Perdés a la persona", apply: (s) => { const e = [...s.employees].filter((x) => !x.founder && x.role !== "ai").sort((a, b) => b.level - a.level)[0]; if (!e) return "No había humanos para perder."; s.employees = s.employees.filter((x) => x.id !== e.id); s.morale = Math.max(0, s.morale - 8); return `${e.name} se fue. El equipo quedó bajoneado.`; } },
    ],
  },
  {
    id: "hackathon",
    title: "Noche de vibecoding",
    icon: "🍕",
    text: "El equipo propone una noche entera de prompts, pizza y energéticas. 'Mañana shippeamos tres features'.",
    minDay: 15,
    choices: [
      { label: "Dale, pizza para todos", desc: "-$1.500, +progreso, +moral, +deuda", apply: (s) => { s.cash -= 1500; s.featureProgress += 8; s.bugs += 2; s.morale = Math.min(100, s.morale + 10); return "Salieron tres features y nadie sabe cómo funcionan. Moral al tope."; } },
      { label: "Hay que dormir", desc: "+moral, sin deuda técnica", apply: (s) => { s.morale = Math.min(100, s.morale + 6); s.bugs = Math.max(0, s.bugs - 1); return "Nadie trasnochó. Al otro día el código salió limpio."; } },
    ],
  },
  {
    id: "critbug",
    title: "Nadie entiende el código",
    icon: "🐛",
    text: "Un bug le cobra doble a algunos usuarios. El archivo tiene 4.000 líneas que escribió la IA y nadie leyó.",
    minUsers: 80,
    choices: [
      { label: "Devolver la plata y pedir perdón", desc: "-cash, mantenés confianza", apply: (s) => { const cost = Math.round(s.users * 0.8); s.cash -= cost; s.bugs = Math.max(0, s.bugs - 3); return `Devolviste $${cost.toLocaleString("es-AR")}. La gente valoró la honestidad.`; } },
      { label: "Pedirle a la IA que lo arregle", desc: "Riesgo de romper más", apply: (s) => { const lost = Math.round(s.users * 0.1); s.users -= lost; s.bugs += 3; s.hype = Math.max(0, s.hype - 15); return `Arregló ese bug y creó dos. -${lost} usuarios.`; } },
    ],
  },
  {
    id: "noauth",
    title: "Un hacker te escribe",
    icon: "🕵️",
    text: "'Hola, tu API devuelve todos los usuarios sin login. Me pagás un bounty o lo publico.'",
    minUsers: 150,
    choices: [
      { label: "Pagar el bounty", desc: "-$5.000, +calidad", apply: (s) => { s.cash -= 5000; s.bugs = Math.max(0, s.bugs - 4); return "Pagaste, arreglaste y hasta lo agradeciste en X."; } },
      { label: "Ignorarlo", desc: "Puede que se olvide del tema", chance: 0.45, apply: (s, ok) => { if (ok) return "Se aburrió y no publicó nada. Zafaste."; const lost = Math.round(s.users * 0.15); s.users -= lost; s.hype = Math.max(0, s.hype - 25); return `Lo publicó. -${lost} usuarios y un hilo viral en tu contra.`; } },
    ],
  },
  {
    id: "tokens",
    title: "Subió el precio de los tokens",
    icon: "💸",
    text: "El proveedor de IA cambió los precios. Tus agentes ahora salen 40% más caros.",
    minDay: 25,
    choices: [
      { label: "Pagar lo que pidan", desc: "Los agentes cobran 40% más", apply: (s) => { for (const e of s.employees) if (e.role === "ai") e.salary = Math.round(e.salary * 1.4); return "Seguís con los mismos agentes. La factura duele."; } },
      { label: "Cambiar a un modelo más barato", desc: "Mismo costo, +deuda técnica", apply: (s) => { s.bugs += 5; s.morale = Math.max(0, s.morale - 5); return "El modelo barato escribe raro. Los humanos sufren."; } },
    ],
  },
  {
    id: "acquire",
    title: "Oferta de adquisición",
    icon: "🏦",
    text: "Una corporación quiere comprar tu startup. Ofrecen un múltiplo generoso... pero se termina el juego.",
    minDay: 120,
    minUsers: 3000,
    choices: [
      { label: "Vender y retirarse", desc: "Fin del juego (exit)", apply: (s) => { s.gameOver = "acquired"; return "¡Exit! Te compraron. A la playa."; } },
      { label: "Seguir construyendo", desc: "+hype por la noticia", apply: (s) => { s.hype = Math.min(100, s.hype + 20); return "Rechazaste la oferta. Los inversores aplauden (y sudan)."; } },
    ],
  },
  {
    id: "regulation",
    title: "Regulación de IA",
    icon: "⚖️",
    text: "Salió una norma nueva: tenés que explicar qué hace tu IA con los datos de los usuarios. Vos tampoco lo sabés.",
    minUsers: 500,
    choices: [
      { label: "Contratar abogados", desc: "-$15.000", apply: (s) => { s.cash -= 15000; return "Cumplís con todo. Los abogados están felices."; } },
      { label: "Que lo resuelvan los devs", desc: "Frena el desarrollo", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 10); s.bugs += 4; return "Dos semanas leyendo código que nadie escribió."; } },
    ],
  },
  {
    id: "conference",
    title: "Te invitan a una conferencia",
    icon: "🎤",
    text: "Slot para dar la charla 'Cómo levanté una startup sin programar' en el evento más grande de la región.",
    minDay: 40,
    choices: [
      { label: "Ir a dar la charla", desc: "-$3.000, +hype, +usuarios", apply: (s) => { s.cash -= 3000; s.hype = Math.min(100, s.hype + 20); s.users += 40; return "La charla fue un éxito. Te pidieron el deck 30 veces."; } },
      { label: "Quedarse vibecodeando", desc: "+progreso", apply: (s) => { s.featureProgress += 4; return "Una semana tranquila y productiva."; } },
    ],
  },
  {
    id: "bigclient",
    title: "Un cliente enorme",
    icon: "🐘",
    text: "Una multinacional quiere tu producto para 5.000 empleados. Pero pide SSO, auditoría y cambios a medida.",
    minUsers: 300,
    choices: [
      { label: "Aceptar el contrato", desc: "+$40.000 ahora, frena el roadmap", apply: (s) => { s.cash += 40000; s.stats.totalRevenue += 40000; s.featureProgress = Math.max(0, s.featureProgress - 8); return "Cobraste el contrato. El roadmap se atrasó un poco."; } },
      { label: "Rechazar", desc: "+moral y el roadmap avanza", apply: (s) => { s.morale = Math.min(100, s.morale + 6); s.featureProgress += 6; return "El equipo agradece no hacer integraciones con SAP y shippea el doble."; } },
    ],
  },
  {
    id: "winter",
    title: "Se pinchó la burbuja",
    icon: "📉",
    text: "Los VCs se pusieron nerviosos con la IA. De golpe todos hablan de 'rentabilidad' y 'unit economics'.",
    minDay: 60,
    choices: [
      { label: "Recortar gastos", desc: "-moral, ahorrás", apply: (s) => { s.morale = Math.max(0, s.morale - 12); s.cash += 5000; return "Chau merchandising y almuerzos. La caja lo agradece."; } },
      { label: "Seguir invirtiendo", desc: "-hype, moral ok", apply: (s) => { s.hype = Math.max(0, s.hype - 15); return "Contra la corriente. El mercado no te presta atención."; } },
    ],
  },
  {
    id: "newmodel",
    title: "Salió un modelo nuevo",
    icon: "✨",
    text: "El proveedor lanzó un modelo que programa el doble de bien. Migrar lleva unos días.",
    minDay: 35,
    choices: [
      { label: "Migrar ya", desc: "-progreso ahora, agentes mejoran", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 5); for (const e of s.employees) if (e.role === "ai" && e.level < 3) e.level = (e.level + 1) as 1 | 2 | 3; return "Tus agentes subieron de nivel. Y de precio, seguramente."; } },
      { label: "Esperar", desc: "No frenás el desarrollo", apply: (s) => { s.featureProgress += 5; return "Seguís con lo viejo y sin parar. Twitter se burla un poco."; } },
    ],
  },

  // ============ POR SECTOR ============
  {
    id: "sec_google", sector: "saas", title: "Google lanzó tu feature", icon: "🔍", minDay: 40, minUsers: 300,
    text: "Google anunció exactamente lo que hacés vos, gratis, adentro de su suite. Tu feed no habla de otra cosa.",
    choices: [
      { label: "Pivotar a un nicho", desc: "Perdés usuarios pero quedás con los que importan", apply: (s) => { const lost = Math.round(s.users * 0.3); s.users -= lost; s.featureProgress = 0; s.hype = Math.min(100, s.hype + 8); return `Te enfocaste en un nicho. -${lost} usuarios, pero los que quedaron te aman.`; } },
      { label: "Competirles de frente", desc: "50%: la gente prefiere tu producto", chance: 0.5, apply: (s, ok) => { if (ok) { s.hype = Math.min(100, s.hype + 15); const lost = Math.round(s.users * 0.05); s.users -= lost; return `La gente prefiere una herramienta dedicada. Solo perdiste ${lost} usuarios.`; } const lost = Math.round(s.users * 0.35); s.users -= lost; s.hype = Math.max(0, s.hype - 15); return `Gratis le gana a mejor. -${lost} usuarios.`; } },
    ],
  },
  {
    id: "sec_fraude", sector: "fintech", title: "Ola de fraude", icon: "🃏", minDay: 30, minUsers: 200,
    text: "Alguien está usando tarjetas robadas en tu plataforma. Los bancos empiezan a mandar contracargos.",
    choices: [
      { label: "Reembolsar todo y reforzar", desc: "Caro, pero cerrás el tema", apply: (s) => { const cost = Math.round(s.users * 2.5 + 3000); s.cash -= cost; s.bugs = Math.max(0, s.bugs - 2); return `Pagaste $${cost.toLocaleString("es-AR")} y sumaste verificación. Se cortó.`; } },
      { label: "Pelear los contracargos", desc: "45%: los ganás", chance: 0.45, apply: (s, ok) => { if (ok) return "Presentaste evidencia y ganaste casi todos. Cero pérdida."; const cost = Math.round(s.users * 5 + 6000); s.cash -= cost; s.hype = Math.max(0, s.hype - 10); return `Perdiste los contracargos: $${cost.toLocaleString("es-AR")} y el banco te miró feo.`; } },
    ],
  },
  {
    id: "sec_api", sector: "devtools", title: "Un dev famoso destroza tu API", icon: "🧵", minDay: 30, minUsers: 150,
    text: "Alguien con 100k seguidores publicó un hilo detallado explicando por qué tu API está mal diseñada. Tiene razón en la mitad.",
    choices: [
      { label: "Reescribir la API", desc: "Frena el roadmap, baja la deuda técnica", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 8); s.bugs = Math.max(0, s.bugs - 5); s.hype = Math.min(100, s.hype + 10); return "Dos semanas de refactor. Quedó bien y hasta él lo reconoció."; } },
      { label: "Responderle en público", desc: "45%: quedás como campeón", chance: 0.45, apply: (s, ok) => { if (ok) { s.hype = Math.min(100, s.hype + 18); s.users += Math.round(30 + s.users * 0.05); return "Respondiste con humildad y datos. Terminaste ganando seguidores."; } s.hype = Math.max(0, s.hype - 15); s.users -= Math.round(s.users * 0.05); return "Te pusiste a la defensiva. El hilo creció y quedaste peor."; } },
    ],
  },
  {
    id: "sec_vendedor", sector: "delivery", title: "Se va tu vendedor estrella", icon: "🏆", minDay: 40, minUsers: 300,
    text: "El que más factura en tu marketplace recibió una oferta de la competencia. Se lleva a sus clientes.",
    choices: [
      { label: "Igualar con mejores condiciones", desc: "Te cuesta plata todos los meses", apply: (s) => { const cost = Math.round(s.users * 1.5 + 4000); s.cash -= cost; return `Le bajaste la comisión: $${cost.toLocaleString("es-AR")} menos. Se queda.`; } },
      { label: "Dejarlo ir", desc: "Se lleva parte de tus usuarios", apply: (s) => { const lost = Math.round(s.users * 0.15); s.users -= lost; s.hype = Math.max(0, s.hype - 5); return `Se fue con ${lost} usuarios. Que le vaya bien.`; } },
    ],
  },
  {
    id: "sec_exchange", sector: "crypto", title: "Se cae el exchange", icon: "🏚️", minDay: 30, minUsers: 100,
    text: "El exchange donde tenés la caja de la empresa frenó los retiros. Twitter dice que es insolvente.",
    choices: [
      { label: "Sacar todo ya, aunque pierdas", desc: "-20% de la caja, pero es tuya", apply: (s) => { const loss = Math.round(Math.max(0, s.cash) * 0.2); s.cash -= loss; return `Pagaste $${loss.toLocaleString("es-AR")} de castigo, pero la plata está en tu cuenta.`; } },
      { label: "Esperar a que se resuelva", desc: "40%: sale todo bien", chance: 0.4, apply: (s, ok) => { if (ok) { s.hype = Math.min(100, s.hype + 5); return "Reabrieron los retiros. No perdiste un peso."; } const loss = Math.round(Math.max(0, s.cash) * 0.6); s.cash -= loss; return `Quebró. Perdiste $${loss.toLocaleString("es-AR")}.`; } },
    ],
  },
  {
    id: "sec_proveedor", sector: "ai", title: "El proveedor prohíbe tu caso de uso", icon: "🚫", minDay: 35, minUsers: 150,
    text: "Cambiaron los términos de servicio y tu producto quedó explícitamente prohibido. Tenés 15 días.",
    choices: [
      { label: "Migrar a otro modelo", desc: "Frena todo y deja bugs", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 10); s.bugs += 5; return "Migraste a las apuradas. Anda, pero raro."; } },
      { label: "Negociar una excepción", desc: "50%: te la dan", chance: 0.5, apply: (s, ok) => { if (ok) { const cost = 6000; s.cash -= cost; return "Firmaste un acuerdo enterprise. Caro, pero seguís igual."; } const lost = Math.round(s.users * 0.2); s.users -= lost; s.bugs += 3; return `Te cortaron el acceso. -${lost} usuarios y una migración de urgencia.`; } },
    ],
  },
  // ============ REACTIVOS ============
  {
    id: "r_deuda", title: "Se cayó producción", icon: "💥",
    text: "Tanto código sin revisar pasó factura: la app está caída y nadie sabe por dónde empezar.",
    reactive: { test: (s) => s.bugs > 15, cooldown: 80 },
    choices: [
      { label: "Freezar features y limpiar", desc: "Se para el roadmap, baja mucho la deuda", apply: (s) => { s.featureProgress = 0; s.bugs = Math.max(0, s.bugs - 10); s.morale = Math.min(100, s.morale + 4); return "Una semana entera limpiando. El equipo respira."; } },
      { label: "Parche rápido y seguir", desc: "50%: aguanta", chance: 0.5, apply: (s, ok) => { if (ok) { s.bugs = Math.max(0, s.bugs - 2); return "El parche aguantó. Por ahora."; } const lost = Math.round(s.users * 0.08); s.users -= lost; s.hype = Math.max(0, s.hype - 10); s.bugs += 3; return `Se volvió a caer dos veces. -${lost} usuarios.`; } },
    ],
  },
  {
    id: "r_moral", title: "Carta del equipo", icon: "✉️",
    text: "Te dejaron una carta firmada por todos. Dice, con mucha educación, que así no se puede seguir.",
    reactive: { test: (s) => s.morale < 52 && s.employees.filter((e) => !e.founder && e.role !== "ai").length >= 2, cooldown: 80 },
    choices: [
      { label: "Escucharlos y cambiar cosas", desc: "Cuesta plata, sube mucho la moral", apply: (s) => { const cost = Math.round(1200 + s.employees.length * 400); s.cash -= cost; s.morale = Math.min(100, s.morale + 20); return `Invertiste $${cost.toLocaleString("es-AR")} en arreglar lo que pedían. El clima cambió.`; } },
      { label: "Seguir como venimos", desc: "60%: alguien renuncia", chance: 0.4, apply: (s, ok) => { if (ok) { s.morale = Math.max(0, s.morale - 5); return "Nadie se fue, pero el ambiente quedó raro."; } const e = s.employees.filter((x) => !x.founder && x.role !== "ai")[0]; if (e) s.employees = s.employees.filter((x) => x.id !== e.id); s.morale = Math.max(0, s.morale - 12); return e ? `${e.name} renunció al día siguiente.` : "El clima empeoró."; } },
    ],
  },
  {
    id: "r_sinship", title: "Te dan por muerto", icon: "🪦",
    text: "Hace rato que no lanzás nada y en los foros ya preguntan si el producto sigue vivo.",
    reactive: { test: (s, ctx) => s.day - ctx.lastShipDay > 30 && s.done.includes("mvp"), cooldown: 70 },
    choices: [
      { label: "Publicar el roadmap", desc: "+hype, pero perdés días explicando", apply: (s) => { s.hype = Math.min(100, s.hype + 15); s.featureProgress = Math.max(0, s.featureProgress - 3); return "Publicaste qué se viene. La gente se entusiasmó de nuevo."; } },
      { label: "Que hable el producto", desc: "Perdés usuarios mientras tanto", apply: (s) => { const lost = Math.round(s.users * 0.07); s.users -= lost; s.hype = Math.max(0, s.hype - 10); return `Se fueron ${lost} usuarios cansados de esperar.`; } },
    ],
  },
  {
    id: "r_escala", title: "Los servidores no dan abasto", icon: "📡",
    text: "Creciste tan rápido que la infraestructura empezó a crujir. Hay lentitud en todas las pantallas.",
    reactive: { test: (s, ctx) => s.users > 800 && s.users > ctx.users20 * 2.5, cooldown: 100 },
    choices: [
      { label: "Invertir en infraestructura", desc: "Caro pero se termina el problema", apply: (s) => { const cost = Math.round(4000 + s.users * 1.2); s.cash -= cost; s.bugs = Math.max(0, s.bugs - 3); return `$${cost.toLocaleString("es-AR")} en servidores. Vuela.`; } },
      { label: "Aguantar con lo que hay", desc: "40%: zafás", chance: 0.4, apply: (s, ok) => { if (ok) return "El pico bajó solo y aguantó. Suerte."; const lost = Math.round(s.users * 0.12); s.users -= lost; s.hype = Math.max(0, s.hype - 12); return `Se cayó en el peor momento. -${lost} usuarios.`; } },
    ],
  },
  {
    id: "r_hype", title: "Vienen a robarte gente", icon: "🎯",
    text: "Con tanta prensa, los headhunters tienen a tu equipo en la mira. Ya llamaron a tres.",
    reactive: { test: (s, ctx) => ctx.hypeHighDays >= 20 && s.employees.filter((e) => !e.founder && e.role !== "ai").length >= 3, cooldown: 100 },
    choices: [
      { label: "Subir sueldos 15%", desc: "Más costo fijo, se quedan todos", apply: (s) => { let n = 0; for (const e of s.employees) if (!e.founder && e.role !== "ai") { e.salary = Math.round(e.salary * 1.15); n++; } s.morale = Math.min(100, s.morale + 8); return `${n} sueldos actualizados. Nadie se mueve.`; } },
      { label: "Confiar en el proyecto", desc: "50%: se quedan igual", chance: 0.5, apply: (s, ok) => { if (ok) { s.morale = Math.min(100, s.morale + 5); return "Les importa más lo que están construyendo. Se quedaron."; } const e = [...s.employees].filter((x) => !x.founder && x.role !== "ai").sort((a, b) => b.level - a.level)[0]; if (e) s.employees = s.employees.filter((x) => x.id !== e.id); s.morale = Math.max(0, s.morale - 8); return e ? `${e.name} se fue a una big tech por el doble.` : "Zafaste."; } },
    ],
  },
  {
    id: "r_equity", title: "Los inversores te aprietan", icon: "🪑",
    text: "Ya tenés más socios que acciones. En la reunión mensual te 'sugieren' cómo manejar la empresa.",
    reactive: { test: (s) => s.equity < 50, cooldown: 120 },
    choices: [
      { label: "Aceptar sus condiciones", desc: "-3% de equity, entra plata", apply: (s) => { s.equity -= 3; const cash = 40000; s.cash += cash; s.stats.raised += cash; return `Entraron $${cash.toLocaleString("es-AR")} más y vos tenés menos empresa.`; } },
      { label: "Plantarte", desc: "50%: te respetan", chance: 0.5, apply: (s, ok) => { if (ok) { s.morale = Math.min(100, s.morale + 8); s.hype = Math.min(100, s.hype + 5); return "Defendiste tu visión y te la respetaron."; } const cost = Math.round(Math.max(0, s.cash) * 0.1 + 5000); s.cash -= cost; s.hype = Math.max(0, s.hype - 10); return `Te cortaron el apoyo y hubo que cubrir $${cost.toLocaleString("es-AR")} solo.`; } },
    ],
  },
  {
    id: "r_oficina", title: "No entra un alfiler", icon: "🪑",
    text: "Hace semanas que hay gente trabajando en el pasillo. Alguien ya amenazó con irse por el ruido.",
    reactive: { test: (s, ctx) => ctx.officeFullDays >= 12, cooldown: 120 },
    choices: [
      { label: "Alquilar un espacio extra", desc: "Cuesta, pero se calma todo", apply: (s) => { const cost = Math.round(2000 + s.employees.length * 250); s.cash -= cost; s.morale = Math.min(100, s.morale + 10); return `$${cost.toLocaleString("es-AR")} por unos escritorios más. Se respira mejor.`; } },
      { label: "Aguantar hasta la mudanza", desc: "50%: nadie se va", chance: 0.5, apply: (s, ok) => { if (ok) { s.morale = Math.max(0, s.morale - 4); return "Se bancaron el hacinamiento, refunfuñando."; } const e = s.employees.filter((x) => !x.founder && x.role !== "ai")[0]; if (e) s.employees = s.employees.filter((x) => x.id !== e.id); s.morale = Math.max(0, s.morale - 8); return e ? `${e.name} renunció: "así no puedo trabajar".` : "El clima empeoró."; } },
    ],
  },
  {
    id: "h_diez", title: "Diez personas lo están usando", icon: "🌱",
    text: "Diez desconocidos entraron y se quedaron. No es tu mamá ni tu amigo: gente de verdad usando lo que armaste.",
    reactive: { test: (s) => s.users >= 10, cooldown: 0, once: true },
    choices: [
      { label: "Escribirles uno por uno", desc: "Se te va el día, pero te cuentan qué necesitan", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 2); s.bugs = Math.max(0, s.bugs - 2); s.hype = Math.min(100, s.hype + 6); return "Diez charlas y una lista de cosas obvias que no habías visto."; } },
      { label: "Seguir shippeando", desc: "+progreso, no te enterás de nada", apply: (s) => { s.featureProgress += 3; return "Preferís que hable el producto. El roadmap avanza."; } },
    ],
  },
  {
    id: "h_verde", title: "Primer mes en verde", icon: "📗",
    text: "Por primera vez entra más plata de la que sale. No es mucha, pero la cuenta cierra sola.",
    reactive: { test: (s, ctx) => ctx.netDay > 0 && s.day > 12 && s.users > 20, cooldown: 0, once: true },
    choices: [
      { label: "Contarlo en redes", desc: "+hype, el equipo se envalentona", apply: (s) => { s.hype = Math.min(100, s.hype + 14); s.morale = Math.min(100, s.morale + 5); return "Publicaste la captura del número en verde. Le gustó a mucha gente."; } },
      { label: "Guardarlo callado", desc: "Sumás caja para el próximo movimiento", apply: (s) => { s.cash += Math.round(500 + s.users * 2); return "Nada de festejos: la plata a la reserva."; } },
    ],
  },
  {
    id: "h_cien", title: "Cien usuarios", icon: "💯",
    text: "Pasaste los cien. Ya no los conocés a todos por nombre y empiezan a aparecer pedidos repetidos.",
    reactive: { test: (s) => s.users >= 100, cooldown: 0, once: true },
    choices: [
      { label: "Brindar con el equipo", desc: "-poca plata, +moral", apply: (s) => { const cost = Math.round(300 + s.employees.length * 150); s.cash -= cost; s.morale = Math.min(100, s.morale + 12); return `Un brindis de $${cost.toLocaleString("es-AR")}. Se lo merecían.`; } },
      { label: "Ponerlo en la landing", desc: "+hype y entran algunos más", apply: (s) => { s.hype = Math.min(100, s.hype + 10); const n = Math.round(20 + s.users * 0.1); s.users += n; return `"Más de 100 personas ya lo usan" en la home. +${n} usuarios.`; } },
    ],
  },
  {
    id: "h_equipo", title: "Ya son varios", icon: "🧑‍🤝‍🧑",
    text: "Con cuatro en el equipo, el garage empieza a parecer una empresa. Alguien propone hacer una reunión semanal.",
    reactive: { test: (s) => s.employees.length >= 4, cooldown: 0, once: true },
    choices: [
      { label: "Sí, una por semana", desc: "+moral, un poco menos de tiempo para construir", apply: (s) => { s.morale = Math.min(100, s.morale + 10); s.featureProgress = Math.max(0, s.featureProgress - 2); return "Media hora los lunes. Todos saben qué está pasando."; } },
      { label: "Que cada uno siga con lo suyo", desc: "+progreso, la comunicación sufre", apply: (s) => { s.featureProgress += 4; s.morale = Math.max(0, s.morale - 5); return "Nada de reuniones. Se avanza rápido y en paralelo, a veces de más."; } },
    ],
  },
  {
    id: "r_hito", title: "¡Mil usuarios!", icon: "🎉",
    text: "Alguien lo gritó en el canal general: acabás de pasar los 1.000 usuarios. El equipo quiere festejar.",
    reactive: { test: (s) => s.users >= 1000, cooldown: 0, once: true },
    choices: [
      { label: "Festejar como corresponde", desc: "Cuesta poco, sube mucho la moral", apply: (s) => { const cost = Math.round(500 + s.employees.length * 200); s.cash -= cost; s.morale = Math.min(100, s.morale + 18); s.hype = Math.min(100, s.hype + 5); return `Brindis, fotos y un posteo. $${cost.toLocaleString("es-AR")} bien gastados.`; } },
      { label: "Seguir trabajando", desc: "+progreso, el equipo se desinfla un poco", apply: (s) => { s.featureProgress += 5; s.morale = Math.max(0, s.morale - 6); return "Nadie festejó nada. Se shippeó más, eso sí."; } },
    ],
  },
  // ============ GENÉRICOS ============
  {
    id: "aceleradora", title: "Te aceptan en una aceleradora", icon: "🏫", minDay: 25,
    text: "Quedaste seleccionado en un programa conocido: $50.000, mentores y demo day. A cambio, 7%.",
    choices: [
      { label: "Entrar al programa", desc: "+$50.000 y contactos, -7% equity", apply: (s) => { s.cash += 50000; s.equity -= 7; s.stats.raised += 50000; s.hype = Math.min(100, s.hype + 12); return "Entraste. Ahora tenés mentores y una remera."; } },
      { label: "Seguir solo", desc: "Mantenés tu equity y el foco", apply: (s) => { s.morale = Math.min(100, s.morale + 5); s.featureProgress += 4; return "Nada de viajes ni mentorías. A shippear."; } },
    ],
  },
  {
    id: "cartadoc", title: "Carta documento por el nombre", icon: "📜", minDay: 40, minUsers: 100,
    text: "Una empresa que ya tenía registrada la marca te intima a dejar de usar el nombre en 30 días.",
    choices: [
      { label: "Cambiar de nombre", desc: "Perdés hype y algo de usuarios", apply: (s) => { s.hype = Math.max(0, s.hype - 18); const lost = Math.round(s.users * 0.06); s.users -= lost; return `Rebranding forzado. -${lost} usuarios que no se enteraron del cambio.`; } },
      { label: "Pelearla con abogados", desc: "50%: te la quedás", chance: 0.5, apply: (s, ok) => { const cost = 7000; s.cash -= cost; if (ok) { s.hype = Math.min(100, s.hype + 8); return `$${cost.toLocaleString("es-AR")} en abogados y el nombre es tuyo. Hasta te dio prensa.`; } s.hype = Math.max(0, s.hype - 18); const lost = Math.round(s.users * 0.06); s.users -= lost; return `Perdiste el juicio: $${cost.toLocaleString("es-AR")} tirados y encima tuviste que cambiar el nombre.`; } },
    ],
  },
  {
    id: "cofundador", title: "Alguien quiere ser cofundador", icon: "🤝", minDay: 20,
    text: "Una dev senior con dos exits atrás te propone sumarse full time. No quiere sueldo: quiere 15%.",
    choices: [
      { label: "Aceptar", desc: "Dev senior gratis, -15% equity", apply: (s) => { s.equity -= 15; s.employees.push({ id: `e${s.nextId++}`, name: "Vicky Cofundadora", role: "dev", level: 3, salary: 0, avatar: "👩‍💻" }); s.morale = Math.min(100, s.morale + 10); return "Se sumó. Por primera vez alguien más entiende el código."; } },
      { label: "Seguir siendo solo founder", desc: "Mantenés el 100%", apply: (s) => { s.morale = Math.max(0, s.morale - 3); return "Solo founder. Como los grandes y como los que quiebran."; } },
    ],
  },
  {
    id: "amigo", title: "Un amigo te pide trabajo", icon: "🫂", minDay: 15,
    text: "Un amigo de toda la vida se quedó sin laburo y te pide una chance. No sabe programar, pero es capaz.",
    choices: [
      { label: "Darle una chance", desc: "55%: resulta ser un crack", chance: 0.55, apply: (s, ok) => { const salary = 1800; if (ok) { s.employees.push({ id: `e${s.nextId++}`, name: "Tu amigo", role: "marketing", level: 2, salary, avatar: "🧑‍💼" }); s.morale = Math.min(100, s.morale + 8); return "Resultó ser buenísimo en growth. Quién lo hubiera dicho."; } s.employees.push({ id: `e${s.nextId++}`, name: "Tu amigo", role: "marketing", level: 1, salary, avatar: "🧑‍💼" }); s.morale = Math.max(0, s.morale - 6); return "No termina de encajar y el equipo lo nota. Pero es tu amigo."; } },
      { label: "Decirle que no", desc: "Charla incómoda, foco intacto", apply: (s) => { s.morale = Math.max(0, s.morale - 2); return "Fue una charla horrible, pero la empresa no es un favor."; } },
    ],
  },
  {
    id: "usuario_pesado", title: "El usuario que exige", icon: "📞", minUsers: 150,
    text: "Tu usuario más ruidoso quiere una feature hecha a medida para él. Si no, se va y avisa que lo va a contar.",
    choices: [
      { label: "Hacerle la feature", desc: "Frena el roadmap general", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 7); s.hype = Math.min(100, s.hype + 4); return "Quedó feliz y lo contó en redes. El resto del roadmap esperó."; } },
      { label: "Bancarte que se vaya", desc: "40%: se va con ruido", chance: 0.6, apply: (s, ok) => { if (ok) { s.morale = Math.min(100, s.morale + 5); s.featureProgress += 3; return "Se fue en silencio y el equipo trabajó tranquilo."; } const lost = Math.round(s.users * 0.05 + 10); s.users -= lost; s.hype = Math.max(0, s.hype - 8); return `Se fue tirando mierda en todos lados. -${lost} usuarios.`; } },
    ],
  },
  {
    id: "cobraste_menos", title: "Les cobraste de menos", icon: "🧮", minUsers: 200,
    text: "Un bug de facturación viene cobrando la mitad hace tres meses. Nadie se quejó, obviamente.",
    choices: [
      { label: "Avisar y corregir", desc: "Recuperás plata, algunos se van", apply: (s) => { const gain = Math.round(s.users * 3); s.cash += gain; s.stats.totalRevenue += gain; const lost = Math.round(s.users * 0.05); s.users -= lost; return `Mail honesto y precios corregidos: +$${gain.toLocaleString("es-AR")}, -${lost} usuarios.`; } },
      { label: "Corregirlo en silencio", desc: "50%: nadie lo nota", chance: 0.5, apply: (s, ok) => { const gain = Math.round(s.users * 2); s.cash += gain; s.stats.totalRevenue += gain; if (ok) return `Nadie dijo nada y entraron $${gain.toLocaleString("es-AR")} más.`; const lost = Math.round(s.users * 0.12); s.users -= lost; s.hype = Math.max(0, s.hype - 15); return `Se dieron cuenta del aumento sin aviso. -${lost} usuarios enojados.`; } },
    ],
  },
  {
    id: "uso_inesperado", title: "Lo están usando para otra cosa", icon: "🔭", minUsers: 300,
    text: "Descubrís que un montón de gente usa tu producto para algo que nunca imaginaste. Y les funciona.",
    choices: [
      { label: "Abrazar ese caso de uso", desc: "Muchos usuarios nuevos, se desvía el roadmap", apply: (s) => { const n = Math.round(s.users * 0.25 + 80); s.users += n; s.featureProgress = Math.max(0, s.featureProgress - 6); s.hype = Math.min(100, s.hype + 12); return `+${n} usuarios de un mercado que no sabías que existía.`; } },
      { label: "Bloquearlo y mantener el foco", desc: "Perdés esos usuarios, ganás calidad", apply: (s) => { const lost = Math.round(s.users * 0.08); s.users -= lost; s.bugs = Math.max(0, s.bugs - 3); s.featureProgress += 4; return `-${lost} usuarios, pero el producto volvió a tener una sola forma de usarse.`; } },
    ],
  },
  {
    id: "competidor_quiebra", title: "Quebró un competidor", icon: "⚰️", minDay: 60, minUsers: 200,
    text: "Uno de los grandes de tu categoría cerró de un día para el otro. Sus usuarios están buscando adónde ir.",
    choices: [
      { label: "Salir a buscarlos con campaña", desc: "Cuesta, pero entran muchos", apply: (s) => { const cost = Math.round(3000 + s.users * 0.8); s.cash -= cost; const n = Math.round(s.users * 0.3 + 120); s.users += n; s.hype = Math.min(100, s.hype + 10); return `$${cost.toLocaleString("es-AR")} en campaña y +${n} usuarios huérfanos.`; } },
      { label: "Esperar a que lleguen solos", desc: "Gratis, entran menos", apply: (s) => { const n = Math.round(s.users * 0.08 + 25); s.users += n; return `Llegaron ${n} por su cuenta. Gratis es gratis.`; } },
    ],
  },
];

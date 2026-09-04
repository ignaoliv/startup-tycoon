import type { CampaignDef, ExecDef, FeatureDef, GameEventDef, GameState, OfficeDef, Role, SectorDef, StageDef, TempEffect } from "./types";

export const EVENT_DEFAULT_DAYS = 6;
export const BURNOUT = { crunchPerDay: 1.6, redPerDay: 0.4, recoverPerDay: 1.2, breakAt: 85 };
export const ONBOARDING_DAYS = 15;

/** Agrega (o reemplaza) un efecto temporal. */
export function addEffect(s: GameState, e: Omit<TempEffect, "until"> & { days: number }) {
  s.effects = s.effects.filter((x) => x.id !== e.id);
  const { days, ...rest } = e;
  s.effects.push({ ...rest, until: s.day + days });
}

export const TICK_MS = 4000; // 1 día de juego
export const OFFLINE_MAX_DAYS = 240;
export const START_CASH = 30000;

export const ROLES: Record<Role, { name: string; plural: string; icon: string; baseSalary: number; desc: string; payLabel: string }> = {
  ai: { name: "Agente IA", plural: "Agentes IA", icon: "🤖", baseSalary: 900, desc: "Vibecodea rapidísimo y barato. Deja mucha deuda técnica.", payLabel: "tokens/mes" },
  dev: { name: "Dev humano", plural: "Devs", icon: "👩‍💻", baseSalary: 3400, desc: "Más lento, pero revisa lo que escribe la IA y limpia deuda.", payLabel: "/mes" },
  design: { name: "Diseño", plural: "Diseñadores", icon: "🎨", baseSalary: 2800, desc: "Que no parezca hecho por un bot. Sube calidad, baja churn.", payLabel: "/mes" },
  marketing: { name: "Growth", plural: "Growth", icon: "📣", baseSalary: 2600, desc: "Funnels, SEO y ads. Trae usuarios y mantiene el hype.", payLabel: "/mes" },
  social: { name: "Community", plural: "Community", icon: "📱", baseSalary: 2200, desc: "Maneja las redes. Suma seguidores y, cuantos más tenés, más campañas salen solas.", payLabel: "/mes" },
  sales: { name: "Ventas", plural: "Vendedores", icon: "🤝", baseSalary: 3000, desc: "Convierte curiosos en clientes que pagan. Sube el ARPU.", payLabel: "/mes" },
  qa: { name: "QA", plural: "Testers", icon: "🧪", baseSalary: 2400, desc: "Encuentra lo que la IA alucinó antes que los usuarios.", payLabel: "/mes" },
  ops: { name: "DevOps", plural: "DevOps", icon: "🛠️", baseSalary: 2900, desc: "Baja la factura de servidores y tokens. Sube la moral.", payLabel: "/mes" },
  cto: { name: "CTO", plural: "CTO", icon: "🧑‍🔬", baseSalary: 12000, desc: "Ordena la ingeniería.", payLabel: "/mes" },
  cmo: { name: "CMO", plural: "CMO", icon: "🧑‍🎤", baseSalary: 10000, desc: "Ordena el marketing.", payLabel: "/mes" },
  cfo: { name: "CFO", plural: "CFO", icon: "🧑‍💼", baseSalary: 11000, desc: "Ordena la plata.", payLabel: "/mes" },
  coo: { name: "COO", plural: "COO", icon: "🧑‍✈️", baseSalary: 10000, desc: "Ordena la operación.", payLabel: "/mes" },
};

export const EXEC_ROLES = ["cto", "cmo", "cfo", "coo"] as const;

export const EXECS: ExecDef[] = [
  {
    role: "cto", name: "CTO", icon: "🧑‍🔬", baseSalary: 12000, equity: 2,
    desc: "Alguien que lea lo que escriben los agentes. Con más de 5 técnicos, sin CTO todo se vuelve caos.",
    bonus: "-25% deuda técnica generada, +10% productividad dev",
    penalty: "Sin CTO cuando hace falta: -30% productividad dev, +60% deuda técnica",
    needed: (s) => { const n = s.employees.filter((e) => ["ai", "dev", "qa", "ops"].includes(e.role) && !e.founder).length; return n >= 6 ? `Tenés ${n} técnicos y nadie que los coordine.` : null; },
  },
  {
    role: "cmo", name: "CMO", icon: "🧑‍🎤", baseSalary: 10000, equity: 1,
    desc: "Con miles de usuarios, tirar campañas sueltas ya no alcanza. Necesitás estrategia.",
    bonus: "+15% crecimiento, el hype cae más lento",
    penalty: "Sin CMO cuando hace falta: -35% crecimiento, el hype cae más rápido",
    needed: (s) => (s.users >= 3000 ? `Con ${Math.round(s.users).toLocaleString("es-AR")} usuarios el marketing casero ya no escala.` : s.followers >= 15000 ? "Con esa cantidad de seguidores necesitás alguien que piense la marca." : null),
  },
  {
    role: "cfo", name: "CFO", icon: "🧑‍💼", baseSalary: 11000, equity: 1,
    desc: "Desde Seed los inversores quieren ver números serios. Y alguien que frene el gasto.",
    bonus: "-8% costos",
    penalty: "Sin CFO cuando hace falta: +15% costos y los VCs no te dan la Serie A",
    needed: (s) => (s.stage >= 2 ? "Después del Seed los inversores exigen un CFO para seguir." : s.employees.length >= 12 ? "Con 12 personas nadie sabe adónde va la plata." : null),
  },
  {
    role: "coo", name: "COO", icon: "🧑‍✈️", baseSalary: 10000, equity: 1,
    desc: "Con más de 20 personas, los procesos se comen la productividad. Alguien tiene que ordenar.",
    bonus: "La burocracia por tamaño de equipo pesa la mitad, +8 moral",
    penalty: "Sin COO cuando hace falta: -15% productividad general, -15 moral",
    needed: (s) => (s.employees.length >= 24 ? `Con ${s.employees.length} personas la operación se desordena.` : null),
  },
];

export const SALARY_INFLATION = { everyDays: 60, pct: 0.04 };

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

export const NEW_FEATURE_ID = "new-feature";
export const REBRAND_ID = "rebranding";
export const CUSTOM_FEATURE_NAMES = ["Integración con Slack", "Exportar a Excel", "Widget para Notion", "Modo offline", "Comandos por voz", "Plantillas", "Dashboard de equipo", "Notificaciones push", "Búsqueda con IA", "Atajos de teclado", "Import desde CSV", "Roles y permisos", "Firma digital", "Chat en vivo", "Automatizaciones", "Extensión de Chrome", "Resumen semanal", "Integración con WhatsApp", "Gamificación", "Login con passkeys", "Modo presentación", "Comentarios", "Historial de versiones", "Etiquetas inteligentes", "Calendario", "Webhooks", "Traducción automática", "Modo zen"];

export const FEATURES: FeatureDef[] = [
  { id: "prd", name: "PRD", icon: "📝", desc: "Escribir qué vas a construir y para quién. Sin PRD el equipo construye a ciegas: -35% crecimiento.", cost: 12, effects: { quality: 5 } },
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

/** Publicidad paga: gasto por día y cómo se llama cada nivel. */
export const ADS_LEVELS = [
  { name: "Apagado", icon: "⏹️", spendDay: 0, desc: "Sin ads. Solo orgánico." },
  { name: "Tímido", icon: "📍", spendDay: 50, desc: "Unos Google Ads con presupuesto de estudiante." },
  { name: "Serio", icon: "📈", spendDay: 300, desc: "Meta + Google + TikTok Ads con alguien mirando el dashboard." },
  { name: "A lo loco", icon: "🚀", spendDay: 1500, desc: "Quemar plata de inversores como corresponde." },
];

/** #buildinpublic: fijo por día mientras esté activado. */
export const BUILD_IN_PUBLIC = { hypeDay: 0.15, followersDay: 40 };

/** Campañas que se automatizan según los puntos de Community (suma de niveles). */
export const AUTO_CAMPAIGNS: { minPts: number; id: string }[] = [
  { minPts: 1, id: "thread" },
  { minPts: 3, id: "tiktok" },
  { minPts: 5, id: "podcast" },
  { minPts: 7, id: "giveaway" },
  { minPts: 10, id: "influencer" },
];

export const CAMPAIGNS: CampaignDef[] = [
  { id: "thread", name: "Hilo en X", icon: "🐦", desc: "Contás en 12 tweets cómo lo hiciste con IA sin escribir código.", cost: () => 0, cooldown: 4, hype: 6, followers: (s) => 120 + s.followers * 0.03, risk: { chance: 0.2, text: "Te ratioaron. 'Otro wrapper de ChatGPT'.", hype: -4 } },
  { id: "linkedin", name: "Post cringe en LinkedIn", icon: "💼", desc: "'Hoy despedí a mi mejor amigo. Esto es lo que aprendí sobre liderazgo.' Termina con 'Agree?'.", cost: () => 0, cooldown: 5, hype: 7, followers: (s) => 250 + s.followers * 0.02, risk: { chance: 0.45, text: "Se hizo captura y circuló en grupos de WhatsApp. Por las razones equivocadas.", hype: -5 } },
  { id: "tiktok", name: "Video demo", icon: "📹", desc: "Un TikTok/Reel de 40 segundos mostrando el producto. Con música de moda.", cost: () => 800, cooldown: 7, hype: 12, followers: (s) => 350 + s.followers * 0.05, users: (s) => 20 + s.users * 0.02 },
  { id: "podcast", name: "Podcast de founders", icon: "🎙️", desc: "Una hora hablando de vibecoding y product-market fit.", cost: () => 0, cooldown: 14, hype: 10, followers: (s) => 250 + s.followers * 0.04, requires: (s) => (s.users < 100 ? "Con menos de 100 usuarios no te invitan." : null) },
  { id: "meetup", name: "Meetup de la comunidad", icon: "🍻", desc: "Cerveza, pizza y una demo en vivo. Sube la moral del equipo también.", cost: (s) => 1500 + s.employees.length * 100, cooldown: 12, hype: 10, morale: 8, followers: () => 300 },
  { id: "producthunt", name: "Lanzar en Product Hunt", icon: "🚀", desc: "Una sola vez. Si sale bien, te ven todos los early adopters del mundo.", cost: () => 0, cooldown: 100000, hype: 35, followers: () => 1500, users: (s) => 300 + s.users * 0.1, requires: (s) => (!s.done.includes("landing") ? "Necesitás la Landing con IA." : null) },
  { id: "giveaway", name: "Sorteo en redes", icon: "🎁", desc: "Seguí, dale like y etiquetá a 3 amigos. Muchos seguidores, algunos hasta usan el producto.", cost: () => 2500, cooldown: 15, hype: 8, followers: (s) => 1200 + s.followers * 0.08, users: (s) => 150 + s.users * 0.05 },
  { id: "influencer", name: "Influencer tech", icon: "🤝", desc: "Le pagás a alguien con 200k seguidores para que diga que le cambió la vida.", cost: (s) => 4000 + s.users * 0.5, cooldown: 20, hype: 20, followers: (s) => 800 + s.followers * 0.1, users: (s) => 100 + s.users * 0.08, risk: { chance: 0.3, text: "El influencer no entendió qué hace el producto. Salió tibio.", hype: 5 } },
  { id: "press", name: "PR con periodistas", icon: "📰", desc: "Una agencia te consigue notas en medios tech.", cost: () => 8000, cooldown: 30, hype: 25, followers: () => 1000, users: (s) => 50 + s.users * 0.05, requires: (s) => (s.users < 500 ? "Con menos de 500 usuarios no hay nota." : null) },
  { id: "billboard", name: "Cartel en la 9 de Julio", icon: "🏙️", desc: "Vía pública gigante. Nadie sabe si funciona, pero queda hermoso en el pitch deck.", cost: () => 25000, cooldown: 45, hype: 30, followers: () => 2000, users: (s) => 500 + s.users * 0.03, requires: (s) => (s.users < 2000 ? "Con menos de 2.000 usuarios es tirar plata." : null) },
  // Sponsoreos grandes: se desbloquean con rondas. Pueden salir mal y ser puro gasto.
  { id: "parrilla", sponsor: true, minStage: 1, name: "Sponsor de una parrilla", icon: "🍖", desc: "Tu logo en el cartel de la parrilla de la esquina. Los vecinos preguntan qué es 'SaaS'.", cost: () => 3000, cooldown: 30, hype: 8, followers: () => 200, users: () => 30, risk: { chance: 0.4, text: "Solo comieron los del equipo. Puro gasto.", hype: 0 } },
  { id: "club", sponsor: true, minStage: 2, name: "Camiseta de un club del ascenso", icon: "⚽", desc: "Tu logo en el pecho de un equipo de la B Metro. Hinchada fiel, transmisión dudosa.", cost: () => 20000, cooldown: 45, hype: 18, followers: () => 2500, users: (s) => 100 + s.users * 0.02, risk: { chance: 0.35, text: "Perdieron 4 a 0 y el partido no se televisó. Puro gasto.", hype: 0 } },
  { id: "festival", sponsor: true, minStage: 3, name: "Sponsor de un festival", icon: "🎵", desc: "Tu marca en el escenario principal. Tres días de música y fernet.", cost: () => 150000, cooldown: 60, hype: 30, followers: () => 8000, users: (s) => 500 + s.users * 0.05, risk: { chance: 0.3, text: "Llovió y se suspendió el sábado. Puro gasto.", hype: 0 } },
  { id: "f1", sponsor: true, minStage: 4, name: "Sponsor de F1", icon: "🏎️", desc: "Tu logo en el alerón de un auto de Fórmula 1. Ahora sí sos una empresa seria.", cost: () => 5000000, cooldown: 90, hype: 45, followers: () => 50000, users: (s) => 3000 + s.users * 0.08, risk: { chance: 0.35, text: "El auto abandonó en la vuelta 3 y el logo nunca salió en cámara. Puro gasto.", hype: 0 } },
  { id: "stadium", sponsor: true, minStage: 5, name: "Naming de un estadio", icon: "🏟️", desc: "El estadio pasa a llamarse como tu startup. Los hinchas lo odian, los VCs lo aman.", cost: () => 30000000, cooldown: 120, hype: 50, followers: () => 100000, users: (s) => 10000 + s.users * 0.1, risk: { chance: 0.3, text: "El club descendió y nadie quiere pronunciar el nombre nuevo. Puro gasto.", hype: 0 } },
  { id: "superbowl", sponsor: true, minStage: 5, name: "Aviso en el Super Bowl", icon: "🏈", desc: "30 segundos que cuestan más que toda tu Serie A.", cost: () => 200000000, cooldown: 365, hype: 60, followers: () => 400000, users: (s) => 50000 + s.users * 0.15, risk: { chance: 0.3, text: "Salió en el corte en que todos fueron al baño. Puro gasto.", hype: 0 } },
  { id: "satellite", sponsor: true, minStage: 6, name: "Satélite con tu logo", icon: "🛰️", desc: "Poner tu marca en órbita. Literal. Porque podés.", cost: () => 100000000, cooldown: 365, hype: 60, followers: () => 300000, users: (s) => 20000 + s.users * 0.1, risk: { chance: 0.5, text: "Explotó en la plataforma de lanzamiento. Un video hermoso. Puro gasto.", hype: 0 } },
  { id: "conference", name: "Sponsorear conferencia", icon: "🎤", desc: "Stand, remeras y keynote. Los VCs de la región pasan a saludar.", cost: () => 40000, cooldown: 60, hype: 35, followers: () => 3000, users: (s) => 200 + s.users * 0.06, requires: (s) => (s.stage < 2 ? "Necesitás al menos la ronda Seed." : null) },
];

export const FIRST_NAMES = ["Sofi", "Nico", "Juli", "Mati", "Cami", "Lucas", "Vale", "Fede", "Agus", "Flor", "Tomi", "Male", "Santi", "Cata", "Facu", "Pili", "Gonza", "Meli", "Nacho", "Lu", "Rodri", "Caro", "Manu", "Ro", "Franco", "Juana", "Ivo", "Guada", "Bruno", "Abril"];
export const LAST_NAMES = ["Pérez", "Gómez", "López", "Fernández", "Díaz", "Romero", "Suárez", "Molina", "Castro", "Ortiz", "Silva", "Rojas", "Acosta", "Benítez", "Medina", "Herrera", "Aguirre", "Giménez", "Flores", "Vega", "Cabrera", "Ríos", "Sosa", "Ledesma"];
export const AI_NAMES = ["Claudio", "Cursorito", "Copilotín", "Gepeto", "Gemi", "Lovabella", "Boltito", "Replito", "Devin Jr.", "Windsurfer", "Codex", "Sonnetto", "Opusito", "Haikú", "Llamita", "Mistralina", "Groki", "Perplex"];
export const AVATARS: Record<Role, string[]> = {
  ai: ["🤖", "🤖", "👾", "🧠"],
  dev: ["👩‍💻", "👨‍💻", "🧑‍💻"],
  design: ["👩‍🎨", "👨‍🎨", "🧑‍🎨"],
  marketing: ["🙋‍♀️", "🙋‍♂️", "🙋"],
  social: ["🤳", "💁‍♀️", "💁‍♂️"],
  sales: ["👩‍💼", "👨‍💼", "🧑‍💼"],
  qa: ["👩‍🔬", "👨‍🔬", "🧑‍🔬"],
  ops: ["👩‍🔧", "👨‍🔧", "🧑‍🔧"],
  cto: ["🧑‍🔬"],
  cmo: ["🧑‍🎤"],
  cfo: ["🧑‍💼"],
  coo: ["🧑‍✈️"],
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
      { label: "Aprovechar la ola", desc: "+35 hype, entran usuarios", apply: (s) => { s.hype = Math.min(100, s.hype + 35); const n = Math.round(s.users * 0.15 + 50); s.users += n; return `+${n} usuarios y el hype por las nubes.`; } },
      { label: "Bajo perfil", desc: "+10 hype, sin riesgo", apply: (s) => { s.hype = Math.min(100, s.hype + 10); return "Un poquito de hype. Tranquilo."; } },
    ],
  },
  {
    incident: true,
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
      { label: "Dar la entrevista", desc: "+25 hype, +usuarios", apply: (s) => { s.hype = Math.min(100, s.hype + 25); const n = Math.round(s.users * 0.1 + 100); s.users += n; return `Salió la nota. +${n} usuarios.`; } },
      { label: "Mandar al de growth", desc: "+10 hype", apply: (s) => { s.hype = Math.min(100, s.hype + 10); return "Salió bien, pero nadie se acuerda del nombre."; } },
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
      { label: "Hay que dormir", desc: "Nada cambia", apply: (s) => { s.morale = Math.max(0, s.morale - 3); return "El equipo entendió. Medio a regañadientes."; } },
    ],
  },
  {
    incident: true,
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
    incident: true,
    id: "noauth",
    title: "Un hacker te escribe",
    icon: "🕵️",
    text: "'Hola, tu API devuelve todos los usuarios sin login. Me pagás un bounty o lo publico.'",
    minUsers: 150,
    choices: [
      { label: "Pagar el bounty", desc: "-$5.000, +calidad", apply: (s) => { s.cash -= 5000; s.bugs = Math.max(0, s.bugs - 4); return "Pagaste, arreglaste y hasta lo agradeciste en X."; } },
      { label: "Ignorarlo", desc: "Lo publica. Duele.", apply: (s) => { const lost = Math.round(s.users * 0.15); s.users -= lost; s.hype = Math.max(0, s.hype - 25); return `Lo publicó. -${lost} usuarios y un hilo viral en tu contra.`; } },
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
      { label: "Vender y retirarse", desc: "Fin del juego (exit)", apply: (s) => { s.gameOver = "acquired"; s.exitAmount = ((s.users * 8 + s.cash) * 1.5 * s.equity) / 100; return "¡Exit! Te compraron. A la playa."; } },
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
      { label: "Rechazar", desc: "Foco en el producto", apply: (s) => { s.morale = Math.min(100, s.morale + 4); return "El equipo agradece no hacer integraciones con SAP."; } },
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
    id: "rustrewrite",
    title: "Un agente se puso creativo",
    icon: "🦀",
    text: "Durante la noche, un agente reescribió todo el backend en Rust 'por performance'. Nadie se lo pidió. Los tests pasan.",
    minDay: 20,
    choices: [
      { label: "Dejarlo", desc: "+calidad, -progreso de la feature actual", apply: (s) => { s.bugs = Math.max(0, s.bugs - 4); s.featureProgress = Math.max(0, s.featureProgress - 6); return "Va más rápido. Nadie sabe leerlo, pero va más rápido."; } },
      { label: "Revertir todo", desc: "Todo como estaba", apply: (s) => { s.morale = Math.max(0, s.morale - 3); return "git revert. El agente quedó ofendido (o eso parece)."; } },
    ],
  },
  {
    id: "hackernews",
    title: "Apareciste en Hacker News",
    icon: "🟠",
    text: "Alguien posteó tu landing en HN. El hilo tiene 300 comentarios. Podés entrar a responder o dejarlos hablar.",
    minUsers: 60,
    choices: [
      { label: "Entrar a responder", desc: "50/50: héroe o roast", apply: (s) => { if (Math.random() < 0.5) { s.hype = Math.min(100, s.hype + 25); s.followers += 800; s.users += Math.round(50 + s.users * 0.08); return "Respondiste con humildad y datos. Te aman."; } s.hype = Math.max(0, s.hype - 12); return "Discutiste con un senior de Google. Perdiste."; } },
      { label: "Dejarlos hablar", desc: "+10 hype seguro", apply: (s) => { s.hype = Math.min(100, s.hype + 10); s.followers += 300; return "Se pelearon entre ellos. Vos sumaste hype igual."; } },
    ],
  },
  {
    id: "cofounder",
    title: "Alguien quiere ser cofundador",
    icon: "🤝",
    text: "Una dev senior con dos exits te propone sumarse como cofundadora técnica. Quiere 15% de equity.",
    minDay: 25,
    choices: [
      { label: "Aceptar (15% equity)", desc: "Se suma una dev senior gratis, +moral", apply: (s) => { s.equity -= 15; s.employees.push({ id: `e${s.nextId++}`, name: "Vicky Cofounder", role: "dev", level: 3, salary: 0, avatar: "👩‍💻" }); s.morale = Math.min(100, s.morale + 10); return "Bienvenida. Ahora hay alguien que entiende el código."; } },
      { label: "Seguir solo", desc: "Mantenés el 100%", apply: () => "Solo founder. Como los grandes (y los que quiebran)." },
    ],
  },
  {
    id: "aiprovider",
    title: "Se cayó el proveedor de IA",
    icon: "🔌",
    text: "El API de tu proveedor de IA está caído hace horas. Tus agentes miran el techo.",
    minDay: 15,
    choices: [
      { label: "Esperar", desc: "-progreso de la feature", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 5); return "Volvió a las 6 horas. Un día perdido."; } },
      { label: "Migrar a otro proveedor", desc: "-$2.500, sin pérdida", apply: (s) => { s.cash -= 2500; return "Cambiaste de proveedor en dos horas. Vibecoder profesional."; } },
    ],
  },
  {
    id: "raise",
    title: "Piden aumento",
    icon: "💬",
    text: "Los humanos del equipo se juntaron y piden 20% de aumento. Dicen que los agentes no pagan alquiler.",
    minDay: 45,
    choices: [
      { label: "Dar el aumento", desc: "+20% sueldos humanos, +moral", apply: (s) => { let n = 0; for (const e of s.employees) if (!e.founder && e.role !== "ai") { e.salary = Math.round(e.salary * 1.2); n++; } s.morale = Math.min(100, s.morale + 10); return n ? `${n} personas cobran 20% más. Moral al tope.` : "No había humanos para aumentar."; } },
      { label: "Negar", desc: "-15 moral", apply: (s) => { s.morale = Math.max(0, s.morale - 15); return "Silencio incómodo en el daily."; } },
    ],
  },
  {
    id: "competitor_dies",
    title: "Quebró un competidor",
    icon: "⚰️",
    text: "Tu principal competidor cerró. Sus usuarios buscan adónde ir y su equipo busca laburo.",
    minUsers: 200,
    choices: [
      { label: "Salir a buscar a sus usuarios", desc: "+usuarios, -$3.000 en campañas", apply: (s) => { s.cash -= 3000; const n = Math.round(100 + s.users * 0.12); s.users += n; return `+${n} usuarios huérfanos que adoptaste.`; } },
      { label: "Contratar a su equipo", desc: "Candidatos senior nuevos", apply: (s) => { s.candidates = []; for (let i = 0; i < 4; i++) { const c = makeSeniorCandidate(s); s.candidates.push(c); } s.candidatesDay = s.day; return "Cuatro seniors en la bandeja de candidatos."; } },
    ],
  },
  {
    id: "billing_bug",
    title: "Cobraste de más",
    icon: "🧾",
    text: "Un bug del checkout le cobró doble a muchos usuarios este mes. Todavía nadie se dio cuenta.",
    minUsers: 150,
    choices: [
      { label: "Devolver todo", desc: "-cash, +confianza", apply: (s) => { const amt = Math.round(s.users * 1.5); s.cash -= amt; s.hype = Math.min(100, s.hype + 5); return `Devolviste $${amt.toLocaleString("es-AR")} y mandaste un mail honesto. Aplausos.`; } },
      { label: "Hacerse el distraído", desc: "Te quedás la plata, 40% de escándalo", apply: (s) => { if (Math.random() < 0.4) { const lost = Math.round(s.users * 0.12); s.users -= lost; s.hype = Math.max(0, s.hype - 20); return `Se enteraron. -${lost} usuarios y un hilo viral en tu contra.`; } return "Nadie dijo nada. Por ahora."; } },
    ],
  },
  {
    id: "longweekend",
    title: "Finde largo",
    icon: "🏖️",
    text: "El equipo pide el viernes libre para irse a la costa. Los agentes IA no piden nada.",
    minDay: 18,
    choices: [
      { label: "Que vayan", desc: "+8 moral, -progreso", apply: (s) => { s.morale = Math.min(100, s.morale + 8); s.featureProgress = Math.max(0, s.featureProgress - 3); return "Volvieron bronceados y con ganas."; } },
      { label: "Hay deadline", desc: "-6 moral", apply: (s) => { s.morale = Math.max(0, s.morale - 6); return "Trabajaron. Nadie habló en todo el día."; } },
    ],
  },
  {
    id: "demoday",
    title: "Demo day",
    icon: "🎯",
    text: "Una aceleradora te invita a pitchear frente a 40 inversores. Hay que preparar el deck.",
    minDay: 50,
    minUsers: 300,
    choices: [
      { label: "Preparar el pitch", desc: "-progreso, +hype, chance de cheque", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 4); s.hype = Math.min(100, s.hype + 15); if (Math.random() < 0.5) { s.cash += 30000; s.equity -= 3; s.stats.raised += 30000; return "Un inversor firmó un cheque de $30.000 por 3%. Y el hype subió."; } return "Aplausos, tarjetas, ningún cheque. Pero subió el hype."; } },
      { label: "No ir", desc: "Nada cambia", apply: () => "Preferís shippear. Respetable." },
    ],
  },
  {
    id: "aitweet",
    title: "Tu agente tuiteó solo",
    icon: "🤖",
    text: "Un agente con acceso a la cuenta de X publicó 14 tweets a las 4 AM. Algunos son... opiniones.",
    minDay: 12,
    choices: [
      { label: "Dejarlos", desc: "60/40: viral o vergüenza", apply: (s) => { if (Math.random() < 0.6) { s.hype = Math.min(100, s.hype + 18); s.followers += 1200; return "Los tweets fueron un éxito. Ahora el agente es el CM."; } s.hype = Math.max(0, s.hype - 10); s.followers = Math.max(0, s.followers - 200); return "Uno de los tweets opinaba de política. Borraste todo."; } },
      { label: "Borrar y sacarle el acceso", desc: "Sin riesgo, -2 hype", apply: (s) => { s.hype = Math.max(0, s.hype - 2); return "Borrado. Rotaste la contraseña. Otra vez."; } },
    ],
  },
  // ---- incidentes (más probables con deuda técnica)
  {
    incident: true,
    id: "outage6h",
    title: "Caída de 6 horas",
    icon: "🚨",
    text: "Un deploy de viernes a la tarde tiró todo. Nadie sabe qué cambió porque el commit dice 'fix'.",
    minUsers: 40,
    choices: [
      { label: "Rollback y postmortem", desc: "-progreso, -deuda técnica", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 4); s.bugs = Math.max(0, s.bugs - 3); return "Volviste atrás y escribiste un postmortem que nadie leerá."; } },
      { label: "Hotfix arriba del hotfix", desc: "Rápido, +deuda técnica", apply: (s) => { s.bugs += 5; const lost = Math.round(s.users * 0.03); s.users -= lost; return `Volvió en 6 horas. -${lost} usuarios y más deuda.`; } },
    ],
  },
  {
    incident: true,
    id: "dataleak",
    title: "Fuga de datos",
    icon: "🕳️",
    text: "Un bucket público con los mails de tus usuarios apareció en un foro. Lo subió un agente 'para debuggear'.",
    minUsers: 200,
    choices: [
      { label: "Avisar a todos y arreglar", desc: "-15 hype, -$5.000, conservás la confianza", apply: (s) => { s.hype = Math.max(0, s.hype - 15); s.cash -= 5000; s.bugs = Math.max(0, s.bugs - 4); return "Mail honesto, bucket cerrado. Dolió, pero se quedaron."; } },
      { label: "Cerrarlo en silencio", desc: "50%: nadie se entera / escándalo", apply: (s) => { if (Math.random() < 0.5) return "Nadie se enteró. Esta vez."; const lost = Math.round(s.users * 0.2); s.users -= lost; s.hype = Math.max(0, s.hype - 30); return `Lo publicó un periodista. -${lost} usuarios y hilo viral en contra.`; } },
    ],
  },
  {
    incident: true,
    id: "viralcomplaint",
    title: "Hilo viral en contra",
    icon: "😡",
    text: "Un usuario con 80k seguidores escribió 20 tweets sobre el bug que le borró su trabajo. Está trending.",
    minUsers: 100,
    choices: [
      { label: "Responder públicamente", desc: "50%: héroe / peor", apply: (s) => { if (Math.random() < 0.5) { s.hype = Math.min(100, s.hype + 8); s.followers += 500; return "Respondiste rápido y con humildad. Terminó siendo buena prensa."; } s.hype = Math.max(0, s.hype - 15); return "Discutiste. Nunca discutas."; } },
      { label: "Arreglarle el problema por DM", desc: "-$1.000, -5 hype", apply: (s) => { s.cash -= 1000; s.hype = Math.max(0, s.hype - 5); return "Le devolviste todo y borró el hilo. Casi nadie se acordará."; } },
      { label: "Ignorar", desc: "-12 hype, algo de churn", apply: (s) => { s.hype = Math.max(0, s.hype - 12); s.users -= Math.round(s.users * 0.04); return "El hilo siguió dos días. Pasó."; } },
    ],
  },
  // ---- modo Argentina
  {
    ar: true,
    id: "dolar_salto",
    title: "Saltó el dólar",
    icon: "💵",
    text: "El dólar subió 25% en una semana. Vos cobrás en dólares y pagás sueldos en pesos.",
    minDay: 20,
    choices: [
      { label: "Guardar la diferencia", desc: "-15% costos por 45 días", apply: (s) => { addEffect(s, { id: "fx", label: "Dólar alto", icon: "💵", days: 45, costMul: 0.85 }); return "La caja respira. El equipo mira el dólar con cara larga."; } },
      { label: "Repartir la diferencia", desc: "-5% costos, +10 moral", apply: (s) => { addEffect(s, { id: "fx", label: "Dólar alto", icon: "💵", days: 45, costMul: 0.95 }); s.morale = Math.min(100, s.morale + 10); return "Ajustaste sueldos al dólar. Sos el mejor jefe del país."; } },
    ],
  },
  {
    ar: true,
    id: "atraso",
    title: "Atraso cambiario",
    icon: "🪙",
    text: "El peso se apreció. Tus sueldos en pesos ahora valen 15% más en dólares y tus ingresos siguen iguales.",
    minDay: 40,
    choices: [
      { label: "Aguantar", desc: "+15% costos por 60 días", apply: (s) => { addEffect(s, { id: "fx", label: "Atraso cambiario", icon: "🪙", days: 60, costMul: 1.15 }); return "Sesenta días caros. Como toda la vida."; } },
      { label: "Contratar afuera", desc: "-$5.000, +5% costos", apply: (s) => { s.cash -= 5000; addEffect(s, { id: "fx", label: "Atraso cambiario", icon: "🪙", days: 60, costMul: 1.05 }); return "Abriste vacantes en Colombia y Uruguay."; } },
    ],
  },
  {
    ar: true,
    id: "cepo",
    title: "Cepo nuevo",
    icon: "🔒",
    text: "Salió una norma nueva: no podés cobrar del exterior por 20 días hasta que el banco 'valide la operatoria'.",
    minUsers: 100,
    choices: [
      { label: "Esperar al banco", desc: "-50% ingresos por 20 días", apply: (s) => { addEffect(s, { id: "cepo", label: "Cepo", icon: "🔒", days: 20, revenueMul: 0.5 }); return "Veinte días mirando el home banking."; } },
      { label: "Abrir una LLC en Delaware", desc: "-$8.000, sin pérdida", apply: (s) => { s.cash -= 8000; return "Ahora sos una empresa americana. Como todos."; } },
    ],
  },
  {
    ar: true,
    id: "afip",
    title: "Inspección de AFIP",
    icon: "🧾",
    text: "Un inspector quiere ver facturas, contratos y por qué 'Claudio Mini' no está en relación de dependencia.",
    minDay: 30,
    choices: [
      { label: "Pagar lo que pidan", desc: "-5% de la caja -$2.000", apply: (s) => { const f = Math.round(Math.max(0, s.cash) * 0.05 + 2000); s.cash -= f; return `Pagaste $${f.toLocaleString("es-AR")}. Sonrisas y a otra cosa.`; } },
      { label: "Que lo vea el contador", desc: "50%: nada / multa doble", apply: (s) => { if (Math.random() < 0.5) return "El contador lo resolvió con dos formularios. Genio."; const f = Math.round(Math.max(0, s.cash) * 0.1 + 4000); s.cash -= f; return `Multa de $${f.toLocaleString("es-AR")}. El contador no atiende el teléfono.`; } },
    ],
  },
  {
    ar: true,
    id: "paro",
    title: "Paro general",
    icon: "✊",
    text: "Paro de transporte. Nadie puede llegar a la oficina. Los agentes IA, en cambio, no toman colectivo.",
    minDay: 10,
    choices: [
      { label: "Home office", desc: "Los humanos rinden 60% hoy", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 2); return "Día de home office. Cámaras apagadas."; } },
      { label: "Día libre", desc: "+6 moral, -progreso", apply: (s) => { s.morale = Math.min(100, s.morale + 6); s.featureProgress = Math.max(0, s.featureProgress - 4); return "Feriado improvisado. El equipo te ama."; } },
    ],
  },
  {
    ar: true,
    id: "luz",
    title: "Se cortó la luz",
    icon: "🔌",
    text: "Cuatro horas sin luz en toda la manzana. Las laptops aguantaron, el router no.",
    minDay: 8,
    choices: [
      { label: "Ir a un bar con wifi", desc: "-$300, -progreso chico", apply: (s) => { s.cash -= 300; s.featureProgress = Math.max(0, s.featureProgress - 1); return "Cuatro cafés con leche y un deploy desde el bar."; } },
      { label: "Comprar un UPS y router 4G", desc: "-$4.000, +3 moral", apply: (s) => { s.cash -= 4000; s.morale = Math.min(100, s.morale + 3); return "Infraestructura de primer mundo en la oficina."; } },
    ],
  },
  {
    ar: true,
    id: "mundial",
    title: "Empezó el Mundial",
    icon: "⚽",
    text: "Argentina juega a las 12 del mediodía. Nadie va a trabajar en ese horario. Ni los que dicen que no les gusta el fútbol.",
    minDay: 60,
    choices: [
      { label: "Ver los partidos en la oficina", desc: "+12 moral, -30% productividad 20 días", apply: (s) => { s.morale = Math.min(100, s.morale + 12); addEffect(s, { id: "mundial", label: "Mundial", icon: "⚽", days: 20, ptsMul: 0.7 }); return "Proyector, choripanes y gritos de gol. Cero código."; } },
      { label: "Trabajar igual", desc: "-15 moral", apply: (s) => { s.morale = Math.max(0, s.morale - 15); return "Miraron los partidos igual, escondidos. Y te odian."; } },
    ],
  },
  {
    ar: true,
    id: "contractors",
    title: "Piden relación de dependencia",
    icon: "📋",
    text: "Los humanos del equipo, todos monotributistas, quieren aguinaldo, vacaciones y obra social.",
    minDay: 90,
    choices: [
      { label: "Efectivizar a todos", desc: "+12% costos para siempre, +10 moral", apply: (s) => { addEffect(s, { id: "cargas", label: "Cargas sociales", icon: "📋", days: 99999, costMul: 1.12 }); s.morale = Math.min(100, s.morale + 10); return "Ahora son empleados de verdad. Y vos, empleador de verdad."; } },
      { label: "Seguir con monotributo", desc: "-8 moral, riesgo con AFIP", apply: (s) => { s.morale = Math.max(0, s.morale - 8); return "Todo sigue igual. Por ahora."; } },
    ],
  },
  // ---- vida tech
  {
    id: "forcepush",
    title: "Force push a main",
    icon: "💥",
    text: "El junior hizo git push --force a main y borró dos días de trabajo del equipo. Está llorando en el baño.",
    minDay: 15,
    choices: [
      { label: "Recuperar desde reflog", desc: "-progreso chico, +moral", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 2); s.morale = Math.min(100, s.morale + 3); return "Recuperaste casi todo y le diste una charla amable sobre branch protection."; } },
      { label: "Rehacer todo", desc: "-progreso grande", apply: (s) => { s.featureProgress = Math.max(0, s.featureProgress - 8); return "Dos días perdidos. Activaste branch protection tarde."; } },
    ],
  },
  {
    id: "exboss",
    title: "Tu ex jefe quiere invertir",
    icon: "👔",
    text: "El gerente que te decía que 'la IA es una moda' vio tu tracción y quiere poner $20.000.",
    minDay: 35,
    choices: [
      { label: "Aceptar (3% equity)", desc: "+$20.000", apply: (s) => { s.cash += 20000; s.equity -= 3; s.stats.raised += 20000; return "Plata es plata. Ahora te manda mensajes los domingos."; } },
      { label: "Rechazar con elegancia", desc: "+10 hype (la historia es buenísima)", apply: (s) => { s.hype = Math.min(100, s.hype + 10); return "Lo contaste en X. 2 millones de views."; } },
    ],
  },
  {
    id: "schooltalk",
    title: "Charla en un colegio",
    icon: "🏫",
    text: "Tu vieja escuela te invita a contar 'cómo llegaste a ser emprendedor'. Un día entero.",
    minDay: 25,
    choices: [
      { label: "Ir", desc: "+6 moral (del fundador también), -1 día", apply: (s) => { s.morale = Math.min(100, s.morale + 6); s.burnout = Math.max(0, s.burnout - 10); s.featureProgress = Math.max(0, s.featureProgress - 1); return "Te preguntaron cuánto ganás. Volviste con energía."; } },
      { label: "No tengo tiempo", desc: "Nada cambia", apply: () => "Mandaste un video grabado. Los chicos lo vieron a 2x." },
    ],
  },
  // ---- dinámicos: los dispara el motor
  {
    dynamic: true,
    id: "quit_dyn",
    title: (_s, p) => `${p.name} tiene otra oferta`,
    icon: "🚪",
    text: (_s, p) => `${p.name} (${p.roleName}) recibió una oferta por $${Number(p.offer).toLocaleString("es-AR")}/mes${p.reason ? `. ${p.reason}` : ""}. Te da hasta el viernes.`,
    days: 4,
    defaultChoice: 1,
    choices: [
      { label: "Contraoferta", desc: "Igualar la oferta (+25% sueldo)", apply: (s, p) => { const e = s.employees.find((x) => x.id === p.employeeId); if (!e) return "Ya se había ido."; e.salary = Number(p.offer); return `${e.name} se queda cobrando $${e.salary.toLocaleString("es-AR")}/mes.`; } },
      { label: "Dejarlo ir", desc: "Pierde la persona, -5 moral", apply: (s, p) => { const e = s.employees.find((x) => x.id === p.employeeId); if (!e) return "Ya se había ido."; s.employees = s.employees.filter((x) => x.id !== e.id); s.morale = Math.max(0, s.morale - 5); return `${e.name} se fue. Le deseaste suerte por LinkedIn.`; } },
      { label: "Ofrecer stock options", desc: "-0.5% de tu equity, se queda, +5 moral", apply: (s, p) => { const e = s.employees.find((x) => x.id === p.employeeId); if (!e) return "Ya se había ido."; s.equity -= 0.5; s.morale = Math.min(100, s.morale + 5); return `${e.name} se queda por las options. Cree en el proyecto (o en el exit).`; } },
    ],
  },
  {
    dynamic: true,
    id: "burnout_founder",
    title: "Estás quemado",
    icon: "🫠",
    text: "Hace semanas que dormís cuatro horas. Te olvidaste el nombre de tu propia startup en una reunión.",
    days: 3,
    defaultChoice: 1,
    choices: [
      { label: "Tomarse dos semanas", desc: "Sin fundador 14 días, burnout baja a 30", apply: (s) => { s.founderOffUntil = s.day + 14; s.burnout = 30; s.crunch = false; return "Apagaste Slack. El equipo sobrevivió sin vos (ouch)."; } },
      { label: "Seguir a full", desc: "-10 moral, 40% de colapsar (3 semanas afuera)", apply: (s) => { s.morale = Math.max(0, s.morale - 10); if (Math.random() < 0.4) { s.founderOffUntil = s.day + 21; s.burnout = 40; s.crunch = false; return "Colapsaste en la oficina. Tres semanas de reposo obligado."; } s.burnout = Math.max(0, s.burnout - 15); return "Aguantaste. Por ahora."; } },
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
      { label: "Esperar", desc: "Nada cambia", apply: (s) => { s.hype = Math.max(0, s.hype - 5); return "Seguís con lo viejo. Twitter se burla un poco."; } },
    ],
  },
];

function makeSeniorCandidate(s: import("./types").GameState): import("./types").Candidate {
  const roles: Role[] = ["dev", "design", "marketing", "sales", "qa", "ops", "social"];
  const r = roles[Math.floor(Math.random() * roles.length)];
  const salary = Math.round((ROLES[r].baseSalary * 3.6) / 50) * 50;
  return { id: `e${s.nextId++}`, name: `${FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}`, role: r, level: 3, salary, avatar: AVATARS[r][0], fee: Math.round(salary * 0.5) };
}

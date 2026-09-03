import type { CampaignDef, FeatureDef, GameEventDef, OfficeDef, Role, SectorDef, StageDef } from "./types";

export const TICK_MS = 4000; // 1 día de juego
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
};

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

export const CAMPAIGNS: CampaignDef[] = [
  { id: "thread", name: "Hilo en X", icon: "🐦", desc: "Contás en 12 tweets cómo lo hiciste con IA sin escribir código.", cost: () => 0, cooldown: 4, hype: 6, followers: (s) => 120 + s.followers * 0.03, risk: { chance: 0.2, text: "Te ratioaron. 'Otro wrapper de ChatGPT'.", hype: -4 } },
  { id: "tiktok", name: "Video demo", icon: "📹", desc: "Un TikTok/Reel de 40 segundos mostrando el producto. Con música de moda.", cost: () => 800, cooldown: 7, hype: 12, followers: (s) => 350 + s.followers * 0.05, users: (s) => 20 + s.users * 0.02 },
  { id: "podcast", name: "Podcast de founders", icon: "🎙️", desc: "Una hora hablando de vibecoding y product-market fit.", cost: () => 0, cooldown: 14, hype: 10, followers: (s) => 250 + s.followers * 0.04, requires: (s) => (s.users < 100 ? "Con menos de 100 usuarios no te invitan." : null) },
  { id: "meetup", name: "Meetup de la comunidad", icon: "🍻", desc: "Cerveza, pizza y una demo en vivo. Sube la moral del equipo también.", cost: (s) => 1500 + s.employees.length * 100, cooldown: 12, hype: 10, morale: 8, followers: () => 300 },
  { id: "producthunt", name: "Lanzar en Product Hunt", icon: "🚀", desc: "Una sola vez. Si sale bien, te ven todos los early adopters del mundo.", cost: () => 0, cooldown: 100000, hype: 35, followers: () => 1500, users: (s) => 300 + s.users * 0.1, requires: (s) => (!s.done.includes("landing") ? "Necesitás la Landing con IA." : null) },
  { id: "giveaway", name: "Sorteo en redes", icon: "🎁", desc: "Seguí, dale like y etiquetá a 3 amigos. Muchos seguidores, algunos hasta usan el producto.", cost: () => 2500, cooldown: 15, hype: 8, followers: (s) => 1200 + s.followers * 0.08, users: (s) => 150 + s.users * 0.05 },
  { id: "influencer", name: "Influencer tech", icon: "🤝", desc: "Le pagás a alguien con 200k seguidores para que diga que le cambió la vida.", cost: (s) => 4000 + s.users * 0.5, cooldown: 20, hype: 20, followers: (s) => 800 + s.followers * 0.1, users: (s) => 100 + s.users * 0.08, risk: { chance: 0.3, text: "El influencer no entendió qué hace el producto. Salió tibio.", hype: 5 } },
  { id: "press", name: "PR con periodistas", icon: "📰", desc: "Una agencia te consigue notas en medios tech.", cost: () => 8000, cooldown: 30, hype: 25, followers: () => 1000, users: (s) => 50 + s.users * 0.05, requires: (s) => (s.users < 500 ? "Con menos de 500 usuarios no hay nota." : null) },
  { id: "billboard", name: "Cartel en la 9 de Julio", icon: "🏙️", desc: "Vía pública gigante. Nadie sabe si funciona, pero queda hermoso en el pitch deck.", cost: () => 25000, cooldown: 45, hype: 30, followers: () => 2000, users: (s) => 500 + s.users * 0.03, requires: (s) => (s.users < 2000 ? "Con menos de 2.000 usuarios es tirar plata." : null) },
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
  sales: ["👩‍💼", "👨‍💼", "🧑‍💼"],
  qa: ["👩‍🔬", "👨‍🔬", "🧑‍🔬"],
  ops: ["👩‍🔧", "👨‍🔧", "🧑‍🔧"],
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

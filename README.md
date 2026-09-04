# 🚀 Startup Tycoon — vibecodeá tu startup con IA

Juego tipo tycoon (estilo Airplane/Hospital Tycoon) donde fundás una startup hecha 100% con IA: activás agentes que vibecodean, sumás humanos para contener la deuda técnica, shippeás features, sobrevivís a eventos (la IA borró prod, filtraste la API key, subió el precio de los tokens…), levantás rondas y llegás a unicornio.

Funciona en **celular y desktop** (responsive + PWA instalable), con **login con Google** vía Supabase y una **parte social**: ranking global, muro de fundadores con likes en tiempo real, y visitas a startups ajenas para darles hype, invertirles o robarles talento.

## Correr local

```bash
pnpm install
cp .env.example .env.local   # opcional, ver abajo
pnpm dev
```

Sin variables de entorno el juego corre en **modo local** (guardado en el navegador, sin login ni social). Con Supabase configurado se habilita todo.

## Configurar Supabase (login Google + social)

1. Creá un proyecto en [supabase.com](https://supabase.com) (el plan free alcanza).
2. En **SQL Editor**, pegá y ejecutá [`supabase/schema.sql`](supabase/schema.sql). Crea tablas, RLS, la vista `leaderboard`, el trigger de perfiles y habilita Realtime.
3. En **Authentication → Providers**:
   - **Google**: activalo. Necesitás un OAuth Client ID de Google Cloud:
     1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → *Create credentials* → *OAuth client ID* → tipo *Web application*.
     2. En *Authorized redirect URIs* agregá la URL que te muestra Supabase (`https://<ref>.supabase.co/auth/v1/callback`).
     3. Copiá Client ID y Client Secret en la config del provider Google de Supabase.
   - **Anonymous sign-ins**: activalo (Authentication → Settings) para el botón "Jugar como invitado".
4. En **Authentication → URL Configuration**:
   - *Site URL*: tu dominio de producción (ej. `https://startup-tycoon.vercel.app`).
   - *Redirect URLs*: agregá `http://localhost:3000/auth/callback` y `https://<tu-dominio>/auth/callback`.
5. En `.env.local` (y en las env vars de Vercel):

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

## Deploy en Vercel

```bash
vercel
```

Cargá las dos variables de entorno en el proyecto de Vercel y listo. La app es estática + un route handler (`/auth/callback`), no necesita nada más.

## Cómo funciona el juego

- **1 día de juego = 3 s** (pausa, 1x y 2x). Si cerrás la app, al volver se simulan hasta 240 días offline (sin eventos).
- **Equipo**: 🤖 agentes IA (rápidos, baratos, mucha deuda técnica), 👩‍💻 devs humanos (contienen la deuda), 🎨 diseño (calidad, churn), 📣 growth (usuarios, hype), 🤝 ventas (ARPU), 🧪 QA (bugs), 🛠️ DevOps (servidores/tokens, moral). La oficina limita cuánta gente entra.
- **Producto**: árbol de 16 features con dependencias. Cada una cambia crecimiento, ARPU, churn, calidad o hype.
- **Plata**: MRR − sueldos − alquiler − servidores/tokens. Si estás en rojo 12 días, cerrás. Rondas Pre-seed → Serie C según valuación; a $1B podés hacer IPO.
- **Eventos (39)**: generales, **por sector** (uno propio de cada sector), **reactivos** (los dispara tu forma de jugar: deuda técnica alta, moral baja, no shippear, escalar de golpe, hype sostenido, equity bajo, oficina llena, primer hito) y genéricos. Cerca de un tercio de las opciones son apuestas con la probabilidad a la vista. Nunca se repite uno hasta agotar el pool.
- **Ritmo dinámico**: cada partida sortea su carácter (tranquila / normal / caótica) y el ritmo acelera con el tamaño de la empresa. Tope de 25 popups por partida; después solo siguen los reactivos.
- **Panel de control** en `/admin`: métricas locales (duración, resultados, continuidad, popups y decisiones por partida, catálogo de eventos) y los drivers del ritmo editables en vivo.
- **Social** (requiere login): ranking por valuación, muro con likes (Realtime), visitar startups para dar hype (gratis, 1/día), invertir (cobrás dividendos de su MRR) o robar talento (pagás, ellos cobran indemnización). Las acciones llegan al otro jugador en tiempo real o cuando vuelve a entrar.

## Estructura

```
src/lib/game/        motor puro (types, data, engine, format)
src/lib/storage.ts   guardado local + Supabase + API social
src/hooks/useGame.ts loop, autosave, realtime, offline
src/components/      UI (GameShell, OfficeView SVG, paneles)
supabase/schema.sql  tablas + RLS + realtime
```

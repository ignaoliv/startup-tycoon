# Criterios de aceptación transversales

**Versión:** 1.0 · 2026-09-09 · contra el commit `2c951e4`

Los criterios por historia están en [`user-stories.md`](user-stories.md). Acá van los que cruzan todo el producto: son los que hay que verificar **antes de cada deploy** y los que definen si un cambio de balance se acepta o se revierte.

Cada criterio dice **cómo se verifica**. Si no se puede verificar, no es un criterio.

---

## Ritmo y experiencia

### CA-01 · Una partida ganada dura entre 15 y 22 minutos
Contando el tiempo de decisión de los popups (~20 s cada uno), no solo el reloj del juego.
**Verificación:** `pnpm dlx tsx scripts/sim-reporte.ts 300` (suma `SEG_POR_POPUP`) contrastado con partidas reales.

### CA-02 · Como máximo 25 popups de calendario por partida
Después del tope siguen apareciendo solo los reactivos, con el doble de separación.
**Verificación:** `scripts/sim-events.ts`, y la columna de popups por partida en `/admin`.

### CA-03 · Nunca dos popups a menos de 7 días
**Verificación:** `scheduleEvent` en `engine.ts` + simulador de eventos.

### CA-04 · El jugador nunca se queda sin nada que construir más de 5 días
**Verificación:** medición de huecos en `sim-reporte.ts`. El caso que originó el criterio: el roadmap se agotaba el día 234 y la partida seguía 204 días vacía.

### CA-05 · El primer minuto no está vacío
El día arranca en 2.600 ms y baja a 1.500 ms hacia el día 60; los primeros 60 días no pueden costar más de ~2,5 minutos.
**Verificación:** `dayMs()` + `sim-duracion.ts`.

### CA-06 · Todo lo irreversible se confirma
Levantar una ronda, salir a bolsa, echar a alguien y empezar de nuevo piden confirmación explícita antes de ejecutar.
**Verificación:** revisión manual de `MoneyPanel`, `TeamPanel` y `GameShell`.

### CA-07 · Los avisos de pantalla siguen ahí
Los tres avisos (ronda disponible, oficina llena, equipo parado 3 días) aparecen cuando corresponde y linkean a la pestaña que resuelve el problema.
**Verificación:** `Dashboard.tsx`. **No se sacan:** son la única palanca medida que ayuda al jugador novato sin ayudar al experto.

---

## Balance

### CA-08 · Winrate global entre 25% y 40%
**Verificación:** `runs` en producción, no el simulador. Real 2026-09-05: **30%**.

### CA-09 · Ningún final se lleva más del 50% de las partidas
**Verificación:** distribución de `ended_as` en `/admin`. Real: IPO 30 · quiebra 47 · echados 21 · abandono 2 · **adquisición 0 ❌** (ver US-041).

### CA-10 · Ningún sector por debajo del 15% de winrate, spread menor a 20 puntos
**Verificación:** vista `runs_por_sector`. Real: ai 40 · fintech 38 · crypto 28 · saas 25 · delivery 24 · **devtools 8 ❌** (ver US-042).

### CA-11 · Todas las features son alcanzables desde cero
Ninguna dependencia rota deja una rama del roadmap inalcanzable.
**Verificación:** recorrer `FEATURES` desde `done = []` antes de confiar en cualquier simulación. Ya pasó una vez (`requires: ["agent"]` en lugar de `"agente"`) y arruinó varias mediciones.

### CA-12 · Las palancas descartadas no vuelven sin datos nuevos
Más caja inicial, pre-seed más barato, más días en rojo, subir costos y overhead por cabeza: todas medidas, todas suben o bajan a los tres perfiles por igual.
**Verificación:** cualquier PR que las toque tiene que traer una medición que muestre el efecto selectivo.

> Recordatorio estructural: **la valuación se calcula sobre facturación (`mrr × 12 × múltiplo`), no sobre ganancia.** Ningún cambio de costos toca la condición de victoria salvo que funda al jugador. Las palancas que sí mueven la aguja son el board y el TAM.

---

## Persistencia y datos

### CA-13 · Nunca se pierde más de 2 segundos de juego
**Verificación:** autosave local cada 2 s + guardado al ocultar la pestaña.

### CA-14 · Una partida terminada genera exactamente una fila
El flag va en el estado persistido (no en un `ref`) y la fila lleva `game_id` con índice único; el error 23505 se traga en silencio.
**Verificación:** `select game_id, count(*) from runs group by 1 having count(*) > 1` tiene que dar vacío. El bug original metió 119 filas de más (13%).

### CA-15 · Ningún conteo sobre `runs` se hace trayendo filas
PostgREST devuelve máximo 1000 filas sin avisar.
**Verificación:** todo conteo usa `Prefer: count=exact` o las vistas `runs_resumen` / `runs_por_sector`. Ya dio números mal dos veces.

### CA-16 · El juego funciona entero sin Supabase
Sin variables de entorno el juego corre en modo local, y una caída de la nube degrada a local sin romper la partida en curso.
**Verificación:** `pnpm dev` sin `.env.local` y jugar hasta el día 30.

---

## Seguridad y privacidad

### CA-17 · Cada uno escribe solo lo suyo
RLS activo en `profiles`, `startups`, `posts`, `post_likes`, `social_actions`, `runs` y `feedback`. Escritura restringida a `auth.uid()` en todas, con dos excepciones deliberadas: `runs` acepta filas anónimas (`user_id is null`) porque se puede jugar sin cuenta, y el insert de `feedback` está abierto a `anon` por el mismo motivo.
**Verificación:** las policies de `supabase/*.sql`.

### CA-18 · Las partidas del historial son inmutables
`runs` tiene policies de insert y select, y **ninguna** de update o delete: nadie puede editar ni borrar una partida, ni su propio dueño.

### CA-19 · El feedback solo lo lee el admin
La policy compara `auth.jwt() ->> 'email'` con el mail del admin, hardcodeado. Si ese mail cambia, hay que editar la policy.

### CA-20 · Una acción social se aplica una sola vez
Se marca `processed_at` después de aplicarla, tanto en la carga inicial como por Realtime.

---

## Interfaz

### CA-21 · Mobile primero
Todo el juego se usa con una mano: navegación inferior de 5 pestañas, sin scroll horizontal, con `safe-bottom`. En desktop el dashboard queda fijo al lado del panel.
**Verificación:** probar a 375 px de ancho antes de cada deploy.

### CA-22 · Cinco pestañas, ni una más
Oficina, Equipo, Producto, Plata, Social. Contenido nuevo entra dentro de las que hay.
**Verificación:** `TABS` en `GameShell.tsx`.

### CA-23 · Accesibilidad mínima
Botones de ícono con `aria-label`, modales con `role="dialog"` y `aria-modal`, estados de selección con `aria-pressed`, y ningún dato importante comunicado solo por color.

### CA-24 · Todo en español rioplatense
Incluidos los mensajes de error y los textos del motor. Nada de "tú".

### CA-25 · Las imágenes Open Graph no rompen
Satori (next/og) exige `display: flex` en cualquier div con más de un hijo — dos expresiones JSX seguidas cuentan como dos hijos — y no respeta bien un fragment como hijo del root.
**Verificación:** abrir `/p/<id>/opengraph-image` con `?v=<timestamp>` para saltear el caché.

---

## Definition of Done

Un cambio está listo cuando:

1. `pnpm build` y `pnpm lint` pasan.
2. Se probó en 375 px de ancho, no solo en desktop.
3. Si toca el motor: hay una simulación que muestra el efecto (`sim-jugador.ts` con N ≥ 300; con N menor el ruido es de ±15 puntos y no sirve).
4. Si toca el balance y hay datos reales: la decisión se justifica con `runs`, no con el simulador.
5. Si toca una mecánica: la historia de usuario y el RF correspondientes están actualizados en `docs/`.
6. Si suma un sistema nuevo: hay un pedido explícito del dueño del producto (ver OA-8).
7. No se deploya ni se pushea sin pedido explícito.

---

## Matriz de trazabilidad

| Objetivo | Requisitos | Historias | Casos de uso | CA transversales |
| --- | --- | --- | --- | --- |
| **OA-1** El loop se entiende solo | RF-01, RF-02, RF-10, RF-15 | US-002, US-003, US-010, US-015 | UC-01, UC-02, UC-03 | CA-06, CA-07, CA-21 |
| **OA-2** Duración correcta | RF-05, RF-06, RF-24, RF-27 | US-005, US-025, US-027 | UC-04 | CA-01, CA-02, CA-03, CA-05 |
| **OA-3** Ganar cuesta | RF-18 a RF-23, RF-28 | US-019 a US-024, US-029, US-030, US-041 | UC-06, UC-07 | CA-08, CA-09, CA-12 |
| **OA-4** Sectores parejos | RF-01, RF-27 | US-028, US-042 | UC-01, UC-04 | CA-10 |
| **OA-5** Jugar sin registrarse | RF-04, RF-30, RF-34, RF-35 | US-001, US-008, US-032 | UC-08, UC-11 | CA-13, CA-14, CA-16 |
| **OA-6** Resultado compartible | RF-28, RF-32, RF-33 | US-030, US-031, US-033, US-034 | UC-07, UC-09 | CA-25 |
| **OA-7** Decidir con datos | RF-29, RF-31, RF-39, RF-40, RF-41 | US-038, US-039, US-040 | UC-13, UC-14 | CA-14, CA-15 |
| **OA-8** Mantener simple | — | todas | — | CA-22, DoD-6 |

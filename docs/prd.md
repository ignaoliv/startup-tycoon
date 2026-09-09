# PRD — Vibe Coding Game

**Producto:** Vibe Coding Game (repo `startup-tycoon`)
**Versión del documento:** 1.0 · 2026-09-09 · escrito contra el commit `2c951e4`
**Responsable:** Ignacio Olivieri
**Estado:** en producción, https://vibecodingame.com

---

## 1. Resumen

Un juego tycoon de navegador, en español rioplatense, donde fundás una startup **vibecodeada 100% con IA** y tenés que llegar a la salida grande (IPO o adquisición) antes de quedarte sin plata o de que el board te reemplace.

El jugador administra cinco cosas: **equipo** (agentes IA baratos que dejan deuda técnica + humanos que la contienen), **producto** (un roadmap que se abre solo), **plata** (caja, rondas, campañas, oficina), **eventos** (popups que frenan el juego y piden una decisión) y, si tiene cuenta, una capa **social** (ranking, muro, visitar startups ajenas).

Una partida ganada dura **~15-22 minutos**. Se juega sin registrarse; la cuenta solo agrega historial, logros de carrera, rankings con nombre y social.

## 2. Contexto y problema

No hay un tycoon corto, en español, sobre el momento actual de construir software con IA. Los tycoon de navegador existentes son o muy profundos (curva de entrada de horas) o muy vacíos (clickers sin decisiones).

El problema a resolver no es "hacer un juego de startups": es **hacer un loop de 15 minutos que alguien juegue desde el celular después de ver un tweet, y que le den ganas de compartir el resultado**.

## 3. Visión y premisa

> Fundás una startup en la que no se escribió una sola línea a mano. Los agentes IA son empleados rapidísimos y baratos que dejan un desastre atrás; los humanos son caros y lentos pero lo contienen. Todo lo que puede salir mal con IA en producción, sale mal.

La premisa es obligatoria y atraviesa todo el contenido: nombres de agentes (`Claudio`, `Cursorito`, `Gepeto`, `Opusito`), eventos (`La IA borró la base de datos`, `Filtraste la API key`, `Subió el precio de los tokens`), features (`MVP de un finde`, `Landing con IA`, `Modelo propio`).

## 4. Público y personas

| Persona | Contexto | Qué espera | Implicancia de diseño |
| --- | --- | --- | --- |
| **La Curiosa de X** (mayoritaria) | Llega desde un link, en celular, con 10 minutos | Entender en 30 segundos y ganar o perder rápido | Sin registro obligatorio, tutorial opcional, partida corta, resultado compartible |
| **El Fundador/Dev** | Conoce el paño, juega en desktop | Que los chistes sean precisos y que las decisiones tengan consecuencia real | Eventos con costo, balance que castiga sobrecontratar, números visibles |
| **El Reincidente** | Ya perdió dos veces y quiere ganar | Progresión entre partidas | Carrera, logros retroactivos, rankings, +$10.000 de caja inicial por partida perdida |

**No es para:** quien busca un management sim profundo de varias horas. Ese jugador está explícitamente fuera de alcance (ver §7).

## 5. Propuesta de valor y pilares de diseño

1. **Loop chico y legible.** Contratar → construir → crecer → levantar → sobrevivir a un evento. Cinco pestañas, ni una más.
2. **La IA como mecánica, no como tema.** El agente IA es la decisión económica central: velocidad y precio a cambio de deuda técnica.
3. **El tiempo corre solo.** El juego avanza sin clicks; el jugador interviene, no maratonea.
4. **Cada popup es una decisión con costo.** Nunca hay una opción gratis obviamente mejor.
5. **Perder es contenido.** Quebrar, que te echen o vender son finales legítimos, cada uno con su pantalla y su link para compartir.
6. **Nada de sistemas nuevos sin pedido explícito.** Decisión tomada el 2026-09-03 después de revertir una acumulación de sistemas que rompió el ritmo (ver §7).

## 6. Modelo de juego

### 6.1 Recursos del estado (`src/lib/game/types.ts`)

`cash`, `users`, `hype` (0-100), `morale` (0-100), `bugs` (deuda técnica), `equity` (%), `stage` (ronda), `office`, `employees`, `done` (features lanzadas).

Los derivados (`derive()` en `engine.ts`) se recalculan cada día: puntos de dev/QA/growth/ventas/diseño/ops, calidad, ARPU, MRR, costos, usuarios nuevos, churn y **valuación = MRR × 12 × múltiplo de la etapa + usuarios × 8 + caja × 0,5 + features × 5.000**.

> Consecuencia de balance a tener presente: **la valuación se calcula sobre facturación, no sobre ganancia**. Subir costos no cambia la condición de victoria salvo que te funda.

### 6.2 Setup

6 sectores (`SaaS con IA`, `Fintech`, `Dev tools`, `Marketplace`, `Cripto`, `Agentes IA`), cada uno con crecimiento, ARPU y TAM propios. El sector define además el pool de nombres (140 por sector) e ideas (20-22 por sector) del dado, y habilita un evento exclusivo.

Arranque: **$30.000**, garage (3 lugares), el fundador (dev nivel 2, sin sueldo) y `Claudio Mini` (agente IA nivel 1, $600/mes).

### 6.3 Equipo (7 roles)

| Rol | Sueldo base | Efecto |
| --- | --- | --- |
| 🤖 Agente IA | $900 | Dev × 1,6. Genera deuda técnica |
| 👩‍💻 Dev humano | $3.400 | Dev y contiene la deuda de la IA |
| 🎨 Diseño | $2.800 | Calidad, baja churn |
| 📣 Growth | $2.600 | Usuarios y hype |
| 🤝 Ventas | $3.000 | ARPU |
| 🧪 QA | $2.400 | Limpia bugs |
| 🛠️ DevOps | $2.900 | Recorta infraestructura (8%/punto) y sube moral |

Niveles 1/2/3 con probabilidad 55/30/15 y multiplicador de sueldo 1 / 1,9 / 3,6. Se ofrecen 4 candidatos (siempre al menos un agente IA), se renuevan cada 7 días o pagando `$500 + $100 × empleados`. El fee de contratación es **medio sueldo**.

### 6.4 Producto

**68 features**: 28 con nombre (16 del roadmap original + 12 de segundo tramo, varias con `serverCost`) y una cola generada `v2..v41` con costo `1.400 × 1,10^i` y retorno decreciente, encadenada a partir de `Plataforma abierta`. El jugador puede elegir qué construir; **si no elige, el equipo agarra solo la más barata disponible al empezar el día** — nunca hay equipo parado por olvido.

El panel muestra lanzadas + disponibles + 3 próximas ("quedan N por descubrir"), no las 68.

### 6.5 Plata

- **Costos:** sueldos + alquiler + servidores. Los servidores escalan peor que lineal (`users^1,6 × infraExtra`), lo que le da sentido a las features que recortan infra.
- **Oficinas:** garage 3 → coworking 8 → oficina 16 → loft 32 → campus 64 → torre HQ 120, con alquiler y costo de mudanza crecientes. La capacidad es un tope duro de contratación.
- **Rondas:** Pre-seed ($100k por 10%, desde $120k de valuación) → Seed → Serie A → Serie B → Serie C. Cada ronda sube el múltiplo de valuación.
- **Campañas:** Campaña (siempre, cd 8 días), Campaña de marca (desde 8k usuarios, cd 30, +5% usuarios), Sponsorear un equipo (desde 150k usuarios, cd 55, +10% usuarios). Existen para convertir la caja del final en crecimiento.
- **Board:** desde Serie A, cada ronda fija una meta de **× 6 usuarios en 75 días**. No cumplirla te cuesta el puesto.

### 6.6 Eventos (`data.ts`, 43)

- **25 de calendario** (generales, con `minDay`/`minUsers`).
- **6 por sector**, uno exclusivo de cada sector.
- **12 reactivos**, disparados por cómo venís jugando: deuda técnica > 15, moral < 52, 30 días sin shippear, crecer × 2,5 en 20 días, hype alto sostenido, equity < 50%, oficina llena 12 días, y 5 hitos de una sola vez.

Un evento **frena el reloj** hasta que se decide. 16 opciones son apuestas con la probabilidad a la vista (🎲 60% sale bien). Nunca se repite un evento. Planificador: primer evento el día 12, mínimo 7 días entre popups, tope de **25 por partida** (después solo reactivos, con separación doble), intervalo según tamaño de la empresa multiplicado por el carácter sorteado de la partida (tranquila 1,25 / normal 1 / caótica 0,8).

### 6.7 Finales

| Final | Condición | Resultado |
| --- | --- | --- |
| 🔔 **IPO** | Valuación ≥ $5.000M y tocar el botón | Victoria |
| 🏝️ **Adquisición** | Evento desde el día 150 con ≥120.000 usuarios; aceptar | Victoria |
| 💀 **Quiebra** | Caja negativa 12 días seguidos | Derrota |
| 🪑 **Te echan** | No cumplir la meta del board | Derrota |
| **Abandonada** | Empezar de nuevo con día ≥ 10 | Se registra como dato |

## 7. Alcance

### Dentro (v1.x, lo que existe hoy)

Setup de partida · loop diario con pausa/1x/2x · progreso offline hasta 240 días · equipo · roadmap · plata/rondas/IPO/oficina/campañas · board · eventos · 14 logros de partida · finales con pantalla propia · compartir en X con imagen · modo local sin cuenta · modo nube con Google/anónimo · historial de partidas, carrera y 33 logros retroactivos · 3 rankings · muro y visitas sociales · feedback in-game · panel `/admin` · landing, cómo se juega y legales con SEO.

### Fuera de alcance (decisión explícita)

Se construyó y **se revirtió el 2026-09-03** por romper el ritmo: pestaña Hype con ads/sponsors, C-level, crunch/burnout, renuncias, préstamos, vender la empresa como acción, bandeja de decisiones, revelado progresivo, modo Argentina. Vive en la rama `v2-experimentos` y **no vuelve sin pedido explícito**.

También fuera: multijugador en tiempo real, monetización, app nativa, i18n.

## 8. Requisitos funcionales

### Setup y partida
- **RF-01** El jugador crea una partida eligiendo nombre, idea, nombre de fundador y sector; nombre e idea se sortean por sector y se pueden reescribir.
- **RF-02** Cambiar de sector re-sortea nombre e idea **salvo** que el jugador ya haya escrito los suyos.
- **RF-03** Una partida perdida suma $10.000 a la caja inicial de la siguiente.
- **RF-04** Se puede jugar sin cuenta; la partida vive en `localStorage`.

### Loop
- **RF-05** El día avanza solo: 2.600 ms al inicio, bajando hasta 1.500 ms hacia el día 60.
- **RF-06** El jugador controla la velocidad: pausa, 1x, 2x.
- **RF-07** Al volver después de un rato se simulan hasta 240 días offline **sin eventos**, y se avisa cuántos pasaron y qué pasó con la caja.
- **RF-08** Un evento pendiente congela el tiempo, también el offline.

### Equipo
- **RF-09** Contratar cuesta un fee (medio sueldo) y requiere lugar libre en la oficina.
- **RF-10** Cada candidato muestra **en cuántos días de caja te deja** contratarlo.
- **RF-11** Echar a un humano baja la moral; cancelar un agente IA no.
- **RF-12** El fundador no se puede echar.
- **RF-13** El asado sube 12 de moral por $300 × persona.

### Producto
- **RF-14** El jugador elige qué feature construir entre las disponibles según dependencias.
- **RF-15** Si no hay feature en curso, el motor elige la más barata disponible al empezar el día.
- **RF-16** Los agentes IA generan deuda técnica proporcional a su nivel; los devs humanos la contienen.
- **RF-17** El roadmap no se agota: la cola `v2..v41` mantiene siempre algo por construir.

### Plata
- **RF-18** Se puede levantar la ronda siguiente si la valuación alcanza el mínimo; entra plata y se cede equity.
- **RF-19** El botón de IPO aparece con valuación ≥ $5.000M, **sin necesidad de haber levantado rondas**, y la barra de progreso está visible desde el día 1.
- **RF-20** Mudarse de oficina requiere pagar el costo y sube la moral.
- **RF-21** Las campañas tienen mínimo de usuarios y cooldown en días, ambos visibles.
- **RF-22** Desde Serie A el board fija una meta de usuarios con fecha; se muestra cuánto falta y qué pasa si no se llega.
- **RF-23** Caja negativa durante 12 días termina la partida por quiebra, avisando desde el primer día en rojo.

### Eventos
- **RF-24** Los eventos aparecen como modal bloqueante con 2+ opciones, cada una con su descripción de consecuencia.
- **RF-25** Las opciones de azar muestran la probabilidad antes de elegir.
- **RF-26** No se repite un evento dentro de la misma partida.
- **RF-27** Los eventos reactivos se disparan por el estado de la partida, con cooldown, y siguen apareciendo después del tope de 25.

### Final y carrera
- **RF-28** Cada final tiene pantalla propia con el resumen de la partida; ganar dispara confeti.
- **RF-29** Toda partida terminada se guarda una sola vez como fila de resumen en `runs` (nunca el estado completo).
- **RF-30** Sin sesión, la partida queda esperando en el navegador para poder atribuirla si el jugador entra con Google desde el cartel del final; si se va, se manda anónima.
- **RF-31** Abandonar una partida con día ≥ 10 también se registra.
- **RF-32** Cada partida tiene página pública `/p/<game_id>` con imagen Open Graph propia, y botones de compartir en X y copiar link.
- **RF-33** `/home` muestra perfil, carrera, 33 logros calculados desde `runs`, historial y 3 rankings (en vivo, semana, salón de la fama). Abre sin login.

### Cuenta y social (modo nube)
- **RF-34** Login con Google o anónimo; al entrar, la partida local se adopta si es más avanzada que la de la nube.
- **RF-35** Autoguardado local cada 2 s y en la nube cada 12 s, más un guardado al ocultar la pestaña.
- **RF-36** Ranking por valuación, muro de fundadores con likes en tiempo real y auto-post de hitos de ronda.
- **RF-37** Visitar una startup ajena permite darle hype (gratis, 1 por día), invertir (cobrás dividendos de su MRR) o robar talento (pagás, el otro cobra indemnización).
- **RF-38** Las acciones sociales recibidas se aplican al entrar o en vivo por Realtime.

### Instrumentación
- **RF-39** El jugador puede mandar feedback (nota 1-5 🤖 y/o texto) desde el menú y desde la pantalla de final, con el contexto de la partida adjunto y throttle de 5 minutos.
- **RF-40** `/admin` muestra métricas globales desde `runs`, métricas locales del navegador, el catálogo de eventos, las decisiones más tomadas y el feedback recibido.
- **RF-41** Los drivers de ritmo y dificultad (`tuning`) se editan en vivo desde `/admin` y se guardan por navegador.

## 9. Requisitos no funcionales

- **RNF-01 Rendimiento percibido.** El loop corre en el cliente sin pedidos al servidor; un día no puede trabar la UI.
- **RNF-02 Offline y resiliencia.** El juego funciona entero sin Supabase (modo local). Una caída de la nube degrada a local, no rompe la partida.
- **RNF-03 Persistencia.** Nunca perder más de 2 segundos de juego; una partida terminada se escribe una sola vez (dedupe por `game_id` con índice único).
- **RNF-04 Seguridad y privacidad.** RLS en todas las tablas: cada uno escribe solo lo suyo, el feedback lo lee solo el admin, las filas de `runs` no se pueden editar ni borrar (no hay policy de update/delete).
- **RNF-05 Responsive.** Celular primero: navegación inferior de 5 pestañas; en desktop, dashboard fijo + panel al lado.
- **RNF-06 Accesibilidad.** Botones con `aria-label`, modales con `role="dialog"`, contraste alto, tipografía grande.
- **RNF-07 SEO y compartir.** Landing, `/como-se-juega` y `/home` indexables, JSON-LD de VideoGame + FAQ, imagen OG estática y dinámica por partida.
- **RNF-08 Idioma.** Todo en español rioplatense, incluidos los mensajes de error.
- **RNF-09 Costo.** Vercel + Supabase en plan free; el motor corre en el cliente y la base guarda resúmenes, no estados.

## 10. Métricas de éxito

| Métrica | Objetivo | Medición real (2026-09-05) |
| --- | --- | --- |
| Partidas empezadas | crecimiento sostenido | 910 partidas de ~600 jugadores en un día |
| Winrate global | 25-40% | **30%** (IPO 30%, quiebra 47%, echados 21%, abandono 2%) |
| Duración de partida ganada | 15-22 min | ~15,5 min estimado / 22 min medido antes de recalibrar |
| Distribución de finales | ningún final > 50% | quiebra 47%, dentro del límite |
| Adquisiciones | debería ser una salida real | **0%** — el umbral de 120.000 usuarios no se dispara nunca |
| Balance por sector | ninguno < 15% | **devtools 8%** (ai 40 · fintech 38 · crypto 28 · saas 25 · delivery 24) |

> Regla aprendida: **cuando hay datos reales en `runs`, no se tunea contra el simulador.** El simulador sobreestimaba el winrate al doble (65% vs 30% real).

## 11. Balance como contrato

Los valores de `src/lib/game/tuning.ts` son el contrato de dificultad. Los que importan: `startCash 30.000`, `bankruptLimit 12`, `ipoValuation 5e9`, `acquireMinUsers 120.000`, `boardFromStage 3`, `boardGrowth 6`, `boardDays 75`, `boardFailsToFire 1`, `cap 25`, `separation 7`, `tamMul 0,5`, `infraExtra 0,005`.

Palancas ya medidas y **descartadas** (no reintentar sin datos nuevos): más caja inicial, pre-seed más barato, más días en rojo y subir costos suben a los tres perfiles por igual; el overhead por cabeza castiga al novato que sobrecontrata. La única palanca selectiva medida son **los avisos en pantalla** (novato de 1% a 10%).

## 12. Riesgos y deudas conocidas

| # | Riesgo / deuda | Impacto | Estado |
| --- | --- | --- | --- |
| R-1 | La adquisición no se dispara nunca (120k usuarios) | Se perdió un final entero | Abierto, requiere bajar el umbral con datos |
| R-2 | Dev tools gana 8% contra 40% de ai | Un sector es una trampa | Abierto |
| R-3 | El texto del board dice "dos metas seguidas" pero `boardFailsToFire = 1` echa a la primera | El jugador se siente estafado | Abierto, es un bug de copy (`engine.ts`) |
| R-4 | El logro "Unicornio" usa `IPO_VALUATION = 1e9` de `data.ts` mientras la IPO real pide `tuning.ipoValuation = 5e9` | Dos varas distintas para lo mismo | Documentado, intencional-ish |
| R-5 | El social/cloud nunca se probó end-to-end con dos cuentas reales | Funcionalidad grande sin evidencia | Abierto |
| R-6 | El README de la raíz quedó viejo (habla de 16 features, día de 5,5 s, IPO a $1B) | Confunde a quien llega al repo | Abierto |

## 13. Próximo

1. Arreglar R-3 (copy del board) y R-1 (umbral de adquisición) — son los dos que el jugador siente.
2. Subir devtools a la banda del resto sin tocar las palancas ya descartadas.
3. Probar el modo nube con dos cuentas reales antes de invertir más ahí.

# Casos de uso

**Versión:** 1.0 · 2026-09-09 · contra el commit `2c951e4`

**Actores**
- **Jugador** — persona jugando, con o sin cuenta.
- **Jugador con sesión** — jugador autenticado con Google o anónimo de Supabase.
- **Motor** — `src/lib/game/engine.ts`, el reloj y las reglas. Actor secundario en casi todos los casos.
- **Otro jugador** — dueño de otra startup, en modo nube.
- **Creador/Admin** — Ignacio, en `/admin`.

---

## UC-01 · Fundar una startup

| | |
| --- | --- |
| **Actor** | Jugador |
| **Precondición** | No hay partida guardada (o se borró la anterior) |
| **Disparador** | Entra a `/play` |
| **Trazabilidad** | RF-01, RF-02, RF-03 · US-002 |

**Flujo principal**
1. El sistema muestra el setup con un nombre y una idea ya sorteados para el sector por defecto (SaaS).
2. El jugador cambia el sector.
3. El sistema re-sortea nombre e idea con el pool de ese sector.
4. El jugador ajusta lo que quiera y escribe su nombre.
5. El jugador toca "Empezar 🚀".
6. El motor crea la partida: $30.000, garage, fundador (dev nivel 2, sin sueldo), `Claudio Mini` (agente IA), MVP en curso y 4 candidatos.
7. El sistema guarda en el navegador y arranca el reloj.

**Alternos**
- 2a. El jugador escribió su propio nombre o idea antes de cambiar de sector → esos campos **no** se pisan.
- 4a. Toca el 🎲 → se sortea de nuevo solo ese campo.
- 6a. Hay partidas perdidas previas → la caja inicial suma $10.000 por cada una.

**Excepciones**
- 5a. Nombre vacío → el botón está deshabilitado, no hay error que mostrar.

**Postcondición** — Partida activa en día 1, guardada localmente y (con sesión) en la nube.

---

## UC-02 · Contratar a alguien

| | |
| --- | --- |
| **Actor** | Jugador |
| **Precondición** | Partida activa |
| **Trazabilidad** | RF-09, RF-10 · US-009, US-010 |

**Flujo principal**
1. El jugador abre la pestaña Equipo.
2. El sistema muestra 4 candidatos con rol, nivel, sueldo, fee y **el runway que le queda si lo contrata**.
3. El jugador toca "Contratar"/"Activar".
4. El motor descuenta el fee (medio sueldo), suma la persona al equipo, la saca de la lista y lo escribe en el log.

**Alternos**
- 2a. Los candidatos no le gustan → paga `$500 + $100 × empleados` y se renuevan (también se renuevan solos cada 7 días).

**Excepciones**
- 3a. La oficina está llena → botón deshabilitado + cartel "Oficina llena (N). Mudate en la pestaña Plata" (ver UC-05).
- 3b. No alcanza la caja para el fee → botón deshabilitado.

**Reglas**
- Siempre hay al menos un agente IA entre los candidatos.
- Niveles: 55% L1, 30% L2, 15% L3; el sueldo escala 1 / 1,9 / 3,6 con ±10-15% de ruido.

**Postcondición** — Equipo +1, caja −fee, `stats.hires` +1.

---

## UC-03 · Elegir qué construye el equipo

| | |
| --- | --- |
| **Actor** | Jugador · Motor |
| **Trazabilidad** | RF-14, RF-15, RF-17 · US-014, US-015 |

**Flujo principal**
1. El jugador abre Producto y ve lanzadas, disponibles y 3 próximas bloqueadas.
2. Elige una disponible.
3. El motor la pone en curso y reinicia el progreso.
4. Cada día suma los puntos de dev del equipo al progreso y genera deuda técnica según la proporción IA/humanos.
5. Al llegar al costo, la feature se lanza: aplica sus efectos, suma hype si tiene, y libera el slot.

**Alternos**
- 2a. El jugador no elige nada → al empezar el día siguiente el **motor** toma la más barata disponible.
- 5a. Se agotan las features con nombre → sigue la cola `v2..v41`, cada una 10% más cara y con menos retorno.

**Excepciones**
- 2b. La feature está bloqueada por dependencias → el botón no responde y muestra qué requiere.
- 4a. No hay puntos de dev (equipo sin devs ni IA) → el estimado muestra "necesitás devs" y el progreso no avanza.

**Postcondición** — `done` +1 feature, efectos permanentes aplicados en `derive()`.

---

## UC-04 · Resolver un evento

| | |
| --- | --- |
| **Actor** | Jugador · Motor |
| **Disparador** | El planificador dispara un evento de calendario o uno reactivo |
| **Trazabilidad** | RF-24 a RF-27 · US-025, US-026, US-027 |

**Flujo principal**
1. El motor verifica que hayan pasado ≥7 días desde el último popup.
2. Evalúa primero los reactivos (por estado de la partida, con cooldown); si ninguno aplica y no llegó al tope de 25, sortea uno del calendario entre los disponibles no vistos.
3. El sistema **congela el reloj** y muestra el modal.
4. El jugador elige una opción.
5. El motor resuelve el azar si la opción lo tiene, aplica el efecto, escribe el resultado en el log y descongela el reloj.
6. El sistema registra la decisión en las métricas locales.

**Alternos**
- 2a. Ya se alcanzaron los 25 popups → solo se evalúan los reactivos, y con el doble de separación.
- 2b. No hay ningún evento disponible todavía (por `minDay`/`minUsers`) → reintenta en 3 días.
- 4a. La opción es una apuesta → el botón mostró la probabilidad antes; el resultado puede ser malo y se marca así en el log.

**Reglas**
- Un evento nunca se repite dentro de la misma partida (`seenEvents`).
- Los eventos de sector solo entran si coincide el sector de la partida.
- El intervalo entre popups depende del tamaño de la empresa y del carácter sorteado de la partida (1,25 / 1 / 0,8).

**Postcondición** — Estado modificado, `eventCount` +1, reloj corriendo otra vez.

---

## UC-05 · Mudarse de oficina

| | |
| --- | --- |
| **Actor** | Jugador |
| **Precondición** | Existe una oficina siguiente |
| **Trazabilidad** | RF-20 · US-021 |

**Flujo principal**
1. El jugador ve el aviso "La oficina está llena" en el dashboard o abre Plata directamente.
2. El sistema muestra la próxima oficina: capacidad, alquiler mensual y costo de mudanza.
3. El jugador paga.
4. El motor sube la capacidad, cobra el costo, suma 10 de moral y lo escribe en el log.

**Excepciones**
- 3a. No alcanza la caja → botón deshabilitado con el monto requerido.
- 2a. Ya está en la Torre HQ → no hay siguiente y el mensaje lo dice.

**Postcondición** — `office` +1, alquiler mensual más alto para siempre.

---

## UC-06 · Levantar una ronda

| | |
| --- | --- |
| **Actor** | Jugador |
| **Precondición** | Valuación ≥ mínimo de la ronda siguiente |
| **Trazabilidad** | RF-18, RF-22 · US-019, US-024 |

**Flujo principal**
1. El sistema avisa en el dashboard que la ronda está disponible.
2. El jugador abre Plata y ve cuánto entra y cuánto equity cede.
3. Toca "Levantar ronda".
4. El sistema pide confirmación (es irreversible).
5. El motor suma la plata, resta el equity, sube la etapa, suma 20 de hype y resetea los días en rojo.
6. Si la nueva etapa es Serie A o superior, el board fija su meta: × 6 usuarios en 75 días.
7. Con sesión, se postea el hito en el muro automáticamente.

**Excepciones**
- 3a. La valuación no alcanza → el botón está deshabilitado y la barra muestra cuánto falta.
- 3b. Ya está en Unicornio → no hay más rondas, el mensaje deriva a la IPO.

**Postcondición** — Caja +raise, equity −%, etapa +1, múltiplo de valuación más alto, posible meta de board activa.

---

## UC-07 · Terminar la partida ganando

| | |
| --- | --- |
| **Actor** | Jugador |
| **Trazabilidad** | RF-19, RF-28, RF-29 · US-020, US-030 |

**Flujo principal (IPO)**
1. La valuación llega a $5.000M; el motor marca la etapa Unicornio y lo avisa en el log.
2. El jugador abre Plata y toca "Salir a bolsa".
3. El sistema pide confirmación.
4. El motor termina la partida como `ipo`.
5. El sistema muestra confeti y la pantalla de victoria con el valor de su parte, días, pico de usuarios y features.
6. La partida se guarda una sola vez en el historial (ver UC-08).

**Alterno (adquisición)**
- 1a. Desde el día 150 y con ≥ `acquireMinUsers` usuarios puede aparecer la oferta: aceptar termina la partida como `acquired`; rechazar cuesta el 25% de los usuarios.

**Postcondición** — `gameOver` seteado, fila de resumen en `runs`, botones de compartir habilitados.

---

## UC-08 · Guardar la partida terminada en el historial

| | |
| --- | --- |
| **Actor** | Sistema · Jugador |
| **Disparador** | `gameOver` pasa a tener valor, o se abandona una partida con día ≥ 10 |
| **Trazabilidad** | RF-29, RF-30, RF-31 · US-032 |

**Flujo principal (con sesión)**
1. El sistema marca `runSaved` en el estado guardado (no en memoria: una partida terminada sigue terminada al recargar).
2. Arma la fila de resumen (nombre, sector, idea, final, día, valuación, pico de usuarios, MRR, equity, equipo, etapa, levantado, features) — **nunca el estado completo**.
3. La inserta en `runs` con `game_id`.

**Alterno (sin sesión)**
- 3a. La fila queda esperando en `localStorage` en vez de insertarse, para que el cartel "entrá con Google y esta partida queda en tu historial" no mienta.
- 3b. El jugador entra con Google desde ese cartel → se inserta a su nombre.
- 3c. El jugador oculta o cierra la pestaña → se manda anónima con `keepalive`.
- 3d. El jugador vuelve a abrir el juego más tarde → se manda anónima al cargar.

**Excepciones**
- 3e. La fila ya existía (mismo `game_id`) → el índice único la rechaza con error 23505 y el sistema lo ignora en silencio.

**Postcondición** — Exactamente una fila por partida terminada. Sin filas de update ni delete: nadie puede editar una partida, ni su dueño.

---

## UC-09 · Compartir el resultado en X

| | |
| --- | --- |
| **Actor** | Jugador |
| **Precondición** | Partida terminada |
| **Trazabilidad** | RF-32 · US-031 |

**Flujo principal**
1. El jugador toca "𝕏 Compartir" en la pantalla de final.
2. El sistema se asegura primero de que la fila esté en la base (si estaba esperando, la sube).
3. Arma el texto del resultado y abre el intent de X con texto + `https://vibecodingame.com/p/<game_id>`.
4. X levanta la imagen Open Graph desde esa página, generada con el resultado de la partida.

**Alternos**
- 1a. "🔗 Copiar link" → mismo paso 2, después copia al portapapeles y confirma "¡Copiado!".
- 1b. El portapapeles falla (permisos) → abre el link en una pestaña nueva.

**Excepciones**
- 2a. No se pudo guardar la fila → no se abre nada (un link sin fila no muestra nada).

**Reglas**
- X **no** permite adjuntar una imagen desde un intent: la toma de la tarjeta OG del link. Por eso existe `/p/<id>`.

---

## UC-10 · Volver después de días

| | |
| --- | --- |
| **Actor** | Jugador · Motor |
| **Trazabilidad** | RF-07, RF-08 · US-007 |

**Flujo principal**
1. El jugador vuelve a abrir el juego.
2. El sistema carga el estado (nube si hay sesión, si no local; gana el más avanzado).
3. Aplica las acciones sociales pendientes y actualiza el MRR de las startups del portfolio.
4. Descuenta el tiempo transcurrido de a un día, **sin disparar eventos**, hasta 240 días.
5. Muestra el cartel "pasaron N días" y escribe el saldo de caja en el log.

**Alternos**
- 4a. Un evento quedó pendiente de antes → el tiempo se frena ahí.
- 4b. La empresa quiebra durante el offline → la partida aparece terminada, con su final.

**Excepciones**
- 2a. Falla la lectura de la nube → avisa y usa la copia local.

---

## UC-11 · Entrar con cuenta y adoptar la partida local

| | |
| --- | --- |
| **Actor** | Jugador con sesión |
| **Trazabilidad** | RF-34, RF-35 · US-008, US-032 |

**Flujo principal**
1. El jugador entra con Google (o como invitado anónimo).
2. El sistema crea o actualiza su perfil.
3. Carga la partida de la nube y la compara con la local.
4. Si la local está más avanzada (más días), gana la local.
5. A partir de ahí guarda local cada 2 s y en la nube cada 12 s, además de al ocultar la pestaña.

**Alternos**
- 1a. El login se hizo desde el cartel de fin de partida → se marca "login en curso" para que el ida y vuelta a Google no mande la partida como anónima.

---

## UC-12 · Interactuar con la startup de otro jugador

| | |
| --- | --- |
| **Actores** | Jugador con sesión · Otro jugador |
| **Precondición** | Modo nube, ranking cargado |
| **Trazabilidad** | RF-36, RF-37, RF-38 · US-035 |

**Flujo principal**
1. El jugador abre la pestaña Social y elige una startup del ranking.
2. Ve su estado, su equipo y su perfil.
3. Elige una acción: hype, invertir o robar talento.
4. El sistema inserta la acción en `social_actions` dirigida al otro jugador.
5. El otro jugador la recibe en vivo (Realtime) o al volver a entrar, y su motor la aplica una sola vez.

**Reglas y excepciones**
- Hype: gratis, una vez por día por startup.
- Invertir: descuenta de la caja, no se puede invertir dos veces en la misma startup, paga dividendos del MRR del otro mientras se juega.
- Robar talento: cuesta `sueldo × 4 + 2.000`, requiere lugar libre en la oficina propia, y el otro cobra indemnización. Si el empleado ya no está, igual cobra la mitad.
- No se puede accionar sobre uno mismo (lo bloquea la policy de RLS).

---

## UC-13 · Mandar feedback

| | |
| --- | --- |
| **Actor** | Jugador |
| **Trazabilidad** | RF-39 · US-038 |

**Flujo principal**
1. El jugador abre el modal desde el menú ☰ o desde la pantalla de final.
2. Pone una nota de 1 a 5 🤖 y/o escribe un texto.
3. Envía; el sistema adjunta el contexto de la partida y guarda en `feedback`.
4. Confirma el envío y guarda la marca de tiempo en el navegador.

**Excepciones**
- 3a. Nota y texto vacíos → no se puede enviar.
- 3b. Envió hace menos de 5 minutos → se bloquea (anti-spam), también verificado del lado de la base.

**Postcondición** — Fila legible solo por el admin (RLS por email).

---

## UC-14 · Revisar métricas y tunear el balance

| | |
| --- | --- |
| **Actor** | Creador/Admin |
| **Trazabilidad** | RF-40, RF-41 · US-039, US-040 |

**Flujo principal**
1. Abre `/admin`.
2. Lee las métricas **globales** desde `runs`: duración, finales, sectores, popups por partida.
3. Lee el feedback recibido con el contexto de cada partida.
4. Ajusta los drivers de `tuning` y prueba en vivo.
5. Si el cambio se confirma, lo lleva a `DEFAULT_TUNING` en el código.

**Reglas**
- Cuando hay datos reales en `runs`, **no** se tunea contra el simulador: sobreestima el winrate al doble.
- Cualquier conteo sobre `runs` va con `count=exact` o contra las vistas de resumen: PostgREST corta en 1000 filas sin avisar.
- Toda estimación de duración tiene que sumar el tiempo de decisión de los popups (~20 s cada uno).

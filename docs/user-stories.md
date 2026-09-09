# User stories y criterios de aceptación

**Versión:** 1.0 · 2026-09-09 · contra el commit `2c951e4`
**Formato:** `US-nnn` · historia · prioridad MoSCoW · criterios de aceptación en Dado/Cuando/Entonces · dónde vive en el código.

Todas las historias descritas acá están **implementadas** salvo las marcadas con 🔴 (pendiente) o 🟡 (implementada con una deuda conocida).

---

## EP-01 · Empezar a jugar

### US-001 · Jugar sin registrarme — Must
> Como visitante que llegó desde un link, quiero jugar sin crear una cuenta, para no abandonar en la primera pantalla.

**CA**
- **Dado** que entro a la landing **y** no tengo sesión, **cuando** toco "Crear mi startup", **entonces** llego al setup de partida sin pasar por ningún login.
- **Dado** que juego sin cuenta, **entonces** la partida se guarda en el navegador y el header muestra "💾 local".
- **Dado** que juego sin cuenta, **entonces** las pestañas del juego funcionan todas menos las que necesitan sesión, que explican qué falta en vez de romperse.

`src/app/page.tsx`, `src/hooks/useGame.ts`

### US-002 · Fundar mi startup — Must
> Como jugador nuevo, quiero elegir nombre, idea y sector, para que la partida se sienta mía desde el minuto cero.

**CA**
- **Dado** el setup, **entonces** veo nombre e idea ya sorteados y un dado 🎲 para volver a sortear cada uno.
- **Dado** que **no** escribí nada propio, **cuando** cambio de sector, **entonces** se re-sortean nombre e idea con el color de ese sector.
- **Dado** que escribí mi propio nombre o mi propia idea, **cuando** cambio de sector, **entonces** lo que escribí **no** se pisa.
- **Dado** el nombre vacío, **entonces** el botón "Empezar" está deshabilitado.
- **Dado** que dejo mi nombre de fundador vacío, **entonces** arranco como "Fundador/a".

`src/components/GameShell.tsx` (`Setup`), `engine.ts` (`randomIdea`, `randomStartupName`)

### US-003 · Entender qué hago sin leer un manual — Should
> Como jugador nuevo, quiero un tutorial cortito que me señale las cosas, para no tener que adivinar.

**CA**
- **Dado** que nunca vi el tutorial, **cuando** entro a una partida, **entonces** se abre solo a los 350 ms y **el juego queda pausado** mientras dura.
- **Dado** el tutorial abierto, **cuando** tildo "no mostrar más" y lo cierro, **entonces** no vuelve a abrirse solo en este navegador.
- **Dado** que lo cerré, **cuando** lo pido desde el menú ☰, **entonces** se abre igual.

`src/components/Tour.tsx`

### US-004 · Empezar de nuevo sin miedo — Must
> Como jugador, quiero poder tirar la partida y arrancar otra, pero que me avise antes.

**CA**
- **Cuando** elijo "Empezar de nuevo" en el menú, **entonces** aparece una confirmación que nombra la startup y los días que voy a perder.
- **Dado** que confirmo, **entonces** se borra el guardado y vuelvo al setup.
- **Dado** que la partida abandonada tenía día ≥ 10, **entonces** queda registrada en el historial como `abandoned`.

`GameShell.tsx`, `useGame.ts` (`reset`)

---

## EP-02 · El loop diario

### US-005 · Que el juego avance solo — Must
> Como jugador, quiero que el tiempo corra sin que yo haga clic, para administrar en vez de hacer clicker.

**CA**
- **Dado** un día en curso, **entonces** avanza cada 2.600 ms al principio y cada 1.500 ms a partir del día 60, interpolado.
- **Dado** que elijo 2x, **entonces** el día dura la mitad.
- **Dado** que elijo ⏸, **entonces** el día no avanza y el estado no cambia.

`src/lib/game/data.ts` (`dayMs`), `useGame.ts`

### US-006 · Ver de un vistazo cómo voy — Must
> Como jugador, quiero seis números arriba de todo, para decidir sin entrar a ninguna pestaña.

**CA**
- **Entonces** el header muestra siempre caja, usuarios, MRR, valuación, hype y moral, cada uno con su sub-dato (neto/mes, neto/día, ARPU, % tuyo, hype/día, personas).
- **Dado** que el neto es negativo, **entonces** el número se muestra en rojo.

`GameShell.tsx`, `src/components/ui.tsx`

### US-007 · Volver después de un rato y encontrar la empresa avanzada — Should
> Como jugador que cierra la pestaña, quiero que la startup haya seguido sin mí, para que valga la pena volver.

**CA**
- **Dado** que vuelvo después de un rato, **entonces** se simulan hasta **240 días** offline y aparece un cartel con cuántos días pasaron.
- **Dado** el progreso offline, **entonces** **no** se disparan eventos: los popups se juegan, no se acumulan.
- **Dado** que quedó un evento pendiente, **entonces** el tiempo offline se frena ahí.
- **Entonces** el log incluye una línea con el saldo de caja de esos días.

`engine.ts` (`applyOffline`)

### US-008 · No perder mi partida — Must
> Como jugador, quiero que se guarde solo, para no pensar en guardar.

**CA**
- **Entonces** el estado se guarda en el navegador cada 2 segundos si cambió.
- **Dado** que tengo sesión, **entonces** además se sube a la nube cada 12 segundos y al ocultar la pestaña.
- **Dado** que falla el guardado en la nube, **entonces** el estado queda marcado como sucio y se reintenta, sin perder nada local.
- **Dado** que entro con sesión y tengo una partida local más avanzada que la de la nube, **entonces** gana la local.

`useGame.ts`, `src/lib/storage.ts`

---

## EP-03 · Equipo

### US-009 · Activar agentes IA — Must
> Como fundador vibecoder, quiero activar agentes IA baratos, para shippear rápido aunque me deje deuda técnica.

**CA**
- **Entonces** siempre hay al menos un agente IA entre los 4 candidatos.
- **Dado** un agente IA activo, **entonces** aporta 1,6 veces los puntos de dev de su nivel **y** suma deuda técnica todos los días que se construye.
- **Dado** que tengo devs humanos, **entonces** la deuda que genera la IA se compensa según los puntos humanos.
- **Entonces** el botón dice "Activar" para IA y "Contratar" para humanos, y el sueldo se etiqueta "tokens/mes".

`engine.ts` (`derive`, `tick`), `data.ts` (`ROLES`)

### US-010 · Saber si me puedo permitir a alguien antes de contratarlo — Must
> Como jugador, quiero ver el impacto en mi runway antes de contratar, para no fundirme sin darme cuenta.

**CA**
- **Entonces** cada candidato muestra "te deja en N días de caja" o "te sigue quedando plata todos los meses".
- **Entonces** arriba de la lista se ve el runway actual, en rojo si es menor a 45 días.
- **Dado** que no me alcanza el fee o la oficina está llena, **entonces** el botón de contratar está deshabilitado.

`src/components/panels/TeamPanel.tsx`

> Este aviso es la única palanca medida que sube al jugador novato (de 1% a 10% de winrate en simulación). No se saca.

### US-011 · Echar gente cuando no llego a fin de mes — Must
> Como fundador en rojo, quiero recortar, aunque duela.

**CA**
- **Cuando** toco "Echar", **entonces** el botón pide confirmación (Sí / No) antes de ejecutar.
- **Dado** que echo a un humano, **entonces** la moral baja 6 puntos y el log lo registra como malo.
- **Dado** que cancelo un agente IA, **entonces** la moral no se toca.
- **Dado** el fundador, **entonces** no hay botón de echar.

`engine.ts` (`fire`), `TeamPanel.tsx`

### US-012 · Renovar los candidatos — Should
> Como jugador, quiero buscar otros candidatos si los que hay no me sirven.

**CA**
- **Entonces** los candidatos se renuevan solos cada 7 días.
- **Cuando** pago `$500 + $100 × empleados`, **entonces** se renuevan de inmediato.
- **Dado** que no me alcanza, **entonces** el botón está deshabilitado.

### US-013 · Levantar la moral — Could
> Como fundador, quiero hacer un asado para levantar al equipo.

**CA**
- **Cuando** pago $300 por persona, **entonces** la moral sube 12 puntos y queda registrado en el log.
- **Entonces** la moral multiplica la productividad de todo el equipo (0,5 a 1).

---

## EP-04 · Producto

### US-014 · Elegir qué construir — Must
> Como fundador, quiero decidir la próxima feature, para tener una estrategia.

**CA**
- **Entonces** veo lanzadas (✅), disponibles, y 3 próximas bloqueadas (🔒) con sus requisitos, más el contador "quedan N por descubrir".
- **Dado** que elijo una disponible, **entonces** pasa a "En desarrollo" con su barra de progreso, puntos y días estimados.
- **Dado** que cambio de feature a mitad de camino, **entonces** el progreso vuelve a cero.
- **Dado** que una feature está bloqueada, **entonces** el botón no responde y muestra qué requiere.

`src/components/panels/ProductPanel.tsx`, `engine.ts` (`setFeature`, `featureAvailable`)

### US-015 · Que el equipo nunca esté parado — Must
> Como jugador distraído, quiero que si no elijo nada el equipo agarre algo, para no perder días por olvido.

**CA**
- **Dado** que no hay feature en curso al empezar el día, **entonces** el motor toma la más barata disponible.
- **Dado** que pasan 3 días sin construir nada, **entonces** aparece un aviso en el dashboard que lleva a la pestaña Producto.

`engine.ts` (`tick`), `Dashboard.tsx`

### US-016 · Que el roadmap no se agote — Should
> Como jugador que llegó lejos, quiero seguir teniendo cosas para construir.

**CA**
- **Entonces** hay 68 features: 28 con nombre y una cola `v2..v41` que arranca después de "Plataforma abierta".
- **Entonces** cada versión de la cola cuesta 10% más que la anterior y rinde un poco menos.
- **Entonces** todas las features son alcanzables desde cero (validar dependencias antes de confiar en cualquier simulación).

> Regla del proyecto: la feature "Agente propio" tiene id `agente`, no `agent`. Un `requires` mal escrito dejó una vez toda la cola inalcanzable y arruinó varias mediciones.

### US-017 · Entender la deuda técnica — Should
> Como jugador, quiero ver que usar solo IA me está costando calidad.

**CA**
- **Entonces** el dashboard muestra calidad y deuda técnica con semáforo (verde/ámbar/rojo).
- **Dado** que la deuda pasa de 15, **entonces** puede dispararse el evento reactivo correspondiente.
- **Entonces** la deuda baja sola 5% por día y con puntos de QA.

---

## EP-05 · Plata

### US-018 · Ver a dónde se me va la plata — Must
> Como fundador, quiero el desglose mensual, para saber qué recortar.

**CA**
- **Entonces** la pestaña Plata muestra MRR, sueldos, alquiler, servidores y neto, todos mensualizados.
- **Dado** el neto negativo, **entonces** se ve un pill con los días de runway.

### US-019 · Levantar una ronda — Must
> Como fundador, quiero cambiar equity por plata cuando la valuación da.

**CA**
- **Entonces** veo una barra de progreso hacia la valuación mínima de la próxima ronda y cuánto entra por cuánto equity.
- **Dado** que la valuación alcanza el mínimo, **entonces** el botón se habilita **y** aparece un aviso en el dashboard.
- **Cuando** toco levantar, **entonces** aparece una confirmación antes de ceder equity.
- **Dado** que levanto, **entonces** entra la plata, baja el equity, sube la etapa, +20 de hype, se resetean los días en rojo y el board fija su meta si corresponde.

`src/components/panels/MoneyPanel.tsx`, `engine.ts` (`raiseRound`)

### US-020 · Salir a bolsa — Must
> Como fundador, quiero terminar la partida tocando la campana.

**CA**
- **Entonces** la barra hacia los $5.000M de valuación está visible **desde el día 1**, con o sin rondas levantadas.
- **Dado** que llego a la valuación, **entonces** el botón de IPO se habilita y hay una confirmación antes de terminar.
- **Dado** que hago IPO, **entonces** la partida termina como victoria, con confeti y el valor de mi parte.

> El botón antes solo aparecía en Serie C, así que el que jugaba sin diluirse jugaba a ciegas. La barra siempre visible es un requisito, no un detalle.

### US-021 · Mudarme de oficina — Must
> Como fundador que quiere crecer, quiero más lugares para contratar.

**CA**
- **Entonces** veo la próxima oficina con capacidad, alquiler y costo de mudanza.
- **Dado** que la oficina está llena y hay una siguiente, **entonces** aparece el aviso "La oficina está llena. Mudate para poder contratar".
- **Dado** que me mudo, **entonces** sube la capacidad y +10 de moral.

### US-022 · Correr campañas — Should
> Como fundador con caja, quiero convertirla en crecimiento en vez de mirarla acumularse.

**CA**
- **Entonces** solo veo las campañas cuyo mínimo de usuarios alcancé.
- **Dado** que corrí una campaña, **entonces** el botón muestra "en N días" hasta que termine el cooldown (8 / 30 / 55 días).
- **Dado** que pago una campaña grande, **entonces** entra el % de usuarios de una y el hype, con línea en el log.

`engine.ts` (`CAMPAIGNS`, `marketingPush`)

### US-023 · Sobrevivir al rojo — Must
> Como fundador fundido, quiero saber cuánto me queda antes de cerrar.

**CA**
- **Dado** el primer día con caja negativa, **entonces** el log avisa que tengo 12 días para arreglarlo y sugiere recortar o levantar.
- **Dado** el día 12 en rojo, **entonces** la partida termina por quiebra.
- **Dado** que la caja vuelve a positivo, **entonces** el contador se reinicia.

---

## EP-06 · El board

### US-024 · Rendirle cuentas al board — Must 🟡
> Como CEO que levantó Serie A, quiero saber qué me piden los inversores y qué pasa si no llego.

**CA**
- **Dado** que levanto una ronda desde Serie A, **entonces** el board fija una meta de **× 6 usuarios en 75 días** y la anuncia en el log.
- **Entonces** la pestaña Plata muestra la meta, cuántos usuarios y días faltan, y se pone roja cuando quedan ≤ 20 días.
- **Dado** que cumplo, **entonces** +12 de hype y se fija la meta siguiente.
- **Dado** que no cumplo, **entonces** la partida termina: te reemplazan como CEO.

🟡 **Deuda conocida (R-3):** el mensaje del motor dice "Dos metas seguidas sin cumplir", pero con `boardFailsToFire = 1` te echan a la **primera**. La rama de "ronda a la baja, perdés 5% de equity" es código muerto. Hay que corregir el copy o el parámetro, y decidir cuál.

`engine.ts` (`setBoardGoal`, `tick`), `tuning.ts`

---

## EP-07 · Eventos y decisiones

### US-025 · Que me pasen cosas — Must
> Como jugador, quiero que la partida me interrumpa con problemas, para que administrar tenga tensión.

**CA**
- **Dado** un evento, **entonces** el juego **se frena** y aparece un modal con título, texto y 2+ opciones, cada una con su consecuencia descrita.
- **Dado** que elijo, **entonces** el resultado se escribe en el log con el ícono del evento.
- **Entonces** no se repite un evento ya visto en esta partida.
- **Entonces** el primer evento no llega antes del día 12 y nunca hay dos a menos de 7 días.

### US-026 · Apostar con la probabilidad a la vista — Should
> Como jugador, quiero que las apuestas digan cuánto pagan, para que sea una decisión y no una trampa.

**CA**
- **Dado** una opción con azar, **entonces** el botón muestra "🎲 N% sale bien" antes de elegir.
- **Dado** que la apuesta sale mal, **entonces** la línea del log se marca como mala.
- **Dado** que el azar está apagado desde `/admin`, **entonces** las apuestas salen siempre bien (herramienta de testeo).

### US-027 · Que los eventos reaccionen a cómo juego — Should
> Como jugador, quiero que mis errores me vuelvan, para sentir que el juego me está mirando.

**CA**
- **Entonces** hay 12 eventos reactivos disparados por el estado: deuda > 15, moral < 52, 30 días sin shippear, crecer × 2,5 en 20 días, hype alto sostenido 20 días, equity < 50%, oficina llena 12 días, y 5 hitos de una sola vez.
- **Dado** que se disparó uno, **entonces** tiene cooldown antes de poder repetirse.
- **Dado** que llegué al tope de 25 popups, **entonces** los de calendario se apagan pero los reactivos siguen, con el doble de separación.

### US-028 · Que el sector se note — Should
> Como jugador, quiero un evento que solo pueda pasarme por el sector que elegí.

**CA**
- **Entonces** cada uno de los 6 sectores tiene un evento exclusivo (`sec_google`, `sec_fraude`, `sec_api`, `sec_vendedor`, `sec_exchange`, `sec_proveedor`).
- **Dado** que juego otro sector, **entonces** ese evento nunca entra en el pool.

### US-029 · Que me ofrezcan comprarme — Should 🟡
> Como fundador grande, quiero poder cobrar hoy en vez de ir por la salida grande.

**CA**
- **Dado** el día ≥ 150 y ≥ `acquireMinUsers` usuarios, **entonces** puede aparecer la oferta de adquisición.
- **Dado** que acepto, **entonces** la partida termina como victoria (`acquired`).
- **Dado** que rechazo, **entonces** pierdo el 25% de mis usuarios (compran a un competidor).

🟡 **Deuda conocida (R-1):** con `acquireMinUsers = 120.000` el evento **no se disparó ni una vez** en producción (0% de adquisiciones sobre 910 partidas). El final existe en el código y no en el juego.

---

## EP-08 · Final, carrera y compartir

### US-030 · Que ganar se sienta — Must
> Como jugador que ganó, quiero una pantalla que lo festeje.

**CA**
- **Dado** que gano (IPO o adquisición), **entonces** hay confeti, el modal se centra, y veo cuánto vale mi parte, días, pico de usuarios y features.
- **Dado** que pierdo, **entonces** veo el motivo con su ícono (💀 quiebra / 🪑 board) y el dato de que la próxima arranco con más caja.

### US-031 · Compartir cómo me fue — Should
> Como jugador, quiero postear mi resultado en X con una imagen linda.

**CA**
- **Cuando** toco "𝕏 Compartir", **entonces** se asegura primero que la partida esté guardada, y recién ahí se abre el intent con texto + link a `/p/<game_id>`.
- **Entonces** `/p/<game_id>` es pública y genera su propia imagen Open Graph con el resultado.
- **Cuando** toco "🔗 Copiar link", **entonces** el botón confirma "¡Copiado!" y, si el portapapeles falla, abre el link.

> X no permite adjuntar una imagen desde un intent: la toma de la tarjeta OG del link. Por eso cada partida necesita su propia página.

### US-032 · Reclamar mi partida entrando con Google — Must
> Como jugador sin cuenta que acaba de terminar una buena partida, quiero que quede en mi historial.

**CA**
- **Dado** que termino sin sesión, **entonces** la partida **no** se manda como anónima de inmediato: queda esperando en el navegador.
- **Dado** que entro con Google desde ese cartel, **entonces** la partida se guarda a mi nombre.
- **Dado** que cierro la pestaña sin entrar, **entonces** se manda anónima (cuenta para estadística, no para rankings).
- **Entonces** la misma partida nunca se guarda dos veces (flag en el estado + `game_id` con índice único).

`useGame.ts`, `storage.ts` (`guardarRunPendiente`, `asegurarRunGuardada`, `saveRun`)

### US-033 · Ver mi carrera — Should
> Como jugador que volvió, quiero ver todo lo que jugué y qué me falta.

**CA**
- **Entonces** `/home` muestra perfil, resumen de carrera, 33 logros agrupados, historial de partidas y 3 rankings.
- **Entonces** los logros se **calculan** desde `runs`, no se guardan: un logro nuevo es retroactivo para todos sin migración.
- **Dado** que entro sin sesión, **entonces** igual veo los rankings (la página hace de ranking público).

`src/app/home/page.tsx`, `src/lib/logros.ts`

### US-034 · Competir en el ranking — Should
> Como jugador competitivo, quiero comparar mi mejor partida con la de los demás.

**CA**
- **Entonces** hay tres rankings: **en vivo** (partidas en curso, desde `startups`), **semana** y **salón de la fama** (desde `runs`).
- **Dado** que jugué sin sesión, **entonces** mi partida cuenta para las estadísticas pero no aparece con nombre.

---

## EP-09 · Social (requiere sesión)

### US-035 · Visitar la startup de otro — Could
> Como jugador, quiero espiar la empresa de otro y meterme.

**CA**
- **Dado** que abro una startup del ranking, **entonces** veo su estado, su equipo y su perfil con redes.
- **Cuando** le doy hype, **entonces** es gratis y solo una vez por día por startup.
- **Cuando** invierto, **entonces** se descuenta de mi caja, me quedo con una fracción y cobro dividendos de su MRR mientras juego.
- **Cuando** robo talento, **entonces** pago el costo, necesito lugar en mi oficina, y el otro cobra indemnización.
- **Dado** que soy el destinatario, **entonces** la acción me llega en vivo (Realtime) o al volver a entrar, y se aplica una sola vez.

`src/components/panels/SocialPanel.tsx`, `engine.ts` (`applyIncoming`), `storage.ts`

### US-036 · Muro de fundadores — Could
> Como jugador, quiero postear y ver qué postean los demás.

**CA**
- **Entonces** puedo postear texto y dar like, con actualización en tiempo real.
- **Dado** que cierro una ronda, **entonces** se postea el hito automáticamente.

### US-037 · Mi perfil con mis redes — Could
> Como jugador, quiero que me encuentren en X o LinkedIn desde el ranking.

**CA**
- **Entonces** puedo cargar mis handles desde `/home` y se muestran junto a mi nombre en los rankings y en las visitas.
- **Entonces** los handles se limpian (acepta URL completa o `@handle`).

---

## EP-10 · Instrumentación

### US-038 · Mandar feedback desde adentro — Should
> Como jugador con una queja, quiero decirla sin salir del juego.

**CA**
- **Entonces** el botón está en el menú ☰ y en la pantalla de final.
- **Entonces** puedo mandar nota de 1 a 5 🤖, texto (3 a 1000 caracteres) o ambos; con los dos vacíos el botón no envía.
- **Dado** que ya mandé hace menos de 5 minutos, **entonces** el envío se bloquea.
- **Entonces** cada mensaje viaja con el contexto de la partida (día, final, sector, usuarios, MRR, caja, features, empleados, ronda, oficina, popups, partidas, nombre).

`src/components/FeedbackModal.tsx`, `supabase/feedback.sql`

### US-039 · Ver cómo está saliendo el juego — Must (para el creador)
> Como creador, quiero ver los datos reales antes de tocar el balance.

**CA**
- **Entonces** `/admin` arranca mostrando las métricas **globales** desde `runs`, y lo local queda abajo, etiquetado.
- **Entonces** veo duración, finales, sectores, popups por partida, decisiones más tomadas, catálogo de eventos y feedback.
- **Entonces** cualquier conteo sobre `runs` usa `count=exact` o las vistas de resumen (PostgREST devuelve máximo 1000 filas sin avisar).

`src/app/admin/page.tsx`, `supabase/runs-stats.sql`

### US-040 · Tunear el ritmo en vivo — Should (para el creador)
> Como creador, quiero probar cambios de dificultad sin deployar.

**CA**
- **Entonces** los drivers de `tuning` se editan desde `/admin` y quedan guardados por navegador.
- **Entonces** hay un botón para restaurar los valores por defecto.
- **Entonces** los mismos valores los leen los scripts de simulación de `scripts/`.

---

## Historias pendientes 🔴

### US-041 · Que la adquisición vuelva a ser un final posible — Alta
> Como jugador grande, quiero que alguna vez me ofrezcan comprarme.

**CA**
- **Dado** un umbral de usuarios calibrado con datos reales, **entonces** entre el 5% y el 15% de las partidas avanzadas recibe la oferta.
- **Entonces** rechazarla sigue costando el 25% de los usuarios (la decisión tiene que doler).

### US-042 · Que Dev tools no sea una trampa — Media
> Como jugador que eligió Dev tools, quiero tener chances parecidas al resto.

**CA**
- **Entonces** el winrate real de Dev tools queda por encima del 15%.
- **Entonces** el spread entre el mejor y el peor sector es menor a 20 puntos.
- **Entonces** el ajuste no usa palancas económicas globales, que ya se midieron y suben a todos los perfiles por igual.

### US-043 · Que el board diga la verdad — Alta
> Como CEO, quiero que la advertencia del board coincida con lo que pasa.

**CA**
- **Entonces** el texto del motor, el de la pestaña Plata y el parámetro `boardFailsToFire` dicen lo mismo.
- **Entonces** no queda código muerto de la rama de "segunda chance".

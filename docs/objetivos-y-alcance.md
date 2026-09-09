# OA — Objetivos y alcance

> "OA" acá es **Objetivos y Alcance**: qué persigue el producto, con qué métrica se sabe si lo logró, y hasta dónde llega. Si lo que hacía falta eran OKRs trimestrales, la sección §2 ya está armada como objetivo + resultados clave y se puede fechar sin reescribirla.

**Versión:** 1.0 · 2026-09-09 · contra el commit `2c951e4`

---

## 1. Objetivo general

Que alguien que llega desde un link, en el celular, entienda el juego en menos de un minuto, termine una partida en menos de veinte y tenga ganas de compartir cómo le fue.

Todo lo demás (social, rankings, carrera) existe para sostener eso, no al revés.

## 2. Objetivos con su métrica

### OA-1 · El loop se entiende sin tutorial
Un jugador nuevo llega al día 30 sin abrir el tutorial y sin quedarse trabado.

- **KR 1.1** El tutorial es opcional y se puede cerrar para siempre.
- **KR 1.2** Los tres avisos de pantalla (equipo parado 3 días, ronda disponible, oficina llena) aparecen cuando corresponde y llevan a la pestaña que resuelve el problema.
- **KR 1.3** Menos del 10% de las partidas termina antes del día 10.
- **Estado:** cumplido en implementación. Los avisos subieron al perfil novato del simulador de 1% a 10% de winrate.

### OA-2 · La partida dura lo que tiene que durar
Una partida ganada entre **15 y 22 minutos**, contando el tiempo de decidir los popups (~20 s cada uno).

- **KR 2.1** El día arranca en 2.600 ms y baja a 1.500 ms hacia el día 60.
- **KR 2.2** Máximo 25 popups de calendario por partida.
- **KR 2.3** Menos del 1% de las partidas pasa de 20 minutos de reloj de juego.
- **Estado:** cumplido. Calibrado contra una partida real de 22 min; el modelo fallaba por no contar el tiempo de los popups.

### OA-3 · Ganar cuesta, perder tiene variedad
El juego no se regala después del día 150 y ningún final se come a los demás.

- **KR 3.1** Winrate global entre 25% y 40%.
- **KR 3.2** Ningún final supera el 50% de las partidas.
- **KR 3.3** Los cuatro finales (IPO, adquisición, quiebra, board) ocurren de verdad en producción.
- **Estado:** parcial. Winrate real 30% ✅, quiebra 47% ✅, board 21% ✅, **adquisición 0% ❌** (umbral de 120.000 usuarios inalcanzable en la práctica).

### OA-4 · Ningún sector es una trampa
Elegir sector es una decisión de estilo, no de dificultad.

- **KR 4.1** Ningún sector por debajo del 15% de winrate.
- **KR 4.2** Spread entre el mejor y el peor sector menor a 20 puntos.
- **Estado:** incumplido. Real: ai 40 · fintech 38 · crypto 28 · saas 25 · delivery 24 · **devtools 8**.

### OA-5 · Se puede jugar sin registrarse, y registrarse suma
La fricción de entrada es cero, pero la cuenta tiene un valor claro.

- **KR 5.1** `/play` entra directo, sin login.
- **KR 5.2** Una partida jugada sin cuenta se puede reclamar entrando con Google desde la pantalla de final.
- **KR 5.3** La cuenta agrega: historial, 33 logros de carrera retroactivos, rankings con nombre, muro y visitas.
- **Estado:** cumplido.

### OA-6 · Cada partida terminada es contenido compartible
El resultado se comparte con una imagen, no con un texto pelado.

- **KR 6.1** Página pública `/p/<game_id>` por partida con imagen Open Graph generada.
- **KR 6.2** Botones de compartir en X y copiar link en la pantalla de final.
- **KR 6.3** Si el jugador no tiene sesión, la partida se sube antes de dar el link (no se comparte un link vacío).
- **Estado:** cumplido.

### OA-7 · Las decisiones de balance se toman con datos
Ni intuición ni simulador cuando hay producción.

- **KR 7.1** Toda partida terminada queda en `runs` con su resumen.
- **KR 7.2** `/admin` muestra las métricas globales, no solo las del navegador.
- **KR 7.3** El feedback de jugadores llega con el contexto de la partida adjunto.
- **Estado:** cumplido.

### OA-8 · El producto se mantiene simple
El costo de agregar algo es que hay que sacar otra cosa.

- **KR 8.1** Cinco pestañas. Ninguna más.
- **KR 8.2** Contenido nuevo entra como eventos o features dentro de las pantallas existentes, no como sistemas.
- **KR 8.3** Los sistemas revertidos siguen en `v2-experimentos` y no vuelven sin pedido explícito.
- **Estado:** cumplido y **vinculante**.

## 3. Alcance

### 3.1 Dentro del alcance — entregado

| Release | Contenido |
| --- | --- |
| **v1.0** (2026-09-03) | Loop completo: setup, equipo, roadmap, plata, rondas, IPO, oficina, eventos que pausan, 14 logros de partida, modo local y modo nube, social, tutorial con spotlight, imagen de preview, dominio propio |
| **v1.1** (2026-09-04) | Roadmap infinito (68 features), campañas, board, ideas y nombres por sector, historial `runs`, 33 logros de carrera, `/home` con perfil y 3 rankings, feedback in-game, `/admin` con drivers editables |
| **v1.2** (2026-09-05/06) | Métricas globales en `/admin`, dedupe de partidas, perfil con redes, botón 🏆 visible en todas las pantallas, compartir en X con imagen por partida, vista de la oficina en grilla, confirmación de acciones irreversibles |

### 3.2 Dentro del alcance — pendiente

| # | Qué | Por qué | Prioridad |
| --- | --- | --- | --- |
| P-1 | Bajar `acquireMinUsers` a un valor alcanzable | Recuperar un final entero (OA-3) | Alta |
| P-2 | Corregir el copy del board ("dos metas" vs. te echan a la primera) | El jugador siente que lo estafaron | Alta |
| P-3 | Emparejar Dev tools | OA-4 | Media |
| P-4 | Probar el modo nube e2e con dos cuentas | Funcionalidad grande sin evidencia | Media |
| P-5 | Actualizar el README de la raíz | Está desfasado del juego real | Baja |

### 3.3 Fuera del alcance — decidido, no pendiente

**Sistemas revertidos el 2026-09-03** (viven en `v2-experimentos`, no vuelven sin pedido explícito): pestaña Hype con ads/sponsors, C-level, crunch y burnout, renuncias, préstamos, vender la empresa como acción del menú, bandeja de decisiones, revelado progresivo de la UI, modo Argentina.

**Nunca estuvo en alcance:** multijugador en tiempo real, monetización o compras, app nativa, traducción a otros idiomas, campaña o modo historia, editor de escenarios.

## 4. Supuestos y restricciones

- **Supuesto.** El tráfico llega en picos desde X, en celular. Todo se prueba primero en mobile.
- **Supuesto.** El jugador típico juega 1-3 partidas y no vuelve; la carrera es para la minoría que vuelve.
- **Restricción.** Infra en plan free (Vercel + Supabase): el motor corre en el cliente, la base guarda resúmenes.
- **Restricción.** Sin backend propio para el juego: cualquier feature que necesite servidor autoritativo (multijugador real, anti-trampa) está fuera.
- **Restricción.** Un solo desarrollador. Cambios de a uno, chicos y validados.

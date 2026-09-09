# Documentación de producto — Vibe Coding Game

Documentación funcional del juego (https://vibecodingame.com). Está escrita **contra el código que hay hoy en `main`**, no contra lo que nos gustaría que hubiera: cada requisito, criterio y regla apunta al archivo donde vive.

| Documento | Qué contesta |
| --- | --- |
| [`prd.md`](prd.md) | Qué es el producto, para quién, qué hace y qué no. Requisitos funcionales (RF) y no funcionales (RNF). |
| [`objetivos-y-alcance.md`](objetivos-y-alcance.md) | **OA**: objetivos del producto con su métrica, y el alcance in/out por release. |
| [`user-stories.md`](user-stories.md) | Épicas (EP) e historias de usuario (US) con sus criterios de aceptación en formato Dado/Cuando/Entonces. |
| [`casos-de-uso.md`](casos-de-uso.md) | Casos de uso (UC) con actores, flujo principal, alternos, excepciones y reglas de negocio. |
| [`criterios-de-aceptacion.md`](criterios-de-aceptacion.md) | **CA transversales**: ritmo, balance, persistencia, seguridad, accesibilidad. Definition of Done y matriz de trazabilidad. |

## Convención de IDs

```
OA-n     objetivo de producto            OA-3
RF-nn    requisito funcional             RF-14
RNF-nn   requisito no funcional          RNF-05
EP-nn    épica                           EP-04
US-nnn   historia de usuario             US-041
UC-nn    caso de uso                     UC-06
CA-nn    criterio de aceptación global   CA-07
```

La trazabilidad va en una sola dirección: **OA → RF → US → UC**, y los CA transversales cruzan todo. La matriz está al final de [`criterios-de-aceptacion.md`](criterios-de-aceptacion.md).

## Cómo mantener esto

- Un cambio de mecánica toca el PRD (RF) **y** la historia correspondiente. Si no toca ninguna, probablemente sea un cambio que no debería estar.
- Los números de balance (`src/lib/game/tuning.ts`) son un **contrato medible**, no decoración: están en CA-08 a CA-12 y se verifican con los scripts de `scripts/`.
- Antes de sumar un sistema nuevo, leer "Fuera de alcance" en [`objetivos-y-alcance.md`](objetivos-y-alcance.md). Ya se probó una vez y se revirtió.

Última revisión contra el código: **2026-09-09** (commit `2c951e4`).

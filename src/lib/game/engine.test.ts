/**
 * Invariantes del motor. No prueban la interfaz: prueban las reglas que un test
 * de navegador no puede alcanzar porque tardarían cientos de días de juego.
 *
 * Cada uno corresponde a un bug que efectivamente existió en producción.
 */
import { describe, expect, it } from "vitest";
import * as engine from "./engine";
import { derive, factorVentana, newGame, pisoHype, setBoardGoal, tick } from "./engine";
import { OFFICES, SECTORS } from "./data";
import { tuning } from "./tuning";
import { num } from "./format";
import type { GameState } from "./types";

/** Una partida arrancada como corresponde, con el sector que se pide. */
function partida(sector = "saas"): GameState {
  return newGame({ startupName: "Test SA", founderName: "Bot", sector, idea: "una idea" });
}

describe("num", () => {
  it("conserva el signo arriba de mil", () => {
    // El header decía "+4.1k/día" mientras la empresa perdía 4.100 usuarios
    // por día: num() usaba Math.abs en todas las ramas y nunca lo reponía.
    expect(num(-4100)).toBe("-4.1k");
    expect(num(-45000)).toBe("-45k");
    expect(num(-2_300_000)).toBe("-2.3M");
    expect(num(-12)).toBe("-12");
  });

  it("agrega el + solo cuando se lo piden", () => {
    expect(num(4100)).toBe("4.1k");
    expect(num(4100, { sign: true })).toBe("+4.1k");
    expect(num(-4100, { sign: true })).toBe("-4.1k");
    expect(num(0, { sign: true })).toBe("+0");
  });
});

describe("el invierno", () => {
  it("se recupera en vez de quedarse en el piso para siempre", () => {
    // Era monótona: bajaba a 0,35 y no volvía nunca. Eso convertía un susto en
    // un impuesto permanente sobre el que jugaba lento.
    const s = partida();
    s.conInvierno = true;
    s.inviernoDia = 300;
    const en = (dia: number) => {
      s.day = dia;
      return factorVentana(s);
    };

    expect(en(300)).toBeCloseTo(1, 5);
    expect(en(300 + tuning.inviernoDias / 2)).toBeLessThan(1);
    expect(en(300 + tuning.inviernoDias)).toBeCloseTo(tuning.inviernoPiso, 5);

    const finDelFondo = 300 + tuning.inviernoDias + tuning.inviernoFondo;
    expect(en(finDelFondo)).toBeCloseTo(tuning.inviernoPiso, 5);
    expect(en(finDelFondo + tuning.inviernoSalida)).toBeCloseTo(1, 5);
    expect(en(finDelFondo + tuning.inviernoSalida + 5000)).toBeCloseTo(1, 5);
  });

  it("no toca a las partidas donde no cayó", () => {
    const s = partida();
    s.inviernoDia = 0;
    s.day = 4000;
    expect(factorVentana(s)).toBe(1);
  });
});

describe("el tope de duración", () => {
  it("ninguna partida pasa del último día", () => {
    const s = partida();
    s.day = tuning.diaFinal - 2;
    for (let i = 0; i < 50 && !s.gameOver; i++) tick(s, true);
    expect(s.gameOver).toBe("timeout");
    expect(s.day).toBeLessThanOrEqual(tuning.diaFinal);
  });

  it("avisa antes de que se termine", () => {
    const s = partida();
    expect(tuning.diaAviso).toBeLessThan(tuning.diaFinal);
    s.day = tuning.diaAviso;
    expect(engine.diasQueQuedan(s)).toBe(tuning.diaFinal - tuning.diaAviso);
  });
});

describe("la meta del board", () => {
  it("nunca pide más usuarios de los que hay en el mercado", () => {
    // Pedía usuarios x 4,5 sin mirar el techo: pasando el 22% del mercado la
    // meta era inalcanzable, y te echa al primer fallo.
    for (const sector of SECTORS) {
      const techo = sector.tam * tuning.tamMul;
      for (const fraccion of [0.01, 0.1, 0.22, 0.4, 0.6, 0.8, 0.89]) {
        const s = partida(sector.id);
        s.stage = tuning.boardFromStage;
        s.users = techo * fraccion;
        setBoardGoal(s);
        if (!s.boardGoal) continue;
        expect(s.boardGoal.users, `${sector.id} al ${fraccion * 100}% del mercado`).toBeLessThanOrEqual(techo);
      }
    }
  });

  it("deja de pedir crecimiento con el mercado tomado", () => {
    // Arriba del 90% el churn se come la adquisición: pedir crecimiento ahí es
    // pedir algo que el motor no puede dar.
    const sector = SECTORS.find((x) => x.id === "devtools")!;
    const s = partida("devtools");
    s.stage = tuning.boardFromStage;
    s.users = sector.tam * tuning.tamMul * 0.95;
    setBoardGoal(s);
    expect(s.boardGoal).toBeNull();
  });

  it("no pone metas antes de la ronda que las habilita", () => {
    const s = partida();
    s.stage = tuning.boardFromStage - 1;
    s.users = 5000;
    setBoardGoal(s);
    expect(s.boardGoal).toBeNull();
  });
});

describe("el equity", () => {
  it("nunca baja de 1%", () => {
    // Varios eventos hacen s.equity -= N sin piso; en una partida larga se
    // acumulaban y se terminaba con -35% de la propia empresa.
    const s = partida();
    s.equity = -35;
    tick(s, true);
    expect(s.equity).toBeGreaterThanOrEqual(1);
  });
});

describe("el tiempo fuera del juego", () => {
  it("mirar cuánto estuviste afuera no adelanta la partida", () => {
    const s = partida();
    s.day = 120;
    s.lastTickAt = Date.now() - 6 * 3600_000;
    const afuera = engine.tiempoAfuera(s);
    expect(afuera).toBeGreaterThan(5 * 3600_000);
    expect(s.day).toBe(120);
  });

  it("no queda ninguna función que simule días por reloj", () => {
    // applyOffline simulaba hasta 240 días al volver: dos minutos de ausencia
    // podían fundir una partida sin que el jugador tocara nada.
    expect("applyOffline" in engine).toBe(false);
  });
});

describe("newGame", () => {
  it("respeta el sector que se le pide", () => {
    // Llamarlo con argumentos posicionales dejaba sector undefined y derive()
    // caía a SECTORS[1] en silencio: las simulaciones medían todas fintech.
    for (const sector of SECTORS) {
      expect(partida(sector.id).sector).toBe(sector.id);
    }
  });
});

describe("el piso del hype", () => {
  it("sube con la oficina y nunca pasa el techo", () => {
    for (let office = 0; office < OFFICES.length; office++) {
      const piso = pisoHype({ office } as GameState);
      expect(piso).toBeGreaterThanOrEqual(0);
      expect(piso).toBeLessThan(100);
    }
    expect(pisoHype({ office: 0 } as GameState)).toBe(0);
    expect(pisoHype({ office: 5 } as GameState)).toBeGreaterThan(pisoHype({ office: 0 } as GameState));
  });

  it("el hype no se va abajo del piso ni arriba de 100", () => {
    const s = partida();
    s.office = 5;
    s.hype = 100;
    for (let i = 0; i < 200 && !s.gameOver; i++) tick(s, true);
    expect(s.hype).toBeLessThanOrEqual(100);
    expect(s.hype).toBeGreaterThanOrEqual(pisoHype(s));
  });
});

describe("la valuación", () => {
  it("nunca es negativa, ni con la caja en rojo", () => {
    const s = partida();
    s.cash = -500_000;
    s.users = 1000;
    expect(derive(s).valuation).toBeGreaterThanOrEqual(0);
  });
});

/**
 * Escenas de mudanza. Las dos grandes marcan el cambio de acto; el resto es un
 * cartel chico. Nunca explican reglas: solo clima. Lo que cambió se descubre
 * jugando.
 */
export interface Escena {
  oficina: number; // índice de la oficina a la que te mudás
  grande: boolean;
  titulo: string;
  cuerpo?: (dia: number) => string;
}

export const ESCENAS: Escena[] = [
  {
    oficina: 1,
    grande: false,
    titulo: "Ocho escritorios y café de máquina",
  },
  {
    oficina: 2,
    grande: true,
    titulo: "Tu primera oficina",
    cuerpo: (dia) =>
      `Tardaste ${dia} días en dejar de compartir escritorio con desconocidos.\nPoné el logo en la pared antes de que se te pase la emoción.`,
  },
  {
    oficina: 3,
    grande: false,
    titulo: "Ladrillo a la vista y plantas que no riega nadie",
  },
  {
    oficina: 4,
    grande: true,
    titulo: "Felicitaciones, sos una corporación",
    cuerpo: () =>
      "Entró gente este mes con la que todavía no hablaste.\nAlguien contrató a alguien sin preguntarte. Y estuvo bien.",
  },
  {
    oficina: 5,
    grande: false,
    titulo: "Tenés recepción. Alguien va a preguntar por vos abajo",
  },
];

export const escenaDe = (oficina: number) => ESCENAS.find((e) => e.oficina === oficina);

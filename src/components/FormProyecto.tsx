"use client";
import { useState } from "react";
import { Btn } from "@/components/ui";
import { CATEGORIAS } from "@/lib/perfil";

export type DatosProyecto = { nombre: string; url: string; descripcion: string; categoria: string };

// Sin categoría elegida a propósito: si "Otros" viene marcado de entrada, casi
// nadie la cambia y las categorías dejan de servir para filtrar. Si igual no
// eligen, el guardado la manda a "otros".
export const PROYECTO_VACIO: DatosProyecto = { nombre: "", url: "", descripcion: "", categoria: "" };

/**
 * El formulario del proyecto. Vive acá y no en cada pantalla porque se usa en
 * dos lugares (Mi perfil y el cartel que salta al entrar), y dos copias del
 * mismo formulario terminan pidiendo cosas distintas.
 */
export function FormProyecto({
  inicial = PROYECTO_VACIO,
  guardando,
  onGuardar,
  onCancelar,
  textoGuardar = "Guardar",
  textoCancelar = "Cancelar",
}: {
  inicial?: DatosProyecto;
  guardando: boolean;
  onGuardar: (d: DatosProyecto) => void;
  onCancelar?: () => void;
  textoGuardar?: string;
  textoCancelar?: string;
}) {
  const [d, setD] = useState<DatosProyecto>(inicial);
  const campo = "mt-1 w-full rounded-xl border-2 border-ink/20 bg-white px-3 py-2 text-sm font-bold normal-case outline-none focus:border-indigo";

  return (
    <div>
      <label className="mb-2 block text-[11px] font-bold uppercase text-ink/50">
        Nombre del proyecto
        <input
          autoFocus
          value={d.nombre}
          onChange={(e) => setD({ ...d, nombre: e.target.value })}
          maxLength={40}
          placeholder="Cuida el Mango"
          className={campo}
        />
      </label>
      <label className="mb-2 block text-[11px] font-bold uppercase text-ink/50">
        Link
        <input
          value={d.url}
          onChange={(e) => setD({ ...d, url: e.target.value })}
          maxLength={200}
          placeholder="cuidaelmango.com"
          className={campo}
        />
      </label>
      <label className="mb-2 block text-[11px] font-bold uppercase text-ink/50">
        En una línea
        <input
          value={d.descripcion}
          onChange={(e) => setD({ ...d, descripcion: e.target.value })}
          maxLength={140}
          placeholder="Todas las promos bancarias de Argentina en un lugar"
          className={campo}
        />
      </label>
      <div className="mb-3">
        <span className="mb-1 block text-[11px] font-bold uppercase text-ink/50">Categoría</span>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIAS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setD({ ...d, categoria: c.id })}
              className={`rounded-full border-2 px-2.5 py-1 text-[11px] font-black transition ${
                d.categoria === c.id
                  ? "border-ink bg-ink text-cream"
                  : "border-ink/15 bg-white text-ink/60 hover:border-ink/40"
              }`}
            >
              {c.icono} {c.nombre}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Btn className="flex-1" disabled={guardando || !d.nombre.trim()} onClick={() => onGuardar(d)}>
          {guardando ? "Guardando…" : textoGuardar}
        </Btn>
        {onCancelar && (
          <Btn variant="ghost" onClick={onCancelar}>
            {textoCancelar}
          </Btn>
        )}
      </div>
    </div>
  );
}

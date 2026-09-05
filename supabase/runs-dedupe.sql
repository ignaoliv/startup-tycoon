-- Una partida terminada se estaba guardando varias veces: el guard vivía en un
-- useRef, que se reinicia en cada carga de la página, y una partida terminada
-- sigue estando terminada al recargar. Ahora la fila lleva el id de la partida
-- y un índice único lo corta del lado del servidor, pase lo que pase en el cliente.

alter table public.runs add column if not exists game_id text;

-- limpieza de los duplicados que ya entraron: se queda la primera de cada grupo
delete from public.runs r
using public.runs otra
where r.id > otra.id
  and r.name = otra.name
  and r.sector = otra.sector
  and r.ended_as = otra.ended_as
  and r.day = otra.day
  and r.valuation = otra.valuation
  and coalesce(r.anon_id, '') = coalesce(otra.anon_id, '')
  and coalesce(r.user_id::text, '') = coalesce(otra.user_id::text, '');

-- las filas viejas quedan con game_id null y no chocan entre sí
create unique index if not exists runs_game_id_idx on public.runs (game_id);

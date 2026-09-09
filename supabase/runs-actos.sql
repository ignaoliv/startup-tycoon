-- Para poder medir en qué acto termina cada partida y si le tocó el invierno.
-- El acto se deduce de la oficina más grande a la que llegó: 0-1 acto I,
-- 2-3 acto II, 4-5 acto III.

alter table public.runs add column if not exists office_max int;
alter table public.runs add column if not exists precio numeric;
alter table public.runs add column if not exists invierno boolean default false;

-- Métricas por acto, para el panel. Cuenta del lado de la base porque
-- PostgREST devuelve como máximo 1000 filas.
create or replace view public.runs_por_acto
with (security_invoker = on) as
  select
    case
      when office_max is null then 'sin dato'
      when office_max <= 1 then 'I · garage y coworking'
      when office_max <= 3 then 'II · oficina y loft'
      else 'III · campus y torre'
    end                                                          as acto,
    count(*)::int                                                as partidas,
    count(*) filter (where ended_as in ('ipo', 'acquired'))::int as ganadas,
    round(avg(day))::int                                         as dias_prom,
    round(avg(team_size))::int                                   as equipo_prom,
    round(avg(precio), 2)::float                                 as precio_prom,
    count(*) filter (where invierno)::int                        as con_invierno
  from public.runs
  group by 1;

-- Cuándo se bajan, para ver si el invierno mueve la salida.
create or replace view public.runs_salidas
with (security_invoker = on) as
  select
    invierno,
    count(*)::int                                                          as partidas,
    round(percentile_cont(0.25) within group (order by day))::int          as dia_p25,
    round(percentile_cont(0.5)  within group (order by day))::int          as dia_mediana,
    round(percentile_cont(0.75) within group (order by day))::int          as dia_p75
  from public.runs
  where ended_as = 'ipo'
  group by 1;

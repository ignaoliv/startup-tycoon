-- PostgREST devuelve como máximo 1000 filas, así que el panel no puede contar
-- trayéndose las partidas: con más de 1000 mostraría 1000 para siempre. Las
-- cuentas se hacen acá y el panel lee un puñado de filas.

create or replace view public.runs_resumen
with (security_invoker = on) as
  select
    count(*)::int                                                          as partidas,
    count(*) filter (where ended_as in ('ipo', 'acquired'))::int           as ganadas,
    count(distinct coalesce(user_id::text, anon_id))::int                  as jugadores,
    count(*) filter (where user_id is not null)::int                       as con_cuenta,
    round(avg(day))::int                                                   as dias_prom,
    round(avg(features), 1)::float                                         as features_prom,
    count(*) filter (where ended_as = 'ipo')::int                          as ipo,
    count(*) filter (where ended_as = 'acquired')::int                     as acquired,
    count(*) filter (where ended_as = 'bankrupt')::int                     as bankrupt,
    count(*) filter (where ended_as = 'fired')::int                        as fired,
    count(*) filter (where ended_as = 'abandoned')::int                    as abandoned,
    count(*) filter (where created_at > now() - interval '24 hours')::int  as ultimas_24h
  from public.runs;

create or replace view public.runs_por_sector
with (security_invoker = on) as
  select
    sector,
    count(*)::int                                                as partidas,
    count(*) filter (where ended_as in ('ipo', 'acquired'))::int as ganadas,
    round(avg(day))::int                                         as dias_prom
  from public.runs
  group by sector;

-- Limpieza de duplicados. Es re-ejecutable: mientras haya gente con el JS viejo
-- en caché van a seguir entrando filas sin game_id que duplican a las nuevas.
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

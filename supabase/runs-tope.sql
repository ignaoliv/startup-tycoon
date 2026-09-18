-- Tope de duración de partida + arreglo de la medición del invierno.
-- Es re-ejecutable: se puede correr dos veces sin romper nada.
--
-- 1. `timeout` es un final nuevo: la partida llegó al último día sin salir a
--    bolsa. No es quiebra ni es que te echaron, así que va aparte. Sin esto,
--    esas partidas las rechaza el check y se pierden en silencio.
-- 2. La columna `invierno` venía guardando `conInvierno`, que es true en toda
--    partida del motor nuevo. O sea que no medía nada. Ahora guarda si el
--    invierno cayó de verdad, y `invierno_dia` el día en que cayó.

-- El check de ended_as es anónimo (se declaró inline al crear la tabla), así
-- que se busca por definición en vez de adivinarle el nombre.
do $$
declare c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.runs'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%ended_as%'
  loop
    execute format('alter table public.runs drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.runs add constraint runs_ended_as_check
  check (ended_as in ('ipo', 'acquired', 'bankrupt', 'fired', 'abandoned', 'timeout'));

alter table public.runs add column if not exists invierno_dia int;

-- Las filas viejas tienen `invierno` sin sentido: se marcan como desconocido
-- para que no ensucien los promedios de acá en adelante.
update public.runs set invierno = null where invierno_dia is null and invierno is true;

-- Métricas por acto, ahora con el final por tiempo y el invierno de verdad.
-- Se dropea antes de crear: `create or replace view` no puede meter columnas
-- en el medio, intenta renombrar la que estaba en esa posición y falla.
drop view if exists public.runs_por_acto;
create view public.runs_por_acto
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
    count(*) filter (where ended_as = 'timeout')::int            as por_tiempo,
    count(*) filter (where ended_as = 'fired')::int              as echados,
    round(avg(day))::int                                         as dias_prom,
    round(avg(team_size))::int                                   as equipo_prom,
    round(avg(precio), 2)::float                                 as precio_prom,
    count(*) filter (where invierno)::int                        as con_invierno,
    round(avg(invierno_dia))::int                                as invierno_dia_prom
  from public.runs
  group by 1;

-- Duración: es la métrica que estamos tratando de bajar. El día es la unidad
-- del juego; los minutos se derivan del reloj (ver dayMs en data.ts).
drop view if exists public.runs_duracion;
create view public.runs_duracion
with (security_invoker = on) as
  select
    date_trunc('day', created_at)::date                                    as dia,
    count(*)::int                                                          as partidas,
    round(percentile_cont(0.5)  within group (order by day))::int          as dia_mediana,
    round(percentile_cont(0.9)  within group (order by day))::int          as dia_p90,
    max(day)::int                                                          as dia_max,
    count(*) filter (where ended_as = 'timeout')::int                      as por_tiempo,
    round(percentile_cont(0.5) within group (order by day)
          filter (where ended_as = 'ipo'))::int                            as ipo_dia_mediana
  from public.runs
  group by 1
  order by 1 desc;

-- Control: tiene que decir que 'timeout' está permitido y que la columna existe.
select
  (select pg_get_constraintdef(oid)
     from pg_constraint
    where conrelid = 'public.runs'::regclass and conname = 'runs_ended_as_check') as check_ended_as,
  (select count(*) from information_schema.columns
    where table_name = 'runs' and column_name = 'invierno_dia')                   as tiene_invierno_dia;

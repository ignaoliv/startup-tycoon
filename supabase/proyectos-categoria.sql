-- Cómo se ven los proyectos: categoría y actividad.
--
-- Dos cosas que le faltaban al listado para que se pueda recorrer:
--   1. una categoría, así se entiende de qué es cada proyecto de un vistazo
--   2. la actividad reciente, así se nota que el ranking se mueve
-- Re-ejecutable.

-- ---------------------------------------------------------------------------
-- 1. Categoría
--
-- Lista cerrada a propósito. Si fuera texto libre terminamos con "IA", "ia",
-- "Inteligencia artificial" y "AI" como cuatro categorías distintas, y el
-- filtro deja de servir.
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists proyecto_categoria text;

alter table public.profiles drop constraint if exists profiles_categoria_valida;
alter table public.profiles add constraint profiles_categoria_valida check (
  proyecto_categoria is null or proyecto_categoria in
    ('ia', 'fintech', 'productividad', 'comercio', 'social', 'juegos', 'devtools', 'otros')
);

-- ---------------------------------------------------------------------------
-- 2. El listado, con la categoría
--
-- `create or replace view` no sabe agregar columnas en el medio ni renombrar,
-- así que la vista se tira y se rehace. Ninguna policy depende de esta.
-- ---------------------------------------------------------------------------
drop view if exists public.proyectos;

create view public.proyectos
with (security_invoker = on) as
  select
    p.id                        as user_id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.twitter,
    p.proyecto,
    p.proyecto_url,
    p.proyecto_desc,
    coalesce(p.proyecto_categoria, 'otros') as categoria,
    p.created_at,
    coalesce(v.votos, 0)        as votos,
    coalesce(v.votos_semana, 0) as votos_semana,
    mejor.valuation             as mejor_valuacion,
    mejor.name                  as mejor_startup
  from public.profiles p
  left join lateral (
    select
      count(*)::int                                                        as votos,
      count(*) filter (where created_at > now() - interval '7 days')::int  as votos_semana
    from public.project_votes where target = p.id
  ) v on true
  left join lateral (
    select r.valuation, r.name from public.runs r
    where r.user_id = p.id and r.en_ranking
    order by r.valuation desc limit 1
  ) mejor on true
  where p.proyecto is not null and p.handle is not null;

-- ---------------------------------------------------------------------------
-- 3. Última actividad
--
-- Quién votó a quién y cuándo. Sin el votante: que se vea el movimiento del
-- ranking, no quién le dio la moneda a quién, que invita a devolver favores.
-- ---------------------------------------------------------------------------
create or replace view public.actividad_proyectos
with (security_invoker = on) as
  select
    v.created_at,
    p.handle,
    p.proyecto,
    p.proyecto_url,
    coalesce(p.proyecto_categoria, 'otros') as categoria
  from public.project_votes v
  join public.profiles p on p.id = v.target
  where p.proyecto is not null and p.handle is not null
  order by v.created_at desc
  limit 20;

-- Control
select
  (select count(*) from public.proyectos)                               as proyectos,
  (select count(*) from public.proyectos where categoria <> 'otros')    as con_categoria,
  (select count(*) from public.actividad_proyectos)                     as movimientos;

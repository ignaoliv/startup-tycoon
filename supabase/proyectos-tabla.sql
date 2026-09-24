-- Varios proyectos por persona.
--
-- Hasta acá el proyecto vivía como tres columnas del perfil, así que cada uno
-- podía tener exactamente uno. La mayoría de los que vibecodean tienen varios,
-- y el que ya cargó uno no tenía forma de sumar el segundo ni de editarlo.
--
-- Se hace ahora porque hoy hay 1 proyecto y 0 votos: no hay nada que migrar.
-- Dentro de un mes esto es mover votos de lugar con el ranking en marcha.
-- Re-ejecutable.

-- Las vistas se tiran primero: dependen de project_votes.target, que se va.
drop view if exists public.actividad_proyectos;
drop view if exists public.proyectos;

-- ---------------------------------------------------------------------------
-- 1. La tabla
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  nombre      text not null,
  url         text,
  descripcion text,
  categoria   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id, created_at);
-- el mismo proyecto dos veces es siempre un error de dedo, no una intención
create unique index if not exists projects_nombre_idx on public.projects (user_id, lower(nombre));

alter table public.projects drop constraint if exists projects_largos;
alter table public.projects add constraint projects_largos check (
      char_length(nombre) between 1 and 40
  and (descripcion is null or char_length(descripcion) between 1 and 140)
  and (url         is null or char_length(url)         between 4 and 200)
);

alter table public.projects drop constraint if exists projects_categoria_valida;
alter table public.projects add constraint projects_categoria_valida check (
  categoria is null or categoria in
    ('ia', 'fintech', 'productividad', 'comercio', 'social', 'juegos', 'devtools', 'otros')
);

alter table public.projects enable row level security;

drop policy if exists "proyectos se ven" on public.projects;
create policy "proyectos se ven" on public.projects for select using (true);

-- Tope de 5 por persona. Sin esto, cargar veinte proyectos de mentira es la
-- forma barata de ocupar el ranking entero.
drop policy if exists "cargo mis proyectos" on public.projects;
create policy "cargo mis proyectos" on public.projects
  for insert to authenticated with check (
    auth.uid() = user_id
    and (select count(*) from public.projects where user_id = auth.uid()) < 5
  );

drop policy if exists "edito mis proyectos" on public.projects;
create policy "edito mis proyectos" on public.projects
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "borro mis proyectos" on public.projects;
create policy "borro mis proyectos" on public.projects
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. Se mudan los que ya estaban en el perfil
-- ---------------------------------------------------------------------------
insert into public.projects (user_id, nombre, url, descripcion, categoria, created_at)
select p.id, p.proyecto, p.proyecto_url, p.proyecto_desc,
       coalesce(p.proyecto_categoria, 'otros'), p.created_at
from public.profiles p
where p.proyecto is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 3. Los votos pasan a ser de un proyecto, no de una persona
--
-- El tope de 3 pasa a ser por proyecto, que es lo que siempre quiso decir.
-- ---------------------------------------------------------------------------
-- La policy vieja nombra `target`, así que se va primero: si no, el drop de la
-- columna falla por dependencia.
drop policy if exists "voto con mi cuenta" on public.project_votes;

alter table public.project_votes add column if not exists project_id uuid
  references public.projects(id) on delete cascade;

-- El backfill va en un bloque dinámico porque en la segunda corrida `target`
-- ya no existe, y una consulta que la nombra no compila aunque el where la
-- excluya: SQL valida la sentencia entera antes de evaluar nada.
do $$
begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'project_votes' and column_name = 'target') then
    execute $q$
      update public.project_votes v
         set project_id = (select x.id from public.projects x
                           where x.user_id = v.target order by x.created_at limit 1)
       where v.project_id is null
    $q$;
  end if;
end $$;

-- votos a alguien que nunca tuvo proyecto: no existen hoy, y no tendrían a dónde ir
delete from public.project_votes where project_id is null;

alter table public.project_votes alter column project_id set not null;
alter table public.project_votes drop constraint if exists project_votes_no_autovoto;
alter table public.project_votes drop column if exists target;

drop index if exists public.project_votes_target_idx;
create index if not exists project_votes_project_idx on public.project_votes (project_id, created_at desc);
create index if not exists project_votes_voter_proyecto_idx on public.project_votes (voter, project_id);

-- Cuántas monedas le puso alguien a un proyecto. Va como función para que la
-- policy no tenga que desambiguar entre la fila nueva y la subconsulta.
drop function if exists public.votos_dados(uuid, uuid);
create function public.votos_dados(de uuid, a uuid) returns int
language sql stable as $$
  select count(*)::int from public.project_votes where voter = de and project_id = a
$$;

-- Las tres reglas se validan ACÁ y no en el cliente: si vivieran en el
-- navegador, cualquiera manda el POST a mano.
create policy "voto con mi cuenta" on public.project_votes
  for insert to authenticated with check (
    auth.uid() = voter
    and coalesce((select v.saldo from public.vibecoins v where v.user_id = auth.uid()), 0) > 0
    and public.votos_dados(auth.uid(), project_id) < 3
    and not exists (select 1 from public.projects x where x.id = project_id and x.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- 4. Las vistas, ahora sobre la tabla
-- ---------------------------------------------------------------------------
create view public.proyectos
with (security_invoker = on) as
  select
    x.id,
    x.user_id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.twitter,
    x.nombre                   as proyecto,
    x.url                      as proyecto_url,
    x.descripcion              as proyecto_desc,
    coalesce(x.categoria, 'otros') as categoria,
    x.created_at,
    coalesce(v.votos, 0)       as votos,
    coalesce(v.votos_semana, 0) as votos_semana,
    mejor.valuation            as mejor_valuacion,
    mejor.name                 as mejor_startup
  from public.projects x
  join public.profiles p on p.id = x.user_id
  left join lateral (
    select
      count(*)::int                                                        as votos,
      count(*) filter (where created_at > now() - interval '7 days')::int  as votos_semana
    from public.project_votes where project_id = x.id
  ) v on true
  left join lateral (
    select r.valuation, r.name from public.runs r
    where r.user_id = x.user_id and r.en_ranking
    order by r.valuation desc limit 1
  ) mejor on true
  where p.handle is not null;

-- Quién recibió votos y cuándo. Sin el votante: que se vea el movimiento del
-- ranking, no quién le dio la moneda a quién, que invita a devolver favores.
create view public.actividad_proyectos
with (security_invoker = on) as
  select
    v.created_at,
    p.handle,
    x.nombre                       as proyecto,
    x.url                          as proyecto_url,
    coalesce(x.categoria, 'otros') as categoria
  from public.project_votes v
  join public.projects x on x.id = v.project_id
  join public.profiles p on p.id = x.user_id
  where p.handle is not null
  order by v.created_at desc
  limit 20;

-- ---------------------------------------------------------------------------
-- 5. El perfil público deja de traer el proyecto pegado
--
-- La página pide los proyectos aparte, porque ahora son varios. Las columnas
-- viejas se quedan en `profiles` sin molestar a nadie: borrarlas no aporta y
-- deja sin red por si algo todavía las lee.
-- ---------------------------------------------------------------------------
drop view if exists public.perfiles_publicos;

create view public.perfiles_publicos
with (security_invoker = on) as
  select
    p.id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.twitter,
    p.linkedin,
    p.created_at,
    mejor.name        as mejor_startup,
    mejor.sector      as mejor_sector,
    mejor.valuation   as mejor_valuacion,
    mejor.peak_users  as mejor_usuarios,
    mejor.day         as mejor_dia,
    mejor.ended_as    as mejor_final,
    stats.partidas,
    stats.ganadas
  from public.profiles p
  left join lateral (
    select r.name, r.sector, r.valuation, r.peak_users, r.day, r.ended_as
    from public.runs r
    where r.user_id = p.id and r.en_ranking
    order by r.valuation desc
    limit 1
  ) mejor on true
  left join lateral (
    select count(*)::int as partidas,
           count(*) filter (where r.ended_as in ('ipo', 'acquired'))::int as ganadas
    from public.runs r
    where r.user_id = p.id
  ) stats on true;

-- Control
select
  (select count(*) from public.projects)                          as proyectos,
  (select count(*) from public.project_votes)                     as votos,
  (select count(*) from public.proyectos)                         as en_el_ranking,
  (select count(*) from public.profiles where proyecto is not null) as perfiles_viejos_migrados;

-- Perfil público: la página que el jugador comparte.
--
-- La idea es que el link haga quedar bien al que lo pega, no que promocione el
-- sitio. Por eso lleva handle propio (vibecodingame.com/u/nacho) y no el uuid.
-- Re-ejecutable.

alter table public.profiles add column if not exists handle text;
alter table public.profiles add column if not exists proyecto text;
alter table public.profiles add column if not exists proyecto_url text;
alter table public.profiles add column if not exists proyecto_desc text;

-- Un handle por persona, sin distinguir mayúsculas.
create unique index if not exists profiles_handle_idx on public.profiles (lower(handle));

alter table public.profiles drop constraint if exists profiles_handle_formato;
alter table public.profiles add constraint profiles_handle_formato
  check (handle is null or handle ~ '^[a-z0-9_-]{2,24}$');

alter table public.profiles drop constraint if exists profiles_proyecto_largo;
alter table public.profiles add constraint profiles_proyecto_largo check (
      (proyecto      is null or char_length(proyecto)      between 1 and 40)
  and (proyecto_desc is null or char_length(proyecto_desc) between 1 and 140)
  and (proyecto_url  is null or char_length(proyecto_url)  between 4 and 200)
);

-- El perfil público se lee sin sesión: es una página que se comparte.
drop policy if exists "perfiles se ven" on public.profiles;
create policy "perfiles se ven" on public.profiles for select using (true);

-- Cada uno edita el suyo.
drop policy if exists "edito mi perfil" on public.profiles;
create policy "edito mi perfil" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Vista pública: lo que se muestra en /u/<handle>, con la mejor partida ya
-- resuelta. Va acá y no en el cliente para que la página se pueda renderizar
-- en el servidor y la tarjeta de X tenga datos.
create or replace view public.perfiles_publicos
with (security_invoker = on) as
  select
    p.id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.twitter,
    p.linkedin,
    p.proyecto,
    p.proyecto_url,
    p.proyecto_desc,
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
  (select count(*) from public.profiles)                        as perfiles,
  (select count(*) from public.profiles where handle is not null) as con_handle,
  (select count(*) from public.profiles where proyecto is not null) as con_proyecto;

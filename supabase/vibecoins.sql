-- Vibecoins: la moneda que se gana jugando y se gasta votando proyectos.
--
--   terminar una partida  → +1
--   ganarla               → +2
--
-- El saldo NO se guarda: se deriva de `runs`. Así no se puede inflar sin jugar,
-- que es exactamente el agujero que tuvimos con el ranking. Lo único que se
-- escribe es el voto.
-- Re-ejecutable.

-- ---------------------------------------------------------------------------
-- Votos a proyectos
-- ---------------------------------------------------------------------------
create table if not exists public.project_votes (
  id uuid primary key default gen_random_uuid(),
  voter uuid not null references auth.users(id) on delete cascade,
  target uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint project_votes_no_autovoto check (voter <> target)
);

create index if not exists project_votes_target_idx on public.project_votes (target, created_at desc);
create index if not exists project_votes_voter_idx on public.project_votes (voter, created_at desc);

alter table public.project_votes enable row level security;

-- Los votos son públicos: el ranking los cuenta.
drop policy if exists "votos se ven" on public.project_votes;
create policy "votos se ven" on public.project_votes for select using (true);

-- Cuántas monedas le dio una persona a un proyecto. Va como función para que
-- la policy no tenga que desambiguar entre la fila nueva y la subconsulta.
create or replace function public.votos_dados(de uuid, a uuid) returns int
language sql stable as $$
  select count(*)::int from public.project_votes where voter = de and target = a
$$;

-- Cada voto es una moneda. Las dos reglas se validan ACÁ y no en el cliente:
-- si vivieran en el navegador, cualquiera manda el POST a mano, que es
-- exactamente lo que pasó con el ranking de partidas.
--
-- El tope de 3 por proyecto es para que el que junta muchas monedas no defina
-- el podio solo: te obliga a repartir.
drop policy if exists "voto con mi cuenta" on public.project_votes;
create policy "voto con mi cuenta" on public.project_votes
  for insert to authenticated with check (
    auth.uid() = voter
    and coalesce((select v.saldo from public.vibecoins v where v.user_id = auth.uid()), 0) > 0
    and public.votos_dados(auth.uid(), target) < 3
  );

-- ---------------------------------------------------------------------------
-- El saldo, derivado
--
-- Las monedas empiezan a contar desde el corte, no desde siempre: si contaran
-- las partidas viejas, el que ya jugó cincuenta veces arrancaría con ochenta
-- monedas y decidiría el ranking de proyectos el primer día. Todos arrancan
-- en cero.
--
-- `abandoned` no cuenta: es la partida que se dejó por la mitad, y la escribe
-- el cierre automático, no el jugador.
-- ---------------------------------------------------------------------------
create or replace view public.vibecoins
with (security_invoker = on) as
  select
    p.id                                                             as user_id,
    coalesce(r.terminadas, 0) + coalesce(r.ganadas, 0)               as ganadas,
    coalesce(v.gastadas, 0)                                          as gastadas,
    coalesce(r.terminadas, 0) + coalesce(r.ganadas, 0)
      - coalesce(v.gastadas, 0)                                      as saldo
  from public.profiles p
  left join lateral (
    select
      count(*) filter (where ended_as <> 'abandoned')::int              as terminadas,
      count(*) filter (where ended_as in ('ipo', 'acquired'))::int      as ganadas
    from public.runs
    where user_id = p.id
      and created_at >= timestamptz '2026-09-22 00:00:00-03'  -- corte: cambialo acá si hace falta
  ) r on true
  left join lateral (
    -- los votos se descuentan siempre, no llevan corte
    select count(*)::int as gastadas from public.project_votes where voter = p.id
  ) v on true;

-- ---------------------------------------------------------------------------
-- Ranking de proyectos
--
-- Por ahora ordena por lo más nuevo: con pocos proyectos, un ranking por votos
-- premia siempre al mismo y el que llega después no tiene motivo para cargar.
-- Los votos ya vienen contados para cuando cerremos la lógica.
-- ---------------------------------------------------------------------------
create or replace view public.proyectos
with (security_invoker = on) as
  select
    p.id                      as user_id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.twitter,
    p.proyecto,
    p.proyecto_url,
    p.proyecto_desc,
    p.created_at,
    coalesce(v.votos, 0)      as votos,
    coalesce(v.votos_semana, 0) as votos_semana,
    mejor.valuation           as mejor_valuacion,
    mejor.name                as mejor_startup
  from public.profiles p
  left join lateral (
    select
      count(*)::int                                                          as votos,
      count(*) filter (where created_at > now() - interval '7 days')::int    as votos_semana
    from public.project_votes where target = p.id
  ) v on true
  left join lateral (
    select r.valuation, r.name from public.runs r
    where r.user_id = p.id and r.en_ranking
    order by r.valuation desc limit 1
  ) mejor on true
  where p.proyecto is not null and p.handle is not null;

-- Control
select
  (select count(*) from public.proyectos)                    as proyectos,
  (select count(*) from public.project_votes)                as votos,
  (select saldo from public.vibecoins order by saldo desc limit 1) as saldo_mas_alto;

-- Historial de partidas terminadas. Una fila por partida, se escribe una sola vez.
-- Es la base del historial personal, de los logros de carrera y de los rankings
-- semanal e histórico. NO guarda el state completo: solo el resumen.

create table if not exists public.runs (
  id uuid primary key default gen_random_uuid(),
  -- null = jugó sin login. La partida cuenta para las estadísticas globales
  -- pero no aparece en los rankings con nombre.
  user_id uuid references auth.users(id) on delete cascade,
  anon_id text,
  name text not null,
  sector text not null,
  idea text,
  ended_as text not null check (ended_as in ('ipo', 'acquired', 'bankrupt', 'fired', 'abandoned')),
  day int not null default 1,
  valuation numeric not null default 0,
  peak_users numeric not null default 0,
  mrr numeric not null default 0,
  equity numeric not null default 100,
  team_size int not null default 0,
  stage int not null default 0,
  raised numeric not null default 0,
  features int not null default 0,
  created_at timestamptz not null default now()
);

-- historial personal
create index if not exists runs_user_idx on public.runs (user_id, created_at desc);
-- salón de la fama
create index if not exists runs_hall_idx on public.runs (valuation desc);
-- ranking semanal
create index if not exists runs_recientes_idx on public.runs (created_at desc, valuation desc);

alter table public.runs enable row level security;

-- Cualquiera puede guardar su partida, con o sin login. Lo que no puede es
-- guardarla a nombre de otro.
drop policy if exists "guardo mi partida" on public.runs;
create policy "guardo mi partida" on public.runs
  for insert to anon, authenticated
  with check (user_id is null or auth.uid() = user_id);

-- Los rankings son públicos.
drop policy if exists "los rankings se ven" on public.runs;
create policy "los rankings se ven" on public.runs
  for select to anon, authenticated using (true);

-- Vista con el nombre y el avatar del jugador ya resueltos.
create or replace view public.runs_ranking
with (security_invoker = on) as
  select r.id, r.user_id, r.name, r.sector, r.ended_as, r.day,
         r.valuation, r.peak_users, r.mrr, r.equity, r.team_size, r.created_at,
         p.display_name, p.avatar_url
  from public.runs r
  left join public.profiles p on p.id = r.user_id;

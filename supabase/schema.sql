-- Startup Tycoon — schema Supabase
-- Ejecutar en SQL Editor del proyecto (una sola vez).

create extension if not exists pgcrypto;

-- Perfiles públicos
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Fundador/a',
  avatar_url text,
  twitter text,
  linkedin text,
  created_at timestamptz not null default now()
);

-- Una startup por usuario. `state` es el save completo; las columnas sueltas son para ranking/visitas.
create table if not exists public.startups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  sector text not null,
  valuation numeric not null default 0,
  users numeric not null default 0,
  mrr numeric not null default 0,
  cash numeric not null default 0,
  stage int not null default 0,
  office int not null default 0,
  day int not null default 1,
  team_size int not null default 1,
  game_over text,
  state jsonb not null,
  updated_at timestamptz not null default now()
);
create index if not exists startups_valuation_idx on public.startups (valuation desc);

-- Muro / feed
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 280),
  kind text not null default 'post',
  created_at timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- Acciones entre jugadores (invertir, dar hype, robar talento). Las procesa el destinatario al cargar.
create table if not exists public.social_actions (
  id uuid primary key default gen_random_uuid(),
  from_user uuid not null references auth.users(id) on delete cascade,
  to_user uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('invest','hype','poach')),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);
create index if not exists social_actions_to_idx on public.social_actions (to_user, processed_at);

-- Perfil automático al registrarse
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Fundador/a'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Vista de ranking (sin exponer el save completo)
create or replace view public.leaderboard as
  select s.user_id, s.name, s.sector, s.valuation, s.users, s.mrr, s.stage, s.office, s.day, s.team_size, s.game_over, s.updated_at,
         p.display_name, p.avatar_url
  from public.startups s join public.profiles p on p.id = s.user_id
  order by s.valuation desc;

-- RLS
alter table public.profiles enable row level security;
alter table public.startups enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.social_actions enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles write own" on public.profiles;
create policy "profiles write own" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "startups read" on public.startups;
create policy "startups read" on public.startups for select using (true);
drop policy if exists "startups write own" on public.startups;
create policy "startups write own" on public.startups for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "posts read" on public.posts;
create policy "posts read" on public.posts for select using (true);
drop policy if exists "posts insert own" on public.posts;
create policy "posts insert own" on public.posts for insert with check (auth.uid() = user_id);
drop policy if exists "posts delete own" on public.posts;
create policy "posts delete own" on public.posts for delete using (auth.uid() = user_id);

drop policy if exists "likes read" on public.post_likes;
create policy "likes read" on public.post_likes for select using (true);
drop policy if exists "likes own" on public.post_likes;
create policy "likes own" on public.post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "actions insert" on public.social_actions;
create policy "actions insert" on public.social_actions for insert with check (auth.uid() = from_user and from_user <> to_user);
drop policy if exists "actions read" on public.social_actions;
create policy "actions read" on public.social_actions for select using (auth.uid() = to_user or auth.uid() = from_user);
drop policy if exists "actions process" on public.social_actions;
create policy "actions process" on public.social_actions for update using (auth.uid() = to_user) with check (auth.uid() = to_user);

-- Realtime para el feed
do $$ begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.social_actions;
exception when duplicate_object then null; end $$;

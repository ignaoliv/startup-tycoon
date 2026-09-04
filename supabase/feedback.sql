-- Feedback de los jugadores.
-- Insert abierto: jugar no requiere login, mandar feedback tampoco.
-- Lectura cerrada: solo el mail del admin, que es el que ve /admin.

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  rating smallint check (rating between 1 and 5),
  texto text check (char_length(texto) <= 1000),
  contexto jsonb,
  created_at timestamptz not null default now(),
  -- algo tiene que venir: o la nota, o un texto de verdad
  constraint feedback_no_vacio check (rating is not null or char_length(coalesce(texto, '')) >= 3)
);

alter table public.feedback enable row level security;

drop policy if exists "cualquiera manda feedback" on public.feedback;
create policy "cualquiera manda feedback" on public.feedback
  for insert to anon, authenticated with check (true);

drop policy if exists "solo el admin lee" on public.feedback;
create policy "solo el admin lee" on public.feedback
  for select to authenticated
  using (auth.jwt() ->> 'email' = 'dji.olivieri@gmail.com');

create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- Invitaciones: 5 vibecoins por cada persona que traés.
--
-- Esas monedas NO tienen el tope de 3 por proyecto: se pueden poner donde ya
-- votaste. Por eso se acreditan recién cuando el invitado TERMINA una partida,
-- y no cuando se registra: si bastara con registrarse, una cuenta de Google
-- descartable daría 5 monedas sin tope y el podio volvería a decidirlo uno
-- solo, que es justo lo que el tope de 3 vino a evitar. Con esta regla, cada
-- cuenta trucha cuesta una partida entera.
-- Re-ejecutable.

-- ---------------------------------------------------------------------------
-- Quién trajo a quién
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists invitado_por uuid references auth.users(id);
create index if not exists profiles_invitado_por_idx on public.profiles (invitado_por);

alter table public.profiles drop constraint if exists profiles_no_autoinvitacion;
alter table public.profiles add constraint profiles_no_autoinvitacion check (invitado_por is null or invitado_por <> id);

-- Se setea una sola vez. Sin esto, cualquiera rota el campo y reparte monedas.
create or replace function public.fijar_invitacion() returns trigger
language plpgsql as $$
begin
  if old.invitado_por is not null and new.invitado_por is distinct from old.invitado_por then
    new.invitado_por := old.invitado_por;
  end if;
  return new;
end $$;

drop trigger if exists profiles_invitacion_fija on public.profiles;
create trigger profiles_invitacion_fija before update on public.profiles
  for each row execute function public.fijar_invitacion();

-- ---------------------------------------------------------------------------
-- Dos tipos de moneda
-- ---------------------------------------------------------------------------
alter table public.project_votes add column if not exists tipo text not null default 'juego';
alter table public.project_votes drop constraint if exists project_votes_tipo;
alter table public.project_votes add constraint project_votes_tipo check (tipo in ('juego', 'invitacion'));

-- ---------------------------------------------------------------------------
-- El saldo, con los dos bolsillos separados
-- ---------------------------------------------------------------------------
create or replace view public.vibecoins
with (security_invoker = on) as
  select
    p.id                                                                 as user_id,
    coalesce(j.terminadas, 0) + coalesce(j.ganadas, 0)                   as juego_ganadas,
    coalesce(i.invitados, 0) * 5                                         as invit_ganadas,
    coalesce(g.juego, 0)                                                 as juego_gastadas,
    coalesce(g.invit, 0)                                                 as invit_gastadas,
    coalesce(j.terminadas, 0) + coalesce(j.ganadas, 0) - coalesce(g.juego, 0)  as saldo_juego,
    coalesce(i.invitados, 0) * 5 - coalesce(g.invit, 0)                        as saldo_invitacion,
    coalesce(j.terminadas, 0) + coalesce(j.ganadas, 0) - coalesce(g.juego, 0)
      + coalesce(i.invitados, 0) * 5 - coalesce(g.invit, 0)                    as saldo
  from public.profiles p
  left join lateral (
    select
      count(*) filter (where ended_as <> 'abandoned')::int              as terminadas,
      count(*) filter (where ended_as in ('ipo', 'acquired'))::int      as ganadas
    from public.runs
    where user_id = p.id
      and created_at >= timestamptz '2026-09-22 00:00:00-03'   -- el corte
  ) j on true
  left join lateral (
    -- solo cuentan los invitados que llegaron a terminar una partida
    select count(*)::int as invitados
    from public.profiles inv
    where inv.invitado_por = p.id
      and exists (
        select 1 from public.runs r
        where r.user_id = inv.id and r.ended_as <> 'abandoned'
          and r.created_at >= timestamptz '2026-09-22 00:00:00-03'
      )
  ) i on true
  left join lateral (
    select
      count(*) filter (where tipo = 'juego')::int      as juego,
      count(*) filter (where tipo = 'invitacion')::int as invit
    from public.project_votes where voter = p.id
  ) g on true;

-- ---------------------------------------------------------------------------
-- El tope de 3 cuenta solo las monedas de juego
-- ---------------------------------------------------------------------------
create or replace function public.votos_dados(de uuid, a uuid) returns int
language sql stable as $$
  select count(*)::int from public.project_votes
  where voter = de and target = a and tipo = 'juego'
$$;

drop policy if exists "voto con mi cuenta" on public.project_votes;
create policy "voto con mi cuenta" on public.project_votes
  for insert to authenticated with check (
    auth.uid() = voter
    and case tipo
      -- moneda de juego: hace falta saldo y no haber llegado al tope
      when 'juego' then
        coalesce((select v.saldo_juego from public.vibecoins v where v.user_id = auth.uid()), 0) > 0
        and public.votos_dados(auth.uid(), target) < 3
      -- moneda de invitación: sin tope por proyecto, pero hay que tenerla
      when 'invitacion' then
        coalesce((select v.saldo_invitacion from public.vibecoins v where v.user_id = auth.uid()), 0) > 0
      else false
    end
  );

-- ---------------------------------------------------------------------------
-- Control
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.profiles where invitado_por is not null) as invitados,
  (select count(*) from public.project_votes where tipo = 'invitacion') as votos_de_invitacion,
  (select max(saldo_invitacion) from public.vibecoins)                  as mayor_saldo_de_invitacion;

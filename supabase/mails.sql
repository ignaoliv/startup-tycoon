-- Bajas de correo.
--
-- La gente entró con Google para guardar una partida, no para recibir mails.
-- Eso no es un opt-in de marketing, así que el link de baja va desde el primer
-- envío y tiene que funcionar sin pedir que inicien sesión.
-- Re-ejecutable.

alter table public.profiles add column if not exists baja_token uuid not null default gen_random_uuid();
alter table public.profiles add column if not exists baja_at timestamptz;

create unique index if not exists profiles_baja_token_idx on public.profiles (baja_token);

-- Darse de baja no puede requerir sesión: el que abre el mail en el teléfono no
-- está logueado. Va como función security definer para no tener que abrir un
-- update anónimo sobre la tabla entera.
create or replace function public.darse_de_baja(token uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare afectadas int;
begin
  update public.profiles set baja_at = now() where baja_token = token and baja_at is null;
  get diagnostics afectadas = row_count;
  -- si ya estaba dada de baja devolvemos true igual: para el que hace click es
  -- lo mismo, y así no le decimos "no encontré tu mail" a alguien que ya se fue
  if afectadas = 0 then
    return exists (select 1 from public.profiles where baja_token = token);
  end if;
  return true;
end $$;

revoke all on function public.darse_de_baja(uuid) from public;
grant execute on function public.darse_de_baja(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- La lista para enviar.
--
-- Los mails viven en auth.users, que solo se lee con la clave de servicio, así
-- que esta consulta se corre DESDE EL DASHBOARD y el resultado se exporta.
-- No queda ninguna vista pública con mails.
--
-- Segmentos, medidos el 2026-09-22:
--   226  nunca ganaron ninguna partida
--   507  jugaron una sola y se fueron
-- 1.036  no juegan hace más de 14 días
-- ---------------------------------------------------------------------------

-- Los 226 que nunca ganaron: a varios los fundió un bug que ya arreglamos.
select u.email,
       p.display_name,
       p.baja_token,
       count(r.id)                                                   as partidas,
       max(r.created_at)                                             as ultima
from auth.users u
join public.profiles p on p.id = u.id
join public.runs r on r.user_id = u.id
where p.baja_at is null
  and u.email is not null
group by u.email, p.display_name, p.baja_token
having count(*) filter (where r.ended_as in ('ipo', 'acquired')) = 0
order by max(r.created_at) desc;

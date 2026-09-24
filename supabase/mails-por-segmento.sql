-- Un CSV por segmento, para importar cada grupo a su segmento de Resend.
--
-- En Resend un segmento es una LISTA a la que el contacto pertenece, no un
-- filtro sobre las propiedades. Que el contacto tenga `segmento = gano` como
-- propiedad no lo mete en el segmento llamado "gano": sirve para personalizar
-- el texto, no para agrupar.
--
-- La forma más rápida de llenarlos es importar un CSV por grupo, eligiendo el
-- segmento destino en el paso de importar. Resend actualiza por email a los
-- que ya existen en vez de duplicarlos, así que reimportar es inofensivo.
--
-- CAMBIAR ESTA LÍNEA para sacar cada grupo (medido el 2026-09-24):
--   'gano'          928  ganaron al menos una partida
--   'jugo_sin_gano' 227  jugaron y nunca ganaron   (ya recibieron el envío 1)
--   'nunca_jugo'    233  se registraron y nunca jugaron

with ranking as (
  -- rank() empata igual que "contar las que están por encima y sumar uno"
  select user_id, rank() over (order by valuation desc) as puesto
  from public.runs
  where en_ranking and user_id is not null
),
mejor as (
  select user_id, min(puesto) as puesto from ranking group by user_id
),
total as (
  select count(*)::int as n from public.runs where en_ranking and user_id is not null
),
gente as (
  select
    u.email,
    split_part(coalesce(p.display_name, ''), ' ', 1)             as first_name,
    case
      when count(r.id) = 0                                              then 'nunca_jugo'
      when count(*) filter (where r.ended_as in ('ipo','acquired')) > 0 then 'gano'
      else 'jugo_sin_gano'
    end                                                          as segmento,
    case when x.id is not null then 'si' else 'no' end            as tiene_proyecto,
    count(r.id)                                                   as partidas,
    count(*) filter (where r.ended_as in ('ipo','acquired'))      as ganadas,
    m.puesto,
    t.n                                                           as total_partidas,
    max(r.created_at)                                             as ultima_partida
  from auth.users u
  join public.profiles p on p.id = u.id
  left join public.runs r on r.user_id = u.id
  left join mejor m on m.user_id = u.id
  left join lateral (select id from public.projects where user_id = u.id limit 1) x on true
  cross join total t
  where u.email is not null
  group by u.email, p.display_name, x.id, m.puesto, t.n
)
select email, first_name, segmento, tiene_proyecto,
       partidas, ganadas, puesto, total_partidas,
       ultima_partida::date as ultima_partida
from gente
where segmento = 'gano'          -- <<<<<< ACÁ
order by ultima_partida desc nulls last;

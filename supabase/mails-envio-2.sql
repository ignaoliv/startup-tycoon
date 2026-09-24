-- Envío 2: los que ganaron al menos una partida.
--
-- Se corre DESDE EL DASHBOARD y el resultado se exporta como CSV: los mails
-- viven en auth.users, que solo se lee con la clave de servicio. No queda
-- ninguna vista pública con mails.
--
-- Medido el 2026-09-24, sobre 1.388 perfiles:
--   928  ganaron al menos una partida   <- este envío
--   233  se registraron y nunca jugaron
--   227  jugaron y nunca ganaron        <- el envío 1, ya recibieron
--
-- Los tres grupos son disjuntos, así que este filtro deja afuera solo a los
-- que ya recibieron el primero sin tener que cruzar ninguna lista a mano.

select u.email,
       p.display_name,
       p.baja_token,
       count(r.id)                                                    as partidas,
       count(*) filter (where r.ended_as in ('ipo', 'acquired'))      as ganadas,
       max(r.created_at)                                              as ultima_partida
from auth.users u
join public.profiles p on p.id = u.id
join public.runs r on r.user_id = u.id
where p.baja_at is null
  and u.email is not null
group by u.email, p.display_name, p.baja_token
having count(*) filter (where r.ended_as in ('ipo', 'acquired')) > 0
-- los que jugaron más cerca de hoy primero: son los que más chance tienen de volver
order by max(r.created_at) desc
limit 400;

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
-- POR QUÉ NO FILTRA BAJAS
--
-- `mails.sql` (baja_token, baja_at, darse_de_baja) todavía no se corrió, así
-- que esas columnas no existen. Para ESTE envío no hace falta: el envío 1 fue
-- exactamente el grupo de "jugaron y nunca ganaron", y este es el de "ganaron
-- al menos una". Son disjuntos por construcción, así que nadie de esta lista
-- pudo haberse dado de baja del anterior.
--
-- A partir del tercer envío sí hace falta, porque ahí empiezan a solaparse.
-- Correr `mails.sql` antes y volver a agregar `and p.baja_at is null`.

select u.email,
       p.display_name,
       count(r.id)                                                    as partidas,
       count(*) filter (where r.ended_as in ('ipo', 'acquired'))      as ganadas,
       max(r.created_at)                                              as ultima_partida
from auth.users u
join public.profiles p on p.id = u.id
join public.runs r on r.user_id = u.id
where u.email is not null
group by u.email, p.display_name
having count(*) filter (where r.ended_as in ('ipo', 'acquired')) > 0
-- los que jugaron más cerca de hoy primero: son los que más chance tienen de volver
order by max(r.created_at) desc
limit 400;

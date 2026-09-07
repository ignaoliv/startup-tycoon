-- Solo los que escribieron algo: son los accionables. Una sola consulta para
-- que el editor no la reemplace con el resumen.
select
  to_char(created_at, 'DD/MM HH24:MI')                          as cuando,
  coalesce(rating::text, '-')                                   as nota,
  case when user_id is null then 'anon' else 'cuenta' end       as quien,
  coalesce(contexto->>'final', '?')                             as termino,
  coalesce(contexto->>'dia', '?')                               as dia,
  coalesce(contexto->>'sector', '?')                            as sector,
  coalesce(contexto->>'usuarios', '?')                          as usuarios,
  coalesce(contexto->>'features', '?')                          as features,
  coalesce(contexto->>'partidas', '?')                          as partidas_previas,
  texto                                                         as comentario
from public.feedback
where texto is not null and length(trim(texto)) > 0
order by created_at desc;

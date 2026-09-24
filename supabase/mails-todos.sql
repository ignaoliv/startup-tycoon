-- Exportar los 1.388 para importarlos a Resend de una vez.
--
-- Se corre DESDE EL DASHBOARD y se exporta como CSV: los mails viven en
-- auth.users, que solo se lee con la clave de servicio.
--
-- Resend mapea cada columna del CSV a una propiedad del contacto, así que
-- desde ahí se segmenta sin volver a tocar SQL nunca más. Y como lleva su
-- propia lista de bajas y rebotes, deja de importar que `baja_at` no exista.
--
-- El puesto se calcula igual que en el sitio (`fetchPuesto`): se cuenta
-- cuántas partidas hay con más valuación. Verificado contra producción el
-- 2026-09-24: Truequely, con 43.986.866.060, tiene 20 por encima y el sitio
-- lo muestra como #21.

with ranking as (
  -- rank() empata igual que "contar las que están por encima y sumar uno"
  select user_id,
         rank() over (order by valuation desc) as puesto
  from public.runs
  where en_ranking and user_id is not null
),
mejor as (
  select user_id, min(puesto) as puesto
  from ranking
  group by user_id
),
total as (
  select count(*)::int as partidas_en_ranking
  from public.runs where en_ranking and user_id is not null
)
select
  u.email,
  -- Resend usa first_name para personalizar; el apellido no aporta y alarga
  split_part(coalesce(p.display_name, ''), ' ', 1)            as first_name,
  case
    when count(r.id) = 0                                            then 'nunca_jugo'
    when count(*) filter (where r.ended_as in ('ipo','acquired')) > 0 then 'gano'
    else 'jugo_sin_gano'
  end                                                          as segmento,
  -- el envío 1 fue exactamente el grupo 'jugo_sin_gano'
  case
    when count(r.id) > 0
     and count(*) filter (where r.ended_as in ('ipo','acquired')) = 0
    then 'si' else 'no'
  end                                                          as recibio_envio_1,
  case when x.id is not null then 'si' else 'no' end            as tiene_proyecto,
  count(r.id)                                                   as partidas,
  count(*) filter (where r.ended_as in ('ipo','acquired'))      as ganadas,
  m.puesto                                                      as puesto,
  t.partidas_en_ranking                                         as total_partidas,
  max(r.created_at)::date                                       as ultima_partida
from auth.users u
join public.profiles p on p.id = u.id
left join public.runs r on r.user_id = u.id
left join mejor m on m.user_id = u.id
left join lateral (select id from public.projects where user_id = u.id limit 1) x on true
cross join total t
where u.email is not null
group by u.email, p.display_name, x.id, m.puesto, t.partidas_en_ranking
order by max(r.created_at) desc nulls last;

-- Después, en Resend:
--   1. Audiences > Import > subir el CSV (mapea las columnas solo)
--   2. Segments > uno por cada valor de `segmento`
--   3. Broadcast > elegir el segmento
--
-- Para el mail personalizado con el puesto, las propiedades se usan así:
--   {{{FIRST_NAME}}}  {{{PUESTO}}}  {{{TOTAL_PARTIDAS}}}
-- Conviene darles un valor por defecto en Resend, porque `nunca_jugo` no
-- tiene puesto y ahí la variable sale vacía.

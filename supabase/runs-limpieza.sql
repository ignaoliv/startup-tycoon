-- Limpieza del ranking y tope a lo imposible.
-- Re-ejecutable.
--
-- De 6.238 partidas, 17 tienen valores fuera de rango. NO son todas lo mismo:
--
--   11  equity negativo (-3, -6)   → bug nuestro, ya arreglado en el motor.
--                                    Se reparan: esa gente jugó bien.
--    4  usuarios arriba del mercado → exploit de campañas, ya arreglado.
--                                    Salen del ranking pero NO se borran: son
--                                    partidas reales y siguen en su historial.
--    2  imposibles de explicar      → no entran ni en la curva del exploit.
--                                    Esas sí se borran.

-- ---------------------------------------------------------------------------
-- 1. Reparar el equity negativo (bug del motor, no del jugador)
-- ---------------------------------------------------------------------------
update public.runs set equity = 1 where equity < 1;

-- ---------------------------------------------------------------------------
-- 2. Borrar solo lo que no se explica de ninguna manera
--
-- El exploit componía +10% de usuarios cada 55 días: desde 1M, al día 955
-- llegás a 26,5 millones y al 3.444 a 111 mil millones. Lo que entra en esa
-- curva es juego legítimo de una mecánica rota y se respeta.
-- ---------------------------------------------------------------------------
delete from public.runs
where peak_users > 1e11                  -- más de lo que el compuesto puede dar
   or (day < 30 and peak_users > 1e6);   -- imposible en menos de un mes

-- ---------------------------------------------------------------------------
-- 3. Sacar del ranking las partidas del exploit, sin borrarlas
--
-- La bandera se calcula una sola vez acá. No hace falta que la regla viva en
-- la base para siempre: el motor ya no deja pasar el techo del sector, así que
-- ninguna partida nueva puede caer en esto. Queda además como palanca manual.
-- ---------------------------------------------------------------------------
alter table public.runs add column if not exists en_ranking boolean not null default true;

update public.runs r
set en_ranking = false
where r.en_ranking
  and (
    r.valuation > 1e12
    or r.peak_users > case r.sector          -- tam x tamMul, de data.ts
         when 'saas'     then 1500000
         when 'fintech'  then 3000000
         when 'devtools' then 1050000
         when 'delivery' then 12500000
         when 'crypto'   then 4000000
         when 'ai'       then 6000000
         else 12500000
       end
  );

-- El ranking lee esta vista, así que el cliente no cambia.
create or replace view public.runs_ranking
with (security_invoker = on) as
  select r.id, r.user_id, r.name, r.sector, r.ended_as, r.day,
         r.valuation, r.peak_users, r.mrr, r.equity, r.team_size, r.created_at,
         p.display_name, p.avatar_url
  from public.runs r
  left join public.profiles p on p.id = r.user_id
  where r.en_ranking;

-- ---------------------------------------------------------------------------
-- 4. Tope para lo que entre de acá en adelante
--
-- Holgado a propósito: rechazar lo absurdo, no arbitrar partidas buenas. El
-- p99,9 real es 516 mil millones de valuación y 19,8 millones de usuarios.
-- ---------------------------------------------------------------------------
alter table public.runs drop constraint if exists runs_valores_posibles;
alter table public.runs add constraint runs_valores_posibles check (
      valuation  >= 0 and valuation  <= 1e12
  and peak_users >= 0 and peak_users <= 1e9
  and mrr        >= 0 and mrr        <= 1e11
  and equity     >= 0 and equity     <= 100
  and team_size  >= 0 and team_size  <= 1000
  and features   >= 0 and features   <= 200
  and day        >= 1 and day        <= 100000
  and raised     >= 0
) not valid;

-- `not valid` es a propósito: aplica a lo que entre de ahora en más y no
-- invalida las filas viejas del exploit, que siguen existiendo aunque no
-- aparezcan en el ranking.

-- ---------------------------------------------------------------------------
-- Control
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.runs)                                     as partidas,
  (select count(*) from public.runs where not en_ranking)                as fuera_del_ranking,
  (select count(*) from public.runs where equity < 1)                    as equity_negativo,
  (select round(max(valuation) / 1e9) from public.runs_ranking)          as tope_del_ranking_en_miles_de_millones;

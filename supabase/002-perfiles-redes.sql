-- Redes sociales en el perfil. Correr una vez en el SQL Editor.
alter table public.profiles add column if not exists twitter text;
alter table public.profiles add column if not exists linkedin text;

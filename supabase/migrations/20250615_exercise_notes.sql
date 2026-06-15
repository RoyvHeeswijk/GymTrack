-- Notities per oefening binnen een training (canonieke oefeningnaam -> tekst)
alter table public.workouts
  add column if not exists exercise_notes jsonb not null default '{}'::jsonb;

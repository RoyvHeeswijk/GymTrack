-- GymTrack databaseschema
-- Voer dit script uit in de SQL Editor van je Supabase-project
-- (Dashboard > SQL Editor > New query > plak dit script > Run).

-- Oefeningen: per gebruiker een eigen oefeningenbibliotheek
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- Trainingen (workouts)
create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'Training',
  performed_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

-- Sets: gekoppeld aan een training en een oefening
create table if not exists public.sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id) on delete cascade,
  set_number int not null,
  reps int not null check (reps > 0),
  weight_kg numeric(6, 2) not null check (weight_kg >= 0),
  created_at timestamptz not null default now()
);

create index if not exists sets_workout_id_idx on public.sets (workout_id);
create index if not exists sets_exercise_id_idx on public.sets (exercise_id);
create index if not exists workouts_user_performed_idx on public.workouts (user_id, performed_at desc);

-- Row Level Security: iedere gebruiker ziet en beheert alleen zijn eigen data
alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.sets enable row level security;

create policy "Eigen oefeningen lezen" on public.exercises
  for select using (auth.uid() = user_id);
create policy "Eigen oefeningen aanmaken" on public.exercises
  for insert with check (auth.uid() = user_id);
create policy "Eigen oefeningen wijzigen" on public.exercises
  for update using (auth.uid() = user_id);
create policy "Eigen oefeningen verwijderen" on public.exercises
  for delete using (auth.uid() = user_id);

create policy "Eigen trainingen lezen" on public.workouts
  for select using (auth.uid() = user_id);
create policy "Eigen trainingen aanmaken" on public.workouts
  for insert with check (auth.uid() = user_id);
create policy "Eigen trainingen wijzigen" on public.workouts
  for update using (auth.uid() = user_id);
create policy "Eigen trainingen verwijderen" on public.workouts
  for delete using (auth.uid() = user_id);

create policy "Eigen sets lezen" on public.sets
  for select using (auth.uid() = user_id);
create policy "Eigen sets aanmaken" on public.sets
  for insert with check (auth.uid() = user_id);
create policy "Eigen sets wijzigen" on public.sets
  for update using (auth.uid() = user_id);
create policy "Eigen sets verwijderen" on public.sets
  for delete using (auth.uid() = user_id);

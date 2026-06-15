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
  exercise_notes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Gebruikersprofiel (weergavenaam)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Eigen profiel lezen" on public.profiles
  for select using (auth.uid() = id);
create policy "Eigen profiel aanmaken" on public.profiles
  for insert with check (auth.uid() = id);
create policy "Eigen profiel wijzigen" on public.profiles
  for update using (auth.uid() = id);

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

-- Trainingsschema's gegenereerd door de AI Schema-Architect
create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  goal text,
  days jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.plans enable row level security;

create policy "Eigen plannen lezen" on public.plans
  for select using (auth.uid() = user_id);
create policy "Eigen plannen aanmaken" on public.plans
  for insert with check (auth.uid() = user_id);
create policy "Eigen plannen wijzigen" on public.plans
  for update using (auth.uid() = user_id);
create policy "Eigen plannen verwijderen" on public.plans
  for delete using (auth.uid() = user_id);

-- Agenda/weekschema: koppelt trainingsdagen aan dagen van de week
create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  goal text,
  days jsonb not null,            -- snapshot van de PlanDay[]
  assignments jsonb not null,     -- lengte 7 (ma..zo); index in days of null = rustdag
  session_minutes int not null default 60,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists schedules_user_active_idx on public.schedules (user_id, is_active);

alter table public.schedules enable row level security;

create policy "Eigen agenda lezen" on public.schedules
  for select using (auth.uid() = user_id);
create policy "Eigen agenda aanmaken" on public.schedules
  for insert with check (auth.uid() = user_id);
create policy "Eigen agenda wijzigen" on public.schedules
  for update using (auth.uid() = user_id);
create policy "Eigen agenda verwijderen" on public.schedules
  for delete using (auth.uid() = user_id);

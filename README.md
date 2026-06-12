# GymTrack — Prototype

GymTrack is een mobiele (web-)fitness-app voor jongvolwassen krachtsporters. De app richt zich op
wat de doelgroep volgens het onderzoek het belangrijkst vindt: **eenvoudig trainingen loggen,
overzicht behouden en gemotiveerd blijven door zichtbare progressie**.

## Functionaliteiten

- Snel en eenvoudig trainingen loggen (oefening, sets, herhalingen, gewicht)
- Dashboard met statistieken, persoonlijke records en mijlpalen
- Visuele progressiegrafieken per oefening (zwaarste set, geschatte 1RM, volume)
- Trainingsgeschiedenis met details per training
- Accounts en dataopslag via Supabase (auth + database met Row Level Security)

## Techniek

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (mobiele layout, max-breedte gecentreerd)
- Supabase (authenticatie + PostgreSQL-database)
- Recharts (progressiegrafieken)

## Installatie

### 1. Supabase instellen

1. Maak een gratis project aan op [supabase.com](https://supabase.com).
2. Open in het dashboard de **SQL Editor** en voer het script `supabase/schema.sql` uit.
   Dit maakt de tabellen `exercises`, `workouts` en `sets` aan, inclusief RLS-policies
   zodat iedere gebruiker alleen zijn eigen data kan zien.
3. (Optioneel, handig voor demo's) Zet onder **Authentication > Providers > Email** de optie
   "Confirm email" uit, zodat je direct kunt inloggen na registratie.

### 2. App configureren

1. Kopieer `.env.example` naar `.env`.
2. Vul `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` in. Deze vind je in het
   Supabase-dashboard onder **Project Settings > API**.

### 3. Starten

```bash
npm install
npm run dev
```

De app draait dan op `http://localhost:5173`. Voor de beste demo-ervaring: open de browser
devtools en zet de weergave op een mobiel formaat, of open de app op je telefoon
(zelfde netwerk, `npm run dev -- --host`).

## Projectstructuur

```
src/
  components/Layout.tsx     # App-shell met header en mobiele tab-navigatie
  context/AuthContext.tsx   # Supabase-auth state
  hooks/useWorkouts.ts      # Trainingen laden
  lib/
    supabase.ts             # Supabase-client
    api.ts                  # Datalaag (CRUD voor trainingen/oefeningen/sets)
    stats.ts                # PR's, mijlpalen, progressie- en dashboardberekeningen
    types.ts                # Gedeelde types
  pages/
    AuthPage.tsx            # Inloggen / registreren
    DashboardPage.tsx       # Overzicht, PR's en mijlpalen
    LogWorkoutPage.tsx      # Training loggen
    ProgressPage.tsx        # Progressiegrafieken per oefening
    HistoryPage.tsx         # Trainingsgeschiedenis
supabase/schema.sql         # Databaseschema + RLS-policies
```

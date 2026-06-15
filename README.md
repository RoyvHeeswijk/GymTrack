# GymTrack — AI Visuele Workout Planner & Tracker (Prototype)

GymTrack is een mobiele (web-)fitness-app voor jongvolwassen krachtsporters die verder gaat dan
traditionele tracking: een AI-gedreven, visuele workout planner en tracker die de volledige
trainingscyclus ondersteunt — van het ontwerpen van een schema tot begeleiding tijdens de workout
en automatische analyse van progressie.

## Functionaliteiten

**AI Schema-Architect (voor de workout)**
- Doel, frequentie en beperkingen invoeren in natuurlijke taal (bijv. "3x per week spiermassa,
  maar ik heb een knieblessure")
- Automatisch gegenereerd, gestructureerd trainingsschema met onderbouwing
- 3D-lichaamsweergave met spier-heatmap van de weekbelasting
- Balansanalyse: detectie van onder-/overbelasting en push/pull-verhouding
- Schema's opslaan in je account

**Frictionless Workout Experience (tijdens de training)**
- Herkenning van synoniemen en informele benamingen ("benchen" → Bench press)
- Per oefening: uitvoeringsstappen, betrokken spiergroepen (incl. 3D-weergave) en korte form cues
- Historische prestaties (gewicht, reps, sets) direct zichtbaar tijdens het loggen

**Dynamische Gym Intelligence**
- "Apparaat bezet?"-knop: directe alternatieven met dezelfde spiergroep en trainingsdoelstelling,
  met één tik in te wisselen

**AI Progressie & Analyse (na de training)**
- Automatische samenvatting van de laatste training in begrijpelijke taal
- Detectie van nieuwe records en volumeveranderingen
- Trendanalyse per oefening: vooruitgang, stagnatie of achteruitgang
- 3D-spierheatmap van de belaste spiergroepen per training

**Basis**
- Snel trainingen loggen, dashboard met PR's en mijlpalen, progressiegrafieken,
  trainingsgeschiedenis
- Accounts en dataopslag via Supabase (auth + database met Row Level Security)

> De "AI" in dit prototype is regelgebaseerd: natural language parsing, schemageneratie,
> synoniemherkenning en trendanalyse draaien lokaal op een kennisbank van 35+ oefeningen met
> spieractivatieprofielen. Hierdoor is het prototype altijd demonstreerbaar zonder API-kosten.

## Techniek

- React 19 + TypeScript + Vite
- Tailwind CSS v4 (mobiele layout, max-breedte gecentreerd)
- Supabase (authenticatie + PostgreSQL-database)
- three.js / React Three Fiber (3D-lichaamsmodel met spier-heatmap)
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
  components/
    Layout.tsx              # App-shell met header en mobiele tab-navigatie
    Body3D.tsx              # 3D-lichaamsmodel met spier-heatmap (three.js)
    ExerciseCoach.tsx       # Workout-coach: uitvoering, cues, historie, alternatieven
  context/AuthContext.tsx   # Supabase-auth state
  hooks/useWorkouts.ts      # Trainingen laden
  lib/
    supabase.ts             # Supabase-client
    api.ts                  # Datalaag (trainingen, oefeningen, sets, schema's)
    muscles.ts              # Spiergroepen en activatiemodel
    exerciseDb.ts           # Kennisbank: 35+ oefeningen, synoniemen, cues, alternatieven
    planner.ts              # AI Schema-Architect: NL-parsing, generatie, balansanalyse
    analysis.ts             # AI Progressie & Analyse: trends, stagnatie, samenvattingen
    stats.ts                # PR's, mijlpalen, progressie- en dashboardberekeningen
    types.ts                # Gedeelde types
  pages/
    AuthPage.tsx            # Inloggen / registreren
    DashboardPage.tsx       # Overzicht, AI-analyse, PR's en mijlpalen
    PlannerPage.tsx         # AI Schema-Architect met 3D-weekheatmap
    LogWorkoutPage.tsx      # Training loggen met coach en gym intelligence
    ProgressPage.tsx        # Progressiegrafieken + trendanalyse per oefening
    HistoryPage.tsx         # Trainingsgeschiedenis
supabase/schema.sql         # Databaseschema + RLS-policies
```

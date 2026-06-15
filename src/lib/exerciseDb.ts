import type { MuscleActivation } from './muscles'

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight'

export interface ExerciseInfo {
  /** Canonieke naam zoals getoond in de app. */
  name: string
  /** Synoniemen en informele benamingen (lowercase) voor herkenning. */
  synonyms: string[]
  equipment: Equipment
  /** Activatie per spiergroep (0..1), primair >= 0.7. */
  muscles: MuscleActivation
  /** Korte uitvoeringsstappen. */
  steps: string[]
  /** Korte, directe form cues. */
  cues: string[]
  /** Namen van goede alternatieven (zelfde spiergroep/doel). */
  alternatives: string[]
  /** Compound = meergewrichtsoefening. */
  compound: boolean
}

export const EXERCISE_DB: ExerciseInfo[] = [
  {
    name: 'Squat',
    synonyms: ['back squat', 'barbell squat', 'squats', 'squatten', 'kniebuiging'],
    equipment: 'barbell',
    muscles: { quads: 1, glutes: 0.8, hamstrings: 0.4, lowerBack: 0.3, abs: 0.2 },
    steps: [
      'Plaats de stang op je bovenrug en stap uit het rek',
      'Zet je voeten op schouderbreedte, tenen licht naar buiten',
      'Zak gecontroleerd tot je heupen onder kniehoogte zijn',
      'Druk jezelf krachtig omhoog via je hielen',
    ],
    cues: ['Borst hoog', 'Knieën naar buiten', 'Hele voet aan de grond'],
    alternatives: ['Leg press', 'Goblet squat', 'Hack squat', 'Bulgarian split squat'],
    compound: true,
  },
  {
    name: 'Deadlift',
    synonyms: ['conventional deadlift', 'deadliften', 'dl', 'dode lift'],
    equipment: 'barbell',
    muscles: { hamstrings: 0.9, glutes: 1, lowerBack: 0.8, traps: 0.5, forearms: 0.5, lats: 0.4, quads: 0.4 },
    steps: [
      'Sta met je middenvoet onder de stang',
      'Pak de stang net buiten je benen, schouders boven de stang',
      'Zet je rug recht en duw de grond van je weg',
      'Strek heupen en knieën tegelijk tot je rechtop staat',
    ],
    cues: ['Rug neutraal', 'Stang dicht bij het lichaam', 'Heupen en schouders samen omhoog'],
    alternatives: ['Romanian deadlift', 'Trap bar deadlift', 'Hip thrust', 'Back extension'],
    compound: true,
  },
  {
    name: 'Bench press',
    synonyms: ['bankdrukken', 'flat bench', 'benchen', 'bench', 'barbell bench press'],
    equipment: 'barbell',
    muscles: { chest: 1, triceps: 0.6, frontDelts: 0.5 },
    steps: [
      'Lig op de bank met je voeten plat op de grond',
      'Pak de stang iets breder dan schouderbreedte',
      'Laat de stang gecontroleerd zakken naar je borst',
      'Druk de stang omhoog tot je armen gestrekt zijn',
    ],
    cues: ['Schouderbladen samenknijpen', 'Ellebogen ±45 graden', 'Voeten stevig op de grond'],
    alternatives: ['Dumbbell press', 'Machine chest press', 'Push-up', 'Incline dumbbell press'],
    compound: true,
  },
  {
    name: 'Overhead press',
    synonyms: ['military press', 'ohp', 'schouderdrukken', 'shoulder press', 'barbell press'],
    equipment: 'barbell',
    muscles: { frontDelts: 1, sideDelts: 0.6, triceps: 0.6, abs: 0.3, traps: 0.3 },
    steps: [
      'Pak de stang op schouderhoogte, handen net buiten schouderbreedte',
      'Span je billen en buik aan voor stabiliteit',
      'Druk de stang recht omhoog langs je gezicht',
      'Strek volledig uit boven je hoofd',
    ],
    cues: ['Ribben omlaag', 'Hoofd door het raam', 'Billen aanspannen'],
    alternatives: ['Dumbbell shoulder press', 'Machine shoulder press', 'Arnold press'],
    compound: true,
  },
  {
    name: 'Barbell row',
    synonyms: ['bent over row', 'roeien met stang', 'bb row', 'rows', 'barbell rows'],
    equipment: 'barbell',
    muscles: { lats: 0.9, upperBack: 1, rearDelts: 0.5, biceps: 0.5, lowerBack: 0.4, forearms: 0.4 },
    steps: [
      'Buig voorover met een rechte rug, stang in de handen',
      'Laat de stang hangen onder je schouders',
      'Trek de stang naar je onderbuik',
      'Laat gecontroleerd zakken en herhaal',
    ],
    cues: ['Rug recht houden', 'Ellebogen langs het lichaam', 'Knijp je schouderbladen samen'],
    alternatives: ['Seated cable row', 'Dumbbell row', 'Machine row', 'T-bar row'],
    compound: true,
  },
  {
    name: 'Pull-up',
    synonyms: ['pullup', 'optrekken', 'pull ups', 'chin-up', 'chinup', 'kin over de stang'],
    equipment: 'bodyweight',
    muscles: { lats: 1, biceps: 0.6, upperBack: 0.6, rearDelts: 0.3, forearms: 0.5, abs: 0.2 },
    steps: [
      'Hang aan de stang met gestrekte armen',
      'Trek je borst richting de stang',
      'Breng je kin boven de stang',
      'Zak gecontroleerd terug naar gestrekte armen',
    ],
    cues: ['Schouders laag', 'Ellebogen naar je zij trekken', 'Geen zwaai'],
    alternatives: ['Lat pulldown', 'Assisted pull-up', 'Inverted row'],
    compound: true,
  },
  {
    name: 'Lat pulldown',
    synonyms: ['pulldown', 'lat pull down', 'lat machine', 'pull down'],
    equipment: 'cable',
    muscles: { lats: 1, biceps: 0.5, upperBack: 0.4, rearDelts: 0.3, forearms: 0.3 },
    steps: [
      'Pak de stang breder dan schouderbreedte',
      'Ga zitten met je bovenbenen onder de steun',
      'Trek de stang naar je bovenborst',
      'Laat gecontroleerd terugkomen tot gestrekte armen',
    ],
    cues: ['Borst hoog', 'Ellebogen naar beneden sturen', 'Niet naar achteren leunen'],
    alternatives: ['Pull-up', 'Machine pulldown', 'Straight-arm pulldown'],
    compound: true,
  },
  {
    name: 'Leg press',
    synonyms: ['beenpers', 'legpress', 'leg pres'],
    equipment: 'machine',
    muscles: { quads: 1, glutes: 0.6, hamstrings: 0.3, calves: 0.2 },
    steps: [
      'Zet je voeten op schouderbreedte op het platform',
      'Laat het gewicht gecontroleerd zakken tot ±90 graden',
      'Druk het platform weg zonder je knieën op slot te zetten',
    ],
    cues: ['Onderrug tegen de leuning', 'Knieën in lijn met je tenen', 'Niet volledig op slot'],
    alternatives: ['Squat', 'Hack squat', 'Goblet squat', 'Lunge'],
    compound: true,
  },
  {
    name: 'Romanian deadlift',
    synonyms: ['rdl', 'stiff leg deadlift', 'roemeense deadlift', 'romanian dl'],
    equipment: 'barbell',
    muscles: { hamstrings: 1, glutes: 0.8, lowerBack: 0.5, forearms: 0.3 },
    steps: [
      'Houd de stang voor je heupen, knieën licht gebogen',
      'Duw je heupen naar achteren en laat de stang langs je benen zakken',
      'Voel de rek in je hamstrings',
      'Kom terug omhoog door je heupen naar voren te duwen',
    ],
    cues: ['Heupen naar achteren', 'Stang dicht bij de benen', 'Rug recht'],
    alternatives: ['Deadlift', 'Leg curl', 'Good morning', 'Hip thrust'],
    compound: true,
  },
  {
    name: 'Hip thrust',
    synonyms: ['hip thrusts', 'glute bridge', 'heupstoot'],
    equipment: 'barbell',
    muscles: { glutes: 1, hamstrings: 0.5, quads: 0.2 },
    steps: [
      'Leun met je bovenrug op een bank, stang op je heupen',
      'Zet je voeten plat op de grond',
      'Duw je heupen omhoog tot je lichaam een rechte lijn vormt',
      'Knijp bovenin je billen samen en zak gecontroleerd',
    ],
    cues: ['Kin intrekken', 'Volledig strekken bovenin', 'Hielen in de grond drukken'],
    alternatives: ['Glute bridge', 'Romanian deadlift', 'Cable kickback'],
    compound: true,
  },
  {
    name: 'Incline dumbbell press',
    synonyms: ['incline press', 'incline db press', 'schuin bankdrukken', 'incline bench'],
    equipment: 'dumbbell',
    muscles: { chest: 1, frontDelts: 0.6, triceps: 0.5 },
    steps: [
      'Stel de bank in op 30-45 graden',
      'Start met de dumbbells op schouderhoogte',
      'Druk de dumbbells omhoog tot boven je borst',
      'Laat gecontroleerd zakken tot borsthoogte',
    ],
    cues: ['Schouderbladen samen', 'Niet te steile bank', 'Dumbbells licht naar elkaar toe'],
    alternatives: ['Bench press', 'Machine chest press', 'Push-up'],
    compound: true,
  },
  {
    name: 'Dumbbell press',
    synonyms: ['db press', 'flat dumbbell press', 'dumbbell bench press', 'dumbell press'],
    equipment: 'dumbbell',
    muscles: { chest: 1, triceps: 0.55, frontDelts: 0.5 },
    steps: [
      'Lig plat op de bank met een dumbbell in elke hand',
      'Start op borsthoogte met de ellebogen ±45 graden',
      'Druk de dumbbells omhoog tot gestrekte armen',
      'Laat gecontroleerd zakken',
    ],
    cues: ['Polsen recht', 'Controle in de daling', 'Voeten stevig op de grond'],
    alternatives: ['Bench press', 'Machine chest press', 'Incline dumbbell press'],
    compound: true,
  },
  {
    name: 'Bicep curl',
    synonyms: ['curl', 'curls', 'biceps curl', 'dumbbell curl', 'krullen', 'bicep curls'],
    equipment: 'dumbbell',
    muscles: { biceps: 1, forearms: 0.4 },
    steps: [
      'Sta rechtop met een dumbbell in elke hand',
      'Krul de dumbbells omhoog zonder je ellebogen te bewegen',
      'Knijp bovenin je biceps samen',
      'Laat gecontroleerd zakken',
    ],
    cues: ['Ellebogen stil langs je zij', 'Geen zwaai vanuit de rug', 'Volledig strekken onderin'],
    alternatives: ['Cable curl', 'Hammer curl', 'Preacher curl', 'Barbell curl'],
    compound: false,
  },
  {
    name: 'Hammer curl',
    synonyms: ['hammer curls', 'neutrale curl', 'hamercurl'],
    equipment: 'dumbbell',
    muscles: { biceps: 0.9, forearms: 0.7 },
    steps: [
      'Houd de dumbbells met een neutrale grip (duimen omhoog)',
      'Krul omhoog met de ellebogen langs je zij',
      'Laat gecontroleerd zakken',
    ],
    cues: ['Polsen neutraal houden', 'Geen momentum gebruiken'],
    alternatives: ['Bicep curl', 'Cable curl', 'Reverse curl'],
    compound: false,
  },
  {
    name: 'Tricep pushdown',
    synonyms: ['pushdown', 'triceps pushdown', 'rope pushdown', 'cable pushdown', 'triceps duwen'],
    equipment: 'cable',
    muscles: { triceps: 1 },
    steps: [
      'Pak het touw of de stang op borsthoogte',
      'Houd je ellebogen langs je zij',
      'Duw het gewicht omlaag tot gestrekte armen',
      'Laat gecontroleerd terugkomen',
    ],
    cues: ['Ellebogen stil', 'Volledig strekken onderin', 'Lichaam stil houden'],
    alternatives: ['Skull crusher', 'Overhead tricep extension', 'Dips', 'Close-grip bench press'],
    compound: false,
  },
  {
    name: 'Skull crusher',
    synonyms: ['skullcrusher', 'lying tricep extension', 'french press'],
    equipment: 'barbell',
    muscles: { triceps: 1 },
    steps: [
      'Lig op een bank met de stang boven je borst',
      'Buig alleen je ellebogen en laat de stang naar je voorhoofd zakken',
      'Strek je armen weer volledig uit',
    ],
    cues: ['Ellebogen naar binnen', 'Langzame daling', 'Bovenarmen stil'],
    alternatives: ['Tricep pushdown', 'Overhead tricep extension', 'Close-grip bench press'],
    compound: false,
  },
  {
    name: 'Lateral raise',
    synonyms: ['side raise', 'zijwaarts heffen', 'lateral raises', 'side lateral raise', 'zijschouder'],
    equipment: 'dumbbell',
    muscles: { sideDelts: 1, frontDelts: 0.2, traps: 0.2 },
    steps: [
      'Sta rechtop met een lichte dumbbell in elke hand',
      'Hef je armen zijwaarts tot schouderhoogte',
      'Laat gecontroleerd zakken',
    ],
    cues: ['Lichte buiging in de ellebogen', 'Niet hoger dan schouderhoogte', 'Geen zwaai'],
    alternatives: ['Cable lateral raise', 'Machine lateral raise', 'Upright row'],
    compound: false,
  },
  {
    name: 'Rear delt fly',
    synonyms: ['reverse fly', 'rear delt raise', 'achterste schouder fly', 'reverse pec deck'],
    equipment: 'dumbbell',
    muscles: { rearDelts: 1, upperBack: 0.4, traps: 0.3 },
    steps: [
      'Buig voorover met een rechte rug',
      'Hef de dumbbells zijwaarts met licht gebogen armen',
      'Knijp je schouderbladen samen bovenin',
    ],
    cues: ['Pinken iets omhoog', 'Klein gewicht, strakke uitvoering'],
    alternatives: ['Face pull', 'Reverse pec deck', 'Cable rear delt fly'],
    compound: false,
  },
  {
    name: 'Face pull',
    synonyms: ['facepull', 'face pulls', 'gezichtstrek'],
    equipment: 'cable',
    muscles: { rearDelts: 1, upperBack: 0.5, traps: 0.4 },
    steps: [
      'Stel de kabel in op gezichtshoogte met een touw',
      'Trek het touw naar je gezicht, handen uit elkaar',
      'Eindig met je ellebogen hoog en naar achteren',
    ],
    cues: ['Ellebogen hoog', 'Duimen naar achteren wijzen', 'Rustig tempo'],
    alternatives: ['Rear delt fly', 'Reverse pec deck', 'Band pull-apart'],
    compound: false,
  },
  {
    name: 'Leg curl',
    synonyms: ['hamstring curl', 'lying leg curl', 'seated leg curl', 'beencurl'],
    equipment: 'machine',
    muscles: { hamstrings: 1, calves: 0.2 },
    steps: [
      'Stel de machine in zodat het kussen op je achillespees rust',
      'Krul je hielen richting je billen',
      'Laat gecontroleerd terugkomen',
    ],
    cues: ['Heupen tegen het kussen', 'Volledige strekking onderin', 'Knijp bovenin'],
    alternatives: ['Romanian deadlift', 'Nordic curl', 'Good morning'],
    compound: false,
  },
  {
    name: 'Leg extension',
    synonyms: ['quad extension', 'beenstrekken', 'leg extensions'],
    equipment: 'machine',
    muscles: { quads: 1 },
    steps: [
      'Stel de machine in zodat het kussen op je scheenbeen rust',
      'Strek je benen volledig uit',
      'Laat gecontroleerd zakken',
    ],
    cues: ['Bovenin even vasthouden', 'Rug tegen de leuning', 'Gecontroleerd tempo'],
    alternatives: ['Squat', 'Leg press', 'Lunge', 'Bulgarian split squat'],
    compound: false,
  },
  {
    name: 'Lunge',
    synonyms: ['lunges', 'walking lunge', 'uitvalspas', 'uitvalspassen'],
    equipment: 'dumbbell',
    muscles: { quads: 0.9, glutes: 0.8, hamstrings: 0.4, calves: 0.2 },
    steps: [
      'Stap naar voren in een uitvalspas',
      'Zak tot beide knieën ±90 graden gebogen zijn',
      'Druk jezelf terug omhoog via je voorste been',
    ],
    cues: ['Romp rechtop', 'Knie boven de enkel', 'Grote stap nemen'],
    alternatives: ['Bulgarian split squat', 'Squat', 'Leg press', 'Step-up'],
    compound: true,
  },
  {
    name: 'Bulgarian split squat',
    synonyms: ['split squat', 'bss', 'bulgaarse squat', 'bulgarian'],
    equipment: 'dumbbell',
    muscles: { quads: 1, glutes: 0.9, hamstrings: 0.3 },
    steps: [
      'Plaats je achterste voet op een bank',
      'Zak recht naar beneden op je voorste been',
      'Druk omhoog via je voorste hiel',
    ],
    cues: ['Voorste voet ver genoeg naar voren', 'Romp licht voorover', 'Gecontroleerd zakken'],
    alternatives: ['Lunge', 'Squat', 'Leg press', 'Step-up'],
    compound: true,
  },
  {
    name: 'Calf raise',
    synonyms: ['calf raises', 'kuit heffen', 'standing calf raise', 'kuiten'],
    equipment: 'machine',
    muscles: { calves: 1 },
    steps: [
      'Sta met de bal van je voeten op een verhoging',
      'Zak met je hielen onder het niveau van je tenen',
      'Druk jezelf zo hoog mogelijk omhoog op je tenen',
    ],
    cues: ['Volledig rekken onderin', 'Even vasthouden bovenin', 'Geen veren'],
    alternatives: ['Seated calf raise', 'Leg press calf raise'],
    compound: false,
  },
  {
    name: 'Plank',
    synonyms: ['planken', 'plank hold', 'core plank'],
    equipment: 'bodyweight',
    muscles: { abs: 1, obliques: 0.5, lowerBack: 0.3 },
    steps: [
      'Steun op je onderarmen en tenen',
      'Houd je lichaam in een rechte lijn',
      'Span je buik en billen aan en houd vol',
    ],
    cues: ['Heupen niet laten zakken', 'Niet met je billen omhoog', 'Rustig blijven ademen'],
    alternatives: ['Dead bug', 'Ab wheel rollout', 'Hanging knee raise'],
    compound: false,
  },
  {
    name: 'Hanging knee raise',
    synonyms: ['knee raise', 'hanging leg raise', 'beenheffen', 'leg raise'],
    equipment: 'bodyweight',
    muscles: { abs: 1, obliques: 0.4, forearms: 0.3 },
    steps: [
      'Hang aan een stang met gestrekte armen',
      'Trek je knieën richting je borst',
      'Laat gecontroleerd zakken zonder te zwaaien',
    ],
    cues: ['Bekken kantelen', 'Geen zwaai', 'Langzaam zakken'],
    alternatives: ['Plank', 'Cable crunch', 'Ab wheel rollout'],
    compound: false,
  },
  {
    name: 'Cable crunch',
    synonyms: ['kabel crunch', 'rope crunch', 'kneeling crunch'],
    equipment: 'cable',
    muscles: { abs: 1, obliques: 0.3 },
    steps: [
      'Kniel voor de kabel met het touw achter je hoofd',
      'Krul je romp naar beneden richting je knieën',
      'Kom gecontroleerd terug omhoog',
    ],
    cues: ['Beweeg vanuit je buik, niet je armen', 'Heupen stil houden'],
    alternatives: ['Plank', 'Hanging knee raise', 'Crunch'],
    compound: false,
  },
  {
    name: 'Seated cable row',
    synonyms: ['cable row', 'zittend roeien', 'seated row', 'low row'],
    equipment: 'cable',
    muscles: { upperBack: 1, lats: 0.8, biceps: 0.5, rearDelts: 0.4 },
    steps: [
      'Ga zitten met je voeten op de steunen',
      'Pak de handgreep met gestrekte armen',
      'Trek de handgreep naar je onderbuik',
      'Laat gecontroleerd terugkomen',
    ],
    cues: ['Borst hoog', 'Schouderbladen samenknijpen', 'Niet meeleunen'],
    alternatives: ['Barbell row', 'Machine row', 'Dumbbell row'],
    compound: true,
  },
  {
    name: 'Dumbbell row',
    synonyms: ['db row', 'one arm row', 'eenarmig roeien', 'single arm row'],
    equipment: 'dumbbell',
    muscles: { lats: 0.9, upperBack: 0.9, biceps: 0.5, rearDelts: 0.4 },
    steps: [
      'Steun met één hand en knie op een bank',
      'Laat de dumbbell hangen onder je schouder',
      'Trek de dumbbell naar je heup',
      'Laat gecontroleerd zakken',
    ],
    cues: ['Rug recht', 'Elleboog langs het lichaam', 'Niet draaien met de romp'],
    alternatives: ['Barbell row', 'Seated cable row', 'Machine row'],
    compound: true,
  },
  {
    name: 'Chest fly',
    synonyms: ['fly', 'flyes', 'dumbbell fly', 'pec deck', 'cable fly', 'flies'],
    equipment: 'cable',
    muscles: { chest: 1, frontDelts: 0.3 },
    steps: [
      'Sta tussen twee kabels of lig met dumbbells op een bank',
      'Open je armen wijd met licht gebogen ellebogen',
      'Breng je handen voor je borst samen',
    ],
    cues: ['Licht gebogen ellebogen vasthouden', 'Rek voelen op de borst', 'Knijp in het midden'],
    alternatives: ['Pec deck', 'Bench press', 'Push-up'],
    compound: false,
  },
  {
    name: 'Push-up',
    synonyms: ['pushup', 'opdrukken', 'push ups', 'press up'],
    equipment: 'bodyweight',
    muscles: { chest: 0.9, triceps: 0.6, frontDelts: 0.5, abs: 0.3 },
    steps: [
      'Plaats je handen iets breder dan schouderbreedte',
      'Houd je lichaam in een rechte lijn',
      'Zak tot je borst bijna de grond raakt',
      'Druk jezelf krachtig omhoog',
    ],
    cues: ['Lichaam als een plank', 'Ellebogen ±45 graden', 'Volledige beweging'],
    alternatives: ['Bench press', 'Dumbbell press', 'Machine chest press'],
    compound: true,
  },
  {
    name: 'Dips',
    synonyms: ['dip', 'dippen', 'tricep dips', 'chest dips'],
    equipment: 'bodyweight',
    muscles: { triceps: 0.9, chest: 0.7, frontDelts: 0.4 },
    steps: [
      'Steun op de parallelle stangen met gestrekte armen',
      'Zak gecontroleerd tot je ellebogen ±90 graden zijn',
      'Druk jezelf terug omhoog',
    ],
    cues: ['Schouders laag houden', 'Licht voorover voor borst, rechtop voor triceps'],
    alternatives: ['Close-grip bench press', 'Tricep pushdown', 'Push-up'],
    compound: true,
  },
  {
    name: 'Shrug',
    synonyms: ['shrugs', 'schouderophalen', 'dumbbell shrug', 'barbell shrug'],
    equipment: 'dumbbell',
    muscles: { traps: 1, forearms: 0.3 },
    steps: [
      'Houd de dumbbells langs je lichaam',
      'Trek je schouders recht omhoog richting je oren',
      'Houd kort vast en laat zakken',
    ],
    cues: ['Recht omhoog, niet rollen', 'Armen gestrekt houden'],
    alternatives: ['Barbell shrug', 'Trap bar shrug', 'Upright row'],
    compound: false,
  },
  {
    name: 'Back extension',
    synonyms: ['hyperextension', 'rugextensie', 'lower back extension', 'hyper'],
    equipment: 'bodyweight',
    muscles: { lowerBack: 1, glutes: 0.6, hamstrings: 0.5 },
    steps: [
      'Positioneer je heupen op het kussen van de bank',
      'Zak voorover met een rechte rug',
      'Kom omhoog tot je lichaam een rechte lijn vormt',
    ],
    cues: ['Niet overstrekken bovenin', 'Beweeg gecontroleerd'],
    alternatives: ['Romanian deadlift', 'Good morning', 'Deadlift'],
    compound: false,
  },
  {
    name: 'Goblet squat',
    synonyms: ['goblet', 'dumbbell squat', 'kettlebell squat'],
    equipment: 'dumbbell',
    muscles: { quads: 1, glutes: 0.7, abs: 0.3 },
    steps: [
      'Houd een dumbbell verticaal tegen je borst',
      'Zak in een diepe squat met je ellebogen binnen je knieën',
      'Druk jezelf omhoog via je hielen',
    ],
    cues: ['Borst hoog', 'Ellebogen binnen de knieën', 'Diep zakken'],
    alternatives: ['Squat', 'Leg press', 'Hack squat'],
    compound: true,
  },
]

const exerciseIndex = new Map<string, ExerciseInfo>()
for (const exercise of EXERCISE_DB) {
  exerciseIndex.set(exercise.name.toLowerCase(), exercise)
  for (const synonym of exercise.synonyms) {
    exerciseIndex.set(synonym.toLowerCase(), exercise)
  }
}

function normalize(input: string): string {
  return input.toLowerCase().trim().replace(/\s+/g, ' ')
}

/**
 * Herkent een oefening op basis van naam, synoniem of informele benaming.
 * Probeert eerst exacte match, daarna deelstring-matching.
 */
export function recognizeExercise(input: string): ExerciseInfo | null {
  const query = normalize(input)
  if (!query) return null

  const exact = exerciseIndex.get(query)
  if (exact) return exact

  // Deelstring-match: "incline dumbel pres" -> beste overlap
  let best: ExerciseInfo | null = null
  let bestScore = 0
  for (const [key, exercise] of exerciseIndex) {
    let score = 0
    if (key.includes(query) || query.includes(key)) {
      score = Math.min(key.length, query.length) / Math.max(key.length, query.length)
    } else {
      // Woordoverlap voor typefouten als "dumbel pres"
      const queryWords = query.split(' ')
      const keyWords = key.split(' ')
      const matched = queryWords.filter((w) =>
        keyWords.some((kw) => kw.startsWith(w.slice(0, Math.max(3, w.length - 1)))),
      )
      score = matched.length / Math.max(queryWords.length, keyWords.length) - 0.1
    }
    if (score > bestScore) {
      bestScore = score
      best = exercise
    }
  }
  return bestScore >= 0.45 ? best : null
}

export function getExerciseInfo(name: string): ExerciseInfo | null {
  return exerciseIndex.get(normalize(name)) ?? null
}

/** Alternatieven voor een oefening (Dynamische Gym Intelligence). */
export function getAlternatives(name: string): ExerciseInfo[] {
  const exercise = recognizeExercise(name)
  if (!exercise) return []
  return exercise.alternatives
    .map((alt) => getExerciseInfo(alt))
    .filter((e): e is ExerciseInfo => e !== null)
}

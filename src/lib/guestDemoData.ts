import type { Schedule } from './api'
import type { WorkoutWithSets } from './types'
import { GUEST_USER_ID } from './guestMode'

const now = new Date()
const daysAgo = (n: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

/** Voorbeeldagenda voor portfolio / gast-modus. */
export function getGuestSchedule(): Schedule {
  return {
    id: 'guest-schedule',
    user_id: GUEST_USER_ID,
    title: 'Push / Pull / Legs',
    goal: 'spiermassa',
    days: [
      {
        title: 'Push',
        focus: 'Borst, schouders, triceps',
        exercises: [
          { name: 'Bench press', sets: 4, reps: '6-10' },
          { name: 'Overhead press', sets: 3, reps: '8-12' },
          { name: 'Incline dumbbell press', sets: 3, reps: '8-12' },
          { name: 'Tricep pushdown', sets: 3, reps: '10-15' },
        ],
      },
      {
        title: 'Pull',
        focus: 'Rug, biceps',
        exercises: [
          { name: 'Barbell row', sets: 4, reps: '6-10' },
          { name: 'Lat pulldown', sets: 3, reps: '8-12' },
          { name: 'Seated cable row', sets: 3, reps: '10-12' },
          { name: 'Bicep curl', sets: 3, reps: '10-15' },
        ],
      },
      {
        title: 'Legs',
        focus: 'Quads, hamstrings, glutes',
        exercises: [
          { name: 'Squat', sets: 4, reps: '6-10' },
          { name: 'Romanian deadlift', sets: 3, reps: '8-12' },
          { name: 'Leg press', sets: 3, reps: '10-12' },
          { name: 'Calf raise', sets: 4, reps: '12-15' },
        ],
      },
    ],
    assignments: [0, null, 1, null, 2, null, null],
    session_minutes: 60,
    is_active: true,
    created_at: daysAgo(14),
  }
}

/** Voorbeeldtrainingen voor portfolio / gast-modus. */
export function getGuestWorkouts(): WorkoutWithSets[] {
  return [
    {
      id: 'guest-w1',
      user_id: GUEST_USER_ID,
      name: 'Pull',
      performed_at: daysAgo(2),
      notes: null,
      exercise_notes: null,
      created_at: daysAgo(2),
      sets: [
        {
          id: 'gs1',
          user_id: GUEST_USER_ID,
          workout_id: 'guest-w1',
          exercise_id: 'ge1',
          set_number: 1,
          reps: 8,
          weight_kg: 70,
          created_at: daysAgo(2),
          exercise_name: 'Barbell row',
        },
        {
          id: 'gs2',
          user_id: GUEST_USER_ID,
          workout_id: 'guest-w1',
          exercise_id: 'ge1',
          set_number: 2,
          reps: 8,
          weight_kg: 72.5,
          created_at: daysAgo(2),
          exercise_name: 'Barbell row',
        },
        {
          id: 'gs3',
          user_id: GUEST_USER_ID,
          workout_id: 'guest-w1',
          exercise_id: 'ge2',
          set_number: 1,
          reps: 10,
          weight_kg: 55,
          created_at: daysAgo(2),
          exercise_name: 'Lat pulldown',
        },
      ],
    },
    {
      id: 'guest-w2',
      user_id: GUEST_USER_ID,
      name: 'Push',
      performed_at: daysAgo(4),
      notes: null,
      exercise_notes: null,
      created_at: daysAgo(4),
      sets: [
        {
          id: 'gs4',
          user_id: GUEST_USER_ID,
          workout_id: 'guest-w2',
          exercise_id: 'ge3',
          set_number: 1,
          reps: 6,
          weight_kg: 80,
          created_at: daysAgo(4),
          exercise_name: 'Bench press',
        },
        {
          id: 'gs5',
          user_id: GUEST_USER_ID,
          workout_id: 'guest-w2',
          exercise_id: 'ge3',
          set_number: 2,
          reps: 6,
          weight_kg: 82.5,
          created_at: daysAgo(4),
          exercise_name: 'Bench press',
        },
      ],
    },
    {
      id: 'guest-w3',
      user_id: GUEST_USER_ID,
      name: 'Legs',
      performed_at: daysAgo(7),
      notes: null,
      exercise_notes: null,
      created_at: daysAgo(7),
      sets: [
        {
          id: 'gs6',
          user_id: GUEST_USER_ID,
          workout_id: 'guest-w3',
          exercise_id: 'ge4',
          set_number: 1,
          reps: 5,
          weight_kg: 100,
          created_at: daysAgo(7),
          exercise_name: 'Squat',
        },
      ],
    },
  ]
}

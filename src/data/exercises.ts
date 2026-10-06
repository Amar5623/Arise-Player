/**
 * Every movement in the programme. Names, cues and form steps come from
 * docs/Calisthenics_Plan_Daily_Reference.docx; tracker names and units match the
 * Lists sheet of docs/Calisthenics_Tracker.xlsx. `npm run check:plan` verifies both.
 */
import type { Stat, Unit } from '@/engine/types';

export type TrackerUnit = 'reps' | 'sec' | 'reps / side' | 'sec / side' | 'steps / side' | 'rounds';

export interface ExerciseDef {
  id: string;
  name: string;
  /** Exact name in the tracker's Exercise dropdown. */
  trackerName: string;
  unit: Unit;
  /** Per-side work: log one side. */
  perSide: boolean;
  /** Steps rather than reps (lateral walk). */
  steps?: boolean;
  /** Tracker logs this in rounds (the app times each round). */
  rounds?: boolean;
  stat: Stat;
  /** One-line key cue (the docx day tables). */
  cue: string;
  /** Form guide, in order. */
  howTo: readonly string[];
}

export const youtubeUrl = (name: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} form tutorial`).replace(/%20/g, '+')}`;

export function trackerUnit(
  e: Pick<ExerciseDef, 'unit' | 'perSide' | 'steps' | 'rounds'>,
): TrackerUnit {
  if (e.rounds) return 'rounds';
  if (e.steps) return 'steps / side';
  if (e.unit === 'sec') return e.perSide ? 'sec / side' : 'sec';
  return e.perSide ? 'reps / side' : 'reps';
}

const E = (def: ExerciseDef) => def;

export const EXERCISES = {
  /* Warm-up and mobility */
  'cat-cow': E({
    id: 'cat-cow',
    name: 'Cat-cow',
    trackerName: 'Cat-cow',
    unit: 'reps',
    perSide: false,
    stat: 'AGI',
    cue: 'Spine mobility, reduces lower-back stiffness.',
    howTo: [
      'Hands under shoulders, knees under hips.',
      'Inhale: drop the belly, lift chest and tailbone.',
      'Exhale: round the whole spine and tuck the tailbone.',
      'Slow and smooth, no bouncing.',
    ],
  }),
  'hip-flexor-stretch': E({
    id: 'hip-flexor-stretch',
    name: 'Half-kneeling hip flexor stretch',
    trackerName: 'Half-kneeling hip flexor stretch',
    unit: 'sec',
    perSide: true,
    stat: 'AGI',
    cue: 'Squeeze the back glute and tuck the tailbone.',
    howTo: [
      'Kneel on a pad, other foot forward with the shin vertical.',
      'Squeeze the back-leg glute and tuck your tailbone under. This is what makes the stretch work.',
      'Shift forward slightly until the front of the back-leg hip stretches.',
      'Ribs down, do not arch the lower back.',
    ],
  }),
  'glute-bridge': E({
    id: 'glute-bridge',
    name: 'Glute bridge',
    trackerName: 'Glute bridge',
    unit: 'reps',
    perSide: false,
    stat: 'AGI',
    cue: 'Wakes up glutes (pelvic tilt, knock knees).',
    howTo: [
      'Lie on your back, knees bent, feet hip width, shins roughly vertical.',
      'Flatten your lower back into the floor (tuck pelvis) before you lift.',
      'Drive through the heels until shoulders, hips and knees form a line.',
      'Squeeze glutes for 2 seconds at the top, ribs down, then lower slowly.',
    ],
  }),
  'short-foot': E({
    id: 'short-foot',
    name: 'Short foot exercise',
    trackerName: 'Short foot exercise',
    unit: 'sec',
    perSide: true,
    stat: 'AGI',
    cue: 'Builds the arch, stops the foot collapsing (knock knees).',
    howTo: [
      'Foot flat on the floor (sitting first, then standing).',
      'Without curling toes, pull the ball of the foot towards the heel to lift the arch.',
      'Big toe, little toe and heel stay pressed down.',
      'Hold 10 seconds, relax, repeat.',
    ],
  }),
  'hip-switches': E({
    id: 'hip-switches',
    name: '90/90 hip switches',
    trackerName: '90/90 hip switches',
    unit: 'reps',
    perSide: true,
    stat: 'AGI',
    cue: 'Hip internal and external rotation balance (duck feet).',
    howTo: [
      'Sit with front shin and back shin each bent about 90 degrees.',
      'Keep your chest tall.',
      'Rotate both knees over to the other side, hands off the floor if you can.',
      'Move slowly, stop at a pinch, never into pain.',
    ],
  }),
  'dead-bug': E({
    id: 'dead-bug',
    name: 'Dead bug',
    trackerName: 'Dead bug',
    unit: 'reps',
    perSide: true,
    stat: 'AGI',
    cue: 'Anti-extension core control (pelvic tilt).',
    howTo: [
      'Lie on your back, arms up, hips and knees at 90 degrees.',
      'Press your lower back flat into the floor.',
      'Slowly extend the opposite arm and leg only as far as your back stays flat.',
      'Exhale as you extend, return, alternate sides.',
    ],
  }),
  'hamstring-stretch': E({
    id: 'hamstring-stretch',
    name: 'Lying hamstring stretch',
    trackerName: 'Lying hamstring stretch',
    unit: 'sec',
    perSide: true,
    stat: 'AGI',
    cue: 'Keep the pelvis flat, knee slightly soft.',
    howTo: [
      'Lie on your back, loop a towel or strap around one foot.',
      'Lift the leg until you feel the back of the thigh stretch.',
      'Keep the other leg and your pelvis flat on the floor.',
      'Hold 30-45 seconds per side, breathe slowly.',
    ],
  }),
  'deep-squat-hold': E({
    id: 'deep-squat-hold',
    name: 'Deep squat hold',
    trackerName: 'Deep squat hold',
    unit: 'sec',
    perSide: false,
    stat: 'AGI',
    cue: 'Heels down, elbows push knees out.',
    howTo: [
      'Feet slightly wider than shoulders, toes turned out 15-30 degrees.',
      'Sit as deep as is comfortable with heels down (put a rolled towel under heels if they lift).',
      'Push knees out with your elbows, chest up.',
      'Hold on to a post for support if needed and breathe.',
    ],
  }),
  'adductor-rock-back': E({
    id: 'adductor-rock-back',
    name: 'Adductor rock-back',
    trackerName: 'Adductor rock-back',
    unit: 'reps',
    perSide: true,
    stat: 'AGI',
    cue: 'Neutral spine, rock hips back.',
    howTo: [
      'Start on hands and knees, extend one leg straight to the side with the foot flat and toes forward.',
      'Keep the spine neutral (do not round).',
      'Rock hips back towards the heel of the bent leg until the inner thigh stretches.',
      'Pause 2 seconds, return, repeat, then switch sides.',
    ],
  }),
  'thoracic-extension': E({
    id: 'thoracic-extension',
    name: 'Thoracic extension over a chair',
    trackerName: 'Thoracic extension over a chair',
    unit: 'reps',
    perSide: false,
    stat: 'AGI',
    cue: 'Extend the upper back, keep the lower back quiet.',
    howTo: [
      'Sit on a chair with the back at mid-back height (or use a rolled towel).',
      'Hands behind the head to support the neck.',
      'Extend the upper back over the chair edge, exhale as you go.',
      'Lower back stays neutral. 8 slow reps.',
    ],
  }),

  /* Push */
  'pike-push-up': E({
    id: 'pike-push-up',
    name: 'Pike push-up',
    trackerName: 'Pike push-up',
    unit: 'reps',
    perSide: false,
    stat: 'STR',
    cue: 'Hips high, elbows track back not out.',
    howTo: [
      'Start in a downward-dog shape, hips high, hands shoulder width.',
      'Bend the elbows and lower the top of your head towards the floor between your hands.',
      'Elbows travel back at about 45 degrees, not flared.',
      'Press back up keeping hips high. If too hard, use a partial range and build depth.',
    ],
  }),
  dips: E({
    id: 'dips',
    name: 'Bench / chair dips',
    trackerName: 'Bench / chair dips',
    unit: 'reps',
    perSide: false,
    stat: 'STR',
    cue: 'Shoulders down, elbows back, stop at 90 degrees.',
    howTo: [
      'Hands on a sturdy bench behind you, fingers forward, shoulders away from your ears.',
      'Hips close to the bench, chest up.',
      'Bend elbows to about 90 degrees only (deeper stresses the shoulder), elbows pointing back.',
      'Press up. Bend your knees to make it easier. Stop if the front of the shoulder hurts.',
    ],
  }),
  'scapular-push-up': E({
    id: 'scapular-push-up',
    name: 'Scapular push-up',
    trackerName: 'Scapular push-up',
    unit: 'reps',
    perSide: false,
    stat: 'STR',
    cue: 'Only the shoulder blades move.',
    howTo: [
      'High plank, arms fully straight.',
      'Let the chest sink so the shoulder blades pinch together.',
      'Push the floor away to spread the blades wide.',
      'Elbows never bend.',
    ],
  }),

  /* Legs and hips */
  'reverse-lunge': E({
    id: 'reverse-lunge',
    name: 'Reverse lunge',
    trackerName: 'Reverse lunge',
    unit: 'reps',
    perSide: true,
    stat: 'STR',
    cue: 'Front knee tracks over toes, no caving in.',
    howTo: [
      'Stand tall, step back about one metre.',
      'Lower the back knee towards the floor, front shin near vertical.',
      'Front knee tracks over the 2nd-3rd toe, never caves inward.',
      'Push through the front heel to return. Torso upright, ribs down.',
    ],
  }),
  'side-lying-leg-raise': E({
    id: 'side-lying-leg-raise',
    name: 'Side-lying leg raise',
    trackerName: 'Side-lying leg raise',
    unit: 'reps',
    perSide: true,
    stat: 'AGI',
    cue: 'Toes forward, lift from the hip, no pelvis roll.',
    howTo: [
      'Lie on your side, bottom knee bent for stability, top leg straight and slightly behind your body.',
      'Toes point forward or slightly down (not up to the ceiling).',
      'Lift for 2 seconds, lower for 2 seconds.',
      'Do not roll the pelvis backwards. You should feel the side of the hip.',
    ],
  }),
  'lateral-walk': E({
    id: 'lateral-walk',
    name: 'Lateral walk',
    trackerName: 'Lateral walk (band or bodyweight)',
    unit: 'reps',
    perSide: true,
    steps: true,
    stat: 'AGI',
    cue: 'Half-squat, toes forward, knees pushed out.',
    howTo: [
      'Slight squat, feet hip width. Band above the knees if you have one.',
      'Toes face forward, knees pushed out.',
      'Step sideways without the trailing foot swinging in.',
      'Keep tension the whole time. No band: sink a little deeper.',
    ],
  }),
  'calf-raise': E({
    id: 'calf-raise',
    name: 'Calf raise',
    trackerName: 'Calf raise',
    unit: 'reps',
    perSide: false,
    stat: 'STR',
    cue: 'Straight up, do not roll the ankles outward.',
    howTo: [
      'Stand on the balls of the feet (edge of a step for more range).',
      'Rise as high as you can, straight up, ankles not rolling outward.',
      'Pause 1 second at the top, lower for 3 seconds.',
      'Move to single leg when two legs are easy.',
    ],
  }),
  'sl-glute-bridge': E({
    id: 'sl-glute-bridge',
    name: 'Single-leg glute bridge',
    trackerName: 'Single-leg glute bridge',
    unit: 'reps',
    perSide: true,
    stat: 'STR',
    cue: 'Hips level, drive through the heel.',
    howTo: [
      'Lie back, one foot flat, the other leg straight and thigh in line with the bent knee.',
      'Tuck the pelvis, then drive through the heel.',
      'Keep hips level. Do not let the pelvis rotate.',
      'Squeeze 2 seconds at the top.',
    ],
  }),
  'sl-rdl': E({
    id: 'sl-rdl',
    name: 'Single-leg Romanian deadlift',
    trackerName: 'Single-leg Romanian deadlift',
    unit: 'reps',
    perSide: true,
    stat: 'STR',
    cue: 'Hinge from the hip, flat back, hips square.',
    howTo: [
      'Stand on one leg with a soft knee (touch a wall for balance if needed).',
      'Hinge the hips back as the other leg rises behind you in line with your torso.',
      'Flat back, hips square to the floor. Do not reach for the floor.',
      'Stand up by squeezing the glute of the standing leg.',
    ],
  }),
  'cossack-squat': E({
    id: 'cossack-squat',
    name: 'Cossack squat',
    trackerName: 'Cossack squat',
    unit: 'reps',
    perSide: true,
    stat: 'STR',
    cue: 'Sit into one side, heel down, knee over toes.',
    howTo: [
      'Wide stance, about 1.5x shoulder width, toes slightly out.',
      'Shift to one side, bend that knee and sit down, the other leg straight (toes up or foot flat).',
      'Knee tracks over the toes, chest tall, heel down (hold a wall if needed).',
      'Go only as deep as you can control, push back to centre, switch sides.',
    ],
  }),
  'copenhagen-plank': E({
    id: 'copenhagen-plank',
    name: 'Copenhagen plank (short lever)',
    trackerName: 'Copenhagen plank (short lever)',
    unit: 'sec',
    perSide: true,
    stat: 'AGI',
    cue: 'Inner knee on the chair, hips lifted. Start gentle.',
    howTo: [
      'Side plank on your forearm, top leg bent with the inner knee on a chair or bench.',
      'Lift your hips so the body is in one line, bottom leg hangs free.',
      'Hold with the inner thigh working. Stop at any groin pain (adductors strain easily).',
      'Start with short holds and build slowly.',
    ],
  }),

  /* Pull and posture */
  'inverted-row': E({
    id: 'inverted-row',
    name: 'Inverted / table row',
    trackerName: 'Inverted / table row',
    unit: 'reps',
    perSide: false,
    stat: 'STR',
    cue: 'Body straight, pull chest to hands.',
    howTo: [
      'Lie under a very sturdy table or low bar and grip the edge, shoulder width. Make sure it cannot tip or break.',
      'Body straight from heels to head (bend knees to make it easier).',
      'Pull your chest to your hands, squeezing shoulder blades back.',
      'Lower slowly until the arms are fully straight.',
    ],
  }),
  'dead-hang': E({
    id: 'dead-hang',
    name: 'Dead hang',
    trackerName: 'Dead hang',
    unit: 'sec',
    perSide: false,
    stat: 'STR',
    cue: 'Blades slightly down, ribs down, breathe.',
    howTo: [
      'Overhand grip just outside shoulder width.',
      'Shoulders slightly active (blades down, not by your ears), ribs down, legs together.',
      'Breathe normally and hold.',
      'If your grip fails, step down. Build up to 45 seconds.',
    ],
  }),
  'prone-ytw': E({
    id: 'prone-ytw',
    name: 'Prone Y-T-W raises',
    trackerName: 'Prone Y-T-W raises',
    unit: 'reps',
    perSide: false,
    stat: 'AGI',
    cue: 'Lift only a few cm, squeeze blades down and back.',
    howTo: [
      'Lie face down, forehead on a towel, thumbs pointing up.',
      'Lift the arms into a Y, then a T, then a W, squeezing the shoulder blades each time.',
      'Lift only a few centimetres, neck stays neutral.',
      'Lightly squeeze the glutes, do not arch the lower back.',
    ],
  }),

  /* Core */
  plank: E({
    id: 'plank',
    name: 'Plank (posterior tilt)',
    trackerName: 'Plank (posterior tilt)',
    unit: 'sec',
    perSide: false,
    stat: 'AGI',
    cue: 'Tuck tailbone, squeeze glutes, ribs down.',
    howTo: [
      'Forearms under shoulders, body in one line.',
      'Tuck the tailbone slightly and squeeze glutes hard.',
      'Pull ribs down towards hips so the lower back does not sag.',
      'Stop the set when hips drop or the back arches.',
    ],
  }),
  'hollow-hold': E({
    id: 'hollow-hold',
    name: 'Hollow hold',
    trackerName: 'Hollow hold',
    unit: 'sec',
    perSide: false,
    stat: 'AGI',
    cue: 'Lower back glued to the floor.',
    howTo: [
      'Lie on your back, press the lower back into the floor.',
      'Arms overhead (or by your sides to make it easier), legs straight and low.',
      'Lift shoulders and legs off the floor while the lower back stays flat.',
      'Make it easier by bending the knees (tuck). Stop when the back arches.',
    ],
  }),
  'bird-dog': E({
    id: 'bird-dog',
    name: 'Bird dog',
    trackerName: 'Bird dog',
    unit: 'reps',
    perSide: true,
    stat: 'AGI',
    cue: 'Hips level, no lower back arch.',
    howTo: [
      'Hands under shoulders, knees under hips.',
      'Extend the opposite arm and leg to hip height with hips level.',
      'Imagine balancing a glass of water on your lower back.',
      'Hold 2 seconds, return slowly, alternate.',
    ],
  }),
  'knee-raise': E({
    id: 'knee-raise',
    name: 'Hanging / lying knee raise',
    trackerName: 'Hanging / lying knee raise',
    unit: 'reps',
    perSide: false,
    stat: 'AGI',
    cue: 'Curl the pelvis up, no swinging.',
    howTo: [
      'Hanging: start from an active hang. Lying version: knees bent, feet off the floor.',
      'Tuck the pelvis (posterior tilt) and curl the knees towards the chest using the lower abs.',
      'No swinging, no momentum.',
      'Lower slowly under control.',
    ],
  }),
  'side-plank': E({
    id: 'side-plank',
    name: 'Side plank',
    trackerName: 'Side plank',
    unit: 'sec',
    perSide: true,
    stat: 'AGI',
    cue: 'Hips stacked and lifted, no sagging.',
    howTo: [
      'Elbow directly under the shoulder, feet stacked (or knees bent to make it easier).',
      'Lift hips so the body is one straight line.',
      'Top hip stays stacked above the bottom hip.',
      'Breathe, do not let the hips sag.',
    ],
  }),

  /* Combat conditioning */
  shadowboxing: E({
    id: 'shadowboxing',
    name: 'Shadowboxing',
    trackerName: 'Shadowboxing (3 min rounds)',
    unit: 'sec',
    perSide: false,
    rounds: true,
    stat: 'AGI',
    cue: 'Stay light, rotate from the feet and hips.',
    howTo: [
      'Feet shoulder width, lead foot forward, knees soft, chin down, hands guarding the face.',
      'Throw jab-cross, add hooks, rotating from the feet and hips.',
      'Stay light on the balls of the feet, keep knees tracking over the toes (no caving in).',
      'Keep moving and breathing, shoulders relaxed.',
    ],
  }),
  sprawl: E({
    id: 'sprawl',
    name: 'Sprawl',
    trackerName: 'Sprawl',
    unit: 'reps',
    perSide: false,
    stat: 'AGI',
    cue: 'Hips to the floor, snap the feet back under you.',
    howTo: [
      'From standing, drop your hands to the floor and shoot your legs back so the hips go low.',
      'Hands under shoulders, ribs down, do not sag the lower back.',
      'Snap your feet back under your hips and stand.',
      'Easier: step the feet back instead of jumping.',
    ],
  }),
  'bear-crawl': E({
    id: 'bear-crawl',
    name: 'Bear crawl',
    trackerName: 'Bear crawl',
    unit: 'sec',
    perSide: false,
    stat: 'AGI',
    cue: 'Knees hover, back flat, small steps.',
    howTo: [
      'Hands under shoulders, knees hovering 2-3 cm off the floor.',
      'Move opposite hand and foot together with small steps.',
      'Back flat, hips low, glutes squeezed.',
      'Slow and controlled beats fast and sloppy.',
    ],
  }),
} as const satisfies Record<string, ExerciseDef>;

export type ExerciseId = keyof typeof EXERCISES;

export function exercise(id: string): ExerciseDef {
  const def = (EXERCISES as Record<string, ExerciseDef>)[id];
  if (!def) throw new Error(`Unknown exercise: ${id}`);
  return def;
}

// Additional kettlebell movements with full coaching and direct videos.
(() => {
  const EXTRA_EXERCISES = [
    {
      name: 'Kettlebell Halo', sets: 3, reps: '8 each direction', rest: 45,
      defaultWeight: 12, weights: [8,12,16,20],
      cue: 'Circle the bell close to your head while keeping your ribs down.',
      mistakes: ['Flaring the ribs','Moving the head instead of the bell','Using a weight that pulls the elbows apart'],
      subs: ['Bodyweight shoulder circles','Light plate halo','Half-kneeling halo'],
      video: 'https://www.youtube.com/watch?v=13SFATc-mJ4'
    },
    {
      name: 'Clean and Press', sets: 4, reps: '5 each arm', rest: 90,
      defaultWeight: 16, weights: [8,12,16,20,24],
      cue: 'Clean softly to the rack, brace, then press without leaning.',
      mistakes: ['Bell crashing onto the forearm','Pressing before the rack is stable','Leaning backward at lockout'],
      subs: ['Dead clean plus floor press','Single arm clean','Half kneeling press'],
      video: 'https://www.youtube.com/watch?v=eaQPi0LDoE0'
    },
    {
      name: 'Kettlebell Windmill', sets: 3, reps: '6 each side', rest: 75,
      defaultWeight: 8, weights: [8,12,16,20],
      cue: 'Keep the loaded arm stacked and hinge toward the opposite leg.',
      mistakes: ['Turning it into a side bend','Losing sight of the bell','Forcing depth by rounding the back'],
      subs: ['Bodyweight windmill','Half-kneeling windmill','Supported hip hinge reach'],
      video: 'https://www.youtube.com/watch?v=IZrX6EQWI_8'
    }
  ];

  Object.assign(CURATED, {
    'Kettlebell Halo': { coach: 'Coach Gabe West', url: 'https://www.youtube.com/watch?v=13SFATc-mJ4' },
    'Clean and Press': { coach: 'Mark Wildman', url: 'https://www.youtube.com/watch?v=eaQPi0LDoE0' },
    'Kettlebell Windmill': { coach: 'Technique tutorial', url: 'https://www.youtube.com/watch?v=IZrX6EQWI_8' }
  });

  Object.assign(EXERCISE_GUIDES, {
    'Kettlebell Halo': {
      purpose: 'Warm and strengthen the shoulders while training upper-back mobility and trunk control.',
      setup: ['Hold the kettlebell by the horns in front of your chest.', 'Stand tall with feet about hip-width apart.', 'Brace your stomach and keep your ribs stacked over your pelvis.'],
      steps: ['Lift the bell toward one side of your face.', 'Guide it behind your head while keeping it close.', 'Bring it around the opposite side and return to the chest.', 'Keep your head still and your elbows controlled.', 'Complete the planned reps, then reverse direction.'],
      breathing: 'Breathe steadily. Exhale as the bell passes behind the head if that helps you maintain your brace.',
      tempo: 'Use a slow, smooth circle with no momentum or sudden drops.',
      cues: ['Bell stays close', 'Ribs stay down', 'Head remains still'],
      beginner: 'Use a very light bell or perform the movement from a half-kneeling position.',
      safety: ['Do not force a painful shoulder range.', 'Keep the movement slow enough to control the bell behind your head.']
    },
    'Clean and Press': {
      purpose: 'Combine hip power, rack-position control, and overhead strength in one full-body movement.',
      setup: ['Place the bell slightly in front of you.', 'Use a strong hinge stance and grip the handle off-centre.', 'Clear the area above and around you before starting.'],
      steps: ['Hike the bell and drive the hips forward.', 'Guide the bell close to your body into a quiet rack position.', 'Pause, brace your stomach, and stabilize the wrist.', 'Press the bell overhead without leaning sideways or backward.', 'Lower to the rack, then guide the bell into the next clean or safely park it.'],
      breathing: 'Exhale during the clean, reset your breath in the rack, and exhale again through the press.',
      tempo: 'Explosive clean, brief controlled pause, steady press, and slow return to the rack.',
      cues: ['Quiet clean', 'Stable rack', 'Ribs down during press'],
      beginner: 'Perform each clean and press as two separate movements with a pause between them.',
      safety: ['Use a lighter bell until the clean no longer strikes the forearm.', 'Stop if the overhead position causes shoulder pain or loss of control.']
    },
    'Kettlebell Windmill': {
      purpose: 'Train shoulder stability, hip mobility, hamstrings, and rotational trunk control.',
      setup: ['Press or assist the bell overhead with one arm.', 'Turn both feet slightly away from the loaded side.', 'Keep the loaded wrist straight and shoulder packed.'],
      steps: ['Keep your eyes on the bell.', 'Push the hip on the loaded side outward.', 'Hinge and reach the free hand down the inside of the opposite leg.', 'Stop before your spine rounds or the overhead arm loses its stacked position.', 'Drive the hip back under you and return to standing.'],
      breathing: 'Take a breath before the hinge and exhale as you return to standing.',
      tempo: 'Lower for 3 seconds, pause briefly, and stand smoothly.',
      cues: ['Eyes on bell', 'Hip moves sideways', 'Loaded arm stays stacked'],
      beginner: 'Practice without weight or hold the bell in the lower hand instead of overhead.',
      safety: ['Do not chase depth at the expense of shoulder or spinal position.', 'Use a very light bell while learning the movement.']
    }
  });

  const previousUniqueExercises = uniqueExercises;
  uniqueExercises = function() {
    const map = {};
    previousUniqueExercises().forEach(exercise => map[exercise.name] = exercise);
    EXTRA_EXERCISES.forEach(exercise => map[exercise.name] = exercise);
    return Object.values(map);
  };

  window.KB_EXTRA_EXERCISES = EXTRA_EXERCISES;
  if (typeof renderLibrary === 'function') renderLibrary();
  if (typeof renderRoutineBuilder === 'function') renderRoutineBuilder();
})();
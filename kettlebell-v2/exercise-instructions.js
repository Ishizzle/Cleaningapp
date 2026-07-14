const EXERCISE_GUIDES = {
  "Goblet Squat": {
    purpose: "Build leg strength while learning a strong, upright squat position.",
    setup: ["Stand with feet about shoulder-width apart.", "Hold the kettlebell by the horns tight to your chest.", "Point your toes slightly outward and brace your stomach."],
    steps: ["Take a breath and tighten your midsection.", "Sit your hips down between your legs while keeping your chest tall.", "Let your knees track in the same direction as your toes.", "Descend only as far as you can keep your heels down and back neutral.", "Drive through the whole foot and stand tall without leaning backward."],
    breathing: "Breathe in and brace before lowering. Exhale near the top after you pass the hardest part.",
    tempo: "Lower for about 2 to 3 seconds, pause briefly, then stand smoothly.",
    cues: ["Bell stays close", "Whole foot stays planted", "Knees follow toes"],
    beginner: "Squat to a chair or box until the depth feels controlled.",
    safety: ["Stop if you feel sharp knee, hip, or back pain.", "Do not force extra depth by rounding your lower back."]
  },
  "Kettlebell Swing": {
    purpose: "Train explosive hip power, conditioning, and a strong hip hinge.",
    setup: ["Place the kettlebell about one foot in front of you.", "Stand with feet slightly wider than hip-width.", "Hinge back, grip the handle, and tip the bell toward you."],
    steps: ["Hike the bell high between your legs like a football snap.", "Keep your shins nearly vertical and load your hips and hamstrings.", "Snap your hips forward and stand tall.", "Let the bell float to roughly chest height without lifting it with your arms.", "Guide it back between your legs and repeat the hinge."],
    breathing: "Use a short, forceful exhale as your hips snap forward. Inhale during the backswing.",
    tempo: "Explosive on the way up; controlled but quick on the backswing.",
    cues: ["Hinge, do not squat", "Arms are hooks", "Finish tall, not leaned back"],
    beginner: "Practice kettlebell deadlifts and hike-pass drills before continuous swings.",
    safety: ["Stop if the bell pulls on your lower back.", "Keep the training area clear and use a secure grip."]
  },
  "Single Arm Overhead Press": {
    purpose: "Build shoulder and upper-body strength with full-body stability.",
    setup: ["Clean the bell into a secure rack position.", "Keep your wrist straight and elbow close to your ribs.", "Stand tall with glutes and stomach tight."],
    steps: ["Brace before the press.", "Press the bell upward while keeping your forearm vertical.", "Move your head slightly back as the bell passes, then bring your head through.", "Finish with the arm straight and shoulder controlled.", "Lower the bell slowly back to the rack."],
    breathing: "Inhale and brace before pressing. Exhale through the difficult portion or at lockout.",
    tempo: "Press steadily for 1 to 2 seconds and lower for 2 to 3 seconds.",
    cues: ["Straight wrist", "Ribs stay down", "No sideways lean"],
    beginner: "Use a half-kneeling press or floor press with a lighter bell.",
    safety: ["Do not press through shoulder pinching or sharp pain.", "Avoid arching your lower back to finish the rep."]
  },
  "Single Arm Floor Press": {
    purpose: "Strengthen the chest, triceps, and shoulder while limiting excessive shoulder range.",
    setup: ["Lie on your back with knees bent.", "Hold the bell with a straight wrist and upper arm resting lightly on the floor.", "Keep the shoulder blade gently pulled down and back."],
    steps: ["Brace your stomach and keep your feet planted.", "Press the bell straight above the shoulder.", "Finish with the elbow straight but not aggressively locked.", "Lower under control until the upper arm softly touches the floor.", "Pause before the next rep instead of bouncing."],
    breathing: "Inhale while lowering. Exhale as you press upward.",
    tempo: "Press in 1 second, lower in 2 to 3 seconds, pause on the floor.",
    cues: ["Knuckles to ceiling", "Elbow about 30 to 45 degrees from body", "No bounce"],
    beginner: "Use two hands to help position the bell before and after the set.",
    safety: ["Keep the wrist stacked above the elbow.", "Do not drop the arm quickly onto the floor."]
  },
  "Half Kneeling Press": {
    purpose: "Build shoulder strength while improving core and hip stability.",
    setup: ["Kneel with one knee down and the opposite foot forward.", "Squeeze the glute on the kneeling side.", "Hold the bell in the rack on the same side as the down knee unless your program specifies otherwise."],
    steps: ["Tuck your pelvis slightly and brace your stomach.", "Press the bell overhead without leaning or rotating.", "Finish with the arm straight and biceps near the ear.", "Lower the bell under control to the rack.", "Keep your front foot and rear knee stable throughout."],
    breathing: "Inhale and brace before pressing. Exhale as the bell passes the sticking point.",
    tempo: "Controlled press and a slower 2 to 3 second lowering phase.",
    cues: ["Squeeze rear glute", "Stay tall", "Do not twist"],
    beginner: "Use a pad under the knee and a lighter kettlebell.",
    safety: ["Stop if kneeling causes knee pain even with padding.", "Do not compensate by arching the lower back."]
  },
  "Push Press": {
    purpose: "Use leg drive to move a heavier bell overhead while training power.",
    setup: ["Start with the bell securely in the rack.", "Stand with feet about hip-width and brace your trunk.", "Keep the elbow close and wrist straight."],
    steps: ["Dip a few inches by bending the knees while keeping your torso upright.", "Drive through the floor and extend the knees and hips quickly.", "Use that momentum to press the bell overhead.", "Finish tall with the arm straight.", "Lower the bell to the rack under control before the next rep."],
    breathing: "Take a breath before the dip. Exhale during the drive and press.",
    tempo: "Quick dip and explosive drive; controlled lowering.",
    cues: ["Shallow dip", "Drive then press", "Finish stacked"],
    beginner: "Practice strict presses and light push presses before increasing load.",
    safety: ["Do not turn the dip into a deep squat.", "Stop if the bell crashes into the forearm or shoulder."]
  },
  "Single Arm Row": {
    purpose: "Strengthen the back, rear shoulder, grip, and trunk.",
    setup: ["Use a staggered stance or support one hand on a bench.", "Hinge until your back is flat.", "Let the working arm hang directly below the shoulder."],
    steps: ["Brace your trunk and keep your shoulders square.", "Pull the bell toward your hip rather than your chest.", "Pause briefly with the elbow close to your side.", "Lower until the arm is long without rounding your back.", "Keep your torso still throughout the set."],
    breathing: "Exhale as you row. Inhale while lowering.",
    tempo: "Pull in 1 second, pause, lower for 2 seconds.",
    cues: ["Elbow toward hip", "Long neutral spine", "No torso twist"],
    beginner: "Use a supported row with one hand on a sturdy surface.",
    safety: ["Stop if you cannot keep your back neutral.", "Avoid jerking the bell from the floor."]
  },
  "Single Arm Clean": {
    purpose: "Move the kettlebell efficiently from the floor or swing into the rack position.",
    setup: ["Begin in a strong swing stance with the bell slightly in front.", "Grip the handle off-center so the thumb is closer to the inner corner.", "Brace before hiking the bell."],
    steps: ["Hike the bell between your legs.", "Drive your hips forward as you would in a swing.", "Keep the bell close to your body as it rises.", "Guide your hand around the handle instead of letting the bell flip over it.", "Receive the bell softly in the rack with the elbow close to your ribs."],
    breathing: "Exhale during the hip snap and clean. Reset your breath in the rack.",
    tempo: "Explosive hip drive with a quiet, controlled catch.",
    cues: ["Bell stays close", "Hand moves around bell", "Quiet rack"],
    beginner: "Practice dead cleans from the floor before swing cleans.",
    safety: ["Use a lighter bell until it stops striking your forearm.", "Keep your wrist neutral in the rack."]
  },
  "Turkish Get-up": {
    purpose: "Train total-body control, shoulder stability, mobility, and coordination.",
    setup: ["Lie on your back with the bell pressed above one shoulder.", "Bend the knee on the same side as the bell and place that foot firmly on the floor.", "Extend the opposite arm and leg at roughly 45 degrees."],
    steps: ["Roll to the opposite elbow while keeping your eyes on the bell.", "Press up to the hand and lift your hips.", "Sweep the straight leg underneath into a half-kneeling position.", "Bring your torso upright and align the lunge stance.", "Stand up under control, then reverse every step to the floor."],
    breathing: "Breathe normally between positions. Exhale during each major transition.",
    tempo: "Slow and deliberate. Pause briefly at every stable position.",
    cues: ["Eyes on bell", "Locked, stable wrist", "One step at a time"],
    beginner: "Learn the movement with no weight or a shoe balanced on your fist.",
    safety: ["Never rush a get-up.", "Stop immediately if the shoulder feels unstable or painful."]
  },
  "Bulgarian Split Squat": {
    purpose: "Build single-leg strength and improve hip and knee control.",
    setup: ["Place the top of your rear foot on a low bench or sturdy surface.", "Move the front foot far enough forward to stay balanced.", "Hold the bell at the chest or in a suitcase position."],
    steps: ["Brace and keep most of your weight through the front foot.", "Lower the rear knee toward the floor.", "Keep the front knee tracking over the toes.", "Descend only as far as you can stay controlled.", "Drive through the front foot to stand."],
    breathing: "Inhale while lowering. Exhale as you stand.",
    tempo: "Lower for 2 to 3 seconds, pause, stand smoothly.",
    cues: ["Front heel stays down", "Drop straight down", "Stable knee"],
    beginner: "Use a supported split squat with the rear foot on the floor.",
    safety: ["Use a low rear-foot support at first.", "Stop if the front knee or rear hip has sharp pain."]
  },
  "Single Leg Romanian Deadlift": {
    purpose: "Build hamstring, glute, balance, and hip-hinge strength one side at a time.",
    setup: ["Stand tall with the bell in the hand opposite the working leg.", "Keep a soft bend in the standing knee.", "Brace and square your hips forward."],
    steps: ["Push your hips backward as the free leg reaches behind you.", "Keep your spine long and hips level.", "Lower the bell close to the standing leg.", "Stop when your hamstring is loaded and your back remains neutral.", "Drive the hip forward to stand tall."],
    breathing: "Inhale during the hinge. Exhale as you return to standing.",
    tempo: "Lower for 3 seconds and stand in 1 to 2 seconds.",
    cues: ["Reach long behind", "Hips stay square", "Bell stays close"],
    beginner: "Use a kickstand stance or hold a wall for balance.",
    safety: ["Do not chase depth by rounding your back.", "Keep the standing knee softly bent, not locked."]
  },
  "Reverse Lunge": {
    purpose: "Strengthen the legs while placing less forward stress on the knee than many forward-lunge variations.",
    setup: ["Stand tall with feet hip-width apart.", "Hold the bell at the chest, rack, or suitcase position.", "Brace before stepping."],
    steps: ["Step one foot backward and land softly on the ball of the foot.", "Lower the back knee toward the floor.", "Keep the front heel planted and front knee aligned with the toes.", "Push through the front foot to return to standing.", "Reset your balance before the next rep."],
    breathing: "Inhale while lowering. Exhale as you return to standing.",
    tempo: "Controlled step and descent; smooth drive back up.",
    cues: ["Step back softly", "Front foot stays heavy", "Stay tall"],
    beginner: "Perform bodyweight lunges while lightly holding a support.",
    safety: ["Use a shorter range if the back knee is uncomfortable.", "Avoid stepping onto a narrow line that makes balance difficult."]
  },
  "Suitcase Carry": {
    purpose: "Train grip, posture, core stability, and resistance to side bending.",
    setup: ["Stand beside the bell and pick it up with a safe hinge.", "Hold it at one side with the arm long.", "Stand tall with shoulders level."],
    steps: ["Brace your stomach as if preparing for a light punch.", "Walk with short, controlled steps.", "Keep your ribs stacked over your pelvis.", "Do not lean toward or away from the bell.", "Set the bell down with a hinge, then switch sides."],
    breathing: "Take steady breaths while keeping gentle abdominal tension.",
    tempo: "Walk slowly enough to control posture throughout the distance.",
    cues: ["Stay tall", "Shoulders level", "Quiet controlled steps"],
    beginner: "March in place or perform a shorter carry.",
    safety: ["Use a clear walking path.", "Stop if your grip opens or posture cannot be maintained."]
  },
  "Push-up": {
    purpose: "Build chest, triceps, shoulder, and core strength.",
    setup: ["Place hands slightly wider than shoulder-width.", "Create a straight line from head to heels.", "Brace your stomach and squeeze your glutes."],
    steps: ["Lower your body as one unit.", "Keep elbows roughly 30 to 45 degrees from your sides.", "Bring your chest toward the floor without letting hips sag.", "Press the floor away and return to the starting position.", "Keep your neck neutral throughout."],
    breathing: "Inhale while lowering. Exhale while pressing up.",
    tempo: "Lower for 2 seconds and press in 1 second.",
    cues: ["Body moves as one piece", "Elbows not flared", "Push the floor away"],
    beginner: "Use an incline such as a bench, countertop, or sturdy table.",
    safety: ["Stop if you feel sharp shoulder or wrist pain.", "Use push-up handles if wrist extension is uncomfortable."]
  },
  "Plank": {
    purpose: "Build abdominal endurance and trunk control.",
    setup: ["Place elbows under shoulders.", "Extend your legs and place feet comfortably apart.", "Create a straight line from head to heels."],
    steps: ["Tuck your pelvis slightly.", "Squeeze your glutes and brace your stomach.", "Push the floor away with your forearms.", "Keep breathing without losing position.", "End the set before your hips sag or rise."],
    breathing: "Take slow breaths while maintaining abdominal tension.",
    tempo: "Hold a steady position rather than shifting or bouncing.",
    cues: ["Ribs down", "Glutes tight", "Neck neutral"],
    beginner: "Use a knee plank or shorter 10 to 20 second holds.",
    safety: ["Stop if your lower back begins to ache.", "Quality matters more than holding longer."]
  },
  "Side Plank": {
    purpose: "Strengthen the side abdominal muscles, hips, and shoulder stabilizers.",
    setup: ["Place your elbow directly under your shoulder.", "Stack or stagger your feet.", "Keep your body in one straight line."],
    steps: ["Brace and lift your hips away from the floor.", "Keep your chest facing forward rather than rotating down.", "Push the floor away through the supporting forearm.", "Hold while breathing steadily.", "Lower with control and repeat on the other side."],
    breathing: "Use slow, controlled breaths without letting the hips drop.",
    tempo: "Steady hold with no bouncing.",
    cues: ["Hips high", "Chest open", "Shoulder away from ear"],
    beginner: "Bend the bottom knee and support yourself from the knee and forearm.",
    safety: ["Stop if the supporting shoulder feels pinched.", "Use shorter holds before adding time."]
  },
  "Dead Bug": {
    purpose: "Train core control while moving the arms and legs independently.",
    setup: ["Lie on your back with hips and knees bent to 90 degrees.", "Reach your arms toward the ceiling.", "Gently press your lower back toward the floor."],
    steps: ["Brace without holding your breath.", "Slowly lower one arm and the opposite leg.", "Stop before your lower back lifts from the floor.", "Return to the start and switch sides.", "Move slowly enough to control every inch."],
    breathing: "Exhale as the arm and leg extend. Inhale as they return.",
    tempo: "About 3 seconds out and 2 seconds back.",
    cues: ["Back stays down", "Move opposite limbs", "Slow control"],
    beginner: "Move only the legs or tap one heel to the floor at a time.",
    safety: ["Reduce the range if the lower back lifts.", "Stop if the movement increases back pain."]
  },
  "Mountain Climber": {
    purpose: "Combine core stability with cardiovascular conditioning.",
    setup: ["Begin in a strong high-plank position.", "Place hands under shoulders.", "Brace your trunk and keep hips level."],
    steps: ["Drive one knee toward your chest.", "Return that foot while the other knee comes forward.", "Keep your shoulders over your hands.", "Move at a speed that allows your hips to stay controlled.", "Maintain a long spine and steady breathing."],
    breathing: "Use short, regular breaths throughout the interval.",
    tempo: "Start slow and increase speed only if position stays solid.",
    cues: ["Hips stay level", "Hands under shoulders", "Quiet feet"],
    beginner: "Step one foot forward at a time instead of running.",
    safety: ["Stop if your wrists or lower back become painful.", "Slow down before technique breaks down."]
  },
  "Hammer Curl": {
    purpose: "Strengthen the biceps, forearms, and grip.",
    setup: ["Stand tall and hold the bell with a neutral wrist.", "Keep your elbow close to your side.", "Brace your trunk before curling."],
    steps: ["Curl the bell without moving your upper arm forward.", "Pause briefly near the top.", "Lower the bell slowly until the arm is nearly straight.", "Keep your torso still instead of swinging.", "Complete all reps with the same controlled path."],
    breathing: "Exhale while curling. Inhale while lowering.",
    tempo: "Curl in 1 to 2 seconds and lower for 3 seconds.",
    cues: ["Elbow stays close", "No body swing", "Slow lowering"],
    beginner: "Use both hands on one bell or use a lighter kettlebell.",
    safety: ["Avoid bending the wrist backward.", "Stop if the elbow or forearm has sharp pain."]
  }
};

function getExerciseGuide(exercise) {
  const guide = EXERCISE_GUIDES[exercise.name];
  if (guide) return guide;
  return {
    purpose: exercise.cue || "Practice this movement with control and consistent form.",
    setup: ["Choose a load you can control.", "Create a stable starting position.", "Brace before beginning the first repetition."],
    steps: [exercise.cue || "Move through a comfortable, controlled range.", "Keep the working joints aligned.", "Stop the set before technique breaks down."],
    breathing: "Breathe steadily and avoid holding your breath for long periods.",
    tempo: "Use a controlled lowering phase and a smooth lifting phase.",
    cues: exercise.mistakes ? exercise.mistakes.map(item => "Avoid: " + item) : ["Move with control"],
    beginner: exercise.subs && exercise.subs.length ? "Try: " + exercise.subs[0] : "Reduce the load or range of motion.",
    safety: ["Stop for sharp pain, dizziness, numbness, or loss of control."]
  };
}
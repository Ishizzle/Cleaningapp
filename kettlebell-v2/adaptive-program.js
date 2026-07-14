// Advanced training engine: 12-week phases, previous-session comparison,
// warm-up ladders, advanced set types, and superset guidance.
(() => {
  state.version = Math.max(Number(state.version) || 0, 7);
  state.trainingPreferences = Object.assign({
    goal: 'balanced',
    trainingDays: 5,
    deloads: true
  }, state.trainingPreferences || {});

  const STANDARD_PROGRAMS = JSON.parse(JSON.stringify(PROGRAM));
  window.KB_STANDARD_PROGRAMS = STANDARD_PROGRAMS;
  const SET_TYPES = [
    ['warmup', 'Warm-up'],
    ['normal', 'Working'],
    ['amrap', 'AMRAP'],
    ['drop', 'Drop set'],
    ['failure', 'Technical failure'],
    ['timed', 'Timed']
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function phaseForWeek(week) {
    const value = Math.max(1, Math.min(12, Number(week) || 1));
    if (value <= 3) return { name: 'Foundation', focus: 'Technique, consistency, and controlled volume', weightFactor: .90, setFactor: 1, accent: 'Build the movement before chasing load.' };
    if (value === 4) return { name: 'Deload', focus: 'Recovery and clean technique', weightFactor: .80, setFactor: .65, accent: 'Finish every set feeling capable of more.' };
    if (value <= 7) return { name: 'Strength', focus: 'Progressive overload and stronger working sets', weightFactor: 1, setFactor: 1, accent: 'Add load only when every rep stays clean.' };
    if (value === 8) return { name: 'Deload', focus: 'Reduce fatigue before the final block', weightFactor: .82, setFactor: .65, accent: 'Move well and leave the session fresh.' };
    if (value <= 11) return { name: 'Peak', focus: 'Heavier quality work with controlled volume', weightFactor: 1.05, setFactor: .85, accent: 'Longer rests and perfect technique.' };
    return { name: 'Assessment', focus: 'Review progress and establish new baselines', weightFactor: 1, setFactor: .75, accent: 'Test only when readiness and form are good.' };
  }
  window.getTrainingPhase = phaseForWeek;

  function goalFactors(goal) {
    if (goal === 'strength') return { weightFactor: 1.05, setFactor: .95, label: 'Strength emphasis' };
    if (goal === 'conditioning') return { weightFactor: .90, setFactor: 1.10, label: 'Conditioning emphasis' };
    if (goal === 'fat-loss') return { weightFactor: .90, setFactor: 1, label: 'Fat-loss consistency' };
    return { weightFactor: 1, setFactor: 1, label: 'Balanced training' };
  }

  function injectAdvancedStyles() {
    if (document.getElementById('adaptiveProgramStyles')) return;
    const style = document.createElement('style');
    style.id = 'adaptiveProgramStyles';
    style.textContent = `
      .phase-banner{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;margin-top:14px;padding:17px;border-radius:19px;background:linear-gradient(135deg,#172b3d,#15211b);border:1px solid #365168}
      .phase-banner h3{margin:4px 0}.phase-badge{padding:9px 12px;border-radius:999px;background:var(--accent);color:#0c1403;font-weight:950;white-space:nowrap}
      .previous-panel{margin:12px 0;padding:14px;border-radius:16px;background:#121f2d;border:1px solid #2d4359}.previous-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:9px}.previous-stat{padding:10px;border-radius:12px;background:var(--panel2)}.previous-stat b{display:block;font-size:16px}.previous-stat span{font-size:11px;color:var(--muted)}
      .warmup-ladder{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.warmup-step{padding:6px 9px;border-radius:999px;background:#2d2a1d;color:#ffe09b;font-size:11px;font-weight:850}
      .set-type-select{background:#0d151f;border:1px solid var(--line);border-radius:9px;color:var(--text);padding:7px;font-size:12px}.set-type-tag{padding:5px 8px;border-radius:999px;background:#26391d;color:#dfffaa;font-size:11px}
      .superset-banner{margin:11px 0;padding:12px;border-radius:14px;background:#30253c;border:1px solid #574268;color:#e9d2ff}.superset-banner b{color:#f2dcff}
      .phase-settings{margin-top:14px;padding-top:14px;border-top:1px solid var(--line)}.phase-settings-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
      @media(max-width:640px){.phase-banner{grid-template-columns:1fr}.previous-grid{grid-template-columns:1fr 1fr}.phase-settings-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function injectPhaseBanner() {
    if (document.getElementById('phaseBanner')) return;
    const metrics = document.querySelector('#workoutView .metrics');
    if (!metrics) return;
    const banner = document.createElement('div');
    banner.id = 'phaseBanner';
    banner.className = 'phase-banner';
    metrics.insertAdjacentElement('afterend', banner);
  }

  function injectTrainingSettings() {
    if (document.getElementById('trainingPreferencePanel')) return;
    const settingsPanel = document.querySelector('#settingsView .panel');
    if (!settingsPanel) return;
    const section = document.createElement('div');
    section.id = 'trainingPreferencePanel';
    section.className = 'phase-settings';
    section.innerHTML = `
      <h3>Training plan</h3>
      <div class="phase-settings-grid">
        <div class="field"><label>Primary goal</label><select id="trainingGoal"><option value="balanced">Balanced fitness</option><option value="strength">Strength</option><option value="conditioning">Conditioning</option><option value="fat-loss">Fat loss and consistency</option></select></div>
        <div class="field"><label>Planned training days</label><select id="trainingDays">${[2,3,4,5,6].map(value => `<option value="${value}">${value} days per week</option>`).join('')}</select></div>
      </div>
      <label style="display:flex;gap:9px;align-items:center;margin-top:12px"><input id="deloadToggle" type="checkbox"> Use automatic deload weeks</label>
      <button class="secondary" style="margin-top:12px" onclick="saveTrainingPreferences()">Save training plan</button>`;
    settingsPanel.appendChild(section);
  }

  window.saveTrainingPreferences = function() {
    state.trainingPreferences.goal = document.getElementById('trainingGoal').value;
    state.trainingPreferences.trainingDays = Number(document.getElementById('trainingDays').value);
    state.trainingPreferences.deloads = document.getElementById('deloadToggle').checked;
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    render();
    toast('Training plan saved');
  };

  function renderPhaseBanner() {
    const banner = document.getElementById('phaseBanner');
    if (!banner) return;
    const phase = phaseForWeek(state.week);
    const goal = goalFactors(state.trainingPreferences.goal);
    banner.innerHTML = `<div><div class="eyebrow">WEEK ${state.week} TRAINING BLOCK</div><h3>${phase.name} · ${goal.label}</h3><div class="meta">${phase.focus}. ${phase.accent}</div></div><div class="phase-badge">${phase.name}</div>`;
    document.getElementById('trainingGoal').value = state.trainingPreferences.goal;
    document.getElementById('trainingDays').value = state.trainingPreferences.trainingDays;
    document.getElementById('deloadToggle').checked = state.trainingPreferences.deloads;
  }

  function lastPerformanceFor(day, exercise) {
    const entry = state.logs?.[logKey(day, exercise.name)];
    return entry ? clone(entry) : null;
  }

  function formatReps(set) {
    if (!set) return '—';
    const left = Number(set.left) || 0;
    const right = Number(set.right) || 0;
    return right ? `${left}/${right}` : String(left || '—');
  }

  function warmupWeights(exercise, target) {
    if (!target || target <= 0) return [];
    const available = availableWeights(exercise).filter(value => value > 0 && value < target);
    const targets = [target * .5, target * .7, target * .85];
    return [...new Set(targets.map(value => available.length ? available.reduce((best, candidate) => Math.abs(candidate - value) < Math.abs(best - value) ? candidate : best, available[0]) : null).filter(Boolean))];
  }

  const previousCreateActiveWorkout = createActiveWorkout;
  createActiveWorkout = function(recovery) {
    const phase = phaseForWeek(state.week);
    const goal = goalFactors(state.trainingPreferences.goal);
    const useDeload = state.trainingPreferences.deloads || phase.name !== 'Deload';
    const phaseWeight = useDeload ? phase.weightFactor : 1;
    const phaseSets = useDeload ? phase.setFactor : 1;
    const adjusted = Object.assign({}, recovery, {
      weightFactor: Math.max(.55, Math.min(1.15, (recovery.weightFactor || 1) * phaseWeight * goal.weightFactor)),
      setFactor: Math.max(.45, Math.min(1.2, (recovery.setFactor || 1) * phaseSets * goal.setFactor)),
      recommendation: `${recovery.recommendation} · ${phase.name} block`
    });
    const day = state.currentDay;
    const program = PROGRAM[day];
    const previousPerformance = {};
    program.exercises.forEach((exercise, index) => previousPerformance[index] = lastPerformanceFor(day, exercise));
    previousCreateActiveWorkout(adjusted);
    if (!state.activeWorkout) return;
    state.activeWorkout.phase = phase;
    state.activeWorkout.goal = state.trainingPreferences.goal;
    state.activeWorkout.previousPerformance = previousPerformance;
    state.activeWorkout.programSnapshot = clone(program);
    if (state.pendingRoutineId) {
      state.activeWorkout.customRoutineId = state.pendingRoutineId;
      state.pendingRoutineId = null;
    }
    Object.entries(state.activeWorkout.setLogs).forEach(([key, set]) => {
      const exerciseIndex = Number(key.split('-')[0]);
      const exercise = program.exercises[exerciseIndex];
      set.type = set.type || exercise.defaultSetType || 'normal';
      set.supersetGroup = exercise.supersetGroup || '';
    });
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  };

  if (state.activeWorkout?.programSnapshot) {
    PROGRAM[state.activeWorkout.day] = clone(state.activeWorkout.programSnapshot);
  }

  function injectPreviousPanel() {
    if (!state.activeWorkout) return;
    const modalTitle = document.getElementById('modalTitle');
    if (!modalTitle) return;
    let panel = document.getElementById('previousPerformancePanel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'previousPerformancePanel';
      panel.className = 'previous-panel';
      const coach = document.getElementById('coachCue');
      coach.insertAdjacentElement('beforebegin', panel);
    }
    const workout = state.activeWorkout;
    const exercise = PROGRAM[workout.day].exercises[activeExercise];
    const previous = workout.previousPerformance?.[activeExercise] || null;
    const workingWeight = suggestedWeight(exercise, workout.day);
    const ladder = warmupWeights(exercise, workingWeight);
    if (!previous) {
      panel.innerHTML = `<div class="eyebrow">PREVIOUS PERFORMANCE</div><b>First recorded session for ${escapeHtml(exercise.name)}</b><div class="meta">Start conservatively and use the effort rating to set your next target.</div>${ladder.length ? `<div class="warmup-ladder">${ladder.map(weight => `<span class="warmup-step">Warm-up ${weight} kg</span>`).join('')}</div>` : ''}`;
      return;
    }
    const completed = (previous.sets || []).filter(set => set.completed);
    const heaviest = completed.length ? Math.max(...completed.map(set => Number(set.weight) || 0)) : Number(previous.weight) || 0;
    const bestSet = completed.sort((a, b) => ((Number(b.left)||0)+(Number(b.right)||0)) - ((Number(a.left)||0)+(Number(a.right)||0)))[0];
    const effort = completed.length ? (completed.reduce((sum, set) => sum + (Number(set.effort) || 0), 0) / completed.length).toFixed(1) : '—';
    const note = completed.find(set => set.note)?.note || 'No previous note';
    panel.innerHTML = `<div class="eyebrow">LAST TIME · ${new Date(previous.date).toLocaleDateString()}</div><div class="previous-grid"><div class="previous-stat"><b>${heaviest ? heaviest+' kg' : 'Bodyweight'}</b><span>heaviest</span></div><div class="previous-stat"><b>${formatReps(bestSet)}</b><span>best reps L/R</span></div><div class="previous-stat"><b>${effort}</b><span>average effort</span></div><div class="previous-stat"><b>${escapeHtml(previous.rating || '—')}</b><span>rating</span></div></div><div class="meta" style="margin-top:9px"><b>Previous note:</b> ${escapeHtml(note)}</div>${ladder.length ? `<div class="warmup-ladder">${ladder.map(weight => `<span class="warmup-step">Warm-up ${weight} kg</span>`).join('')}</div>` : ''}`;
  }

  function injectAdvancedSetControls() {
    if (!state.activeWorkout) return;
    const exercise = PROGRAM[state.activeWorkout.day].exercises[activeExercise];
    const keys = Object.keys(state.activeWorkout.setLogs).filter(key => Number(key.split('-')[0]) === activeExercise).sort((a, b) => Number(a.split('-')[1]) - Number(b.split('-')[1]));
    document.querySelectorAll('#setList .set-card').forEach((card, index) => {
      const key = keys[index];
      const set = state.activeWorkout.setLogs[key];
      if (!set || card.querySelector('.set-type-select')) return;
      const select = document.createElement('select');
      select.className = 'set-type-select';
      select.innerHTML = SET_TYPES.map(([value, label]) => `<option value="${value}" ${set.type === value ? 'selected' : ''}>${label}</option>`).join('');
      select.onchange = () => saveSetField(key, 'type', select.value);
      card.querySelector('.set-head').appendChild(select);
      if (set.type === 'timed') {
        const left = card.querySelector('.set-fields input');
        if (left) left.placeholder = 'Seconds';
      }
    });

    let banner = document.getElementById('supersetGuidance');
    if (banner) banner.remove();
    if (exercise.supersetGroup) {
      banner = document.createElement('div');
      banner.id = 'supersetGuidance';
      banner.className = 'superset-banner';
      const partners = PROGRAM[state.activeWorkout.day].exercises.filter((item, index) => item.supersetGroup === exercise.supersetGroup && index !== activeExercise).map(item => item.name);
      banner.innerHTML = `<b>Superset ${escapeHtml(exercise.supersetGroup)}</b><br>Alternate with ${partners.length ? partners.map(escapeHtml).join(', ') : 'the next grouped exercise'} before taking the full rest period.`;
      document.getElementById('setList').insertAdjacentElement('beforebegin', banner);
    }
  }

  const previousRenderGuided = renderGuided;
  renderGuided = function() {
    previousRenderGuided();
    injectPreviousPanel();
    injectAdvancedSetControls();
  };

  const previousCompleteWorkout = completeWorkout;
  completeWorkout = function() {
    const active = state.activeWorkout ? clone(state.activeWorkout) : null;
    previousCompleteWorkout();
    if (active?.customRoutineId) {
      delete state.completed[dayKey(active.day, active.week)];
      if (STANDARD_PROGRAMS[active.day]) PROGRAM[active.day] = clone(STANDARD_PROGRAMS[active.day]);
      state.currentDay = state.customReturnDay || active.day;
      state.customReturnDay = null;
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      render();
    }
  };

  const previousRender = render;
  render = function() {
    previousRender();
    renderPhaseBanner();
  };

  injectAdvancedStyles();
  injectPhaseBanner();
  injectTrainingSettings();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  render();
})();
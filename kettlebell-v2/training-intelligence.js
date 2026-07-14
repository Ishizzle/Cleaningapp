// Training intelligence: muscle balance, plateau detection, session notes,
// workout summaries, personal-record alerts, and actionable next steps.
(() => {
  state.version = Math.max(Number(state.version) || 0, 8);
  state.workoutSummaries = Array.isArray(state.workoutSummaries) ? state.workoutSummaries : [];

  const MUSCLE_MAP = {
    'Goblet Squat': ['Legs','Glutes','Core'],
    'Single Arm Overhead Press': ['Push','Core'],
    'Single Arm Row': ['Pull','Grip'],
    'Suitcase Carry': ['Core','Grip'],
    'Plank': ['Core'],
    'Kettlebell Swing': ['Posterior Chain','Conditioning','Grip'],
    'Push-up': ['Push','Core'],
    'Mountain Climber': ['Core','Conditioning'],
    'Dead Bug': ['Core'],
    'Single Arm Floor Press': ['Push'],
    'Half Kneeling Press': ['Push','Core'],
    'Hammer Curl': ['Pull','Grip'],
    'Turkish Get-up': ['Full Body','Core','Push'],
    'Bulgarian Split Squat': ['Legs','Glutes'],
    'Single Leg Romanian Deadlift': ['Posterior Chain','Glutes','Core'],
    'Side Plank': ['Core'],
    'Single Arm Clean': ['Posterior Chain','Pull','Grip'],
    'Push Press': ['Push','Legs','Conditioning'],
    'Reverse Lunge': ['Legs','Glutes'],
    'Kettlebell Deadlift': ['Posterior Chain','Glutes','Grip'],
    'Front Rack Squat': ['Legs','Glutes','Core'],
    'Kettlebell Snatch': ['Full Body','Conditioning','Grip'],
    'Kettlebell High Pull': ['Posterior Chain','Pull','Conditioning'],
    'Kettlebell Halo': ['Push','Core'],
    'Kettlebell Windmill': ['Core','Posterior Chain','Push'],
    'Clean and Press': ['Full Body','Push','Pull'],
    'Front Rack Carry': ['Core','Grip','Push'],
    'Farmer Carry': ['Grip','Core','Posterior Chain'],
    'Kettlebell Thruster': ['Full Body','Legs','Push','Conditioning']
  };
  window.KB_MUSCLE_MAP = MUSCLE_MAP;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function number(value) { const result = Number(value); return Number.isFinite(result) ? result : 0; }
  function repTotal(set) { return number(set.left) + number(set.right); }

  function programForHistory(item) {
    if (item.programSnapshot?.exercises) return item.programSnapshot;
    if (window.KB_STANDARD_PROGRAMS?.[item.day]) return window.KB_STANDARD_PROGRAMS[item.day];
    return PROGRAM[item.day] || null;
  }

  function exerciseSessions() {
    const result = {};
    [...state.history].reverse().forEach(item => {
      const program = programForHistory(item);
      if (!program?.exercises) return;
      program.exercises.forEach((exercise, index) => {
        const sets = Object.entries(item.setLogs || {})
          .filter(([key, set]) => Number(key.split('-')[0]) === index && set.completed)
          .map(([, set]) => set);
        if (!sets.length) return;
        const weights = sets.map(set => number(set.weight));
        const efforts = sets.map(set => number(set.effort)).filter(Boolean);
        const session = {
          date: item.date,
          maxWeight: Math.max(...weights),
          totalReps: sets.reduce((sum, set) => sum + repTotal(set), 0),
          volume: sets.reduce((sum, set) => sum + number(set.weight) * repTotal(set), 0),
          averageEffort: efforts.length ? efforts.reduce((sum, value) => sum + value, 0) / efforts.length : null,
          sets: sets.length,
          rating: state.logs?.[logKey(item.day, exercise.name)]?.rating || null
        };
        (result[exercise.name] ||= []).push(session);
      });
    });
    return result;
  }

  function plateauAnalysis() {
    const sessions = exerciseSessions();
    const results = [];
    Object.entries(sessions).forEach(([name, entries]) => {
      if (entries.length < 3) return;
      const recent = entries.slice(-3);
      const weights = recent.map(item => item.maxWeight);
      const reps = recent.map(item => item.totalReps);
      const effort = recent.map(item => item.averageEffort).filter(value => value !== null);
      const sameLoad = Math.max(...weights) - Math.min(...weights) < 0.1;
      const repChange = reps[0] ? (reps[2] - reps[0]) / reps[0] : 0;
      const averageEffort = effort.length ? effort.reduce((sum, value) => sum + value, 0) / effort.length : 0;
      const pain = recent.some(item => item.rating === 'pain');
      let status = 'progressing';
      let recommendation = 'Continue the current progression.';
      if (pain) {
        status = 'pain';
        recommendation = 'Use a pain-free substitution and avoid increasing load.';
      } else if (sameLoad && repChange < .05 && averageEffort >= 8) {
        status = 'plateau';
        recommendation = 'Reduce load about 10%, rebuild clean reps, or change the variation for two weeks.';
      } else if (sameLoad && averageEffort >= 8.5) {
        status = 'watch';
        recommendation = 'Add rest or reduce one set before attempting a heavier bell.';
      }
      if (status !== 'progressing') results.push({ name, status, recommendation, sessions: recent, averageEffort });
    });
    return results;
  }

  function weeklyMuscleSets(days = 7) {
    const cutoff = Date.now() - days * 86400000;
    const totals = {};
    state.history.filter(item => new Date(item.date).getTime() >= cutoff).forEach(item => {
      const program = programForHistory(item);
      if (!program?.exercises) return;
      program.exercises.forEach((exercise, index) => {
        const completed = Object.entries(item.setLogs || {}).filter(([key, set]) => Number(key.split('-')[0]) === index && set.completed).length;
        if (!completed) return;
        const groups = MUSCLE_MAP[exercise.name] || ['Other'];
        groups.forEach(group => totals[group] = (totals[group] || 0) + completed);
      });
    });
    return totals;
  }

  function muscleRecommendation(totals) {
    const major = ['Legs','Posterior Chain','Push','Pull','Core'];
    const missing = major.filter(group => !totals[group]);
    if (missing.length) return `This week has no recorded ${missing.join(', ')} work. Add or complete a balanced session before increasing overall volume.`;
    const values = major.map(group => totals[group] || 0);
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    if (highest > Math.max(6, lowest * 2.2)) {
      const highGroup = major[values.indexOf(highest)];
      const lowGroup = major[values.indexOf(lowest)];
      return `${highGroup} work is much higher than ${lowGroup}. Keep the stronger area stable and add a small amount of ${lowGroup} work.`;
    }
    return 'Your major movement patterns are reasonably balanced this week.';
  }

  function injectIntelligenceStyles() {
    if (document.getElementById('trainingIntelligenceStyles')) return;
    const style = document.createElement('style');
    style.id = 'trainingIntelligenceStyles';
    style.textContent = `
      .intelligence-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.muscle-bars{display:grid;gap:9px;margin-top:12px}.muscle-row{display:grid;grid-template-columns:110px 1fr 42px;gap:9px;align-items:center}.muscle-track{height:12px;border-radius:999px;background:#1b2937;overflow:hidden}.muscle-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--accent))}.muscle-row b{font-size:12px}.muscle-row span{font-size:11px;color:var(--muted);text-align:right}
      .plateau-list{display:grid;gap:9px;margin-top:12px}.plateau-item{padding:13px;border-radius:15px;background:var(--panel2);border:1px solid var(--line)}.plateau-item.plateau{border-color:#76523a;background:#30251e}.plateau-item.pain{border-color:#793b48;background:#341f26}.plateau-item.watch{border-color:#5d596f}.plateau-item h4{margin:0 0 5px}.plateau-item p{margin:5px 0 0;color:var(--muted);font-size:12px;line-height:1.5}
      .session-note{margin:12px 0;padding:13px;border-radius:15px;background:#111e2a;border:1px solid var(--line)}.session-note textarea{width:100%;margin-top:8px;background:#0d151f;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:10px;min-height:70px}
      .summary-modal{max-width:820px}.summary-hero{display:grid;grid-template-columns:1fr auto;gap:14px;align-items:center;padding:16px;border-radius:17px;background:linear-gradient(135deg,#183123,#172637);border:1px solid #385b45}.summary-score{font-size:42px;font-weight:950;color:var(--accent)}.summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:14px}.summary-stat{padding:13px;border-radius:15px;background:var(--panel2);border:1px solid var(--line)}.summary-stat b{display:block;font-size:22px}.summary-stat span{font-size:11px;color:var(--muted)}.summary-section{margin-top:14px;padding:15px;border-radius:16px;background:var(--panel2);border:1px solid var(--line)}.summary-section h3{margin-top:0}.pr-alert{padding:9px 11px;border-radius:12px;background:#26391d;color:#e2ffb5;margin-top:7px}.next-action{padding:9px 11px;border-radius:12px;background:#162b3d;color:#d4eaff;margin-top:7px}
      @media(max-width:760px){.intelligence-grid{grid-template-columns:1fr}.summary-grid{grid-template-columns:1fr 1fr}.muscle-row{grid-template-columns:90px 1fr 35px}}
    `;
    document.head.appendChild(style);
  }

  function injectProgressIntelligence() {
    if (document.getElementById('trainingIntelligenceBlock')) return;
    const progress = document.getElementById('progressView');
    const bodyBlock = document.getElementById('bodyProgressBlock');
    const block = document.createElement('div');
    block.id = 'trainingIntelligenceBlock';
    block.innerHTML = `<div class="section-head"><div><small>TRAINING INTELLIGENCE</small><h3>Balance and plateaus</h3></div></div><div class="intelligence-grid"><div class="card panel"><h3>Sets by movement pattern</h3><div class="muscle-bars" id="muscleBalanceBars"></div><div class="coach-copy" id="muscleBalanceAdvice"></div></div><div class="card panel"><h3>Plateau watch</h3><div class="plateau-list" id="plateauList"></div></div></div>`;
    if (bodyBlock) progress.insertBefore(block, bodyBlock);
    else progress.appendChild(block);
  }

  function injectSummaryModal() {
    if (document.getElementById('workoutSummaryModal')) return;
    const modal = document.createElement('div');
    modal.id = 'workoutSummaryModal';
    modal.className = 'modal';
    modal.innerHTML = `<div class="card modal-card summary-modal"><div class="modal-head"><div><div class="eyebrow">WORKOUT COMPLETE</div><h2 id="summaryTitle" style="margin:5px 0"></h2></div><button class="secondary" onclick="closeWorkoutSummary()">Close</button></div><div id="workoutSummaryContent"></div></div>`;
    document.body.appendChild(modal);
  }

  function injectSessionNote() {
    if (!state.activeWorkout) return;
    let area = document.getElementById('sessionNoteArea');
    if (!area) {
      area = document.createElement('div');
      area.id = 'sessionNoteArea';
      area.className = 'session-note';
      const rating = document.querySelector('#guidedModal .rating');
      rating.insertAdjacentElement('afterend', area);
    }
    area.innerHTML = `<b>Workout note</b><div class="meta">Energy, pain, technique, or anything to remember next time.</div><textarea placeholder="Optional session note" oninput="saveSessionNote(this.value)">${escapeHtml(state.activeWorkout.sessionNote || '')}</textarea>`;
  }

  window.saveSessionNote = function(value) {
    if (!state.activeWorkout) return;
    state.activeWorkout.sessionNote = value;
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  };

  function renderIntelligence() {
    const bars = document.getElementById('muscleBalanceBars');
    const advice = document.getElementById('muscleBalanceAdvice');
    const plateaus = document.getElementById('plateauList');
    if (!bars || !advice || !plateaus) return;
    const totals = weeklyMuscleSets(7);
    const order = ['Legs','Posterior Chain','Push','Pull','Core','Grip','Conditioning','Full Body'];
    const maximum = Math.max(1, ...order.map(group => totals[group] || 0));
    bars.innerHTML = order.map(group => `<div class="muscle-row"><b>${group}</b><div class="muscle-track"><div class="muscle-fill" style="width:${(totals[group] || 0) / maximum * 100}%"></div></div><span>${totals[group] || 0}</span></div>`).join('');
    advice.textContent = muscleRecommendation(totals);
    const results = plateauAnalysis();
    plateaus.innerHTML = results.length ? results.slice(0, 8).map(item => `<div class="plateau-item ${item.status}"><h4>${escapeHtml(item.name)} · ${item.status === 'pain' ? 'Pain flag' : item.status === 'plateau' ? 'Plateau detected' : 'Watch closely'}</h4><div class="meta">Last three sessions · average effort ${item.averageEffort ? item.averageEffort.toFixed(1) : '—'}</div><p>${escapeHtml(item.recommendation)}</p></div>`).join('') : '<div class="empty">No plateaus detected from the available history.</div>';
  }

  function workoutSummary(active) {
    const program = active.programSnapshot || PROGRAM[active.day];
    const completedSets = Object.values(active.setLogs || {}).filter(set => set.completed);
    const volume = completedSets.reduce((sum, set) => sum + number(set.weight) * repTotal(set), 0);
    const elapsed = Math.max(1, Math.round((Date.now() - new Date(active.startedAt).getTime()) / 60000));
    const baseline = active.prBaseline || {};
    const records = [];
    const nextActions = [];
    let painFlags = 0;

    program.exercises.forEach((exercise, index) => {
      const sets = Object.entries(active.setLogs || {}).filter(([key, set]) => Number(key.split('-')[0]) === index && set.completed).map(([, set]) => set);
      if (!sets.length) return;
      const maxWeight = Math.max(...sets.map(set => number(set.weight)));
      const bestReps = Math.max(...sets.map(repTotal));
      const previous = baseline[exercise.name] || { maxWeight: 0, maxReps: 0 };
      if (maxWeight > number(previous.maxWeight)) records.push(`${exercise.name}: ${maxWeight} kg`);
      else if (!maxWeight && bestReps > number(previous.maxReps)) records.push(`${exercise.name}: ${bestReps} reps`);
      const progress = state.progression?.[logKey(active.day, exercise.name)];
      if (progress?.direction === 'up') nextActions.push(`${exercise.name}: try ${progress.nextWeight} kg next time.`);
      if (progress?.direction === 'down') nextActions.push(`${exercise.name}: reduce to ${progress.nextWeight} kg or use a substitution.`);
      if (state.logs?.[logKey(active.day, exercise.name)]?.rating === 'pain') painFlags++;
    });

    const score = Math.round(completedSets.length / Math.max(1, Object.keys(active.setLogs || {}).length) * 100);
    return { elapsed, completedSets: completedSets.length, volume, records, nextActions, painFlags, score, note: active.sessionNote || '' };
  }

  function showSummary(active, summary) {
    document.getElementById('summaryTitle').textContent = active.programSnapshot?.title || active.day;
    const recovery = active.recovery?.recommendation || 'No recovery adjustment';
    document.getElementById('workoutSummaryContent').innerHTML = `<div class="summary-hero"><div><b>${summary.score >= 90 ? 'Strong session' : summary.score >= 65 ? 'Productive session' : 'Partial session completed'}</b><div class="meta">${escapeHtml(recovery)} · ${escapeHtml(active.phase?.name || 'Standard')} block</div></div><div class="summary-score">${summary.score}%</div></div><div class="summary-grid"><div class="summary-stat"><b>${summary.elapsed}</b><span>actual minutes</span></div><div class="summary-stat"><b>${summary.completedSets}</b><span>sets completed</span></div><div class="summary-stat"><b>${Math.round(summary.volume).toLocaleString()}</b><span>kg-reps</span></div><div class="summary-stat"><b>${summary.painFlags}</b><span>pain flags</span></div></div><div class="summary-section"><h3>Personal records</h3>${summary.records.length ? summary.records.map(record => `<div class="pr-alert">🏆 ${escapeHtml(record)}</div>`).join('') : '<div class="meta">No new record this session. Consistent clean work still moves the program forward.</div>'}</div><div class="summary-section"><h3>Next workout actions</h3>${summary.nextActions.length ? summary.nextActions.slice(0,8).map(action => `<div class="next-action">${escapeHtml(action)}</div>`).join('') : '<div class="meta">Repeat the current targets with clean form.</div>'}</div>${summary.note ? `<div class="summary-section"><h3>Your note</h3><div class="meta">${escapeHtml(summary.note)}</div></div>` : ''}<div class="actions"><button class="primary" onclick="closeWorkoutSummary()">Done</button><button class="secondary" onclick="showView('progressView');closeWorkoutSummary()">View progress</button></div>`;
    document.getElementById('workoutSummaryModal').classList.add('open');
  }

  window.closeWorkoutSummary = function() {
    document.getElementById('workoutSummaryModal').classList.remove('open');
  };

  const previousCreateActiveWorkout = createActiveWorkout;
  createActiveWorkout = function(recovery) {
    previousCreateActiveWorkout(recovery);
    if (!state.activeWorkout) return;
    state.activeWorkout.prBaseline = clone(state.personalRecords || {});
    state.activeWorkout.sessionNote = state.activeWorkout.sessionNote || '';
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  };

  const previousRenderGuided = renderGuided;
  renderGuided = function() {
    previousRenderGuided();
    injectSessionNote();
  };

  const previousCompleteWorkout = completeWorkout;
  completeWorkout = function() {
    const active = state.activeWorkout ? clone(state.activeWorkout) : null;
    if (!active) { previousCompleteWorkout(); return; }
    const beforeCount = state.history.length;
    previousCompleteWorkout();
    const summary = workoutSummary(active);
    if (state.history.length > beforeCount && state.history[0]) {
      state.history[0].programSnapshot = active.programSnapshot || null;
      state.history[0].phase = active.phase || null;
      state.history[0].goal = active.goal || null;
      state.history[0].sessionNote = active.sessionNote || '';
      state.history[0].summary = summary;
    }
    state.workoutSummaries.unshift({ date: new Date().toISOString(), day: active.day, title: active.programSnapshot?.title || active.day, ...summary });
    state.workoutSummaries = state.workoutSummaries.slice(0, 100);
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    render();
    showSummary(active, summary);
  };

  const previousRender = render;
  render = function() {
    previousRender();
    renderIntelligence();
  };

  injectIntelligenceStyles();
  injectProgressIntelligence();
  injectSummaryModal();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  renderIntelligence();
})();
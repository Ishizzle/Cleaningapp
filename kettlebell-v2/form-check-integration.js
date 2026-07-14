// Connect Form Check to workout cards, the exercise library, guided workouts,
// and the Progress dashboard.
(() => {
  const SUPPORTED_FORM_EXERCISES = new Set([
    'Goblet Squat',
    'Kettlebell Swing',
    'Single Arm Overhead Press'
  ]);

  function escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[character]));
  }

  function injectStyles() {
    if (document.getElementById('formCheckIntegrationStyles')) return;
    const style = document.createElement('style');
    style.id = 'formCheckIntegrationStyles';
    style.textContent = `
      .camera-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;background:#183c35;color:#baffdf;font-size:10px;font-weight:900;letter-spacing:.04em}
      .form-progress-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:12px}
      .form-progress-stat{padding:13px;border-radius:15px;background:var(--panel2);border:1px solid var(--line)}
      .form-progress-stat b{display:block;font-size:22px}.form-progress-stat span{font-size:11px;color:var(--muted)}
      .form-issue-list{display:grid;gap:8px;margin-top:12px}.form-issue-item{display:flex;justify-content:space-between;gap:10px;padding:10px;border-radius:13px;background:var(--panel2);border:1px solid var(--line);font-size:12px}
      .form-exercise-results{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.form-exercise-result{padding:13px;border-radius:15px;background:#142331;border:1px solid #2b465b}.form-exercise-result b{display:block}.form-exercise-result span{display:block;color:var(--muted);font-size:11px;margin-top:4px}
      @media(max-width:700px){.form-progress-grid{grid-template-columns:1fr 1fr}.form-exercise-results{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function addWorkoutButtons() {
    document.querySelectorAll('#exerciseList .exercise').forEach((row, index) => {
      const exercise = PROGRAM[state.currentDay]?.exercises?.[index];
      const actions = row.querySelector('.row-actions');
      if (!exercise || !actions || !SUPPORTED_FORM_EXERCISES.has(exercise.name)) return;
      if (actions.querySelector('.row-form-check')) return;
      const button = document.createElement('button');
      button.className = 'mini form-check-button row-form-check';
      button.textContent = 'Camera check';
      button.onclick = () => openFormCheck(exercise.name);
      actions.appendChild(button);
      const badge = document.createElement('span');
      badge.className = 'camera-badge';
      badge.textContent = '◉ Camera supported';
      row.querySelector('.exercise-main')?.appendChild(badge);
    });
  }

  function addLibraryButtons() {
    document.querySelectorAll('#libraryGrid .lib').forEach(card => {
      const name = card.querySelector('h3')?.textContent?.trim();
      if (!name || !SUPPORTED_FORM_EXERCISES.has(name) || card.querySelector('.library-form-check')) return;
      const actions = card.querySelector('.actions') || card;
      const button = document.createElement('button');
      button.className = 'mini form-check-button library-form-check';
      button.textContent = 'Camera form check';
      button.onclick = () => openFormCheck(name);
      actions.appendChild(button);
    });
  }

  function addGuidedButton() {
    if (!state.activeWorkout) return;
    const exercise = PROGRAM[state.activeWorkout.day]?.exercises?.[activeExercise];
    const actionArea = document.querySelector('#guidedExerciseGuide .actions');
    if (!exercise || !actionArea || !SUPPORTED_FORM_EXERCISES.has(exercise.name)) return;
    if (actionArea.querySelector('.guided-camera-check')) return;
    const button = document.createElement('button');
    button.className = 'mini form-check-button guided-camera-check';
    button.textContent = 'Camera form check';
    button.onclick = () => openFormCheck(exercise.name);
    actionArea.appendChild(button);
  }

  function injectProgressDashboard() {
    if (document.getElementById('formCheckProgressBlock')) return;
    const progress = document.getElementById('progressView');
    const intelligence = document.getElementById('trainingIntelligenceBlock');
    if (!progress) return;
    const block = document.createElement('div');
    block.id = 'formCheckProgressBlock';
    block.innerHTML = `
      <div class="section-head"><div><small>CAMERA COACH</small><h3>Form Check progress</h3></div><button class="secondary" onclick="openFormCheck()">Start camera check</button></div>
      <div class="card panel">
        <div class="form-progress-grid" id="formProgressStats"></div>
        <div class="form-exercise-results" id="formExerciseResults"></div>
        <div class="grid2" style="margin-top:14px">
          <div><h3>Most common coaching cues</h3><div class="form-issue-list" id="formCommonIssues"></div></div>
          <div><h3>Recent camera checks</h3><div class="form-issue-list" id="formRecentChecks"></div></div>
        </div>
      </div>`;
    if (intelligence) intelligence.insertAdjacentElement('afterend', block);
    else progress.appendChild(block);
  }

  function calculateStats() {
    const history = state.formCheckHistory || [];
    const scored = history.filter(item => Number(item.averageScore));
    const totalReps = history.reduce((sum, item) => sum + (Number(item.reps) || 0), 0);
    const averageScore = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.averageScore), 0) / scored.length) : null;
    const latestScore = scored[0]?.averageScore || null;
    const lastFive = scored.slice(0, 5);
    const priorFive = scored.slice(5, 10);
    const recentAverage = lastFive.length ? lastFive.reduce((sum, item) => sum + Number(item.averageScore), 0) / lastFive.length : null;
    const priorAverage = priorFive.length ? priorFive.reduce((sum, item) => sum + Number(item.averageScore), 0) / priorFive.length : null;
    const trend = recentAverage !== null && priorAverage !== null ? Math.round(recentAverage - priorAverage) : null;
    return { history, totalReps, averageScore, latestScore, trend };
  }

  function exerciseBreakdown(history) {
    return [...SUPPORTED_FORM_EXERCISES].map(name => {
      const checks = history.filter(item => item.exercise === name);
      const scored = checks.filter(item => Number(item.averageScore));
      return {
        name,
        checks: checks.length,
        reps: checks.reduce((sum, item) => sum + (Number(item.reps) || 0), 0),
        score: scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.averageScore), 0) / scored.length) : null
      };
    });
  }

  function commonIssues(history) {
    const counts = {};
    history.forEach(item => (item.issues || []).forEach(issue => {
      counts[issue.text] = (counts[issue.text] || 0) + (Number(issue.count) || 1);
    }));
    return Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 6);
  }

  function renderProgressDashboard() {
    const statsElement = document.getElementById('formProgressStats');
    if (!statsElement) return;
    const stats = calculateStats();
    statsElement.innerHTML = `
      <div class="form-progress-stat"><b>${stats.history.length}</b><span>camera checks</span></div>
      <div class="form-progress-stat"><b>${stats.totalReps}</b><span>reps analyzed</span></div>
      <div class="form-progress-stat"><b>${stats.averageScore ? stats.averageScore + '%' : '—'}</b><span>average score</span></div>
      <div class="form-progress-stat"><b>${stats.trend === null ? '—' : `${stats.trend > 0 ? '+' : ''}${stats.trend}`}</b><span>recent score trend</span></div>`;

    document.getElementById('formExerciseResults').innerHTML = exerciseBreakdown(stats.history).map(item => `
      <div class="form-exercise-result"><b>${escapeText(item.name)}</b><span>${item.checks} checks · ${item.reps} reps</span><span>Average score: ${item.score ? item.score + '%' : '—'}</span><button class="mini form-check-button" style="margin-top:9px" onclick="openFormCheck('${escapeText(item.name)}')">Check form</button></div>`).join('');

    const issues = commonIssues(stats.history);
    document.getElementById('formCommonIssues').innerHTML = issues.length ? issues.map(([text, count]) => `
      <div class="form-issue-item"><span>${escapeText(text)}</span><b>${count}</b></div>`).join('') : '<div class="empty">Complete camera checks to identify recurring form cues.</div>';

    document.getElementById('formRecentChecks').innerHTML = stats.history.length ? stats.history.slice(0, 6).map(item => `
      <div class="form-issue-item"><div><b>${escapeText(item.exercise)}</b><div class="meta">${new Date(item.date).toLocaleDateString()} · ${item.reps} reps</div></div><b>${item.averageScore ? item.averageScore + '%' : '—'}</b></div>`).join('') : '<div class="empty">No camera checks saved yet.</div>';
  }

  const previousRender = render;
  render = function() {
    previousRender();
    addWorkoutButtons();
    addLibraryButtons();
    renderProgressDashboard();
  };

  const previousRenderGuided = renderGuided;
  renderGuided = function() {
    previousRenderGuided();
    addGuidedButton();
  };

  injectStyles();
  injectProgressDashboard();
  addWorkoutButtons();
  addLibraryButtons();
  renderProgressDashboard();
})();
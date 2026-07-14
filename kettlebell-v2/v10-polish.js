// Version 10 interface polish: Today / Train / Progress / Settings.
(() => {
  state.ui = Object.assign({ simpleMode: true, lastPrimaryView: 'workoutView' }, state.ui || {});

  function escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[character]));
  }

  function injectPolishStyles() {
    if (document.getElementById('v10PolishStyles')) return;
    const style = document.createElement('style');
    style.id = 'v10PolishStyles';
    style.textContent = `
      .bottomnav{grid-template-columns:repeat(4,1fr)!important}.feature-toolbar{display:none!important}.hero-main{min-height:230px}.hero h2{font-size:clamp(34px,6vw,58px)}
      .v10-today{margin-top:14px;padding:18px}.v10-today-grid{display:grid;grid-template-columns:1.15fr .85fr .85fr;gap:10px}.v10-decision{padding:14px;border-radius:16px;background:var(--panel2);border:1px solid var(--line)}.v10-decision b{display:block;font-size:19px;margin-top:5px}.v10-decision span{display:block;color:var(--muted);font-size:12px;margin-top:5px;line-height:1.45}.v10-primary-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
      .v10-train-hero{padding:20px;margin-bottom:14px}.v10-tool-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}.v10-tool{display:flex;flex-direction:column;align-items:flex-start;min-height:145px;padding:16px;border-radius:18px;border:1px solid var(--line);background:var(--panel2);color:var(--text);text-align:left;cursor:pointer}.v10-tool-icon{font-size:28px}.v10-tool b{font-size:17px;margin-top:9px}.v10-tool span{color:var(--muted);font-size:12px;line-height:1.45;margin-top:5px}.v10-tool .chip{margin-top:auto}.v10-library-label{display:flex;align-items:center;gap:9px;margin:24px 2px 11px}.v10-library-label h3{margin:0}.v10-library-label small{color:var(--muted)}
      .v10-progress-nav{display:flex;gap:7px;overflow:auto;padding:2px 0 8px;margin-top:10px}.v10-progress-nav button{white-space:nowrap;border:1px solid var(--line);background:var(--panel2);color:var(--text);border-radius:999px;padding:9px 12px;font-weight:800}.v10-section-muted{color:var(--muted);font-size:12px}
      .v10-orientation{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:9px;padding:9px 10px;border-radius:11px;background:#0e1a24;border:1px solid #294156}.v10-orientation b{font-size:12px}.v10-orientation span{font-size:11px;color:var(--muted)}
      #calendarView .section-head:before,#routineBuilderView .routine-top:before{content:"TRAIN";display:block;color:var(--accent);font-size:11px;font-weight:900;letter-spacing:.13em}
      @media(orientation:landscape){.form-stage{aspect-ratio:16/9;min-height:min(62vh,600px)!important}.form-layout{grid-template-columns:minmax(0,1.6fr) minmax(285px,.7fr)}}
      @media(orientation:portrait){.form-stage{min-height:56vh!important;aspect-ratio:3/4}.form-layout{grid-template-columns:1fr}}
      @media(max-width:900px){.v10-today-grid{grid-template-columns:1fr 1fr}.v10-decision:first-child{grid-column:1/-1}.v10-tool-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:560px){.v10-today-grid,.v10-tool-grid{grid-template-columns:1fr}.v10-decision:first-child{grid-column:auto}.hero-side{display:none}.hero{grid-template-columns:1fr}.v10-tool{min-height:120px}}
    `;
    document.head.appendChild(style);
  }

  function configureNavigation() {
    const nav = document.querySelector('.bottomnav');
    if (!nav) return;
    const calendarButton = nav.querySelector('[data-view="calendarView"]');
    if (calendarButton) calendarButton.remove();
    const labels = {
      workoutView: ['⌂', 'Today'],
      libraryView: ['◆', 'Train'],
      progressView: ['◒', 'Progress'],
      settingsView: ['⚙', 'Settings']
    };
    nav.querySelectorAll('.nav').forEach(button => {
      const config = labels[button.dataset.view];
      if (!config) return;
      button.innerHTML = `<span>${config[0]}</span>${config[1]}`;
    });
    const subtitle = document.querySelector('.brand small');
    if (subtitle) subtitle.textContent = 'Private adaptive kettlebell coach';
  }

  function currentExercise() {
    const day = state.activeWorkout?.day || state.currentDay;
    const program = PROGRAM[day];
    if (!program?.exercises?.length) return null;
    const index = state.activeWorkout?.exerciseIndex ?? program.exercises.findIndex((exercise, exerciseIndex) => !state.exerciseDone?.[exKey(exerciseIndex, day, state.week)]);
    return program.exercises[Math.max(0, index)] || program.exercises[0];
  }

  function injectTodayCard() {
    if (document.getElementById('v10TodayCard')) return;
    const card = document.createElement('div');
    card.id = 'v10TodayCard';
    card.className = 'card v10-today';
    const anchor = document.getElementById('phaseBanner') || document.querySelector('#workoutView .metrics');
    anchor?.insertAdjacentElement('afterend', card);
  }

  function renderTodayCard() {
    const card = document.getElementById('v10TodayCard');
    if (!card) return;
    const day = state.activeWorkout?.day || state.currentDay;
    const program = PROGRAM[day];
    const exercise = currentExercise();
    const weight = exercise ? suggestedWeight(exercise, day) : 0;
    const phase = typeof getTrainingPhase === 'function' ? getTrainingPhase(state.week) : { name: `Week ${state.week}`, focus: program?.focus || 'Train consistently' };
    const recovery = state.recoveryHistory?.[0];
    const actionLabel = state.activeWorkout ? 'Resume workout' : 'Start workout';
    const action = state.activeWorkout ? 'resumeWorkout()' : 'startGuidedWorkout()';
    card.innerHTML = `
      <div class="eyebrow">TODAY AT A GLANCE</div>
      <div class="v10-today-grid">
        <div class="v10-decision"><small class="meta">DO THIS</small><b>${escapeText(day)} · ${escapeText(program?.title || 'Workout')}</b><span>${escapeText(program?.focus || '')} · about ${program?.duration || '—'} minutes</span></div>
        <div class="v10-decision"><small class="meta">START WITH</small><b>${escapeText(exercise?.name || 'Choose a workout')}</b><span>${exercise ? `${weight ? `${weight} kg` : 'Bodyweight'} · ${exercise.sets} sets · ${exercise.reps}` : 'No exercise selected'}</span></div>
        <div class="v10-decision"><small class="meta">FOCUS</small><b>${escapeText(phase.name || 'Training')}</b><span>${escapeText(recovery?.recommendation || phase.focus || 'Use controlled, pain-free form.')}</span></div>
      </div>
      <div class="v10-primary-actions"><button class="primary" onclick="${action}">${actionLabel}</button><button class="secondary" onclick="toggleQuickMode()">${state.quickMode ? 'Use full workout' : 'Use 20-minute mode'}</button><button class="secondary" onclick="showView('libraryView')">Training tools</button></div>`;
  }

  function injectTrainHub() {
    const view = document.getElementById('libraryView');
    if (!view || document.getElementById('v10TrainHub')) return;
    const existingHeader = view.querySelector('.section-head');
    const hub = document.createElement('div');
    hub.id = 'v10TrainHub';
    hub.innerHTML = `
      <div class="card v10-train-hero">
        <div class="eyebrow">TRAIN</div><h2 style="margin:7px 0 4px">Choose how you want to train</h2><div class="meta">Your program, custom routines, conditioning timers, camera coaching, and movement instructions are all here.</div>
        <div class="v10-tool-grid">
          <button class="v10-tool" onclick="showView('workoutView')"><span class="v10-tool-icon">⚡</span><b>Guided program</b><span>Follow today’s adaptive workout and record every set.</span><span class="chip">Recommended</span></button>
          <button class="v10-tool" onclick="openV10Routines()"><span class="v10-tool-icon">▤</span><b>Custom routines</b><span>Build, copy, and run your own kettlebell sessions.</span><span class="chip">Templates</span></button>
          <button class="v10-tool" onclick="openIntervalTimer()"><span class="v10-tool-icon">◷</span><b>Interval training</b><span>Run EMOM, AMRAP, Tabata, or custom circuits.</span><span class="chip">Conditioning</span></button>
          <button class="v10-tool" onclick="openFormCheck()"><span class="v10-tool-icon">◎</span><b>Camera coach</b><span>Check squat, swing, or overhead-press movement.</span><span class="chip">Beta</span></button>
          <button class="v10-tool" onclick="showView('calendarView')"><span class="v10-tool-icon">▦</span><b>Calendar</b><span>Review completed, missed, moved, and skipped workouts.</span><span class="chip">Schedule</span></button>
          <button class="v10-tool" onclick="scrollToMovementLibrary()"><span class="v10-tool-icon">◫</span><b>Movement library</b><span>Open detailed instructions, videos, and offline media.</span><span class="chip">Technique</span></button>
        </div>
      </div>`;
    view.insertBefore(hub, existingHeader);
    if (existingHeader) {
      existingHeader.id = 'movementLibraryHeader';
      existingHeader.querySelector('small').textContent = 'MOVEMENT LIBRARY';
      existingHeader.querySelector('h3').textContent = 'Instructions and technique';
    }
  }

  window.openV10Routines = function() {
    if (typeof renderRoutineBuilder === 'function') renderRoutineBuilder();
    showView('routineBuilderView');
  };

  window.scrollToMovementLibrary = function() {
    showView('libraryView');
    setTimeout(() => document.getElementById('movementLibraryHeader')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };

  function injectProgressNavigation() {
    const progress = document.getElementById('progressView');
    if (!progress || document.getElementById('v10ProgressNav')) return;
    const nav = document.createElement('div');
    nav.id = 'v10ProgressNav';
    nav.className = 'v10-progress-nav';
    nav.innerHTML = `
      <button onclick="jumpV10Progress('advancedProgress')">Performance</button>
      <button onclick="jumpV10Progress('trainingIntelligenceBlock')">Training balance</button>
      <button onclick="jumpV10Progress('formCheckProgressBlock')">Camera scores</button>
      <button onclick="jumpV10Progress('bodyProgressBlock')">Body progress</button>
      <button onclick="jumpV10Progress('historyList')">History</button>`;
    progress.querySelector('.section-head')?.insertAdjacentElement('afterend', nav);
  }

  window.jumpV10Progress = function(id) {
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  function updateOrientationStatus() {
    const setup = document.getElementById('formSetup');
    if (!setup) return;
    let badge = document.getElementById('v10OrientationStatus');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'v10OrientationStatus';
      badge.className = 'v10-orientation';
      setup.insertAdjacentElement('afterend', badge);
    }
    const orientation = matchMedia('(orientation: portrait)').matches ? 'Portrait' : 'Landscape';
    const exercise = document.getElementById('formExercise')?.value || 'Goblet Squat';
    const recommendation = exercise === 'Kettlebell Swing' ? 'Landscape is recommended for the full swing path.' : 'Either orientation works when your full body remains visible.';
    badge.innerHTML = `<b>Device: ${orientation}</b><span>${recommendation}</span>`;
  }

  function setPrimaryNavigation(viewId) {
    const primary = ['workoutView', 'libraryView', 'progressView', 'settingsView'].includes(viewId) ? viewId : ['calendarView', 'routineBuilderView'].includes(viewId) ? 'libraryView' : state.ui.lastPrimaryView;
    document.querySelectorAll('.bottomnav .nav').forEach(button => button.classList.toggle('active', button.dataset.view === primary));
  }

  const previousShowView = showView;
  showView = function(id) {
    previousShowView(id);
    if (['workoutView', 'libraryView', 'progressView', 'settingsView'].includes(id)) state.ui.lastPrimaryView = id;
    setPrimaryNavigation(id);
  };

  const previousOpenFormCheck = window.openFormCheck;
  if (typeof previousOpenFormCheck === 'function') {
    window.openFormCheck = function(exerciseName) {
      previousOpenFormCheck(exerciseName);
      updateOrientationStatus();
    };
  }

  const previousChangeFormExercise = window.changeFormExercise;
  if (typeof previousChangeFormExercise === 'function') {
    window.changeFormExercise = function(reset = true) {
      previousChangeFormExercise(reset);
      updateOrientationStatus();
    };
  }

  const previousRender = render;
  render = function() {
    previousRender();
    configureNavigation();
    injectTodayCard();
    injectTrainHub();
    injectProgressNavigation();
    renderTodayCard();
    updateOrientationStatus();
    setPrimaryNavigation(document.querySelector('.view.active')?.id || state.ui.lastPrimaryView);
  };

  window.addEventListener('resize', updateOrientationStatus);
  window.addEventListener('orientationchange', () => setTimeout(updateOrientationStatus, 150));

  injectPolishStyles();
  configureNavigation();
  injectTodayCard();
  injectTrainHub();
  injectProgressNavigation();
  renderTodayCard();
  updateOrientationStatus();
})();
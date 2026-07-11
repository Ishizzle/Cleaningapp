// Kettlebell Coach practical features: calendar, missed workouts, exercise swaps,
// personal records, progress charts, and quick workout mode.
(() => {
  state.version = 4;
  state.calendar = state.calendar || { makeups: {}, skipped: {} };
  state.exerciseSwaps = state.exerciseSwaps || {};
  state.personalRecords = state.personalRecords || {};
  state.quickMode = Boolean(state.quickMode);

  const BASE_PROGRAM = JSON.parse(JSON.stringify(PROGRAM));
  const EXERCISE_MAP = {};
  Object.values(BASE_PROGRAM).forEach(day => day.exercises.forEach(ex => {
    if (!EXERCISE_MAP[ex.name]) EXERCISE_MAP[ex.name] = ex;
  }));

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function applySavedSwaps() {
    Object.entries(BASE_PROGRAM).forEach(([day, data]) => {
      PROGRAM[day].exercises = data.exercises.map((original, index) => {
        const swap = state.exerciseSwaps[`${day}-${index}`];
        if (!swap || !EXERCISE_MAP[swap.to]) return clone(original);
        const replacement = clone(EXERCISE_MAP[swap.to]);
        replacement.sets = original.sets;
        replacement.rest = original.rest;
        return replacement;
      });
    });
  }

  function injectFeatureStyles() {
    if (document.getElementById('featureStylesV4')) return;
    const style = document.createElement('style');
    style.id = 'featureStylesV4';
    style.textContent = `
      .bottomnav{grid-template-columns:repeat(5,1fr)}
      .feature-toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}
      .quick-toggle{border:1px solid var(--line);background:var(--panel2);color:var(--text);padding:10px 12px;border-radius:12px;font-weight:850;cursor:pointer}
      .quick-toggle.on{background:var(--accent);color:#0c1403;border-color:var(--accent)}
      .calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:9px}
      .calendar-day{min-height:150px;padding:13px;border-radius:17px;background:var(--panel2);border:1px solid var(--line);display:flex;flex-direction:column;gap:7px}
      .calendar-day.today{outline:2px solid var(--blue)}
      .calendar-day.completed{background:#20341a;border-color:#496f30}
      .calendar-day.missed{border-color:#76504a;background:#302125}
      .calendar-day.skipped{opacity:.58}
      .calendar-date{font-size:12px;color:var(--muted)}
      .calendar-day h4{margin:0}.calendar-status{font-size:12px;color:var(--muted);min-height:30px}
      .calendar-actions{display:flex;gap:5px;flex-wrap:wrap;margin-top:auto}.calendar-actions button{border:1px solid var(--line);background:#111c28;color:var(--text);border-radius:9px;padding:6px 8px;font-size:11px;font-weight:800}
      .feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px}
      .pr-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}
      .pr-card{padding:13px;border-radius:15px;background:var(--panel2);border:1px solid var(--line)}
      .pr-card b{display:block}.pr-value{font-size:23px;color:var(--accent);font-weight:950;margin-top:5px}
      .bar-chart{height:220px;display:flex;align-items:flex-end;gap:7px;padding:15px 2px 31px}.chart-bar{flex:1;min-width:15px;border-radius:9px 9px 3px 3px;background:linear-gradient(180deg,var(--accent),#5d8f25);position:relative}.chart-bar span{position:absolute;left:50%;bottom:-24px;transform:translateX(-50%);font-size:10px;color:var(--muted);white-space:nowrap}.chart-bar em{position:absolute;left:50%;top:-19px;transform:translateX(-50%);font-size:10px;color:var(--text);font-style:normal}
      .swap-tag{display:inline-block;margin-top:5px;padding:4px 7px;border-radius:999px;background:#352d1c;color:#ffd991;font-size:11px}.swap-modal-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;max-height:52vh;overflow:auto}.swap-choice{padding:12px;border-radius:13px;border:1px solid var(--line);background:var(--panel2);color:var(--text);text-align:left;font-weight:800}.swap-choice.active{border-color:var(--accent);color:var(--accent)}
      .makeup-banner{padding:13px;border-radius:15px;background:#1d3040;border:1px solid #35526a;margin-bottom:12px}.short-note{font-size:12px;color:var(--muted);line-height:1.5}
      @media(max-width:900px){.calendar-grid{grid-template-columns:repeat(4,1fr)}.feature-grid{grid-template-columns:1fr}}
      @media(max-width:620px){.calendar-grid{grid-template-columns:1fr 1fr}.calendar-day{min-height:137px}.swap-modal-grid{grid-template-columns:1fr}.pr-grid{grid-template-columns:1fr}.bottomnav{grid-template-columns:repeat(5,1fr)}.nav{font-size:9px}}
    `;
    document.head.appendChild(style);
  }

  function injectCalendarView() {
    if (document.getElementById('calendarView')) return;
    const view = document.createElement('section');
    view.className = 'view';
    view.id = 'calendarView';
    view.innerHTML = `
      <div class="section-head"><div><small>SCHEDULE</small><h3>Workout calendar</h3></div></div>
      <div id="makeupNotice"></div>
      <div class="card panel"><div class="calendar-grid" id="calendarGrid"></div></div>
      <div class="card panel" style="margin-top:14px"><h3>Missed workout options</h3><p class="meta">Open a missed workout now, move it to Saturday, or skip it without marking it completed.</p><div id="missedWorkoutList"></div></div>`;
    document.querySelector('.app').appendChild(view);

    const nav = document.querySelector('.bottomnav');
    const button = document.createElement('button');
    button.className = 'nav';
    button.dataset.view = 'calendarView';
    button.onclick = () => showView('calendarView');
    button.innerHTML = '<span>▦</span>Calendar';
    nav.insertBefore(button, nav.children[3]);
  }

  function injectSwapModal() {
    if (document.getElementById('swapModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'swapModal';
    modal.innerHTML = `<div class="card modal-card"><div class="modal-head"><div><div class="eyebrow">REPLACE EXERCISE</div><h2 id="swapTitle" style="margin:5px 0">Choose a movement</h2></div><button class="secondary" onclick="closeSwapModal()">Close</button></div><p class="meta">The replacement is saved for this workout day until you reset it.</p><div class="swap-modal-grid" id="swapChoices"></div><div class="actions"><button class="secondary" onclick="resetCurrentSwap()">Restore original</button></div></div>`;
    document.body.appendChild(modal);
  }

  function injectProgressFeatures() {
    if (document.getElementById('advancedProgress')) return;
    const progressView = document.getElementById('progressView');
    const historyHeader = [...progressView.querySelectorAll('.section-head')].find(el => el.textContent.includes('HISTORY'));
    const block = document.createElement('div');
    block.id = 'advancedProgress';
    block.innerHTML = `
      <div class="section-head"><div><small>PERFORMANCE</small><h3>Records and trends</h3></div></div>
      <div class="feature-grid">
        <div class="card panel"><h3>Personal records</h3><div class="pr-grid" id="personalRecords"></div></div>
        <div class="card panel"><h3>Sessions by week</h3><div class="bar-chart" id="sessionChart"></div></div>
      </div>
      <div class="card panel" style="margin-top:14px"><h3>Recent training volume</h3><p class="short-note">Volume is estimated from kettlebell weight multiplied by recorded reps. Bodyweight exercises are excluded.</p><div class="bar-chart" id="volumeChart"></div></div>`;
    progressView.insertBefore(block, historyHeader);
  }

  function injectQuickModeControls() {
    const head = document.querySelector('#workoutView .workout-head');
    if (!head || document.getElementById('quickModeBtn')) return;
    const toolbar = document.createElement('div');
    toolbar.className = 'feature-toolbar';
    toolbar.innerHTML = `<button id="quickModeBtn" class="quick-toggle" onclick="toggleQuickMode()">20-minute mode</button><span class="short-note" id="quickModeText">Full workout: all exercises and planned sets.</span>`;
    head.parentElement.insertBefore(toolbar, head.nextSibling);
  }

  let swapTarget = null;
  window.openSwapModal = function(day, index) {
    swapTarget = { day, index };
    const original = BASE_PROGRAM[day].exercises[index];
    document.getElementById('swapTitle').textContent = `Replace ${original.name}`;
    const choices = document.getElementById('swapChoices');
    choices.innerHTML = '';
    const current = state.exerciseSwaps[`${day}-${index}`]?.to || original.name;
    const names = [...new Set([original.name, ...original.subs.filter(name => EXERCISE_MAP[name]), ...Object.keys(EXERCISE_MAP)])];
    names.slice(0, 30).forEach(name => {
      const button = document.createElement('button');
      button.className = 'swap-choice' + (name === current ? ' active' : '');
      button.textContent = name;
      button.onclick = () => saveExerciseSwap(name);
      choices.appendChild(button);
    });
    document.getElementById('swapModal').classList.add('open');
  };
  window.closeSwapModal = () => document.getElementById('swapModal').classList.remove('open');
  window.saveExerciseSwap = function(name) {
    if (!swapTarget) return;
    const key = `${swapTarget.day}-${swapTarget.index}`;
    const original = BASE_PROGRAM[swapTarget.day].exercises[swapTarget.index].name;
    if (name === original) delete state.exerciseSwaps[key];
    else state.exerciseSwaps[key] = { from: original, to: name, date: new Date().toISOString() };
    applySavedSwaps();
    closeSwapModal();
    persist();
  };
  window.resetCurrentSwap = function() {
    if (!swapTarget) return;
    delete state.exerciseSwaps[`${swapTarget.day}-${swapTarget.index}`];
    applySavedSwaps();
    closeSwapModal();
    persist();
  };

  window.toggleQuickMode = function() {
    state.quickMode = !state.quickMode;
    persist();
  };

  function renderQuickMode() {
    const button = document.getElementById('quickModeBtn');
    const text = document.getElementById('quickModeText');
    if (!button || !text) return;
    button.classList.toggle('on', state.quickMode);
    button.textContent = state.quickMode ? '20-minute mode on' : '20-minute mode';
    text.textContent = state.quickMode ? 'Uses the first three exercises with fewer sets.' : 'Full workout: all exercises and planned sets.';
  }

  function renderSwapButtons() {
    const rows = document.querySelectorAll('#exerciseList .exercise');
    rows.forEach((row, index) => {
      const actions = row.querySelector('.row-actions');
      if (!actions || actions.querySelector('.swap-button')) return;
      const button = document.createElement('button');
      button.className = 'mini secondary swap-button';
      button.textContent = 'Swap';
      button.onclick = () => openSwapModal(state.currentDay, index);
      actions.prepend(button);
      const swap = state.exerciseSwaps[`${state.currentDay}-${index}`];
      if (swap) {
        const info = row.querySelector('.meta');
        info.insertAdjacentHTML('afterend', `<span class="swap-tag">Replaced ${swap.from}</span>`);
      }
    });
  }

  function startOfWeek(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }
  function isoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function trainingDayForIndex(index) {
    return ['Monday','Tuesday','Wednesday','Thursday','Friday'][index] || null;
  }

  window.openCalendarWorkout = function(day) {
    state.currentDay = day;
    persist(true);
    showView('workoutView');
  };
  window.moveWorkoutToSaturday = function(day) {
    const saturday = new Date(startOfWeek());
    saturday.setDate(saturday.getDate() + 5);
    state.calendar.makeups[`${state.week}-${day}`] = isoDate(saturday);
    delete state.calendar.skipped[`${state.week}-${day}`];
    persist();
  };
  window.skipCalendarWorkout = function(day) {
    state.calendar.skipped[`${state.week}-${day}`] = true;
    delete state.calendar.makeups[`${state.week}-${day}`];
    persist();
  };
  window.undoCalendarDecision = function(day) {
    delete state.calendar.skipped[`${state.week}-${day}`];
    delete state.calendar.makeups[`${state.week}-${day}`];
    persist();
  };

  function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    const monday = startOfWeek();
    const today = new Date();today.setHours(0,0,0,0);
    const saturday = new Date(monday);saturday.setDate(saturday.getDate()+5);
    const missed = [];
    grid.innerHTML = '';
    for (let i=0;i<7;i++) {
      const date = new Date(monday);date.setDate(date.getDate()+i);
      const dateISO = isoDate(date), day = trainingDayForIndex(i);
      const makeupEntries = Object.entries(state.calendar.makeups).filter(([,value]) => value === dateISO);
      const completed = day ? Boolean(state.completed[dayKey(day)]) : false;
      const skipped = day ? Boolean(state.calendar.skipped[`${state.week}-${day}`]) : false;
      const isPast = date < today;
      const isMissed = Boolean(day && isPast && !completed && !skipped && !state.calendar.makeups[`${state.week}-${day}`]);
      if (isMissed) missed.push(day);
      const card = document.createElement('div');
      card.className = `calendar-day${dateISO===isoDate(today)?' today':''}${completed?' completed':''}${isMissed?' missed':''}${skipped?' skipped':''}`;
      let title = day || (i===5?'Saturday':'Sunday');
      let status = day ? (completed?'Completed':skipped?'Skipped':isMissed?'Missed':'Scheduled') : 'Rest day';
      if (makeupEntries.length) status = `Makeup: ${makeupEntries.map(([key])=>key.split('-').slice(1).join('-')).join(', ')}`;
      card.innerHTML = `<div class="calendar-date">${date.toLocaleDateString([], {month:'short',day:'numeric'})}</div><h4>${title}</h4><div class="calendar-status">${status}</div><div class="calendar-actions"></div>`;
      const actions = card.querySelector('.calendar-actions');
      if (day) {
        const open = document.createElement('button');open.textContent='Open';open.onclick=()=>openCalendarWorkout(day);actions.appendChild(open);
        if (isMissed) {const move=document.createElement('button');move.textContent='Move to Sat';move.onclick=()=>moveWorkoutToSaturday(day);actions.appendChild(move);const skip=document.createElement('button');skip.textContent='Skip';skip.onclick=()=>skipCalendarWorkout(day);actions.appendChild(skip)}
        if (skipped || state.calendar.makeups[`${state.week}-${day}`]) {const undo=document.createElement('button');undo.textContent='Undo';undo.onclick=()=>undoCalendarDecision(day);actions.appendChild(undo)}
      }
      makeupEntries.forEach(([key]) => {const makeupDay=key.split('-').slice(1).join('-');const open=document.createElement('button');open.textContent=`Open ${makeupDay}`;open.onclick=()=>openCalendarWorkout(makeupDay);actions.appendChild(open)});
      grid.appendChild(card);
    }
    const notice = document.getElementById('makeupNotice');
    const scheduled = Object.entries(state.calendar.makeups).filter(([,value])=>value===isoDate(saturday));
    notice.innerHTML = scheduled.length ? `<div class="makeup-banner"><b>Saturday makeup planned</b><div class="meta">${scheduled.map(([key])=>key.split('-').slice(1).join('-')).join(', ')}</div></div>` : '';
    const list = document.getElementById('missedWorkoutList');
    list.innerHTML = missed.length ? missed.map(day=>`<div class="history-item"><div><b>${day}</b><div class="meta">This workout has not been completed.</div></div><div class="calendar-actions"><button onclick="openCalendarWorkout('${day}')">Do now</button><button onclick="moveWorkoutToSaturday('${day}')">Saturday</button><button onclick="skipCalendarWorkout('${day}')">Skip</button></div></div>`).join('') : '<div class="empty">No unresolved missed workouts this week.</div>';
  }

  function numeric(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  function updatePersonalRecord(exerciseName, logs) {
    const completed = logs.filter(log => log.completed);
    if (!completed.length) return;
    const maxWeight = Math.max(...completed.map(log => numeric(log.weight)));
    const maxReps = Math.max(...completed.map(log => numeric(log.left) + numeric(log.right)));
    const current = state.personalRecords[exerciseName] || { maxWeight:0, maxReps:0 };
    state.personalRecords[exerciseName] = {
      maxWeight: Math.max(current.maxWeight || 0, maxWeight),
      maxReps: Math.max(current.maxReps || 0, maxReps),
      updatedAt: new Date().toISOString()
    };
  }

  function renderPersonalRecords() {
    const grid = document.getElementById('personalRecords');
    if (!grid) return;
    const records = Object.entries(state.personalRecords).sort((a,b)=>(b[1].maxWeight||0)-(a[1].maxWeight||0));
    grid.innerHTML = records.length ? records.slice(0,8).map(([name,record])=>`<div class="pr-card"><b>${name}</b><div class="pr-value">${record.maxWeight ? record.maxWeight+' kg' : record.maxReps+' reps'}</div><div class="meta">Best set: ${record.maxReps||0} total reps</div></div>`).join('') : '<div class="empty">Complete and rate exercises to build personal records.</div>';
  }

  function renderBarChart(targetId, values, labels, suffix='') {
    const chart = document.getElementById(targetId);
    if (!chart) return;
    const max = Math.max(1, ...values);
    chart.innerHTML = values.map((value,index)=>`<div class="chart-bar" style="height:${Math.max(8,value/max*175)}px"><em>${Math.round(value)}${suffix}</em><span>${labels[index]}</span></div>`).join('');
  }
  function workoutVolume(historyItem) {
    if (!historyItem.setLogs) return 0;
    return Object.values(historyItem.setLogs).filter(log=>log.completed).reduce((sum,log)=>sum + numeric(log.weight) * (numeric(log.left)+numeric(log.right)),0);
  }
  function renderCharts() {
    const weekly = Array.from({length:12},(_,i)=>state.history.filter(h=>Number(h.week)===i+1).length);
    renderBarChart('sessionChart',weekly,weekly.map((_,i)=>`W${i+1}`));
    const recent = [...state.history].slice(0,8).reverse();
    renderBarChart('volumeChart',recent.map(workoutVolume),recent.map(h=>h.day.slice(0,3)));
  }

  const baseRateExercise = rateExercise;
  rateExercise = function(rating) {
    if (state.activeWorkout) {
      const ex = PROGRAM[state.activeWorkout.day].exercises[activeExercise];
      updatePersonalRecord(ex.name, getExerciseSetLogs(activeExercise));
    }
    baseRateExercise(rating);
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    renderEnhancements();
  };

  const baseCreateActiveWorkout = createActiveWorkout;
  createActiveWorkout = function(recovery) {
    const adjusted = state.quickMode ? {...recovery,setFactor:Math.min(recovery.setFactor,.6),recommendation:`${recovery.recommendation} · 20-minute mode`} : recovery;
    baseCreateActiveWorkout(adjusted);
    if (state.quickMode && state.activeWorkout) {
      state.activeWorkout.quickMode = true;
      Object.keys(state.activeWorkout.setLogs).forEach(key => {
        const exerciseIndex = Number(key.split('-')[0]);
        if (exerciseIndex >= 3) delete state.activeWorkout.setLogs[key];
      });
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    }
  };

  const baseRenderGuided = renderGuided;
  renderGuided = function() {
    baseRenderGuided();
    if (state.activeWorkout?.quickMode) {
      document.querySelectorAll('#steps .step').forEach((step,index)=>step.style.display=index<3?'':'none');
      document.getElementById('modalProgress').textContent = `${Math.min(activeExercise+1,3)} of 3 exercises · 20-minute mode`;
      document.getElementById('modalFill').style.width = `${Math.min(activeExercise+1,3)/3*100}%`;
    }
  };

  const baseNextExercise = nextExercise;
  nextExercise = function() {
    if (state.activeWorkout?.quickMode && activeExercise >= 2) {
      const a = state.activeWorkout;
      state.exerciseDone[exKey(activeExercise,a.day,a.week)] = true;
      const ex = PROGRAM[a.day].exercises[activeExercise];
      if (!state.progression[logKey(a.day,ex.name)]) rateExercise('good');
      completeWorkout();
      return;
    }
    baseNextExercise();
  };

  function renderEnhancements() {
    renderQuickMode();
    renderSwapButtons();
    renderCalendar();
    renderPersonalRecords();
    renderCharts();
  }

  injectFeatureStyles();
  injectCalendarView();
  injectSwapModal();
  injectProgressFeatures();
  injectQuickModeControls();
  applySavedSwaps();

  const baseRender = render;
  render = function() {
    baseRender();
    renderEnhancements();
  };

  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  render();
})();
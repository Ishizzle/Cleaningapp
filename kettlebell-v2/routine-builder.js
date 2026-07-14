// Custom routines, reusable templates, custom exercises, and superset groups.
(() => {
  state.routines = Array.isArray(state.routines) ? state.routines : [];
  state.customExercises = Array.isArray(state.customExercises) ? state.customExercises : [];
  let draftRoutine = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function makeId(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

  function catalog() {
    const map = {};
    uniqueExercises().forEach(exercise => { map[exercise.name] = clone(exercise); });
    state.customExercises.forEach(exercise => { map[exercise.name] = clone(exercise); });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }

  function exerciseByName(name) {
    return catalog().find(exercise => exercise.name === name) || null;
  }

  function normalizeExercise(exercise) {
    return Object.assign({
      name: 'Custom Exercise', sets: 3, reps: '8', rest: 60, defaultWeight: 0,
      weights: state.weightsOwned.length ? [...state.weightsOwned] : [0],
      cue: 'Use controlled form and stop before technique breaks down.',
      mistakes: ['Moving too quickly', 'Using more load than you can control'],
      subs: [], video: '', defaultSetType: 'normal', supersetGroup: ''
    }, exercise || {});
  }

  function injectBuilderStyles() {
    if (document.getElementById('routineBuilderStyles')) return;
    const style = document.createElement('style');
    style.id = 'routineBuilderStyles';
    style.textContent = `
      .routine-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.routine-list{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.routine-card{padding:17px}.routine-card h3{margin:0 0 5px}.routine-exercises{margin:10px 0;color:var(--muted);font-size:13px;line-height:1.55}
      .builder-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:14px}.builder-sidebar,.builder-main{padding:18px}.builder-row{display:grid;grid-template-columns:1.4fr .55fr .8fr .65fr .8fr .65fr auto;gap:8px;align-items:center;padding:11px;border-radius:15px;background:var(--panel2);border:1px solid var(--line);margin-top:9px}.builder-row input,.builder-row select{width:100%;background:#0d151f;border:1px solid var(--line);border-radius:9px;color:var(--text);padding:9px}.builder-order{display:flex;gap:4px}.builder-order button{border:1px solid var(--line);background:#111c28;color:var(--text);border-radius:8px;padding:7px 8px}
      .catalog-add{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.catalog-add select{background:#0d151f;border:1px solid var(--line);border-radius:11px;color:var(--text);padding:10px}.routine-empty{padding:24px;text-align:center;color:var(--muted)}.routine-toolbar-button{margin-left:6px}
      .custom-exercise-form{margin-top:15px;padding-top:15px;border-top:1px solid var(--line)}.custom-exercise-grid{display:grid;grid-template-columns:1.2fr .6fr .6fr;gap:8px}.custom-exercise-grid input{background:#0d151f;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:10px}
      @media(max-width:900px){.builder-grid{grid-template-columns:1fr}.routine-list{grid-template-columns:1fr}.builder-row{grid-template-columns:1fr 1fr}.builder-row .exercise-name{grid-column:1/-1}.builder-order{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function injectBuilderView() {
    if (document.getElementById('routineBuilderView')) return;
    const view = document.createElement('section');
    view.className = 'view';
    view.id = 'routineBuilderView';
    view.innerHTML = `
      <div class="routine-top"><div><small class="meta">CUSTOM TRAINING</small><h2 style="margin:4px 0">Routines and templates</h2></div><div class="actions"><button class="secondary" onclick="showView('workoutView')">Back to workout</button><button class="primary" onclick="newRoutineDraft()">New routine</button></div></div>
      <div class="section-head"><div><small>SAVED</small><h3>Your routines</h3></div></div>
      <div class="routine-list" id="savedRoutineList"></div>
      <div class="section-head"><div><small>BUILDER</small><h3>Create or edit</h3></div></div>
      <div class="builder-grid">
        <div class="card builder-sidebar">
          <div class="field"><label>Routine name</label><input id="routineName" placeholder="Saturday Strength"></div>
          <div class="field"><label>Focus</label><select id="routineFocus"><option value="Strength">Strength</option><option value="Conditioning">Conditioning</option><option value="Full body">Full body</option><option value="Mobility">Mobility</option><option value="Recovery">Recovery</option></select></div>
          <div class="field"><label>Estimated duration</label><select id="routineDuration">${[15,20,30,40,45,50,60].map(value => `<option value="${value}">${value} minutes</option>`).join('')}</select></div>
          <div class="field"><label>Add exercise</label><div class="catalog-add"><select id="routineExerciseSelect"></select><button class="secondary" onclick="addExerciseToDraft()">Add</button></div></div>
          <div class="actions"><button class="secondary" onclick="copyCurrentDayToDraft()">Copy selected day</button><button class="primary" onclick="saveRoutineDraft()">Save routine</button></div>
          <div class="custom-exercise-form"><h3>New custom exercise</h3><div class="custom-exercise-grid"><input id="customExerciseName" placeholder="Exercise name"><input id="customExerciseSets" type="number" min="1" value="3" placeholder="Sets"><input id="customExerciseReps" placeholder="Reps" value="8"></div><div class="field"><label>Coaching cue</label><input id="customExerciseCue" placeholder="Keep the movement controlled"></div><button class="secondary" onclick="createCustomExercise()">Create and add</button></div>
        </div>
        <div class="card builder-main"><div class="meta">Set types: warm-up, working, AMRAP, drop, technical failure, or timed. Use the same letter to group exercises into a superset or circuit.</div><div id="routineDraftRows"></div></div>
      </div>`;
    document.querySelector('.app').appendChild(view);
  }

  function injectRoutineButtons() {
    const toolbar = document.querySelector('#workoutView .feature-toolbar');
    if (toolbar && !document.getElementById('openRoutinesButton')) {
      const button = document.createElement('button');
      button.id = 'openRoutinesButton';
      button.className = 'quick-toggle routine-toolbar-button';
      button.textContent = 'Routines';
      button.onclick = () => { renderRoutineBuilder(); showView('routineBuilderView'); };
      toolbar.appendChild(button);
    }
    const settingsPanel = document.querySelector('#settingsView .panel');
    if (settingsPanel && !document.getElementById('settingsRoutineButton')) {
      const button = document.createElement('button');
      button.id = 'settingsRoutineButton';
      button.className = 'secondary';
      button.style.marginTop = '12px';
      button.textContent = 'Manage routines';
      button.onclick = () => { renderRoutineBuilder(); showView('routineBuilderView'); };
      settingsPanel.appendChild(button);
    }
  }

  window.newRoutineDraft = function() {
    draftRoutine = { id: null, name: 'New Routine', focus: 'Full body', duration: 30, exercises: [] };
    renderRoutineBuilder();
  };

  window.copyCurrentDayToDraft = function() {
    const day = PROGRAM[state.currentDay] ? state.currentDay : 'Monday';
    const source = PROGRAM[day] || PROGRAM.Monday;
    draftRoutine = {
      id: null,
      name: `${day} Copy`,
      focus: source.focus || source.title,
      duration: source.duration || 40,
      exercises: source.exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets,
        reps: exercise.reps,
        rest: exercise.rest,
        defaultWeight: suggestedWeight(exercise, day),
        defaultSetType: exercise.defaultSetType || 'normal',
        supersetGroup: exercise.supersetGroup || ''
      }))
    };
    renderRoutineBuilder();
  };

  window.editRoutine = function(id) {
    const routine = state.routines.find(item => item.id === id);
    if (!routine) return;
    draftRoutine = clone(routine);
    renderRoutineBuilder();
    showView('routineBuilderView');
  };

  window.deleteRoutine = function(id) {
    const routine = state.routines.find(item => item.id === id);
    if (!routine || !confirm(`Delete ${routine.name}?`)) return;
    state.routines = state.routines.filter(item => item.id !== id);
    if (draftRoutine?.id === id) draftRoutine = null;
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    renderRoutineBuilder();
    toast('Routine deleted');
  };

  window.addExerciseToDraft = function() {
    if (!draftRoutine) newRoutineDraft();
    const name = document.getElementById('routineExerciseSelect').value;
    const exercise = exerciseByName(name);
    if (!exercise) return;
    draftRoutine.exercises.push({
      name: exercise.name,
      sets: Number(exercise.sets) || 3,
      reps: String(exercise.reps || '8'),
      rest: Number(exercise.rest) || 60,
      defaultWeight: Number(exercise.defaultWeight) || 0,
      defaultSetType: 'normal',
      supersetGroup: ''
    });
    renderRoutineBuilder();
  };

  window.createCustomExercise = function() {
    const name = document.getElementById('customExerciseName').value.trim();
    if (!name) { toast('Enter an exercise name'); return; }
    if (exerciseByName(name)) { toast('That exercise already exists'); return; }
    const exercise = normalizeExercise({
      name,
      sets: Math.max(1, Number(document.getElementById('customExerciseSets').value) || 3),
      reps: document.getElementById('customExerciseReps').value.trim() || '8',
      cue: document.getElementById('customExerciseCue').value.trim() || 'Move with control and stop before form breaks down.',
      defaultWeight: 0,
      weights: [0, ...state.weightsOwned]
    });
    state.customExercises.push(exercise);
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    if (!draftRoutine) newRoutineDraft();
    draftRoutine.exercises.push({ name: exercise.name, sets: exercise.sets, reps: exercise.reps, rest: exercise.rest, defaultWeight: 0, defaultSetType: 'normal', supersetGroup: '' });
    renderRoutineBuilder();
    toast('Custom exercise added');
  };

  window.updateDraftExercise = function(index, field, value) {
    if (!draftRoutine?.exercises?.[index]) return;
    if (['sets', 'rest', 'defaultWeight'].includes(field)) value = Number(value) || 0;
    draftRoutine.exercises[index][field] = value;
  };

  window.moveDraftExercise = function(index, direction) {
    if (!draftRoutine) return;
    const target = index + direction;
    if (target < 0 || target >= draftRoutine.exercises.length) return;
    const [item] = draftRoutine.exercises.splice(index, 1);
    draftRoutine.exercises.splice(target, 0, item);
    renderRoutineBuilder();
  };

  window.removeDraftExercise = function(index) {
    if (!draftRoutine) return;
    draftRoutine.exercises.splice(index, 1);
    renderRoutineBuilder();
  };

  window.saveRoutineDraft = function() {
    if (!draftRoutine) { toast('Create a routine first'); return; }
    const name = document.getElementById('routineName').value.trim();
    if (!name) { toast('Enter a routine name'); return; }
    if (!draftRoutine.exercises.length) { toast('Add at least one exercise'); return; }
    draftRoutine.name = name;
    draftRoutine.focus = document.getElementById('routineFocus').value;
    draftRoutine.duration = Number(document.getElementById('routineDuration').value) || 30;
    draftRoutine.updatedAt = new Date().toISOString();
    if (!draftRoutine.id) { draftRoutine.id = makeId('routine'); draftRoutine.createdAt = draftRoutine.updatedAt; state.routines.unshift(clone(draftRoutine)); }
    else {
      const index = state.routines.findIndex(item => item.id === draftRoutine.id);
      if (index >= 0) state.routines[index] = clone(draftRoutine); else state.routines.unshift(clone(draftRoutine));
    }
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    renderRoutineBuilder();
    toast('Routine saved');
  };

  function routineToProgram(routine) {
    const exercises = routine.exercises.map(item => {
      const base = normalizeExercise(exerciseByName(item.name));
      return Object.assign(base, {
        sets: Math.max(1, Number(item.sets) || 1),
        reps: String(item.reps || '8'),
        rest: Math.max(15, Number(item.rest) || 60),
        defaultWeight: Number(item.defaultWeight) || 0,
        defaultSetType: item.defaultSetType || 'normal',
        supersetGroup: item.supersetGroup || ''
      });
    });
    return {
      title: routine.name,
      focus: routine.focus || 'Custom routine',
      duration: Number(routine.duration) || 30,
      warmup: ['Easy joint circles × 30 sec', 'Hip hinge drill × 10', 'Light practice set for the first exercise'],
      cooldown: ['Slow breathing 2 min', 'Gentle stretch for the trained muscles'],
      exercises
    };
  }

  window.startSavedRoutine = function(id) {
    if (state.activeWorkout) { toast('Finish or discard the workout in progress first'); return; }
    const routine = state.routines.find(item => item.id === id);
    if (!routine) return;
    const returnDay = ['Monday','Tuesday','Wednesday','Thursday','Friday'].includes(state.currentDay) ? state.currentDay : 'Monday';
    state.customReturnDay = returnDay;
    state.pendingRoutineId = routine.id;
    PROGRAM[returnDay] = routineToProgram(routine);
    state.currentDay = returnDay;
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    render();
    showView('workoutView');
    startGuidedWorkout();
  };

  function renderSavedRoutines() {
    const list = document.getElementById('savedRoutineList');
    if (!list) return;
    if (!state.routines.length) {
      list.innerHTML = '<div class="card routine-empty">No custom routines yet. Copy a weekday or create one from scratch.</div>';
      return;
    }
    list.innerHTML = state.routines.map(routine => `<div class="card routine-card"><div class="eyebrow">${escapeHtml(routine.focus || 'CUSTOM')}</div><h3>${escapeHtml(routine.name)}</h3><div class="meta">${routine.duration} min · ${routine.exercises.length} exercises</div><div class="routine-exercises">${routine.exercises.map(item => escapeHtml(item.name)).join(' · ')}</div><div class="actions"><button class="primary" onclick="startSavedRoutine('${routine.id}')">Start</button><button class="secondary" onclick="editRoutine('${routine.id}')">Edit</button><button class="danger" onclick="deleteRoutine('${routine.id}')">Delete</button></div></div>`).join('');
  }

  function renderDraft() {
    const rows = document.getElementById('routineDraftRows');
    if (!rows) return;
    if (!draftRoutine) {
      rows.innerHTML = '<div class="routine-empty">Choose New Routine or copy the selected workout day.</div>';
      return;
    }
    document.getElementById('routineName').value = draftRoutine.name || '';
    document.getElementById('routineFocus').value = draftRoutine.focus || 'Full body';
    document.getElementById('routineDuration').value = String(draftRoutine.duration || 30);
    if (!draftRoutine.exercises.length) { rows.innerHTML = '<div class="routine-empty">Add exercises from the catalogue.</div>'; return; }
    const setTypes = [['warmup','Warm-up'],['normal','Working'],['amrap','AMRAP'],['drop','Drop'],['failure','Failure'],['timed','Timed']];
    rows.innerHTML = draftRoutine.exercises.map((item, index) => `<div class="builder-row"><div class="exercise-name"><b>${index + 1}. ${escapeHtml(item.name)}</b></div><input type="number" min="1" value="${item.sets}" aria-label="Sets" oninput="updateDraftExercise(${index},'sets',this.value)"><input value="${escapeHtml(item.reps)}" aria-label="Reps" oninput="updateDraftExercise(${index},'reps',this.value)"><input type="number" min="15" step="15" value="${item.rest}" aria-label="Rest seconds" oninput="updateDraftExercise(${index},'rest',this.value)"><select aria-label="Set type" onchange="updateDraftExercise(${index},'defaultSetType',this.value)">${setTypes.map(([value,label])=>`<option value="${value}" ${item.defaultSetType===value?'selected':''}>${label}</option>`).join('')}</select><select aria-label="Superset group" onchange="updateDraftExercise(${index},'supersetGroup',this.value)"><option value="">No group</option>${['A','B','C','D'].map(group=>`<option value="${group}" ${item.supersetGroup===group?'selected':''}>Group ${group}</option>`).join('')}</select><div class="builder-order"><button onclick="moveDraftExercise(${index},-1)">↑</button><button onclick="moveDraftExercise(${index},1)">↓</button><button onclick="removeDraftExercise(${index})">×</button></div></div>`).join('');
  }

  window.renderRoutineBuilder = function() {
    const select = document.getElementById('routineExerciseSelect');
    if (select) select.innerHTML = catalog().map(exercise => `<option value="${escapeHtml(exercise.name)}">${escapeHtml(exercise.name)}</option>`).join('');
    renderSavedRoutines();
    renderDraft();
  };

  injectBuilderStyles();
  injectBuilderView();
  injectRoutineButtons();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  renderRoutineBuilder();
})();
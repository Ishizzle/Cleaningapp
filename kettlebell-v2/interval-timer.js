// Standalone interval training for EMOM, AMRAP, Tabata, and custom circuits.
(() => {
  state.intervalHistory = Array.isArray(state.intervalHistory) ? state.intervalHistory : [];
  state.intervalPresets = Array.isArray(state.intervalPresets) ? state.intervalPresets : [];

  let config = null;
  let runtime = null;
  let intervalHandle = null;
  let audioContext = null;

  function injectIntervalStyles() {
    if (document.getElementById('intervalTimerStyles')) return;
    const style = document.createElement('style');
    style.id = 'intervalTimerStyles';
    style.textContent = `
      .interval-modal{max-width:820px}.interval-config{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}.interval-config .field{margin:0}.interval-config input,.interval-config select{width:100%;background:#0d151f;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:10px}
      .interval-display{margin-top:14px;padding:22px;border-radius:20px;background:linear-gradient(135deg,#162a3c,#1a2518);border:1px solid #385269;text-align:center}.interval-phase{font-size:13px;letter-spacing:.12em;font-weight:900;color:var(--muted)}.interval-clock{font-size:72px;line-height:1;font-weight:950;margin:12px 0}.interval-round{font-size:16px;color:#d7e2ec}.interval-progress{height:12px;border-radius:999px;background:#111a24;overflow:hidden;margin-top:16px}.interval-progress div{height:100%;background:linear-gradient(90deg,var(--blue),var(--accent));transition:width .3s linear}
      .interval-round-counter{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:13px}.interval-round-counter button{width:44px;height:44px;border-radius:999px;border:1px solid var(--line);background:#192838;color:var(--text);font-size:22px}.interval-round-counter b{font-size:28px}.interval-presets{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.interval-history{display:grid;gap:8px;margin-top:12px}.interval-history-item{display:flex;justify-content:space-between;gap:12px;padding:10px;border-radius:13px;background:var(--panel2);border:1px solid var(--line)}
      .interval-button{background:#2a2137;color:#ead5ff}@media(max-width:720px){.interval-config{grid-template-columns:1fr 1fr}.interval-clock{font-size:58px}}
    `;
    document.head.appendChild(style);
  }

  function injectIntervalModal() {
    if (document.getElementById('intervalTimerModal')) return;
    const modal = document.createElement('div');
    modal.id = 'intervalTimerModal';
    modal.className = 'modal';
    modal.innerHTML = `<div class="card modal-card interval-modal"><div class="modal-head"><div><div class="eyebrow">INTERVAL TRAINING</div><h2 style="margin:5px 0">Workout timer</h2></div><button class="secondary" onclick="closeIntervalTimer()">Close</button></div><div class="interval-config"><div class="field"><label>Mode</label><select id="intervalMode" onchange="applyIntervalMode()"><option value="emom">EMOM</option><option value="amrap">AMRAP</option><option value="tabata">Tabata</option><option value="circuit">Custom circuit</option></select></div><div class="field"><label>Total rounds</label><input id="intervalRounds" type="number" min="1" max="99" value="10"></div><div class="field"><label>Work seconds</label><input id="intervalWork" type="number" min="5" max="600" value="45"></div><div class="field"><label>Rest seconds</label><input id="intervalRest" type="number" min="0" max="600" value="15"></div></div><div class="interval-presets"><button class="secondary" onclick="setIntervalPreset('swing')">10-min swings</button><button class="secondary" onclick="setIntervalPreset('tabata')">Classic Tabata</button><button class="secondary" onclick="setIntervalPreset('strength')">Strength EMOM</button><button class="secondary" onclick="saveIntervalPreset()">Save preset</button></div><div class="interval-display"><div class="interval-phase" id="intervalPhase">READY</div><div class="interval-clock" id="intervalClock">00:45</div><div class="interval-round" id="intervalRound">Round 1 of 10</div><div class="interval-progress"><div id="intervalProgressFill" style="width:0"></div></div><div class="interval-round-counter" id="amrapCounter" hidden><button onclick="changeAmrapRounds(-1)">−</button><b id="amrapRoundsDone">0</b><button onclick="changeAmrapRounds(1)">＋</button></div></div><div class="actions" style="justify-content:center;margin-top:14px"><button class="primary" id="intervalStartButton" onclick="toggleIntervalTimer()">Start</button><button class="secondary" onclick="resetIntervalTimer()">Reset</button><button class="secondary" onclick="skipIntervalPhase()">Skip phase</button></div><div class="card panel" style="margin-top:14px"><h3>Recent interval sessions</h3><div class="interval-history" id="intervalHistoryList"></div></div></div>`;
    document.body.appendChild(modal);
  }

  function injectIntervalButton() {
    const toolbar = document.querySelector('#workoutView .feature-toolbar');
    if (!toolbar || document.getElementById('openIntervalButton')) return;
    const button = document.createElement('button');
    button.id = 'openIntervalButton';
    button.className = 'quick-toggle interval-button';
    button.textContent = 'Interval timer';
    button.onclick = openIntervalTimer;
    toolbar.appendChild(button);
  }

  function readConfig() {
    const mode = document.getElementById('intervalMode').value;
    let rounds = Math.max(1, Number(document.getElementById('intervalRounds').value) || 1);
    let work = Math.max(5, Number(document.getElementById('intervalWork').value) || 5);
    let rest = Math.max(0, Number(document.getElementById('intervalRest').value) || 0);
    if (mode === 'amrap') {
      rounds = 1;
      rest = 0;
    }
    return { mode, rounds, work, rest };
  }

  function modeName(mode) {
    return ({ emom:'EMOM', amrap:'AMRAP', tabata:'Tabata', circuit:'Circuit' })[mode] || 'Interval';
  }

  window.applyIntervalMode = function() {
    const mode = document.getElementById('intervalMode').value;
    const rounds = document.getElementById('intervalRounds');
    const work = document.getElementById('intervalWork');
    const rest = document.getElementById('intervalRest');
    if (mode === 'emom') { rounds.value = 10; work.value = 45; rest.value = 15; }
    if (mode === 'amrap') { rounds.value = 1; work.value = 600; rest.value = 0; }
    if (mode === 'tabata') { rounds.value = 8; work.value = 20; rest.value = 10; }
    if (mode === 'circuit') { rounds.value = 5; work.value = 40; rest.value = 20; }
    resetIntervalTimer();
  };

  window.setIntervalPreset = function(name) {
    if (name === 'swing') { setFields('emom', 10, 40, 20); }
    if (name === 'tabata') { setFields('tabata', 8, 20, 10); }
    if (name === 'strength') { setFields('emom', 12, 30, 30); }
    resetIntervalTimer();
  };

  function setFields(mode, rounds, work, rest) {
    document.getElementById('intervalMode').value = mode;
    document.getElementById('intervalRounds').value = rounds;
    document.getElementById('intervalWork').value = work;
    document.getElementById('intervalRest').value = rest;
  }

  window.saveIntervalPreset = function() {
    const current = readConfig();
    const name = prompt('Preset name', `${modeName(current.mode)} ${current.rounds} rounds`);
    if (!name) return;
    state.intervalPresets.unshift({ id:`interval-${Date.now()}`, name, ...current });
    state.intervalPresets = state.intervalPresets.slice(0, 12);
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    toast('Interval preset saved');
  };

  window.openIntervalTimer = function() {
    document.getElementById('intervalTimerModal').classList.add('open');
    resetIntervalTimer();
    renderIntervalHistory();
  };

  window.closeIntervalTimer = function() {
    if (runtime?.running && !confirm('Stop the interval timer?')) return;
    stopHandle();
    document.getElementById('intervalTimerModal').classList.remove('open');
  };

  function createRuntime() {
    config = readConfig();
    return {
      running: false,
      phase: 'work',
      round: 1,
      seconds: config.work,
      initialSeconds: config.work,
      totalElapsed: 0,
      amrapRounds: 0,
      startedAt: null,
      completed: false
    };
  }

  function stopHandle() {
    if (intervalHandle) clearInterval(intervalHandle);
    intervalHandle = null;
    if (runtime) runtime.running = false;
    const button = document.getElementById('intervalStartButton');
    if (button) button.textContent = runtime?.completed ? 'Finished' : 'Start';
  }

  function formatTime(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    return `${String(Math.floor(value/60)).padStart(2,'0')}:${String(value%60).padStart(2,'0')}`;
  }

  function renderRuntime() {
    if (!runtime) runtime = createRuntime();
    const totalPerRound = config.work + config.rest;
    const totalPlanned = config.mode === 'amrap' ? config.work : totalPerRound * config.rounds;
    const progress = Math.min(100, runtime.totalElapsed / Math.max(1,totalPlanned) * 100);
    document.getElementById('intervalPhase').textContent = runtime.completed ? 'COMPLETE' : runtime.phase === 'work' ? (config.mode === 'amrap' ? 'AMRAP · WORK' : 'WORK') : 'REST';
    document.getElementById('intervalClock').textContent = formatTime(runtime.seconds);
    document.getElementById('intervalRound').textContent = config.mode === 'amrap' ? `${Math.ceil(runtime.totalElapsed/60)} of ${Math.ceil(config.work/60)} minutes` : `Round ${runtime.round} of ${config.rounds}`;
    document.getElementById('intervalProgressFill').style.width = `${progress}%`;
    document.getElementById('amrapCounter').hidden = config.mode !== 'amrap';
    document.getElementById('amrapRoundsDone').textContent = runtime.amrapRounds;
    document.getElementById('intervalStartButton').textContent = runtime.completed ? 'Finished' : runtime.running ? 'Pause' : runtime.totalElapsed ? 'Resume' : 'Start';
  }

  function beep(frequency = 720, duration = .12) {
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(.12, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch {}
  }

  function signal(long = false) {
    beep(long ? 900 : 680, long ? .25 : .12);
    if (navigator.vibrate) navigator.vibrate(long ? [180,80,180] : 100);
  }

  function advancePhase() {
    if (config.mode === 'amrap') { finishInterval(); return; }
    if (runtime.phase === 'work' && config.rest > 0) {
      runtime.phase = 'rest';
      runtime.seconds = config.rest;
      runtime.initialSeconds = config.rest;
      signal();
      return;
    }
    if (runtime.round >= config.rounds) { finishInterval(); return; }
    runtime.round++;
    runtime.phase = 'work';
    runtime.seconds = config.work;
    runtime.initialSeconds = config.work;
    signal();
  }

  function tick() {
    if (!runtime?.running) return;
    runtime.seconds--;
    runtime.totalElapsed++;
    if (runtime.seconds <= 3 && runtime.seconds > 0) beep(520, .06);
    if (runtime.seconds <= 0) advancePhase();
    renderRuntime();
  }

  window.toggleIntervalTimer = function() {
    if (!runtime || runtime.completed) runtime = createRuntime();
    if (runtime.running) { stopHandle(); renderRuntime(); return; }
    runtime.running = true;
    runtime.startedAt ||= new Date().toISOString();
    document.getElementById('intervalStartButton').textContent = 'Pause';
    intervalHandle = setInterval(tick, 1000);
    signal();
  };

  window.resetIntervalTimer = function() {
    stopHandle();
    runtime = createRuntime();
    renderRuntime();
  };

  window.skipIntervalPhase = function() {
    if (!runtime || runtime.completed) return;
    advancePhase();
    renderRuntime();
  };

  window.changeAmrapRounds = function(delta) {
    if (!runtime) runtime = createRuntime();
    runtime.amrapRounds = Math.max(0, runtime.amrapRounds + delta);
    renderRuntime();
  };

  function finishInterval() {
    runtime.completed = true;
    runtime.running = false;
    runtime.seconds = 0;
    stopHandle();
    signal(true);
    const record = {
      id: `interval-${Date.now()}`,
      date: new Date().toISOString(),
      mode: config.mode,
      roundsPlanned: config.rounds,
      roundsCompleted: config.mode === 'amrap' ? runtime.amrapRounds : runtime.round,
      work: config.work,
      rest: config.rest,
      elapsed: runtime.totalElapsed
    };
    state.intervalHistory.unshift(record);
    state.intervalHistory = state.intervalHistory.slice(0, 50);
    if (state.activeWorkout) {
      state.activeWorkout.intervalSessions ||= [];
      state.activeWorkout.intervalSessions.push(record);
    }
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    renderRuntime();
    renderIntervalHistory();
    toast('Interval completed');
  }

  function renderIntervalHistory() {
    const list = document.getElementById('intervalHistoryList');
    if (!list) return;
    list.innerHTML = state.intervalHistory.length ? state.intervalHistory.slice(0,8).map(item => `<div class="interval-history-item"><div><b>${modeName(item.mode)}</b><div class="meta">${new Date(item.date).toLocaleDateString()} · ${formatTime(item.elapsed)}</div></div><span class="chip">${item.roundsCompleted} rounds</span></div>`).join('') : '<div class="empty">No interval sessions recorded.</div>';
  }

  injectIntervalStyles();
  injectIntervalModal();
  injectIntervalButton();
  runtime = createRuntime();
  renderRuntime();
  renderIntervalHistory();
})();
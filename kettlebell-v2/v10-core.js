// Version 10 stability coordinator.
// This is the final runtime layer: it normalizes state, guards persistence and
// rendering, coordinates modal lifecycle, records diagnostics, and protects data.
(() => {
  const STORAGE_KEY = 'kb-coach-v2';
  const MAX_DIAGNOSTICS = 30;
  let handlingError = false;
  let activeModal = null;

  function object(value, fallback = {}) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : fallback;
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function dedupe(items, keyBuilder) {
    const seen = new Set();
    return array(items).filter(item => {
      const key = keyBuilder(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function normalizeState() {
    state = object(state, {});
    state.version = 10;
    state.name = typeof state.name === 'string' && state.name.trim() ? state.name : 'Inder';
    state.week = Math.max(1, Math.min(12, number(state.week, 1)));
    state.currentDay = PROGRAM?.[state.currentDay] ? state.currentDay : 'Monday';
    state.weightsOwned = [...new Set(array(state.weightsOwned).map(Number).filter(Number.isFinite))].sort((a, b) => a - b);
    if (!state.weightsOwned.length) state.weightsOwned = [8, 12, 16, 20, 24];

    state.sessions = Math.max(0, number(state.sessions));
    state.minutes = Math.max(0, number(state.minutes));
    state.sets = Math.max(0, number(state.sets));
    state.completed = object(state.completed);
    state.exerciseDone = object(state.exerciseDone);
    state.logs = object(state.logs);
    state.ratings = object(state.ratings);
    state.progression = object(state.progression);
    state.personalRecords = object(state.personalRecords);
    state.calendar = object(state.calendar, { makeups: {}, skipped: {} });
    state.calendar.makeups = object(state.calendar.makeups);
    state.calendar.skipped = object(state.calendar.skipped);
    state.exerciseSwaps = object(state.exerciseSwaps);

    state.history = dedupe(state.history, item => item?.id || `${item?.date || ''}|${item?.day || ''}|${item?.title || ''}`);
    state.recoveryHistory = dedupe(state.recoveryHistory, item => `${item?.date || ''}|${item?.day || ''}|${item?.week || ''}`);
    state.workoutSummaries = dedupe(state.workoutSummaries, item => item?.id || `${item?.date || ''}|${item?.title || ''}`);
    state.intervalHistory = dedupe(state.intervalHistory, item => item?.id || `${item?.date || ''}|${item?.mode || ''}`);
    state.formCheckHistory = dedupe(state.formCheckHistory, item => item?.id || `${item?.date || ''}|${item?.exercise || ''}`);
    state.bodyEntries = dedupe(state.bodyEntries, item => item?.id || `${item?.date || ''}|${item?.weight || ''}|${item?.waist || ''}`);
    state.progressPhotoMeta = dedupe(state.progressPhotoMeta, item => item?.id || `${item?.date || ''}|${item?.name || ''}`);

    state.routines = array(state.routines);
    state.customExercises = array(state.customExercises);
    state.intervalPresets = array(state.intervalPresets);
    state.activeWorkout = state.activeWorkout && typeof state.activeWorkout === 'object' ? state.activeWorkout : null;
    state.bodyGoalWeight = number(state.bodyGoalWeight, 150);
    state.trainingPreferences = Object.assign({ goal: 'balanced', trainingDays: 5, deloads: true }, object(state.trainingPreferences));
    state.formCheckSettings = Object.assign({ facingMode: 'environment', voice: false, mirror: false }, object(state.formCheckSettings));

    state.ui = Object.assign({
      simpleMode: true,
      lastPrimaryView: 'workoutView',
      dismissedWelcome: false,
      diagnosticsExpanded: false
    }, object(state.ui));
    state.appDiagnostics = array(state.appDiagnostics).slice(0, MAX_DIAGNOSTICS);
    return state;
  }

  function rawSave() {
    normalizeState();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function showRecoveryBanner(message) {
    let banner = document.getElementById('v10ErrorBanner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'v10ErrorBanner';
      banner.className = 'v10-error-banner';
      banner.innerHTML = '<div><b>Something needs attention</b><div id="v10ErrorMessage"></div></div><button class="secondary" onclick="dismissV10Error()">Dismiss</button>';
      document.body.appendChild(banner);
    }
    const messageElement = document.getElementById('v10ErrorMessage');
    if (messageElement) messageElement.textContent = message;
    banner.classList.add('visible');
  }

  window.dismissV10Error = function() {
    document.getElementById('v10ErrorBanner')?.classList.remove('visible');
  };

  function recordError(error, context = 'runtime') {
    if (handlingError) return;
    handlingError = true;
    try {
      normalizeState();
      const message = error?.message || String(error || 'Unknown error');
      const stack = typeof error?.stack === 'string' ? error.stack.slice(0, 1400) : '';
      state.appDiagnostics.unshift({
        id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        date: new Date().toISOString(),
        context,
        message,
        stack,
        version: state.version,
        userAgent: navigator.userAgent
      });
      state.appDiagnostics = state.appDiagnostics.slice(0, MAX_DIAGNOSTICS);
      try { rawSave(); } catch {}
      showRecoveryBanner(`${context}: ${message}`);
      console.error(`[Kettlebell Coach · ${context}]`, error);
    } finally {
      handlingError = false;
    }
  }

  function injectCoreStyles() {
    if (document.getElementById('v10CoreStyles')) return;
    const style = document.createElement('style');
    style.id = 'v10CoreStyles';
    style.textContent = `
      body.modal-open{overflow:hidden;touch-action:none}.v10-error-banner{position:fixed;left:12px;right:12px;top:max(12px,env(safe-area-inset-top));z-index:500;display:none;align-items:center;justify-content:space-between;gap:12px;padding:13px 15px;border-radius:15px;background:#3a2026;border:1px solid #7b3b49;color:#ffd6da;box-shadow:0 16px 45px rgba(0,0,0,.4)}.v10-error-banner.visible{display:flex}.v10-error-banner b{display:block;margin-bottom:3px}.v10-error-banner #v10ErrorMessage{font-size:12px;opacity:.9;word-break:break-word}
      .v10-diagnostics{margin-top:16px;padding-top:15px;border-top:1px solid var(--line)}.v10-diagnostic-list{display:grid;gap:7px;max-height:260px;overflow:auto;margin-top:10px}.v10-diagnostic{padding:10px;border-radius:12px;background:#291e24;border:1px solid #53303a;font-size:12px}.v10-diagnostic b{display:block}.v10-diagnostic code{display:block;margin-top:5px;color:#eeb9c2;white-space:pre-wrap;word-break:break-word}.v10-health{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px}.v10-health-dot{width:9px;height:9px;border-radius:50%;background:var(--accent)}
      :focus-visible{outline:3px solid var(--blue);outline-offset:3px}@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}
    `;
    document.head.appendChild(style);
  }

  function cleanupForModal(modalId) {
    if (modalId !== 'formCheckModal' && document.getElementById('formCheckModal')?.classList.contains('open')) {
      try { window.stopFormCheck?.(); } catch (error) { recordError(error, 'camera cleanup'); }
      document.getElementById('formCheckModal')?.classList.remove('open');
    }
    if (modalId !== 'guidedModal' && timerRunning) {
      try { resetTimer(); } catch (error) { recordError(error, 'rest timer cleanup'); }
    }
  }

  function synchronizeModals() {
    const open = [...document.querySelectorAll('.modal.open')];
    if (!open.length) {
      activeModal = null;
      document.body.classList.remove('modal-open');
      return;
    }
    const newest = open[open.length - 1];
    if (activeModal !== newest.id) {
      cleanupForModal(newest.id);
      open.slice(0, -1).forEach(modal => modal.classList.remove('open'));
      activeModal = newest.id;
    }
    document.body.classList.add('modal-open');
  }

  function injectDiagnostics() {
    const settingsPanel = document.querySelector('#settingsView .grid2 .card.panel:last-child');
    if (!settingsPanel || document.getElementById('v10Diagnostics')) return;
    const section = document.createElement('div');
    section.id = 'v10Diagnostics';
    section.className = 'v10-diagnostics';
    settingsPanel.appendChild(section);
  }

  function renderDiagnostics() {
    const section = document.getElementById('v10Diagnostics');
    if (!section) return;
    const diagnostics = array(state.appDiagnostics);
    section.innerHTML = `
      <div class="v10-health"><span class="v10-health-dot"></span><b>App health</b><span>Version 10 · ${diagnostics.length ? `${diagnostics.length} recorded issue${diagnostics.length === 1 ? '' : 's'}` : 'no recorded issues'}</span></div>
      <div class="actions"><button class="secondary" onclick="toggleDiagnostics()">${state.ui.diagnosticsExpanded ? 'Hide details' : 'View diagnostics'}</button>${diagnostics.length ? '<button class="danger" onclick="clearDiagnostics()">Clear diagnostics</button>' : ''}</div>
      ${state.ui.diagnosticsExpanded ? `<div class="v10-diagnostic-list">${diagnostics.length ? diagnostics.map(item => `<div class="v10-diagnostic"><b>${new Date(item.date).toLocaleString()} · ${escapeHtml(item.context)}</b><div>${escapeHtml(item.message)}</div>${item.stack ? `<code>${escapeHtml(item.stack.slice(0, 500))}</code>` : ''}</div>`).join('') : '<div class="empty">No application errors have been recorded.</div>'}</div>` : ''}`;
  }

  window.toggleDiagnostics = function() {
    normalizeState();
    state.ui.diagnosticsExpanded = !state.ui.diagnosticsExpanded;
    rawSave();
    renderDiagnostics();
  };

  window.clearDiagnostics = function() {
    state.appDiagnostics = [];
    state.ui.diagnosticsExpanded = false;
    rawSave();
    renderDiagnostics();
    toast('Diagnostics cleared');
  };

  const previousRender = render;
  render = function() {
    try {
      normalizeState();
      previousRender();
      injectDiagnostics();
      renderDiagnostics();
    } catch (error) {
      recordError(error, 'render');
    }
  };

  const previousPersist = persist;
  persist = function(quiet = false) {
    try {
      normalizeState();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
      if (!quiet) toast('Saved');
    } catch (error) {
      recordError(error, 'save');
      try { previousPersist(true); } catch {}
    }
  };

  const previousShowView = showView;
  showView = function(id) {
    try {
      const viewId = document.getElementById(id) ? id : 'workoutView';
      normalizeState();
      if (['workoutView', 'libraryView', 'progressView', 'settingsView'].includes(viewId)) state.ui.lastPrimaryView = viewId;
      rawSave();
      previousShowView(viewId);
      synchronizeModals();
    } catch (error) {
      recordError(error, 'navigation');
    }
  };

  exportData = function() {
    try {
      normalizeState();
      const payload = clone(state);
      payload._backup = {
        product: 'Kettlebell Coach',
        schemaVersion: 10,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `kettlebell-coach-v10-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      recordError(error, 'backup export');
    }
  };

  importData = function(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Backup does not contain a valid state object.');
        delete parsed._backup;
        state = Object.assign({}, DEFAULT, parsed);
        normalizeState();
        rawSave();
        render();
        toast('Backup imported');
      } catch (error) {
        recordError(error, 'backup import');
        toast('Invalid backup file');
      }
    };
    reader.onerror = () => recordError(reader.error || new Error('File could not be read.'), 'backup import');
    reader.readAsText(file);
  };

  resetData = function() {
    if (!confirm('Reset workout history, routines, reports, and settings on this device? Progress photos and offline videos may remain in browser storage until site data is cleared.')) return;
    try {
      state = clone(DEFAULT);
      normalizeState();
      state.ui.dismissedWelcome = false;
      rawSave();
      render();
      toast('App reset');
    } catch (error) {
      recordError(error, 'reset');
    }
  };

  window.addEventListener('error', event => recordError(event.error || new Error(event.message), 'window error'));
  window.addEventListener('unhandledrejection', event => recordError(event.reason || new Error('Unhandled promise rejection'), 'async error'));
  window.addEventListener('pagehide', () => {
    try {
      if (document.getElementById('formCheckModal')?.classList.contains('open')) window.stopFormCheck?.();
      if (timerRunning) resetTimer();
      rawSave();
    } catch {}
  });
  window.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    const modal = document.querySelector('.modal.open');
    if (!modal) return;
    if (modal.id === 'formCheckModal') window.closeFormCheck?.();
    else if (modal.id === 'intervalTimerModal') window.closeIntervalTimer?.();
    else if (modal.id === 'guidedModal') window.closeGuidedWorkout?.();
    else modal.classList.remove('open');
    synchronizeModals();
  });

  const modalObserver = new MutationObserver(synchronizeModals);
  modalObserver.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });

  injectCoreStyles();
  normalizeState();
  rawSave();
  render();
})();
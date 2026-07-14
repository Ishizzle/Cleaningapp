// Version 9 migration guard for camera form checking.
(() => {
  function ensureV9State() {
    state.version = Math.max(Number(state.version) || 0, 9);
    state.formCheckHistory = Array.isArray(state.formCheckHistory) ? state.formCheckHistory : [];
    state.formCheckSettings = Object.assign({ facingMode: 'environment', voice: false, mirror: false }, state.formCheckSettings || {});
    state.workoutSummaries = Array.isArray(state.workoutSummaries) ? state.workoutSummaries : [];
    state.intervalHistory = Array.isArray(state.intervalHistory) ? state.intervalHistory : [];
    state.intervalPresets = Array.isArray(state.intervalPresets) ? state.intervalPresets : [];
    state.routines = Array.isArray(state.routines) ? state.routines : [];
    state.customExercises = Array.isArray(state.customExercises) ? state.customExercises : [];
    state.bodyEntries = Array.isArray(state.bodyEntries) ? state.bodyEntries : [];
    state.history = Array.isArray(state.history) ? state.history : [];
    state.logs = state.logs || {};
    state.progression = state.progression || {};
    state.personalRecords = state.personalRecords || {};
  }

  const previousRender = render;
  render = function() {
    ensureV9State();
    previousRender();
  };

  const previousImportData = importData;
  importData = function(file) {
    previousImportData(file);
    setTimeout(() => {
      ensureV9State();
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      render();
      if (typeof renderRoutineBuilder === 'function') renderRoutineBuilder();
    }, 250);
  };

  ensureV9State();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
})();
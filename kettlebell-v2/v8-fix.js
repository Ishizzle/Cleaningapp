// Version 8 state migration and reset/import protection.
(() => {
  function ensureV8State() {
    state.version = Math.max(Number(state.version) || 0, 8);
    state.workoutSummaries = Array.isArray(state.workoutSummaries) ? state.workoutSummaries : [];
    state.intervalHistory = Array.isArray(state.intervalHistory) ? state.intervalHistory : [];
    state.intervalPresets = Array.isArray(state.intervalPresets) ? state.intervalPresets : [];
    state.routines = Array.isArray(state.routines) ? state.routines : [];
    state.customExercises = Array.isArray(state.customExercises) ? state.customExercises : [];
    state.bodyEntries = Array.isArray(state.bodyEntries) ? state.bodyEntries : [];
    state.progressPhotoMeta = Array.isArray(state.progressPhotoMeta) ? state.progressPhotoMeta : [];
    state.personalRecords = state.personalRecords || {};
    state.progression = state.progression || {};
    state.logs = state.logs || {};
    state.history = Array.isArray(state.history) ? state.history : [];
  }

  const previousRender = render;
  render = function() {
    ensureV8State();
    previousRender();
  };

  const previousImportData = importData;
  importData = function(file) {
    previousImportData(file);
    setTimeout(() => {
      ensureV8State();
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      render();
      if (typeof renderRoutineBuilder === 'function') renderRoutineBuilder();
    }, 200);
  };

  ensureV8State();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
})();
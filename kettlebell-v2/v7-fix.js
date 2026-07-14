// Version 7 state migration and reset/import protection.
(() => {
  function ensureV7State() {
    state.version = Math.max(Number(state.version) || 0, 7);
    state.trainingPreferences = Object.assign({ goal: 'balanced', trainingDays: 5, deloads: true }, state.trainingPreferences || {});
    state.routines = Array.isArray(state.routines) ? state.routines : [];
    state.customExercises = Array.isArray(state.customExercises) ? state.customExercises : [];
    state.bodyEntries = Array.isArray(state.bodyEntries) ? state.bodyEntries : [];
    state.bodyGoalWeight = Number(state.bodyGoalWeight) || 150;
    state.progressPhotoMeta = Array.isArray(state.progressPhotoMeta) ? state.progressPhotoMeta : [];
    state.calendar = state.calendar || { makeups: {}, skipped: {} };
    state.calendar.makeups = state.calendar.makeups || {};
    state.calendar.skipped = state.calendar.skipped || {};
    state.exerciseSwaps = state.exerciseSwaps || {};
    state.personalRecords = state.personalRecords || {};
    state.progression = state.progression || {};
    state.recoveryHistory = Array.isArray(state.recoveryHistory) ? state.recoveryHistory : [];
    state.logs = state.logs || {};
    state.ratings = state.ratings || {};
    state.history = Array.isArray(state.history) ? state.history : [];
  }

  const previousRender = render;
  render = function() {
    ensureV7State();
    previousRender();
  };

  const previousImportData = importData;
  importData = function(file) {
    previousImportData(file);
    setTimeout(() => {
      ensureV7State();
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      render();
      if (typeof renderRoutineBuilder === 'function') renderRoutineBuilder();
    }, 150);
  };

  ensureV7State();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
})();
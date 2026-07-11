// Ensure Version 4 feature fields exist after reset or importing an older backup.
(() => {
  function ensureV4State() {
    state.version = 4;
    state.calendar = state.calendar || { makeups: {}, skipped: {} };
    state.calendar.makeups = state.calendar.makeups || {};
    state.calendar.skipped = state.calendar.skipped || {};
    state.exerciseSwaps = state.exerciseSwaps || {};
    state.personalRecords = state.personalRecords || {};
    state.quickMode = Boolean(state.quickMode);
  }

  const previousRender = render;
  render = function() {
    ensureV4State();
    previousRender();
  };

  const previousImportData = importData;
  importData = function(file) {
    previousImportData(file);
    setTimeout(() => {
      ensureV4State();
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      render();
    }, 100);
  };

  ensureV4State();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
})();
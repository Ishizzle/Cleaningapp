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

  const previousCompleteWorkout = completeWorkout;
  completeWorkout = function() {
    const quick = Boolean(state.activeWorkout?.quickMode);
    const workoutDay = state.activeWorkout?.day;
    const fullDuration = workoutDay && PROGRAM[workoutDay] ? PROGRAM[workoutDay].duration : 20;
    const historyCount = state.history.length;
    previousCompleteWorkout();
    if (quick && state.history.length > historyCount) {
      state.history[0].duration = 20;
      state.history[0].quickMode = true;
      state.minutes = Math.max(0, state.minutes - Math.max(0, fullDuration - 20));
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      render();
    }
  };

  ensureV4State();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
})();
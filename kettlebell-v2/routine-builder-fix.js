// Restore the standard weekday program when a custom-routine start is cancelled.
(() => {
  let startingRoutineWorkout = false;

  function restorePendingRoutine() {
    if (!state.pendingRoutineId || state.activeWorkout) return;
    const day = state.customReturnDay || state.currentDay;
    if (window.KB_STANDARD_PROGRAMS?.[day]) {
      PROGRAM[day] = JSON.parse(JSON.stringify(window.KB_STANDARD_PROGRAMS[day]));
    }
    state.pendingRoutineId = null;
    state.customReturnDay = null;
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  }

  // A pending routine after a full page load means the readiness screen was
  // abandoned before an active workout was created.
  if (state.pendingRoutineId && !state.activeWorkout) restorePendingRoutine();

  const previousSelectDay = selectDay;
  selectDay = function(day) {
    restorePendingRoutine();
    previousSelectDay(day);
  };

  const previousConfirmRecovery = confirmRecovery;
  confirmRecovery = function() {
    startingRoutineWorkout = true;
    try { previousConfirmRecovery(); }
    finally { startingRoutineWorkout = false; }
  };

  const previousStartWithoutAdjustment = startWithoutAdjustment;
  startWithoutAdjustment = function() {
    startingRoutineWorkout = true;
    try { previousStartWithoutAdjustment(); }
    finally { startingRoutineWorkout = false; }
  };

  const previousCloseRecovery = closeRecovery;
  closeRecovery = function() {
    previousCloseRecovery();
    if (!startingRoutineWorkout) {
      restorePendingRoutine();
      render();
    }
  };
})();
// Detailed exercise guides and user-owned offline video storage.
(() => {
  let currentGuide = null;
  let currentVideo = null;
  let activeObjectUrl = null;
  const DB_NAME = 'kb-coach-offline-media';
  const DB_VERSION = 1;
  const STORE = 'exercise-videos';
  const MAX_FILE_BYTES = 250 * 1024 * 1024;

  function escapeText(value) {
    return String(value ?? '').replace(/[&<>"']/g, character => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[character]));
  }

  function injectGuideStyles() {
    if (document.getElementById('exerciseGuideStyles')) return;
    const style = document.createElement('style');
    style.id = 'exerciseGuideStyles';
    style.textContent = `
      .instruction-button{background:#25364a;color:#d7e8fa}
      .offline-button{background:#342c1d;color:#ffdc99}
      .guide-summary{margin-top:12px;padding:14px;border-radius:16px;background:#132130;border:1px solid #2b4056}
      .guide-summary h4{margin:0 0 8px}.guide-summary ol{margin:0;padding-left:20px;color:var(--muted);line-height:1.55}
      .guide-modal{max-width:900px}.guide-intro{font-size:16px;line-height:1.6;color:#d9e4ef}
      .guide-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
      .guide-section{padding:15px;border-radius:16px;background:var(--panel2);border:1px solid var(--line)}
      .guide-section.full{grid-column:1/-1}.guide-section h3{margin:0 0 9px;font-size:17px}.guide-section p{margin:0;color:var(--muted);line-height:1.6}
      .guide-section ul,.guide-section ol{margin:0;padding-left:20px;color:var(--muted);line-height:1.65}
      .cue-pills{display:flex;gap:7px;flex-wrap:wrap}.cue-pill{padding:7px 10px;border-radius:999px;background:#26391d;color:#ddffa6;font-size:12px;font-weight:850}
      .video-manager{max-width:800px}.video-notice{padding:13px;border-radius:14px;background:#302a1e;border:1px solid #5a4d2f;color:#f6dfad;line-height:1.5}
      .video-player{width:100%;max-height:52vh;border-radius:16px;background:#05080c;margin-top:14px}
      .video-file-card{margin-top:14px;padding:15px;border-radius:16px;background:var(--panel2);border:1px solid var(--line)}
      .video-status{margin-top:9px;color:var(--muted);font-size:13px;line-height:1.5}.storage-row{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:10px;color:var(--muted);font-size:12px}
      .local-video-label{display:inline-flex;align-items:center;cursor:pointer}.local-video-label input{display:none}
      @media(max-width:650px){.guide-grid{grid-template-columns:1fr}.guide-section.full{grid-column:auto}}
    `;
    document.head.appendChild(style);
  }

  function injectGuideModal() {
    if (document.getElementById('exerciseGuideModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'exerciseGuideModal';
    modal.innerHTML = `
      <div class="card modal-card guide-modal">
        <div class="modal-head">
          <div><div class="eyebrow">EXERCISE GUIDE</div><h2 id="guideExerciseTitle" style="margin:5px 0"></h2></div>
          <button class="secondary" onclick="closeExerciseGuide()">Close</button>
        </div>
        <p class="guide-intro" id="guidePurpose"></p>
        <div class="guide-grid" id="guideContent"></div>
        <div class="actions">
          <button class="primary" id="guideOnlineVideo">Open direct video</button>
          <button class="secondary" id="guideOfflineVideo">Offline video</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  function injectVideoModal() {
    if (document.getElementById('offlineVideoModal')) return;
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'offlineVideoModal';
    modal.innerHTML = `
      <div class="card modal-card video-manager">
        <div class="modal-head">
          <div><div class="eyebrow">VIDEO</div><h2 id="offlineVideoTitle" style="margin:5px 0"></h2></div>
          <button class="secondary" onclick="closeOfflineVideo()">Close</button>
        </div>
        <div class="video-notice">YouTube videos are not downloaded or copied by this app. For offline playback here, import an MP4, M4V, or MOV file that you own or have permission to use. YouTube Premium can manage offline YouTube viewing inside the YouTube app.</div>
        <video id="localVideoPlayer" class="video-player" controls playsinline hidden></video>
        <div class="video-file-card">
          <div class="actions">
            <button class="primary" id="openOnlineVideo">Open direct online video</button>
            <label class="secondary local-video-label">Add offline video file<input id="offlineVideoInput" type="file" accept="video/mp4,video/x-m4v,video/quicktime,video/*"></label>
            <button class="danger" id="removeOfflineVideo" hidden>Remove offline video</button>
          </div>
          <div class="video-status" id="offlineVideoStatus">Checking for a saved video…</div>
          <div class="storage-row"><span id="videoStorageEstimate"></span><span>Maximum imported file size: 250 MB</span></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    document.getElementById('offlineVideoInput').addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) saveOfflineVideo(file);
      event.target.value = '';
    });
    document.getElementById('removeOfflineVideo').addEventListener('click', removeOfflineVideo);
  }

  function guideSection(title, content, type = 'list', full = false) {
    const className = `guide-section${full ? ' full' : ''}`;
    if (type === 'paragraph') return `<section class="${className}"><h3>${escapeText(title)}</h3><p>${escapeText(content)}</p></section>`;
    const tag = type === 'steps' ? 'ol' : 'ul';
    return `<section class="${className}"><h3>${escapeText(title)}</h3><${tag}>${content.map(item => `<li>${escapeText(item)}</li>`).join('')}</${tag}></section>`;
  }

  function guideMarkup(exercise) {
    const guide = getExerciseGuide(exercise);
    return [
      guideSection('Set up', guide.setup),
      guideSection('How to perform it', guide.steps, 'steps'),
      guideSection('Breathing', guide.breathing, 'paragraph'),
      guideSection('Tempo', guide.tempo, 'paragraph'),
      `<section class="guide-section"><h3>Quick cues</h3><div class="cue-pills">${guide.cues.map(cue => `<span class="cue-pill">${escapeText(cue)}</span>`).join('')}</div></section>`,
      guideSection('Beginner option', guide.beginner, 'paragraph'),
      guideSection('Safety', guide.safety, 'list', true)
    ].join('');
  }

  window.openExerciseGuide = function(day, index) {
    const exercise = PROGRAM[day]?.exercises?.[index];
    if (!exercise) return;
    currentGuide = exercise;
    const guide = getExerciseGuide(exercise);
    const video = curated(exercise);
    document.getElementById('guideExerciseTitle').textContent = exercise.name;
    document.getElementById('guidePurpose').textContent = guide.purpose;
    document.getElementById('guideContent').innerHTML = guideMarkup(exercise);
    document.getElementById('guideOnlineVideo').onclick = () => window.open(video.url, '_blank', 'noopener');
    document.getElementById('guideOfflineVideo').onclick = () => openOfflineVideoForExercise(exercise);
    document.getElementById('exerciseGuideModal').classList.add('open');
  };

  window.closeExerciseGuide = function() {
    document.getElementById('exerciseGuideModal').classList.remove('open');
  };

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE, { keyPath: 'exerciseName' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function readVideo(exerciseName) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readonly');
      const request = transaction.objectStore(STORE).get(exerciseName);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => database.close();
    });
  }

  async function writeVideo(record) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put(record);
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    });
  }

  async function deleteVideo(exerciseName) {
    const database = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).delete(exerciseName);
      transaction.oncomplete = () => { database.close(); resolve(); };
      transaction.onerror = () => { database.close(); reject(transaction.error); };
    });
  }

  function releaseObjectUrl() {
    if (activeObjectUrl) URL.revokeObjectURL(activeObjectUrl);
    activeObjectUrl = null;
  }

  async function updateStorageEstimate() {
    const element = document.getElementById('videoStorageEstimate');
    if (!navigator.storage?.estimate) { element.textContent = 'Browser storage availability varies by device.'; return; }
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage ? Math.round(estimate.usage / 1024 / 1024) : 0;
      const quota = estimate.quota ? Math.round(estimate.quota / 1024 / 1024) : 0;
      element.textContent = quota ? `Browser storage: ${used} MB used of approximately ${quota} MB` : `Browser storage used: ${used} MB`;
    } catch { element.textContent = 'Storage estimate unavailable.'; }
  }

  async function refreshOfflineVideo() {
    releaseObjectUrl();
    const player = document.getElementById('localVideoPlayer');
    const status = document.getElementById('offlineVideoStatus');
    const remove = document.getElementById('removeOfflineVideo');
    player.pause();
    player.hidden = true;
    player.removeAttribute('src');
    remove.hidden = true;
    if (!currentVideo) return;
    try {
      const saved = await readVideo(currentVideo.name);
      if (!saved) {
        status.textContent = 'No offline video is saved for this exercise. Add a compatible video file from Files or Photos.';
      } else {
        activeObjectUrl = URL.createObjectURL(saved.blob);
        player.src = activeObjectUrl;
        player.hidden = false;
        remove.hidden = false;
        status.textContent = `Saved offline: ${saved.fileName} · ${Math.round(saved.size / 1024 / 1024)} MB · added ${new Date(saved.updatedAt).toLocaleDateString()}`;
      }
    } catch (error) {
      status.textContent = `Could not read the offline video: ${error?.message || 'browser storage error'}`;
    }
    updateStorageEstimate();
  }

  window.openOfflineVideoForExercise = async function(exercise) {
    currentVideo = exercise;
    const video = curated(exercise);
    document.getElementById('offlineVideoTitle').textContent = exercise.name;
    document.getElementById('openOnlineVideo').onclick = () => window.open(video.url, '_blank', 'noopener');
    document.getElementById('offlineVideoModal').classList.add('open');
    await refreshOfflineVideo();
  };

  window.closeOfflineVideo = function() {
    const player = document.getElementById('localVideoPlayer');
    player.pause();
    releaseObjectUrl();
    document.getElementById('offlineVideoModal').classList.remove('open');
  };

  async function saveOfflineVideo(file) {
    const status = document.getElementById('offlineVideoStatus');
    if (!currentVideo) return;
    if (!file.type.startsWith('video/')) { status.textContent = 'Please choose a video file.'; return; }
    if (file.size > MAX_FILE_BYTES) { status.textContent = 'That file is larger than 250 MB. Choose a smaller video.'; return; }
    status.textContent = 'Saving the video on this device…';
    try {
      await writeVideo({ exerciseName: currentVideo.name, fileName: file.name, type: file.type, size: file.size, updatedAt: new Date().toISOString(), blob: file });
      toast('Offline video saved');
      await refreshOfflineVideo();
    } catch (error) {
      status.textContent = `The video could not be saved. Your browser may be low on storage: ${error?.message || 'storage error'}`;
    }
  }

  async function removeOfflineVideo() {
    if (!currentVideo || !confirm(`Remove the saved offline video for ${currentVideo.name}?`)) return;
    try {
      await deleteVideo(currentVideo.name);
      toast('Offline video removed');
      await refreshOfflineVideo();
    } catch (error) {
      document.getElementById('offlineVideoStatus').textContent = `Could not remove the video: ${error?.message || 'storage error'}`;
    }
  }

  function addButtonsToExerciseRows() {
    document.querySelectorAll('#exerciseList .exercise').forEach((row, index) => {
      const actions = row.querySelector('.row-actions');
      const exercise = PROGRAM[state.currentDay]?.exercises?.[index];
      if (!actions || !exercise) return;
      if (!actions.querySelector('.instruction-button')) {
        const button = document.createElement('button');
        button.className = 'mini instruction-button';
        button.textContent = 'Instructions';
        button.onclick = () => openExerciseGuide(state.currentDay, index);
        actions.prepend(button);
      }
      if (!actions.querySelector('.offline-button')) {
        const button = document.createElement('button');
        button.className = 'mini offline-button';
        button.textContent = 'Offline video';
        button.onclick = () => openOfflineVideoForExercise(exercise);
        actions.appendChild(button);
      }
    });
  }

  function addButtonsToLibrary() {
    document.querySelectorAll('#libraryGrid .lib').forEach(card => {
      const name = card.querySelector('h3')?.textContent;
      const exercise = uniqueExercises().find(item => item.name === name);
      if (!exercise) return;
      if (!card.querySelector('.library-instructions')) {
        const area = document.createElement('div');
        area.className = 'actions library-instructions';
        area.innerHTML = '<button class="mini instruction-button">Instructions</button><button class="mini offline-button">Offline video</button>';
        const buttons = area.querySelectorAll('button');
        buttons[0].onclick = () => {
          currentGuide = exercise;
          const guide = getExerciseGuide(exercise);
          const video = curated(exercise);
          document.getElementById('guideExerciseTitle').textContent = exercise.name;
          document.getElementById('guidePurpose').textContent = guide.purpose;
          document.getElementById('guideContent').innerHTML = guideMarkup(exercise);
          document.getElementById('guideOnlineVideo').onclick = () => window.open(video.url, '_blank', 'noopener');
          document.getElementById('guideOfflineVideo').onclick = () => openOfflineVideoForExercise(exercise);
          document.getElementById('exerciseGuideModal').classList.add('open');
        };
        buttons[1].onclick = () => openOfflineVideoForExercise(exercise);
        card.appendChild(area);
      }
    });
  }

  function addGuidedInstructions() {
    if (!state.activeWorkout) return;
    const exercise = PROGRAM[state.activeWorkout.day]?.exercises?.[activeExercise];
    const coach = document.getElementById('coachCue');
    if (!exercise || !coach) return;
    let summary = document.getElementById('guidedExerciseGuide');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'guidedExerciseGuide';
      summary.className = 'guide-summary';
      coach.insertAdjacentElement('afterend', summary);
    }
    const guide = getExerciseGuide(exercise);
    summary.innerHTML = `<h4>How to do ${escapeText(exercise.name)}</h4><ol>${guide.steps.slice(0, 4).map(step => `<li>${escapeText(step)}</li>`).join('')}</ol><div class="actions"><button class="mini instruction-button" id="guidedFullGuide">Full instructions</button><button class="mini offline-button" id="guidedOfflineVideo">Offline video</button></div>`;
    document.getElementById('guidedFullGuide').onclick = () => {
      const index = PROGRAM[state.activeWorkout.day].exercises.indexOf(exercise);
      openExerciseGuide(state.activeWorkout.day, index);
    };
    document.getElementById('guidedOfflineVideo').onclick = () => openOfflineVideoForExercise(exercise);
  }

  injectGuideStyles();
  injectGuideModal();
  injectVideoModal();

  const previousRender = render;
  render = function() {
    previousRender();
    addButtonsToExerciseRows();
    addButtonsToLibrary();
  };

  const previousRenderGuided = renderGuided;
  renderGuided = function() {
    previousRenderGuided();
    addGuidedInstructions();
  };

  render();
})();
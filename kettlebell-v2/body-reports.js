// Body progress tracking, local progress photos, and weekly/monthly coach reports.
(() => {
  state.bodyEntries = Array.isArray(state.bodyEntries) ? state.bodyEntries : [];
  state.bodyGoalWeight = Number(state.bodyGoalWeight) || 150;
  state.progressPhotoMeta = Array.isArray(state.progressPhotoMeta) ? state.progressPhotoMeta : [];

  const PHOTO_DB = 'kb-coach-progress-media';
  const PHOTO_STORE = 'photos';
  const PHOTO_MAX = 15 * 1024 * 1024;
  const photoUrls = [];

  function injectBodyStyles() {
    if (document.getElementById('bodyReportStyles')) return;
    const style = document.createElement('style');
    style.id = 'bodyReportStyles';
    style.textContent = `
      .body-dashboard{margin-top:14px}.body-form{display:grid;grid-template-columns:repeat(5,1fr);gap:9px}.body-form input,.body-form textarea{width:100%;background:#0d151f;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:10px}.body-form textarea{grid-column:span 2}.body-metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:12px}.body-metric{padding:13px;border-radius:15px;background:var(--panel2);border:1px solid var(--line)}.body-metric b{display:block;font-size:22px}.body-metric span{font-size:11px;color:var(--muted)}
      .body-table{display:grid;gap:7px;margin-top:12px}.body-row{display:grid;grid-template-columns:1fr 1fr 1fr 2fr auto;gap:8px;align-items:center;padding:10px;border-radius:13px;background:var(--panel2);border:1px solid var(--line);font-size:13px}.body-row button{border:0;background:#3c2026;color:#ffb8b8;border-radius:9px;padding:7px}
      .photo-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-top:12px}.photo-card{position:relative;border-radius:15px;overflow:hidden;background:var(--panel2);border:1px solid var(--line)}.photo-card img{display:block;width:100%;aspect-ratio:3/4;object-fit:cover}.photo-card div{padding:8px;font-size:11px;color:var(--muted)}.photo-card button{position:absolute;right:7px;top:7px;border:0;border-radius:999px;background:rgba(0,0,0,.68);color:white;width:28px;height:28px}
      .report-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.report-card{padding:18px}.report-score{font-size:36px;color:var(--accent);font-weight:950}.report-lines{display:grid;gap:8px;margin-top:12px}.report-line{display:flex;justify-content:space-between;gap:12px;padding:9px;border-radius:12px;background:var(--panel2)}.coach-copy{margin-top:12px;padding:14px;border-radius:15px;background:#132536;border:1px solid #2d4c67;line-height:1.6;color:#d7e4ef}.body-chart{height:190px;display:flex;align-items:flex-end;gap:7px;padding:15px 3px 30px;margin-top:10px}.body-chart-bar{flex:1;min-width:16px;border-radius:8px 8px 3px 3px;background:linear-gradient(180deg,var(--blue),#34688a);position:relative}.body-chart-bar span{position:absolute;left:50%;bottom:-23px;transform:translateX(-50%);font-size:9px;color:var(--muted)}.body-chart-bar em{position:absolute;left:50%;top:-18px;transform:translateX(-50%);font-size:9px;font-style:normal;white-space:nowrap}
      @media(max-width:850px){.body-form{grid-template-columns:1fr 1fr}.body-form textarea{grid-column:1/-1}.body-metrics{grid-template-columns:1fr 1fr}.report-grid{grid-template-columns:1fr}.photo-gallery{grid-template-columns:1fr 1fr}.body-row{grid-template-columns:1fr 1fr}.body-row .body-note{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function injectBodyAndReports() {
    if (document.getElementById('bodyProgressBlock')) return;
    const progress = document.getElementById('progressView');
    const historyHeader = [...progress.querySelectorAll('.section-head')].find(node => node.textContent.includes('HISTORY'));
    const block = document.createElement('div');
    block.id = 'bodyProgressBlock';
    block.innerHTML = `
      <div class="section-head"><div><small>BODY PROGRESS</small><h3>Measurements and photos</h3></div></div>
      <div class="card panel body-dashboard">
        <div class="body-form">
          <input id="bodyDate" type="date" aria-label="Date">
          <input id="bodyWeight" type="number" step="0.1" placeholder="Weight lb" aria-label="Weight pounds">
          <input id="bodyWaist" type="number" step="0.1" placeholder="Waist in" aria-label="Waist inches">
          <input id="bodyGoal" type="number" step="0.1" placeholder="Goal weight" aria-label="Goal weight">
          <button class="primary" onclick="addBodyEntry()">Add entry</button>
          <textarea id="bodyNote" rows="2" placeholder="Optional note"></textarea>
        </div>
        <div class="body-metrics" id="bodyMetrics"></div>
        <div class="body-chart" id="bodyWeightChart"></div>
        <div class="body-table" id="bodyEntryList"></div>
      </div>
      <div class="card panel" style="margin-top:14px"><div class="routine-top"><div><h3>Progress photos</h3><div class="meta">Photos stay in this browser and are not included in JSON backups.</div></div><label class="secondary local-video-label">Add photo<input id="progressPhotoInput" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*"></label></div><div class="photo-gallery" id="progressPhotoGallery"></div></div>
      <div class="section-head"><div><small>COACH REPORTS</small><h3>Weekly and monthly review</h3></div></div>
      <div class="report-grid"><div class="card report-card" id="weeklyReportCard"></div><div class="card report-card" id="monthlyReportCard"></div></div>`;
    progress.insertBefore(block, historyHeader);
    document.getElementById('bodyDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('progressPhotoInput').addEventListener('change', event => {
      const file = event.target.files?.[0];
      if (file) addProgressPhoto(file);
      event.target.value = '';
    });
  }

  function openPhotoDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PHOTO_DB, 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(PHOTO_STORE)) request.result.createObjectStore(PHOTO_STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function putPhoto(record) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).put(record);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async function getPhoto(id) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readonly');
      const request = tx.objectStore(PHOTO_STORE).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  async function deletePhotoRecord(id) {
    const db = await openPhotoDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, 'readwrite');
      tx.objectStore(PHOTO_STORE).delete(id);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  window.addBodyEntry = function() {
    const date = document.getElementById('bodyDate').value || new Date().toISOString().slice(0,10);
    const weight = Number(document.getElementById('bodyWeight').value);
    const waist = Number(document.getElementById('bodyWaist').value);
    const goal = Number(document.getElementById('bodyGoal').value);
    const note = document.getElementById('bodyNote').value.trim();
    if (!weight && !waist) { toast('Enter weight or waist'); return; }
    if (goal) state.bodyGoalWeight = goal;
    state.bodyEntries.push({ id: `body-${Date.now()}`, date, weight: weight || null, waist: waist || null, note });
    state.bodyEntries.sort((a,b) => a.date.localeCompare(b.date));
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    document.getElementById('bodyWeight').value = '';
    document.getElementById('bodyWaist').value = '';
    document.getElementById('bodyNote').value = '';
    renderBodyProgress();
    toast('Body progress saved');
  };

  window.deleteBodyEntry = function(id) {
    state.bodyEntries = state.bodyEntries.filter(entry => entry.id !== id);
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    renderBodyProgress();
  };

  async function addProgressPhoto(file) {
    if (!file.type.startsWith('image/')) { toast('Choose an image file'); return; }
    if (file.size > PHOTO_MAX) { toast('Photo must be under 15 MB'); return; }
    const id = `photo-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    const date = new Date().toISOString();
    try {
      await putPhoto({ id, name: file.name, type: file.type, size: file.size, date, blob: file });
      state.progressPhotoMeta.unshift({ id, name: file.name, date });
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      await renderPhotoGallery();
      toast('Progress photo saved');
    } catch { toast('Photo could not be stored on this device'); }
  }

  window.removeProgressPhoto = async function(id) {
    if (!confirm('Remove this progress photo?')) return;
    await deletePhotoRecord(id);
    state.progressPhotoMeta = state.progressPhotoMeta.filter(item => item.id !== id);
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
    await renderPhotoGallery();
  };

  function releasePhotoUrls() {
    photoUrls.splice(0).forEach(url => URL.revokeObjectURL(url));
  }

  async function renderPhotoGallery() {
    const gallery = document.getElementById('progressPhotoGallery');
    if (!gallery) return;
    releasePhotoUrls();
    if (!state.progressPhotoMeta.length) { gallery.innerHTML = '<div class="empty">No progress photos saved.</div>'; return; }
    gallery.innerHTML = '';
    for (const meta of state.progressPhotoMeta.slice(0, 12)) {
      try {
        const record = await getPhoto(meta.id);
        if (!record) continue;
        const url = URL.createObjectURL(record.blob);
        photoUrls.push(url);
        const card = document.createElement('div');
        card.className = 'photo-card';
        card.innerHTML = `<button onclick="removeProgressPhoto('${meta.id}')">×</button><img src="${url}" alt="Progress photo from ${new Date(meta.date).toLocaleDateString()}"><div>${new Date(meta.date).toLocaleDateString()}</div>`;
        gallery.appendChild(card);
      } catch {}
    }
    if (!gallery.children.length) gallery.innerHTML = '<div class="empty">Saved photo files are unavailable on this device.</div>';
  }

  function average(values) {
    const valid = values.filter(value => Number.isFinite(value));
    return valid.length ? valid.reduce((sum,value)=>sum+value,0)/valid.length : null;
  }

  function renderBodyProgress() {
    const metrics = document.getElementById('bodyMetrics');
    if (!metrics) return;
    const entries = state.bodyEntries;
    const latest = entries[entries.length - 1] || {};
    const firstWeight = entries.find(entry => entry.weight)?.weight || null;
    const lastSeven = entries.filter(entry => entry.weight && Date.now() - new Date(entry.date).getTime() <= 7*86400000).map(entry => entry.weight);
    const avg7 = average(lastSeven);
    const change = firstWeight && latest.weight ? latest.weight - firstWeight : null;
    const toGoal = latest.weight ? latest.weight - state.bodyGoalWeight : null;
    metrics.innerHTML = `<div class="body-metric"><b>${latest.weight ? latest.weight.toFixed(1)+' lb' : '—'}</b><span>latest weight</span></div><div class="body-metric"><b>${avg7 ? avg7.toFixed(1)+' lb' : '—'}</b><span>7-day average</span></div><div class="body-metric"><b>${change === null ? '—' : `${change>0?'+':''}${change.toFixed(1)} lb`}</b><span>change from start</span></div><div class="body-metric"><b>${toGoal === null ? '—' : `${Math.abs(toGoal).toFixed(1)} lb`}</b><span>${toGoal>0?'to goal':'past goal'}</span></div>`;
    document.getElementById('bodyGoal').value = state.bodyGoalWeight;
    const chart = document.getElementById('bodyWeightChart');
    const weighted = entries.filter(entry=>entry.weight).slice(-12);
    if (!weighted.length) chart.innerHTML = '<div class="empty">Add weight entries to see the trend.</div>';
    else {
      const min = Math.min(...weighted.map(entry=>entry.weight)) - 1;
      const max = Math.max(...weighted.map(entry=>entry.weight)) + 1;
      chart.innerHTML = weighted.map(entry => `<div class="body-chart-bar" style="height:${Math.max(12,(entry.weight-min)/(max-min)*145)}px"><em>${entry.weight}</em><span>${entry.date.slice(5)}</span></div>`).join('');
    }
    const list = document.getElementById('bodyEntryList');
    list.innerHTML = entries.length ? [...entries].reverse().slice(0,15).map(entry => `<div class="body-row"><b>${entry.date}</b><span>${entry.weight ? entry.weight+' lb' : '—'}</span><span>${entry.waist ? entry.waist+' in' : '—'}</span><span class="body-note">${escapeHtml(entry.note || '')}</span><button onclick="deleteBodyEntry('${entry.id}')">×</button></div>`).join('') : '<div class="empty">No body measurements saved.</div>';
  }

  function workoutVolume(item) {
    return Object.values(item.setLogs || {}).filter(set=>set.completed).reduce((total,set)=>total+(Number(set.weight)||0)*((Number(set.left)||0)+(Number(set.right)||0)),0);
  }

  function reportData(days) {
    const cutoff = Date.now() - days*86400000;
    const history = state.history.filter(item => new Date(item.date).getTime() >= cutoff);
    const volume = history.reduce((total,item)=>total+workoutVolume(item),0);
    const pain = Object.values(state.logs || {}).filter(item => item.rating === 'pain' && new Date(item.date).getTime() >= cutoff).length;
    const increases = Object.values(state.progression || {}).filter(item => item.direction === 'up' && new Date(item.date).getTime() >= cutoff).length;
    const recovery = state.recoveryHistory.filter(item=>new Date(item.date).getTime()>=cutoff && Number(item.strain));
    const avgStrain = average(recovery.map(item=>Number(item.strain)));
    const planned = days <= 8 ? state.trainingPreferences.trainingDays : Math.round(state.trainingPreferences.trainingDays * days / 7);
    return { history, sessions: history.length, minutes: history.reduce((total,item)=>total+(Number(item.duration)||0),0), volume, pain, increases, avgStrain, planned };
  }

  function coachMessage(data, label) {
    const completion = data.planned ? Math.round(data.sessions/data.planned*100) : 0;
    const lines = [];
    if (completion >= 90) lines.push(`Excellent ${label.toLowerCase()} consistency. Keep the schedule stable.`);
    else if (completion >= 65) lines.push(`Good progress, but protect specific training times to improve consistency.`);
    else lines.push(`Consistency is the main priority. Use 20-minute mode rather than skipping entire sessions.`);
    if (data.increases) lines.push(`${data.increases} exercise recommendation${data.increases===1?' is':'s are'} ready to move upward.`);
    if (data.pain) lines.push(`${data.pain} pain flag${data.pain===1?' needs':'s need'} review. Use substitutions and avoid loading painful movement.`);
    if (data.avgStrain && data.avgStrain >= 17) lines.push('Recovery scores were strained. Reduce volume or use the next deload opportunity.');
    else if (data.avgStrain && data.avgStrain <= 12) lines.push('Recovery was generally good, supporting normal progression.');
    if (!data.volume) lines.push('Record weight and reps consistently so volume trends become meaningful.');
    return lines.join(' ');
  }

  function reportCard(data, title) {
    const completion = data.planned ? Math.min(100, Math.round(data.sessions/data.planned*100)) : 0;
    return `<div class="eyebrow">${title.toUpperCase()}</div><div class="report-score">${completion}%</div><div class="meta">planned-workout completion</div><div class="report-lines"><div class="report-line"><span>Sessions</span><b>${data.sessions} / ${data.planned}</b></div><div class="report-line"><span>Training time</span><b>${data.minutes} min</b></div><div class="report-line"><span>Recorded volume</span><b>${Math.round(data.volume).toLocaleString()} kg-reps</b></div><div class="report-line"><span>Weight increases</span><b>${data.increases}</b></div><div class="report-line"><span>Pain flags</span><b>${data.pain}</b></div></div><div class="coach-copy">${coachMessage(data,title)}</div><div class="actions"><button class="secondary" onclick="copyCoachReport('${title.toLowerCase()}')">Copy report</button><button class="secondary" onclick="downloadCoachReport('${title.toLowerCase()}')">Download</button></div>`;
  }

  function reportText(period) {
    const weekly = period === 'weekly';
    const data = reportData(weekly ? 7 : 30);
    const title = weekly ? 'Weekly Coach Report' : 'Monthly Coach Report';
    return `${title}\n\nSessions: ${data.sessions} of ${data.planned} planned\nTraining time: ${data.minutes} minutes\nRecorded volume: ${Math.round(data.volume).toLocaleString()} kg-reps\nExercises ready to increase: ${data.increases}\nPain flags: ${data.pain}\n\nCoach review: ${coachMessage(data, weekly?'Weekly':'Monthly')}`;
  }

  window.copyCoachReport = async function(period) {
    try { await navigator.clipboard.writeText(reportText(period)); toast('Report copied'); }
    catch { toast('Copy is unavailable in this browser'); }
  };

  window.downloadCoachReport = function(period) {
    const text = reportText(period);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kettlebell-${period}-report.txt`;
    link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  };

  function renderReports() {
    const weekly = document.getElementById('weeklyReportCard');
    const monthly = document.getElementById('monthlyReportCard');
    if (!weekly || !monthly) return;
    weekly.innerHTML = reportCard(reportData(7), 'Weekly');
    monthly.innerHTML = reportCard(reportData(30), 'Monthly');
  }

  const previousRender = render;
  render = function() {
    previousRender();
    renderBodyProgress();
    renderReports();
  };

  injectBodyStyles();
  injectBodyAndReports();
  localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  renderBodyProgress();
  renderReports();
  renderPhotoGallery();
})();
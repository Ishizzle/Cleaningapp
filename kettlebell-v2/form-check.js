// Camera Form Check: on-device pose guidance for goblet squats,
// kettlebell swings, and single-arm overhead presses. Camera frames are not saved.
(() => {
  state.version = Math.max(Number(state.version) || 0, 9);
  state.formCheckHistory = Array.isArray(state.formCheckHistory) ? state.formCheckHistory : [];
  state.formCheckSettings = Object.assign({ facingMode: 'environment', voice: false, mirror: false }, state.formCheckSettings || {});

  const MEDIAPIPE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22-rc.20250304/+esm';
  const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm';
  const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
  const SUPPORTED = {
    'Goblet Squat': { view: 'front', setup: 'Place the camera around hip height. Keep your head, hands, hips, knees, and feet visible.' },
    'Kettlebell Swing': { view: 'side', setup: 'Use a side view. Place the camera around hip height and keep the entire bell path and both feet visible.' },
    'Single Arm Overhead Press': { view: 'front', setup: 'Use a front or slight front-angle view. Keep both hips and the full pressing arm visible overhead.' }
  };
  const CONNECTIONS = [
    [11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],
    [23,25],[25,27],[27,29],[29,31],[24,26],[26,28],[28,30],[30,32]
  ];
  const FULL_BODY_POINTS = [11,12,23,24,25,26,27,28];

  let visionModule = null;
  let poseLandmarker = null;
  let stream = null;
  let animationFrame = null;
  let lastInferenceAt = 0;
  let inferenceBusy = false;
  let smoothPose = null;
  let session = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function midpoint(a, b) { return { x:(a.x+b.x)/2, y:(a.y+b.y)/2, visibility:Math.min(a.visibility ?? 1,b.visibility ?? 1) }; }
  function distance(a, b) { return Math.hypot(a.x-b.x, a.y-b.y); }
  function angle(a, b, c) {
    const ab = { x:a.x-b.x, y:a.y-b.y };
    const cb = { x:c.x-b.x, y:c.y-b.y };
    const denominator = Math.hypot(ab.x,ab.y) * Math.hypot(cb.x,cb.y);
    if (!denominator) return 0;
    return Math.acos(clamp((ab.x*cb.x + ab.y*cb.y) / denominator, -1, 1)) * 180 / Math.PI;
  }
  function torsoLean(shoulder, hip) { return Math.atan2(Math.abs(shoulder.x-hip.x), Math.abs(shoulder.y-hip.y)) * 180 / Math.PI; }
  function visible(point, threshold=.5) { return point && (point.visibility ?? 1) >= threshold; }
  function average(values) { const valid=values.filter(Number.isFinite); return valid.length ? valid.reduce((a,b)=>a+b,0)/valid.length : 0; }
  function escape(value) { return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character])); }

  function injectStyles() {
    if (document.getElementById('formCheckStyles')) return;
    const style = document.createElement('style');
    style.id = 'formCheckStyles';
    style.textContent = `
      .form-check-button{background:#183c35;color:#baffdf}.form-modal{max-width:1080px}.form-layout{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(280px,.75fr);gap:14px}.form-stage{position:relative;overflow:hidden;border-radius:18px;background:#05080b;min-height:420px;border:1px solid #2f465a}.form-stage video,.form-stage canvas{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.form-stage.mirror video,.form-stage.mirror canvas{transform:scaleX(-1)}.form-stage-guide{position:absolute;inset:7% 17%;border:2px dashed rgba(255,255,255,.38);border-radius:45% 45% 18% 18%;pointer-events:none}.form-stage-message{position:absolute;left:12px;right:12px;bottom:12px;padding:11px 13px;border-radius:13px;background:rgba(5,10,15,.78);backdrop-filter:blur(8px);font-weight:850;text-align:center}.form-stage-message.good{color:#caff9e}.form-stage-message.warn{color:#ffe19b}.form-stage-message.bad{color:#ffb0b8}.form-side{display:flex;flex-direction:column;gap:11px}.form-controls{display:grid;grid-template-columns:1fr 1fr;gap:8px}.form-controls .field{margin:0}.form-controls select{width:100%;background:#0d151f;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:10px}.form-disclaimer{padding:12px;border-radius:14px;background:#30271d;border:1px solid #5c4a2d;color:#f7dda8;font-size:12px;line-height:1.5}.form-setup{padding:12px;border-radius:14px;background:#132535;border:1px solid #31506a;color:#d6eaff;font-size:12px;line-height:1.55}.form-metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.form-metric{padding:12px;border-radius:14px;background:var(--panel2);border:1px solid var(--line)}.form-metric b{display:block;font-size:24px}.form-metric span{font-size:11px;color:var(--muted)}.form-cues{display:grid;gap:7px}.form-cue{padding:10px 11px;border-radius:12px;background:#192633;border-left:4px solid var(--blue);font-size:13px}.form-cue.major{border-left-color:#d45b6c;background:#321f26}.form-cue.moderate{border-left-color:#d69d45;background:#30281d}.form-cue.good{border-left-color:var(--accent);background:#1c2e1b}.form-history{display:grid;gap:7px;max-height:180px;overflow:auto}.form-history-item{display:flex;justify-content:space-between;gap:10px;padding:9px;border-radius:12px;background:var(--panel2);font-size:12px}.form-loading{display:inline-flex;align-items:center;gap:7px}.form-dot{width:9px;height:9px;border-radius:50%;background:var(--muted)}.form-dot.live{background:var(--accent);box-shadow:0 0 0 5px rgba(164,225,90,.12)}
      @media(max-width:850px){.form-layout{grid-template-columns:1fr}.form-stage{min-height:52vh}.form-side{max-height:none}}@media(max-width:540px){.form-stage{min-height:430px}.form-controls{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function injectModal() {
    if (document.getElementById('formCheckModal')) return;
    const modal = document.createElement('div');
    modal.id = 'formCheckModal';
    modal.className = 'modal';
    modal.innerHTML = `<div class="card modal-card form-modal"><div class="modal-head"><div><div class="eyebrow">CAMERA COACH</div><h2 style="margin:5px 0">Form Check</h2></div><button class="secondary" onclick="closeFormCheck()">Close</button></div><div class="form-layout"><div class="form-stage" id="formStage"><video id="formVideo" playsinline muted></video><canvas id="formCanvas"></canvas><div class="form-stage-guide"></div><div class="form-stage-message warn" id="formStageMessage">Choose an exercise, then start the camera.</div></div><div class="form-side"><div class="form-disclaimer">Form Check provides approximate visual coaching only. It cannot detect pain, internal joint stress, breathing quality, or guarantee injury prevention. Stop for pain, dizziness, numbness, or loss of control.</div><div class="form-controls"><div class="field"><label>Exercise</label><select id="formExercise" onchange="changeFormExercise()"><option>Goblet Squat</option><option>Kettlebell Swing</option><option>Single Arm Overhead Press</option></select></div><div class="field"><label>Camera view</label><select id="formView" onchange="resetFormSession()"><option value="front">Front view</option><option value="side">Side view</option></select></div><div class="field"><label>Camera</label><select id="formFacing"><option value="environment">Rear camera</option><option value="user">Front camera</option></select></div><div class="field"><label>Feedback</label><select id="formVoice"><option value="off">Text only</option><option value="on">Text + voice</option></select></div></div><div class="form-setup" id="formSetup"></div><div class="actions"><button class="primary" id="formStartButton" onclick="startFormCheck()">Start camera</button><button class="secondary" onclick="stopFormCheck()">Stop and save</button><button class="secondary" onclick="resetFormSession()">Reset reps</button><button class="secondary" onclick="toggleFormMirror()">Mirror</button></div><div class="form-loading"><span class="form-dot" id="formLiveDot"></span><span class="meta" id="formModelStatus">AI model loads when you start.</span></div><div class="form-metrics"><div class="form-metric"><b id="formReps">0</b><span>reps counted</span></div><div class="form-metric"><b id="formScore">—</b><span>form score</span></div><div class="form-metric"><b id="formPhase">Ready</b><span>movement phase</span></div><div class="form-metric"><b id="formConfidence">—</b><span>pose confidence</span></div></div><div><h3 style="margin:3px 0 8px">Live coaching</h3><div class="form-cues" id="formCues"><div class="form-cue">Camera is off.</div></div></div><div><h3 style="margin:3px 0 8px">Recent checks</h3><div class="form-history" id="formHistory"></div></div></div></div></div>`;
    document.body.appendChild(modal);
  }

  function injectButtons() {
    const toolbar = document.querySelector('#workoutView .feature-toolbar');
    if (toolbar && !document.getElementById('openFormCheckButton')) {
      const button = document.createElement('button');
      button.id = 'openFormCheckButton';
      button.className = 'quick-toggle form-check-button';
      button.textContent = 'Camera form check';
      button.onclick = () => openFormCheck();
      toolbar.appendChild(button);
    }
  }

  function newSession() {
    return {
      exercise: document.getElementById('formExercise')?.value || 'Goblet Squat',
      view: document.getElementById('formView')?.value || 'front',
      startedAt: null,
      reps: 0,
      phase: 'ready',
      calibrated: false,
      goodCalibrationFrames: 0,
      scoreSum: 0,
      scoreSamples: 0,
      issueCounts: {},
      lastIssueSampleAt: 0,
      lastSpoken: '',
      lastSpokenAt: 0,
      bottom: null,
      activeSide: null,
      saved: false
    };
  }

  function updateSetup() {
    const exercise = document.getElementById('formExercise').value;
    const details = SUPPORTED[exercise];
    document.getElementById('formSetup').innerHTML = `<b>Recommended ${details.view} view</b><br>${escape(details.setup)}<br><span class="meta">Wear fitted clothing where possible and use bright, even lighting.</span>`;
  }

  window.openFormCheck = function(exerciseName) {
    if (exerciseName && SUPPORTED[exerciseName]) document.getElementById('formExercise').value = exerciseName;
    changeFormExercise(false);
    document.getElementById('formFacing').value = state.formCheckSettings.facingMode;
    document.getElementById('formVoice').value = state.formCheckSettings.voice ? 'on' : 'off';
    document.getElementById('formStage').classList.toggle('mirror', Boolean(state.formCheckSettings.mirror));
    document.getElementById('formCheckModal').classList.add('open');
    renderHistory();
  };

  window.closeFormCheck = function() {
    if (stream && !confirm('Stop the camera and close Form Check?')) return;
    stopFormCheck();
    document.getElementById('formCheckModal').classList.remove('open');
  };

  window.changeFormExercise = function(reset=true) {
    const exercise = document.getElementById('formExercise').value;
    document.getElementById('formView').value = SUPPORTED[exercise].view;
    updateSetup();
    if (reset) resetFormSession();
  };

  window.toggleFormMirror = function() {
    state.formCheckSettings.mirror = !state.formCheckSettings.mirror;
    document.getElementById('formStage').classList.toggle('mirror', state.formCheckSettings.mirror);
    localStorage.setItem('kb-coach-v2', JSON.stringify(state));
  };

  async function initializePoseLandmarker() {
    if (poseLandmarker) return;
    const status = document.getElementById('formModelStatus');
    status.textContent = 'Loading pose model…';
    visionModule ||= await import(MEDIAPIPE_URL);
    const vision = await visionModule.FilesetResolver.forVisionTasks(WASM_URL);
    const options = {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: .55,
      minPosePresenceConfidence: .55,
      minTrackingConfidence: .55,
      outputSegmentationMasks: false
    };
    try {
      poseLandmarker = await visionModule.PoseLandmarker.createFromOptions(vision, options);
    } catch (gpuError) {
      options.baseOptions.delegate = 'CPU';
      poseLandmarker = await visionModule.PoseLandmarker.createFromOptions(vision, options);
    }
    status.textContent = 'Pose model ready.';
  }

  window.startFormCheck = async function() {
    const status = document.getElementById('formModelStatus');
    const button = document.getElementById('formStartButton');
    if (!navigator.mediaDevices?.getUserMedia) {
      setStageMessage('Camera access is unavailable in this browser.', 'bad');
      return;
    }
    button.disabled = true;
    try {
      stopCameraOnly();
      await initializePoseLandmarker();
      const facingMode = document.getElementById('formFacing').value;
      state.formCheckSettings.facingMode = facingMode;
      state.formCheckSettings.voice = document.getElementById('formVoice').value === 'on';
      localStorage.setItem('kb-coach-v2', JSON.stringify(state));
      status.textContent = 'Requesting camera permission…';
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30, max: 30 } }
      });
      const video = document.getElementById('formVideo');
      video.srcObject = stream;
      await video.play();
      await new Promise(resolve => {
        if (video.videoWidth) resolve();
        else video.addEventListener('loadedmetadata', resolve, { once:true });
      });
      resizeCanvas();
      session = newSession();
      session.startedAt = new Date().toISOString();
      smoothPose = null;
      lastInferenceAt = 0;
      document.getElementById('formLiveDot').classList.add('live');
      status.textContent = 'Camera live · pose analysis running locally.';
      setStageMessage('Step into the guide and show your full body.', 'warn');
      animationFrame = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Form Check start error', error);
      status.textContent = 'Camera could not start.';
      const message = error?.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in Safari settings.' : error?.name === 'NotFoundError' ? 'No matching camera was found.' : 'The pose model or camera could not start. Check your connection and try again.';
      setStageMessage(message, 'bad');
      stopCameraOnly();
    } finally {
      button.disabled = false;
    }
  };

  function stopCameraOnly() {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = null;
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
    const video = document.getElementById('formVideo');
    if (video) video.srcObject = null;
    document.getElementById('formLiveDot')?.classList.remove('live');
    clearCanvas();
  }

  window.stopFormCheck = function() {
    saveSession();
    stopCameraOnly();
    document.getElementById('formModelStatus').textContent = poseLandmarker ? 'Pose model ready. Camera stopped.' : 'AI model loads when you start.';
    setStageMessage('Camera stopped. Start again for another check.', 'warn');
  };

  window.resetFormSession = function() {
    session = newSession();
    if (stream) session.startedAt = new Date().toISOString();
    smoothPose = null;
    updateMetrics({ confidence:0, score:null, phase:'Ready' });
    document.getElementById('formCues').innerHTML = '<div class="form-cue">Rep count and form score reset.</div>';
  };

  function resizeCanvas() {
    const video = document.getElementById('formVideo');
    const canvas = document.getElementById('formCanvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
  }

  function clearCanvas() {
    const canvas = document.getElementById('formCanvas');
    const context = canvas?.getContext('2d');
    if (context) context.clearRect(0,0,canvas.width,canvas.height);
  }

  async function detectPose(video, timestamp) {
    return new Promise((resolve, reject) => {
      try { poseLandmarker.detectForVideo(video, timestamp, resolve); }
      catch (error) { reject(error); }
    });
  }

  async function processFrame(now) {
    if (!stream) return;
    animationFrame = requestAnimationFrame(processFrame);
    if (inferenceBusy || now - lastInferenceAt < 110) return;
    const video = document.getElementById('formVideo');
    if (video.readyState < 2) return;
    inferenceBusy = true;
    lastInferenceAt = now;
    try {
      const result = await detectPose(video, now);
      const landmarks = result?.landmarks?.[0];
      if (!landmarks) {
        session.goodCalibrationFrames = 0;
        setStageMessage('No person detected. Step fully into view.', 'bad');
        updateMetrics({ confidence:0, score:null, phase:'Searching' });
        clearCanvas();
        return;
      }
      smoothPose = smoothLandmarks(smoothPose, landmarks);
      drawPose(smoothPose);
      analyzePose(smoothPose, now);
    } catch (error) {
      console.warn('Pose detection frame error', error);
    } finally {
      inferenceBusy = false;
    }
  }

  function smoothLandmarks(previous, current) {
    if (!previous || previous.length !== current.length) return current.map(point => ({...point}));
    const alpha = .42;
    return current.map((point,index) => ({
      x: previous[index].x*(1-alpha)+point.x*alpha,
      y: previous[index].y*(1-alpha)+point.y*alpha,
      z: previous[index].z*(1-alpha)+point.z*alpha,
      visibility: point.visibility,
      presence: point.presence
    }));
  }

  function drawPose(points) {
    const canvas = document.getElementById('formCanvas');
    const context = canvas.getContext('2d');
    context.clearRect(0,0,canvas.width,canvas.height);
    context.lineWidth = Math.max(3, canvas.width/300);
    context.strokeStyle = session?.calibrated ? '#a8ec63' : '#5bb8ee';
    context.fillStyle = '#ffffff';
    CONNECTIONS.forEach(([start,end]) => {
      const a=points[start], b=points[end];
      if (!visible(a,.35) || !visible(b,.35)) return;
      context.beginPath();
      context.moveTo(a.x*canvas.width,a.y*canvas.height);
      context.lineTo(b.x*canvas.width,b.y*canvas.height);
      context.stroke();
    });
    points.forEach((point,index) => {
      if (!FULL_BODY_POINTS.includes(index) && ![13,14,15,16].includes(index)) return;
      if (!visible(point,.35)) return;
      context.beginPath();
      context.arc(point.x*canvas.width,point.y*canvas.height,Math.max(4,canvas.width/220),0,Math.PI*2);
      context.fill();
    });
  }

  function calibration(points) {
    const usable = FULL_BODY_POINTS.filter(index => visible(points[index],.55));
    const confidence = average(FULL_BODY_POINTS.map(index => points[index]?.visibility ?? 0));
    if (usable.length < 7) return { good:false, confidence, message:'Keep both shoulders, hips, knees, and ankles visible.' };
    const xs = usable.map(index => points[index].x);
    const ys = usable.map(index => points[index].y);
    const width = Math.max(...xs)-Math.min(...xs);
    const height = Math.max(...ys)-Math.min(...ys);
    if (height < .48) return { good:false, confidence, message:'Move closer until your body fills more of the frame.' };
    if (Math.min(...ys) < .02 || Math.max(...ys) > .98 || Math.min(...xs) < .02 || Math.max(...xs) > .98) return { good:false, confidence, message:'Move toward the centre so your full body stays inside the frame.' };
    const shoulders = distance(points[11],points[12]);
    if (session.view === 'front' && shoulders < .08) return { good:false, confidence, message:'Turn more toward the camera for the selected front view.' };
    if (session.view === 'side' && shoulders > .22) return { good:false, confidence, message:'Turn sideways for the selected side view.' };
    if (width < .06) return { good:false, confidence, message:'Move slightly closer or improve the lighting.' };
    return { good:true, confidence, message:'Position locked. Begin when ready.' };
  }

  function analyzePose(points, now) {
    if (!session) session = newSession();
    const calibrationResult = calibration(points);
    if (!calibrationResult.good) {
      session.calibrated = false;
      session.goodCalibrationFrames = 0;
      setStageMessage(calibrationResult.message, 'warn');
      updateMetrics({ confidence:calibrationResult.confidence, score:null, phase:'Positioning' });
      renderCues([{ text:calibrationResult.message, severity:'moderate' }]);
      return;
    }
    session.goodCalibrationFrames++;
    if (!session.calibrated && session.goodCalibrationFrames >= 8) session.calibrated = true;
    if (!session.calibrated) {
      setStageMessage(`Hold still for calibration… ${session.goodCalibrationFrames}/8`, 'warn');
      updateMetrics({ confidence:calibrationResult.confidence, score:null, phase:'Calibrating' });
      return;
    }

    let analysis;
    if (session.exercise === 'Goblet Squat') analysis = analyzeSquat(points);
    else if (session.exercise === 'Kettlebell Swing') analysis = analyzeSwing(points);
    else analysis = analyzePress(points);

    const score = clamp(100 - analysis.cues.reduce((sum,cue) => sum + (cue.severity==='major'?18:cue.severity==='moderate'?10:5),0), 35, 100);
    session.scoreSum += score;
    session.scoreSamples++;
    sampleIssues(analysis.cues, now);
    setStageMessage(analysis.cues[0]?.text || 'Good position. Keep moving with control.', analysis.cues.some(cue=>cue.severity==='major')?'bad':analysis.cues.length?'warn':'good');
    updateMetrics({ confidence:calibrationResult.confidence, score, phase:analysis.phase });
    renderCues(analysis.cues.length ? analysis.cues : [{ text:'Good position. Keep moving with control.', severity:'good' }]);
    speakCue(analysis.cues[0]?.text, now);
  }

  function analyzeSquat(points) {
    const leftKnee = angle(points[23],points[25],points[27]);
    const rightKnee = angle(points[24],points[26],points[28]);
    const kneeAngle = average([leftKnee,rightKnee]);
    const shoulder = midpoint(points[11],points[12]);
    const hip = midpoint(points[23],points[24]);
    const lean = torsoLean(shoulder,hip);
    const ankleWidth = Math.max(.01,distance(points[27],points[28]));
    const kneeWidth = distance(points[25],points[26]);
    const kneeRatio = kneeWidth/ankleWidth;
    const asymmetry = Math.abs(leftKnee-rightKnee);
    const cues = [];

    if (session.phase === 'ready' || session.phase === 'top') {
      if (kneeAngle < 118) {
        session.phase = 'down';
        session.bottom = { knee:kneeAngle, lean, kneeRatio, asymmetry };
      } else session.phase = 'top';
    } else if (session.phase === 'down') {
      session.bottom.knee = Math.min(session.bottom.knee,kneeAngle);
      session.bottom.lean = Math.max(session.bottom.lean,lean);
      session.bottom.kneeRatio = Math.min(session.bottom.kneeRatio,kneeRatio);
      session.bottom.asymmetry = Math.max(session.bottom.asymmetry,asymmetry);
      if (kneeAngle > 156) {
        session.reps++;
        if (session.bottom.knee > 105) cues.push({ text:'Try a little more controlled depth if it remains comfortable.', severity:'moderate' });
        if (session.bottom.kneeRatio < .72 && session.view === 'front') cues.push({ text:'Keep your knees tracking outward over your toes.', severity:'major' });
        if (session.bottom.asymmetry > 18) cues.push({ text:'Keep both sides moving evenly.', severity:'moderate' });
        if (session.bottom.lean > 42 && session.view === 'side') cues.push({ text:'Keep the bell close and your chest slightly taller.', severity:'moderate' });
        session.phase = 'top';
        session.bottom = null;
      }
    }
    if (session.phase === 'down' && kneeRatio < .68 && session.view === 'front') cues.push({ text:'Press your knees outward so they follow your toes.', severity:'major' });
    if (session.phase === 'down' && asymmetry > 22) cues.push({ text:'Shift back to centre and keep both feet equally loaded.', severity:'moderate' });
    return { phase:session.phase==='down'?'Lowering':'Standing', cues };
  }

  function bestSide(points) {
    const left=[11,13,15,23,25,27], right=[12,14,16,24,26,28];
    const leftScore=average(left.map(index=>points[index]?.visibility??0));
    const rightScore=average(right.map(index=>points[index]?.visibility??0));
    return leftScore>=rightScore ? { shoulder:11, elbow:13, wrist:15, hip:23, knee:25, ankle:27, name:'left' } : { shoulder:12, elbow:14, wrist:16, hip:24, knee:26, ankle:28, name:'right' };
  }

  function analyzeSwing(points) {
    const side=bestSide(points);
    const hipAngle=angle(points[side.shoulder],points[side.hip],points[side.knee]);
    const kneeAngle=angle(points[side.hip],points[side.knee],points[side.ankle]);
    const shoulder=points[side.shoulder], hip=points[side.hip];
    const wrist=midpoint(points[15],points[16]);
    const lean=torsoLean(shoulder,hip);
    const bottom=hipAngle<128 && wrist.y>hip.y+.02;
    const top=hipAngle>155 && wrist.y<hip.y-.07;
    const cues=[];

    if (session.phase==='ready' || session.phase==='top') {
      if (bottom) session.phase='backswing';
      else session.phase='top';
    } else if (session.phase==='backswing' && top) {
      session.reps++;
      session.phase='top';
    }
    if (bottom && kneeAngle<112) cues.push({ text:'Hinge your hips back more and bend your knees less.', severity:'major' });
    if (bottom && hipAngle>118) cues.push({ text:'Reach your hips farther back to load the hinge.', severity:'moderate' });
    if (top && hipAngle<164) cues.push({ text:'Finish tall by snapping your hips fully through.', severity:'moderate' });
    if (top && lean>20) cues.push({ text:'Stand tall at the top without leaning backward.', severity:'major' });
    if (session.view!=='side') cues.push({ text:'A side camera view gives a more reliable swing check.', severity:'moderate' });
    return { phase:session.phase==='backswing'?'Backswing':'Hip extension', cues };
  }

  function pressSide(points) {
    const leftVisibility=average([11,13,15,23].map(index=>points[index]?.visibility??0));
    const rightVisibility=average([12,14,16,24].map(index=>points[index]?.visibility??0));
    const leftRaised=points[15].y<points[11].y+.1 ? .25 : 0;
    const rightRaised=points[16].y<points[12].y+.1 ? .25 : 0;
    return leftVisibility+leftRaised>=rightVisibility+rightRaised ? { shoulder:11,elbow:13,wrist:15,hip:23 } : { shoulder:12,elbow:14,wrist:16,hip:24 };
  }

  function analyzePress(points) {
    const side=pressSide(points);
    const elbowAngle=angle(points[side.shoulder],points[side.elbow],points[side.wrist]);
    const wrist=points[side.wrist], shoulder=points[side.shoulder];
    const shoulderMid=midpoint(points[11],points[12]);
    const hipMid=midpoint(points[23],points[24]);
    const sideLean=Math.abs(shoulderMid.x-hipMid.x);
    const rack=elbowAngle<125 && wrist.y>shoulder.y-.12;
    const overhead=wrist.y<shoulder.y-.18;
    const lockout=overhead && elbowAngle>156;
    const cues=[];

    if (session.phase==='ready') session.phase=rack?'rack':'ready';
    if (rack) session.phase='rack';
    if (session.phase==='rack' && lockout) {
      session.reps++;
      session.phase='overhead';
    }
    if (session.phase==='overhead' && rack) session.phase='rack';
    if (overhead && elbowAngle<150) cues.push({ text:'Finish with a straighter elbow while keeping the shoulder controlled.', severity:'moderate' });
    if (overhead && Math.abs(wrist.x-shoulder.x)>.13) cues.push({ text:'Stack the wrist more directly over the shoulder.', severity:'major' });
    if (sideLean>.075) cues.push({ text:'Stay centred and avoid leaning sideways to finish the press.', severity:'major' });
    if (session.view!=='front') cues.push({ text:'A front or slight front-angle view gives a better press check.', severity:'moderate' });
    return { phase:session.phase==='overhead'?'Overhead':session.phase==='rack'?'Rack':'Set up', cues };
  }

  function sampleIssues(cues, now) {
    if (now-session.lastIssueSampleAt<900) return;
    session.lastIssueSampleAt=now;
    cues.forEach(cue => session.issueCounts[cue.text]=(session.issueCounts[cue.text]||0)+1);
  }

  function speakCue(text, now) {
    if (!text || !state.formCheckSettings.voice || !('speechSynthesis' in window)) return;
    if (text===session.lastSpoken && now-session.lastSpokenAt<8000) return;
    if (now-session.lastSpokenAt<4500) return;
    session.lastSpoken=text;
    session.lastSpokenAt=now;
    speechSynthesis.cancel();
    const utterance=new SpeechSynthesisUtterance(text);
    utterance.rate=1.03;
    speechSynthesis.speak(utterance);
  }

  function updateMetrics({ confidence, score, phase }) {
    document.getElementById('formReps').textContent=session?.reps||0;
    const averageScore=session?.scoreSamples ? Math.round(session.scoreSum/session.scoreSamples) : null;
    document.getElementById('formScore').textContent=averageScore ? `${averageScore}%` : score ? `${Math.round(score)}%` : '—';
    document.getElementById('formPhase').textContent=phase||'Ready';
    document.getElementById('formConfidence').textContent=confidence ? `${Math.round(confidence*100)}%` : '—';
  }

  function renderCues(cues) {
    document.getElementById('formCues').innerHTML=cues.slice(0,3).map(cue=>`<div class="form-cue ${cue.severity}">${escape(cue.text)}</div>`).join('');
  }

  function setStageMessage(text,type) {
    const element=document.getElementById('formStageMessage');
    element.textContent=text;
    element.className=`form-stage-message ${type}`;
  }

  function saveSession() {
    if (!session?.startedAt || session.saved) return;
    const duration=Math.round((Date.now()-new Date(session.startedAt).getTime())/1000);
    if (duration<5) return;
    session.saved=true;
    const topIssues=Object.entries(session.issueCounts).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([text,count])=>({text,count}));
    state.formCheckHistory.unshift({
      id:`form-${Date.now()}`,
      date:new Date().toISOString(),
      exercise:session.exercise,
      view:session.view,
      reps:session.reps,
      averageScore:session.scoreSamples?Math.round(session.scoreSum/session.scoreSamples):null,
      duration,
      issues:topIssues
    });
    state.formCheckHistory=state.formCheckHistory.slice(0,50);
    localStorage.setItem('kb-coach-v2',JSON.stringify(state));
    renderHistory();
  }

  function renderHistory() {
    const list=document.getElementById('formHistory');
    if (!list) return;
    list.innerHTML=state.formCheckHistory.length ? state.formCheckHistory.slice(0,8).map(item=>`<div class="form-history-item"><div><b>${escape(item.exercise)}</b><div class="meta">${new Date(item.date).toLocaleDateString()} · ${item.reps} reps · ${item.view}</div></div><span class="chip">${item.averageScore?item.averageScore+'%':'—'}</span></div>`).join('') : '<div class="empty">No camera checks saved yet.</div>';
  }

  function injectGuidedButton() {
    if (!state.activeWorkout) return;
    const exercise=PROGRAM[state.activeWorkout.day]?.exercises?.[activeExercise];
    const actions=document.querySelector('#guidedExerciseGuide .actions');
    if (!exercise || !actions || !SUPPORTED[exercise.name] || actions.querySelector('.guided-form-check')) return;
    const button=document.createElement('button');
    button.className='mini form-check-button guided-form-check';
    button.textContent='Camera form check';
    button.onclick=()=>openFormCheck(exercise.name);
    actions.appendChild(button);
  }

  const previousRender=render;
  render=function(){ previousRender(); injectButtons(); };
  const previousRenderGuided=renderGuided;
  renderGuided=function(){ previousRenderGuided(); injectGuidedButton(); };

  injectStyles();
  injectModal();
  injectButtons();
  session=newSession();
  updateSetup();
  renderHistory();
  localStorage.setItem('kb-coach-v2',JSON.stringify(state));
})();
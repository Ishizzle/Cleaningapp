const DEFAULT={
  version:3,
  name:'Inder',week:1,currentDay:'Monday',weightsOwned:[8,12,16,20,24,28,32],
  sessions:0,minutes:0,sets:0,completed:{},exerciseDone:{},history:[],logs:{},ratings:{},
  progression:{},recoveryHistory:[],activeWorkout:null
};
let state=loadState();
let activeExercise=0,seconds=90,timerHandle=null,timerRunning=false,deferredPrompt=null;
const CURATED={
  'Goblet Squat':{coach:'Dan John',url:'https://www.youtube.com/results?search_query=Dan+John+goblet+squat+tutorial'},
  'Kettlebell Swing':{coach:'StrongFirst',url:'https://www.youtube.com/results?search_query=StrongFirst+kettlebell+swing+tutorial'},
  'Single Arm Overhead Press':{coach:'StrongFirst',url:'https://www.youtube.com/results?search_query=StrongFirst+single+arm+kettlebell+press'},
  'Single Arm Floor Press':{coach:'StrongFirst',url:'https://www.youtube.com/results?search_query=StrongFirst+kettlebell+floor+press'},
  'Half Kneeling Press':{coach:'E3 Rehab',url:'https://www.youtube.com/results?search_query=E3+Rehab+half+kneeling+press'},
  'Push Press':{coach:'Mark Wildman',url:'https://www.youtube.com/results?search_query=Mark+Wildman+kettlebell+push+press'},
  'Single Arm Row':{coach:'StrongFirst',url:'https://www.youtube.com/results?search_query=StrongFirst+kettlebell+row'},
  'Single Arm Clean':{coach:'Mark Wildman',url:'https://www.youtube.com/results?search_query=Mark+Wildman+kettlebell+clean+tutorial'},
  'Turkish Get-up':{coach:'StrongFirst',url:'https://www.youtube.com/results?search_query=StrongFirst+Turkish+get+up+tutorial'},
  'Bulgarian Split Squat':{coach:'Squat University',url:'https://www.youtube.com/results?search_query=Squat+University+Bulgarian+split+squat'},
  'Single Leg Romanian Deadlift':{coach:'E3 Rehab',url:'https://www.youtube.com/results?search_query=E3+Rehab+single+leg+Romanian+deadlift'},
  'Reverse Lunge':{coach:'Squat University',url:'https://www.youtube.com/results?search_query=Squat+University+reverse+lunge'},
  'Suitcase Carry':{coach:'StrongFirst',url:'https://www.youtube.com/results?search_query=StrongFirst+suitcase+carry'},
  'Push-up':{coach:'E3 Rehab',url:'https://www.youtube.com/results?search_query=E3+Rehab+push+up+tutorial'},
  'Plank':{coach:'E3 Rehab',url:'https://www.youtube.com/results?search_query=E3+Rehab+plank+form'},
  'Side Plank':{coach:'E3 Rehab',url:'https://www.youtube.com/results?search_query=E3+Rehab+side+plank'},
  'Dead Bug':{coach:'E3 Rehab',url:'https://www.youtube.com/results?search_query=E3+Rehab+dead+bug'},
  'Mountain Climber':{coach:'ACE Fitness',url:'https://www.youtube.com/results?search_query=ACE+Fitness+mountain+climber'},
  'Hammer Curl':{coach:'Kettlebell Kings',url:'https://www.youtube.com/results?search_query=Kettlebell+Kings+hammer+curl'}
};

function loadState(){
  try{
    const saved=JSON.parse(localStorage.getItem('kb-coach-v2')||'null');
    if(saved){
      const merged=Object.assign({},DEFAULT,saved);
      merged.version=3;
      merged.progression=saved.progression||{};
      merged.recoveryHistory=saved.recoveryHistory||[];
      merged.activeWorkout=saved.activeWorkout||null;
      return merged;
    }
    const old=JSON.parse(localStorage.getItem('kb-simple')||'null');
    if(old){
      const migrated=JSON.parse(JSON.stringify(DEFAULT));
      migrated.week=old.week||1;migrated.currentDay=old.currentDay||'Monday';
      migrated.sessions=old.sessions||0;migrated.sets=old.totalSets||0;
      migrated.completed=old.completed||{};migrated.history=old.history||[];
      return migrated;
    }
  }catch{}
  return JSON.parse(JSON.stringify(DEFAULT));
}
function persist(quiet=false){localStorage.setItem('kb-coach-v2',JSON.stringify(state));render();if(!quiet)toast('Saved')}
function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.style.display='block';setTimeout(()=>t.style.display='none',1400)}
function dayKey(day=state.currentDay,week=state.week){return `w${week}-${day}`}
function exKey(index,day=state.currentDay,week=state.week){return `w${week}-${day}-${index}`}
function logKey(day,exercise){return `${day}-${exercise}`}
function showView(id){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===id));window.scrollTo({top:0,behavior:'smooth'})}
function selectDay(day){state.currentDay=day;persist(true)}
function availableWeights(ex){if(ex.weights.length===1&&ex.weights[0]===0)return[0];const filtered=ex.weights.filter(w=>state.weightsOwned.includes(w));return filtered.length?filtered:ex.weights}
function nearestAvailable(ex,target){const list=availableWeights(ex);if(list[0]===0)return 0;return list.reduce((a,b)=>Math.abs(b-target)<Math.abs(a-target)?b:a,list[0])}
function suggestedWeight(ex,day=state.currentDay){
  if(ex.weights[0]===0)return 0;
  const p=state.progression[logKey(day,ex.name)];
  if(p&&typeof p.nextWeight==='number')return nearestAvailable(ex,p.nextWeight);
  const available=availableWeights(ex),last=state.logs[logKey(day,ex.name)];let target=ex.defaultWeight;
  if(last){let i=available.indexOf(last.weight);if(last.rating==='easy'&&i>=0&&i<available.length-1)target=available[i+1];else if((last.rating==='hard'||last.rating==='pain')&&i>0)target=available[i-1];else if(available.includes(last.weight))target=last.weight}
  return nearestAvailable(ex,target);
}
function curated(ex){return CURATED[ex.name]||{coach:'Selected tutorial',url:ex.video}}
function render(){
  const day=PROGRAM[state.currentDay];
  document.getElementById('weekLabel').textContent='Week '+state.week;document.getElementById('heroWeek').textContent=state.week;
  document.getElementById('heroTitle').textContent=day.title+' Day';document.getElementById('heroText').textContent=day.focus+'. '+day.exercises.length+' exercises planned for about '+day.duration+' minutes.';
  document.getElementById('sessions').textContent=state.sessions;document.getElementById('minutes').textContent=state.minutes;document.getElementById('setsLogged').textContent=state.sets;document.getElementById('streak').textContent=calculateStreak();
  const doneDays=Object.keys(PROGRAM).filter(d=>state.completed[dayKey(d)]).length,pct=Math.round(doneDays/5*100);
  document.getElementById('ringValue').textContent=pct+'%';document.getElementById('ring').style.background=`conic-gradient(var(--accent) ${pct*3.6}deg,#273548 ${pct*3.6}deg)`;
  renderResumeBanner();renderDays();renderWorkout();renderLibrary();renderProgress();renderSettings();paintTimer();
}
function calculateStreak(){if(!state.history.length)return 0;const dates=[...new Set(state.history.map(h=>h.date.slice(0,10)))].sort().reverse();let streak=0,cursor=new Date();cursor.setHours(0,0,0,0);for(const s of dates){const d=new Date(s+'T00:00:00'),diff=Math.round((cursor-d)/86400000);if(diff===0||diff===1){streak++;cursor=d}else break}return streak}
function renderResumeBanner(){
  let banner=document.getElementById('resumeBanner');
  if(!banner){banner=document.createElement('div');banner.id='resumeBanner';banner.className='resume-banner';const anchor=document.querySelector('#workoutView .metrics');anchor.insertAdjacentElement('afterend',banner)}
  const a=state.activeWorkout;
  if(!a){banner.style.display='none';return}
  const d=PROGRAM[a.day],ex=d.exercises[Math.min(a.exerciseIndex,d.exercises.length-1)];
  const completed=Object.values(a.setLogs||{}).filter(x=>x.completed).length,total=d.exercises.reduce((n,x)=>n+x.sets,0);
  banner.style.display='flex';banner.innerHTML=`<div><div class="eyebrow">WORKOUT IN PROGRESS</div><b>${a.day} · ${ex.name}</b><div class="meta">${completed} of ${total} sets logged · started ${new Date(a.startedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}</div></div><div class="resume-actions"><button class="primary" onclick="resumeWorkout()">Resume</button><button class="secondary" onclick="discardActiveWorkout()">Discard</button></div>`;
}
function renderDays(){const el=document.getElementById('days');el.innerHTML='';Object.entries(PROGRAM).forEach(([day,d])=>{const b=document.createElement('button');b.className='day'+(day===state.currentDay?' active':'');b.innerHTML=`<b>${day.slice(0,3)}</b><small>${state.completed[dayKey(day)]?'Completed':d.title}</small>`;b.onclick=()=>selectDay(day);el.appendChild(b)})}
function renderWorkout(){
  const d=PROGRAM[state.currentDay];document.getElementById('dayLabel').textContent=state.currentDay.toUpperCase();document.getElementById('dayTitle').textContent=d.title;document.getElementById('dayMeta').textContent=d.focus+' · '+d.duration+' min';
  document.getElementById('warmupList').innerHTML=d.warmup.map(x=>'<li>'+x+'</li>').join('');document.getElementById('cooldownList').innerHTML=d.cooldown.map(x=>'<li>'+x+'</li>').join('');
  const el=document.getElementById('exerciseList');el.innerHTML='';
  d.exercises.forEach((ex,i)=>{const done=!!state.exerciseDone[exKey(i)],w=suggestedWeight(ex),source=curated(ex),prog=state.progression[logKey(state.currentDay,ex.name)];const row=document.createElement('div');row.className='exercise'+(done?' done':'');row.innerHTML=`<div class="num">${i+1}</div><div><h4>${ex.name}</h4><div class="meta">${ex.sets} sets · ${ex.reps} · ${w===0?'Bodyweight':w+' kg'}</div>${prog?`<div class="next-chip">Next: ${prog.nextWeight===0?'Bodyweight':prog.nextWeight+' kg'} · ${prog.reason}</div>`:''}</div><div class="row-actions"><a class="mini video" target="_blank" rel="noopener" href="${source.url}">${source.coach}</a><button class="mini done-btn ${done?'on':''}" onclick="toggleExercise(${i})">${done?'Done':'Complete'}</button></div>`;el.appendChild(row)});
}
function toggleExercise(i){state.exerciseDone[exKey(i)]=!state.exerciseDone[exKey(i)];persist(true)}
function uniqueExercises(){const map={};Object.values(PROGRAM).forEach(d=>d.exercises.forEach(ex=>map[ex.name]=ex));return Object.values(map)}
function renderLibrary(){const q=(document.getElementById('librarySearch').value||'').toLowerCase(),el=document.getElementById('libraryGrid');el.innerHTML='';uniqueExercises().filter(ex=>ex.name.toLowerCase().includes(q)).forEach(ex=>{const source=curated(ex),c=document.createElement('div');c.className='card lib';c.innerHTML=`<div class="art">🏋️</div><h3>${ex.name}</h3><p class="meta">${ex.cue}</p><div class="chips"><span class="chip">${ex.sets} sets</span><span class="chip">${ex.rest} sec rest</span><span class="chip">${source.coach}</span></div><p class="meta"><b>Common mistakes:</b> ${ex.mistakes.join(', ')}</p><a class="mini video" target="_blank" rel="noopener" href="${source.url}">Open selected tutorial</a>`;el.appendChild(c)})}
function renderProgress(){
  const grid=document.getElementById('weekGrid');grid.innerHTML='';for(let w=1;w<=12;w++){const count=Object.keys(PROGRAM).filter(d=>state.completed[dayKey(d,w)]).length,c=document.createElement('div');c.className='weekcell'+(count===5?' complete':'')+(w===state.week?' current':'');c.innerHTML=`<b>W${w}</b><small>${count}/5</small>`;grid.appendChild(c)}
  const recommendations=Object.values(state.progression),up=recommendations.filter(x=>x.direction==='up').length,down=recommendations.filter(x=>x.direction==='down').length,pain=Object.values(state.ratings).filter(v=>v==='pain').length;
  const lastRecovery=state.recoveryHistory[0];
  document.getElementById('coachReview').innerHTML=`<p><b>Weight increases:</b> ${up} exercise(s).</p><p><b>Hold or reduce:</b> ${down} exercise(s).</p><p><b>Pain flags:</b> ${pain}. Use substitutions and stop if pain continues.</p>${lastRecovery?`<p><b>Latest recovery:</b> ${lastRecovery.recommendation} (${new Date(lastRecovery.date).toLocaleDateString()}).</p>`:''}`;
  const list=document.getElementById('historyList');list.innerHTML='';if(!state.history.length){list.innerHTML='<div class="empty">No completed workouts yet.</div>'}else state.history.forEach(h=>{const r=document.createElement('div');r.className='history-item';r.innerHTML=`<div><b>${h.day} · ${h.title}</b><div class="meta">Week ${h.week} · ${new Date(h.date).toLocaleDateString()}</div>${h.recovery?`<div class="history-detail">Recovery: ${h.recovery.recommendation}</div>`:''}</div><span class="chip">${h.duration} min</span>`;list.appendChild(r)})
}
function renderSettings(){const week=document.getElementById('weekSelect');if(!week.options.length){for(let i=1;i<=12;i++){const o=document.createElement('option');o.value=i;o.textContent='Week '+i;week.appendChild(o)}}week.value=state.week;document.getElementById('nameInput').value=state.name;const grid=document.getElementById('weightsGrid');grid.innerHTML='';[8,12,16,20,24,28,32,36,40].forEach(w=>{const b=document.createElement('button');b.className='weight-btn'+(state.weightsOwned.includes(w)?' selected':'');b.textContent=w+' kg';b.dataset.weight=w;b.onclick=()=>b.classList.toggle('selected');grid.appendChild(b)})}
function saveSettings(){state.week=Number(document.getElementById('weekSelect').value);state.name=document.getElementById('nameInput').value.trim()||'Inder';state.weightsOwned=[...document.querySelectorAll('#weightsGrid .weight-btn.selected')].map(b=>Number(b.dataset.weight)).sort((a,b)=>a-b);persist()}

function ensureInjectedUI(){
  if(!document.getElementById('recoveryModal')){
    const modal=document.createElement('div');modal.className='modal';modal.id='recoveryModal';modal.innerHTML=`<div class="card modal-card recovery-card"><div class="modal-head"><div><div class="eyebrow">READINESS CHECK</div><h2 style="margin:5px 0">How are you feeling?</h2></div><button class="secondary" onclick="closeRecovery()">Close</button></div><p class="meta">This check adjusts today’s suggested load and volume. It is not medical advice.</p><div class="recovery-grid">
      ${recoveryField('sleep','Sleep quality')}${recoveryField('energy','Energy')}${recoveryField('soreness','Muscle soreness',true)}${recoveryField('jointPain','Joint pain',true)}${recoveryField('stress','Stress',true)}
    </div><div id="recoveryResult" class="recovery-result">Complete all five ratings.</div><div class="actions"><button class="primary" onclick="confirmRecovery()">Use recommendation and start</button><button class="secondary" onclick="startWithoutAdjustment()">Start without adjustment</button></div></div>`;document.body.appendChild(modal);
  }
  injectStyles();
}
function recoveryField(id,label,inverse=false){return `<div class="field recovery-field"><label>${label}</label><div class="scale" data-id="${id}" data-inverse="${inverse}">${[1,2,3,4,5].map(n=>`<button type="button" data-value="${n}" onclick="chooseRecovery('${id}',${n},this)">${n}</button>`).join('')}</div><small>${inverse?'1 none · 5 severe':'1 poor · 5 excellent'}</small></div>`}
function injectStyles(){if(document.getElementById('v3Styles'))return;const s=document.createElement('style');s.id='v3Styles';s.textContent=`
.resume-banner{display:none;align-items:center;justify-content:space-between;gap:14px;margin-top:14px;padding:16px 18px;border-radius:18px;background:linear-gradient(135deg,#1c3042,#142231);border:1px solid #36506a}.resume-actions{display:flex;gap:8px;flex-wrap:wrap}.next-chip{display:inline-block;margin-top:6px;padding:5px 8px;border-radius:999px;background:#23391a;color:#d8ff9d;font-size:11px}.history-detail{color:var(--muted);font-size:12px;margin-top:4px}.recovery-card{max-width:720px}.recovery-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.recovery-field{padding:13px;border-radius:15px;background:var(--panel2);border:1px solid var(--line)}.recovery-field small{color:var(--muted)}.scale{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.scale button{border:1px solid var(--line);border-radius:10px;padding:9px 4px;background:#0f1924;color:var(--text);font-weight:850}.scale button.selected{background:var(--accent);color:#0c1403;border-color:var(--accent)}.recovery-result{margin-top:14px;padding:14px;border-radius:15px;background:#132536;border:1px solid #2d4c67}.set-card{padding:12px;border-radius:15px;background:var(--panel2);border:1px solid var(--line)}.set-card.done{border-color:#4a7130;background:#203019}.set-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.set-fields{display:grid;grid-template-columns:1.1fr .8fr .8fr .8fr;gap:8px;margin-top:9px}.set-fields input,.set-fields select,.set-note{width:100%;background:#0d151f;border:1px solid var(--line);border-radius:10px;color:var(--text);padding:9px}.set-note{margin-top:8px}.set-status{font-size:12px;color:var(--muted)}@media(max-width:640px){.resume-banner{align-items:flex-start;flex-direction:column}.recovery-grid{grid-template-columns:1fr}.set-fields{grid-template-columns:1fr 1fr}.set-fields .effort-field{grid-column:1/-1}}
`;document.head.appendChild(s)}
let recoveryDraft={};
function chooseRecovery(id,value,btn){recoveryDraft[id]=value;btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('selected'));btn.classList.add('selected');updateRecoveryResult()}
function calculateRecovery(){const r=recoveryDraft;if(['sleep','energy','soreness','jointPain','stress'].some(k=>!r[k]))return null;let strain=(6-r.sleep)+(6-r.energy)+r.soreness+r.jointPain+r.stress;let mode='normal',recommendation='Normal workout',weightFactor=1,setFactor=1;if(r.jointPain>=4){mode='recovery';recommendation='Recovery day recommended';weightFactor=.7;setFactor=.55}else if(strain>=18){mode='reduced';recommendation='Reduce weight and sets';weightFactor=.8;setFactor=.7}else if(strain>=13){mode='light';recommendation='Use a lighter session';weightFactor=.9;setFactor=.85}return {...r,strain,mode,recommendation,weightFactor,setFactor}}
function updateRecoveryResult(){const result=calculateRecovery(),el=document.getElementById('recoveryResult');if(!result){el.textContent='Complete all five ratings.';return}el.innerHTML=`<b>${result.recommendation}</b><br><span class="meta">Suggested load: ${Math.round(result.weightFactor*100)}% · sets: ${Math.round(result.setFactor*100)}%</span>`}
function beginRecoveryCheck(){recoveryDraft={};document.querySelectorAll('#recoveryModal .scale button').forEach(b=>b.classList.remove('selected'));document.getElementById('recoveryResult').textContent='Complete all five ratings.';document.getElementById('recoveryModal').classList.add('open')}
function closeRecovery(){document.getElementById('recoveryModal').classList.remove('open')}
function confirmRecovery(){const result=calculateRecovery();if(!result){toast('Complete the readiness check');return}closeRecovery();createActiveWorkout(result);openActiveWorkout()}
function startWithoutAdjustment(){const result={sleep:null,energy:null,soreness:null,jointPain:null,stress:null,strain:null,mode:'normal',recommendation:'No adjustment',weightFactor:1,setFactor:1};closeRecovery();createActiveWorkout(result);openActiveWorkout()}
function startGuidedWorkout(){if(state.activeWorkout){resumeWorkout();return}beginRecoveryCheck()}
function createActiveWorkout(recovery){const d=PROGRAM[state.currentDay];const setLogs={};d.exercises.forEach((ex,ei)=>{const setCount=Math.max(1,Math.round(ex.sets*recovery.setFactor));for(let si=0;si<setCount;si++){setLogs[`${ei}-${si}`]={weight:adjustWeight(ex,suggestedWeight(ex),recovery.weightFactor),left:defaultReps(ex.reps),right:needsSides(ex.reps)?defaultReps(ex.reps):'',effort:'7',note:'',completed:false}}});state.activeWorkout={day:state.currentDay,week:state.week,exerciseIndex:0,startedAt:new Date().toISOString(),recovery,setLogs};state.recoveryHistory.unshift({...recovery,date:new Date().toISOString(),day:state.currentDay,week:state.week});persist(true)}
function adjustWeight(ex,base,factor){if(base===0)return 0;return nearestAvailable(ex,base*factor)}
function defaultReps(text){const m=String(text).match(/\d+/);return m?m[0]:''}
function needsSides(text){return /each|side|arm|leg/i.test(text)}
function resumeWorkout(){if(!state.activeWorkout)return;state.currentDay=state.activeWorkout.day;activeExercise=state.activeWorkout.exerciseIndex||0;persist(true);openActiveWorkout()}
function discardActiveWorkout(){if(confirm('Discard the workout in progress?')){state.activeWorkout=null;persist()}}
function openActiveWorkout(){activeExercise=state.activeWorkout.exerciseIndex||0;renderGuided();document.getElementById('guidedModal').classList.add('open')}
function closeGuidedWorkout(){document.getElementById('guidedModal').classList.remove('open');persist(true)}
function renderGuided(){
  const a=state.activeWorkout;if(!a)return;const d=PROGRAM[a.day],ex=d.exercises[activeExercise],base=suggestedWeight(ex,a.day),rec=a.recovery||{weightFactor:1,setFactor:1},w=adjustWeight(ex,base,rec.weightFactor),source=curated(ex);
  a.exerciseIndex=activeExercise;localStorage.setItem('kb-coach-v2',JSON.stringify(state));
  document.getElementById('modalDay').textContent=`${a.day.toUpperCase()} · EXERCISE ${activeExercise+1} OF ${d.exercises.length}`;document.getElementById('modalTitle').textContent=ex.name;document.getElementById('coachCue').innerHTML=`<b>Coach cue:</b> ${ex.cue}<br><span class="meta">Today: ${w===0?'Bodyweight':w+' kg'} · ${rec.recommendation} · rest ${ex.rest} sec</span>`;document.getElementById('mistakes').innerHTML=ex.mistakes.map(x=>'<li>'+x+'</li>').join('');document.getElementById('substitutions').innerHTML=ex.subs.map(x=>'<li>'+x+'</li>').join('');document.getElementById('videoLink').href=source.url;document.getElementById('videoLink').textContent='Selected tutorial · '+source.coach;
  const steps=document.getElementById('steps');steps.innerHTML='';d.exercises.forEach((_,i)=>{const b=document.createElement('button');b.className='step'+(i===activeExercise?' active':'');b.textContent=i+1;b.onclick=()=>{activeExercise=i;renderGuided()};steps.appendChild(b)});
  const sets=document.getElementById('setList');sets.innerHTML='';const keys=Object.keys(a.setLogs).filter(k=>Number(k.split('-')[0])===activeExercise).sort((x,y)=>Number(x.split('-')[1])-Number(y.split('-')[1]));
  keys.forEach((key,index)=>{const log=a.setLogs[key],available=availableWeights(ex),card=document.createElement('div');card.className='set-card'+(log.completed?' done':'');card.innerHTML=`<div class="set-head"><b>Set ${index+1}</b><span class="set-status">${log.completed?'Completed':'Not completed'}</span></div><div class="set-fields"><select onchange="saveSetField('${key}','weight',this.value)">${available.map(v=>`<option value="${v}" ${Number(log.weight)===v?'selected':''}>${v===0?'Bodyweight':v+' kg'}</option>`).join('')}</select><input type="number" inputmode="numeric" min="0" value="${log.left}" placeholder="${needsSides(ex.reps)?'Left reps':'Reps'}" oninput="saveSetField('${key}','left',this.value)"><input type="number" inputmode="numeric" min="0" value="${log.right}" placeholder="${needsSides(ex.reps)?'Right reps':'—'}" ${needsSides(ex.reps)?'':'disabled'} oninput="saveSetField('${key}','right',this.value)"><select class="effort-field" onchange="saveSetField('${key}','effort',this.value)">${[5,6,7,8,9,10].map(v=>`<option ${String(log.effort)===String(v)?'selected':''}>${v}</option>`).join('')}</select></div><input class="set-note" value="${escapeHtml(log.note||'')}" placeholder="Optional set note" oninput="saveSetField('${key}','note',this.value)"><button class="mini done-btn ${log.completed?'on':''}" style="margin-top:8px" onclick="toggleSetComplete('${key}',this)">${log.completed?'Done':'Complete set'}</button>`;sets.appendChild(card)});
  document.getElementById('modalProgress').textContent=`${activeExercise+1} of ${d.exercises.length} exercises`;document.getElementById('modalFill').style.width=((activeExercise+1)/d.exercises.length*100)+'%';setTimer(ex.rest)
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function saveSetField(key,field,value){if(!state.activeWorkout||!state.activeWorkout.setLogs[key])return;state.activeWorkout.setLogs[key][field]=field==='weight'?Number(value):value;localStorage.setItem('kb-coach-v2',JSON.stringify(state))}
function toggleSetComplete(key,btn){const log=state.activeWorkout.setLogs[key];log.completed=!log.completed;if(log.completed)state.sets++;else state.sets=Math.max(0,state.sets-1);localStorage.setItem('kb-coach-v2',JSON.stringify(state));renderGuided();render();if(log.completed){if(navigator.vibrate)navigator.vibrate(80);const ex=PROGRAM[state.activeWorkout.day].exercises[activeExercise];setTimer(ex.rest);if(!timerRunning)toggleTimer()}}
function rateExercise(rating){if(!state.activeWorkout)return;const day=state.activeWorkout.day,ex=PROGRAM[day].exercises[activeExercise],key=logKey(day,ex.name),logs=getExerciseSetLogs(activeExercise);const used=logs.map(x=>Number(x.weight)).filter(Number.isFinite),weight=used.length?Math.max(...used):suggestedWeight(ex,day);state.logs[key]={weight,rating,date:new Date().toISOString(),sets:logs};state.ratings[key]=rating;calculateProgression(day,ex,logs,rating);persist(true);toast(progressionToast(state.progression[key]))}
function getExerciseSetLogs(exerciseIndex){const a=state.activeWorkout||{setLogs:{}};return Object.entries(a.setLogs).filter(([k])=>Number(k.split('-')[0])===exerciseIndex).map(([,v])=>v)}
function calculateProgression(day,ex,logs,rating){const key=logKey(day,ex.name);if(ex.weights[0]===0){state.progression[key]={nextWeight:0,direction:'hold',reason:'bodyweight movement',date:new Date().toISOString()};return}const complete=logs.filter(x=>x.completed),efforts=complete.map(x=>Number(x.effort)).filter(Number.isFinite),avg=efforts.length?efforts.reduce((a,b)=>a+b,0)/efforts.length:8,weights=complete.map(x=>Number(x.weight)).filter(Number.isFinite),current=weights.length?Math.max(...weights):suggestedWeight(ex,day),available=availableWeights(ex),idx=available.indexOf(nearestAvailable(ex,current));let next=current,direction='hold',reason='repeat with clean form';if(rating==='pain'){next=available[Math.max(0,idx-1)];direction='down';reason='pain flag: reduce or substitute'}else if(rating==='hard'||avg>=9){next=available[Math.max(0,idx-1)];direction='down';reason='high effort'}else if(rating==='easy'||(complete.length===logs.length&&avg<=7)){next=available[Math.min(available.length-1,idx+1)];direction=next>current?'up':'hold';reason=next>current?'all sets completed at manageable effort':'top available weight'}state.progression[key]={nextWeight:next,direction,reason,averageEffort:Number(avg.toFixed(1)),date:new Date().toISOString()}}
function progressionToast(p){if(!p)return'Performance saved';if(p.direction==='up')return`Next time: ${p.nextWeight} kg`;if(p.direction==='down')return`Next time: ${p.nextWeight} kg or substitute`;return'Weight held for next session'}
function nextExercise(){const a=state.activeWorkout;if(!a)return;const d=PROGRAM[a.day];state.exerciseDone[exKey(activeExercise,a.day,a.week)]=true;const ex=d.exercises[activeExercise];if(!state.progression[logKey(a.day,ex.name)])rateExercise('good');if(activeExercise<d.exercises.length-1){activeExercise++;a.exerciseIndex=activeExercise;persist(true);renderGuided()}else completeWorkout()}
function previousExercise(){if(activeExercise>0){activeExercise--;state.activeWorkout.exerciseIndex=activeExercise;localStorage.setItem('kb-coach-v2',JSON.stringify(state));renderGuided()}}
function completeWorkout(){const a=state.activeWorkout;if(!a)return;const key=dayKey(a.day,a.week),d=PROGRAM[a.day];if(!state.completed[key]){state.completed[key]=true;state.sessions++;state.minutes+=d.duration;state.history.unshift({date:new Date().toISOString(),day:a.day,title:d.title,week:a.week,duration:d.duration,recovery:a.recovery,setLogs:a.setLogs})}state.activeWorkout=null;persist();document.getElementById('guidedModal').classList.remove('open');toast('Workout completed')}
function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='kettlebell-coach-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function importData(file){const r=new FileReader();r.onload=()=>{try{state=Object.assign({},DEFAULT,JSON.parse(r.result));persist();toast('Backup imported')}catch{toast('Invalid backup file')}};r.readAsText(file)}
function resetData(){if(confirm('Reset all workout data?')){state=JSON.parse(JSON.stringify(DEFAULT));persist()}}
function setTimer(s){seconds=s;paintTimer()}
function paintTimer(){document.getElementById('timer').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')}
function toggleTimer(){if(timerRunning){clearInterval(timerHandle);timerRunning=false;document.getElementById('timerBtn').textContent='Start';return}timerRunning=true;document.getElementById('timerBtn').textContent='Pause';timerHandle=setInterval(()=>{seconds--;paintTimer();if(seconds<=0){clearInterval(timerHandle);timerRunning=false;document.getElementById('timerBtn').textContent='Start';if(navigator.vibrate)navigator.vibrate([150,80,150]);toast('Rest complete')}},1000)}
function resetTimer(){clearInterval(timerHandle);timerRunning=false;seconds=90;document.getElementById('timerBtn').textContent='Start';paintTimer()}

ensureInjectedUI();
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});
document.getElementById('installBtn').onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null}else toast('Use Share, then Add to Home Screen')};
document.getElementById('librarySearch').addEventListener('input',renderLibrary);
document.getElementById('importFile').addEventListener('change',e=>{if(e.target.files[0])importData(e.target.files[0])});
if('serviceWorker'in navigator&&location.protocol==='https:')navigator.serviceWorker.register('sw.js').catch(()=>{});
render();
// Техники (кроме №12 "Успокоить ребёнка")
const PRESETS = {
  bhastrika: { name: "Бхастрика",              cycles: 30, phases: [
    {name:"Вдох", dur:1, action:"inhale"},
    {name:"Выдох", dur:1, action:"exhale"},
  ]},
  "478":     { name: "4-7-8",                   cycles: 4, phases: [
    {name:"Вдох", dur:4, action:"inhale"},
    {name:"Задержка", dur:7, action:"hold"},
    {name:"Выдох", dur:8, action:"exhale"},
  ]},
  box:       { name: "Квадратное 4-4-4-4",      cycles: 6, phases: [
    {name:"Вдох", dur:4, action:"inhale"},
    {name:"Задержка", dur:4, action:"hold"},
    {name:"Выдох", dur:4, action:"exhale"},
    {name:"Задержка", dur:4, action:"hold"},
  ]},
  nadi:      { name: "Нади Шодхана",            cycles: 5, phases: [
    {name:"Вдох (левая)", dur:4, action:"inhale"},
    {name:"Задержка", dur:4, action:"hold"},
    {name:"Выдох (правая)", dur:4, action:"exhale"},
    {name:"Вдох (правая)", dur:4, action:"inhale"},
    {name:"Задержка", dur:4, action:"hold"},
    {name:"Выдох (левая)", dur:4, action:"exhale"},
  ]},
  longExhale:{ name: "Удлинённый выдох 4-6",    cycles: 10, phases: [
    {name:"Вдох", dur:4, action:"inhale"},
    {name:"Выдох", dur:6, action:"exhale"},
  ]},
  diaphr:    { name: "Диафрагмальное 6-6",      cycles: 10, phases: [
    {name:"Вдох", dur:6, action:"inhale"},
    {name:"Выдох", dur:6, action:"exhale"},
  ]},
  kapalabhati:{name:"Капалабхати",              cycles: 30, phases: [
    {name:"Выдох (активный)", dur:0.5, action:"exhale"},
    {name:"Вдох (пассивный)", dur:0.5, action:"inhale"},
  ]},
  pant:      { name: "«Собачье» дыхание",       cycles: 15, phases: [
    {name:"Вдох (короткий)", dur:0.5, action:"inhale"},
    {name:"Выдох (короткий)", dur:0.5, action:"exhale"},
  ]},
  "555":     { name: "Метод 5-5-5",             cycles: 6, phases: [
    {name:"Вдох", dur:5, action:"inhale"},
    {name:"Выдох", dur:5, action:"exhale"},
  ]},
  pain:      { name: "«Больничное» 4-10",       cycles: 6, phases: [
    {name:"Вдох", dur:4, action:"inhale"},
    {name:"Выдох (длинный)", dur:10, action:"exhale"},
  ]},
  nap:       { name: "«Сонный вдох» 4-4-7",     cycles: 6, phases: [
    {name:"Вдох", dur:4, action:"inhale"},
    {name:"Задержка", dur:4, action:"hold"},
    {name:"Выдох", dur:7, action:"exhale"},
  ]},
};

const el = {
  technique: document.getElementById('technique'),
  theme: document.getElementById('theme'),
  customBlock: document.getElementById('custom-block'),
  c_in: document.getElementById('c_in'),
  c_hold1: document.getElementById('c_hold1'),
  c_out: document.getElementById('c_out'),
  c_hold2: document.getElementById('c_hold2'),
  cycles: document.getElementById('cycles'),
  sound: document.getElementById('sound'),
  vibrate: document.getElementById('vibrate'),
  start: document.getElementById('start'),
  pause: document.getElementById('pause'),
  reset: document.getElementById('reset'),
  circle: document.getElementById('circle'),
  phaseName: document.getElementById('phaseName'),
  phaseTimer: document.getElementById('phaseTimer'),
  tip: document.getElementById('tip')
};

let ctx;
let runState = { running:false, paused:false, cycle:0, phaseIdx:0, remainMs:0, timer:null };

function getPhases() {
  if (el.technique.value !== 'custom') {
    const p = PRESETS[el.technique.value];
    return p ? p.phases : PRESETS["478"].phases;
  }
  // custom
  const i = parseFloat(el.c_in.value||0);
  const h1 = parseFloat(el.c_hold1.value||0);
  const o  = parseFloat(el.c_out.value||0);
  const h2 = parseFloat(el.c_hold2.value||0);
  const arr = [];
  if (i>0)  arr.push({name:"Вдох", dur:i, action:"inhale"});
  if (h1>0) arr.push({name:"Задержка", dur:h1, action:"hold"});
  if (o>0)  arr.push({name:"Выдох", dur:o, action:"exhale"});
  if (h2>0) arr.push({name:"Задержка", dur:h2, action:"hold"});
  return arr.length?arr:[{name:"Вдох",dur:4,action:"inhale"},{name:"Выдох",dur:6,action:"exhale"}];
}

function getCycles() {
  if (el.technique.value !== 'custom') {
    const p = PRESETS[el.technique.value];
    return p ? p.cycles : 6;
  }
  return Math.min(60, Math.max(1, parseInt(el.cycles.value||1)));
}

function setCircle(action, dur) {
  // inhale -> к 1.25, exhale -> к 0.75, hold -> freeze
  if (action === 'hold') {
    el.circle.classList.add('hold');
    return;
  }
  el.circle.classList.remove('hold');
  el.circle.style.setProperty('--dur', `${dur}s`);
  const target = (action === 'inhale') ? 1.25 : 0.75;
  el.circle.style.transform = `scale(${target})`;
}

function beep() {
  if (!el.sound.checked) return;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 660;
    gain.gain.value = 0.04;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(()=>{ osc.stop(); osc.disconnect(); }, 120);
  } catch(e) {}
}

function vibrate(ms=60){ if (el.vibrate.checked && navigator.vibrate) navigator.vibrate(ms); }

function tipByAction(action){
  if (action==='inhale') return 'Вдох через нос. Живот мягко поднимается.';
  if (action==='exhale') return 'Длинный, мягкий выдох. Плечи не поднимать.';
  return 'Задержка. Расслабь челюсть и плечи.';
}

function nextPhase() {
  const phases = getPhases();
  const cycles = getCycles();
  if (runState.cycle >= cycles) { stop(); return; }

  const phase = phases[runState.phaseIdx];
  runState.remainMs = Math.round(phase.dur * 1000); // целые секунды на экране

  el.phaseName.textContent = `${phase.name} (цикл ${runState.cycle+1}/${cycles})`;
  el.tip.textContent = tipByAction(phase.action);
  setCircle(phase.action, phase.dur);
  beep(); vibrate();

  const tick = () => {
    if (!runState.running || runState.paused) return;
    runState.remainMs -= 100;                      // шаг 0.1с
    const sec = Math.max(0, Math.ceil(runState.remainMs / 1000));
    el.phaseTimer.textContent = sec + 'с';

    if (runState.remainMs <= 0) {
      clearInterval(runState.timer);
      runState.phaseIdx++;
      if (runState.phaseIdx >= phases.length) {
        runState.phaseIdx = 0;
        runState.cycle++;
      }
      nextPhase();
    }
  };
  clearInterval(runState.timer);
  runState.timer = setInterval(tick, 100);
}

function start() {
  if (runState.running && runState.paused) {
    runState.paused = false; nextPhase(); return;
  }
  runState = { running:true, paused:false, cycle:0, phaseIdx:0, remainMs:0, timer:null };
  el.start.disabled = true; el.pause.disabled = false; el.reset.disabled = false;
  nextPhase();
}

function pause() {
  if (!runState.running) return;
  runState.paused = true;
  clearInterval(runState.timer);
  el.phaseName.textContent += ' — пауза';
}

function stop() {
  runState.running = false; runState.paused = false;
  clearInterval(runState.timer);
  el.start.disabled = false; el.pause.disabled = true; el.reset.disabled = true;
  el.phaseName.textContent = 'Готов?';
  el.phaseTimer.textContent = '–';
  el.circle.classList.remove('hold');
  el.circle.style.transform = 'scale(1)';  // базовый вид
}

/* ----- Theme handling ----- */
el.technique.addEventListener('change', ()=>{
  el.customBlock.classList.toggle('hidden', el.technique.value!=='custom');
});

el.theme.addEventListener('change', ()=>{
  document.body.setAttribute('data-theme', el.theme.value);
  try { localStorage.setItem('breath_theme', el.theme.value); } catch(e){}
});

window.addEventListener('DOMContentLoaded', ()=>{
  const saved = localStorage.getItem('breath_theme');
  if (saved) {
    document.body.setAttribute('data-theme', saved);
    el.theme.value = saved;
  }
});

el.start.addEventListener('click', start);
el.pause.addEventListener('click', pause);
el.reset.addEventListener('click', stop);

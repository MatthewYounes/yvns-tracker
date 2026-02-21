let currentSession = [];
let currentMacros = [];
let ssMode = false;
let barWeight = 45;
let plateStack = []; 
let currentHistoryView = 'lifts';

const LIBRARY = {
    "Barbell": ["Bench Press", "Squat", "Deadlift", "Overhead Press", "Bent Over Row", "Incline Bench", "Front Squat", "Hip Thrust"],
    "Dumbbell": ["DB Press", "Incline DB Press", "DB Shoulder Press", "Lateral Raises", "DB Rows", "Hammer Curls", "Bicep Curls", "Goblet Squat"],
    "Machine": ["Leg Press", "Leg Extension", "Hamstring Curl", "Chest Press", "Shoulder Press", "Lat Pulldown", "Seated Row", "Pec Deck"],
    "Cable": ["Tricep Pushdown", "Cable Fly", "Face Pull", "Cable Row", "Lat Pulldown", "Cable Curl", "Lateral Raise", "Crunch"],
    "Smith Machine": ["Smith Squat", "Smith Incline", "Smith Bench", "Smith Shoulder Press", "Smith Shrug"],
    "Bodyweight": ["Pull Ups", "Push Ups", "Dips", "Chin Ups", "Air Squats", "Burpees"],
    "Abs": ["Hanging Leg Raise", "Plank", "Crunch", "Russian Twist", "Ab Wheel", "V-Ups"],
    "Cardio": ["Treadmill", "Stairmaster", "Elliptical", "Bike", "Rowing Machine"]
};

document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateClock, 1000);
    updateClock(); 
    document.getElementById('current-date').innerText = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' });
    
    loadDraft();
    
    const savedSession = JSON.parse(localStorage.getItem('yvns_active_session'));
    if(savedSession) { currentSession = savedSession; renderSession(); }

    const savedMacros = JSON.parse(localStorage.getItem('yvns_active_macros'));
    if(savedMacros) { currentMacros = savedMacros; renderMacros(); }
    
    updateUI(); 
    renderCalculator(); 
    renderHistory();
});

function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function switchTab(tab) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active-tab'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active-tab');
    
    const tabs = ['tracker', 'nutrition', 'calculator', 'history'];
    const index = tabs.indexOf(tab);
    document.querySelectorAll('.tab-btn')[index].classList.add('active');
}

// --- TRACKER LOGIC ---
function updateUI() {
    const equip = document.getElementById('equipment').value;
    const list = document.getElementById('exercise-list');
    
    const lblW = document.getElementById('lbl-weight');
    const inpW = document.getElementById('input-1');
    const lblR = document.getElementById('lbl-reps');
    
    if (equip === 'Dumbbell') { lblW.innerText = "Weight (Per Hand)"; inpW.placeholder = "lbs"; lblR.innerText = "Reps"; }
    else if (equip === 'Cardio') { lblW.innerText = "Duration"; inpW.placeholder = "Minutes"; lblR.innerText = "Distance / Cals"; }
    else if (equip === 'Bodyweight') { lblW.innerText = "Added Weight"; inpW.placeholder = "0 if none"; lblR.innerText = "Reps"; }
    else if (equip === 'Abs') { lblW.innerText = "Reps or Time"; inpW.placeholder = "e.g. 20 or 45s"; lblR.innerText = "Sets / Rounds"; }
    else { lblW.innerText = "Weight (lbs)"; inpW.placeholder = "0"; lblR.innerText = "Reps"; }

    list.innerHTML = "";
    if (LIBRARY[equip]) {
        LIBRARY[equip].forEach(ex => {
            const option = document.createElement('option');
            option.value = ex;
            list.appendChild(option);
        });
    }
}

function autoSaveDraft() {
    localStorage.setItem('draft_ex', document.getElementById('exercise').value);
    localStorage.setItem('draft_w', document.getElementById('input-1').value);
    localStorage.setItem('draft_r', document.getElementById('input-2').value);
}

function loadDraft() {
    if(localStorage.getItem('draft_ex')) document.getElementById('exercise').value = localStorage.getItem('draft_ex');
    if(localStorage.getItem('draft_w')) document.getElementById('input-1').value = localStorage.getItem('draft_w');
    if(localStorage.getItem('draft_r')) document.getElementById('input-2').value = localStorage.getItem('draft_r');
}

function toggleSS() {
    ssMode = !ssMode;
    const container = document.getElementById('ss-container');
    const btn = document.getElementById('ss-toggle-btn');
    if (ssMode) {
        container.classList.remove('ss-hidden');
        btn.classList.add('ss-active-btn');
        btn.innerText = "REMOVE SS";
    } else {
        container.classList.add('ss-hidden');
        btn.classList.remove('ss-active-btn');
        btn.innerText = "+ SS MODE";
    }
}

function addToSession() {
    const equip = document.getElementById('equipment').value;
    const ex1 = document.getElementById('exercise').value;
    const w1 = document.getElementById('input-1').value;
    const r1 = document.getElementById('input-2').value;

    if (!ex1 || !w1) return alert("Enter workout data.");

    let entry = { id: Date.now(), type: ssMode ? 'Superset' : 'Standard', equip: equip, sets: [] };
    entry.sets.push({ name: ex1, weight: w1, reps: r1 });

    if (ssMode) {
        const ex2 = document.getElementById('exercise-ss').value;
        const w2 = document.getElementById('input-1-ss').value;
        const r2 = document.getElementById('input-2-ss').value;
        if (!ex2 || !w2) return alert("Complete SS data.");
        entry.sets.push({ name: ex2, weight: w2, reps: r2 });
    }

    currentSession.push(entry);
    localStorage.setItem('yvns_active_session', JSON.stringify(currentSession));
    renderSession();
}

function deleteEntry(index) {
    if(confirm("Remove this entry?")) {
        currentSession.splice(index, 1);
        localStorage.setItem('yvns_active_session', JSON.stringify(currentSession));
        renderSession();
    }
}

function renderSession() {
    const list = document.getElementById('session-list');
    const badge = document.getElementById('set-count');
    list.innerHTML = "";
    badge.innerText = currentSession.length;

    if (currentSession.length === 0) { list.innerHTML = `<li class="empty-state">Start lifting...</li>`; return; }

    currentSession.slice().reverse().forEach((entry, reverseIdx) => {
        let realIdx = currentSession.length - 1 - reverseIdx;
        const li = document.createElement('li');
        let htmlContent = `<div class="li-content">`;
        entry.sets.forEach((s, idx) => {
            if (idx > 0) htmlContent += `<div style="height:1px; background:#333; margin:5px 0;"></div>`;
            let prefix = (entry.type === 'Superset' && idx === 0) ? `<span class="ss-tag">SS</span>` : '';
            if (entry.type === 'Superset' && idx === 1) prefix = `<span class="ss-tag" style="background:#555;">+</span>`;
            htmlContent += `<div class="set-main">${prefix} ${s.name}</div><div class="set-sub">${s.weight} lbs x ${s.reps} reps</div>`;
        });
        htmlContent += `</div>`;
        htmlContent += `<button class="del-btn" onclick="deleteEntry(${realIdx})"><i class="fas fa-times"></i></button>`;
        li.innerHTML = htmlContent;
        list.appendChild(li);
    });
}

function finishWorkout() {
    if (currentSession.length === 0) return alert("Empty.");
    const history = JSON.parse(localStorage.getItem('yvns_tracker_v2')) || [];
    history.push({ date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(), data: currentSession });
    
    localStorage.setItem('yvns_tracker_v2', JSON.stringify(history));
    currentSession = [];
    localStorage.removeItem('yvns_active_session');
    
    renderSession();
    if(currentHistoryView === 'lifts') renderHistory();
    alert("SAVED TO HISTORY.");
}

// --- NUTRITION (FUEL) LOGIC ---
function logMacro() {
    const item = document.getElementById('macro-item').value || 'Meal / Snack';
    const cals = parseInt(document.getElementById('macro-cals').value) || 0;
    const pro = parseInt(document.getElementById('macro-pro').value) || 0;
    const crb = parseInt(document.getElementById('macro-crb').value) || 0;
    const fat = parseInt(document.getElementById('macro-fat').value) || 0;

    if (cals === 0 && pro === 0 && crb === 0 && fat === 0) return alert("Enter macro values.");

    currentMacros.push({ id: Date.now(), item, cals, pro, crb, fat });
    localStorage.setItem('yvns_active_macros', JSON.stringify(currentMacros));
    
    document.getElementById('macro-item').value = '';
    document.getElementById('macro-cals').value = '';
    document.getElementById('macro-pro').value = '';
    document.getElementById('macro-crb').value = '';
    document.getElementById('macro-fat').value = '';
    
    renderMacros();
}

function deleteMacro(index) {
    if(confirm("Remove this entry?")) {
        currentMacros.splice(index, 1);
        localStorage.setItem('yvns_active_macros', JSON.stringify(currentMacros));
        renderMacros();
    }
}

function renderMacros() {
    const list = document.getElementById('macro-list');
    let tCals = 0, tPro = 0, tCrb = 0, tFat = 0;
    list.innerHTML = "";

    if (currentMacros.length === 0) { list.innerHTML = `<li class="empty-state">No fuel logged yet...</li>`; } 
    else {
        currentMacros.slice().reverse().forEach((m, reverseIdx) => {
            let realIdx = currentMacros.length - 1 - reverseIdx;
            tCals += m.cals; tPro += m.pro; tCrb += m.crb; tFat += m.fat;
            
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="li-content">
                    <div class="set-main">${m.item}</div>
                    <div class="set-sub" style="color:#aaa;">${m.cals} Cal | ${m.pro}P / ${m.crb}C / ${m.fat}F</div>
                </div>
                <button class="del-btn" onclick="deleteMacro(${realIdx})"><i class="fas fa-times"></i></button>
            `;
            list.appendChild(li);
        });
    }

    document.getElementById('tot-cals').innerText = tCals;
    document.getElementById('tot-pro').innerText = tPro + "g";
    document.getElementById('tot-crb').innerText = tCrb + "g";
    document.getElementById('tot-fat').innerText = tFat + "g";
}

function finishNutritionDay() {
    if (currentMacros.length === 0) return alert("Empty.");
    const history = JSON.parse(localStorage.getItem('yvns_macro_history')) || [];
    
    let tCals = 0, tPro = 0, tCrb = 0, tFat = 0;
    currentMacros.forEach(m => { tCals += m.cals; tPro += m.pro; tCrb += m.crb; tFat += m.fat; });
    
    history.push({ 
        date: new Date().toLocaleDateString(), 
        totals: { cals: tCals, pro: tPro, crb: tCrb, fat: tFat },
        data: currentMacros 
    });
    
    localStorage.setItem('yvns_macro_history', JSON.stringify(history));
    currentMacros = [];
    localStorage.removeItem('yvns_active_macros');
    
    renderMacros();
    if(currentHistoryView === 'fuel') renderHistory();
    alert("DAY COMPLETED & SAVED.");
}

// --- CALCULATOR ---
function setBarWeight(w) {
    barWeight = w;
    document.getElementById('btn-bar-45').classList.toggle('active-bar', w === 45);
    document.getElementById('btn-bar-25').classList.toggle('active-bar', w === 25);
    renderCalculator();
}
function addPlate(weight) { plateStack.push(weight); plateStack.sort((a,b) => b - a); renderCalculator(); }
function resetBar() { plateStack = []; renderCalculator(); }
function calculateLoadout() {
    let target = parseFloat(document.getElementById('target-weight').value);
    if (!target || target < barWeight) return alert("Invalid weight.");
    let remainder = (target - barWeight) / 2;
    let newStack = [];
    [45, 35, 25, 10, 5, 2.5].forEach(p => {
        while (remainder >= p) { newStack.push(p); remainder -= p; }
    });
    plateStack = newStack;
    renderCalculator();
}
function renderCalculator() {
    let total = barWeight + (plateStack.reduce((a,b)=>a+b,0)*2);
    document.getElementById('calc-total').innerText = total;
    
    const left = document.getElementById('bar-plates-left'); left.innerHTML = "";
    [...plateStack].reverse().forEach(p => { left.innerHTML += `<div class="v-plate vp-${Math.floor(p)==2?'2':p}"></div>`; });
    
    const right = document.getElementById('bar-plates-right'); right.innerHTML = "";
    plateStack.forEach(p => { right.innerHTML += `<div class="v-plate vp-${Math.floor(p)==2?'2':p}"></div>`; });
}

// --- HISTORY & EXPORT ---
function switchHistory(view) {
    currentHistoryView = view;
    document.getElementById('btn-hist-lifts').classList.toggle('active-bar', view === 'lifts');
    document.getElementById('btn-hist-fuel').classList.toggle('active-bar', view === 'fuel');
    renderHistory();
}

function renderHistory() {
    const feed = document.getElementById('history-feed');
    feed.innerHTML = "";

    if (currentHistoryView === 'lifts') {
        const history = JSON.parse(localStorage.getItem('yvns_tracker_v2')) || [];
        if(history.length === 0) { feed.innerHTML = "<div class='empty-state'>No saved workouts found.</div>"; return; }
        
        history.slice().reverse().forEach((log, index) => {
            let html = `<div class="history-card"><div class="h-header"><span>${log.date}</span><span class="h-del" onclick="delHistLifts(${history.length-1-index})"><i class="fas fa-trash"></i></span></div><div class="h-body">`;
            log.data.forEach(e => {
                html += `<div class="h-row">${e.sets[0].name} (${e.sets[0].weight}x${e.sets[0].reps})`;
                if(e.type==='Superset') html += ` + ${e.sets[1].name} (${e.sets[1].weight}x${e.sets[1].reps})`;
                html += `</div>`;
            });
            html += `</div></div>`;
            feed.innerHTML += html;
        });
    } else {
        const history = JSON.parse(localStorage.getItem('yvns_macro_history')) || [];
        if(history.length === 0) { feed.innerHTML = "<div class='empty-state'>No saved nutrition logs.</div>"; return; }
        
        history.slice().reverse().forEach((log, index) => {
            let html = `<div class="history-card"><div class="h-header"><span>${log.date}</span><span class="h-del" onclick="delHistFuel(${history.length-1-index})"><i class="fas fa-trash"></i></span></div><div class="h-body">`;
            html += `<div class="h-row" style="color:var(--c-blue); font-weight:bold; margin-bottom:8px;">TOTALS: ${log.totals.cals} Cal | ${log.totals.pro}P / ${log.totals.crb}C / ${log.totals.fat}F</div>`;
            log.data.forEach(e => {
                html += `<div class="h-row">- ${e.item}: ${e.cals}c | ${e.pro}p ${e.crb}c ${e.fat}f</div>`;
            });
            html += `</div></div>`;
            feed.innerHTML += html;
        });
    }
}

function delHistLifts(idx) {
    if(confirm("Delete this workout?")) {
        let h = JSON.parse(localStorage.getItem('yvns_tracker_v2'));
        h.splice(idx, 1);
        localStorage.setItem('yvns_tracker_v2', JSON.stringify(h));
        renderHistory();
    }
}

function delHistFuel(idx) {
    if(confirm("Delete this day's macros?")) {
        let h = JSON.parse(localStorage.getItem('yvns_macro_history'));
        h.splice(idx, 1);
        localStorage.setItem('yvns_macro_history', JSON.stringify(h));
        renderHistory();
    }
}

function copyForSheets() {
    const history = JSON.parse(localStorage.getItem('yvns_tracker_v2'));
    if(!history) return alert("No Lift History");
    let tsv = "Date\tCategory\tWorkout\tWeight\tReps\n";
    history.forEach(log => {
        log.data.forEach(e => {
            if(e.type === 'Superset') {
                tsv += `${log.date}\t${e.equip}\t[SS] ${e.sets[0].name} ss ${e.sets[1].name}\t${e.sets[0].weight} / ${e.sets[1].weight}\t${e.sets[0].reps} / ${e.sets[1].reps}\n`;
            } else {
                tsv += `${log.date}\t${e.equip}\t${e.sets[0].name}\t${e.sets[0].weight}\t${e.sets[0].reps}\n`;
            }
        });
    });
    navigator.clipboard.writeText(tsv).then(() => alert("Copied! Paste into Sheets/Excel."));
}

function copyMacrosForSheets() {
    const history = JSON.parse(localStorage.getItem('yvns_macro_history'));
    if(!history) return alert("No Fuel History");
    let tsv = "Date\tItem\tCalories\tProtein(g)\tCarbs(g)\tFats(g)\n";
    history.forEach(log => {
        log.data.forEach(m => {
            tsv += `${log.date}\t${m.item}\t${m.cals}\t${m.pro}\t${m.crb}\t${m.fat}\n`;
        });
        tsv += `${log.date}\tDAY TOTAL\t${log.totals.cals}\t${log.totals.pro}\t${log.totals.crb}\t${log.totals.fat}\n`;
    });
    navigator.clipboard.writeText(tsv).then(() => alert("Copied Macros! Paste into Sheets/Excel."));
}

function exportCSV() {
    const history = JSON.parse(localStorage.getItem('yvns_tracker_v2'));
    if(!history) return alert("No History");
    let csv = "data:text/csv;charset=utf-8,Date,Category,Workout,Weight,Reps\n";
    history.forEach(log => {
        log.data.forEach(e => {
            let row = e.type === 'Superset' 
                ? `${log.date},${e.equip},[SS] ${e.sets[0].name} ss ${e.sets[1].name},${e.sets[0].weight} / ${e.sets[1].weight},${e.sets[0].reps} / ${e.sets[1].reps}` 
                : `${log.date},${e.equip},${e.sets[0].name},${e.sets[0].weight},${e.sets[0].reps}`;
            csv += row + "\n";
        });
    });
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = "yvns_logs.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function wipeAllData() { if(confirm("Wipe ALL Lifts and Macros?")) { localStorage.removeItem('yvns_tracker_v2'); localStorage.removeItem('yvns_macro_history'); location.reload(); } }
function showExportPage() { document.getElementById('main-page').style.display = 'none'; document.getElementById('export-page').style.display = 'flex'; }
function showMainPage() { document.getElementById('export-page').style.display = 'none'; document.getElementById('main-page').style.display = 'flex'; }

// --- MODAL UTILITIES ---
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// --- REST TIMER ---
let timerInterval;
let timeRemaining = 0; // in seconds
let timerRunning = false;

function updateTimerDisplay() {
    let m = Math.floor(timeRemaining / 60).toString().padStart(2, '0');
    let s = (timeRemaining % 60).toString().padStart(2, '0');
    document.getElementById('timer-display').innerText = `${m}:${s}`;
}

function addTime(secs) {
    timeRemaining += secs;
    updateTimerDisplay();
}

function toggleTimer() {
    const btn = document.getElementById('timer-start-btn');
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;
        btn.innerText = "START";
        btn.style.background = "var(--c-blue)";
    } else {
        if (timeRemaining === 0) return;
        timerRunning = true;
        btn.innerText = "PAUSE";
        btn.style.background = "#FF5252";
        timerInterval = setInterval(() => {
            if (timeRemaining > 0) {
                timeRemaining--;
                updateTimerDisplay();
            } else {
                clearInterval(timerInterval);
                timerRunning = false;
                btn.innerText = "START";
                btn.style.background = "var(--c-blue)";
                if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]); // Phone vibration
                alert("TIME TO LIFT.");
            }
        }, 1000);
    }
}

function resetTimer() {
    clearInterval(timerInterval);
    timerRunning = false;
    timeRemaining = 0;
    updateTimerDisplay();
    const btn = document.getElementById('timer-start-btn');
    btn.innerText = "START";
    btn.style.background = "var(--c-blue)";
}

// --- MATH CALCULATOR ---
let calcVal = "0";

function calcPress(val) {
    if (val === 'C') { calcVal = "0"; }
    else if (val === 'DEL') { calcVal = calcVal.length > 1 ? calcVal.slice(0, -1) : "0"; }
    else if (val === '=') {
        try { calcVal = new Function('return ' + calcVal)().toString(); } 
        catch(e) { calcVal = "ERR"; }
    } else {
        if (calcVal === "0" || calcVal === "ERR") calcVal = val;
        else calcVal += val;
    }
    document.getElementById('calc-screen').innerText = calcVal;
}

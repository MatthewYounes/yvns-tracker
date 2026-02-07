let currentSession = [];
let ssMode = false;
let barWeight = 45;
let plateStack = []; 

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
    
    // Load Saved Draft Data (So you don't lose progress if you close app)
    loadDraft();
    // Load Session Data
    const savedSession = JSON.parse(localStorage.getItem('yvns_active_session'));
    if(savedSession) {
        currentSession = savedSession;
        renderSession();
    }
    
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
    
    if(tab==='tracker') document.querySelectorAll('.tab-btn')[0].classList.add('active');
    else if(tab==='calculator') document.querySelectorAll('.tab-btn')[1].classList.add('active');
    else document.querySelectorAll('.tab-btn')[2].classList.add('active');
}

// --- TRACKER LOGIC ---
function updateUI() {
    const equip = document.getElementById('equipment').value;
    const list = document.getElementById('exercise-list');
    
    // Dynamic Labels Logic
    const lblW = document.getElementById('lbl-weight');
    const inpW = document.getElementById('input-1');
    const lblR = document.getElementById('lbl-reps');
    const inpR = document.getElementById('input-2');
    
    if (equip === 'Dumbbell') {
        lblW.innerText = "Weight (Per Hand)";
        inpW.placeholder = "lbs";
        lblR.innerText = "Reps";
    } else if (equip === 'Cardio') {
        lblW.innerText = "Duration";
        inpW.placeholder = "Minutes";
        lblR.innerText = "Distance / Cals";
    } else if (equip === 'Bodyweight') {
        lblW.innerText = "Added Weight";
        inpW.placeholder = "0 if none";
        lblR.innerText = "Reps";
    } else if (equip === 'Abs') {
        // NEW ABS LOGIC HERE
        lblW.innerText = "Reps or Time";
        inpW.placeholder = "e.g. 20 or 45s";
        lblR.innerText = "Sets / Rounds";
    } else {
        // Default (Barbell, Machine, etc)
        lblW.innerText = "Weight (lbs)";
        inpW.placeholder = "0";
        lblR.innerText = "Reps";
    }

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
    // Saves input text every time you type (Requirement 6)
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
    
    // Save Session immediately so refresh doesn't kill it
    localStorage.setItem('yvns_active_session', JSON.stringify(currentSession));
    
    renderSession();
    
    // NOTE: Removed "clearInputs()" so you can quick-edit (Requirement 3)
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
    
    // Clear Active Session
    currentSession = [];
    localStorage.removeItem('yvns_active_session');
    
    renderSession();
    renderHistory();
    alert("SAVED TO HISTORY.");
}

// --- CALCULATOR ---
function setBarWeight(w) {
    barWeight = w;
    document.getElementById('btn-bar-45').classList.toggle('active-bar', w === 45);
    document.getElementById('btn-bar-25').classList.toggle('active-bar', w === 25);
    renderCalculator();
}
function addPlate(weight) {
    plateStack.push(weight);
    plateStack.sort((a,b) => b - a);
    renderCalculator();
}
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
function renderHistory() {
    const feed = document.getElementById('history-feed');
    const history = JSON.parse(localStorage.getItem('yvns_tracker_v2')) || [];
    feed.innerHTML = "";
    if(history.length === 0) { feed.innerHTML = "<div class='empty-state'>No saved workouts found.</div>"; return; }
    
    history.slice().reverse().forEach((log, index) => {
        let html = `<div class="history-card"><div class="h-header"><span>${log.date}</span><span class="h-del" onclick="delHist(${history.length-1-index})"><i class="fas fa-trash"></i></span></div><div class="h-body">`;
        log.data.forEach(e => {
            html += `<div class="h-row">${e.sets[0].name} (${e.sets[0].weight}x${e.sets[0].reps})`;
            if(e.type==='Superset') html += ` + ${e.sets[1].name} (${e.sets[1].weight}x${e.sets[1].reps})`;
            html += `</div>`;
        });
        html += `</div></div>`;
        feed.innerHTML += html;
    });
}

function delHist(idx) {
    if(confirm("Delete this log?")) {
        let h = JSON.parse(localStorage.getItem('yvns_tracker_v2'));
        h.splice(idx, 1);
        localStorage.setItem('yvns_tracker_v2', JSON.stringify(h));
        renderHistory();
    }
}

function copyForSheets() {
    const history = JSON.parse(localStorage.getItem('yvns_tracker_v2'));
    if(!history) return alert("No History");
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

function exportCSV() {
    const history = JSON.parse(localStorage.getItem('yvns_tracker_v2'));
    if(!history) return alert("No History");
    let csv = "data:text/csv;charset=utf-8,Date,Category,Workout,Weight,Reps\n";
    history.forEach(log => {
        log.data.forEach(e => {
            let row = "";
            if(e.type === 'Superset') {
                row = `${log.date},${e.equip},[SS] ${e.sets[0].name} ss ${e.sets[1].name},${e.sets[0].weight} / ${e.sets[1].weight},${e.sets[0].reps} / ${e.sets[1].reps}`;
            } else {
                row = `${log.date},${e.equip},${e.sets[0].name},${e.sets[0].weight},${e.sets[0].reps}`;
            }
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

function copyForText() {
    const history = JSON.parse(localStorage.getItem('yvns_tracker_v2'));
    if(!history) return alert("No History");
    let txt = "=== YVNS LOG ===\n";
    history.forEach(log => {
        txt += `\n[ ${log.date} ]\n`;
        log.data.forEach(e => {
            if(e.type === 'Superset') txt += `[SS] ${e.sets[0].name} (${e.sets[0].weight}x${e.sets[0].reps}) + ${e.sets[1].name} (${e.sets[1].weight}x${e.sets[1].reps})\n`;
            else txt += `${e.sets[0].name}: ${e.sets[0].weight}x${e.sets[0].reps}\n`;
        });
    });
    navigator.clipboard.writeText(txt).then(() => alert("Copied Text Report."));
}

function wipeAllData() { if(confirm("Wipe all data?")) { localStorage.removeItem('yvns_tracker_v2'); location.reload(); } }
function showExportPage() { document.getElementById('main-page').style.display = 'none'; document.getElementById('export-page').style.display = 'flex'; }
function showMainPage() { document.getElementById('export-page').style.display = 'none'; document.getElementById('main-page').style.display = 'flex'; }

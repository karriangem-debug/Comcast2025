// Database & State
let db = {
    deadlines: JSON.parse(localStorage.getItem('deadlines')) || [],
    isAdmin: localStorage.getItem('isAdmin') === 'true'
};

// 1. STABLE NAVIGATION
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function showSection(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    if(id === 'deadline-view') renderDeadlines();
}

// 2. RENDERING ENGINE
function renderDeadlines() {
    const container = document.getElementById('deadline-grid');
    if(db.deadlines.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:60px; opacity:0.4; font-weight:700;">No Tasks Available.</div>`;
        return;
    }
    container.innerHTML = db.deadlines.map(t => `
        <div class="card-item">
            <span class="card-subject">${t.subject}</span>
            <p style="font-weight: 500; opacity: 0.7;">${t.name}</p>
            <div class="countdown-pill">
                <span class="timer-engine" data-target="${t.date}T${t.time}">MENUNGGU DATA...</span>
            </div>
        </div>
    `).join('');
}

// 3. COUNTDOWN FULL PRO (HARI, JAM, MENIT, DETIK)
setInterval(() => {
    document.querySelectorAll('.timer-engine').forEach(el => {
        const diff = new Date(el.dataset.target) - new Date();
        if(diff <= 0) {
            el.innerText = "🚨 BATAS WAKTU TELAH BERAKHIR";
            return;
        }
        const d = Math.floor(diff/86400000);
        const h = Math.floor((diff/3600000)%24);
        const m = Math.floor((diff/60000)%60);
        const s = Math.floor((diff/1000)%60);
        
        el.innerText = `⏳ SISA: ${d} Hari, ${h} Jam, ${m} Menit, ${s} Detik`;
    });
}, 1000);

// 4. SMART SYNC (SHARE WA)
function shareDataWA() {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(db.deadlines))));
    const url = `${window.location.origin}${window.location.pathname}?sync=${data}`;
    const msg = `*📌 COMCAST 2025 UPDATE*\n\nData tugas terbaru sudah tersedia. Sinkronkan sekarang lewat link ini:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// 5. BOOTSTRAP
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if(params.has('sync')) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(params.get('sync')))));
            localStorage.setItem('deadlines', JSON.stringify(decoded));
            alert("✅ Data Berhasil Disinkronkan!");
            window.location.href = window.location.pathname;
        } catch(e) { console.error("Sync Error"); }
    }

    if(db.isAdmin) {
        document.getElementById('admin-group').style.display = 'block';
        document.getElementById('login-trigger').style.display = 'none';
    }
    renderDeadlines();
};

function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if(u === "Comcast" && p === "2025") {
        localStorage.setItem('isAdmin', 'true');
        location.reload();
    } else alert("Login Gagal!");
}
function logout() { localStorage.removeItem('isAdmin'); location.reload(); }
function toggleTheme() { document.body.classList.toggle('dark-theme'); }

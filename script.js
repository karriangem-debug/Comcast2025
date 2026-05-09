// Database State
let appData = {
    deadlines: JSON.parse(localStorage.getItem('deadlines')) || [],
    org: JSON.parse(localStorage.getItem('orgMembers')) || [],
    isAdmin: localStorage.getItem('isAdmin') === 'true'
};

// 1. NAVIGATION SYSTEM
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

function switchSection(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    if(id === 'deadline-view') renderDeadlines();
}

// 2. RENDER DEADLINES
function renderDeadlines() {
    const container = document.getElementById('deadline-container');
    if(appData.deadlines.length === 0) {
        container.innerHTML = `<div style="text-align:center; padding:50px; opacity:0.5">Belum ada data tugas.</div>`;
        return;
    }
    container.innerHTML = appData.deadlines.map(item => `
        <div class="card">
            <h3 class="card-title">${item.subject}</h3>
            <p style="font-size: 0.9rem; opacity: 0.8">${item.name}</p>
            <div class="timer-box">
                <span class="full-timer" data-time="${item.date}T${item.time}">MENGHITUNG...</span>
            </div>
        </div>
    `).join('');
}

// 3. COUNTDOWN ENGINE (HARI, JAM, MENIT, DETIK)
setInterval(() => {
    document.querySelectorAll('.full-timer').forEach(el => {
        const diff = new Date(el.dataset.time) - new Date();
        if(diff <= 0) {
            el.innerText = "WAKTU PENGERJAAN TELAH BERAKHIR";
            return;
        }
        const d = Math.floor(diff/86400000);
        const h = Math.floor((diff/3600000)%24);
        const m = Math.floor((diff/60000)%60);
        const s = Math.floor((diff/1000)%60);
        el.innerText = `⏳ SISA: ${d} Hari, ${h} Jam, ${m} Menit, ${s} Detik`;
    });
}, 1000);

// 4. SINKRONISASI WA
function shareDataToWA() {
    const pkg = { d: appData.deadlines, o: appData.org };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(pkg))));
    const link = `${window.location.origin}${window.location.pathname}?sync=${encoded}`;
    
    const text = `*📌 UPDATE PORTAL COMCAST 2025*\n\nData tugas & struktur sudah di-update. Sinkronkan sekarang lewat link ini:\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 5. INITIALIZER & SYNC URL
window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if(params.has('sync')) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(params.get('sync')))));
            localStorage.setItem('deadlines', JSON.stringify(decoded.d));
            localStorage.setItem('orgMembers', JSON.stringify(decoded.o));
            alert("✅ Sinkronisasi Berhasil!");
            window.location.href = window.location.pathname;
        } catch(e) { console.error("Sync Gagal"); }
    }

    if(appData.isAdmin) {
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('login-nav').style.display = 'none';
    }
    renderDeadlines();
};

// 6. AUTH SYSTEM
function handleLogin() {
    const u = document.getElementById('user-in').value;
    const p = document.getElementById('pass-in').value;
    if(u === "Comcast" && p === "2025") {
        localStorage.setItem('isAdmin', 'true');
        location.reload();
    } else alert("Akses Ditolak!");
}

function logout() { localStorage.removeItem('isAdmin'); location.reload(); }
function toggleTheme() { document.body.classList.toggle('dark-theme'); }

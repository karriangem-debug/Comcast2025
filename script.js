// State Management
let db = {
    deadlines: JSON.parse(localStorage.getItem('deadlines')) || [],
    org: JSON.parse(localStorage.getItem('orgMembers')) || [],
    isAdmin: localStorage.getItem('isAdmin') === 'true'
};

// 1. MENU TOGGLE (STABLE)
function toggleMenu() {
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
}

// 2. SWITCH PAGE
function switchPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(pageId);
    if(target) target.classList.add('active');
    
    if(document.getElementById('sidebar').classList.contains('active')) toggleMenu();
    if(pageId === 'deadline-view') renderTasks();
}

// 3. SHARE WHATSAPP
function shareToWhatsApp() {
    const data = { d: db.deadlines, o: db.org };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    const link = `${window.location.origin}${window.location.pathname}?sync=${encoded}`;
    
    const msg = `*📌 UPDATE COMCAST 2025*\n\nData tugas & struktur sudah di-update. Sinkronkan ke web kamu sekarang:\n\n${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
}

// 4. COUNTDOWN FULL TEXT
function initTimers() {
    setInterval(() => {
        document.querySelectorAll('.timer-data').forEach(el => {
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
}

// 5. RENDER LOGIC
function renderTasks() {
    const container = document.getElementById('list-deadline');
    container.innerHTML = db.deadlines.map(t => `
        <div class="task-card">
            <div class="task-title">${t.subject}</div>
            <p style="font-size:0.9rem; opacity:0.8;">${t.name}</p>
            <div class="timer-full">
                <span class="timer-data" data-time="${t.date}T${t.time}">MENGHITUNG...</span>
            </div>
        </div>
    `).join('') || `<p style="text-align:center; padding:50px; opacity:0.5;">Belum Ada Tugas.</p>`;
}

// 6. LOGIN & SYNC
function handleLogin() {
    const u = document.getElementById('user-admin').value;
    const p = document.getElementById('pass-admin').value;
    if(u === "Comcast" && p === "2025") {
        localStorage.setItem('isAdmin', 'true');
        location.reload();
    } else alert("Akses Ditolak!");
}

function logoutAdmin() {
    localStorage.removeItem('isAdmin');
    location.reload();
}

window.onload = () => {
    // Sync URL
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('sync')) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(urlParams.get('sync')))));
            localStorage.setItem('deadlines', JSON.stringify(decoded.d));
            localStorage.setItem('orgMembers', JSON.stringify(decoded.o));
            alert("✅ Sinkronisasi Berhasil!");
            window.location.href = window.location.pathname;
        } catch(e) { console.error("Sync Error"); }
    }

    // Check Admin Status
    if(db.isAdmin) {
        document.getElementById('admin-section').style.display = 'block';
        document.getElementById('login-nav').style.display = 'none';
    }
    
    renderTasks();
    initTimers();
};

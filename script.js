// Database State
let state = {
    deadlines: JSON.parse(localStorage.getItem('deadlines')) || [],
    org: JSON.parse(localStorage.getItem('orgMembers')) || [],
    isAdmin: localStorage.getItem('isAdmin') === 'true'
};

// 1. FUNGSI TOGGLE MENU (ANTY-MACET)
function toggleMenu() {
    const sidebar = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('show');
}

// 2. NAVIGASI SECTION
function showSection(id) {
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    // Auto close sidebar
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    if(id === 'deadline-view') renderDeadlines();
}

// 3. SINKRONISASI WA (FULL DATA)
function shareDataToWA() {
    const dataPackage = { d: state.deadlines, o: state.org };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(dataPackage))));
    const url = `${window.location.origin}${window.location.pathname}?update=${encoded}`;
    
    const text = `*📌 UPDATE PORTAL COMCAST*\n\nData tugas & struktur kelas telah diperbarui. Klik link ini untuk sinkronisasi otomatis:\n\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 4. COUNTDOWN MASTER (FULL TEXT)
function startTimers() {
    setInterval(() => {
        document.querySelectorAll('.timer-text').forEach(el => {
            const target = new Date(el.dataset.time) - new Date();
            if(target <= 0) {
                el.innerText = "WAKTU PENGERJAAN TELAH BERAKHIR";
                return;
            }
            const d = Math.floor(target/86400000);
            const h = Math.floor((target/3600000)%24);
            const m = Math.floor((target/60000)%60);
            const s = Math.floor((target/1000)%60);
            
            el.innerText = `⏳ SISA: ${d} Hari, ${h} Jam, ${m} Menit, ${s} Detik`;
        });
    }, 1000);
}

// 5. RENDER LOGIC
function renderDeadlines() {
    const container = document.getElementById('deadline-list');
    container.innerHTML = state.deadlines.length ? state.deadlines.map(d => `
        <div class="item-card">
            <span class="task-subject">${d.subject}</span>
            <p style="font-size:0.85rem; opacity:0.8;">${d.name}</p>
            <div class="countdown-box">
                <span class="timer-text" data-time="${d.date}T${d.time}">MENGHITUNG...</span>
            </div>
        </div>
    `).join('') : `<div style="text-align:center; padding:50px; opacity:0.5;">Belum Ada Tugas.</div>`;
}

// 6. INITIALIZER & SYNC
window.onload = () => {
    // Cek update dari link
    const params = new URLSearchParams(window.location.search);
    if(params.has('update')) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(params.get('update')))));
            localStorage.setItem('deadlines', JSON.stringify(decoded.d));
            localStorage.setItem('orgMembers', JSON.stringify(decoded.o));
            alert("✅ Data Berhasil Disinkronkan!");
            window.location.href = window.location.pathname; // Clean URL
        } catch(e) { console.error("Sync Error"); }
    }

    if(state.isAdmin) document.getElementById('admin-menu-area').style.display = 'block';
    renderDeadlines();
    startTimers();
};

// Fungsi Tambahan
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if(u === "Comcast" && p === "2025") {
        localStorage.setItem('isAdmin', 'true');
        location.reload();
    } else {
        alert("Akses Admin Ditolak!");
    }
}
function logout() { localStorage.removeItem('isAdmin'); location.reload(); }

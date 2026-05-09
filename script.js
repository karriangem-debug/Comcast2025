let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let orgMembers = JSON.parse(localStorage.getItem('orgMembers')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// 1. SINKRONISASI DATA (MENU SHARE WA)
function shareDataToWA() {
    const combinedData = { d: deadlines, s: schedule, o: orgMembers };
    const dataString = btoa(unescape(encodeURIComponent(JSON.stringify(combinedData))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?update=${dataString}`;
    
    let text = `*📌 UPDATE PORTAL COMCAST 2025*\n\nAda update tugas/struktur terbaru. Klik link ini agar web di HP kamu otomatis ter-update:\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 2. FUNGSI TOGGLE MENU (GARIS 3)
function toggleMenu() {
    const menu = document.getElementById('side-menu');
    const overlay = document.getElementById('menu-overlay');
    menu.classList.toggle('open');
    overlay.classList.toggle('show');
}

// 3. FUNGSI PINDAH HALAMAN
function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
    
    // Tutup menu otomatis setelah klik
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    if(id === 'deadline-view') renderDeadlines();
}

// 4. COOLDOWN FULL TEXT (HARI, JAM, MENIT, DETIK)
function updateTimers() {
    document.querySelectorAll('.countdown').forEach(el => {
        const diff = new Date(el.dataset.target) - new Date();
        if(diff <= 0) return el.innerText = "WAKTU PENGERJAAN TELAH SELESAI";
        
        const hari = Math.floor(diff/86400000);
        const jam = Math.floor((diff/3600000)%24);
        const menit = Math.floor((diff/60000)%60);
        const detik = Math.floor((diff/1000)%60);
        
        el.innerText = `⏳ SISA WAKTU: ${hari} Hari, ${jam} Jam, ${menit} Menit, ${detik} Detik`;
    });
}

// 5. RENDER DEADLINE TUGAS
function renderDeadlines() {
    const container = document.getElementById('week-display');
    const activeTab = document.querySelector('.tab-btn.active').id.replace('tab-', '');
    
    let filtered = deadlines.filter(d => {
        if (activeTab === 'old') return d.status === 'old';
        const target = new Date(d.date).setHours(0,0,0,0);
        const today = new Date().setHours(0,0,0,0);
        const isThisWeek = target < (today + 7*86400000);
        return activeTab === 'now' ? (isThisWeek && d.status !== 'old') : (!isThisWeek && d.status !== 'old');
    });

    container.innerHTML = filtered.map(d => `
        <div class="item-card">
            <div class="task-header-row">
                <div class="task-subject">${d.subject}</div>
                <div class="task-meta">JAM ${d.time}</div>
            </div>
            <div style="font-size:0.9rem; margin-top:5px; font-weight:400;">${d.name}</div>
            <span class="countdown" data-target="${d.date}T${d.time}">⏳ MENGHITUNG...</span>
        </div>
    `).join('') || "<p style='text-align:center; padding:40px; opacity:0.5;'>Belum ada data tugas.</p>";
}

// 6. RECEIVE DATA DARI URL
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const updateData = urlParams.get('update');
    if (updateData) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(updateData))));
            localStorage.setItem('deadlines', JSON.stringify(decoded.d));
            localStorage.setItem('schedule', JSON.stringify(decoded.s));
            localStorage.setItem('orgMembers', JSON.stringify(decoded.o));
            alert("✅ SINKRONISASI BERHASIL!");
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload();
        } catch (e) { console.error("Sync Error"); }
    }
    
    if (isAdmin) document.getElementById('admin-only-menu').style.display = 'block';
    renderDeadlines();
    setInterval(updateTimers, 1000);
};

// Fitur Lainnya (Login, Theme) tetap sama
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('theme-link').innerText = isDark ? "☀️ Mode Terang" : "🌙 Mode Gelap";
}

function login() {
    const u = document.getElementById('username').value;
    const p = document.getElementById('password').value;
    if(u === "Comcast" && p === "2025") {
        localStorage.setItem('isAdmin', 'true');
        location.reload();
    } else alert("Login Gagal!");
}
function logout() { localStorage.removeItem('isAdmin'); location.reload(); }

let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// 1. FUNGSI SHARE DATA KE WA (SINKRONISASI FULL)
function shareDataToWA() {
    // Membungkus data tugas & jadwal ke dalam link
    const combinedData = { d: deadlines, s: schedule };
    const dataString = btoa(unescape(encodeURIComponent(JSON.stringify(combinedData))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?update=${dataString}`;
    
    let text = `*📌 UPDATE PORTAL COMCAST 2025*\n\n`;
    text += `Ada update tugas/jadwal baru nih. Klik link di bawah biar data di HP kamu otomatis ter-update:\n\n`;
    text += `${shareUrl}\n\n`;
    text += `_Data otomatis tersimpan di browser masing-masing._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 2. TERIMA & BONGKAR DATA DARI URL
function receiveDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const updateData = urlParams.get('update');
    
    if (updateData) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(updateData))));
            deadlines = decoded.d;
            schedule = decoded.s;
            localStorage.setItem('deadlines', JSON.stringify(deadlines));
            localStorage.setItem('schedule', JSON.stringify(schedule));
            
            alert("✅ SINKRONISASI BERHASIL!\nData tugas dan jadwal sudah diperbarui.");
            window.history.replaceState({}, document.title, window.location.pathname);
            renderDeadlines();
        } catch (e) { console.error("Gagal bongkar data link."); }
    }
}

// 3. LOGIKA RENDER (PRO MAX VERSION)
function renderDeadlines() {
    const container = document.getElementById('week-display');
    const now = new Date();
    
    // Auto-Archive 30 Menit
    deadlines.forEach(d => {
        const dTime = new Date(`${d.date}T${d.time}`);
        if (now > new Date(dTime.getTime() + 30 * 60000)) d.status = 'old';
    });

    const activeTab = document.querySelector('.tab-btn.active').id.replace('tab-', '');
    let filtered = deadlines.filter(d => {
        if (activeTab === 'old') return d.status === 'old';
        const target = new Date(d.date).setHours(0,0,0,0);
        const today = new Date().setHours(0,0,0,0);
        const isThisWeek = target < (today + 7*86400000);
        return activeTab === 'now' ? (isThisWeek && d.status !== 'old') : (!isThisWeek && d.status !== 'old');
    });

    container.innerHTML = filtered.length ? filtered.sort((a,b)=>new Date(a.date)-new Date(b.date)).map(d => `
        <div class="item-card">
            <div class="task-header-row">
                <div class="task-subject">${d.subject}</div>
                <div class="task-meta">⏰ ${d.time}</div>
            </div>
            <div class="task-detail" style="font-size:0.85rem; opacity:0.8;">${d.name}</div>
            <span class="countdown" data-target="${d.date}T${d.time}">⏳ Loading...</span>
        </div>
    `).join('') : "<p style='text-align:center; padding:30px; opacity:0.5;'>Belum ada tugas di tab ini.</p>";
}

// 4. ADMIN SMART TOOLS
function openManageDeadline() {
    const select = document.getElementById('task-subject-select');
    const subjects = [...new Set(schedule.map(s => s.name))];
    select.innerHTML = '<option value="">-- Pilih Matkul --</option>' + 
        subjects.map(s => `<option value="${s}">${s}</option>`).join('') +
        '<option value="Tugas Umum">Tugas Umum</option>';
    showSection('manage-deadline');
}

function autoFillTime() {
    const sub = document.getElementById('task-subject-select').value;
    const found = schedule.find(s => s.name === sub);
    if(found) document.getElementById('task-time').value = found.time;
}

// UI HELPERS
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
    document.getElementById('menu-overlay').classList.toggle('show');
}

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    renderDeadlines();
}

function filterDeadline(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+t).classList.add('active');
    renderDeadlines();
}

window.onload = () => {
    receiveDataFromURL();
    if (isAdmin) document.getElementById('admin-only-menu').style.display = 'block';
    renderDeadlines();
    setInterval(() => {
        document.querySelectorAll('.countdown').forEach(el => {
            const diff = new Date(el.dataset.target) - new Date();
            if(diff <= 0) return el.innerText = "WAKTU HABIS";
            const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60), s = Math.floor((diff/1000)%60);
            el.innerText = `⏳ ${d}D ${h}J ${m}M ${s}S`;
        });
    }, 1000);
};

function login() {
    if(document.getElementById('username').value === "Comcast" && document.getElementById('password').value === "2025") {
        localStorage.setItem('isAdmin', 'true'); location.reload();
    } else alert("Akses Ditolak!");
}
function logout() { localStorage.removeItem('isAdmin'); location.reload(); }

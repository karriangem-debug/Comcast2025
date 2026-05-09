let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let orgMembers = JSON.parse(localStorage.getItem('orgMembers')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// 1. SINKRONISASI (DI MENU SIDEBAR)
function shareDataToWA() {
    const combinedData = { d: deadlines, s: schedule, o: orgMembers };
    const dataString = btoa(unescape(encodeURIComponent(JSON.stringify(combinedData))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?update=${dataString}`;
    
    let text = `*📌 UPDATE PORTAL COMCAST 2025*\n\nKlik link ini agar data tugas & struktur di HP kamu otomatis ter-update:\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 2. RECEIVE DATA DARI LINK
function receiveDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const updateData = urlParams.get('update');
    if (updateData) {
        try {
            const decoded = JSON.parse(decodeURIComponent(escape(atob(updateData))));
            deadlines = decoded.d; schedule = decoded.s; orgMembers = decoded.o;
            localStorage.setItem('deadlines', JSON.stringify(deadlines));
            localStorage.setItem('schedule', JSON.stringify(schedule));
            localStorage.setItem('orgMembers', JSON.stringify(orgMembers));
            alert("✅ SINKRONISASI BERHASIL!");
            window.history.replaceState({}, document.title, window.location.pathname);
            location.reload();
        } catch (e) { console.error("Error bongkar data."); }
    }
}

// 3. COUNTDOWN FULL TEXT (TIDAK DISINGKAT)
function updateTimers() {
    document.querySelectorAll('.countdown').forEach(el => {
        const diff = new Date(el.dataset.target) - new Date();
        if(diff <= 0) return el.innerText = "WAKTU PENGERJAAN SUDAH HABIS";
        
        const hari = Math.floor(diff/86400000);
        const jam = Math.floor((diff/3600000)%24);
        const menit = Math.floor((diff/60000)%60);
        const detik = Math.floor((diff/1000)%60);
        
        el.innerText = `⏳ Sisa: ${hari} Hari, ${jam} Jam, ${menit} Menit, ${detik} Detik`;
    });
}

// 4. UI & RENDER LOGIC
function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
    document.getElementById('menu-overlay').classList.toggle('show');
}

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    if(id === 'deadline-view') renderDeadlines();
}

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
                <div class="task-meta">Jam ${d.time}</div>
            </div>
            <div style="font-size: 0.85rem; margin-top: 5px; opacity: 0.8;">${d.name}</div>
            <span class="countdown" data-target="${d.date}T${d.time}">⏳ Menghitung...</span>
        </div>
    `).join('') || "<p style='text-align:center; padding:30px; opacity:0.5;'>Data Kosong.</p>";
}

window.onload = () => {
    receiveDataFromURL();
    if (isAdmin) document.getElementById('admin-only-menu').style.display = 'block';
    renderDeadlines();
    setInterval(updateTimers, 1000);
};

function login() {
    if(document.getElementById('username').value === "Comcast" && document.getElementById('password').value === "2025") {
        localStorage.setItem('isAdmin', 'true'); location.reload();
    } else alert("Gagal!");
}

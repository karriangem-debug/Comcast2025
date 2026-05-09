let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let orgMembers = JSON.parse(localStorage.getItem('orgMembers')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// 1. FUNGSI SHARE WEB KE WA (MENU KHUSUS)
function shareDataToWA() {
    const combinedData = { d: deadlines, s: schedule, o: orgMembers };
    const dataString = btoa(unescape(encodeURIComponent(JSON.stringify(combinedData))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?update=${dataString}`;
    
    let text = `*📌 UPDATE DATA COMCAST 2025*\n\n`;
    text += `Klik link ini agar jadwal & tugas di HP kamu ter-update otomatis:\n\n`;
    text += `${shareUrl}\n\n`;
    text += `_Data otomatis sinkron ke web kamu._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 2. PENERIMA DATA OTOMATIS SAAT LINK DIKLIK
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
        } catch (e) { console.error("Error sync data."); }
    }
}

// 3. COOLDOWN FULL TEXT (TIDAK DISINGKAT)
function updateTimers() {
    document.querySelectorAll('.countdown').forEach(el => {
        const diff = new Date(el.dataset.target) - new Date();
        if(diff <= 0) return el.innerText = "WAKTU PENGERJAAN TELAH SELESAI";
        
        const hari = Math.floor(diff/86400000);
        const jam = Math.floor((diff/3600000)%24);
        const menit = Math.floor((diff/60000)%60);
        const detik = Math.floor((diff/1000)%60);
        
        // Penulisan Full tanpa singkatan
        el.innerText = `⏳ Sisa Waktu: ${hari} Hari, ${jam} Jam, ${menit} Menit, ${detik} Detik`;
    });
}

// 4. RENDER DATA & UI LOGIC
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
            <div style="font-size:0.8rem; margin:5px 0; opacity:0.8;">${d.name}</div>
            <span class="countdown" data-target="${d.date}T${d.time}">⏳ Menghitung...</span>
        </div>
    `).join('') || "<p style='text-align:center; padding:20px; opacity:0.5;'>Tidak ada tugas.</p>";
}

window.onload = () => {
    receiveDataFromURL();
    if (isAdmin) document.getElementById('admin-only-menu').style.display = 'block';
    renderDeadlines();
    setInterval(updateTimers, 1000);
};

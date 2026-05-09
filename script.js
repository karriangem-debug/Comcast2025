let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// 1. FUNGSI KIRIM SEMUA DATA KE WA (SINKRONISASI)
function shareDataToWA() {
    // Merubah data jadi kode yang bisa ditaruh di link
    const dataString = btoa(unescape(encodeURIComponent(JSON.stringify(deadlines))));
    const shareUrl = `${window.location.origin}${window.location.pathname}?update=${dataString}`;
    
    let text = `*📌 UPDATE DATA TUGAS COMCAST 2025*\n\n`;
    text += `Halo rek! Ada update deadline terbaru. Tolong klik link ini biar web kalian otomatis ter-update:\n\n`;
    text += `${shareUrl}\n\n`;
    text += `_Klik link di atas sekali saja, data otomatis masuk ke browser kalian._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}

// 2. FUNGSI PENERIMA DATA (SAAT TEMAN KLIK LINK)
function receiveDataFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const updateData = urlParams.get('update');
    
    if (updateData) {
        try {
            const decodedData = JSON.parse(decodeURIComponent(escape(atob(updateData))));
            deadlines = decodedData;
            localStorage.setItem('deadlines', JSON.stringify(deadlines));
            
            // Notifikasi sukses
            alert("✅ DATA BERHASIL DISINKRONKAN!\nSekarang web kamu sudah versi terbaru.");
            
            // Bersihkan URL supaya tidak reload terus
            window.history.replaceState({}, document.title, window.location.pathname);
            renderDeadlines();
        } catch (e) {
            console.error("Gagal sinkronisasi data.");
        }
    }
}

// 3. RENDER DEADLINE (RAMPING)
function renderDeadlines() {
    const container = document.getElementById('week-display');
    const activeTab = document.querySelector('.tab-btn.active').id.replace('tab-', '');
    
    // Auto-Archive 30 Menit
    const now = new Date();
    deadlines.forEach(d => {
        const dTime = new Date(`${d.date}T${d.time}`);
        if (now > new Date(dTime.getTime() + 30 * 60000)) d.status = 'old';
    });

    let filtered = deadlines.filter(d => {
        if (activeTab === 'old') return d.status === 'old';
        return d.status !== 'old' && getCat(d.date) === activeTab;
    });

    if (!filtered.length) {
        container.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>Kosong. Tunggu update dari Admin.</p>";
        return;
    }

    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    container.innerHTML = filtered.map(d => `
        <div class="item-card">
            <div class="task-header-row">
                <div class="task-subject">${d.subject}</div>
                <div class="task-meta">⏰ ${d.time}</div>
            </div>
            <div class="task-detail">${d.name}</div>
            <span class="countdown" data-target="${d.date}T${d.time}"></span>
            ${isAdmin ? `<button onclick="deleteData('${d.id}')" style="background:red; width:auto; padding:2px 8px; font-size:0.6rem; margin-top:10px;">Hapus</button>` : ''}
        </div>
    `).join('');
}

// Sisanya fungsi Login, Theme, dan UI pendukung
window.onload = () => {
    receiveDataFromURL(); // Wajib pertama kali cek link
    if (isAdmin) document.getElementById('admin-only-menu').style.display = 'block';
    renderDeadlines();
    setInterval(updateCountdowns, 1000);
};

function getCat(d) {
    const target = new Date(d).setHours(0,0,0,0);
    const now = new Date().setHours(0,0,0,0);
    return target < (now + 7*86400000) ? 'now' : 'next';
}

function login() {
    if(document.getElementById('username').value === "Comcast" && document.getElementById('password').value === "2025") {
        localStorage.setItem('isAdmin', 'true');
        location.reload();
    } else {
        alert("Akses Ditolak!");
    }
}

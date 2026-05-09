let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let orgMembers = JSON.parse(localStorage.getItem('orgMembers')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// --- CORE RENDERING ---

function renderDeadlines() {
    const container = document.getElementById('week-display');
    const now = new Date();
    
    // Logic: Auto-Selesai (Jika lewat > 30 menit)
    deadlines.forEach(d => {
        const dTime = new Date(`${d.date}T${d.time}`);
        if (now > new Date(dTime.getTime() + 30 * 60000)) d.status = 'old';
    });

    const activeTab = document.querySelector('.tab-btn.active').id.replace('tab-', '');
    let filtered = deadlines.filter(d => {
        if (activeTab === 'old') return d.status === 'old';
        return d.status !== 'old' && getCat(d.date) === activeTab;
    });

    if (!filtered.length) {
        container.innerHTML = "<p style='text-align:center; padding:30px; opacity:0.5;'>Tidak ada data.</p>";
        return;
    }

    // Urutkan Tanggal & Grouping
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
    const groups = filtered.reduce((acc, t) => {
        const day = new Date(t.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
        if (!acc[day]) acc[day] = [];
        acc[day].push(t);
        return acc;
    }, {});

    container.innerHTML = Object.keys(groups).map(day => `
        <div class="day-group">
            <div class="day-label">${day}</div>
            ${groups[day].map(d => `
                <div class="item-card">
                    <div class="task-subject">${d.subject || 'Tugas Umum'}</div>
                    <div class="task-meta">📅 ${d.date} | ⏰ ${d.time} WIB</div>
                    <div class="task-detail">${d.name}</div>
                    <span class="countdown" data-target="${d.date}T${d.time}"></span>
                    ${isAdmin ? `
                        <div class="btn-group">
                            <button onclick="editTask('${d.id}')" class="edit-btn">Edit</button>
                            <button onclick="deleteData('deadlines', '${d.id}')" class="del-btn">Hapus</button>
                        </div>` : ''}
                </div>
            `).join('')}
        </div>
    `).join('');
}

function renderSchedule() {
    const container = document.getElementById('class-schedule');
    const daysOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const sorted = [...schedule].sort((a, b) => {
        const d = daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
        return d !== 0 ? d : a.time.localeCompare(b.time);
    });

    container.innerHTML = daysOrder.map(day => {
        const items = sorted.filter(s => s.day === day);
        if (!items.length) return '';
        return `
            <div class="day-group">
                <div class="day-label" style="background:var(--accent)">${day}</div>
                ${items.map(it => `
                    <div class="schedule-card">
                        <div class="sch-time">${it.time}</div>
                        <div>
                            <div style="font-weight:700;">${it.name}</div>
                            <div style="font-size:0.7rem; opacity:0.6;">👤 ${it.lecturer} | 📍 ${it.room}</div>
                        </div>
                        ${isAdmin ? `<button onclick="deleteData('schedule', '${it.id}')" class="del-btn" style="position:absolute; right:10px; width:auto; padding:5px 10px;">X</button>` : ''}
                    </div>`).join('')}
            </div>`;
    }).join('');
}

function renderStructure() {
    document.getElementById('org-render-container').innerHTML = orgMembers.map(m => `
        <div class="org-box">
            <img src="${m.photo || 'https://via.placeholder.com/100'}" class="org-img">
            <div style="font-size:0.7rem; font-weight:800; color:var(--accent); margin-top:5px;">${m.role}</div>
            <div style="font-size:0.8rem; font-weight:600;">${m.name}</div>
            ${isAdmin ? `<button onclick="deleteData('orgMembers', '${m.id}')" class="del-btn">Hapus</button>` : ''}
        </div>`).join('');
}

// --- ADMIN ACTIONS ---

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

function saveTask() {
    const id = document.getElementById('edit-id').value;
    const tData = {
        id: id || Date.now(),
        subject: document.getElementById('task-subject-select').value,
        date: document.getElementById('task-date').value,
        time: document.getElementById('task-time').value || "23:59",
        name: document.getElementById('task-name').value,
        status: 'active'
    };
    if(!tData.date || !tData.name) return alert("Isi tanggal & rincian!");
    
    if(id) { const i = deadlines.findIndex(x => x.id == id); deadlines[i] = tData; }
    else { deadlines.push(tData); }
    
    saveAll(); resetTaskForm(); showSection('deadline-view');
}

function addSchedule() {
    schedule.push({ 
        id: Date.now(), 
        day: document.getElementById('sch-day').value, 
        time: document.getElementById('sch-time').value, 
        name: document.getElementById('sch-name').value, 
        lecturer: document.getElementById('sch-lecturer').value, 
        room: document.getElementById('sch-room').value 
    });
    saveAll(); showSection('schedule-view');
}

function addMember() {
    orgMembers.push({ id: Date.now(), name: document.getElementById('org-name').value, role: document.getElementById('org-role').value, photo: document.getElementById('org-photo').value });
    saveAll(); showSection('structure-view');
}

// --- UTILS ---

function deleteData(arr, id) {
    if(confirm("Hapus data ini?")) {
        if(arr === 'deadlines') deadlines = deadlines.filter(i => i.id != id);
        if(arr === 'schedule') schedule = schedule.filter(i => i.id != id);
        if(arr === 'orgMembers') orgMembers = orgMembers.filter(i => i.id != id);
        saveAll(); location.reload();
    }
}

function editTask(id) {
    const t = deadlines.find(i => i.id == id);
    openManageDeadline();
    document.getElementById('form-title').innerText = "EDIT TUGAS";
    document.getElementById('edit-id').value = t.id;
    document.getElementById('task-subject-select').value = t.subject;
    document.getElementById('task-date').value = t.date;
    document.getElementById('task-time').value = t.time;
    document.getElementById('task-name').value = t.name;
    document.getElementById('btn-save-task').innerText = "Update Tugas";
    document.getElementById('btn-cancel-edit').style.display = "block";
}

function resetTaskForm() {
    document.getElementById('form-title').innerText = "INPUT TUGAS";
    document.getElementById('edit-id').value = "";
    document.getElementById('task-name').value = "";
    document.getElementById('btn-save-task').innerText = "Simpan Tugas";
    document.getElementById('btn-cancel-edit').style.display = "none";
}

function updateCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
        const diff = new Date(el.dataset.target) - new Date();
        if(diff <= 0) return el.innerText = "WAKTU HABIS";
        const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60), s = Math.floor((diff/1000)%60);
        el.innerText = `⏳ ${d} Hari ${h} Jam ${m} Menit ${s} Detik`;
    });
}

function saveAll() {
    localStorage.setItem('deadlines', JSON.stringify(deadlines));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('orgMembers', JSON.stringify(orgMembers));
}

function getCat(d) {
    const target = new Date(d).setHours(0,0,0,0);
    const now = new Date().setHours(0,0,0,0);
    const week = now + (7 * 86400000);
    if (target < now) return 'old';
    return target < week ? 'now' : 'next';
}

function filterDeadline(t) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+t).classList.add('active');
    renderDeadlines();
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
    document.getElementById('menu-overlay').classList.toggle('show');
}

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(document.getElementById('side-menu').classList.contains('open')) toggleMenu();
    if(id === 'deadline-view') renderDeadlines();
    if(id === 'schedule-view') renderSchedule();
    if(id === 'structure-view') renderStructure();
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.getElementById('theme-link').innerText = document.body.classList.contains('dark-theme') ? "☀️ Light Mode" : "🌙 Dark Mode: Off";
}

function login() {
    if(document.getElementById('username').value === "Comcast" && document.getElementById('password').value === "2025") {
        localStorage.setItem('isAdmin', 'true'); location.reload();
    } else alert("Salah!");
}

function logout() { localStorage.removeItem('isAdmin'); location.reload(); }

window.onload = () => {
    document.getElementById('admin-only-menu').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('nav-login').style.display = isAdmin ? 'none' : 'block';
    renderDeadlines(); renderSchedule(); renderStructure();
    setInterval(updateCountdowns, 1000);
};

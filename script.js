let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let orgMembers = JSON.parse(localStorage.getItem('orgMembers')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// 1. RENDER JADWAL (AUTO-SORT & RAPI)
function renderSchedule() {
    const container = document.getElementById('class-schedule');
    const daysOrder = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    if (!schedule.length) return container.innerHTML = "<p style='text-align:center; padding:20px; opacity:0.5;'>Belum ada jadwal.</p>";

    const sorted = [...schedule].sort((a, b) => {
        const d = daysOrder.indexOf(a.day) - daysOrder.indexOf(b.day);
        return d !== 0 ? d : a.time.localeCompare(b.time);
    });

    container.innerHTML = daysOrder.map(day => {
        const items = sorted.filter(s => s.day === day);
        if (!items.length) return '';
        return `
            <div class="day-group">
                <div class="day-label">${day}</div>
                ${items.map(it => `
                    <div class="schedule-card">
                        <div class="sch-time">${it.time}</div>
                        <div class="sch-info">
                            <div class="sch-name">${it.name}</div>
                            <div class="sch-detail">${it.lecturer || '-'} | Ruang ${it.room || '-'}</div>
                        </div>
                        ${isAdmin ? `<button onclick="deleteData('schedule', '${it.id}')" class="del-btn-sch">Hapus</button>` : ''}
                    </div>`).join('')}
            </div>`;
    }).join('');
}

// 2. RENDER DEADLINE
function renderDeadlines() {
    const tab = document.querySelector('.tab-btn.active').id.replace('tab-', '');
    const container = document.getElementById('week-display');
    const filtered = deadlines.filter(d => getCat(d.date) === tab);
    
    container.innerHTML = filtered.length ? filtered.map(d => `
        <div class="item-card">
            <b>${d.date} | ${d.time}</b>
            <div class="task-detail">${d.name}</div>
            <span class="countdown" data-target="${d.date}T${d.time}"></span>
            ${isAdmin ? `
                <div class="btn-group">
                    <button onclick="editTask('${d.id}')" class="edit-btn">Edit</button>
                    <button onclick="deleteData('deadlines', '${d.id}')" class="del-btn">Hapus</button>
                </div>` : ''}
        </div>`).join('') : "<p style='text-align:center; padding:20px; opacity:0.5;'>Kosong.</p>";
}

// 3. RENDER STRUKTUR
function renderStructure() {
    document.getElementById('org-render-container').innerHTML = orgMembers.map(m => `
        <div class="org-box">
            <img src="${m.photo || 'https://via.placeholder.com/100'}" class="org-img">
            <br><b style="font-size:0.75rem; color:var(--accent)">${m.role}</b>
            <br><small>${m.name}</small>
            ${isAdmin ? `<br><button onclick="deleteData('orgMembers', '${m.id}')" class="del-btn" style="position:static; margin-top:5px;">Hapus</button>` : ''}
        </div>`).join('');
}

// 4. IMPORT HANDLER (WORD & EXCEL)
async function handleImport(type) {
    const file = document.getElementById(type === 'deadline' ? 'import-deadline' : type === 'schedule' ? 'import-sch-word' : 'import-org-excel').files[0];
    if(!file) return alert("Pilih file!");

    if(file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const res = await mammoth.extractRawText({arrayBuffer: e.target.result});
            if(type === 'deadline') document.getElementById('task-name').value = res.value;
            if(type === 'schedule') alert("Teks Word ditarik: " + res.value.substring(0, 50) + "...");
        };
        reader.readAsArrayBuffer(file);
    } else if(file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = XLSX.utils.sheet_to_json(XLSX.read(e.target.result, {type: 'binary'}).Sheets[XLSX.read(e.target.result, {type: 'binary'}).SheetNames[0]]);
            if(type === 'org') {
                data.forEach(r => orgMembers.push({id: Date.now()+Math.random(), name: r.Nama, role: r.Jabatan, photo: r.Foto}));
                saveAll(); renderStructure();
            }
            if(type === 'deadline') {
                data.forEach(r => deadlines.push({id: Date.now()+Math.random(), date: r.Tanggal, time: r.Jam || "23:59", name: r.Tugas}));
                saveAll(); renderDeadlines();
            }
            alert("Import Berhasil!");
        };
        reader.readAsBinaryString(file);
    }
}

// 5. CORE LOGIC (SAVE, EDIT, UI)
function saveTask() {
    const id = document.getElementById('edit-id').value;
    const date = document.getElementById('task-date').value;
    const name = document.getElementById('task-name').value;
    if(!date || !name) return alert("Lengkapi!");

    const tData = { id: id || Date.now(), date, time: document.getElementById('task-time').value || "23:59", name };
    if(id) { const i = deadlines.findIndex(x => x.id == id); deadlines[i] = tData; } 
    else { deadlines.push(tData); }
    
    saveAll(); resetTaskForm(); showSection('deadline-view');
}

function addSchedule() {
    schedule.push({ id: Date.now(), day: document.getElementById('sch-day').value, time: document.getElementById('sch-time').value, name: document.getElementById('sch-name').value, lecturer: document.getElementById('sch-lecturer').value, room: document.getElementById('sch-room').value });
    saveAll(); showSection('schedule-view');
}

function addMember() {
    orgMembers.push({ id: Date.now(), name: document.getElementById('org-name').value, role: document.getElementById('org-role').value, photo: document.getElementById('org-photo').value });
    saveAll(); showSection('structure-view');
}

function deleteData(arr, id) {
    if(confirm("Hapus?")) {
        if(arr === 'deadlines') deadlines = deadlines.filter(i => i.id != id);
        if(arr === 'schedule') schedule = schedule.filter(i => i.id != id);
        if(arr === 'orgMembers') orgMembers = orgMembers.filter(i => i.id != id);
        saveAll(); location.reload();
    }
}

function editTask(id) {
    const t = deadlines.find(i => i.id == id);
    showSection('manage-deadline');
    document.getElementById('form-title').innerText = "EDIT TUGAS";
    document.getElementById('edit-id').value = t.id;
    document.getElementById('task-date').value = t.date;
    document.getElementById('task-time').value = t.time;
    document.getElementById('task-name').value = t.name;
    document.getElementById('btn-save-task').innerText = "Update";
    document.getElementById('btn-cancel-edit').style.display = "block";
}

function saveAll() {
    localStorage.setItem('deadlines', JSON.stringify(deadlines));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('orgMembers', JSON.stringify(orgMembers));
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    document.getElementById('theme-link').innerText = document.body.classList.contains('dark-theme') ? "☀️ Light Mode" : "🌙 Dark Mode: Off";
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

function login() {
    if(document.getElementById('username').value === "Comcast" && document.getElementById('password').value === "2025") {
        localStorage.setItem('isAdmin', 'true'); location.reload();
    } else alert("Salah!");
}

function logout() { localStorage.removeItem('isAdmin'); location.reload(); }

function updateCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
        const diff = new Date(el.dataset.target) - new Date();
        if(diff <= 0) return el.innerText = "WAKTU HABIS";
        const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60), s = Math.floor((diff/1000)%60);
        el.innerText = `⏳ ${d} Hari ${h} Jam ${m} Menit ${s} Detik`;
    });
}

function getCat(d) {
    const now = new Date().setHours(0,0,0,0), target = new Date(d);
    if(target < now) return 'old';
    return (target - now < 7*86400000) ? 'now' : 'next';
}

function filterDeadline(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-'+type).classList.add('active');
    renderDeadlines();
}

function resetTaskForm() {
    document.getElementById('form-title').innerText = "INPUT TUGAS";
    document.getElementById('edit-id').value = "";
    document.getElementById('task-name').value = "";
    document.getElementById('btn-cancel-edit').style.display = "none";
}

function shareDataToWA() {
    const p = btoa(encodeURIComponent(JSON.stringify({d: deadlines, s: schedule, o: orgMembers})));
    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.origin + window.location.pathname + "?upd=" + p)}`);
}

window.onload = () => {
    const params = new URLSearchParams(window.location.search);
    if(params.get('upd')) {
        const data = JSON.parse(decodeURIComponent(atob(params.get('upd'))));
        localStorage.setItem('deadlines', JSON.stringify(data.d));
        localStorage.setItem('schedule', JSON.stringify(data.s));
        localStorage.setItem('orgMembers', JSON.stringify(data.o));
        window.location.href = window.location.origin + window.location.pathname;
    }
    document.getElementById('admin-only-menu').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('nav-login').style.display = isAdmin ? 'none' : 'block';
    renderDeadlines(); renderSchedule(); renderStructure();
    setInterval(updateCountdowns, 1000);
};

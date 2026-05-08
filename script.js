let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let schedule = JSON.parse(localStorage.getItem('schedule')) || [];
let orgMembers = JSON.parse(localStorage.getItem('orgMembers')) || [];
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// 1. RENDER JADWAL & STRUKTUR
function renderSchedule() {
    const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const container = document.getElementById('class-schedule');
    container.innerHTML = days.map(day => {
        const items = schedule.filter(s => s.day === day);
        if(!items.length) return '';
        return `<div class="admin-card"><b>${day}</b>${items.map(it => `
            <div style="border-top:1px solid var(--border); margin-top:10px; padding-top:10px; position:relative;">
                <small>${it.time}</small> | <b>${it.name}</b><br><small>${it.lecturer || ''} - ${it.room || ''}</small>
                ${isAdmin ? `<button onclick="deleteData('schedule', '${it.id}')" class="del-btn" style="position:absolute; right:0; top:10px;">Hapus</button>` : ''}
            </div>`).join('')}</div>`;
    }).join('');
}

function renderStructure() {
    document.getElementById('org-render-container').innerHTML = orgMembers.map(m => `
        <div class="org-box">
            <img src="${m.photo || 'https://via.placeholder.com/100'}" class="org-img">
            <br><b style="font-size:0.75rem; color:var(--accent)">${m.role}</b>
            <br><small>${m.name}</small>
            ${isAdmin ? `<br><button onclick="deleteData('orgMembers', '${m.id}')" class="del-btn" style="position:static; margin-top:5px;">Hapus</button>` : ''}
        </div>`).join('');
}

// 2. IMPORT FILE HANDLER (WORD & EXCEL)
async function handleImport(type) {
    let fileInput;
    if(type === 'deadline') fileInput = document.getElementById('import-deadline');
    if(type === 'schedule') fileInput = document.getElementById('import-sch-word');
    if(type === 'org') fileInput = document.getElementById('import-org-excel');

    const file = fileInput.files[0];
    if(!file) return alert("Pilih file!");

    // A. WORD HANDLER (Untuk Tugas & Jadwal)
    if(file.name.endsWith('.docx')) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = await mammoth.extractRawText({arrayBuffer: e.target.result});
            if(type === 'deadline') document.getElementById('task-name').value = result.value;
            if(type === 'schedule') {
                // Tarik teks jadwal ke box input mata kuliah sebagai referensi
                document.getElementById('sch-name').value = "Cek Word: " + result.value.substring(0, 20);
                alert("Teks Jadwal ditarik! Silakan isi detail lainnya.");
            }
        };
        reader.readAsArrayBuffer(file);
    } 
    // B. EXCEL HANDLER (Untuk Struktur & Tugas)
    else if(file.name.endsWith('.xlsx')) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const wb = XLSX.read(e.target.result, {type: 'binary'});
            const data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            if(type === 'org') {
                data.forEach(row => {
                    orgMembers.push({ id: Date.now()+Math.random(), name: row.Nama, role: row.Jabatan, photo: row.Foto });
                });
                localStorage.setItem('orgMembers', JSON.stringify(orgMembers));
                alert("Anggota Berhasil Masuk!");
                showSection('structure-view');
            }
            if(type === 'deadline') {
                data.forEach(row => {
                    deadlines.push({ id: Date.now()+Math.random(), date: row.Tanggal, time: row.Jam || "23:59", name: row.Tugas });
                });
                localStorage.setItem('deadlines', JSON.stringify(deadlines));
                showSection('deadline-view');
            }
        };
        reader.readAsBinaryString(file);
    }
}

// 3. COUNTDOWN TANPA SINGKATAN
function updateCountdowns() {
    document.querySelectorAll('.countdown').forEach(el => {
        const diff = new Date(el.dataset.target) - new Date();
        if(diff <= 0) { el.innerText = "WAKTU HABIS"; return; }
        const d = Math.floor(diff/86400000), h = Math.floor((diff/3600000)%24), m = Math.floor((diff/60000)%60), s = Math.floor((diff/1000)%60);
        el.innerText = `⏳ ${d} Hari ${h} Jam ${m} Menit ${s} Detik`;
    });
}

// 4. SAVE FUNCTIONS
function addSchedule() {
    const n = document.getElementById('sch-name').value;
    if(!n) return alert("Isi Nama Matkul!");
    schedule.push({
        id: Date.now(),
        day: document.getElementById('sch-day').value,
        time: document.getElementById('sch-time').value,
        name: n,
        lecturer: document.getElementById('sch-lecturer').value,
        room: document.getElementById('sch-room').value
    });
    saveAll();
    showSection('schedule-view');
}

function addMember() {
    const n = document.getElementById('org-name').value;
    if(!n) return alert("Isi Nama!");
    orgMembers.push({ id: Date.now(), name: n, role: document.getElementById('org-role').value, photo: document.getElementById('org-photo').value });
    saveAll();
    showSection('structure-view');
}

function saveTask() {
    const id = document.getElementById('edit-id').value;
    const date = document.getElementById('task-date').value;
    const name = document.getElementById('task-name').value;
    if(!date || !name) return alert("Isi data!");

    const task = { id: id || Date.now(), date, time: document.getElementById('task-time').value || "23:59", name };
    if(id) {
        const idx = deadlines.findIndex(t => t.id == id);
        deadlines[idx] = task;
    } else { deadlines.push(task); }
    
    saveAll();
    resetTaskForm();
    showSection('deadline-view');
}

// 5. GLOBAL HELPERS
function deleteData(arr, id) {
    if(confirm("Hapus?")) {
        if(arr === 'deadlines') deadlines = deadlines.filter(i => i.id != id);
        if(arr === 'schedule') schedule = schedule.filter(i => i.id != id);
        if(arr === 'orgMembers') orgMembers = orgMembers.filter(i => i.id != id);
        saveAll();
        location.reload();
    }
}

function saveAll() {
    localStorage.setItem('deadlines', JSON.stringify(deadlines));
    localStorage.setItem('schedule', JSON.stringify(schedule));
    localStorage.setItem('orgMembers', JSON.stringify(orgMembers));
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
    const isDark = document.body.classList.contains('dark-theme');
    document.getElementById('theme-link').innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode: Off";
}

function toggleMenu() {
    document.getElementById('side-menu').classList.toggle('open');
    document.getElementById('menu-overlay').classList.toggle('show');
}

function login() {
    if(document.getElementById('username').value === "Comcast" && document.getElementById('password').value === "2025") {
        localStorage.setItem('isAdmin', 'true');
        location.reload();
    } else { alert("Gagal!"); }
}

function logout() { localStorage.removeItem('isAdmin'); location.reload(); }

function renderDeadlines() {
    const tab = document.querySelector('.tab-btn.active').id.replace('tab-', '');
    const container = document.getElementById('week-display');
    const filtered = deadlines.filter(d => getCat(d.date) === tab);
    container.innerHTML = filtered.map(d => `
        <div class="item-card">
            <b>${d.date} | ${d.time}</b>
            <div class="task-detail">${d.name}</div>
            <span class="countdown" data-target="${d.date}T${d.time}"></span>
            ${isAdmin ? `
                <div class="btn-group">
                    <button onclick="editTask('${d.id}')" class="edit-btn">Edit</button>
                    <button onclick="deleteData('deadlines', '${d.id}')" class="del-btn">Hapus</button>
                </div>` : ''}
        </div>`).join('');
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

function resetTaskForm() {
    document.getElementById('form-title').innerText = "INPUT TUGAS";
    document.getElementById('edit-id').value = "";
    document.getElementById('task-name').value = "";
    document.getElementById('btn-cancel-edit').style.display = "none";
}

function shareDataToWA() {
    const payload = btoa(encodeURIComponent(JSON.stringify({d: deadlines, s: schedule, o: orgMembers})));
    window.open(`https://wa.me/?text=${encodeURIComponent(window.location.origin + window.location.pathname + "?upd=" + payload)}`);
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
    renderDeadlines();
    renderSchedule();
    renderStructure();
    setInterval(updateCountdowns, 1000);
};
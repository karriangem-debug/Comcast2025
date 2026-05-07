let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let gallery = JSON.parse(localStorage.getItem('gallery')) || [];
let currentEditType = null;
let currentEditId = null;

window.onload = () => {
    checkSync();
    updateUI();
    showSection('deadline-view');
};

function updateUI() {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    document.getElementById('nav-login').style.display = isAdmin ? 'none' : 'block';
    document.getElementById('nav-admin').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('nav-logout').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('admin-photo-input').style.display = isAdmin ? 'block' : 'none';
}

function login() {
    const u = document.getElementById('username').value, p = document.getElementById('password').value;
    if(u === "Comcast" && p === "2025") {
        localStorage.setItem('isAdmin', 'true');
        updateUI();
        showSection('admin-dashboard');
    } else { alert("Akses Ditolak!"); }
}

function logout() { localStorage.removeItem('isAdmin'); window.location.reload(); }

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'deadline-view') renderDeadlines();
    if(id === 'profile-view') renderGallery();
    if(id === 'admin-dashboard') renderAdminTaskList();
}

// --- DEADLINE LOGIC ---
function saveTask() {
    const date = document.getElementById('task-date').value;
    const time = document.getElementById('task-time').value || "00:00";
    const name = document.getElementById('task-name').value;
    if(!date || !name) return alert("Isi tanggal & detail!");
    deadlines.push({ id: Date.now(), date, time, name });
    localStorage.setItem('deadlines', JSON.stringify(deadlines));
    document.getElementById('task-name').value = "";
    renderAdminTaskList();
    alert("Berhasil!");
}

function renderAdminTaskList() {
    const list = document.getElementById('admin-task-list');
    list.innerHTML = "";
    [...deadlines].reverse().forEach(d => {
        list.innerHTML += `
            <div class="admin-card" style="border-left: 5px solid #ffd700;">
                <div style="font-size:0.75rem; color:#888;">${d.date} | ${d.time}</div>
                <div style="white-space: pre-line; margin: 5px 0;"><strong>${d.name}</strong></div>
                <div style="display:flex; gap:10px;">
                    <button onclick="openModal('task', ${d.id})" style="background:#f39c12; flex:1; padding:5px;">Edit</button>
                    <button onclick="deleteTask(${d.id})" style="background:#e74c3c; flex:1; padding:5px;">Hapus</button>
                </div>
            </div>`;
    });
}

// --- MODAL LOGIC (GELEMBUNG) ---
function openModal(type, id) {
    currentEditType = type;
    currentEditId = id;
    const modal = document.getElementById('edit-modal');
    const inputArea = document.getElementById('modal-inputs');
    modal.style.display = "block";

    if(type === 'task') {
        const t = deadlines.find(d => d.id === id);
        document.getElementById('modal-title').innerText = "Edit Deadline";
        inputArea.innerHTML = `
            <input type="date" id="modal-date" value="${t.date}">
            <input type="time" id="modal-time" value="${t.time}">
            <textarea id="modal-name" rows="4">${t.name}</textarea>`;
    } else {
        const p = gallery[id];
        document.getElementById('modal-title').innerText = "Edit Foto";
        inputArea.innerHTML = `
            <input type="text" id="modal-url" value="${p.url}">
            <input type="text" id="modal-cap" value="${p.caption}">`;
    }
}

function closeModal() { document.getElementById('edit-modal').style.display = "none"; }

function saveEditModal() {
    if(currentEditType === 'task') {
        const idx = deadlines.findIndex(d => d.id === currentEditId);
        deadlines[idx] = { ...deadlines[idx], date: document.getElementById('modal-date').value, time: document.getElementById('modal-time').value, name: document.getElementById('modal-name').value };
        localStorage.setItem('deadlines', JSON.stringify(deadlines));
        renderAdminTaskList();
    } else {
        let url = document.getElementById('modal-url').value;
        if(url.includes("drive.google.com")) {
            const id = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1];
            if(id) url = `https://lh3.googleusercontent.com/d/${id}`;
        }
        gallery[currentEditId] = { url, caption: document.getElementById('modal-cap').value };
        localStorage.setItem('gallery', JSON.stringify(gallery));
        renderGallery();
    }
    closeModal();
    alert("Update Sukses!");
}

function deleteTask(id) {
    if(confirm("Hapus tugas ini?")) {
        deadlines = deadlines.filter(d => d.id !== id);
        localStorage.setItem('deadlines', JSON.stringify(deadlines));
        renderAdminTaskList();
    }
}

// --- VIEW FILTERING ---
function filterDeadline(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${type}`).classList.add('active');
    const container = document.getElementById('week-display');
    container.innerHTML = "";

    const filtered = deadlines
        .sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
        .filter(d => getCategory(d.date, d.time) === type);

    if(filtered.length === 0) return container.innerHTML = "<p style='text-align:center; width:100%; color:#999;'>Tidak ada data.</p>";

    filtered.forEach(d => {
        const dayStr = new Date(d.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
        container.innerHTML += `<div class="day-card"><strong>${dayStr} - ${d.time}</strong><p>${d.name}</p></div>`;
    });
}

function getCategory(dStr, tStr) {
    const now = new Date(); now.setHours(0,0,0,0);
    const target = new Date(`${dStr}T${tStr}`);
    const targetDate = new Date(target); targetDate.setHours(0,0,0,0);
    const temp = new Date(now);
    const day = temp.getDay();
    const diff = temp.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(temp.setDate(diff)); mon.setHours(0,0,0,0);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);

    if (targetDate < now) return 'old';
    if (target >= mon && target <= sun) return 'now';
    return 'next';
}

// --- GALLERY ---
function renderGallery() {
    const container = document.getElementById('gallery-container');
    container.innerHTML = "";
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    gallery.forEach((item, index) => {
        container.innerHTML += `
            <div class="gallery-item">
                <img src="${item.url}">
                <div class="gallery-caption">${item.caption}</div>
                ${isAdmin ? `<div style="display:flex;"><button onclick="openModal('photo', ${index})" style="background:#f39c12; border-radius:0; flex:1; font-size:0.7rem;">Edit</button><button onclick="deletePhoto(${index})" style="background:#e74c3c; border-radius:0; flex:1; font-size:0.7rem;">Hapus</button></div>` : ''}
            </div>`;
    });
}

function addPhoto() {
    let url = document.getElementById('new-photo-url').value;
    const cap = document.getElementById('new-photo-caption').value || "Comcast";
    if(!url) return;
    if(url.includes("drive.google.com")) {
        const id = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1];
        if(id) url = `https://lh3.googleusercontent.com/d/${id}`;
    }
    gallery.push({ url, caption: cap });
    localStorage.setItem('gallery', JSON.stringify(gallery));
    document.getElementById('new-photo-url').value = "";
    renderGallery();
    alert("Foto ditambahkan!");
}

function deletePhoto(index) {
    if(confirm("Hapus foto?")) {
        gallery.splice(index, 1);
        localStorage.setItem('gallery', JSON.stringify(gallery));
        renderGallery();
    }
}

// --- SYNC ---
function shareLink() {
    const data = btoa(JSON.stringify({ d: deadlines, g: gallery }));
    const link = window.location.origin + window.location.pathname + "?update=" + data;
    window.open(`https://wa.me/?text=${encodeURIComponent("Update Comcast 2025:\n" + link)}`);
}

function checkSync() {
    const params = new URLSearchParams(window.location.search);
    const up = params.get('update');
    if(up) {
        if(confirm("Update data terbaru?")) {
            const decoded = JSON.parse(atob(up));
            localStorage.setItem('deadlines', JSON.stringify(decoded.d));
            localStorage.setItem('gallery', JSON.stringify(decoded.g));
            window.location.href = window.location.pathname + "?status=ok";
        }
    }
    if(params.get('status') === 'ok') {
        document.getElementById('sync-alert').style.display = 'block';
        setTimeout(() => document.getElementById('sync-alert').style.display = 'none', 3000);
    }
}
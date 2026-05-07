let deadlines = JSON.parse(localStorage.getItem('deadlines')) || [];
let gallery = JSON.parse(localStorage.getItem('gallery')) || [];

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if(id === 'deadline-view') renderDeadlines();
    if(id === 'profile-view') renderGallery();
    if(id === 'admin-dashboard') renderAdminList();
    applyAdminUI();
}

function getWeekCategory(dateStr, timeStr) {
    const now = new Date();
    const target = new Date(`${dateStr}T${timeStr}`);
    const tempDate = new Date(now);
    const day = tempDate.getDay();
    const diff = tempDate.getDate() - day + (day === 0 ? -6 : 1);
    const mondayThisWeek = new Date(tempDate.setDate(diff));
    mondayThisWeek.setHours(0,0,0,0);
    const sundayThisWeek = new Date(mondayThisWeek);
    sundayThisWeek.setDate(mondayThisWeek.getDate() + 6);
    sundayThisWeek.setHours(23,59,59,999);

    if (target < now) return 'old';
    if (target >= mondayThisWeek && target <= sundayThisWeek) return 'now';
    return 'next';
}

function filterDeadline(type) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${type}`).classList.add('active');
    const container = document.getElementById('week-display');
    container.innerHTML = "";
    
    const filtered = deadlines
        .sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`))
        .filter(d => getWeekCategory(d.date, d.time) === type);

    if(filtered.length === 0) {
        container.innerHTML = "<p style='text-align:center; width:100%; color:#999; font-size:0.8rem;'>Tidak ada tugas.</p>";
        return;
    }

    filtered.forEach(d => {
        const dateObj = new Date(d.date);
        const dayStr = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
        container.innerHTML += `<div class="day-card"><strong>${dayStr} (${d.time})</strong><p>${d.name}</p></div>`;
    });
}

function renderDeadlines() { filterDeadline('now'); }

function login() {
    const u = document.getElementById('username').value, p = document.getElementById('password').value;
    if(u === "Comcast" && p === "2025") {
        localStorage.setItem('isLoggedIn', 'true');
        showSection('admin-dashboard');
    } else alert("Salah!");
}

function applyAdminUI() {
    const isAdmin = localStorage.getItem('isLoggedIn') === 'true';
    document.getElementById('logout-btn').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('admin-add-nav').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('admin-login-btn').style.display = isAdmin ? 'none' : 'block';
    if(document.getElementById('admin-gallery-controls')) {
        document.getElementById('admin-gallery-controls').style.display = isAdmin ? 'block' : 'none';
    }
}

function logout() { localStorage.removeItem('isLoggedIn'); location.reload(); }

// GALLERY LOGIC (WITH AUTO DRIVE CONVERSION)
function renderGallery() {
    const container = document.getElementById('gallery-container');
    container.innerHTML = "";
    const isAdmin = localStorage.getItem('isLoggedIn') === 'true';

    if(gallery.length === 0) {
        container.innerHTML = "<p style='grid-column: span 2; text-align:center; color:#999;'>Belum ada foto kegiatan.</p>";
        return;
    }

    gallery.forEach((item, index) => {
        container.innerHTML += `
            <div class="gallery-item">
                ${isAdmin ? `<button class="btn-delete-photo" onclick="deletePhoto(${index})">✕</button>` : ''}
                <img src="${item.url}" onerror="this.src='https://via.placeholder.com/300?text=Link+Foto+Error'">
                <div class="gallery-caption">${item.caption}</div>
            </div>`;
    });
}

function addGalleryPhoto() {
    let url = document.getElementById('new-photo-url').value;
    const caption = document.getElementById('new-photo-caption').value;

    if(!url) return alert("Masukkan link foto!");

    // Konversi Otomatis Google Drive
    if(url.includes("drive.google.com")) {
        const id = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1];
        if(id) url = `https://lh3.googleusercontent.com/d/${id}`;
    }

    gallery.push({ url, caption: caption || "Kegiatan Comcast" });
    localStorage.setItem('gallery', JSON.stringify(gallery));
    document.getElementById('new-photo-url').value = "";
    document.getElementById('new-photo-caption').value = "";
    renderGallery();
}

function deletePhoto(index) {
    if(confirm("Hapus foto ini?")) {
        gallery.splice(index, 1);
        localStorage.setItem('gallery', JSON.stringify(gallery));
        renderGallery();
    }
}

// DEADLINE ADMIN LOGIC
function saveDeadline() {
    const date = document.getElementById('task-date').value, time = document.getElementById('task-time').value, name = document.getElementById('task-name').value;
    if(!date || !time || !name) return alert("Isi semua data!");
    deadlines.push({ id: Date.now(), date, time, name });
    localStorage.setItem('deadlines', JSON.stringify(deadlines));
    document.getElementById('task-name').value = "";
    renderAdminList();
}

function renderAdminList() {
    const list = document.getElementById('admin-deadline-list');
    list.innerHTML = "";
    [...deadlines].reverse().forEach(d => {
        list.innerHTML += `<li style="border-bottom:1px solid #eee; padding:10px 0; list-style:none; font-size:0.8rem;">
            <b>${d.date}</b> - ${d.name.substring(0,30)}...<br>
            <button onclick="editDeadline(${d.id})" style="background:var(--warning); width:auto; padding:4px 10px; font-size:10px; margin-top:5px;">Edit</button>
            <button onclick="deleteDeadline(${d.id})" style="background:var(--danger); width:auto; padding:4px 10px; font-size:10px; margin-left:5px;">Hapus</button>
        </li>`;
    });
}

function editDeadline(id) {
    const t = deadlines.find(d => d.id === id);
    document.getElementById('task-date').value = t.date;
    document.getElementById('task-time').value = t.time;
    document.getElementById('task-name').value = t.name;
    deadlines = deadlines.filter(d => d.id !== id);
    renderAdminList();
    window.scrollTo({top: 0, behavior: 'smooth'});
}

function deleteDeadline(id) {
    if(confirm("Hapus?")) {
        deadlines = deadlines.filter(d => d.id !== id);
        localStorage.setItem('deadlines', JSON.stringify(deadlines));
        renderAdminList();
    }
}

window.onload = () => { showSection('deadline-view'); };
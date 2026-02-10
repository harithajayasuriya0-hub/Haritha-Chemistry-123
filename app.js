// State Management
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [];
let contentData = JSON.parse(localStorage.getItem('contentData')) || {
    liveClasses: { '2026': [], '2027': [], '2028': [] },
    videos: {
        'Atomic Structure': [], 'Structure & Bonding': [], 'Chemical Calc': [],
        'Gaseous State': [], 'Energetics': [], 'S P D Blocks': [],
        'Organic': [], 'Kinetics': [], 'Equilibrium': [],
        'Electrochemistry': [], 'Industrial': []
    },
    materials: {
        papers: { '2026': [], '2027': [], '2028': [] },
        tutes: { '2026': [], '2027': [], '2028': [] }
    }
};

const ADMIN_PHONE = "0701417838";

document.addEventListener('DOMContentLoaded', () => {
    if (currentUser) {
        showDashboard();
    } else {
        showAuth();
    }
    setupEventListeners();
});

function setupEventListeners() {
    const regForm = document.getElementById('register-form');
    if (regForm) regForm.addEventListener('submit', (e) => { e.preventDefault(); handleRegister(); });

    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });

    const payForm = document.getElementById('payment-form');
    if (payForm) payForm.addEventListener('submit', handlePayment);
}

// Navigation
window.navigateTo = function (viewId) {
    if (!currentUser && viewId !== 'auth') {
        showAuth();
        return;
    }

    if (!currentUser.isAdmin && ['live-class', 'videos', 'materials'].includes(viewId)) {
        if (!currentUser.hasPaid) {
            alert("Access Denied.\nPlease complete payment and wait for approval.\nකරුණාකර පන්ති ගාස්තු ගෙවා ස්ලිප්පත අප්ලෝඩ් කරන්න.");
            viewId = 'payments';
        }
    }

    document.querySelectorAll('.section-content, #dashboard-section, #auth-section').forEach(el => el.classList.add('hidden'));

    if (viewId === 'dashboard') {
        showDashboard();
        return;
    }

    const sectionId = viewId.endsWith('-section') ? viewId : `${viewId}-section`;
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        renderSectionContent(viewId);
    }
}

function showAuth() {
    document.getElementById('auth-section').classList.remove('hidden');
    document.querySelector('header').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('dashboard-section').classList.remove('hidden');
    document.querySelector('header').classList.remove('hidden');
    document.getElementById('user-name-display').textContent = currentUser.name + (currentUser.isAdmin ? ' (Admin)' : '');
    document.getElementById('user-profile').classList.remove('hidden');

    // Add Admin Panel Button if admin
    const grid = document.querySelector('.dashboard-grid');
    if (currentUser.isAdmin && !document.getElementById('admin-panel-card')) {
        const adminCard = document.createElement('div');
        adminCard.className = 'glass-card dashboard-card';
        adminCard.id = 'admin-panel-card';
        adminCard.innerHTML = `<i class="fa-solid fa-users-gear card-icon" style="color:var(--danger)"></i><div class="card-title">Admin Panel</div><p>Manage Students</p>`;
        adminCard.onclick = () => renderAdminPanel();
        grid.appendChild(adminCard);
    }
}

window.showLogin = () => {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

window.showRegister = () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

window.logout = () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    window.location.reload();
}

function handleLogin() {
    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;
    const user = users.find(u => u.phone === phone && u.password === password);

    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showDashboard();
    } else {
        alert("Invalid Credentials");
    }
}

function handleRegister() {
    const phone = document.getElementById('reg-phone').value;
    if (users.find(u => u.phone === phone)) {
        alert("User already exists!");
        return;
    }

    const password = document.getElementById('reg-password').value;
    if (password !== document.getElementById('reg-confirm-password').value) {
        alert("Passwords do not match");
        return;
    }

    const newUser = {
        name: document.getElementById('reg-name').value,
        phone,
        password,
        year: document.getElementById('reg-year').value,
        isAdmin: phone === ADMIN_PHONE,
        hasPaid: false, // Default
        registeredAt: new Date().toISOString()
    };

    users.push(newUser);
    saveData();
    currentUser = newUser;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    alert("Registration Successful!");
    showDashboard();
}

// Content Rendering
function renderSectionContent(viewId) {
    if (viewId === 'live-class') renderLiveTable(currentUser.year || '2026');
    if (viewId === 'materials') renderMaterials(currentUser.year || '2026');
}

window.renderLiveTable = (year) => {
    const container = document.getElementById('live-table-container');
    const data = contentData.liveClasses[year] || [];
    let html = `<h3>${year} Schedule</h3>`;

    if (currentUser.isAdmin) {
        html += `<div class="upload-controls">
            <input type="date" id="live-date">
            <input type="time" id="live-time">
            <input type="text" id="live-link" placeholder="Zoom Link">
            <button class="btn btn-primary" onclick="addLiveData('${year}')">Add Class</button>
        </div>`;
    }

    html += `<table><thead><tr><th>Date</th><th>Time</th><th>Link</th>${currentUser.isAdmin ? '<th>Action</th>' : ''}</tr></thead><tbody>`;
    data.forEach((item, idx) => {
        html += `<tr><td>${item.date}</td><td>${item.time}</td><td><a href="${item.link}" target="_blank" class="btn btn-secondary">Join</a></td>
        ${currentUser.isAdmin ? `<td><button onclick="deleteLiveData('${year}', ${idx})">Delete</button></td>` : ''}</tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;
}

window.addLiveData = (year) => {
    const date = document.getElementById('live-date').value;
    const time = document.getElementById('live-time').value;
    const link = document.getElementById('live-link').value;
    if (date && time && link) {
        contentData.liveClasses[year].push({ date, time, link });
        saveData();
        renderLiveTable(year);
    }
}

window.deleteLiveData = (year, idx) => {
    contentData.liveClasses[year].splice(idx, 1);
    saveData();
    renderLiveTable(year);
}

// Video Logic
window.showVideoTopic = (topic) => {
    const container = document.getElementById('video-list-container');
    const videos = contentData.videos[topic] || [];
    let html = `<h3>${topic}</h3>`;

    if (currentUser.isAdmin) {
        html += `<div class="upload-controls">
            <input type="text" id="vid-title" placeholder="Title">
            <input type="text" id="vid-url" placeholder="URL">
            <button class="btn btn-primary" onclick="addVideoData('${topic}')">Add Video</button>
        </div>`;
    }

    html += `<div style="display:grid; grid-template-columns: repeat(auto-fill, 250px); gap:1rem;">` +
        videos.map((v, i) => `
        <div class="glass-card">
            <h4>${v.title}</h4>
            <a href="${v.url}" target="_blank" class="btn btn-secondary">Watch</a>
            ${currentUser.isAdmin ? `<button onclick="deleteVideoData('${topic}', ${i})" style="color:red">Delete</button>` : ''}
        </div>
    `).join('') + `</div>`;

    container.innerHTML = html;
}

window.addVideoData = (topic) => {
    const title = document.getElementById('vid-title').value;
    const url = document.getElementById('vid-url').value;
    if (title && url) {
        if (!contentData.videos[topic]) contentData.videos[topic] = [];
        contentData.videos[topic].push({ title, url });
        saveData();
        showVideoTopic(topic);
    }
}

window.deleteVideoData = (topic, idx) => {
    contentData.videos[topic].splice(idx, 1);
    saveData();
    showVideoTopic(topic);
}

// Materials Logic
window.renderMaterials = (year) => {
    const pList = document.getElementById('papers-list');
    const tList = document.getElementById('tutes-list');

    // Helper to render lists
    const renderList = (type, listContainer) => {
        const items = contentData.materials[type][year] || [];
        let html = '';
        if (currentUser.isAdmin) {
            html += `<div class="upload-controls">
                <input type="text" id="new-${type}-title" placeholder="Title">
                <input type="text" id="new-${type}-link" placeholder="PDF Link">
                <button class="btn btn-primary" onclick="addMaterial('${type}', '${year}')">Upload</button>
            </div>`;
        }
        html += items.map((item, idx) => `
            <div class="glass-card" style="margin-bottom:0.5rem; padding:1rem;">
                <span>${item.title}</span>
                <a href="${item.link}" target="_blank" style="float:right">Download</a>
                ${currentUser.isAdmin ? `<button onclick="deleteMaterial('${type}', '${year}', ${idx})" style="color:red; float:right; margin-right:1rem;">Delete</button>` : ''}
            </div>
        `).join('');
        listContainer.innerHTML = html;
    };

    renderList('papers', pList);
    renderList('tutes', tList);
}

window.addMaterial = (type, year) => {
    const title = document.getElementById(`new-${type}-title`).value;
    const link = document.getElementById(`new-${type}-link`).value;
    if (title && link) {
        if (!contentData.materials[type][year]) contentData.materials[type][year] = [];
        contentData.materials[type][year].push({ title, link });
        saveData();
        renderMaterials(year);
    }
}

window.deleteMaterial = (type, year, idx) => {
    contentData.materials[type][year].splice(idx, 1);
    saveData();
    renderMaterials(year);
}

// Admin Panel Logic
window.renderAdminPanel = () => {
    document.querySelectorAll('.section-content, #dashboard-section').forEach(el => el.classList.add('hidden'));

    // Create Admin Section Dynamically if not exists
    let section = document.getElementById('admin-section');
    if (!section) {
        section = document.createElement('section');
        section.id = 'admin-section';
        section.className = 'container glass-card';
        section.innerHTML = `
            <h2>Student Management</h2>
            <button class="btn btn-secondary" onclick="showDashboard()">Back</button>
            <div id="student-list" style="margin-top:1rem;"></div>
        `;
        document.querySelector('main').appendChild(section);
    }
    section.classList.remove('hidden');

    const listContainer = document.getElementById('student-list');
    listContainer.innerHTML = `<table>
        <thead><tr><th>Name</th><th>Phone</th><th>Year</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
        ${users.map((u, idx) => `
            <tr>
                <td>${u.name}</td>
                <td>${u.phone}</td>
                <td>${u.year}</td>
                <td style="color:${u.hasPaid ? 'green' : 'red'}">${u.hasPaid ? 'Paid' : 'Pending'}</td>
                <td>
                    <button class="btn btn-secondary" onclick="togglePayment(${idx})">
                        ${u.hasPaid ? 'Revoke' : 'Approve'}
                    </button>
                </td>
            </tr>
        `).join('')}
        </tbody>
    </table>`;
}

window.togglePayment = (idx) => {
    users[idx].hasPaid = !users[idx].hasPaid;
    saveData();
    renderAdminPanel();
}

function handlePayment(e) {
    e.preventDefault();
    const month = document.getElementById('pay-month').value;
    // Simulate upload
    const msg = `Student Name: ${currentUser.name}%0AClass: ${currentUser.year}%0AMonth: ${month}%0AStatus: Paid (Slip Uploaded)`;
    const waLink = `https://wa.me/94701417838?text=${msg}`;
    window.open(waLink, '_blank');
    alert("Slip info sent to WhatsApp. Waiting for Admin Approval.");
}

function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('contentData', JSON.stringify(contentData));
}

window.recoverPassword = function () {
    const phone = prompt("Enter your registered Phone Number:");
    const user = users.find(u => u.phone === phone);
    if (user) {
        const otp = Math.floor(1000 + Math.random() * 9000);
        alert(`OTP Sent to ${phone}: ${otp}`);
        const enteredOtp = prompt("Enter OTP:");
        if (enteredOtp == otp) {
            const newPass = prompt("Enter New Password:");
            user.password = newPass;
            saveData();
            alert("Password Reset Successful.");
        } else {
            alert("Invalid OTP.");
        }
    } else {
        alert("User not found.");
    }
}

const API_BASE_URL = 'http://localhost:5000/api';

/* =========================
AUTH
========================= */
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser') || 'null');
}

function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}

/* =========================
LOGIN
========================= */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      setCurrentUser(data.user);

      // role redirect
      if (data.user.role === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else if (data.user.role === 'seller') {
        window.location.href = 'seller-dashboard.html';
      } else {
        window.location.href = 'buyer-dashboard.html';
      }

    } catch (err) {
      alert("Server not responding");
    }
  });
}

/* =========================
ADMIN DASHBOARD
========================= */
async function loadAdminDashboard() {
  try {
    const [usersRes, wasteRes, reqRes] = await Promise.all([
      fetch(`${API_BASE_URL}/admin/users`),
      fetch(`${API_BASE_URL}/admin/waste`),
      fetch(`${API_BASE_URL}/requests`)
    ]);

    const users = await usersRes.json();
    const waste = await wasteRes.json();
    const requests = await reqRes.json();

    document.getElementById('totalUsers').innerText = users.length || 0;
    document.getElementById('totalWaste').innerText = waste.length || 0;
    document.getElementById('totalRequests').innerText = requests.length || 0;

    const userTable = document.getElementById('usersTable');
    if (userTable) {
      userTable.innerHTML = users.map(u => `
        <tr>
          <td>${u.id}</td>
          <td>${u.full_name}</td>
          <td>${u.email}</td>
          <td>${u.role}</td>
        </tr>
      `).join('');
    }

    const wasteTable = document.getElementById('adminWasteTable');
    if (wasteTable) {
      wasteTable.innerHTML = waste.map(w => `
        <tr>
          <td>${w.name}</td>
          <td>${w.type}</td>
          <td>${w.quantity}</td>
          <td>${w.seller_id}</td>
        </tr>
      `).join('');
    }

  } catch (err) {
    console.log("Dashboard error:", err);
  }
}

/* =========================
SELLER DASHBOARD
========================= */
async function loadSellerDashboard() {
  const user = JSON.parse(localStorage.getItem("currentUser"));

  if (!user || !user.id) {
    console.log("User missing");
    return;
  }

  const res = await fetch(`${API_BASE_URL}/waste/my/${user.id}`);
  const posts = await res.json();

  console.log("POST COUNT:", posts.length);

  const el = document.getElementById("totalPosts");
  if (el) el.innerText = posts.length;
}

/* =========================
SELLER POSTS (MY POSTS PAGE)
========================= */
async function loadSellerPosts() {
  const user = getCurrentUser();
  if (!user) return;

  try {
    const res = await fetch(`${API_BASE_URL}/waste/my/${user.id}`);
    const data = await res.json();

    const tbody = document.getElementById('sellerPostsBody');
    if (!tbody) return;

    if (!data.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align:center;">No posts yet</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.map(p => `
      <tr>
        <td>${p.name}</td>
        <td>${p.type}</td>
        <td>${p.quantity}</td>
        <td>${p.location}</td>
        <td>${p.description}</td>
      </tr>
    `).join('');

  } catch (err) {
    console.log(err);
  }
}

/* =========================
SELLER POST FORM
========================= */
function initSellerPostForm() {
  const form = document.getElementById('sellerPostForm');
  const msg = document.getElementById('msg');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = getCurrentUser();
    if (!user) {
      msg.innerText = "Please login first";
      msg.style.color = "red";
      return;
    }

    const data = {
      name: document.getElementById('postName').value,
      type: document.getElementById('postType').value,
      quantity: document.getElementById('postQuantity').value,
      location: document.getElementById('postLocation').value,
      description: document.getElementById('postDescription').value,
      seller_id: user.id
    };

    try {
      msg.innerText = "Posting...";
      msg.style.color = "blue";

      const res = await fetch(`${API_BASE_URL}/waste`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();

      if (!res.ok) {
        msg.innerText = "Failed to post";
        msg.style.color = "red";
        return;
      }

      msg.innerText = "Posted successfully!";
      msg.style.color = "green";

      form.reset();

      setTimeout(() => {
        window.location.href = "seller-my-posts.html";
      }, 1000);

    } catch (err) {
      msg.innerText = "Server error";
      msg.style.color = "red";
    }
  });
}

/* =========================
INIT (ONLY ONE - CLEAN SYSTEM)
========================= */
document.addEventListener('DOMContentLoaded', () => {

  if (document.getElementById('loginForm')) {
    initLoginForm();
  }

  if (document.getElementById('usersTable')) {
    loadAdminDashboard();
  }

  if (document.getElementById('totalPosts')) {
    loadSellerDashboard();
  }

  if (document.getElementById('sellerPostsBody')) {
    loadSellerPosts();
  }

  if (document.getElementById('sellerPostForm')) {
    initSellerPostForm();
  }
});
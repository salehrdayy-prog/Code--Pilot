document.addEventListener("DOMContentLoaded", () => {

  const table = document.getElementById('userTable');
  const logoutBtn = document.getElementById('logout');

  // ======================
  // 🔐 چک سشن
  // ======================
  const session = JSON.parse(localStorage.getItem('session'));
  const users = JSON.parse(localStorage.getItem('users')) || [];

  const currentUser = users.find(u => u.id === session?.id);

  if (!session || !currentUser || currentUser.role !== 'admin') {
    window.location.href = "login.html";
    return;
  }

  // ======================
  // 📦 Storage
  // ======================
  function getUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
  }

  function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  // ======================
  // 🎨 رندر
  // ======================
  function render() {
    const users = getUsers();

    table.innerHTML = "";

    users.forEach(user => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${user.name}</td>
        <td>${user.phone}</td>
        <td>${user.email}</td>
        <td>${user.createdAt || '-'}</td>
        <td>${user.status}</td>
        <td>
          ${user.role !== 'admin'
            ? `<button data-id="${user.id}" class="delete">حذف</button>`
            : `<span style="color:red">ادمین</span>`
          }
        </td>
      `;

      table.appendChild(tr);
    });
  }

  // ======================
  // ❌ حذف کاربر
  // ======================
  table.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete')) return;

    const id = Number(e.target.dataset.id);
    let users = getUsers();

    users = users.filter(u => u.id !== id);

    saveUsers(users);
    render();
  });

  // ======================
  // 🚪 خروج
  // ======================
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('session');
    window.location.href = "login.html";
  });

  // ======================
  // 🚀 اجرا
  // ======================
  render();

});
// ============================================================
//  مدیریت سفارشات سکه (Admin Panel)
// ============================================================

function loadCoinOrders() {
    const orders = JSON.parse(localStorage.getItem('coin_orders')) || [];
    const container = document.getElementById('ordersList');
    if (!container) return;

    if (orders.length === 0) {
        container.innerHTML = `<p style="color: #8aa3c9;">هنوز سفارشی ثبت نشده است.</p>`;
        return;
    }

    container.innerHTML = orders.map((order, index) => `
        <div class="order-item">
            <div>
                <strong>${order.label}</strong>
                <br>
                <small>تاریخ: ${order.date}</small>
                <br>
                <span class="status-${order.status}">${order.status === 'pending' ? '⏳ در انتظار' : '✅ تأیید شده'}</span>
            </div>
            <div>
                <button onclick="approveOrder(${index})" ${order.status === 'approved' ? 'disabled' : ''}>
                    تأیید و اضافه
                </button>
                <button onclick="rejectOrder(${index})" ${order.status === 'rejected' ? 'disabled' : ''}>
                    رد
                </button>
            </div>
        </div>
    `).join('');
}

// ===== تأیید سفارش =====
function approveOrder(index) {
    const orders = JSON.parse(localStorage.getItem('coin_orders')) || [];
    const order = orders[index];
    if (!order || order.status === 'approved') return;

    // اضافه کردن سکه به کاربر
    // (در اینجا باید کاربر رو پیدا کنی و سکه‌ها رو بهش اضافه کنی)
    // فعلاً به صورت شبیه‌سازی شده:
    alert(`✅ سفارش ${order.label} تأیید شد!`);

    // تغییر وضعیت سفارش
    orders[index].status = 'approved';
    localStorage.setItem('coin_orders', JSON.stringify(orders));
    loadCoinOrders();
}

// ===== رد سفارش =====
function rejectOrder(index) {
    const orders = JSON.parse(localStorage.getItem('coin_orders')) || [];
    const order = orders[index];
    if (!order || order.status === 'rejected') return;

    if (!confirm(`آیا مطمئنید که می‌خواهید سفارش ${order.label} را رد کنید؟`)) return;

    orders[index].status = 'rejected';
    localStorage.setItem('coin_orders', JSON.stringify(orders));
    loadCoinOrders();
}

// ===== بارگذاری سفارشات در لود صفحه =====
document.addEventListener('DOMContentLoaded', loadCoinOrders);
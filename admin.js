document.addEventListener("DOMContentLoaded", async () => {
  // ======================
  // 🔐 چک سشن ادمین
  // ======================
  const session = JSON.parse(localStorage.getItem('session'));
  if (!session || session.role !== 'admin') {
    window.location.href = "login.html";
    return;
  }

  const table = document.getElementById('userTable');
  const logoutBtn = document.getElementById('logout');
  const searchInput = document.getElementById('search');
  const userCountEl = document.getElementById('userCount');
  const ordersList = document.getElementById('ordersList');
  
  let allUsers = [];
  let allOrders = [];

  // ======================
  // 🎨 رندر جدول کاربران
  // ======================
  function renderUsers(usersToRender) {
    table.innerHTML = "";
    userCountEl.textContent = `👥 تعداد کل کاربران: ${allUsers.length} نفر (نمایش ${usersToRender.length} نتیجه)`;

    if (usersToRender.length === 0) {
      table.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#8aa3c9;">کاربری پیدا نشد</td></tr>';
      return;
    }

    usersToRender.forEach(user => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.name || 'نامشخص'}</td>
        <td>${user.phone || user.email || '-'}</td>
        <td>${new Date().toLocaleDateString('fa-IR')}</td> 
        <td>${user.role === 'admin' ? '<span style="color:#8b5cf6">ادمین</span>' : '<span style="color:#4ade80">کاربر</span>'}</td>
        <td class="action-btns">
          ${user.role !== 'admin' ? `
            <button class="edit" onclick="alert('ویرایش در نسخه بعدی')">ویرایش</button>
            <button class="delete" onclick="alert('حذف در نسخه بعدی')">حذف</button>
          ` : `<span style="color:#8aa3c9">-</span>`}
        </td>
      `;
      table.appendChild(tr);
    });
  }

  // ======================
  // 📦 رندر سفارشات
  // ======================
  function renderOrders(orders) {
    if (!ordersList) return;
    if (orders.length === 0) {
      ordersList.innerHTML = `<p style="color: #8aa3c9;">هنوز سفارشی ثبت نشده است.</p>`;
      return;
    }

    ordersList.innerHTML = orders.map((order) => `
      <div class="order-item">
        <div>
          <strong>${order.label}</strong>
          <br><small style="color:#c4b5fd">خریدار: ${order.buyer_name || 'نامشخص'}</small>
          <br><small>تاریخ: ${order.date}</small>
          <br><span style="color:${order.status === 'pending' ? '#facc15' : order.status === 'approved' ? '#4ade80' : '#f85149'}">
            ${order.status === 'pending' ? '⏳ در انتظار' : order.status === 'approved' ? '✅ تأیید شده' : '❌ رد شده'}
          </span>
        </div>
        <div>
          <button class="approve" onclick="approveOrder(${order.id})" ${order.status !== 'pending' ? 'disabled' : ''}>
            تأیید و اضافه سکه
          </button>
        </div>
      </div>
    `).join('');
  }

  // ======================
  // 🔄 دریافت اطلاعات از سرور
  // ======================
  async function fetchData() {
    userCountEl.textContent = "در حال دریافت اطلاعات...";
    
    // گرفتن کاربران
    const usersRes = await getAllUsers();
    if (usersRes.ok) {
      allUsers = usersRes.data.users;
      renderUsers(allUsers);
    } else {
      userCountEl.textContent = "❌ خطا در دریافت کاربران";
    }

    // گرفتن سفارشات
    const ordersRes = await getAllOrders();
    if (ordersRes.ok) {
      allOrders = ordersRes.data.orders;
      renderOrders(allOrders);
    }
  }

  // ======================
  // 🔍 جستجو
  // ======================
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) {
      renderUsers(allUsers);
      return;
    }
    const filtered = allUsers.filter(u => 
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
    renderUsers(filtered);
  });

  // ======================
  // ✅ تایید سفارش
  // ======================
  window.approveOrder = async function(orderId) {
    if (!confirm('آیا از تایید این سفارش و اضافه کردن سکه مطمئن هستید؟')) return;
    
    const res = await approveCoinOrder(orderId);
    if (res.ok) {
      alert('✅ سفارش با موفقیت تایید شد.');
      fetchData(); // بروزرسانی لیست
    } else {
      alert('❌ خطا در تایید سفارش: ' + res.error);
    }
  };

  // ======================
  // 🚪 خروج
  // ======================
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('session');
    localStorage.removeItem('loggedInUser');
    window.location.href = "login.html";
  });

  // اجرای اولیه
  fetchData();
});
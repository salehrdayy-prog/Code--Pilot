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
  
  // 👈 آدرس سرور (بدون /api در انتها، چون توی fetch اضافه میشه)
  const SERVER_URL = "https://code-pilot-5.onrender.com";

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
  // 📦 رندر سفارشات (با استایل زیبا)
  // ======================
  function renderOrders(orders) {
    if (!ordersList) return;
    
    if (orders.length === 0) {
      ordersList.innerHTML = `<p style="color: #8aa3c9; text-align: center; padding: 20px;">هنوز سفارشی ثبت نشده است.</p>`;
      return;
    }

    ordersList.innerHTML = orders.map((order) => `
      <div class="order-item" style="border: 1px solid rgba(139, 92, 246, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <strong style="color:#c4b5fd; font-size: 16px;">${order.label}</strong>
          <br><small style="color:#8aa3c9;">خریدار: ${order.buyer_name || 'نامشخص'}</small>
          <br><small style="color:#8aa3c9;">تاریخ: ${order.date}</small>
          <br><span style="color:${order.status === 'pending' ? '#facc15' : order.status === 'approved' ? '#4ade80' : '#f85149'}; font-weight: bold;">
            ${order.status === 'pending' ? '⏳ در انتظار' : order.status === 'approved' ? '✅ تأیید شده' : '❌ رد شده'}
          </span>
        </div>
        <div>
          <button onclick="approveOrder(${order.id})" ${order.status !== 'pending' ? 'disabled' : ''} 
            style="background:${order.status === 'pending' ? '#238636' : '#333'}; color:white; border:none; padding:10px 16px; border-radius:8px; cursor:${order.status === 'pending' ? 'pointer' : 'not-allowed'}; font-family: inherit; font-weight: bold;">
            ${order.status === 'pending' ? 'تأیید و اضافه سکه' : 'تأیید شده'}
          </button>
        </div>
      </div>
    `).join('');
  }

  // ======================
  // 🔄 دریافت اطلاعات از سرور (مستقیم)
  // ======================
  async function fetchData() {
    userCountEl.textContent = "در حال دریافت اطلاعات...";

    // صبر برای بیدار شدن سرور رایگان
    await new Promise(resolve => setTimeout(resolve, 2000));

    // ۱. گرفتن کاربران
    try {
      const usersRes = await fetch(`${SERVER_URL}/api/admin/users`);
      const usersData = await usersRes.json();
      if (usersData.ok) {
        allUsers = usersData.users;
        renderUsers(allUsers);
      }
    } catch (err) { 
      userCountEl.textContent = "❌ خطا در دریافت کاربران"; 
      console.error(err); 
    }

    // ۲. گرفتن سفارشات
    try {
      const ordersRes = await fetch(`${SERVER_URL}/api/admin/orders`);
      const ordersData = await ordersRes.json();
      if (ordersData.ok) {
        allOrders = ordersData.orders;
        renderOrders(allOrders);
      }
    } catch (err) { 
      console.error("خطا در سفارشات", err); 
    }
  }

  // ======================
  // 🔍 جستجو
  // ======================
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderUsers(allUsers); return; }
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
    
    try {
      const res = await fetch(`${SERVER_URL}/api/admin/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      
      if (data.ok) {
        alert('✅ سفارش تایید شد و سکه‌ها به کاربر اضافه شد.');
        fetchData(); // بروزرسانی لیست
      } else {
        alert('❌ خطا در تایید: ' + data.error);
      }
    } catch (err) {
      alert('❌ خطا در ارتباط با سرور');
      console.error(err);
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
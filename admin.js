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
  
  // 👈 آدرس مستقیم سرور (بدون واسطه api.js)
  const API_URL = "https://code-pilot-5.onrender.com/api";

  let allUsers = [];

  // ======================
  // 🎨 رندر جدول
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
  // 🔄 دریافت کاربران (مستقیم از سرور)
  // ======================
  async function fetchUsers() {
    userCountEl.textContent = "در حال دریافت اطلاعات...";
    
    // صبر برای بیدار شدن سرور
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const res = await fetch(`${API_URL}/admin/users`);
      const data = await res.json();
      
      if (data.ok && data.users) {
        allUsers = data.users;
        renderUsers(allUsers);
      } else {
        userCountEl.textContent = "❌ خطا در داده‌های دریافتی";
      }
    } catch (err) {
      console.error(err);
      userCountEl.textContent = "❌ خطا در ارتباط با سرور";
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
  // 🚪 خروج
  // ======================
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('session');
    localStorage.removeItem('loggedInUser');
    window.location.href = "login.html";
  });

  // اجرای اولیه
  fetchUsers();
});
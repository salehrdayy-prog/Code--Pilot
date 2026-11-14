document.addEventListener("DOMContentLoaded", async () => {
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
  const userMessagesList = document.getElementById('userMessagesList'); // 👈 بخش پیام‌های کاربران
  
  // مودال پیام
  const msgModal = document.getElementById('messageModal');
  const msgText = document.getElementById('messageText');
  const msgUserName = document.getElementById('messageUserName');
  let currentMsgUserId = null;

  const API_URL = "https://code-pilot-5.onrender.com/api";
  let allUsers = [];

  // ======================
  // 🎨 رندر کاربران
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
            <button class="delete" onclick="deleteUser(${user.id})" style="background:#da3633; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">حذف</button>
            <button onclick="openMessageModal(${user.id}, '${user.name}')" style="background:#8b5cf6; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer;">✉️ پیام</button>
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
      ordersList.innerHTML = `<p style="color: #8aa3c9; text-align: center; padding: 20px;">هنوز سفارشی ثبت نشده است.</p>`;
      return;
    }

    ordersList.innerHTML = orders.map((order) => `
      <div class="order-item" style="border: 1px solid rgba(139, 92, 246, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <strong style="color:#c4b5fd; font-size: 16px;">${order.label}</strong>
          <br><small style="color:#8aa3c9;">خریدار: ${order.buyer_name || 'نامشخص'}</small>
          <br><small style="color:#8aa3c9;">تاریخ: ${order.date}</small>
          <br><small style="color:#facc15; font-weight: bold;">شماره پیگیری: ${order.tracking_code || 'ثبت نشده'}</small>
          
          <br><span style="color:${order.status === 'pending' ? '#facc15' : order.status === 'approved' ? '#4ade80' : '#f85149'}; font-weight: bold;">
            ${order.status === 'pending' ? '⏳ در انتظار' : order.status === 'approved' ? '✅ تأیید شده' : '❌ رد شده'}
          </span>
        </div>
        <div style="display:flex; gap:5px;">
          <button onclick="approveOrder(${order.id})" ${order.status !== 'pending' ? 'disabled' : ''} 
            style="background:${order.status === 'pending' ? '#238636' : '#333'}; color:white; border:none; padding:10px 16px; border-radius:8px; cursor:${order.status === 'pending' ? 'pointer' : 'not-allowed'}; font-family: inherit; font-weight: bold;">
            ${order.status === 'pending' ? 'تأیید' : 'تأیید شده'}
          </button>
          <button onclick="deleteOrder(${order.id})" style="background:#da3633; color:white; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-family: inherit; font-weight: bold;">حذف</button>
        </div>
      </div>
    `).join('');
  }

  // ======================
  // 💬 رندر پیام‌های کاربران
  // ======================
  function renderUserMessages(messages) {
    if (!userMessagesList) return;
    if (messages.length === 0) {
      userMessagesList.innerHTML = `<p style="color: #8aa3c9; text-align: center; padding: 20px;">هنوز پیامی از کاربران دریافت نشده است.</p>`;
      return;
    }

    userMessagesList.innerHTML = messages.map(msg => `
      <div class="order-item" style="border: 1px solid rgba(59, 130, 246, 0.2); padding: 15px; border-radius: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <div>
          <strong style="color:#60a5fa; font-size: 16px;">${msg.user_name || 'کاربر'}</strong>
          <br><small style="color:#8aa3c9;">تاریخ: ${msg.date}</small>
          <br><small style="color:#c4b5fd;">وضعیت: ${msg.is_read ? 'خوانده شده' : 'جدید'}</small>
          <p style="color:#fff; margin-top: 8px; font-size: 14px;">${msg.text}</p>
        </div>
        <div style="display:flex; gap:5px;">
          <button onclick="openMessageModal(${msg.user_id}, '${msg.user_name}')" style="background:#8b5cf6; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-family: inherit;">پاسخ</button>
          ${!msg.is_read ? `<button onclick="markAdminMsgRead(${msg.id})" style="background:#4ade80; color:#000; border:none; padding:8px 12px; border-radius:8px; cursor:pointer; font-family: inherit;">خواندم</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  // علامت‌گذاری پیام به عنوان خوانده شده توسط ادمین
  window.markAdminMsgRead = async function(msgId) {
    try {
      await fetch(`${API_URL}/messages/read`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msgId })
      });
      fetchData(); // رفرش لیست‌ها
    } catch (err) {}
  };

  // ======================
  // ✉️ مودال ارسال پیام
  // ======================
  window.openMessageModal = function(userId, userName) {
    currentMsgUserId = userId;
    msgUserName.innerText = userName;
    msgText.value = '';
    msgModal.classList.add('show');
  };

  window.closeMessageModal = function() {
    msgModal.classList.remove('show');
    currentMsgUserId = null;
  };

  window.sendMessage = async function() {
    const text = msgText.value.trim();
    if (!text) return alert('لطفاً متن پیام را بنویسید.');
    if (!currentMsgUserId) return;

    const btn = document.querySelector('#messageModal .btn-send');
    btn.innerText = 'در حال ارسال...';
    btn.disabled = true;

    try {
        const res = await sendMessageToUser(currentMsgUserId, text);
        if (res.ok) {
          alert('✅ پیام با موفقیت برای کاربر ارسال شد.');
          closeMessageModal();
          fetchData(); // رفرش لیست‌ها
        } else {
          alert('❌ خطا در ارسال پیام: ' + res.error);
        }
    } catch (err) {
        alert('❌ خطای شبکه: ' + err.message);
    } finally {
        btn.innerText = 'ارسال پیام';
        btn.disabled = false;
    }
  };

  // ======================
  // 🔄 دریافت اطلاعات (کاربران + سفارشات + پیام‌ها)
  // ======================
  async function fetchData() {
    userCountEl.textContent = "در حال دریافت...";
    await new Promise(resolve => setTimeout(resolve, 2000)); 
    
    // ۱. کاربران
    try {
      const usersRes = await fetch(`${API_URL}/admin/users`);
      const usersData = await usersRes.json();
      if (usersData.ok) { allUsers = usersData.users; renderUsers(allUsers); }
    } catch (err) { userCountEl.textContent = "❌ خطا در کاربران"; }

    // ۲. سفارشات
    try {
      const ordersRes = await fetch(`${API_URL}/admin/orders`);
      const ordersData = await ordersRes.json();
      if (ordersData.ok) { renderOrders(ordersData.orders); }
    } catch (err) { console.error("خطا در سفارشات", err); }

    // ۳. پیام‌های کاربران
    try {
      const msgsRes = await fetch(`${API_URL}/admin/messages`);
      const msgsData = await msgsRes.json();
      if (msgsData.ok) { renderUserMessages(msgsData.messages); }
    } catch (err) { console.error("خطا در پیام‌ها", err); }
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
    if (!confirm('آیا از تایید این سفارش مطمئن هستید؟')) return;
    try {
      const res = await fetch(`${API_URL}/admin/approve`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.ok) { alert('✅ سفارش تایید شد.'); fetchData(); }
      else { alert('❌ خطا: ' + data.error); }
    } catch (err) { alert('❌ خطا در ارتباط'); }
  };

  // ======================
  // 🗑️ حذف سفارش
  // ======================
  window.deleteOrder = async function(orderId) {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;
    try {
      const res = await fetch(`${API_URL}/admin/orders/delete`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId })
      });
      const data = await res.json();
      if (data.ok) { alert('🗑️ سفارش حذف شد.'); fetchData(); }
      else { alert('❌ خطا: ' + data.error); }
    } catch (err) { alert('❌ خطا در ارتباط'); }
  };

  // ======================
  // 🗑️ حذف کاربر
  // ======================
  window.deleteUser = async function(userId) {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    try {
      const res = await fetch(`${API_URL}/admin/users/delete`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json();
      if (data.ok) { alert('🗑️ کاربر حذف شد.'); fetchData(); }
      else { alert('❌ خطا: ' + data.error); }
    } catch (err) { alert('❌ خطا در ارتباط'); }
  };

  // ======================
  // 🚪 خروج
  // ======================
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('session');
    localStorage.removeItem('loggedInUser');
    window.location.href = "login.html";
  });

  fetchData();
});
document.addEventListener("DOMContentLoaded", async () => {
  const session = JSON.parse(localStorage.getItem('session'));
  if (!session || session.role !== 'admin') { window.location.href = "login.html"; return; }

  const API_URL = "https://code-pilot-5.onrender.com/api";
  let allUsers = [];
  let currentMsgUserId = null;

  // ======================
  // 🎨 تغییر تب‌ها
  // ======================
  window.switchAdminTab = function(tabName, btn) {
    document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${tabName}`).classList.add('active');
  };

  // ======================
  // 🎨 رندر کاربران
  // ======================
  function renderUsers(usersToRender) {
    const table = document.getElementById('userTable');
    const userCountEl = document.getElementById('userCount');
    table.innerHTML = "";
    userCountEl.textContent = `👥 تعداد کل کاربران: ${allUsers.length} نفر (نمایش ${usersToRender.length} نتیجه)`;

    if (usersToRender.length === 0) {
      table.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#8aa3c9;">کاربری پیدا نشد</td></tr>';
      return;
    }

    usersToRender.forEach(user => {
      const isAdmin = user.role === 'admin';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${user.name || 'نامشخص'}</td>
        <td>${user.phone || '-'}</td>
        <td>${user.email || '-'}</td>
        <td><span class="password-cell ${isAdmin ? 'admin-protected' : ''}">${user.password_view || '—'}</span></td>
        <td>${isAdmin ? '<span style="color:#8b5cf6">👑 ادمین</span>' : '<span style="color:#4ade80">👤 کاربر</span>'}</td>
        <td class="action-btns">
          ${!isAdmin ? `
            <button class="delete" onclick="deleteUser(${user.id})">حذف</button>
            <button onclick="openMessageModal(${user.id}, '${user.name}')" style="background:#8b5cf6; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-family:inherit;">✉️</button>
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
    const list = document.getElementById('ordersList');
    if (orders.length === 0) { list.innerHTML = `<p style="color: #8aa3c9; text-align: center; padding: 20px;">هنوز سفارشی ثبت نشده است.</p>`; return; }
    list.innerHTML = orders.map((order) => `
      <div class="order-item">
        <div>
          <strong style="color:#c4b5fd; font-size: 16px;">${order.label}</strong>
          <br><small style="color:#8aa3c9;">خریدار: ${order.buyer_name || 'نامشخص'}</small>
          <br><small style="color:#8aa3c9;">تاریخ: ${order.date}</small>
          <br><small style="color:#facc15; font-weight: bold;">کد پیگیری: ${order.tracking_code || 'ثبت نشده'}</small>
          <br><span style="color:${order.status === 'pending' ? '#facc15' : order.status === 'approved' ? '#4ade80' : '#f85149'}; font-weight: bold;">
            ${order.status === 'pending' ? '⏳ در انتظار' : order.status === 'approved' ? '✅ تأیید شده' : '❌ رد شده'}
          </span>
        </div>
        <div style="display:flex; gap:5px;">
          <button onclick="approveOrder(${order.id})" ${order.status !== 'pending' ? 'disabled' : ''} style="background:${order.status === 'pending' ? '#238636' : '#333'}; color:white; font-family: inherit; font-weight: bold;">${order.status === 'pending' ? 'تأیید' : 'تأیید شده'}</button>
          <button onclick="deleteOrder(${order.id})" style="background:#da3633; color:white; font-family: inherit; font-weight: bold;">حذف</button>
        </div>
      </div>
    `).join('');
  }

  // ======================
  // 💬 رندر پیام‌های کاربران
  // ======================
  function renderUserMessages(messages) {
    const list = document.getElementById('userMessagesList');
    if (messages.length === 0) { list.innerHTML = `<p style="color: #8aa3c9; text-align: center; padding: 20px;">هنوز پیامی از کاربران دریافت نشده است.</p>`; return; }
    list.innerHTML = messages.map(msg => `
      <div class="order-item" style="border-color:rgba(59, 130, 246, 0.3);">
        <div>
          <strong style="color:#60a5fa; font-size: 16px;">${msg.user_name || 'کاربر'}</strong>
          <br><small style="color:#8aa3c9;">تاریخ: ${msg.date}</small>
          <br><small style="color:#c4b5fd;">وضعیت: ${msg.is_read ? 'خوانده شده' : 'جدید'}</small>
          <p style="color:#fff; margin-top: 8px; font-size: 14px;">${msg.text}</p>
        </div>
        <div style="display:flex; gap:5px;">
          <button onclick="openMessageModal(${msg.user_id}, '${msg.user_name}')" style="background:#8b5cf6; color:white; padding:8px 12px; border-radius:8px; cursor:pointer; font-family: inherit;">پاسخ</button>
          ${!msg.is_read ? `<button onclick="markAdminMsgRead(${msg.id})" style="background:#4ade80; color:#000; padding:8px 12px; border-radius:8px; cursor:pointer; font-family: inherit;">خواندم</button>` : ''}
        </div>
      </div>
    `).join('');
  }

  // ======================
  // 🚨 رندر گزارش‌ها
  // ======================
  function renderReports(reports) {
    const list = document.getElementById('reportsList');
    if (reports.length === 0) { list.innerHTML = `<p style="color: #8aa3c9; text-align: center; padding: 20px;">هیچ گزارشی ثبت نشده است.</p>`; return; }
    list.innerHTML = reports.map(r => {
      const date = new Date(r.created_at).toLocaleString('fa-IR');
      return `
        <div class="report-card">
          <div class="report-header">
            <span style="color: #f87171; font-weight: bold;">گزارش #${r.id}</span>
            <span style="color: #8aa3c9; font-size: 12px;">${date}</span>
          </div>
          <div style="font-size: 13px;">
            <strong style="color: #4ade80;">گزارش‌دهنده:</strong> ${r.reporter_name} (${r.reporter_phone}) <br>
            <strong style="color: #ef4444;">گزارش‌شونده:</strong> ${r.reported_name} (${r.reported_phone})
          </div>
          <div class="report-reason">${r.reason}</div>
          <div class="report-actions">
            <button onclick="deleteReport(${r.id})" style="background: transparent; border: 1px solid #555; color: #aaa; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family:inherit;">حذف گزارش</button>
            <button onclick="deleteUser(${r.reported_id})" style="background: #da3633; color: white; border: none; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-family:inherit;">حذف کاربر متخلف</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ======================
  // 📢 رندر درخواست‌های تبلیغات
  // ======================
  function renderAdRequests(requests) {
    const list = document.getElementById('adRequestsList');
    if (requests.length === 0) { list.innerHTML = `<p style="color: #8aa3c9; text-align: center; padding: 20px;">هیچ درخواستی ثبت نشده است.</p>`; return; }
    list.innerHTML = requests.map(r => {
      const date = new Date(r.created_at).toLocaleString('fa-IR');
      const statusColor = r.status === 'pending' ? '#facc15' : r.status === 'approved' ? '#4ade80' : '#f85149';
      const statusText = r.status === 'pending' ? '⏳ در انتظار' : r.status === 'approved' ? '✅ تأیید شده' : '❌ رد شده';
      return `
        <div class="order-item" style="border-color:rgba(250, 204, 21, 0.3); flex-direction: column; align-items: stretch;">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom: 10px;">
              <strong style="color:#facc15; font-size: 16px;">درخواست #${r.id}</strong>
              <span style="color:${statusColor}; font-size: 12px; font-weight: bold;">${statusText}</span>
            </div>
            <div style="font-size: 13px; margin-bottom: 8px;">
              <strong>کاربر:</strong> ${r.user_name || 'ناشناس'} (${r.phone || 'بدون شماره'}) <br>
              <strong>تاریخ:</strong> ${date} <br>
              <strong>قیمت پیشنهادی:</strong> ${r.price ? r.price + ' تومان' : 'رایگان'}
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px; color: #e8edf5; font-size: 14px; margin-bottom: 10px;">
              ${r.content}
            </div>
          </div>
          <div style="display:flex; gap:5px; justify-content: flex-end;">
            ${r.status === 'pending' ? `
              <button onclick="handleAdReq(${r.id}, 'approve')" style="background:#238636; color:white;">✅ تأیید</button>
              <button onclick="handleAdReq(${r.id}, 'reject')" style="background:#da3633; color:white;">❌ رد</button>
            ` : ''}
            <button onclick="deleteAdReq(${r.id})" style="background:#555; color:white;">🗑 حذف</button>
          </div>
        </div>
      `;
    }).join('');
  }

  window.deleteReport = async function(reportId) {
    if (!confirm('آیا از حذف این گزارش مطمئن هستید؟')) return;
    const res = await apiRequest(`/admin/reports/delete`, "POST", { reportId });
    if (res.ok) fetchData();
  };

  window.handleAdReq = async function(requestId, action) {
    if (!confirm(`آیا از ${action === 'approve' ? 'تأیید' : 'رد'} این درخواست مطمئن هستید؟`)) return;
    const res = await handleAdRequest(requestId, action);
    if (res.ok) { alert('✅ انجام شد'); fetchData(); } else alert('❌ ' + res.error);
  };

  window.deleteAdReq = async function(requestId) {
    if (!confirm('آیا از حذف این درخواست مطمئن هستید؟')) return;
    const res = await deleteAdRequest(requestId);
    if (res.ok) fetchData();
  };

  window.markAdminMsgRead = async function(msgId) {
    await apiRequest("/messages/read", "POST", { messageId: msgId });
    fetchData();
  };

  // ======================
  // ✉️ مودال ارسال پیام
  // ======================
  window.openMessageModal = function(userId, userName) {
    currentMsgUserId = userId;
    document.getElementById('messageUserName').innerText = userName;
    document.getElementById('messageText').value = '';
    document.getElementById('messageModal').classList.add('show');
  };

  window.closeMessageModal = function() {
    document.getElementById('messageModal').classList.remove('show');
    currentMsgUserId = null;
  };

  window.sendMessage = async function() {
    const text = document.getElementById('messageText').value.trim();
    if (!text) return alert('لطفاً متن پیام را بنویسید.');
    if (!currentMsgUserId) return;
    const btn = document.querySelector('#messageModal .btn-confirm');
    btn.innerText = 'در حال ارسال...'; btn.disabled = true;
    const res = await sendMessageToUser(currentMsgUserId, text);
    if (res.ok) { alert('✅ پیام ارسال شد'); closeMessageModal(); fetchData(); }
    else alert('❌ ' + res.error);
    btn.innerText = 'ارسال پیام'; btn.disabled = false;
  };

  // ======================
  // 🔄 دریافت اطلاعات
  // ======================
  async function fetchData() {
    const userCountEl = document.getElementById('userCount');
    userCountEl.textContent = "در حال دریافت...";

    try {
      const res = await fetch(`${API_URL}/admin/users`);
      const data = await res.json();
      if (data.ok) { allUsers = data.users; renderUsers(allUsers); }
    } catch (err) { userCountEl.textContent = "❌ خطا در کاربران"; }

    try {
      const res = await fetch(`${API_URL}/admin/orders`);
      const data = await res.json();
      if (data.ok) renderOrders(data.orders);
    } catch (err) {}

    try {
      const res = await fetch(`${API_URL}/admin/messages`);
      const data = await res.json();
      if (data.ok) renderUserMessages(data.messages);
    } catch (err) {}

    try {
      const res = await fetch(`${API_URL}/admin/reports`);
      const data = await res.json();
      if (data.ok) renderReports(data.reports);
    } catch (err) {}

    try {
      const res = await getAdRequests();
      if (res.ok) renderAdRequests(res.data.requests);
    } catch (err) {}
  }

  // ======================
  // 🔍 جستجو
  // ======================
  document.getElementById('search').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (!term) { renderUsers(allUsers); return; }
    const filtered = allUsers.filter(u => 
      (u.name && u.name.toLowerCase().includes(term)) ||
      (u.phone && u.phone.includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term))
    );
    renderUsers(filtered);
  });

  window.approveOrder = async function(orderId) {
    if (!confirm('آیا از تایید این سفارش مطمئن هستید؟')) return;
    const res = await approveCoinOrder(orderId);
    if (res.ok) { alert('✅ تایید شد'); fetchData(); } else alert('❌ ' + res.error);
  };

  window.deleteOrder = async function(orderId) {
    if (!confirm('آیا از حذف این سفارش مطمئن هستید؟')) return;
    const res = await deleteOrderAPI(orderId);
    if (res.ok) { alert('🗑️ حذف شد'); fetchData(); } else alert('❌ ' + res.error);
  };

  window.deleteUser = async function(userId) {
    if (!confirm('آیا از حذف این کاربر مطمئن هستید؟')) return;
    const res = await deleteUserAPI(userId);
    if (res.ok) { alert('🗑️ کاربر حذف شد'); fetchData(); } else alert('❌ ' + res.error);
  };

  document.getElementById('logout').addEventListener('click', () => {
    ['session', 'loggedInUser', 'username', 'userXP', 'userCoins', 'userPlan', 'userLevel', 'loggedIn'].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
  });

  fetchData();
});
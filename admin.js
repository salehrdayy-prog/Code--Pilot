document.addEventListener("DOMContentLoaded", async () => {
  // چک امنیتی: فقط ادمین
  let session = null;
  try {
    session = JSON.parse(localStorage.getItem('session'));
  } catch (e) {
    session = null;
  }

  if (!session || session.role !== 'admin') {
    alert('دسترسی فقط برای مدیر!');
    window.location.href = "login.html";
    return;
  }

  let allUsers = [];
  let currentMsgUserId = null;

  // ============ تب‌ها ============
  window.switchAdminTab = function(tabName, btn) {
    document.querySelectorAll('.admin-tabs button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const tab = document.getElementById(`tab-${tabName}`);
    if (tab) tab.classList.add('active');
  };

  // ============ رندر کاربران ============
  function renderUsers(usersToRender) {
    const table = document.getElementById('userTable');
    const userCountEl = document.getElementById('userCount');
    if (!table) return;
    table.innerHTML = "";
    if (userCountEl) userCountEl.textContent = `👥 کل کاربران: ${allUsers.length} نفر (نمایش: ${usersToRender.length})`;

    if (usersToRender.length === 0) {
      table.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#8aa3c9;">کاربری پیدا نشد</td></tr>';
      return;
    }

    usersToRender.forEach(user => {
      const isAdmin = user.role === 'admin';
      const tr = document.createElement('tr');
      const safeName = (user.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      tr.innerHTML = `
        <td>${user.name || 'نامشخص'}</td>
        <td>${user.phone || '-'}</td>
        <td>${user.email || '-'}</td>
        <td><span class="password-cell ${isAdmin ? 'admin-protected' : ''}">${user.password_view || '—'}</span></td>
        <td>${isAdmin ? '<span style="color:#8b5cf6">👑 ادمین</span>' : '<span style="color:#4ade80">👤 کاربر</span>'}</td>
        <td class="action-btns">
          ${!isAdmin ? `
            <button class="delete" data-action="delete" data-id="${user.id}">حذف</button>
            <button data-action="message" data-id="${user.id}" data-name="${safeName}" style="background:#8b5cf6; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-family:inherit;">✉️</button>
          ` : `<span style="color:#8aa3c9">-</span>`}
        </td>
      `;
      table.appendChild(tr);
    });

    // Event delegation - به جای onclick inline
    table.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        const id = parseInt(btn.dataset.id);
        if (action === 'delete') window.deleteUser(id);
        else if (action === 'message') window.openMessageModal(id, btn.dataset.name);
      });
    });
  }

  // ============ رندر سفارشات ============
  function renderOrders(orders) {
    const list = document.getElementById('ordersList');
    if (!list) return;
    if (!orders || orders.length === 0) {
      list.innerHTML = `<p style="color:#8aa3c9; text-align:center; padding:20px;">هنوز سفارشی ثبت نشده.</p>`;
      return;
    }
    list.innerHTML = orders.map(order => `
      <div class="order-item">
        <div>
          <strong style="color:#c4b5fd; font-size:16px;">${order.label || 'سفارش'}</strong>
          <br><small style="color:#8aa3c9;">خریدار: ${order.buyer_name || 'نامشخص'}</small>
          <br><small style="color:#8aa3c9;">تاریخ: ${order.date || '-'}</small>
          <br><small style="color:#facc15; font-weight:bold;">کد پیگیری: ${order.tracking_code || 'ثبت نشده'}</small>
          <br><span style="color:${order.status === 'pending' ? '#facc15' : order.status === 'approved' ? '#4ade80' : '#f85149'}; font-weight:bold;">
            ${order.status === 'pending' ? '⏳ در انتظار' : order.status === 'approved' ? '✅ تأیید شده' : '❌ رد شده'}
          </span>
        </div>
        <div style="display:flex; gap:5px;">
          <button data-order-action="approve" data-id="${order.id}" ${order.status !== 'pending' ? 'disabled' : ''} style="background:${order.status === 'pending' ? '#238636' : '#333'}; color:white; padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-family:inherit;">${order.status === 'pending' ? 'تأیید' : 'تأیید شده'}</button>
          <button data-order-action="delete" data-id="${order.id}" style="background:#da3633; color:white; padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-family:inherit;">حذف</button>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('button[data-order-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.orderAction;
        const id = parseInt(btn.dataset.id);
        if (action === 'approve') window.approveOrder(id);
        else if (action === 'delete') window.deleteOrder(id);
      });
    });
  }

  // ============ رندر پیام‌ها ============
  function renderUserMessages(messages) {
    const list = document.getElementById('userMessagesList');
    if (!list) return;
    if (!messages || messages.length === 0) {
      list.innerHTML = `<p style="color:#8aa3c9; text-align:center; padding:20px;">هنوز پیامی از کاربران دریافت نشده.</p>`;
      return;
    }
    list.innerHTML = messages.map(msg => `
      <div class="order-item" style="border-color:rgba(59,130,246,0.3);">
        <div>
          <strong style="color:#60a5fa; font-size:16px;">${msg.user_name || 'کاربر'}</strong>
          <br><small style="color:#8aa3c9;">تاریخ: ${msg.date || '-'}</small>
          <br><small style="color:#c4b5fd;">وضعیت: ${msg.is_read ? 'خوانده شده' : 'جدید'}</small>
          <p style="color:#fff; margin-top:8px; font-size:14px;">${msg.text || ''}</p>
        </div>
        <div style="display:flex; gap:5px;">
          <button data-msg-action="reply" data-id="${msg.user_id}" data-name="${(msg.user_name || '').replace(/"/g, '&quot;')}" style="background:#8b5cf6; color:white; padding:8px 12px; border-radius:8px; border:none; cursor:pointer; font-family:inherit;">پاسخ</button>
          ${!msg.is_read ? `<button data-msg-action="read" data-id="${msg.id}" style="background:#4ade80; color:#000; padding:8px 12px; border-radius:8px; border:none; cursor:pointer; font-family:inherit;">خواندم</button>` : ''}
        </div>
      </div>
    `).join('');

    list.querySelectorAll('button[data-msg-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.msgAction;
        const id = parseInt(btn.dataset.id);
        if (action === 'reply') window.openMessageModal(id, btn.dataset.name);
        else if (action === 'read') window.markAdminMsgRead(id);
      });
    });
  }

  // ============ رندر گزارش‌ها ============
  function renderReports(reports) {
    const list = document.getElementById('reportsList');
    if (!list) return;
    if (!reports || reports.length === 0) {
      list.innerHTML = `<p style="color:#8aa3c9; text-align:center; padding:20px;">هیچ گزارشی ثبت نشده.</p>`;
      return;
    }
    list.innerHTML = reports.map(r => {
      const date = r.created_at ? new Date(r.created_at).toLocaleString('fa-IR') : '-';
      return `
        <div class="report-card">
          <div class="report-header">
            <span style="color:#f87171; font-weight:bold;">گزارش #${r.id}</span>
            <span style="color:#8aa3c9; font-size:12px;">${date}</span>
          </div>
          <div style="font-size:13px;">
            <strong style="color:#4ade80;">گزارش‌دهنده:</strong> ${r.reporter_name || '?'} (${r.reporter_phone || '?'}) <br>
            <strong style="color:#ef4444;">گزارش‌شونده:</strong> ${r.reported_name || '?'} (${r.reported_phone || '?'})
          </div>
          <div class="report-reason">${r.reason || ''}</div>
          <div class="report-actions">
            <button data-report-action="delete" data-id="${r.id}" style="background:transparent; border:1px solid #555; color:#aaa; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-family:inherit;">حذف گزارش</button>
            <button data-report-action="delete-user" data-id="${r.reported_id}" style="background:#da3633; color:white; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:12px; font-family:inherit;">حذف کاربر متخلف</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('button[data-report-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.reportAction;
        const id = parseInt(btn.dataset.id);
        if (action === 'delete') window.deleteReport(id);
        else if (action === 'delete-user') window.deleteUser(id);
      });
    });
  }

  // ============ رندر درخواست تبلیغات ============
  function renderAdRequests(requests) {
    const list = document.getElementById('adRequestsList');
    if (!list) return;
    if (!requests || requests.length === 0) {
      list.innerHTML = `<p style="color:#8aa3c9; text-align:center; padding:20px;">هیچ درخواستی ثبت نشده.</p>`;
      return;
    }
    list.innerHTML = requests.map(r => {
      const date = r.created_at ? new Date(r.created_at).toLocaleString('fa-IR') : '-';
      const statusColor = r.status === 'pending' ? '#facc15' : r.status === 'approved' ? '#4ade80' : '#f85149';
      const statusText = r.status === 'pending' ? '⏳ در انتظار' : r.status === 'approved' ? '✅ تأیید شده' : '❌ رد شده';
      return `
        <div class="order-item" style="border-color:rgba(250,204,21,0.3); flex-direction:column; align-items:stretch;">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
              <strong style="color:#facc15; font-size:16px;">درخواست #${r.id}</strong>
              <span style="color:${statusColor}; font-size:12px; font-weight:bold;">${statusText}</span>
            </div>
            <div style="font-size:13px; margin-bottom:8px;">
              <strong>کاربر:</strong> ${r.user_name || 'ناشناس'} (${r.phone || 'بدون شماره'})<br>
              <strong>تاریخ:</strong> ${date}<br>
              <strong>قیمت:</strong> ${r.price ? r.price + ' تومان' : 'رایگان'}
            </div>
            <div style="background:rgba(0,0,0,0.3); padding:10px; border-radius:8px; color:#e8edf5; font-size:14px; margin-bottom:10px;">
              ${r.content || ''}
            </div>
          </div>
          <div style="display:flex; gap:5px; justify-content:flex-end;">
            ${r.status === 'pending' ? `
              <button data-ad-action="approve" data-id="${r.id}" style="background:#238636; color:white; padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-family:inherit;">✅ تأیید</button>
              <button data-ad-action="reject" data-id="${r.id}" style="background:#da3633; color:white; padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-family:inherit;">❌ رد</button>
            ` : ''}
            <button data-ad-action="delete" data-id="${r.id}" style="background:#555; color:white; padding:8px 14px; border-radius:8px; border:none; cursor:pointer; font-family:inherit;">🗑 حذف</button>
          </div>
        </div>
      `;
    }).join('');

    list.querySelectorAll('button[data-ad-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.adAction;
        const id = parseInt(btn.dataset.id);
        if (action === 'approve' || action === 'reject') window.handleAdReq(id, action);
        else if (action === 'delete') window.deleteAdReq(id);
      });
    });
  }

  // ============ Actions ============
  window.deleteReport = async function(reportId) {
    if (!confirm('حذف این گزارش؟')) return;
    const res = await apiRequest(`/admin/reports/delete`, "POST", { reportId });
    if (res.ok) fetchData();
    else alert('❌ ' + res.error);
  };

  window.handleAdReq = async function(requestId, action) {
    if (!confirm(`${action === 'approve' ? 'تأیید' : 'رد'} این درخواست؟`)) return;
    const res = await handleAdRequest(requestId, action);
    if (res.ok) { alert('✅ انجام شد'); fetchData(); }
    else alert('❌ ' + res.error);
  };

  window.deleteAdReq = async function(requestId) {
    if (!confirm('حذف این درخواست؟')) return;
    const res = await deleteAdRequest(requestId);
    if (res.ok) fetchData();
    else alert('❌ ' + res.error);
  };

  window.markAdminMsgRead = async function(msgId) {
    const res = await markMessageAsRead(msgId);
    if (res.ok) fetchData();
  };

  window.approveOrder = async function(orderId) {
    if (!confirm('تأیید این سفارش؟')) return;
    const res = await approveCoinOrder(orderId);
    if (res.ok) { alert('✅ تأیید شد'); fetchData(); }
    else alert('❌ ' + res.error);
  };

  window.deleteOrder = async function(orderId) {
    if (!confirm('حذف این سفارش؟')) return;
    const res = await deleteOrderAPI(orderId);
    if (res.ok) { alert('🗑️ حذف شد'); fetchData(); }
    else alert('❌ ' + res.error);
  };

  window.deleteUser = async function(userId) {
    if (!confirm('حذف این کاربر؟')) return;
    const res = await deleteUserAPI(userId);
    if (res.ok) { alert('🗑️ حذف شد'); fetchData(); }
    else alert('❌ ' + res.error);
  };

  // ============ مودال پیام ============
  window.openMessageModal = function(userId, userName) {
    currentMsgUserId = userId;
    const el = document.getElementById('messageUserName');
    if (el) el.innerText = userName || 'کاربر';
    const text = document.getElementById('messageText');
    if (text) text.value = '';
    const modal = document.getElementById('messageModal');
    if (modal) modal.classList.add('show');
  };

  window.closeMessageModal = function() {
    const modal = document.getElementById('messageModal');
    if (modal) modal.classList.remove('show');
    currentMsgUserId = null;
  };

  window.sendMessage = async function() {
    const textEl = document.getElementById('messageText');
    if (!textEl) return;
    const text = textEl.value.trim();
    if (!text) return alert('متن پیام رو بنویس');
    if (!currentMsgUserId) return;
    const btn = document.querySelector('#messageModal .btn-confirm');
    if (btn) { btn.innerText = 'در حال ارسال...'; btn.disabled = true; }
    const res = await sendMessageToUser(currentMsgUserId, text);
    if (res.ok) { alert('✅ ارسال شد'); window.closeMessageModal(); fetchData(); }
    else alert('❌ ' + res.error);
    if (btn) { btn.innerText = 'ارسال پیام'; btn.disabled = false; }
  };

  // ============ Fetch Data ============
  async function fetchData() {
    const userCountEl = document.getElementById('userCount');
    if (userCountEl) userCountEl.textContent = "در حال دریافت...";

    try {
      const res = await getAllUsers();
      if (res.ok && res.data) {
        allUsers = res.data.users || [];
        renderUsers(allUsers);
      }
    } catch (err) { if (userCountEl) userCountEl.textContent = "❌ خطا در کاربران"; }

    try {
      const res = await getAllOrders();
      if (res.ok && res.data) renderOrders(res.data.orders || []);
    } catch (err) {}

    try {
      const res = await getAllUserMessages();
      if (res.ok && res.data) renderUserMessages(res.data.messages || []);
    } catch (err) {}

    try {
      const res = await apiRequest("/admin/reports");
      if (res.ok && res.data) renderReports(res.data.reports || []);
    } catch (err) {}

    try {
      const res = await getAdRequests();
      if (res.ok && res.data) renderAdRequests(res.data.requests || []);
    } catch (err) {}
  }

  // ============ Search ============
  const searchInput = document.getElementById('search');
  if (searchInput) {
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
  }

  // ============ Logout ============
  const logoutBtn = document.getElementById('logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      ['session', 'loggedInUser', 'username', 'userXP', 'userCoins', 'userPlan', 'userLevel', 'loggedIn'].forEach(k => localStorage.removeItem(k));
      window.location.href = "login.html";
    });
  }

  fetchData();
});

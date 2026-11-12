// ==========================================================
// فایل api.js - نسخه نهایی و بدون باگ
// ==========================================================

const API_BASE_URL = "https://code-pilot-5.onrender.com/api";

// تابع عمومی برای ارسال درخواست
async function apiRequest(endpoint, method = "GET", body = null) {
  try {
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data.error || "خطا در ارتباط با سرور" };
    }
    return { ok: true, data };
  } catch (err) {
    console.error("API Error:", err);
    return { ok: false, error: "خطا در شبکه: " + err.message };
  }
}

// ================== توابع دیتابیس ==================

async function registerUser(name, phone, email, password) {
  return await apiRequest("/register", "POST", { name, phone, email, password });
}

async function loginUser(loginValue, password) {
  return await apiRequest("/login", "POST", { loginValue, password });
}

// 👈 این تابع رو برای اطمینان از خوندن کاربران بازنویسی کردیم
async function getAllUsers() {
  return await apiRequest("/admin/users");
}

async function createCoinOrder(buyerId, buyerName, amount, label) {
  return await apiRequest("/orders", "POST", { buyerId, buyerName, amount, label });
}

async function getAllOrders() {
  return await apiRequest("/admin/orders");
}

async function approveCoinOrder(orderId) {
  return await apiRequest("/admin/approve", "POST", { orderId });
}

async function saveProjectToDB(userId, name, html, css, js, date) {
  return await apiRequest("/projects", "POST", { userId, name, html, css, js, date });
}

async function getUserProjects(userId) {
  return await apiRequest(`/projects/${userId}`);
}
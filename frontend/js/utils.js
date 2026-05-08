// ====== API CONFIG ======
const API_URL = 'http://localhost:5000/api';

// ====== API HELPER ======
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  const isFormData = options.isFormData || (options.body instanceof FormData);

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove isFormData from options before spreading
  const { isFormData: _, headers: __, ...restOptions } = options;

  const config = {
    headers,
    ...restOptions
  };

  // If FormData, remove Content-Type so browser sets it with boundary
  if (isFormData) {
    delete config.headers['Content-Type'];
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      // Token hết hạn hoặc không hợp lệ -> redirect về đăng nhập
      // KHÔNG redirect cho các endpoint auth (login/register) - phải hiện thông báo lỗi cho user
      const isAuthEndpoint = endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register');
      if (response.status === 401 && !isAuthEndpoint) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/pages/dang-nhap.html';
        return;
      }
      throw new Error(data.message || 'Có lỗi xảy ra');
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// ====== TOAST ======
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  const isError = type === 'error' || type === 'danger';
  toast.className = `toast-custom ${isError ? 'error' : ''}`;
  toast.innerHTML = `
    <i class="bi ${isError ? 'bi-x-circle text-danger' : 'bi-check-circle text-success'}"></i>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ====== TOGGLE PASSWORD ======
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.parentElement.querySelector('.toggle-password i');

  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'bi bi-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'bi bi-eye';
  }
}

// ====== FORMAT CURRENCY ======
function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

// ====== AUTH STATE ======
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

function getToken() {
  return localStorage.getItem('token');
}

function isLoggedIn() {
  return !!getToken();
}

function logout() {
  // Xoa lich su chatbot
  const user = getUser();
  if (user) localStorage.removeItem('sachhub_chat_' + user._id);
  localStorage.removeItem('sachhub_chat_history');

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

// ====== UPDATE HEADER AUTH ======
function updateHeaderAuth() {
  const authArea = document.getElementById('headerAuth');
  if (!authArea) return;

  const user = getUser();
  if (user) {
    authArea.innerHTML = `
      <div class="dropdown">
        <a class="header-action-item dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle" style="font-size: 22px;"></i>
          <span>${user.fullName}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="/pages/ho-so.html"><i class="bi bi-person me-2"></i>Hồ sơ cá nhân</a></li>
          <li><a class="dropdown-item" href="/pages/don-hang.html"><i class="bi bi-box me-2"></i>Đơn hàng</a></li>
          ${user.role === 'admin' || user.role === 'staff' ? '<li><a class="dropdown-item" href="/pages/admin/dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Quản trị</a></li>' : ''}
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Đăng xuất</a></li>
        </ul>
      </div>
    `;
  } else {
    authArea.innerHTML = `
      <a href="/pages/dang-nhap.html" class="header-action-item">
        <i class="bi bi-person" style="font-size: 20px;"></i>
        <span>Đăng nhập</span>
      </a>
    `;
  }
}

// ====== LOADING ======
function showLoading(container) {
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-custom mx-auto"></div></div>';
}

// ====== TRUNCATE TEXT ======
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// ====== KIỂM TRA TOKEN ADMIN ======
async function verifyAdminToken() {
  const token = getToken();
  const user = getUser();
  if (!token || !user) {
    window.location.href = '/pages/dang-nhap.html';
    return false;
  }
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/pages/dang-nhap.html';
      return false;
    }
    return true;
  } catch {
    return true; // Lỗi mạng thì cho qua, để API call chính xử lý
  }
}

// ====== CART COUNT (dùng chung) ======
async function updateCartCount() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  if (!isLoggedIn()) {
    badge.style.display = 'none';
    return;
  }
  try {
    const data = await apiCall('/cart');
    const cart = data.data || data.cart || {};
    const count = cart.items ? cart.items.reduce((s, i) => s + (i.quantity || 1), 0) : 0;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  } catch {
    badge.style.display = 'none';
  }
}

// ====== ADMIN NOTIFICATIONS MANAGEMENT ======

// Check admin only (staff not allowed)
(function checkAdmin() {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    if (user && user.role === 'staff') {
      window.location.href = '/pages/admin/dashboard.html';
    } else {
      window.location.href = '/';
    }
    return;
  }
  const avatar = document.getElementById('avatarUser');
  if (avatar && user.fullName) {
    avatar.textContent = user.fullName.charAt(0).toUpperCase();
  }
})();

let currentPage = 1;
const limit = 10;

const TYPE_MAP = {
  order: { label: 'Đơn hàng', class: 'confirmed', icon: 'bi-box-seam' },
  promotion: { label: 'Khuyến mãi', class: 'shipping', icon: 'bi-tag' },
  system: { label: 'Hệ thống', class: 'cancelled', icon: 'bi-gear' },
  general: { label: 'Chung', class: 'pending', icon: 'bi-info-circle' }
};

// ====== LOAD NOTIFICATIONS ======
async function loadNotifications(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('notifTable');
  tbody.innerHTML = '<tr><td colspan="7"><div class="admin-spinner"></div></td></tr>';

  try {
    const data = await apiCall(`/notifications/admin/all?page=${page}&limit=${limit}`);
    const notifications = data.data || [];
    const pagination = data.pagination || {};
    const total = pagination.total || 0;
    const totalPages = pagination.totalPages || 1;

    if (!notifications.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có thông báo nào</td></tr>';
      document.getElementById('pageInfo').textContent = 'Hiển thị 0 kết quả';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = notifications.map((n, idx) => {
      const stt = (currentPage - 1) * limit + idx + 1;
      const type = TYPE_MAP[n.type] || TYPE_MAP.general;
      const target = n.isGlobal
        ? '<span style="background:#DBEAFE;color:#2563EB;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600;"><i class="bi bi-globe me-1"></i>Toàn hệ thống</span>'
        : `<span class="text-muted">${n.user?.email || 'N/A'}</span>`;
      const readBadge = n.isRead
        ? '<span class="badge-status delivered">Đã đọc</span>'
        : '<span class="badge-status pending">Chưa đọc</span>';
      const date = new Date(n.createdAt).toLocaleString('vi-VN');

      return `
        <tr>
          <td><strong>${stt}</strong></td>
          <td>
            <div style="font-weight:600;">${escapeHtml(n.title)}</div>
            <div class="text-muted small" style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(n.content)}</div>
          </td>
          <td><span class="badge-status ${type.class}"><i class="bi ${type.icon} me-1"></i>${type.label}</span></td>
          <td>${target}</td>
          <td>${readBadge}</td>
          <td>${date}</td>
          <td>
            <button class="btn-sm-action text-danger" onclick="deleteNotif('${n._id}')" title="Xóa">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');

    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
    document.getElementById('pageInfo').textContent = `Hiển thị ${start}-${end} trong ${total} thông báo`;
    renderPagination(currentPage, totalPages);
  } catch (error) {
    console.error('Load notifications error:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderPagination(current, total) {
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${current === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadNotifications(${current - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      html += `<li class="page-item ${i === current ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadNotifications(${i})">${i}</a>
      </li>`;
    } else if (i === current - 2 || i === current + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${current === total ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadNotifications(${current + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

// ====== TOGGLE USER SELECT ======
function toggleUserSelect() {
  const isGlobal = document.getElementById('notifGlobal').checked;
  document.getElementById('userSelectWrapper').style.display = isGlobal ? 'none' : 'block';
  if (!isGlobal) loadUsersForSelect();
}

async function loadUsersForSelect() {
  const select = document.getElementById('notifUser');
  if (select.dataset.loaded === 'true') return;

  try {
    const data = await apiCall('/users?limit=200');
    const users = data.data || data.users || [];
    select.innerHTML = '<option value="">-- Chọn người dùng --</option>' +
      users.filter(u => u.role !== 'admin').map(u =>
        `<option value="${u._id}">${escapeHtml(u.fullName)} (${u.email})</option>`
      ).join('');
    select.dataset.loaded = 'true';
  } catch (error) {
    select.innerHTML = '<option value="">Lỗi tải danh sách</option>';
  }
}

// ====== CREATE NOTIFICATION ======
async function submitNotification(e) {
  e.preventDefault();

  const title = document.getElementById('notifTitle').value.trim();
  const content = document.getElementById('notifContent').value.trim();
  const type = document.getElementById('notifType').value;
  const link = document.getElementById('notifLink').value.trim();
  const isGlobal = document.getElementById('notifGlobal').checked;
  const userId = isGlobal ? null : document.getElementById('notifUser').value;

  if (!title || !content) {
    showToast('Vui lòng nhập đầy đủ tiêu đề và nội dung', 'error');
    return;
  }

  if (!isGlobal && !userId) {
    showToast('Vui lòng chọn người dùng nhận thông báo', 'error');
    return;
  }

  try {
    await apiCall('/notifications', {
      method: 'POST',
      body: JSON.stringify({ title, content, type, link, userId })
    });

    showToast('Tạo thông báo thành công');
    bootstrap.Modal.getInstance(document.getElementById('createNotifModal')).hide();
    document.getElementById('createNotifForm').reset();
    document.getElementById('notifGlobal').checked = true;
    document.getElementById('userSelectWrapper').style.display = 'none';
    loadNotifications(1);
  } catch (error) {
    showToast(error.message || 'Lỗi tạo thông báo', 'error');
  }
}

// ====== DELETE NOTIFICATION ======
async function deleteNotif(id) {
  if (!confirm('Bạn có chắc muốn xóa thông báo này?')) return;

  try {
    await apiCall(`/notifications/${id}`, { method: 'DELETE' });
    showToast('Đã xóa thông báo');
    loadNotifications(currentPage);
  } catch (error) {
    showToast(error.message || 'Lỗi xóa thông báo', 'error');
  }
}

// ====== INIT ======
loadNotifications();

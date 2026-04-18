// ====== USER NOTIFICATIONS PAGE ======

(function checkAuth() {
  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }
  const user = getUser();
  if (!user) return;
  const nameEl = document.getElementById('sidebarName');
  const pointsEl = document.getElementById('sidebarPoints');
  const vouchersEl = document.getElementById('sidebarVouchers');
  if (nameEl) nameEl.textContent = user.fullName || 'Thành viên';
  if (pointsEl) pointsEl.textContent = (user.points || 0) + ' Pts';
  if (vouchersEl) vouchersEl.textContent = (user.voucherCount || 0) + ' mã giảm giá';
})();

let allNotifications = [];
let currentFilter = 'all';

const TYPE_ICONS = {
  order: { icon: 'bi-box-seam', class: 'order' },
  promotion: { icon: 'bi-tag-fill', class: 'promotion' },
  system: { icon: 'bi-gear-fill', class: 'system' },
  general: { icon: 'bi-info-circle-fill', class: 'general' }
};

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'Vừa xong';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString('vi-VN');
}

async function loadMyNotifications() {
  const list = document.getElementById('notifList');
  list.innerHTML = '<div class="empty-state"><i class="bi bi-hourglass-split"></i><p>Đang tải...</p></div>';

  try {
    const data = await apiCall('/notifications?limit=100');
    allNotifications = data.data || [];

    const unreadNum = allNotifications.filter(n => !n.isRead).length;
    document.getElementById('unreadCount').textContent = unreadNum;

    renderList();
  } catch (error) {
    list.innerHTML = '<div class="empty-state text-danger"><i class="bi bi-exclamation-triangle"></i><p>Lỗi tải thông báo</p></div>';
  }
}

function renderList() {
  const list = document.getElementById('notifList');
  let filtered = allNotifications;
  if (currentFilter === 'unread') filtered = allNotifications.filter(n => !n.isRead);
  if (currentFilter === 'read') filtered = allNotifications.filter(n => n.isRead);

  if (!filtered.length) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-bell-slash"></i>
        <p>Không có thông báo nào</p>
      </div>`;
    return;
  }

  list.innerHTML = filtered.map(n => {
    const meta = TYPE_ICONS[n.type] || TYPE_ICONS.general;
    const newBadge = !n.isRead ? '<span class="badge-new">Mới</span>' : '';
    const linkAttr = n.link ? `data-link="${escapeHtml(n.link)}"` : '';
    return `
      <div class="notif-item ${!n.isRead ? 'unread' : ''}" data-id="${n._id}" ${linkAttr} onclick="handleNotifClick('${n._id}')">
        <div class="notif-icon ${meta.class}"><i class="bi ${meta.icon}"></i></div>
        <div class="notif-body">
          <div class="notif-title">${escapeHtml(n.title)} ${newBadge}</div>
          <div class="notif-content">${escapeHtml(n.content)}</div>
          <div class="notif-meta"><i class="bi bi-clock me-1"></i>${timeAgo(n.createdAt)}</div>
        </div>
      </div>
    `;
  }).join('');
}

async function handleNotifClick(id) {
  const notif = allNotifications.find(n => n._id === id);
  if (!notif) return;

  if (!notif.isRead) {
    try {
      await apiCall(`/notifications/${id}/read`, { method: 'PUT' });
      notif.isRead = true;
      const unreadNum = allNotifications.filter(n => !n.isRead).length;
      document.getElementById('unreadCount').textContent = unreadNum;
      renderList();
      // Cập nhật badge trên header
      if (typeof updateNotifCount === 'function') updateNotifCount();
    } catch (error) {
      console.error(error);
    }
  }

  if (notif.link) {
    window.location.href = notif.link;
  }
}

function changeTab(btn) {
  document.querySelectorAll('.notif-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderList();
}

async function markAllRead() {
  if (!confirm('Đánh dấu tất cả thông báo là đã đọc?')) return;
  try {
    await apiCall('/notifications/read-all', { method: 'PUT' });
    allNotifications.forEach(n => n.isRead = true);
    document.getElementById('unreadCount').textContent = '0';
    renderList();
    if (typeof updateNotifCount === 'function') updateNotifCount();
    if (typeof showToast === 'function') showToast('Đã đánh dấu tất cả là đã đọc');
  } catch (error) {
    if (typeof showToast === 'function') showToast(error.message || 'Lỗi cập nhật', 'error');
  }
}

// Init
loadMyNotifications();

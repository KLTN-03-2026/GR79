// Quản lý Người dùng - Sách Hub Admin
let users = [];
let currentPage = 1;
let totalPages = 1;
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    if (user && user.role === 'staff') {
      window.location.href = '/pages/admin/dashboard.html';
    } else {
      window.location.href = '/';
    }
    return;
  }
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = user.fullName || 'Admin';
  loadUsers();

  document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { currentPage = 1; loadUsers(); }, 400);
  });
  document.getElementById('roleFilter').addEventListener('change', () => { currentPage = 1; loadUsers(); });
});

async function loadUsers() {
  const search = document.getElementById('searchInput').value.trim();
  const role = document.getElementById('roleFilter').value;
  let query = `/users?page=${currentPage}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (role) query += `&role=${role}`;

  try {
    const res = await apiCall(query);
    users = res.data || res.users || [];
    const pagination = res.pagination || {};
    totalPages = pagination.totalPages || res.totalPages || res.total_pages || 1;
    currentPage = pagination.page || res.currentPage || res.current_page || currentPage;
    renderTable();
    renderPagination();
  } catch (err) {
    showToast('Không thể tải người dùng: ' + err.message, 'danger');
  }
}

function renderTable() {
  const tbody = document.getElementById('usersTable');
  if (!Array.isArray(users) || !users.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Không tìm thấy người dùng</td></tr>';
    return;
  }
  tbody.innerHTML = users.map((u, i) => {
    const id = u._id || u.id;
    const isActive = u.isActive !== false && u.active !== false && u.status !== 'locked';
    const isAdmin = u.role === 'admin';
    const isStaff = u.role === 'staff';
    const roleBadge = isAdmin ? '<span class="badge bg-dark">Admin</span>'
      : isStaff ? '<span class="badge bg-warning text-dark">Staff</span>'
      : '<span class="badge bg-info text-dark">User</span>';
    const createdAt = u.createdAt || u.created_at;
    return `
    <tr>
      <td class="text-muted">${(currentPage - 1) * 10 + i + 1}</td>
      <td>
        <img src="${u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.fullName || u.name || 'U')}&background=random`}"
             alt="" class="rounded-circle" width="36" height="36" style="object-fit:cover;">
      </td>
      <td class="fw-semibold">${u.fullName || u.name || '-'}</td>
      <td>${u.email}</td>
      <td>${u.phone || '-'}</td>
      <td>
        ${roleBadge}
      </td>
      <td>${u.points || u.loyaltyPoints || 0}</td>
      <td>
        <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">${isActive ? 'Hoạt động' : 'Đã khóa'}</span>
      </td>
      <td>${createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '-'}</td>
      <td>
        ${(!isAdmin && !isStaff) ? `
          <button class="btn btn-sm ${isActive ? 'btn-outline-warning' : 'btn-outline-success'}"
                  onclick="toggleActive('${id}')" title="${isActive ? 'Khóa' : 'Mở khóa'}">
            <i class="bi ${isActive ? 'bi-lock' : 'bi-unlock'}"></i>
          </button>
        ` : '<span class="text-muted">-</span>'}
      </td>
    </tr>`;
  }).join('');
}

function renderPagination() {
  const pag = document.getElementById('pagination');
  if (totalPages <= 1) { pag.innerHTML = ''; return; }
  let html = '';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">&laquo;</a></li>`;
  for (let p = 1; p <= totalPages; p++) {
    html += `<li class="page-item ${p === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${p})">${p}</a></li>`;
  }
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">&raquo;</a></li>`;
  pag.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  loadUsers();
}

async function toggleActive(id) {
  const user = users.find(u => (u._id || u.id) === id);
  const isActive = user && user.isActive !== false && user.active !== false && user.status !== 'locked';
  const action = isActive ? 'khóa' : 'mở khóa';
  if (!confirm(`Bạn có chắc muốn ${action} tài khoản này?`)) return;

  try {
    await apiCall(`/users/${id}/toggle-active`, { method: 'PUT' });
    showToast(`Đã ${action} tài khoản thành công!`, 'success');
    loadUsers();
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
  }
}

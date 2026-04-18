// Quản lý Liên hệ - Sách Hub Admin
let contacts = [];
let currentStatus = '';
let currentContactId = null;
let currentPage = 1;
let totalPages = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) { window.location.href = '/'; return; }
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = user.fullName || user.name || 'Admin';
  if (user.role === 'staff') {
    document.querySelectorAll('[data-role="admin"]').forEach(el => el.style.display = 'none');
    const badge = document.querySelector('.badge-admin');
    if (badge) badge.textContent = 'STAFF';
  }
  loadContacts();
});

async function loadContacts(page = 1) {
  try {
    currentPage = page;
    let query = `/contacts?page=${page}&limit=${limit}`;
    if (currentStatus) query += `&status=${currentStatus}`;
    const res = await apiCall(query);
    contacts = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
    const pagination = res.pagination || {};
    totalPages = pagination.totalPages || 1;
    renderContactsTable();
    renderContactsPagination();
    updateNewCount();
  } catch (err) {
    showToast('Không thể tải liên hệ: ' + err.message, 'danger');
  }
}

function renderContactsPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadContacts(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadContacts(${i})">${i}</a>
      </li>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadContacts(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

function updateNewCount() {
  const newCount = contacts.filter(c => c.status === 'new' || !c.status).length;
  const badge = document.getElementById('newCount');
  if (badge) badge.textContent = currentStatus ? '' : newCount;
}

function getStatusBadge(status) {
  switch (status) {
    case 'read': return '<span class="badge bg-info">Đã đọc</span>';
    case 'replied': return '<span class="badge bg-success">Đã trả lời</span>';
    case 'new': default: return '<span class="badge bg-danger">Mới</span>';
  }
}

function renderContactsTable() {
  const tbody = document.getElementById('contactsTable');
  if (!contacts.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Không có liên hệ nào</td></tr>';
    return;
  }
  tbody.innerHTML = contacts.map((c, i) => {
    const id = c._id || c.id;
    const createdAt = c.createdAt || c.created_at;
    const isNew = c.status === 'new' || !c.status;
    return `
    <tr class="${isNew ? 'table-light fw-semibold' : ''}">
      <td class="text-muted">${i + 1}</td>
      <td>${c.fullName || c.name || '-'}</td>
      <td>${c.email}</td>
      <td>${c.subject || '-'}</td>
      <td>${getStatusBadge(c.status)}</td>
      <td>${createdAt ? new Date(createdAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</td>
      <td>
        <button class="btn btn-sm btn-outline-primary" onclick="viewContact('${id}')" title="Xem chi tiết">
          <i class="bi bi-eye"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function filterByStatus(btn) {
  currentStatus = btn.getAttribute('data-status') || '';
  // Update active tab
  document.querySelectorAll('.tab-filters .tab-btn').forEach(tab => tab.classList.remove('active'));
  btn.classList.add('active');
  loadContacts(1);
}

function viewContact(id) {
  const contact = contacts.find(c => (c._id || c.id) === id);
  if (!contact) return;
  currentContactId = id;

  document.getElementById('detailName').textContent = contact.fullName || contact.name || '-';
  document.getElementById('detailEmail').textContent = contact.email;
  document.getElementById('detailPhone').textContent = contact.phone || 'Không có';
  document.getElementById('detailSubject').textContent = contact.subject || 'Không có chủ đề';
  document.getElementById('detailMessage').textContent = contact.message || contact.content || '';
  const createdAt = contact.createdAt || contact.created_at;
  document.getElementById('detailDate').textContent = createdAt
    ? new Date(createdAt).toLocaleString('vi-VN')
    : '-';
  document.getElementById('detailStatus').innerHTML = getStatusBadge(contact.status);

  // Build action buttons
  const actions = document.getElementById('detailActions');
  let btns = '<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Đóng</button>';
  if (contact.status === 'new' || !contact.status) {
    btns = `<button class="btn btn-info text-white" onclick="updateStatus('${id}', 'read')">
      <i class="bi bi-check me-1"></i> Đánh dấu đã đọc
    </button>` + btns;
  }
  if (contact.status !== 'replied') {
    btns = `<button class="btn btn-success" onclick="updateStatus('${id}', 'replied')">
      <i class="bi bi-reply me-1"></i> Đánh dấu đã trả lời
    </button>` + btns;
  }
  actions.innerHTML = btns;

  const modal = new bootstrap.Modal(document.getElementById('contactDetailModal'));
  modal.show();

  // Auto mark as read if new
  if (contact.status === 'new' || !contact.status) {
    updateStatusSilent(id, 'read');
  }
}

async function updateStatus(id, status) {
  try {
    await apiCall(`/contacts/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const statusText = status === 'read' ? 'đã đọc' : 'đã trả lời';
    showToast(`Đã đánh dấu ${statusText}!`, 'success');
    bootstrap.Modal.getInstance(document.getElementById('contactDetailModal')).hide();
    loadContacts(currentPage);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
  }
}

async function updateStatusSilent(id, status) {
  try {
    await apiCall(`/contacts/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    // Update local data without reload
    const contact = contacts.find(c => (c._id || c.id) === id);
    if (contact) contact.status = status;
    updateNewCount();
  } catch (err) {
    // Silent fail
  }
}

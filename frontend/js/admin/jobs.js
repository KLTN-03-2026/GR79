// Quản lý Tuyển dụng - Sách Hub Admin
let jobs = [];
let currentPage = 1;
let totalPages = 1;
const limit = 10;

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

  const avatar = document.getElementById('avatarUser');
  if (avatar) avatar.textContent = (user.fullName || 'A').charAt(0).toUpperCase();

  loadJobs();
});

function formatDateVi(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

async function loadJobs(page = 1) {
  try {
    currentPage = page;
    const res = await apiCall(`/jobs?all=true&page=${page}&limit=${limit}`);
    jobs = res.jobs || res.data || [];
    const pagination = res.pagination || {};
    totalPages = pagination.totalPages || 1;
    renderJobsTable();
    renderJobsPagination();
  } catch (err) {
    showToast('Không thể tải danh sách tuyển dụng: ' + err.message, 'danger');
  }
}

function renderJobsPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadJobs(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadJobs(${i})">${i}</a>
      </li>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadJobs(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderJobsTable() {
  const tbody = document.getElementById('jobsTable');
  if (!jobs.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-muted">Chưa có tin tuyển dụng nào</td></tr>';
    return;
  }
  tbody.innerHTML = jobs.map((job, i) => {
    const id = job._id;
    const isActive = job.isActive !== false;
    const expired = job.deadline && new Date(job.deadline) < new Date();
    return `
      <tr>
        <td class="text-muted">${i + 1}</td>
        <td>
          <div class="fw-semibold">${escapeHtml(job.title)}</div>
          <small class="text-muted"><i class="bi bi-geo-alt"></i> ${escapeHtml(job.location || '')}</small>
        </td>
        <td><span class="badge bg-light text-dark">${escapeHtml(job.department || '-')}</span></td>
        <td>${escapeHtml(job.jobType || '-')}</td>
        <td class="text-center">${job.quantity || 1}</td>
        <td>${formatDateVi(job.deadline)}</td>
        <td>
          ${isActive
            ? (expired
              ? '<span class="badge bg-warning text-dark">Hết hạn</span>'
              : '<span class="badge bg-success">Đang tuyển</span>')
            : '<span class="badge bg-secondary">Đã đóng</span>'}
        </td>
        <td>
          <a href="tuyen-dung-form.html?id=${id}" class="btn btn-sm btn-outline-primary me-1" title="Sửa">
            <i class="bi bi-pencil"></i>
          </a>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteJob('${id}')" title="Xóa">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
}

async function deleteJob(id) {
  if (!confirm('Bạn có chắc muốn đóng tin tuyển dụng này?')) return;
  try {
    await apiCall(`/jobs/${id}`, { method: 'DELETE' });
    showToast('Đã đóng tin tuyển dụng!', 'success');
    loadJobs(currentPage);
  } catch (err) {
    showToast('Lỗi khi đóng tin: ' + err.message, 'danger');
  }
}

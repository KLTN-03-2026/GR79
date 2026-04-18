// Quản lý Tuyển dụng - Sách Hub Admin
let jobs = [];
let editingJobId = null;
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
  document.getElementById('jobForm').addEventListener('submit', handleJobSubmit);
});

function formatDateVi(date) {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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
          <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditJob('${id}')" title="Sửa">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteJob('${id}')" title="Đóng tin">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>`;
  }).join('');
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

function openAddJob() {
  editingJobId = null;
  document.getElementById('jobModalTitle').textContent = 'Đăng tin tuyển dụng';
  document.getElementById('jobForm').reset();
  document.getElementById('jobId').value = '';
  document.getElementById('jobLocation').value = 'TP. Hồ Chí Minh';
  document.getElementById('jobSalary').value = 'Thỏa thuận';
  document.getElementById('jobExperience').value = '1-2 năm';
  document.getElementById('jobQuantity').value = 1;
  document.getElementById('jobIsActive').checked = true;
}

function openEditJob(id) {
  const job = jobs.find(j => j._id === id);
  if (!job) return;
  editingJobId = id;
  document.getElementById('jobModalTitle').textContent = 'Sửa tin tuyển dụng';
  document.getElementById('jobId').value = id;
  document.getElementById('jobTitle').value = job.title || '';
  document.getElementById('jobDepartment').value = job.department || 'Công nghệ';
  document.getElementById('jobType').value = job.jobType || 'Toàn thời gian';
  document.getElementById('jobLocation').value = job.location || 'TP. Hồ Chí Minh';
  document.getElementById('jobSalary').value = job.salary || 'Thỏa thuận';
  document.getElementById('jobExperience').value = job.experience || '1-2 năm';
  document.getElementById('jobQuantity').value = job.quantity || 1;
  document.getElementById('jobDeadline').value = toInputDate(job.deadline);
  document.getElementById('jobDescription').value = job.description || '';
  document.getElementById('jobRequirements').value = job.requirements || '';
  document.getElementById('jobBenefits').value = job.benefits || '';
  document.getElementById('jobIsActive').checked = job.isActive !== false;

  const modal = new bootstrap.Modal(document.getElementById('jobModal'));
  modal.show();
}

async function handleJobSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveJob');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang lưu...';

  try {
    const payload = {
      title: document.getElementById('jobTitle').value.trim(),
      department: document.getElementById('jobDepartment').value,
      jobType: document.getElementById('jobType').value,
      location: document.getElementById('jobLocation').value.trim(),
      salary: document.getElementById('jobSalary').value.trim(),
      experience: document.getElementById('jobExperience').value.trim(),
      quantity: parseInt(document.getElementById('jobQuantity').value) || 1,
      deadline: document.getElementById('jobDeadline').value || null,
      description: document.getElementById('jobDescription').value.trim(),
      requirements: document.getElementById('jobRequirements').value.trim(),
      benefits: document.getElementById('jobBenefits').value.trim(),
      isActive: document.getElementById('jobIsActive').checked
    };

    let endpoint = '/jobs';
    let method = 'POST';
    if (editingJobId) {
      endpoint = `/jobs/${editingJobId}`;
      method = 'PUT';
    }

    await apiCall(endpoint, {
      method,
      body: JSON.stringify(payload)
    });

    showToast(editingJobId ? 'Cập nhật tin tuyển dụng thành công!' : 'Đăng tin tuyển dụng thành công!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('jobModal')).hide();
    loadJobs(currentPage);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Lưu tin tuyển dụng';
  }
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

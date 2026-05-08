// Tuyển dụng Form - Thêm/Sửa tin tuyển dụng
let editingJobId = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = user && user.role === 'staff' ? '/pages/admin/dashboard.html' : '/';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  editingJobId = params.get('id');

  if (editingJobId) {
    document.getElementById('pageTitle').textContent = 'Sửa tin tuyển dụng';
    document.title = 'Sửa tin tuyển dụng - Admin Sách Hub';
    loadJobData(editingJobId);
  }

  document.getElementById('jobForm').addEventListener('submit', handleJobSubmit);
});

function toInputDate(date) {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function loadJobData(id) {
  try {
    const res = await apiCall(`/jobs/${id}`);
    const job = res.job || res.data || res;

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
  } catch (err) {
    showToast('Không thể tải tin tuyển dụng: ' + err.message, 'danger');
  }
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

    await apiCall(endpoint, { method, body: JSON.stringify(payload) });
    showToast(editingJobId ? 'Cập nhật tin tuyển dụng thành công!' : 'Đăng tin tuyển dụng thành công!', 'success');

    setTimeout(() => { window.location.href = 'tuyen-dung.html'; }, 1000);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Lưu tin tuyển dụng';
  }
}

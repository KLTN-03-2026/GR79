// Jobs - Trang Tuyển dụng (User)
document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateHeaderAuth === 'function') updateHeaderAuth();

  const filterDept = document.getElementById('filterDept');
  const filterType = document.getElementById('filterType');

  if (filterDept) filterDept.addEventListener('change', loadJobs);
  if (filterType) filterType.addEventListener('change', loadJobs);

  loadJobs();
});

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDateVi(date) {
  if (!date) return 'Không giới hạn';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Không giới hạn';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function deptIcon(dept) {
  const map = {
    'Công nghệ': 'bi-code-slash',
    'Marketing': 'bi-megaphone',
    'Vận hành': 'bi-box-seam',
    'CSKH': 'bi-headset',
    'Kế toán': 'bi-calculator',
    'Khác': 'bi-briefcase'
  };
  return map[dept] || 'bi-briefcase';
}

async function loadJobs() {
  const container = document.getElementById('positionList');
  const noMsg = document.getElementById('noPositions');
  if (!container) return;

  const dept = document.getElementById('filterDept')?.value || '';
  const type = document.getElementById('filterType')?.value || '';

  const params = new URLSearchParams();
  if (dept) params.append('department', dept);
  if (type) params.append('jobType', type);
  params.append('limit', '50');

  container.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-primary"></div></div>';

  try {
    const res = await apiCall('/jobs?' + params.toString());
    const jobs = res.jobs || [];

    if (!jobs.length) {
      container.innerHTML = '';
      if (noMsg) noMsg.style.display = 'block';
      return;
    }

    if (noMsg) noMsg.style.display = 'none';

    container.innerHTML = jobs.map(job => `
      <div class="position-card">
        <div class="position-icon"><i class="bi ${deptIcon(job.department)}"></i></div>
        <div class="position-info">
          <h4>${escapeHtml(job.title)}</h4>
          <p class="dept">${escapeHtml(job.department)}</p>
          <div class="position-tags">
            <span class="position-tag full-time">${escapeHtml(job.jobType)}</span>
            <span class="position-tag location"><i class="bi bi-geo-alt"></i> ${escapeHtml(job.location || 'TP. Hồ Chí Minh')}</span>
            <span class="position-tag"><i class="bi bi-cash-stack"></i> ${escapeHtml(job.salary || 'Thỏa thuận')}</span>
            <span class="position-tag"><i class="bi bi-calendar-event"></i> Hạn: ${formatDateVi(job.deadline)}</span>
          </div>
        </div>
        <a href="/pages/chi-tiet-tuyen-dung.html?slug=${encodeURIComponent(job.slug)}" class="btn-apply">Xem chi tiết</a>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<div class="text-center text-danger py-4">Không thể tải danh sách công việc: ${escapeHtml(err.message)}</div>`;
  }
}

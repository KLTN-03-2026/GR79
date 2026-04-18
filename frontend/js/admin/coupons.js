// Quản lý Mã giảm giá - Sách Hub Admin
let coupons = [];
let editingCouponId = null;
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
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = user.fullName || 'Admin';
  loadCoupons();

  document.getElementById('couponForm').addEventListener('submit', handleCouponSubmit);
});

async function loadCoupons(page = 1) {
  try {
    currentPage = page;
    const res = await apiCall(`/coupons?page=${page}&limit=${limit}`);
    coupons = Array.isArray(res.data) ? res.data : Array.isArray(res) ? res : (Array.isArray(res.coupons) ? res.coupons : []);
    const pagination = res.pagination || {};
    totalPages = pagination.totalPages || 1;
    renderCouponsTable();
    renderCouponsPagination();
  } catch (err) {
    showToast('Không thể tải mã giảm giá: ' + err.message, 'danger');
  }
}

function renderCouponsPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadCoupons(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadCoupons(${i})">${i}</a>
      </li>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadCoupons(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

function getCouponStatus(coupon) {
  const now = new Date();
  const endDate = coupon.endDate;
  const limit = coupon.usageLimit;
  const used = coupon.usedCount || 0;

  if (endDate && new Date(endDate) < now) {
    return { text: 'Hết hạn', class: 'bg-danger' };
  }
  if (limit && used >= limit) {
    return { text: 'Hết lượt', class: 'bg-warning text-dark' };
  }
  if (coupon.isActive === false) {
    return { text: 'Tạm dừng', class: 'bg-secondary' };
  }
  return { text: 'Còn hạn', class: 'bg-success' };
}

function renderCouponsTable() {
  const tbody = document.getElementById('couponsTable');
  if (!coupons.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Chưa có mã giảm giá nào</td></tr>';
    return;
  }
  tbody.innerHTML = coupons.map((c, i) => {
    const id = c._id || c.id;
    const type = c.discountType || c.type || 'percent';
    const value = c.discountValue || c.value || 0;
    const minOrder = c.minOrderAmount || c.minOrder || 0;
    const maxDiscount = c.maxDiscount || 0;
    const used = c.usedCount || 0;
    const limit = c.usageLimit || '-';
    const endDate = c.endDate || c.end_date;
    const status = getCouponStatus(c);

    return `
    <tr>
      <td class="text-muted">${i + 1}</td>
      <td><code class="fs-6 fw-bold">${c.code}</code></td>
      <td>${type === 'percent' ? '<i class="bi bi-percent"></i> Phần trăm' : '<i class="bi bi-cash"></i> Cố định'}</td>
      <td class="fw-semibold">${type === 'percent' ? value + '%' : formatPrice(value)}</td>
      <td>${minOrder ? formatPrice(minOrder) : '-'}</td>
      <td>${maxDiscount ? formatPrice(maxDiscount) : '-'}</td>
      <td>${used} / ${limit}</td>
      <td>${endDate ? new Date(endDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}</td>
      <td><span class="badge ${status.class}">${status.text}</span></td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditCoupon('${id}')" title="Sửa">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteCoupon('${id}')" title="Xóa">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function openAddCoupon() {
  editingCouponId = null;
  document.getElementById('couponModalTitle').textContent = 'Tạo mã giảm giá mới';
  document.getElementById('couponForm').reset();
  document.getElementById('couponId').value = '';
  document.getElementById('couponActive').checked = true;
}

function openEditCoupon(id) {
  const c = coupons.find(cp => (cp._id || cp.id) === id);
  if (!c) return;
  editingCouponId = id;
  document.getElementById('couponModalTitle').textContent = 'Sửa mã giảm giá';
  document.getElementById('couponId').value = id;
  document.getElementById('couponCode').value = c.code;
  document.getElementById('couponDesc').value = c.description || '';
  document.getElementById('couponType').value = c.discountType || c.type || 'percent';
  document.getElementById('couponValue').value = c.discountValue || c.value || '';
  document.getElementById('couponMinOrder').value = c.minOrderAmount || c.minOrder || '';
  document.getElementById('couponMaxDiscount').value = c.maxDiscount || '';
  document.getElementById('couponLimit').value = c.usageLimit || c.usage_limit || c.limit || '';
  document.getElementById('couponActive').checked = c.isActive !== false;

  const startDate = c.startDate || c.start_date;
  const endDate = c.endDate || c.end_date;
  document.getElementById('couponStartDate').value = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
  document.getElementById('couponEndDate').value = endDate ? new Date(endDate).toISOString().split('T')[0] : '';

  const modal = new bootstrap.Modal(document.getElementById('couponModal'));
  modal.show();
}

async function handleCouponSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveCoupon');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang lưu...';

  try {
    const body = {
      code: document.getElementById('couponCode').value.trim().toUpperCase(),
      description: document.getElementById('couponDesc').value.trim(),
      discountType: document.getElementById('couponType').value,
      discountValue: Number(document.getElementById('couponValue').value),
      minOrderAmount: Number(document.getElementById('couponMinOrder').value) || 0,
      maxDiscount: Number(document.getElementById('couponMaxDiscount').value) || 0,
      startDate: document.getElementById('couponStartDate').value || null,
      endDate: document.getElementById('couponEndDate').value || null,
      usageLimit: Number(document.getElementById('couponLimit').value) || null,
      isActive: document.getElementById('couponActive').checked,
    };

    let endpoint = '/coupons';
    let method = 'POST';
    if (editingCouponId) {
      endpoint = `/coupons/${editingCouponId}`;
      method = 'PUT';
    }

    await apiCall(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    showToast(editingCouponId ? 'Cập nhật mã giảm giá thành công!' : 'Tạo mã giảm giá thành công!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('couponModal')).hide();
    loadCoupons(currentPage);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Lưu';
  }
}

async function deleteCoupon(id) {
  if (!confirm('Bạn có chắc muốn xóa mã giảm giá này?')) return;
  try {
    await apiCall(`/coupons/${id}`, { method: 'DELETE' });
    showToast('Đã xóa mã giảm giá!', 'success');
    loadCoupons(currentPage);
  } catch (err) {
    showToast('Lỗi khi xóa: ' + err.message, 'danger');
  }
}

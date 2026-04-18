// ====== ADMIN ORDERS MANAGEMENT ======

// Check admin/staff role
(function checkAdminOrStaff() {
  const user = getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '/';
    return;
  }
  const avatar = document.getElementById('avatarUser');
  if (avatar && user.fullName) {
    avatar.textContent = user.fullName.charAt(0).toUpperCase();
  }
  if (user.role === 'staff') {
    document.querySelectorAll('[data-role="admin"]').forEach(el => el.style.display = 'none');
    const badge = document.querySelector('.badge-admin');
    if (badge) badge.textContent = 'STAFF';
  }
})();

let currentPage = 1;
let currentStatus = '';
const limit = 10;

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', class: 'pending' },
  confirmed: { label: 'Đã xác nhận', class: 'confirmed' },
  shipping: { label: 'Đang giao', class: 'shipping' },
  delivered: { label: 'Đã giao', class: 'delivered' },
  cancelled: { label: 'Đã hủy', class: 'cancelled' }
};

const STATUS_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancelled: []
};

// ====== LOAD ORDERS ======
async function loadOrders(page = 1) {
  currentPage = page;
  let query = `/orders?page=${page}&limit=${limit}`;
  if (currentStatus) query += `&status=${currentStatus}`;

  const tbody = document.getElementById('ordersTable');
  tbody.innerHTML = '<tr><td colspan="7"><div class="admin-spinner"></div></td></tr>';

  try {
    const data = await apiCall(query);
    const orders = data.data || data.orders || [];
    const pagination = data.pagination || {};
    const total = pagination.total || data.total || data.totalCount || 0;
    const totalPages = pagination.totalPages || data.totalPages || Math.ceil(total / limit);

    // Update counts
    updateCounts(data.counts || {});

    if (!orders.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Không có đơn hàng nào</td></tr>';
      document.getElementById('pageInfo').textContent = 'Hiển thị 0 kết quả';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = orders.map(order => {
      const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
      const initial = (order.user?.fullName || order.shippingAddress?.fullName || order.customerName || 'K').charAt(0).toUpperCase();
      const customerName = order.user?.fullName || order.shippingAddress?.fullName || order.customerName || 'Khách hàng';
      const date = new Date(order.createdAt).toLocaleDateString('vi-VN');
      const paymentMethod = order.paymentMethod === 'vnpay' ? 'VNPAY' : 'COD';
      const paymentBadge = order.paymentMethod === 'vnpay'
        ? '<span style="background:#DBEAFE;color:#2563EB;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">VNPAY</span>'
        : '<span style="background:#F3F4F6;color:#6B7280;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;">COD</span>';

      // Nút xem chi tiết → mở modal
      const actionHtml = `
        <button class="btn btn-sm btn-outline-primary" onclick="viewOrder('${order._id}')" title="Xem chi tiết">
          <i class="bi bi-eye"></i> Chi tiết
        </button>
      `;

      return `
        <tr>
          <td><strong>#${order.orderCode || order._id?.slice(-6) || '---'}</strong></td>
          <td>
            <div class="user-cell">
              <div class="user-avatar">${initial}</div>
              <div>
                <div class="user-name">${customerName}</div>
                <div class="user-email">${order.user?.email || order.shippingAddress?.phone || ''}</div>
              </div>
            </div>
          </td>
          <td>${date}</td>
          <td><strong>${formatPrice(order.total || order.totalAmount || 0)}</strong></td>
          <td>${paymentBadge}</td>
          <td><span class="badge-status ${status.class}">${status.label}</span></td>
          <td>${actionHtml}</td>
        </tr>
      `;
    }).join('');

    // Page info
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
    document.getElementById('pageInfo').textContent = `Hiển thị ${start}-${end} trong ${total} đơn hàng`;

    // Pagination
    renderPagination(currentPage, totalPages);
  } catch (error) {
    console.error('Load orders error:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

function updateCounts(counts) {
  const all = (counts.pending || 0) + (counts.confirmed || 0) + (counts.shipping || 0) + (counts.delivered || 0) + (counts.cancelled || 0);
  document.getElementById('countAll').textContent = counts.all || all || 0;
  document.getElementById('countPending').textContent = counts.pending || 0;
  document.getElementById('countConfirmed').textContent = counts.confirmed || 0;
  document.getElementById('countShipping').textContent = counts.shipping || 0;
  document.getElementById('countDelivered').textContent = counts.delivered || 0;
  document.getElementById('countCancelled').textContent = counts.cancelled || 0;
}

function renderPagination(current, total) {
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${current === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadOrders(${current - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      html += `<li class="page-item ${i === current ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadOrders(${i})">${i}</a>
      </li>`;
    } else if (i === current - 2 || i === current + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${current === total ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadOrders(${current + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

// ====== FILTER BY STATUS ======
function filterByStatus(btn) {
  // Update active tab
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  currentStatus = btn.dataset.status;
  loadOrders(1);
}

// ====== UPDATE STATUS ======
async function updateStatus(orderId, newStatus) {
  const statusLabel = STATUS_MAP[newStatus]?.label || newStatus;
  if (!confirm(`Xác nhận chuyển trạng thái sang "${statusLabel}"?`)) return;

  try {
    await apiCall(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Đã cập nhật trạng thái: ${statusLabel}`);
    loadOrders(currentPage);
  } catch (error) {
    showToast(error.message || 'Lỗi cập nhật trạng thái!', 'error');
  }
}

// ====== VIEW ORDER DETAIL ======
async function viewOrder(orderId) {
  const modal = new bootstrap.Modal(document.getElementById('orderModal'));
  document.getElementById('orderDetail').innerHTML = '<div class="admin-spinner"></div>';
  modal.show();

  try {
    const res = await apiCall(`/orders/${orderId}`);
    const order = res.data || res.order || res;

    const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
    const addr = order.shippingAddress || {};
    const user = order.user || {};
    const items = order.items || [];

    document.getElementById('orderCode').textContent = `#${order.orderCode || '---'}`;

    document.getElementById('orderDetail').innerHTML = `
      <!-- Customer Info -->
      <div class="row mb-4">
        <div class="col-md-6">
          <h6 style="font-weight:700; margin-bottom:12px;">Thông tin khách hàng</h6>
          <div style="background:var(--bg-alt); padding:16px; border-radius:var(--radius-md);">
            <p class="mb-1"><strong>${addr.fullName || user.fullName || 'Khách hàng'}</strong></p>
            <p class="mb-1 text-muted"><i class="bi bi-telephone me-1"></i>${addr.phone || user.phone || '---'}</p>
            <p class="mb-1 text-muted"><i class="bi bi-envelope me-1"></i>${user.email || '---'}</p>
            <p class="mb-0 text-muted"><i class="bi bi-geo-alt me-1"></i>${addr.address || 'Chưa có địa chỉ'}</p>
          </div>
        </div>
        <div class="col-md-6">
          <h6 style="font-weight:700; margin-bottom:12px;">Thông tin đơn hàng</h6>
          <div style="background:var(--bg-alt); padding:16px; border-radius:var(--radius-md);">
            <p class="mb-1">Ngày đặt: <strong>${new Date(order.createdAt).toLocaleDateString('vi-VN')}</strong></p>
            <p class="mb-1">Thanh toán: <strong>${order.paymentMethod === 'vnpay' || order.paymentMethod === 'VNPAY' ? 'VNPay' : 'COD'}</strong>
              <span class="badge ${order.paymentStatus === 'paid' ? 'bg-success' : order.paymentStatus === 'failed' ? 'bg-danger' : 'bg-warning text-dark'}">
                ${order.paymentStatus === 'paid' ? 'Đã thanh toán' : order.paymentStatus === 'failed' ? 'Thất bại' : 'Chờ thanh toán'}
              </span>
            </p>
            <p class="mb-0">Trạng thái: <span class="badge-status ${status.class}">${status.label}</span></p>
          </div>
        </div>
      </div>

      <!-- Items -->
      <h6 style="font-weight:700; margin-bottom:12px;">Sản phẩm</h6>
      <table class="admin-table" style="margin-bottom:16px;">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Đơn giá</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            return `
              <tr>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <img src="${item.image || item.book?.images?.[0] || '/images/placeholder.png'}" style="width:40px;height:52px;object-fit:cover;border-radius:4px;">
                    <span>${item.title || item.book?.title || ''}</span>
                  </div>
                </td>
                <td>${formatPrice(item.price || 0)}</td>
                <td>${item.quantity || 1}</td>
                <td><strong>${formatPrice((item.price || 0) * (item.quantity || 1))}</strong></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <!-- Total -->
      <div style="text-align:right; padding:16px; background:var(--bg-alt); border-radius:var(--radius-md);">
        <div class="mb-1">Tạm tính: <strong>${formatPrice(order.subtotal || order.total || 0)}</strong></div>
        <div class="mb-1">Phí vận chuyển: <strong>${formatPrice(order.shippingFee || 0)}</strong></div>
        ${order.discount ? `<div class="mb-1">Giảm giá: <strong class="text-success">-${formatPrice(order.discount)}</strong></div>` : ''}
        <div style="font-size:18px; margin-top:8px; padding-top:8px; border-top:1px solid var(--border);">
          Tổng cộng: <strong class="text-danger">${formatPrice(order.total || order.totalAmount || 0)}</strong>
        </div>
      </div>

      ${order.note ? `
      <div class="mt-3" style="background:#FEF3C7; padding:12px 16px; border-radius:var(--radius-md);">
        <strong><i class="bi bi-sticky me-1"></i>Ghi chú:</strong> ${order.note}
      </div>` : ''}

      <!-- Chuyển trạng thái -->
      ${(() => {
        const nextStatuses = STATUS_FLOW[order.status] || [];
        if (nextStatuses.length === 0) return '';
        const buttons = nextStatuses.map(s => {
          const sm = STATUS_MAP[s];
          const color = s === 'cancelled' ? 'btn-outline-danger' : s === 'confirmed' ? 'btn-outline-info' : s === 'shipping' ? 'btn-outline-primary' : 'btn-outline-success';
          return `<button class="btn ${color}" onclick="updateStatusFromModal('${order._id}', '${s}')"><i class="bi bi-arrow-right-circle me-1"></i>${sm.label}</button>`;
        }).join(' ');
        return `
          <div class="mt-3" style="padding:16px; background:var(--bg-alt); border-radius:var(--radius-md);">
            <h6 style="font-weight:700; margin-bottom:12px;"><i class="bi bi-arrow-repeat me-1"></i>Chuyển trạng thái</h6>
            <div class="d-flex gap-2 flex-wrap">${buttons}</div>
          </div>
        `;
      })()}
    `;
  } catch (error) {
    document.getElementById('orderDetail').innerHTML = '<div class="text-center py-4 text-danger">Lỗi tải thông tin đơn hàng</div>';
  }
}

// ====== UPDATE STATUS FROM MODAL ======
async function updateStatusFromModal(orderId, newStatus) {
  const statusLabel = STATUS_MAP[newStatus]?.label || newStatus;
  if (!confirm(`Xác nhận chuyển trạng thái sang "${statusLabel}"?`)) return;

  try {
    await apiCall(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Đã cập nhật trạng thái: ${statusLabel}`);
    // Đóng modal và reload
    bootstrap.Modal.getInstance(document.getElementById('orderModal')).hide();
    loadOrders(currentPage);
  } catch (error) {
    showToast(error.message || 'Lỗi cập nhật trạng thái!', 'error');
  }
}

// ====== INIT ======
loadOrders();

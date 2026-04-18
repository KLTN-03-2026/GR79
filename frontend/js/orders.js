// ====== ORDERS PAGE ======

let currentStatus = '';
let currentPage = 1;
const ITEMS_PER_PAGE = 5;

const STATUS_MAP = {
  pending: { label: 'Chờ xác nhận', class: 'bg-warning text-dark' },
  confirmed: { label: 'Đã xác nhận', class: 'bg-info text-white' },
  shipping: { label: 'Đang giao', class: 'bg-primary text-white' },
  delivered: { label: 'Đã giao', class: 'bg-success text-white' },
  cancelled: { label: 'Đã hủy', class: 'bg-danger text-white' }
};

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }
  updateHeaderAuth();
  loadSidebarInfo();
  initTabs();
  loadOrders();
});

// ====== LOAD SIDEBAR INFO ======
async function loadSidebarInfo() {
  try {
    const res = await apiCall('/auth/profile');
    const user = res.user || res;
    document.getElementById('sidebarName').textContent = user.fullName || '---';
    if (user.points !== undefined) {
      document.getElementById('sidebarPoints').textContent = user.points + ' Pts';
    }
    if (user.voucherCount !== undefined) {
      document.getElementById('sidebarVouchers').textContent = user.voucherCount + ' mã giảm giá';
    }
  } catch (error) {
    // Silent fail for sidebar
  }
}

// ====== INIT TABS ======
function initTabs() {
  const tabs = document.querySelectorAll('#orderTabs .order-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentStatus = tab.dataset.status;
      currentPage = 1;
      loadOrders();
    });
  });
}

// ====== LOAD ORDERS ======
async function loadOrders() {
  const container = document.getElementById('ordersList');
  container.innerHTML = '<div class="text-center py-5"><div class="spinner-custom mx-auto"></div></div>';

  try {
    let endpoint = `/orders/my-orders?page=${currentPage}&limit=${ITEMS_PER_PAGE}`;
    if (currentStatus) {
      endpoint += `&status=${currentStatus}`;
    }

    const res = await apiCall(endpoint);
    const orders = res.data || res.orders || [];
    const totalPages = res.pagination?.totalPages || res.totalPages || res.pages || 1;

    if (orders.length === 0) {
      container.innerHTML = renderEmpty();
      document.getElementById('paginationWrapper').classList.add('d-none');
      return;
    }

    container.innerHTML = orders.map(order => renderOrderCard(order)).join('');
    renderPagination(totalPages);

  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-exclamation-circle"></i>
        <h5>Không thể tải đơn hàng</h5>
        <p>${error.message || 'Vui lòng thử lại sau'}</p>
      </div>
    `;
    document.getElementById('paginationWrapper').classList.add('d-none');
  }
}

// ====== RENDER ORDER CARD ======
function renderOrderCard(order) {
  const status = STATUS_MAP[order.status] || { label: order.status, class: 'bg-secondary text-white' };
  const orderCode = order.orderCode || `DH-${String(order._id || '').slice(-5).toUpperCase().padStart(5, '0')}`;
  const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }) : '---';

  const items = order.items || order.products || [];
  const totalAmount = order.total || order.totalAmount || 0;

  const itemsHTML = items.map(item => {
    const name = item.title || item.name || 'Sản phẩm';
    const image = item.image || item.thumbnail || 'https://placehold.co/60x75?text=Book';
    const qty = item.quantity || 1;
    const price = item.price || 0;

    return `
      <div class="order-item">
        <img src="${image}" alt="${name}" class="order-item-img">
        <div class="order-item-info">
          <div class="order-item-name">${name}</div>
          <div class="order-item-qty">Số lượng: ${qty}</div>
        </div>
        <div class="order-item-price">${formatPrice(price * qty)}</div>
      </div>
    `;
  }).join('');

  const cancelBtn = order.status === 'pending' ? `
    <button class="btn-outline-custom" style="padding: 6px 16px; font-size: 13px; color: var(--danger); border-color: var(--danger);"
            onclick="cancelOrder('${order._id}')">
      <i class="bi bi-x-circle"></i> Hủy đơn
    </button>
  ` : '';

  return `
    <div class="order-card">
      <div class="order-card-header">
        <div class="d-flex align-items-center gap-3 flex-wrap">
          <span class="order-code"><i class="bi bi-receipt me-1"></i>${orderCode}</span>
          <span class="order-date"><i class="bi bi-calendar3 me-1"></i>${orderDate}</span>
        </div>
        <span class="order-status ${status.class}">${status.label}</span>
      </div>
      <div class="order-card-body">
        ${itemsHTML}
      </div>
      <div class="order-card-footer">
        <div class="order-total">
          Tổng tiền: <strong>${formatPrice(totalAmount)}</strong>
        </div>
        <div class="order-actions">
          ${cancelBtn}
          <button class="btn-primary-custom" style="padding: 6px 16px; font-size: 13px;"
                  onclick="viewOrderDetail('${order._id}')">
            <i class="bi bi-eye"></i> Xem chi tiết
          </button>
        </div>
      </div>
    </div>
  `;
}

// ====== RENDER EMPTY STATE ======
function renderEmpty() {
  const statusText = currentStatus ? STATUS_MAP[currentStatus]?.label || currentStatus : '';
  return `
    <div class="empty-state">
      <i class="bi bi-box-seam"></i>
      <h5>Không có đơn hàng nào${statusText ? ' ở trạng thái "' + statusText + '"' : ''}</h5>
      <p>Hãy mua sắm để có đơn hàng đầu tiên nhé!</p>
      <a href="/" class="btn-primary-custom mt-3" style="display: inline-flex;">
        <i class="bi bi-cart-plus"></i> Mua sắm ngay
      </a>
    </div>
  `;
}

// ====== RENDER PAGINATION ======
function renderPagination(totalPages) {
  const wrapper = document.getElementById('paginationWrapper');
  const pagination = document.getElementById('pagination');

  if (totalPages <= 1) {
    wrapper.classList.add('d-none');
    return;
  }

  wrapper.classList.remove('d-none');
  let html = '';

  // Previous
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;

  // Pages
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
  }

  // Next
  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  pagination.innerHTML = html;
}

// ====== GO TO PAGE ======
function goToPage(page) {
  if (page < 1) return;
  currentPage = page;
  loadOrders();
  window.scrollTo({ top: 300, behavior: 'smooth' });
}

// ====== VIEW ORDER DETAIL (Modal) ======
async function viewOrderDetail(orderId) {
  const modalEl = document.getElementById('orderDetailModal');
  if (!modalEl) {
    showToast('Không tìm thấy modal chi tiết', 'error');
    return;
  }
  const modal = new bootstrap.Modal(modalEl);
  const body = document.getElementById('orderDetailBody');
  body.innerHTML = '<div class="text-center py-4"><div class="spinner-border text-secondary"></div></div>';
  modal.show();

  try {
    const data = await apiCall(`/orders/${orderId}`);
    const order = data.data || data.order || data;

    const status = STATUS_MAP[order.status] || { label: order.status, class: 'bg-secondary text-white' };
    const orderCode = order.orderCode || `DH-${String(order._id || '').slice(-5).toUpperCase().padStart(5, '0')}`;
    const orderDate = order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : '---';
    const items = order.items || order.products || [];
    const shipping = order.shippingAddress || order.shipping || {};
    const subtotal = order.subtotal || items.reduce((s, i) => s + ((i.price || 0) * (i.quantity || 1)), 0);
    const shippingFee = order.shippingFee || 0;
    const discount = order.discount || 0;
    const total = order.total || order.totalAmount || 0;

    const paymentMap = {
      cod: 'Thanh toán khi nhận hàng (COD)',
      vnpay: 'VNPay',
      momo: 'MoMo',
      bank: 'Chuyển khoản ngân hàng'
    };
    const paymentLabel = paymentMap[order.paymentMethod] || order.paymentMethod || '---';

    const itemsHTML = items.map(item => {
      const name = item.title || item.name || (item.book && item.book.title) || 'Sản phẩm';
      const image = item.image || item.thumbnail || (item.book && item.book.images && item.book.images[0]) || 'https://placehold.co/60x75?text=Book';
      const qty = item.quantity || 1;
      const price = item.price || 0;
      return `
        <tr>
          <td style="width:70px"><img src="${image}" alt="${name}" style="width:60px;height:75px;object-fit:cover;border-radius:4px;"></td>
          <td>${name}</td>
          <td class="text-center">${qty}</td>
          <td class="text-end">${formatPrice(price)}</td>
          <td class="text-end"><strong>${formatPrice(price * qty)}</strong></td>
        </tr>
      `;
    }).join('');

    body.innerHTML = `
      <div class="mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <div><strong>Mã đơn:</strong> ${orderCode}</div>
          <div class="text-muted small"><i class="bi bi-calendar3"></i> ${orderDate}</div>
        </div>
        <span class="badge ${status.class}" style="font-size:13px;padding:8px 12px;">${status.label}</span>
      </div>

      <div class="row g-3 mb-3">
        <div class="col-md-6">
          <div class="p-3 border rounded h-100">
            <h6 class="mb-2"><i class="bi bi-person"></i> Thông tin người nhận</h6>
            <div><strong>${shipping.fullName || order.fullName || '---'}</strong></div>
            <div class="small text-muted">SĐT: ${shipping.phone || order.phone || '---'}</div>
            <div class="small text-muted">Địa chỉ: ${[shipping.address, shipping.ward, shipping.district, shipping.city].filter(Boolean).join(', ') || order.address || '---'}</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="p-3 border rounded h-100">
            <h6 class="mb-2"><i class="bi bi-credit-card"></i> Thanh toán & Ghi chú</h6>
            <div><strong>Phương thức:</strong> ${paymentLabel}</div>
            <div><strong>Trạng thái TT:</strong> ${order.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}</div>
            <div class="small text-muted mt-1">Ghi chú: ${order.note || '---'}</div>
          </div>
        </div>
      </div>

      <div class="table-responsive">
        <table class="table table-sm align-middle">
          <thead class="table-light">
            <tr>
              <th>Ảnh</th>
              <th>Sản phẩm</th>
              <th class="text-center">SL</th>
              <th class="text-end">Đơn giá</th>
              <th class="text-end">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${itemsHTML}</tbody>
        </table>
      </div>

      <div class="d-flex justify-content-end">
        <div style="min-width:280px">
          <div class="d-flex justify-content-between"><span>Tạm tính:</span><span>${formatPrice(subtotal)}</span></div>
          <div class="d-flex justify-content-between"><span>Phí vận chuyển:</span><span>${formatPrice(shippingFee)}</span></div>
          ${discount > 0 ? `<div class="d-flex justify-content-between text-success"><span>Giảm giá:</span><span>-${formatPrice(discount)}</span></div>` : ''}
          <hr class="my-2">
          <div class="d-flex justify-content-between fs-5"><strong>Tổng cộng:</strong><strong class="text-danger">${formatPrice(total)}</strong></div>
        </div>
      </div>
    `;
  } catch (error) {
    body.innerHTML = `
      <div class="text-center py-4 text-danger">
        <i class="bi bi-exclamation-circle fs-1"></i>
        <p class="mt-2">${error.message || 'Không thể tải chi tiết đơn hàng'}</p>
      </div>
    `;
  }
}

// ====== CANCEL ORDER ======
async function cancelOrder(orderId) {
  if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này không?')) return;

  try {
    await apiCall(`/orders/${orderId}/cancel`, {
      method: 'PUT'
    });
    showToast('Đã hủy đơn hàng thành công!');
    loadOrders();
  } catch (error) {
    showToast(error.message || 'Không thể hủy đơn hàng', 'error');
  }
}

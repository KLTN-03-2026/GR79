// ====== ADMIN DASHBOARD ======

// Check admin/staff role
(function checkAdminOrStaff() {
  const user = getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '/';
    return;
  }
  // Set avatar
  const avatar = document.getElementById('avatarUser');
  if (avatar && user.fullName) {
    avatar.textContent = user.fullName.charAt(0).toUpperCase();
  }
  // Hide admin-only sidebar items for staff
  if (user.role === 'staff') {
    document.querySelectorAll('[data-role="admin"]').forEach(el => el.style.display = 'none');
    // Hide report download button for staff
    const btnReport = document.getElementById('btnReport');
    if (btnReport) btnReport.style.display = 'none';
    // Update badge text
    const badge = document.querySelector('.badge-admin');
    if (badge) badge.textContent = 'STAFF';
  }
})();

// Set current date
document.getElementById('currentDate').textContent =
  new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// ====== LOAD STATS ======
let revenueChart = null;
let categoryChart = null;

async function loadDashboard() {
  try {
    const data = await apiCall('/dashboard/stats');
    const stats = data.data || data;
    renderStats(stats);
    renderRecentOrders(stats.recentOrders || []);
    renderBestSelling(stats.bestSellingBooks || []);
    initCharts(stats);
  } catch (error) {
    console.error('Load dashboard error:', error);
    // Load with demo data if API fails
    loadDemoData();
  }
}

function renderStats(data) {
  const stats = data || {};
  document.getElementById('statRevenue').textContent = formatPrice(stats.totalRevenue || stats.revenue || 0);
  document.getElementById('statOrders').textContent = (stats.totalOrders || stats.orders || 0).toLocaleString('vi-VN');
  document.getElementById('statCustomers').textContent = (stats.totalUsers || stats.customers || 0).toLocaleString('vi-VN');
  document.getElementById('statBooks').textContent = (stats.totalBooks || stats.booksSold || 0).toLocaleString('vi-VN');

  // Changes
  renderChange('statRevenueChange', stats.revenueChange);
  renderChange('statOrdersChange', stats.ordersChange);
  renderChange('statCustomersChange', stats.customersChange);
  renderChange('statBooksChange', stats.booksChange);
}

function renderChange(id, value) {
  const el = document.getElementById(id);
  if (!el || value === undefined) return;
  const isUp = value >= 0;
  el.className = `stat-change ${isUp ? 'up' : 'down'}`;
  el.innerHTML = `<i class="bi bi-arrow-${isUp ? 'up' : 'down'}"></i> ${isUp ? '+' : ''}${value}%`;
}

function renderRecentOrders(orders) {
  const tbody = document.getElementById('recentOrders');
  if (!orders.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-muted">Chưa có đơn hàng nào</td></tr>';
    return;
  }

  tbody.innerHTML = orders.slice(0, 8).map(order => {
    const statusMap = {
      pending: { label: 'Chờ xác nhận', class: 'pending' },
      confirmed: { label: 'Đã xác nhận', class: 'confirmed' },
      shipping: { label: 'Đang giao', class: 'shipping' },
      delivered: { label: 'Đã giao', class: 'delivered' },
      cancelled: { label: 'Đã hủy', class: 'cancelled' }
    };
    const status = statusMap[order.status] || statusMap.pending;
    const customerName = order.user?.fullName || order.customerName || 'Khách hàng';
    const initial = customerName.charAt(0).toUpperCase();
    const date = new Date(order.createdAt).toLocaleDateString('vi-VN');

    return `
      <tr>
        <td><strong>#${order.orderCode || order._id?.slice(-6) || '---'}</strong></td>
        <td>
          <div class="user-cell">
            <div class="user-avatar">${initial}</div>
            <div><div class="user-name">${customerName}</div></div>
          </div>
        </td>
        <td>${date}</td>
        <td><strong>${formatPrice(order.total || order.totalAmount || 0)}</strong></td>
        <td><span class="badge-status ${status.class}">${status.label}</span></td>
        <td><a href="don-hang.html" class="btn-outline-admin btn-sm">Chi tiết</a></td>
      </tr>
    `;
  }).join('');
}

function renderBestSelling(books) {
  const container = document.getElementById('lowStockList');
  if (!container) return;
  if (!books.length) {
    container.innerHTML = '<div class="text-center py-4 text-muted"><i class="bi bi-check-circle" style="font-size:32px;color:var(--success);"></i><p class="mt-2">Chưa có dữ liệu!</p></div>';
    return;
  }

  container.innerHTML = books.slice(0, 6).map(book => `
    <div class="warning-item">
      <div class="item-info">
        <img src="${book.images?.[0] || book.image || '/images/placeholder.png'}" alt="" style="width:40px;height:52px;object-fit:cover;border-radius:4px;border:1px solid var(--border);">
        <div>
          <div style="font-weight:600;font-size:14px;">${book.title || ''}</div>
          <div style="font-size:12px;color:var(--text-gray);">${formatPrice(book.price || 0)}</div>
        </div>
      </div>
      <span class="item-stock">Đã bán ${book.sold || 0}</span>
    </div>
  `).join('');
}

// ====== CHARTS ======
function initCharts(data) {
  // Revenue Chart - parse weeklyRevenue from API
  const revenueCtx = document.getElementById('revenueChart').getContext('2d');
  const weeklyRevenue = data.weeklyRevenue || [];
  const revenueData = weeklyRevenue.length > 0
    ? {
        labels: weeklyRevenue.map(item => {
          const d = new Date(item.date);
          return d.toLocaleDateString('vi-VN', { weekday: 'short' });
        }),
        data: weeklyRevenue.map(item => item.revenue || 0)
      }
    : (data.revenueChart || {
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        data: [1200000, 1900000, 1500000, 2200000, 1800000, 2500000, 2100000]
      });

  if (revenueChart) revenueChart.destroy();
  revenueChart = new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: revenueData.labels,
      datasets: [{
        label: 'Doanh thu',
        data: revenueData.data,
        borderColor: '#E8491D',
        backgroundColor: 'rgba(232, 73, 29, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointBackgroundColor: '#E8491D',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => formatPrice(ctx.raw)
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: val => (val / 1000000).toFixed(1) + 'M',
            font: { size: 12 }
          },
          grid: { color: 'rgba(0,0,0,0.04)' }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } }
        }
      }
    }
  });

  // Category Chart
  const catCtx = document.getElementById('categoryChart').getContext('2d');
  const catData = data.categoryChart || {
    labels: ['Văn học', 'Kinh tế', 'Kỹ năng sống', 'Khoa học', 'Thiếu nhi'],
    data: [35, 25, 20, 12, 8],
    colors: ['#E8491D', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B']
  };

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(catCtx, {
    type: 'doughnut',
    data: {
      labels: catData.labels,
      datasets: [{
        data: catData.data,
        backgroundColor: catData.colors || ['#E8491D', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
        borderWidth: 0,
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { size: 12 }
          }
        }
      }
    }
  });
}

// ====== NOTES ======
function saveNotes() {
  const notes = document.getElementById('adminNotes').value;
  localStorage.setItem('admin_notes', notes);
  showToast('Đã lưu ghi chú!');
}

// Load saved notes
document.getElementById('adminNotes').value = localStorage.getItem('admin_notes') || '';

// ====== DEMO DATA ======
function loadDemoData() {
  renderStats({
    totalRevenue: 45680000,
    totalOrders: 156,
    totalUsers: 1243,
    totalBooks: 892,
    revenueChange: 12.5,
    ordersChange: 8.2,
    customersChange: 5.1,
    booksChange: -2.4
  });

  renderRecentOrders([
    { orderCode: 'DH001', customerName: 'Nguyen Van A', createdAt: new Date(), totalAmount: 285000, status: 'pending' },
    { orderCode: 'DH002', customerName: 'Tran Thi B', createdAt: new Date(), totalAmount: 520000, status: 'confirmed' },
    { orderCode: 'DH003', customerName: 'Le Van C', createdAt: new Date(), totalAmount: 175000, status: 'shipping' },
    { orderCode: 'DH004', customerName: 'Pham Thi D', createdAt: new Date(), totalAmount: 890000, status: 'delivered' },
    { orderCode: 'DH005', customerName: 'Hoang Van E', createdAt: new Date(), totalAmount: 340000, status: 'cancelled' }
  ]);

  renderBestSelling([
    { title: 'Dat rung phuong Nam', price: 85000, sold: 120, images: [] },
    { title: 'Nha gia kim', price: 95000, sold: 98, images: [] },
    { title: 'Tuoi tre dang gia bao nhieu', price: 79000, sold: 75, images: [] }
  ]);

  initCharts({});
}

// Chart period change
document.getElementById('chartPeriod').addEventListener('change', function () {
  // Re-fetch with new period
  loadDashboard();
});

// Report button
document.getElementById('btnReport').addEventListener('click', function () {
  showToast('Tính năng xuất báo cáo đang phát triển!', 'error');
});

// Init
loadDashboard();

// ====== VOUCHER PAGE ======

let allCoupons = [];
let currentTab = 'available';

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }
  updateHeaderAuth();
  loadSidebar();
  loadVouchers();
});

// ====== LOAD SIDEBAR ======
async function loadSidebar() {
  try {
    const res = await apiCall('/auth/profile');
    const user = res.user || res;
    document.getElementById('sidebarName').textContent = user.fullName || '---';
    if (user.points !== undefined) {
      document.getElementById('sidebarPoints').textContent = user.points + ' Pts';
    }
  } catch (e) { /* ignore */ }
}

// ====== LOAD VOUCHERS ======
async function loadVouchers() {
  try {
    const res = await fetch(`${API_URL}/coupons/available`);
    const data = await res.json();
    allCoupons = data.data || [];
    renderVouchers();
  } catch (error) {
    document.getElementById('voucherList').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-exclamation-circle"></i>
        <h5>Không thể tải danh sách voucher</h5>
      </div>`;
  }
}

// ====== CATEGORIZE VOUCHERS ======
function categorizeVouchers() {
  const now = new Date();
  const available = [];
  const used = [];
  const expired = [];

  allCoupons.forEach(c => {
    const endDate = new Date(c.endDate);
    const isExpired = endDate < now;
    const isUsedUp = c.usageLimit > 0 && c.usedCount >= c.usageLimit;

    if (isExpired) {
      expired.push(c);
    } else if (isUsedUp) {
      used.push(c);
    } else {
      available.push(c);
    }
  });

  return { available, used, expired };
}

// ====== SWITCH TAB ======
function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.order-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
  renderVouchers();
}

// ====== RENDER VOUCHERS ======
function renderVouchers() {
  const container = document.getElementById('voucherList');
  const { available, used, expired } = categorizeVouchers();

  // Update count badge
  const countEl = document.getElementById('countAvailable');
  if (countEl) {
    countEl.textContent = available.length > 0 ? `(${available.length})` : '';
  }

  // Update sidebar voucher count
  const sidebarVouchers = document.getElementById('sidebarVouchers');
  if (sidebarVouchers) {
    sidebarVouchers.textContent = available.length + ' mã giảm giá';
  }

  let list = [];
  if (currentTab === 'available') list = available;
  else if (currentTab === 'used') list = used;
  else list = expired;

  if (!list.length) {
    const messages = {
      available: { icon: 'bi-ticket-perforated', title: 'Chưa có voucher khả dụng', desc: 'Hãy theo dõi các chương trình khuyến mãi nhé!' },
      used: { icon: 'bi-check-circle', title: 'Chưa sử dụng voucher nào', desc: 'Voucher đã sử dụng sẽ hiển thị ở đây' },
      expired: { icon: 'bi-clock-history', title: 'Không có voucher hết hạn', desc: 'Voucher hết hạn sẽ hiển thị ở đây' }
    };
    const msg = messages[currentTab];
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi ${msg.icon}"></i>
        <h5>${msg.title}</h5>
        <p>${msg.desc}</p>
      </div>`;
    return;
  }

  container.innerHTML = list.map(c => {
    const isPercent = c.discountType === 'percent';
    const valueDisplay = isPercent ? `${c.discountValue}%` : formatPrice(c.discountValue);
    const typeLabel = isPercent ? 'Giảm %' : 'Giảm giá';
    const endDate = new Date(c.endDate);
    const formattedDate = endDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let cardClass = 'voucher-card';
    let statusBadge = '';
    if (currentTab === 'used') {
      cardClass += ' used';
      statusBadge = '<span class="voucher-status-badge used">Da dung</span>';
    } else if (currentTab === 'expired') {
      cardClass += ' expired';
      statusBadge = '<span class="voucher-status-badge expired">Het han</span>';
    }

    const minOrder = c.minOrderAmount > 0
      ? `<div class="voucher-condition"><i class="bi bi-info-circle me-1"></i>Don hang tu ${formatPrice(c.minOrderAmount)}</div>`
      : '';

    const maxDiscount = c.maxDiscount && isPercent
      ? `<div class="voucher-condition"><i class="bi bi-arrow-down-circle me-1"></i>Giam toi da ${formatPrice(c.maxDiscount)}</div>`
      : '';

    const copyBtn = currentTab === 'available'
      ? `<button class="btn-copy" onclick="copyCode('${c.code}', this)"><i class="bi bi-clipboard me-1"></i>Sao chep ma</button>`
      : '';

    return `
      <div class="${cardClass}">
        <div class="voucher-left">
          <span class="voucher-type-badge">${typeLabel}</span>
          <span class="voucher-value">${isPercent ? c.discountValue + '%' : formatPrice(c.discountValue)}</span>
        </div>
        <div class="voucher-right">
          <div class="voucher-desc">${c.description || ('Giam ' + valueDisplay + ' cho don hang')}</div>
          ${minOrder}
          ${maxDiscount}
          <div class="voucher-expiry"><i class="bi bi-clock me-1"></i>Han su dung: ${formattedDate}</div>
          <div class="voucher-code-area">
            <span class="voucher-code">${c.code}</span>
            ${copyBtn}
          </div>
        </div>
      </div>`;
  }).join('');

  // Fix Vietnamese text (the template literals above use ASCII to avoid encoding issues)
  container.innerHTML = container.innerHTML
    .replace(/Da dung/g, '\u0110\u00e3 d\u00f9ng')
    .replace(/Het han/g, 'H\u1ebft h\u1ea1n')
    .replace(/Don hang tu/g, '\u0110\u01a1n h\u00e0ng t\u1eeb')
    .replace(/Giam toi da/g, 'Gi\u1ea3m t\u1ed1i \u0111a')
    .replace(/Sao chep ma/g, 'Sao ch\u00e9p m\u00e3')
    .replace(/Han su dung:/g, 'H\u1ea1n s\u1eed d\u1ee5ng:')
    .replace(/Giam ([\d%đ.,]+) cho don hang/g, 'Gi\u1ea3m $1 cho \u0111\u01a1n h\u00e0ng');
}

// ====== COPY CODE ======
function copyCode(code, btn) {
  navigator.clipboard.writeText(code).then(() => {
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check me-1"></i>\u0110\u00e3 sao ch\u00e9p';
    btn.style.background = 'var(--primary)';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = 'transparent';
      btn.style.color = 'var(--primary)';
    }, 2000);
  }).catch(() => {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = code;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('\u0110\u00e3 sao ch\u00e9p m\u00e3: ' + code);
  });
}

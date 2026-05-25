// ====== CHECKOUT PAGE ======
let checkoutItems = [];
let summaryData = null;
const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 300000;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAuth();

  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }

  loadCheckoutData();
  loadSavedAddresses();
  loadProvinces();
  initAddressEvents();
});

// ====== LOAD CHECKOUT DATA ======
async function loadCheckoutData() {
  // Try localStorage first (from cart page)
  const stored = localStorage.getItem('checkoutItems');
  if (stored) {
    try {
      checkoutItems = JSON.parse(stored);
    } catch (e) {
      checkoutItems = [];
    }
  }

  // If no items from localStorage, load from cart API
  if (!checkoutItems.length) {
    try {
      const data = await apiCall('/cart');
      checkoutItems = data.data ? data.data.items : [];
    } catch (err) {
      showToast('Không thể tải dữ liệu giỏ hàng', 'error');
    }
  }

  // If still empty, redirect back
  if (!checkoutItems.length) {
    showToast('Giỏ hàng trống, vui lòng thêm sản phẩm', 'error');
    setTimeout(() => window.location.href = '/pages/gio-hang.html', 1500);
    return;
  }

  // Load summary data from cart page
  const storedSummary = localStorage.getItem('cartSummary');
  if (storedSummary) {
    try {
      summaryData = JSON.parse(storedSummary);
    } catch (e) {
      summaryData = null;
    }
  }

  renderOrderItems();
  calculateCheckoutTotals();
  updateCartBadge();
}

// ====== LOAD SAVED ADDRESSES ======
async function loadSavedAddresses() {
  try {
    const data = await apiCall('/auth/addresses');
    const addresses = data.addresses || data.data || [];

    if (addresses.length === 0) {
      // Không có địa chỉ lưu → prefill từ user info
      const user = getUser();
      if (user) {
        if (user.fullName) document.getElementById('fullName').value = user.fullName;
        if (user.phone) document.getElementById('phone').value = user.phone;
      }
      return;
    }

    // Hiện section chọn địa chỉ
    const section = document.getElementById('savedAddressSection');
    section.style.display = 'block';

    const list = document.getElementById('savedAddressList');
    list.innerHTML = addresses.map((addr, i) => `
      <label class="saved-address-card ${addr.isDefault ? 'selected' : ''}" data-index="${i}">
        <input type="radio" name="savedAddress" value="${i}" ${addr.isDefault ? 'checked' : ''} onchange="selectSavedAddress(${i})" hidden>
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <strong>${addr.fullName}</strong> <span style="color:var(--text-gray); margin-left:8px;">${addr.phone}</span>
            ${addr.isDefault ? '<span style="background:var(--primary-light); color:var(--primary); font-size:11px; padding:2px 8px; border-radius:10px; margin-left:8px;">Mặc định</span>' : ''}
          </div>
          <i class="bi bi-check-circle-fill" style="color:var(--primary); font-size:18px; display:${addr.isDefault ? 'block' : 'none'};"></i>
        </div>
        <div style="color:var(--text-gray); font-size:13px; margin-top:4px;">
          ${addr.detail ? addr.detail + ', ' : ''}${addr.ward}, ${addr.district}, ${addr.province}
        </div>
      </label>
    `).join('');

    // Thêm style cho saved address cards
    if (!document.getElementById('savedAddrStyle')) {
      const style = document.createElement('style');
      style.id = 'savedAddrStyle';
      style.textContent = `
        .saved-address-card { display:block; padding:14px 16px; border:1.5px solid var(--border); border-radius:var(--radius-md); cursor:pointer; transition:all .2s; margin-bottom:8px; }
        .saved-address-card:hover { border-color:var(--primary); }
        .saved-address-card.selected { border-color:var(--primary); background:var(--primary-light); }
      `;
      document.head.appendChild(style);
    }

    // Lưu addresses để dùng khi chọn (PHẢI set TRƯỚC khi gọi selectSavedAddress)
    window._savedAddresses = addresses;

    // Tự động chọn địa chỉ mặc định
    const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
    const defaultIndex = addresses.indexOf(defaultAddr);
    selectSavedAddress(defaultIndex);

    // Ẩn form nhập tay (đã có địa chỉ lưu)
    document.getElementById('checkoutForm').querySelectorAll('.form-group, .row').forEach(el => {
      if (!el.querySelector('#note')) el.style.display = 'none';
    });
  } catch (err) {
    // Không có địa chỉ lưu → prefill bình thường
    const user = getUser();
    if (user) {
      if (user.fullName) document.getElementById('fullName').value = user.fullName;
      if (user.phone) document.getElementById('phone').value = user.phone;
    }
  }
}

// ====== SELECT SAVED ADDRESS ======
function selectSavedAddress(index) {
  const addresses = window._savedAddresses;
  if (!addresses || !addresses[index]) return;
  const addr = addresses[index];

  // Highlight card
  document.querySelectorAll('.saved-address-card').forEach(c => {
    c.classList.remove('selected');
    c.querySelector('.bi-check-circle-fill').style.display = 'none';
  });
  const card = document.querySelector(`.saved-address-card[data-index="${index}"]`);
  if (card) {
    card.classList.add('selected');
    card.querySelector('.bi-check-circle-fill').style.display = 'block';
  }

  // Fill form fields ẩn
  document.getElementById('fullName').value = addr.fullName;
  document.getElementById('phone').value = addr.phone;

  // Lưu địa chỉ đã chọn để dùng khi submit
  window._selectedAddress = `${addr.detail ? addr.detail + ', ' : ''}${addr.ward}, ${addr.district}, ${addr.province}`;
}

// ====== USE NEW ADDRESS (nhập tay) ======
function useNewAddress() {
  window._selectedAddress = null;
  window._savedAddresses = null;

  // Hiện lại form nhập
  document.getElementById('checkoutForm').querySelectorAll('.form-group, .row').forEach(el => {
    el.style.display = '';
  });

  // Ẩn section saved addresses
  document.getElementById('savedAddressSection').style.display = 'none';

  // Reset form
  document.getElementById('fullName').value = '';
  document.getElementById('phone').value = '';
  document.getElementById('province').value = '';
  document.getElementById('district').innerHTML = '<option value="">Chọn quận/huyện</option>';
  document.getElementById('district').disabled = true;
  document.getElementById('ward').innerHTML = '<option value="">Chọn phường/xã</option>';
  document.getElementById('ward').disabled = true;
  document.getElementById('addressDetail').value = '';

  // Prefill user info
  const user = getUser();
  if (user) {
    if (user.fullName) document.getElementById('fullName').value = user.fullName;
    if (user.phone) document.getElementById('phone').value = user.phone;
  }
}

// ====== LOAD PROVINCES (Open API) ======
async function loadProvinces() {
  try {
    const res = await fetch('https://provinces.open-api.vn/api/p/');
    const data = await res.json();
    const select = document.getElementById('province');
    data.forEach(p => {
      select.innerHTML += `<option value="${p.code}" data-name="${p.name}">${p.name}</option>`;
    });
  } catch (err) {
    console.error('Lỗi tải danh sách tỉnh/thành:', err);
  }
}

// ====== ADDRESS CASCADING EVENTS ======
function initAddressEvents() {
  // Province change -> load districts
  document.getElementById('province').addEventListener('change', async function() {
    const code = this.value;
    const districtSelect = document.getElementById('district');
    const wardSelect = document.getElementById('ward');
    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
    wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
    districtSelect.disabled = true;
    wardSelect.disabled = true;

    if (!code) return;
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
      const data = await res.json();
      districtSelect.disabled = false;
      data.districts.forEach(d => {
        districtSelect.innerHTML += `<option value="${d.code}" data-name="${d.name}">${d.name}</option>`;
      });
    } catch (err) {
      console.error('Lỗi tải danh sách quận/huyện:', err);
    }
  });

  // District change -> load wards
  document.getElementById('district').addEventListener('change', async function() {
    const code = this.value;
    const wardSelect = document.getElementById('ward');
    wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
    wardSelect.disabled = true;

    if (!code) return;
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
      const data = await res.json();
      wardSelect.disabled = false;
      data.wards.forEach(w => {
        wardSelect.innerHTML += `<option value="${w.code}" data-name="${w.name}">${w.name}</option>`;
      });
    } catch (err) {
      console.error('Lỗi tải danh sách phường/xã:', err);
    }
  });
}

// ====== BUILD FULL ADDRESS ======
function getFullAddress() {
  // Nếu đã chọn địa chỉ lưu sẵn
  if (window._selectedAddress) {
    return window._selectedAddress;
  }

  // Nhập tay
  const province = document.getElementById('province');
  const district = document.getElementById('district');
  const ward = document.getElementById('ward');
  const detail = document.getElementById('addressDetail').value.trim();

  const provinceName = province.options[province.selectedIndex]?.dataset?.name || '';
  const districtName = district.options[district.selectedIndex]?.dataset?.name || '';
  const wardName = ward.options[ward.selectedIndex]?.dataset?.name || '';

  return `${detail}, ${wardName}, ${districtName}, ${provinceName}`;
}

// ====== RENDER ORDER ITEMS ======
function renderOrderItems() {
  const container = document.getElementById('orderItems');

  if (!checkoutItems.length) {
    container.innerHTML = '<p class="text-center" style="color:var(--text-gray);">Không có sản phẩm</p>';
    return;
  }

  container.innerHTML = checkoutItems.map(item => {
    const book = item.book;
    if (!book) return '';
    const img = (book.images && book.images.length) ? book.images[0] : 'https://placehold.co/56x70?text=No+Image';
    const price = book.price || 0;
    const itemTotal = price * item.quantity;

    return `
      <div class="order-item">
        <img src="${img}" alt="${book.title}" class="order-item-img">
        <div class="order-item-info">
          <div class="order-item-name">${book.title}</div>
          <div class="order-item-qty">${item.quantity} x ${formatPrice(price)}</div>
        </div>
        <div class="order-item-price">${formatPrice(itemTotal)}</div>
      </div>
    `;
  }).join('');
}

// ====== CALCULATE TOTALS ======
function calculateCheckoutTotals() {
  let subtotal = 0;
  checkoutItems.forEach(item => {
    if (item.book) {
      subtotal += (item.book.price || 0) * item.quantity;
    }
  });

  const shipping = subtotal > 0 ? (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE) : 0;
  let discount = 0;

  // Use saved summary discount if available
  if (summaryData && summaryData.discount) {
    discount = summaryData.discount;
  }

  const total = Math.max(subtotal + shipping - discount, 0);

  document.getElementById('checkoutSubtotal').textContent = formatPrice(subtotal);
  document.getElementById('checkoutShipping').textContent = subtotal > 0 ? formatPrice(shipping) : '0đ';
  document.getElementById('checkoutTotal').textContent = formatPrice(total);

  const discountRow = document.getElementById('checkoutDiscountRow');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('checkoutDiscount').textContent = '-' + formatPrice(discount);
  } else {
    discountRow.style.display = 'none';
  }
}

// ====== PAYMENT SELECTION ======
function selectPayment(radio) {
  document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
  radio.closest('.payment-option').classList.add('selected');
}

// ====== VALIDATE FORM ======
function validateForm() {
  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!fullName) {
    showToast('Vui lòng nhập họ và tên', 'error');
    document.getElementById('fullName').focus();
    return false;
  }

  if (!phone) {
    showToast('Vui lòng nhập số điện thoại', 'error');
    document.getElementById('phone').focus();
    return false;
  }

  // Vietnamese phone validation
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)\d{8}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    showToast('Số điện thoại không hợp lệ', 'error');
    document.getElementById('phone').focus();
    return false;
  }

  // Skip address validation nếu đã chọn địa chỉ lưu sẵn
  if (!window._selectedAddress) {
    const province = document.getElementById('province').value;
    if (!province) {
      showToast('Vui lòng chọn tỉnh/thành phố', 'error');
      document.getElementById('province').focus();
      return false;
    }

    const district = document.getElementById('district').value;
    if (!district) {
      showToast('Vui lòng chọn quận/huyện', 'error');
      document.getElementById('district').focus();
      return false;
    }

    const ward = document.getElementById('ward').value;
    if (!ward) {
      showToast('Vui lòng chọn phường/xã', 'error');
      document.getElementById('ward').focus();
      return false;
    }

    const addressDetail = document.getElementById('addressDetail').value.trim();
    if (!addressDetail) {
      showToast('Vui lòng nhập địa chỉ cụ thể', 'error');
      document.getElementById('addressDetail').focus();
      return false;
    }
  }

  return true;
}

// ====== PLACE ORDER ======
async function placeOrder() {
  if (!validateForm()) return;

  const btn = document.getElementById('btnPlaceOrder');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang xử lý...';

  try {
    const fullName = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = getFullAddress();
    const note = document.getElementById('note').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

    // Build items array
    const items = checkoutItems.map(item => ({
      book: item.book._id,
      quantity: item.quantity
    }));

    const orderBody = {
      items,
      shippingAddress: {
        fullName,
        phone,
        address
      },
      paymentMethod,
      note: note || undefined,
      coupon: summaryData ? summaryData.coupon : undefined
    };

    const data = await apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderBody)
    });

    const orderId = data.data ? data.data._id : (data.order ? data.order._id : data._id);

    // Handle VNPAY redirect
    if (paymentMethod === 'VNPAY' && orderId) {
      try {
        const vnpayData = await apiCall('/orders/vnpay-create', {
          method: 'POST',
          body: JSON.stringify({ orderId })
        });

        const paymentUrl = vnpayData.data?.paymentUrl || vnpayData.paymentUrl || vnpayData.url;
        if (paymentUrl) {
          // Clean up localStorage
          localStorage.removeItem('checkoutItems');
          localStorage.removeItem('cartSummary');
          window.location.href = paymentUrl;
          return;
        }
      } catch (vnpayErr) {
        showToast('Lỗi tạo thanh toán VNPay: ' + vnpayErr.message, 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        return;
      }
    }

    // COD or VNPay fallback - success
    localStorage.removeItem('checkoutItems');
    localStorage.removeItem('cartSummary');

    showToast('Đặt hàng thành công!');
    setTimeout(() => {
      window.location.href = '/pages/don-hang.html' + (orderId ? '?id=' + orderId : '');
    }, 1500);

  } catch (err) {
    showToast('Đặt hàng thất bại: ' + err.message, 'error');
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

// ====== UPDATE CART BADGE ======
function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (badge) badge.textContent = checkoutItems.length;
}

// ====== SEARCH ======
function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    window.location.href = '/pages/tim-kiem.html?q=' + encodeURIComponent(query);
  }
}

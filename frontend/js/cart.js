// ====== CART PAGE ======
let cartItems = [];
let couponData = null;
const SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 300000;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAuth();

  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }

  loadCart();
  loadSuggestedBooks();
});

// ====== LOAD CART ======
async function loadCart() {
  try {
    const data = await apiCall('/cart');
    cartItems = data.data ? data.data.items : [];
    renderCart();
  } catch (err) {
    showToast('Không thể tải giỏ hàng: ' + err.message, 'error');
    renderEmptyCart();
  }
}

// ====== RENDER CART ======
function renderCart() {
  const area = document.getElementById('cartTableArea');
  const actions = document.getElementById('cartActions');
  const summary = document.getElementById('cartSummary');

  // Update counts
  document.getElementById('cartItemCount').textContent = `(${cartItems.length} sản phẩm)`;
  document.getElementById('tabAllCount').textContent = cartItems.length;
  updateCartBadge();

  if (!cartItems.length) {
    renderEmptyCart();
    actions.style.display = 'none';
    summary.style.display = 'none';
    return;
  }

  actions.style.display = 'flex';
  summary.style.display = 'block';

  let html = `
    <div class="cart-table-wrapper">
      <table class="cart-table">
        <thead>
          <tr>
            <th><input type="checkbox" class="cart-checkbox" id="selectAll" onchange="toggleSelectAll(this)"></th>
            <th>Sản phẩm</th>
            <th>Đơn giá</th>
            <th>Số lượng</th>
            <th>Thành tiền</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
  `;

  cartItems.forEach((item, idx) => {
    const book = item.book;
    if (!book) return;
    const price = book.price || 0;
    const originalPrice = book.originalPrice || price;
    const img = (book.images && book.images.length) ? book.images[0] : 'https://placehold.co/80x100?text=No+Image';
    const itemTotal = price * item.quantity;

    html += `
      <tr data-id="${book._id}">
        <td data-label="">
          <input type="checkbox" class="cart-checkbox item-checkbox" data-id="${book._id}" checked>
        </td>
        <td data-label="Sản phẩm">
          <div class="cart-item-info">
            <img src="${img}" alt="${book.title}" class="cart-item-img">
            <div class="cart-item-details">
              <div class="cart-item-title"><a href="/pages/chi-tiet-sach.html?slug=${book.slug || book._id}">${book.title}</a></div>
            </div>
          </div>
        </td>
        <td data-label="Đơn giá">
          <div class="cart-item-price">
            <span class="sale-price">${formatPrice(price)}</span>
            ${originalPrice > price ? `<span class="original-price">${formatPrice(originalPrice)}</span>` : ''}
          </div>
        </td>
        <td data-label="Số lượng">
          <div class="qty-control">
            <button class="qty-btn" onclick="changeQty('${book._id}', ${item.quantity - 1})" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
            <input type="text" class="qty-input" value="${item.quantity}" readonly>
            <button class="qty-btn" onclick="changeQty('${book._id}', ${item.quantity + 1})" ${item.quantity >= (book.stock || 99) ? 'disabled' : ''}>+</button>
          </div>
        </td>
        <td data-label="Thành tiền">
          <span class="cart-item-total">${formatPrice(itemTotal)}</span>
        </td>
        <td data-label="">
          <button class="cart-remove-btn" onclick="removeItem('${book._id}')" title="Xóa">
            <i class="bi bi-trash3"></i>
          </button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table></div>';
  area.innerHTML = html;

  calculateTotals();
}

// ====== RENDER EMPTY CART ======
function renderEmptyCart() {
  const area = document.getElementById('cartTableArea');
  area.innerHTML = `
    <div class="cart-empty">
      <i class="bi bi-cart-x"></i>
      <h3>Giỏ hàng trống</h3>
      <p>Bạn chưa có sản phẩm nào trong giỏ hàng.</p>
      <a href="/" class="btn-primary-custom">
        <i class="bi bi-arrow-left"></i> Tiếp tục mua sắm
      </a>
    </div>
  `;
}

// ====== CALCULATE TOTALS ======
function calculateTotals() {
  const checkedIds = getCheckedIds();
  let subtotal = 0;

  cartItems.forEach(item => {
    if (checkedIds.includes(item.book._id)) {
      subtotal += (item.book.price || 0) * item.quantity;
    }
  });

  const shipping = subtotal > 0 ? (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE) : 0;
  let discount = 0;

  if (couponData && subtotal > 0) {
    if (couponData.discountType === 'percent') {
      discount = Math.round(subtotal * couponData.discountValue / 100);
      if (couponData.maxDiscount) {
        discount = Math.min(discount, couponData.maxDiscount);
      }
    } else {
      discount = couponData.discountValue || 0;
    }
  }

  const total = Math.max(subtotal + shipping - discount, 0);

  document.getElementById('subtotalValue').textContent = formatPrice(subtotal);
  document.getElementById('shippingValue').textContent = subtotal > 0 ? formatPrice(shipping) : '0đ';
  document.getElementById('totalValue').textContent = formatPrice(total);

  // Discount row
  const discountRow = document.getElementById('discountRow');
  if (discount > 0) {
    discountRow.style.display = 'flex';
    document.getElementById('discountValue').textContent = '-' + formatPrice(discount);
  } else {
    discountRow.style.display = 'none';
  }

  // Disable checkout if nothing selected
  document.getElementById('btnCheckout').disabled = subtotal === 0;

  // Store for checkout page
  localStorage.setItem('cartSummary', JSON.stringify({
    subtotal,
    shipping,
    discount,
    total,
    coupon: couponData ? couponData.code : null
  }));
}

// ====== GET CHECKED IDS ======
function getCheckedIds() {
  const checkboxes = document.querySelectorAll('.item-checkbox');
  const ids = [];
  checkboxes.forEach(cb => {
    if (cb.checked) ids.push(cb.dataset.id);
  });
  return ids;
}

// ====== SELECT ALL ======
function toggleSelectAll(el) {
  const checkboxes = document.querySelectorAll('.item-checkbox');
  checkboxes.forEach(cb => cb.checked = el.checked);
  calculateTotals();
}

// ====== CHANGE QUANTITY (debounced) ======
let qtyTimers = {};
function changeQty(bookId, newQty) {
  if (newQty < 1) return;

  // Update UI immediately
  const item = cartItems.find(i => i.book._id === bookId);
  if (item) item.quantity = newQty;
  renderCart();

  // Debounce API call
  if (qtyTimers[bookId]) clearTimeout(qtyTimers[bookId]);
  qtyTimers[bookId] = setTimeout(async () => {
    try {
      await apiCall('/cart/update', {
        method: 'PUT',
        body: JSON.stringify({ bookId, quantity: newQty })
      });
    } catch (err) {
      showToast('Không thể cập nhật số lượng: ' + err.message, 'error');
      loadCart(); // Reload to sync
    }
  }, 500);
}

// ====== REMOVE ITEM ======
async function removeItem(bookId) {
  if (!confirm('Bạn có chắc muốn xóa sản phẩm này?')) return;

  try {
    await apiCall('/cart/' + bookId, { method: 'DELETE' });
    cartItems = cartItems.filter(i => i.book._id !== bookId);
    renderCart();
    showToast('Đã xóa sản phẩm khỏi giỏ hàng');
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// ====== CLEAR CART ======
async function clearCart() {
  if (!confirm('Xóa tất cả sản phẩm trong giỏ hàng?')) return;

  try {
    await apiCall('/cart', { method: 'DELETE' });
    cartItems = [];
    renderCart();
    showToast('Đã xóa toàn bộ giỏ hàng');
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

// ====== APPLY COUPON ======
async function applyCoupon() {
  const code = document.getElementById('couponInput').value.trim();
  if (!code) {
    showToast('Vui lòng nhập mã giảm giá', 'error');
    return;
  }

  // Calculate current subtotal for validation
  const checkedIds = getCheckedIds();
  let orderAmount = 0;
  cartItems.forEach(item => {
    if (checkedIds.includes(item.book._id)) {
      orderAmount += (item.book.price || 0) * item.quantity;
    }
  });

  try {
    const data = await apiCall('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount })
    });

    couponData = data.data || data.coupon || data;
    couponData.code = code;

    document.getElementById('couponArea').style.display = 'none';
    document.getElementById('couponApplied').style.display = 'flex';
    document.getElementById('couponLabel').textContent = `Mã: ${code.toUpperCase()}`;

    calculateTotals();
    showToast('Áp dụng mã giảm giá thành công!');
  } catch (err) {
    showToast(err.message || 'Mã giảm giá không hợp lệ', 'error');
  }
}

// ====== REMOVE COUPON ======
function removeCoupon() {
  couponData = null;
  document.getElementById('couponArea').style.display = 'flex';
  document.getElementById('couponApplied').style.display = 'none';
  document.getElementById('couponInput').value = '';
  calculateTotals();
  showToast('Đã hủy mã giảm giá');
}

// ====== GO TO CHECKOUT ======
function goToCheckout() {
  const checkedIds = getCheckedIds();
  if (!checkedIds.length) {
    showToast('Vui lòng chọn ít nhất một sản phẩm', 'error');
    return;
  }

  // Save selected items to localStorage for checkout
  const selectedItems = cartItems.filter(i => checkedIds.includes(i.book._id));
  localStorage.setItem('checkoutItems', JSON.stringify(selectedItems));

  window.location.href = '/pages/thanh-toan.html';
}

// ====== UPDATE CART BADGE ======
function updateCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  const total = cartItems.reduce((s, i) => s + (i.quantity || 1), 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}

// ====== LOAD SUGGESTED BOOKS ======
async function loadSuggestedBooks() {
  try {
    const data = await apiCall('/books/featured?limit=6');
    const books = data.books || data || [];
    const container = document.getElementById('suggestedBooks');

    if (!books.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = books.map(book => {
      const img = (book.images && book.images.length) ? book.images[0] : 'https://placehold.co/200x260?text=No+Image';
      const discount = book.originalPrice > book.price
        ? Math.round((1 - book.price / book.originalPrice) * 100)
        : 0;

      return `
        <div class="col-6 col-md-4 col-lg-2">
          <div class="book-card">
            <a href="/pages/chi-tiet-sach.html?slug=${book.slug || book._id}">
              <div class="card-img-wrapper">
                <img src="${img}" alt="${book.title}">
                ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
              </div>
            </a>
            <div class="card-body">
              <a href="/pages/chi-tiet-sach.html?slug=${book.slug || book._id}" class="book-title">${book.title}</a>
              <div class="book-price">
                <span class="current-price">${formatPrice(book.price)}</span>
                ${book.originalPrice > book.price ? `<span class="original-price">${formatPrice(book.originalPrice)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    // Silent fail for suggestions
  }
}

// ====== SEARCH ======
function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    window.location.href = '/pages/tim-kiem.html?q=' + encodeURIComponent(query);
  }
}

// Listen to checkbox changes for recalculation
document.addEventListener('change', (e) => {
  if (e.target.classList.contains('item-checkbox')) {
    // Update "select all" state
    const all = document.querySelectorAll('.item-checkbox');
    const checked = document.querySelectorAll('.item-checkbox:checked');
    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = all.length === checked.length;
    calculateTotals();
  }
});

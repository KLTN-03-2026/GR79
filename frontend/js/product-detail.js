// ====== PRODUCT DETAIL PAGE ======

let currentBook = null;
let currentQuantity = 1;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAuth();
  loadCategoryNav();
  loadProductDetail();
});

// ====== SEARCH ======
function handleSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (query) {
    window.location.href = `/pages/tim-kiem.html?q=${encodeURIComponent(query)}`;
  }
}

document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// ====== LOAD CATEGORY NAV ======
async function loadCategoryNav() {
  try {
    const data = await apiCall('/categories');
    const categories = data.data || data.categories || data || [];
    const nav = document.getElementById('categoryNav');
    if (!nav || !Array.isArray(categories)) return;

    nav.innerHTML = categories.slice(0, 6).map(cat =>
      `<a href="/pages/danh-sach-sach.html?category=${cat.slug || cat._id}" class="nav-link">${cat.name}</a>`
    ).join('');
  } catch (error) {
    // Silent fail
  }
}

// ====== LOAD PRODUCT DETAIL ======
async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    document.getElementById('productDetail').innerHTML = `
      <div class="col-12">
        <div class="text-center py-5">
          <i class="bi bi-exclamation-circle" style="font-size: 64px; color: var(--border);"></i>
          <h3 class="mt-3">Không tìm thấy sản phẩm</h3>
          <p class="text-muted">Sản phẩm bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <a href="/" class="btn-primary-custom mt-3">Về trang chủ</a>
        </div>
      </div>
    `;
    return;
  }

  try {
    const data = await apiCall(`/books/${slug}`);
    currentBook = data.data || data.book || data;
    renderProductDetail(currentBook);
    loadRelatedBooks(currentBook.category);
    document.title = `${currentBook.title} - Sách Hub`;
  } catch (error) {
    document.getElementById('productDetail').innerHTML = `
      <div class="col-12">
        <div class="text-center py-5">
          <i class="bi bi-exclamation-circle" style="font-size: 64px; color: var(--border);"></i>
          <h3 class="mt-3">Không thể tải sản phẩm</h3>
          <p class="text-muted">${error.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'}</p>
          <a href="/" class="btn-primary-custom mt-3">Về trang chủ</a>
        </div>
      </div>
    `;
  }
}

// ====== RENDER PRODUCT DETAIL ======
function renderProductDetail(book) {
  const categoryName = (typeof book.category === 'object' ? book.category?.name : book.category) || 'Danh mục';
  const categorySlug = book.category?.slug || book.category?._id || '';

  // Update breadcrumb
  document.getElementById('breadcrumb').innerHTML = `
    <a href="/">Trang chủ</a>
    <span class="separator"><i class="bi bi-chevron-right"></i></span>
    <a href="/pages/danh-sach-sach.html?category=${categorySlug}">${categoryName}</a>
    <span class="separator"><i class="bi bi-chevron-right"></i></span>
    <span class="current">${book.title}</span>
  `;

  // Images
  const images = book.images && book.images.length > 0 ? book.images : [book.image || '/images/placeholder.jpg'];
  const mainImage = images[0];

  // Rating
  const rating = book.rating || book.averageRating || 0;
  const ratingCount = book.numReviews || book.reviewCount || 0;
  const soldCount = book.sold || book.soldCount || 0;

  // Price
  const salePrice = book.salePrice || book.price;
  const originalPrice = book.originalPrice || book.price;
  const hasDiscount = originalPrice > salePrice;
  const discountPercent = hasDiscount ? Math.round((1 - salePrice / originalPrice) * 100) : 0;

  // Stock
  const stock = book.stock || book.quantity || 0;
  const inStock = stock > 0;

  // Author
  const author = book.author || 'Đang cập nhật';

  document.getElementById('productDetail').innerHTML = `
    <!-- Image Gallery -->
    <div class="col-lg-5">
      <div class="product-gallery">
        <div class="product-main-image">
          <img src="${mainImage}" alt="${book.title}" id="mainImage">
        </div>
        ${images.length > 1 ? `
          <div class="product-thumbnails">
            ${images.map((img, idx) => `
              <div class="thumb ${idx === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
                <img src="${img}" alt="Ảnh ${idx + 1}">
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Product Info -->
    <div class="col-lg-7">
      <div class="product-info">
        <h1 class="product-title">${book.title}</h1>

        <div class="product-rating">
          <div class="stars">${renderStars(rating)}</div>
          <span class="rating-count">${rating.toFixed(1)} (${ratingCount} đánh giá)</span>
          <div class="divider"></div>
          <span class="sold-count">Đã bán ${soldCount}</span>
        </div>

        <div class="product-author">
          Tác giả: <a href="/pages/danh-sach-sach.html?author=${encodeURIComponent(author)}">${author}</a>
        </div>

        <div class="product-price-box">
          <span class="current-price">${formatPrice(salePrice)}</span>
          ${hasDiscount ? `
            <span class="original-price">${formatPrice(originalPrice)}</span>
            <span class="discount-percent">-${discountPercent}%</span>
          ` : ''}
        </div>

        <div class="stock-badge ${inStock ? 'in-stock' : 'out-of-stock'}">
          <i class="bi ${inStock ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i>
          ${inStock ? `Còn hàng (${stock} sản phẩm)` : 'Hết hàng'}
        </div>

        <div class="quantity-selector">
          <label>Số lượng:</label>
          <div class="quantity-controls">
            <button onclick="changeQuantity(-1)" id="btnDecrease" ${currentQuantity <= 1 ? 'disabled' : ''}>
              <i class="bi bi-dash"></i>
            </button>
            <input type="number" id="quantityInput" value="${currentQuantity}" min="1" max="${stock}" onchange="handleQuantityInput(this)">
            <button onclick="changeQuantity(1)" id="btnIncrease" ${!inStock || currentQuantity >= stock ? 'disabled' : ''}>
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>

        <div class="product-actions">
          <button class="btn-add-cart" onclick="addToCart()" ${!inStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <i class="bi bi-cart-plus"></i>
            Thêm vào giỏ
          </button>
          <button class="btn-buy-now" onclick="buyNow()" ${!inStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}>
            <i class="bi bi-bag-check"></i>
            Mua ngay
          </button>
        </div>

        <div class="product-policies">
          <div class="policy-item">
            <div class="policy-icon"><i class="bi bi-truck"></i></div>
            <div class="policy-text">
              <strong>Miễn phí vận chuyển</strong>
              <span>Cho đơn hàng từ 300.000đ</span>
            </div>
          </div>
          <div class="policy-item">
            <div class="policy-icon"><i class="bi bi-arrow-repeat"></i></div>
            <div class="policy-text">
              <strong>Đổi trả 7 ngày</strong>
              <span>Đổi trả miễn phí trong 7 ngày</span>
            </div>
          </div>
          <div class="policy-item">
            <div class="policy-icon"><i class="bi bi-shield-check"></i></div>
            <div class="policy-text">
              <strong>Hàng chính hãng</strong>
              <span>Cam kết 100% chính hãng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Render tabs
  renderTabs(book);
}

// ====== RENDER STARS ======
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.floor(rating)) {
      html += '<i class="bi bi-star-fill"></i>';
    } else if (i - 0.5 <= rating) {
      html += '<i class="bi bi-star-half"></i>';
    } else {
      html += '<i class="bi bi-star empty"></i>';
    }
  }
  return html;
}

// ====== CHANGE MAIN IMAGE ======
function changeMainImage(src, thumbEl) {
  document.getElementById('mainImage').src = src;
  document.querySelectorAll('.product-thumbnails .thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
}

// ====== QUANTITY ======
function changeQuantity(delta) {
  const stock = currentBook?.stock || currentBook?.quantity || 99;
  currentQuantity = Math.max(1, Math.min(stock, currentQuantity + delta));
  document.getElementById('quantityInput').value = currentQuantity;
  document.getElementById('btnDecrease').disabled = currentQuantity <= 1;
  document.getElementById('btnIncrease').disabled = currentQuantity >= stock;
}

function handleQuantityInput(input) {
  const stock = currentBook?.stock || currentBook?.quantity || 99;
  let val = parseInt(input.value) || 1;
  // Cho phép user nhập vượt tồn kho, sẽ báo lỗi khi bấm thêm vào giỏ / mua ngay
  val = Math.max(1, val);
  currentQuantity = val;
  input.value = val;
  document.getElementById('btnDecrease').disabled = val <= 1;
  document.getElementById('btnIncrease').disabled = val >= stock;
}

// ====== ADD TO CART ======
async function addToCart() {
  if (!isLoggedIn()) {
    showToast('Vui lòng đăng nhập để thêm vào giỏ hàng', 'error');
    setTimeout(() => {
      window.location.href = `/pages/dang-nhap.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 1000);
    return;
  }

  if (!currentBook) return;

  const stock = currentBook?.stock || currentBook?.quantity || 0;
  if (currentQuantity > stock) {
    showToast(`Số lượng vượt quá tồn kho (còn ${stock} sản phẩm)`, 'error');
    return;
  }

  try {
    await apiCall('/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        bookId: currentBook._id,
        quantity: currentQuantity
      })
    });
    showToast('Đã thêm sản phẩm vào giỏ hàng!');
    updateCartCount();
  } catch (error) {
    showToast(error.message || 'Không thể thêm vào giỏ hàng', 'error');
  }
}

// ====== BUY NOW ======
async function buyNow() {
  if (!isLoggedIn()) {
    showToast('Vui lòng đăng nhập để mua hàng', 'error');
    setTimeout(() => {
      window.location.href = `/pages/dang-nhap.html?redirect=${encodeURIComponent(window.location.href)}`;
    }, 1000);
    return;
  }

  if (!currentBook) return;

  const stock = currentBook?.stock || currentBook?.quantity || 0;
  if (currentQuantity > stock) {
    showToast(`Số lượng vượt quá tồn kho (còn ${stock} sản phẩm)`, 'error');
    return;
  }

  try {
    await apiCall('/cart/add', {
      method: 'POST',
      body: JSON.stringify({
        bookId: currentBook._id,
        quantity: currentQuantity
      })
    });
    window.location.href = '/pages/gio-hang.html';
  } catch (error) {
    showToast(error.message || 'Không thể mua hàng', 'error');
  }
}

// updateCartCount() đã được định nghĩa chung trong utils.js để badge giỏ hàng đồng bộ giữa các trang

// ====== RENDER TABS ======
function renderTabs(book) {
  const tabsContainer = document.getElementById('productTabs');
  tabsContainer.style.display = 'block';

  // Description tab
  document.getElementById('bookDescription').innerHTML = book.description
    ? `<div>${book.description}</div>`
    : '<p class="text-muted">Chưa có mô tả cho sản phẩm này.</p>';

  // Details tab
  const publisher = book.publisher || 'Đang cập nhật';
  const publishYear = book.publishYear || book.year || 'Đang cập nhật';
  const pages = book.pages || book.numPages || 'Đang cập nhật';
  const language = book.bookLanguage || book.language || 'Tiếng Việt';
  const isbn = book.isbn || 'Đang cập nhật';
  const weight = book.weight || 'Đang cập nhật';
  const dimensions = book.dimensions || 'Đang cập nhật';

  document.getElementById('bookDetails').innerHTML = `
    <tr><td>Nhà xuất bản</td><td>${publisher}</td></tr>
    <tr><td>Năm xuất bản</td><td>${publishYear}</td></tr>
    <tr><td>Số trang</td><td>${pages}</td></tr>
    <tr><td>Ngôn ngữ</td><td>${language}</td></tr>
    <tr><td>ISBN</td><td>${isbn}</td></tr>
    <tr><td>Trọng lượng</td><td>${weight}</td></tr>
    <tr><td>Kích thước</td><td>${dimensions}</td></tr>
  `;

  // Reviews tab - load từ API
  loadReviews(book._id);
}

// ====== LOAD REVIEWS TỪ API ======
let selectedRating = 0;

async function loadReviews(bookId) {
  try {
    const data = await apiCall(`/reviews/${bookId}`);
    const { reviews, avgRating, totalReviews, starCounts } = data.data;

    document.getElementById('reviewCount').textContent = totalReviews;

    let reviewsHTML = '';

    // Phần tổng hợp rating
    reviewsHTML += `
      <div class="review-summary">
        <div class="avg-score">
          <div class="score">${avgRating.toFixed(1)}</div>
          <div class="out-of">trên 5</div>
          <div class="stars">${renderStars(avgRating)}</div>
          <div style="font-size:13px; color:var(--text-gray); margin-top:4px;">${totalReviews} đánh giá</div>
        </div>
        <div class="review-bars">
          ${[5,4,3,2,1].map(star => {
            const count = starCounts[star] || 0;
            const percent = totalReviews > 0 ? (count / totalReviews * 100) : 0;
            return `
              <div class="review-bar-row">
                <span class="star-label">${star} sao</span>
                <div class="bar-track"><div class="bar-fill" style="width: ${percent}%"></div></div>
                <span class="bar-count">${count}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Form đánh giá
    reviewsHTML += renderReviewForm();

    // Danh sách đánh giá
    if (reviews.length > 0) {
      const currentUser = getUser();
      reviewsHTML += `<div class="review-list">`;
      reviewsHTML += reviews.map(review => {
        const canDelete = currentUser && (currentUser._id === review.user?._id || currentUser.role === 'admin');
        const avatarUrl = review.user?.avatar;
        const avatarHTML = avatarUrl
          ? `<img src="${avatarUrl}" alt="" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">`
          : `<div class="reviewer-avatar">${(review.user?.fullName || 'A').charAt(0).toUpperCase()}</div>`;
        return `
          <div class="review-item">
            <div class="review-header">
              ${avatarHTML}
              <div>
                <div class="reviewer-name">${review.user?.fullName || 'Ẩn danh'}</div>
                <div class="review-date">${formatDate(review.createdAt)}</div>
              </div>
              ${canDelete ? `<button class="btn-delete-review" onclick="deleteReview('${review._id}')" title="Xóa đánh giá"><i class="bi bi-trash"></i></button>` : ''}
            </div>
            <div class="review-stars">${renderStars(review.rating)}</div>
            <div class="review-content">${escapeHTML(review.comment || '')}</div>
          </div>
        `;
      }).join('');
      reviewsHTML += `</div>`;
    } else {
      reviewsHTML += `
        <div class="no-reviews">
          <i class="bi bi-chat-square-text"></i>
          <h4>Chưa có đánh giá nào</h4>
          <p>Hãy là người đầu tiên đánh giá sản phẩm này!</p>
        </div>
      `;
    }

    document.getElementById('reviewsContent').innerHTML = reviewsHTML;

    // Gắn sự kiện cho star selector nếu có
    initStarSelector();
  } catch (error) {
    document.getElementById('reviewsContent').innerHTML = `
      <div class="no-reviews">
        <i class="bi bi-chat-square-text"></i>
        <h4>Chưa có đánh giá nào</h4>
        <p>Hãy là người đầu tiên đánh giá sản phẩm này!</p>
      </div>
    `;
  }
}

// ====== RENDER FORM ĐÁNH GIÁ ======
function renderReviewForm() {
  if (!isLoggedIn()) {
    return `
      <div class="review-form-wrapper">
        <div class="review-login-prompt">
          <i class="bi bi-lock"></i>
          <p>Vui lòng <a href="/pages/dang-nhap.html?redirect=${encodeURIComponent(window.location.href)}">đăng nhập</a> để đánh giá sản phẩm này.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="review-form-wrapper">
      <h4 class="review-form-title">Viết đánh giá của bạn</h4>
      <div class="star-selector" id="starSelector">
        <span class="star-selector-label">Chọn số sao:</span>
        <div class="star-selector-stars">
          ${[1,2,3,4,5].map(i => `
            <i class="bi bi-star star-select" data-star="${i}" title="${i} sao"></i>
          `).join('')}
        </div>
        <span class="star-selector-text" id="starText"></span>
      </div>
      <textarea id="reviewComment" class="review-textarea" placeholder="Chia sẻ nhận xét của bạn về sản phẩm này..." rows="4"></textarea>
      <button class="btn-submit-review" id="btnSubmitReview" onclick="submitReview()">
        <i class="bi bi-send"></i> Gửi đánh giá
      </button>
    </div>
  `;
}

// ====== INIT STAR SELECTOR ======
function initStarSelector() {
  const stars = document.querySelectorAll('#starSelector .star-select');
  if (!stars.length) return;

  const starLabels = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Tuyệt vời'];

  stars.forEach(star => {
    star.addEventListener('mouseenter', function() {
      const val = parseInt(this.dataset.star);
      highlightStars(val);
    });

    star.addEventListener('mouseleave', function() {
      highlightStars(selectedRating);
    });

    star.addEventListener('click', function() {
      selectedRating = parseInt(this.dataset.star);
      highlightStars(selectedRating);
      const starText = document.getElementById('starText');
      if (starText) starText.textContent = starLabels[selectedRating];
    });
  });
}

function highlightStars(count) {
  const stars = document.querySelectorAll('#starSelector .star-select');
  stars.forEach(star => {
    const val = parseInt(star.dataset.star);
    if (val <= count) {
      star.className = 'bi bi-star-fill star-select active';
    } else {
      star.className = 'bi bi-star star-select';
    }
  });
}

// ====== SUBMIT REVIEW ======
async function submitReview() {
  if (!currentBook) return;

  if (selectedRating === 0) {
    showToast('Vui lòng chọn số sao', 'error');
    return;
  }

  const comment = document.getElementById('reviewComment')?.value?.trim() || '';
  const btn = document.getElementById('btnSubmitReview');

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Đang gửi...';

    await apiCall('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        bookId: currentBook._id,
        rating: selectedRating,
        comment
      })
    });

    showToast('Đánh giá thành công!');
    selectedRating = 0;

    // Reload reviews
    await loadReviews(currentBook._id);
  } catch (error) {
    showToast(error.message || 'Không thể gửi đánh giá', 'error');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-send"></i> Gửi đánh giá';
  }
}

// ====== DELETE REVIEW ======
async function deleteReview(reviewId) {
  if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

  try {
    await apiCall(`/reviews/${reviewId}`, { method: 'DELETE' });
    showToast('Đã xóa đánh giá');
    if (currentBook) await loadReviews(currentBook._id);
  } catch (error) {
    showToast(error.message || 'Không thể xóa đánh giá', 'error');
  }
}

// ====== ESCAPE HTML (dùng cho review comment) ======
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ====== FORMAT DATE ======
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ====== LOAD RELATED BOOKS ======
async function loadRelatedBooks(category) {
  if (!category) return;

  const categoryId = category._id || category.slug || category;

  try {
    const data = await apiCall(`/books?category=${categoryId}&limit=6`);
    const books = data.data || data.books || data || [];

    // Filter out current book
    const relatedBooks = books.filter(b => b._id !== currentBook._id).slice(0, 6);

    if (relatedBooks.length === 0) return;

    const section = document.getElementById('relatedSection');
    section.style.display = 'block';

    const viewAllLink = document.getElementById('viewAllRelated');
    viewAllLink.href = `/pages/danh-sach-sach.html?category=${categoryId}`;

    document.getElementById('relatedBooks').innerHTML = relatedBooks.map(book => renderBookCard(book)).join('');
  } catch (error) {
    // Silent fail
  }
}

// ====== RENDER BOOK CARD ======
function renderBookCard(book) {
  const salePrice = book.salePrice || book.price;
  const originalPrice = book.originalPrice || book.price;
  const hasDiscount = originalPrice > salePrice;
  const discountPercent = hasDiscount ? Math.round((1 - salePrice / originalPrice) * 100) : 0;
  const rating = book.rating || book.averageRating || 0;
  const image = (book.images && book.images[0]) || book.image || '/images/placeholder.jpg';
  const slug = book.slug || book._id;

  return `
    <div class="col-lg-2 col-md-3 col-6">
      <a href="/pages/chi-tiet-sach.html?slug=${slug}" class="book-card d-block">
        <div class="card-img-wrapper">
          <img src="${image}" alt="${book.title}">
          ${hasDiscount ? `<span class="discount-badge">-${discountPercent}%</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-author">${book.author || ''}</p>
          <div class="book-rating">
            <span class="star"><i class="bi bi-star-fill"></i></span>
            <span>${rating.toFixed(1)}</span>
          </div>
          <div class="book-price">
            <span class="current-price">${formatPrice(salePrice)}</span>
            ${hasDiscount ? `<span class="original-price">${formatPrice(originalPrice)}</span>` : ''}
          </div>
        </div>
      </a>
    </div>
  `;
}

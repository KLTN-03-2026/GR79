// ====== SHARED HEADER & FOOTER COMPONENT ======

function renderHeader() {
  return `
  <!-- Top Bar -->
  <div class="top-bar">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center">
        <div class="d-flex gap-3">
          <span><i class="bi bi-telephone"></i> 0934747712</span>
          <span><i class="bi bi-envelope"></i> hotro@sachhub.vn</span>
        </div>
        <div class="d-flex gap-3">
          <a href="/pages/tin-tuc.html">Tin tức</a>
          <a href="/pages/tuyen-dung.html">Tuyển dụng</a>
          <a href="/pages/lien-he.html">Liên hệ</a>
        </div>
      </div>
    </div>
  </div>

  <!-- Header -->
  <header class="main-header">
    <div class="container">
      <div class="d-flex align-items-center justify-content-between gap-3">
        <a href="/" class="header-logo">
          <div class="logo-icon"><i class="bi bi-book-half"></i></div>
          <span>Sách Hub</span>
        </a>
        <div class="header-search">
          <input type="text" id="searchInput" placeholder="Tìm kiếm sách, tác giả, thể loại..." autocomplete="off">
          <button class="search-btn" onclick="handleSearch()"><i class="bi bi-search"></i></button>
          <div class="search-suggest" id="searchSuggest"></div>
        </div>
        <div class="header-actions">
          <a href="/pages/thong-bao.html" class="header-action-item">
            <i class="bi bi-bell" style="font-size: 20px;"></i>
            <span class="d-none d-md-inline">Thông báo</span>
            <span class="badge-count" id="notifCount" style="display:none;">0</span>
          </a>
          <a href="/pages/gio-hang.html" class="header-action-item">
            <i class="bi bi-cart3" style="font-size: 20px;"></i>
            <span class="d-none d-md-inline">Giỏ hàng</span>
            <span class="badge-count" id="cartCount" style="display:none;">0</span>
          </a>
          <div id="headerAuth">
            <a href="/pages/dang-nhap.html" class="header-action-item">
              <i class="bi bi-person" style="font-size: 20px;"></i>
              <span class="d-none d-md-inline">Đăng nhập</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Category Navigation -->
  <nav class="category-nav">
    <div class="container">
      <div class="d-flex align-items-center gap-0">
        <button class="category-menu-btn">
          <i class="bi bi-grid-3x3-gap"></i>
          Danh mục sản phẩm
        </button>
        <div class="d-flex" id="categoryNav">
          <a href="/pages/danh-sach-sach.html?category=van-hoc" class="nav-link">Văn học</a>
          <a href="/pages/danh-sach-sach.html?category=ky-nang-song" class="nav-link">Kỹ năng sống</a>
          <a href="/pages/danh-sach-sach.html?category=thieu-nhi" class="nav-link">Thiếu nhi</a>
          <a href="/pages/danh-sach-sach.html?category=kinh-te" class="nav-link">Kinh tế</a>
          <a href="/pages/danh-sach-sach.html?category=ngoai-ngu" class="nav-link">Ngoại ngữ</a>
        </div>
      </div>
    </div>
  </nav>`;
}

function renderFooter() {
  return `
  <footer class="main-footer">
    <div class="container">
      <div class="row g-4">
        <div class="col-lg-4">
          <div class="footer-logo">
            <div class="logo-icon"><i class="bi bi-book-half"></i></div>
            Sách Hub
          </div>
          <p class="footer-desc">Sách Hub - Nền tảng mua sắm sách trực tuyến, được phát triển bởi sinh viên Đại học Duy Tân.</p>
          <div class="footer-social">
            <a href="https://www.facebook.com/daihocduytan.dtu" target="_blank" rel="noopener noreferrer"><i class="bi bi-facebook"></i></a>
            <a href="https://www.instagram.com/duytanuni_official/" target="_blank" rel="noopener noreferrer"><i class="bi bi-instagram"></i></a>
            <a href="https://www.youtube.com/@DuyTanUniversity" target="_blank" rel="noopener noreferrer"><i class="bi bi-youtube"></i></a>
          </div>
        </div>
        <div class="col-lg-2 col-md-4">
          <h6 class="footer-title">Dịch vụ</h6>
          <ul class="footer-links">
            <li><a href="/pages/gioi-thieu.html">Giới thiệu Sách Hub</a></li>
            <li><a href="/pages/lien-he.html">Liên hệ với chúng tôi</a></li>
            <li><a href="/pages/tuyen-dung.html">Tuyển dụng</a></li>
            <li><a href="#">Chính sách bảo mật</a></li>
          </ul>
        </div>
        <div class="col-lg-3 col-md-4">
          <h6 class="footer-title">Hỗ trợ khách hàng</h6>
          <ul class="footer-links">
            <li><a href="#">Chính sách đổi trả</a></li>
            <li><a href="#">Phương thức vận chuyển</a></li>
            <li><a href="#">Phương thức thanh toán</a></li>
            <li><a href="#">Câu hỏi thường gặp (FAQ)</a></li>
          </ul>
        </div>
        <div class="col-lg-3 col-md-4">
          <h6 class="footer-title">Liên hệ</h6>
          <div class="footer-contact-item">
            <i class="bi bi-geo-alt"></i>
            <span>3 Quang Trung, Hải Châu, TP. Đà Nẵng</span>
          </div>
          <div class="footer-contact-item">
            <i class="bi bi-telephone"></i>
            <span>0934747712</span>
          </div>
          <div class="footer-contact-item">
            <i class="bi bi-envelope"></i>
            <span>support@sachhub.vn</span>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        &copy; 2026 Sách Hub. Tất cả quyền được bảo lưu.
      </div>
    </div>
  </footer>
  <div class="toast-container" id="toastContainer"></div>`;
}

// ====== SEARCH HANDLER ======
function handleSearch() {
  const input = document.getElementById('searchInput');
  if (input) {
    const query = input.value.trim();
    if (query) {
      window.location.href = `/pages/tim-kiem.html?q=${encodeURIComponent(query)}`;
    }
  }
}

// ====== INIT HEADER & FOOTER ======
function initComponents() {
  const headerEl = document.getElementById('site-header');
  const footerEl = document.getElementById('site-footer');

  if (headerEl) headerEl.innerHTML = renderHeader();
  if (footerEl) footerEl.innerHTML = renderFooter();

  // Search enter key + suggest dropdown
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        hideSearchSuggest();
        handleSearch();
      }
    });
    searchInput.addEventListener('input', onSearchInput);
    searchInput.addEventListener('focus', () => {
      const q = searchInput.value.trim();
      if (q) fetchSearchSuggest(q);
    });
  }

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const wrap = document.querySelector('.header-search');
    if (wrap && !wrap.contains(e.target)) hideSearchSuggest();
  });

  // Update auth state
  if (typeof updateHeaderAuth === 'function') {
    updateHeaderAuth();
  }

  // Update notification count
  updateNotifCount();

  // Update cart count (đồng bộ badge giỏ hàng trên header giữa các trang)
  if (typeof updateCartCount === 'function') updateCartCount();

  // Load chatbot CSS + JS (detect base path từ vị trí components.js)
  const scripts = document.querySelectorAll('script[src*="components.js"]');
  const compSrc = scripts.length ? scripts[scripts.length - 1].src : '';
  const basePath = compSrc ? compSrc.substring(0, compSrc.lastIndexOf('/js/')) + '/' : '/';

  if (!document.getElementById('chatbot-css')) {
    const link = document.createElement('link');
    link.id = 'chatbot-css';
    link.rel = 'stylesheet';
    link.href = basePath + 'css/chatbot.css';
    document.head.appendChild(link);
  }
  if (!document.getElementById('chatbot-js')) {
    const script = document.createElement('script');
    script.id = 'chatbot-js';
    script.src = basePath + 'js/chatbot.js';
    document.body.appendChild(script);
  }

  // Load live-chat CSS + JS (chi hien cho user da dang nhap)
  if (!document.getElementById('livechat-css')) {
    const lcLink = document.createElement('link');
    lcLink.id = 'livechat-css';
    lcLink.rel = 'stylesheet';
    lcLink.href = basePath + 'css/live-chat.css';
    document.head.appendChild(lcLink);
  }
  if (!document.getElementById('livechat-socketio')) {
    const sioScript = document.createElement('script');
    sioScript.id = 'livechat-socketio';
    sioScript.src = 'https://cdn.socket.io/4.7.2/socket.io.min.js';
    sioScript.onload = function() {
      if (!document.getElementById('livechat-js')) {
        const lcScript = document.createElement('script');
        lcScript.id = 'livechat-js';
        lcScript.src = basePath + 'js/live-chat.js';
        document.body.appendChild(lcScript);
      }
    };
    document.body.appendChild(sioScript);
  }
}

// ====== UPDATE NOTIFICATION COUNT ======
async function updateNotifCount() {
  const badge = document.getElementById('notifCount');
  if (!badge) return;

  if (typeof isLoggedIn !== 'function' || !isLoggedIn()) {
    badge.style.display = 'none';
    return;
  }

  try {
    const data = await apiCall('/notifications/unread-count');
    const count = data.count || 0;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  } catch (error) {
    badge.style.display = 'none';
  }
}

// ====== SEARCH SUGGEST DROPDOWN ======
let _searchSuggestTimer = null;
let _searchSuggestSeq = 0;

function onSearchInput(e) {
  const q = e.target.value.trim();
  clearTimeout(_searchSuggestTimer);
  if (!q) {
    hideSearchSuggest();
    return;
  }
  _searchSuggestTimer = setTimeout(() => fetchSearchSuggest(q), 250);
}

async function fetchSearchSuggest(q) {
  const box = document.getElementById('searchSuggest');
  if (!box) return;
  const seq = ++_searchSuggestSeq;
  box.classList.add('show');
  box.innerHTML = '<div class="search-suggest-loading"><div class="spinner-border spinner-border-sm"></div> Đang tìm...</div>';
  try {
    const data = await apiCall(`/books?search=${encodeURIComponent(q)}&limit=8`);
    if (seq !== _searchSuggestSeq) return; // outdated response
    const books = data.data || data.books || [];
    renderSearchSuggest(books, q);
  } catch (err) {
    if (seq !== _searchSuggestSeq) return;
    box.innerHTML = '<div class="search-suggest-empty">Không thể tải gợi ý</div>';
  }
}

function renderSearchSuggest(books, q) {
  const box = document.getElementById('searchSuggest');
  if (!box) return;

  if (!books.length) {
    box.innerHTML = `<div class="search-suggest-empty"><i class="bi bi-search"></i> Không tìm thấy sách phù hợp với "${escapeHtml(q)}"</div>`;
    box.classList.add('show');
    return;
  }

  const items = books.map(b => {
    const slug = b.slug || b._id;
    const img = (b.images && b.images[0]) || 'https://placehold.co/60x80/FFF3ED/E8491D?text=S';
    const price = typeof formatPrice === 'function' ? formatPrice(b.price || 0) : (b.price || 0);
    return `
      <a href="/pages/chi-tiet-sach.html?slug=${slug}" class="search-suggest-item">
        <img src="${img}" alt="">
        <div class="search-suggest-info">
          <div class="search-suggest-title">${escapeHtml(b.title || '')}</div>
          <div class="search-suggest-author">${escapeHtml(b.author || '')}</div>
          <div class="search-suggest-price">${price}</div>
        </div>
      </a>
    `;
  }).join('');

  box.innerHTML = items + `
    <a href="/pages/tim-kiem.html?q=${encodeURIComponent(q)}" class="search-suggest-more">
      Xem tất cả kết quả cho "${escapeHtml(q)}" <i class="bi bi-arrow-right"></i>
    </a>
  `;
  box.classList.add('show');
}

function hideSearchSuggest() {
  const box = document.getElementById('searchSuggest');
  if (box) {
    box.classList.remove('show');
    box.innerHTML = '';
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// Auto init when DOM ready
document.addEventListener('DOMContentLoaded', initComponents);

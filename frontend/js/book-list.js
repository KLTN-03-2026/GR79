// ====== BOOK LIST PAGE ======

let currentPage = 1;
let currentSort = 'newest';
let currentCategory = '';
let currentMinPrice = '';
let currentMaxPrice = '';
let currentRating = '';
let totalPages = 1;
const LIMIT = 12;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  if (typeof updateHeaderAuth === 'function') updateHeaderAuth();
  if (typeof updateCartCount === 'function') updateCartCount();
  parseURLParams();
  loadCategories();
  loadBooks();
  initMobileFilter();
});

// ====== PARSE URL PARAMS ======
function parseURLParams() {
  const params = new URLSearchParams(window.location.search);
  currentCategory = params.get('category') || '';
  currentPage = parseInt(params.get('page')) || 1;
  currentSort = params.get('sort') || 'newest';
  currentMinPrice = params.get('minPrice') || '';
  currentMaxPrice = params.get('maxPrice') || '';
  currentRating = params.get('rating') || '';

  // Set active sort button
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === currentSort);
  });

  // Set price filter
  if (currentMinPrice || currentMaxPrice) {
    const priceValue = `${currentMinPrice || '0'}-${currentMaxPrice || '0'}`;
    const priceRadio = document.querySelector(`input[name="priceRange"][value="${priceValue}"]`);
    if (priceRadio) priceRadio.checked = true;
  }

  // Set rating filter
  if (currentRating) {
    const ratingRadio = document.querySelector(`input[name="ratingFilter"][value="${currentRating}"]`);
    if (ratingRadio) ratingRadio.checked = true;
  }
}

// ====== LOAD CATEGORIES (sidebar filter) ======
async function loadCategories() {
  try {
    const data = await apiCall('/categories');
    const categories = data.categories || data.data || data || [];
    if (!Array.isArray(categories)) return;

    const container = document.getElementById('filterCategories');
    if (!container) return;

    container.innerHTML = categories.map(cat => {
      const catSlug = cat.slug || cat._id;
      const isChecked = currentCategory === catSlug;
      return `
        <li>
          <label>
            <input type="radio" name="filterCategory" value="${catSlug}" ${isChecked ? 'checked' : ''} onchange="filterByCategory('${catSlug}')">
            ${cat.name}
            ${cat.bookCount !== undefined ? `<span class="count">(${cat.bookCount})</span>` : ''}
          </label>
        </li>
      `;
    }).join('');

    // Update page title if category is selected
    if (currentCategory) {
      const selectedCat = categories.find(c => (c.slug || c._id) === currentCategory);
      if (selectedCat) {
        document.getElementById('pageTitle').textContent = selectedCat.name;
        document.getElementById('breadcrumbTitle').textContent = selectedCat.name;
        document.title = `${selectedCat.name} - Sách Hub`;
      }
    }
  } catch (error) {
    // Silent fail
  }
}

// ====== FILTER BY CATEGORY (click radio → apply ngay) ======
function filterByCategory(slug) {
  currentCategory = slug;
  currentPage = 1;
  loadBooks();

  // Update title
  const label = document.querySelector(`input[name="filterCategory"][value="${slug}"]`);
  if (label) {
    const catName = label.parentElement.textContent.trim().split('(')[0].trim();
    document.getElementById('pageTitle').textContent = catName;
    document.getElementById('breadcrumbTitle').textContent = catName;
    document.title = `${catName} - Sách Hub`;
  }
}

// ====== LOAD BOOKS ======
async function loadBooks() {
  const grid = document.getElementById('bookGrid');
  grid.innerHTML = '<div class="text-center py-5"><div class="spinner-custom mx-auto"></div></div>';

  // Build query string
  let query = `?page=${currentPage}&limit=${LIMIT}&sort=${currentSort}`;
  if (currentCategory) query += `&category=${currentCategory}`;
  if (currentMinPrice) query += `&minPrice=${currentMinPrice}`;
  if (currentMaxPrice) query += `&maxPrice=${currentMaxPrice}`;
  if (currentRating) query += `&rating=${currentRating}`;

  try {
    const data = await apiCall(`/books${query}`);
    const books = data.books || data.data || [];
    const pagination = data.pagination || {};
    const total = pagination.total || data.total || books.length;
    totalPages = pagination.totalPages || data.totalPages || Math.ceil(total / LIMIT) || 1;

    // Update result count
    document.getElementById('resultCount').textContent = `Hiển thị ${books.length} trên ${total} sản phẩm`;

    // Update active filters
    updateActiveFilters();

    if (books.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-inbox"></i>
          <h3>Không tìm thấy sản phẩm nào</h3>
          <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để tìm sản phẩm phù hợp hơn.</p>
        </div>
      `;
      document.getElementById('paginationNav').style.display = 'none';
      return;
    }

    grid.innerHTML = `<div class="row g-3">${books.map(book => renderBookCard(book)).join('')}</div>`;
    renderPagination();
    updateURL(query);

  } catch (error) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-exclamation-circle"></i>
        <h3>Không thể tải dữ liệu</h3>
        <p>${error.message || 'Đã có lỗi xảy ra, vui lòng thử lại.'}</p>
      </div>
    `;
  }
}

// ====== RENDER BOOK CARD ======
function renderBookCard(book) {
  const price = book.price || 0;
  const originalPrice = book.originalPrice || price;
  const discount = book.discount || 0;
  const rating = book.rating || 0;
  const image = (book.images && book.images[0]) || 'https://placehold.co/300x400/FFF3ED/E8491D?text=Sách+Hub';
  const slug = book.slug || book._id;
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));

  return `
    <div class="col-lg-3 col-md-4 col-6">
      <a href="/pages/chi-tiet-sach.html?slug=${slug}" class="book-card d-block">
        <div class="card-img-wrapper">
          <img src="${image}" alt="${book.title}" loading="lazy">
          ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="book-title">${book.title}</h3>
          <p class="book-author">${book.author || ''}</p>
          <div class="book-rating">
            <span class="star">${stars}</span>
            <span style="color:var(--text-light);">(${book.numReviews || 0})</span>
          </div>
          <div class="book-price">
            <span class="current-price">${formatPrice(price)}</span>
            ${originalPrice > price ? `<span class="original-price">${formatPrice(originalPrice)}</span>` : ''}
          </div>
        </div>
      </a>
    </div>
  `;
}

// ====== PAGINATION ======
function renderPagination() {
  const nav = document.getElementById('paginationNav');
  const container = document.getElementById('pagination');

  if (totalPages <= 1) {
    nav.style.display = 'none';
    return;
  }

  nav.style.display = 'block';
  let html = '';

  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(1); return false;">1</a></li>`;
    if (startPage > 2) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    html += `<li class="page-item"><a class="page-link" href="#" onclick="goToPage(${totalPages}); return false;">${totalPages}</a></li>`;
  }

  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  loadBooks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== SORTING ======
function changeSort(sort, btn) {
  currentSort = sort;
  currentPage = 1;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadBooks();
}

// ====== VIEW MODE ======
function setViewMode(mode, btn) {
  document.querySelectorAll('.view-mode button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ====== FILTERS ======
function applyFilters() {
  // Get price range
  const priceRadio = document.querySelector('input[name="priceRange"]:checked');
  if (priceRadio) {
    const [min, max] = priceRadio.value.split('-');
    currentMinPrice = min;
    currentMaxPrice = max === '0' ? '' : max;
  } else {
    currentMinPrice = '';
    currentMaxPrice = '';
  }

  // Get rating
  const ratingRadio = document.querySelector('input[name="ratingFilter"]:checked');
  currentRating = ratingRadio ? ratingRadio.value : '';

  currentPage = 1;
  loadBooks();
  closeMobileFilter();
}

function resetFilters() {
  currentCategory = '';
  currentMinPrice = '';
  currentMaxPrice = '';
  currentRating = '';
  currentPage = 1;

  document.querySelectorAll('input[name="filterCategory"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="priceRange"]').forEach(r => r.checked = false);
  document.querySelectorAll('input[name="ratingFilter"]').forEach(r => r.checked = false);

  document.getElementById('pageTitle').textContent = 'Tất cả sách';
  document.getElementById('breadcrumbTitle').textContent = 'Danh sách sách';
  document.title = 'Danh sách sách - Sách Hub';

  loadBooks();
  closeMobileFilter();
}

// ====== ACTIVE FILTERS DISPLAY ======
function updateActiveFilters() {
  const container = document.getElementById('activeFilters');
  let html = '';

  if (currentCategory) {
    const catRadio = document.querySelector(`input[name="filterCategory"][value="${currentCategory}"]`);
    const catName = catRadio ? catRadio.parentElement.textContent.trim().split('(')[0].trim() : currentCategory;
    html += `
      <span class="active-filter-tag">
        Danh mục: ${catName}
        <span class="remove-filter" onclick="removeFilter('category')">&times;</span>
      </span>
    `;
  }

  if (currentMinPrice || currentMaxPrice) {
    let priceLabel = '';
    if (!currentMaxPrice || currentMaxPrice === '0') {
      priceLabel = `Từ ${formatPrice(parseInt(currentMinPrice))}`;
    } else if (!currentMinPrice || currentMinPrice === '0') {
      priceLabel = `Dưới ${formatPrice(parseInt(currentMaxPrice))}`;
    } else {
      priceLabel = `${formatPrice(parseInt(currentMinPrice))} - ${formatPrice(parseInt(currentMaxPrice))}`;
    }
    html += `
      <span class="active-filter-tag">
        Giá: ${priceLabel}
        <span class="remove-filter" onclick="removeFilter('price')">&times;</span>
      </span>
    `;
  }

  if (currentRating) {
    html += `
      <span class="active-filter-tag">
        Từ ${currentRating} sao
        <span class="remove-filter" onclick="removeFilter('rating')">&times;</span>
      </span>
    `;
  }

  container.innerHTML = html;
}

function removeFilter(type) {
  if (type === 'category') {
    currentCategory = '';
    document.querySelectorAll('input[name="filterCategory"]').forEach(r => r.checked = false);
    document.getElementById('pageTitle').textContent = 'Tất cả sách';
    document.getElementById('breadcrumbTitle').textContent = 'Danh sách sách';
    document.title = 'Danh sách sách - Sách Hub';
  } else if (type === 'price') {
    currentMinPrice = '';
    currentMaxPrice = '';
    document.querySelectorAll('input[name="priceRange"]').forEach(r => r.checked = false);
  } else if (type === 'rating') {
    currentRating = '';
    document.querySelectorAll('input[name="ratingFilter"]').forEach(r => r.checked = false);
  }
  currentPage = 1;
  loadBooks();
}

// ====== MOBILE FILTER ======
function initMobileFilter() {
  const openBtn = document.getElementById('mobileFilterBtn');
  const closeBtn = document.getElementById('filterCloseBtn');
  const overlay = document.getElementById('filterOverlay');

  openBtn?.addEventListener('click', () => {
    document.getElementById('filterSidebar').classList.add('show');
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  });

  closeBtn?.addEventListener('click', closeMobileFilter);
  overlay?.addEventListener('click', closeMobileFilter);

  // Reset overflow khi resize từ mobile sang desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth > 991) {
      closeMobileFilter();
    }
  });
}

function closeMobileFilter() {
  document.getElementById('filterSidebar')?.classList.remove('show');
  document.getElementById('filterOverlay')?.classList.remove('show');
  document.body.style.overflow = '';
}

// Safety: đảm bảo body không bị overflow hidden khi trang load
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.overflow = '';
});

// ====== UPDATE URL ======
function updateURL(query) {
  const url = new URL(window.location);
  url.search = query;
  window.history.replaceState({}, '', url);
}

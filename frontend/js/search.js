// ====== SEARCH PAGE ======

let currentPage = 1;
let currentSort = 'relevant';
let searchQuery = '';
let totalPages = 1;
const LIMIT = 12;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderAuth();
  if (typeof updateCartCount === 'function') updateCartCount();
  loadCategoryNav();
  parseSearchParams();
  performSearch();
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

// ====== PARSE SEARCH PARAMS ======
function parseSearchParams() {
  const params = new URLSearchParams(window.location.search);
  searchQuery = params.get('q') || '';
  currentPage = parseInt(params.get('page')) || 1;
  currentSort = params.get('sort') || 'relevant';

  // Display search query
  document.getElementById('searchQuery').textContent = `"${searchQuery}"`;
  document.getElementById('searchInput').value = searchQuery;
  document.title = `Tìm kiếm: ${searchQuery} - Sách Hub`;

  // Set active sort
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sort === currentSort);
  });
}

// ====== PERFORM SEARCH ======
async function performSearch() {
  if (!searchQuery) {
    document.getElementById('searchGrid').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-search"></i>
        <h3>Nhập từ khóa để tìm kiếm</h3>
        <p>Hãy nhập tên sách, tác giả hoặc thể loại bạn muốn tìm.</p>
      </div>
    `;
    return;
  }

  const grid = document.getElementById('searchGrid');
  grid.innerHTML = '<div class="text-center py-5"><div class="spinner-custom mx-auto"></div></div>';

  let query = `?search=${encodeURIComponent(searchQuery)}&page=${currentPage}&limit=${LIMIT}`;
  if (currentSort !== 'relevant') {
    query += `&sort=${currentSort}`;
  }

  try {
    const data = await apiCall(`/books${query}`);
    const books = data.data || data.books || data || [];
    const pagination = data.pagination || {};
    const total = pagination.total || data.total || books.length;
    totalPages = pagination.totalPages || data.totalPages || Math.ceil(total / LIMIT) || 1;

    // Update result info
    document.getElementById('searchResultInfo').textContent = `Tìm thấy ${total} kết quả`;

    if (books.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="bi bi-search"></i>
          <h3>Không tìm thấy kết quả nào</h3>
          <p>Không có sản phẩm nào phù hợp với từ khóa "${searchQuery}". Hãy thử với từ khóa khác.</p>
        </div>
      `;
      document.getElementById('paginationNav').style.display = 'none';
      return;
    }

    grid.innerHTML = `<div class="row g-3">${books.map(book => renderBookCard(book)).join('')}</div>`;
    renderPagination();

    // Update URL
    const url = new URL(window.location);
    url.search = query;
    window.history.replaceState({}, '', url);

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

  // Previous
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;

  // Page numbers
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

  container.innerHTML = html;
}

function goToPage(page) {
  if (page < 1 || page > totalPages || page === currentPage) return;
  currentPage = page;
  performSearch();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ====== SORTING ======
function changeSearchSort(sort, btn) {
  currentSort = sort;
  currentPage = 1;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  performSearch();
}

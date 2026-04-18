// ====== INIT ======
document.addEventListener('DOMContentLoaded', () => {
  loadFlashSaleBooks();
  loadBestSellerBooks();
  loadNewBooks();
  loadBlogPosts();
  startCountdown();
  updateCartCount();
});

// ====== RENDER BOOK CARD ======
function renderBookCard(book) {
  const discount = book.discount > 0 ? `<span class="discount-badge">-${book.discount}%</span>` : '';
  const originalPrice = book.originalPrice ? `<span class="original-price">${formatPrice(book.originalPrice)}</span>` : '';
  const image = book.images && book.images.length > 0 ? book.images[0] : 'https://placehold.co/300x400/FFF3ED/E8491D?text=Sách+Hub';
  const stars = '&#9733;'.repeat(Math.round(book.rating || 0)) + '&#9734;'.repeat(5 - Math.round(book.rating || 0));

  return `
    <div class="col-6 col-md-4 col-lg-3 col-xl-2">
      <a href="/pages/chi-tiet-sach.html?slug=${book.slug}" class="book-card">
        <div class="card-img-wrapper">
          <img src="${image}" alt="${book.title}" loading="lazy">
          ${discount}
        </div>
        <div class="card-body">
          <div class="book-title">${book.title}</div>
          <div class="book-author">${book.author}</div>
          <div class="book-rating">
            <span class="star">${stars}</span>
            <span style="color:var(--text-light);">(${book.numReviews || 0})</span>
          </div>
          <div class="book-price">
            <span class="current-price">${formatPrice(book.price)}</span>
            ${originalPrice}
          </div>
        </div>
      </a>
    </div>
  `;
}

// ====== LOAD FLASH SALE ======
async function loadFlashSaleBooks() {
  const container = document.getElementById('flashSaleBooks');
  try {
    const data = await apiCall('/books/flash-sale');
    if (data.books && data.books.length > 0) {
      container.innerHTML = data.books.slice(0, 6).map(renderBookCard).join('');
    } else {
      loadSampleBooks(container, 6);
    }
  } catch {
    loadSampleBooks(container, 6);
  }
}

// ====== LOAD BEST SELLERS ======
async function loadBestSellerBooks() {
  const container = document.getElementById('bestSellerBooks');
  try {
    const data = await apiCall('/books?sort=-sold&limit=6');
    if (data.books && data.books.length > 0) {
      container.innerHTML = data.books.map(renderBookCard).join('');
    } else {
      loadSampleBooks(container, 6);
    }
  } catch {
    loadSampleBooks(container, 6);
  }
}

// ====== LOAD NEW BOOKS ======
async function loadNewBooks() {
  const container = document.getElementById('newBooks');
  try {
    const data = await apiCall('/books?sort=-createdAt&limit=6');
    if (data.books && data.books.length > 0) {
      container.innerHTML = data.books.map(renderBookCard).join('');
    } else {
      loadSampleBooks(container, 6);
    }
  } catch {
    loadSampleBooks(container, 6);
  }
}

// ====== SAMPLE BOOKS (khi chưa có data từ API) ======
function loadSampleBooks(container, count) {
  container.innerHTML = '<div class="col-12 text-center py-4"><p style="color:var(--text-gray)">Chưa có sách nào. Vui lòng chạy seed data.</p></div>';
}

// ====== LOAD BLOG ======
async function loadBlogPosts() {
  const container = document.getElementById('blogPosts');
  try {
    const data = await apiCall('/blogs?limit=3');
    if (data.blogs && data.blogs.length > 0) {
      container.innerHTML = data.blogs.map(renderBlogCard).join('');
    } else {
      loadSampleBlogs(container);
    }
  } catch {
    loadSampleBlogs(container);
  }
}

function renderBlogCard(blog) {
  const image = blog.image || 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600';
  const date = new Date(blog.createdAt).toLocaleDateString('vi-VN');
  return `
    <div class="col-md-4">
      <a href="/pages/bai-viet.html?slug=${blog.slug}" class="blog-card">
        <img src="${image}" alt="${blog.title}" class="blog-img" loading="lazy">
        <div class="blog-body">
          <span class="blog-category">${blog.category || 'Tin tức'}</span>
          <h5 class="blog-title">${blog.title}</h5>
          <p class="blog-excerpt">${blog.excerpt || ''}</p>
          <div class="blog-meta">
            <span><i class="bi bi-calendar3"></i> ${date}</span>
            <span><i class="bi bi-eye"></i> ${blog.views || 0} lượt xem</span>
          </div>
        </div>
      </a>
    </div>
  `;
}

function loadSampleBlogs(container) {
  const samples = [
    { title: 'Top 10 cuốn sách kinh điển về quản trị kinh doanh', category: 'Review Sách', excerpt: 'Những cuốn sách kinh doanh hay nhất mọi thời đại mà bạn không thể bỏ qua.', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', createdAt: '2026-01-15', views: 1250, slug: 'top-10-sach-kinh-doanh' },
    { title: 'Phong cách đọc sách hiệu quả của người Nhật', category: 'Kinh Nghiệm Đọc', excerpt: 'Khám phá phương pháp đọc sách độc đáo giúp người Nhật tiếp thu kiến thức nhanh hơn.', image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=600', createdAt: '2026-01-10', views: 890, slug: 'phong-cach-doc-sach' },
    { title: 'Xu hướng AudioBook: Tương lai của ngành xuất bản', category: 'Tin Tức Xuất Bản', excerpt: 'AudioBook đang trở thành xu hướng mới, thay đổi cách chúng ta tiếp cận sách.', image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=600', createdAt: '2026-01-05', views: 650, slug: 'xu-huong-audiobook' }
  ];
  container.innerHTML = samples.map(renderBlogCard).join('');
}

// ====== COUNTDOWN ======
function startCountdown() {
  let totalSeconds = 8 * 3600 + 45 * 60 + 30;

  setInterval(() => {
    if (totalSeconds <= 0) return;
    totalSeconds--;
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    document.getElementById('hours').textContent = String(h).padStart(2, '0');
    document.getElementById('minutes').textContent = String(m).padStart(2, '0');
    document.getElementById('seconds').textContent = String(s).padStart(2, '0');
  }, 1000);
}

// ====== CART COUNT ======
// Đã chuyển sang utils.js để dùng chung.

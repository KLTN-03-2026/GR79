// ===== BLOG / TIN TỨC =====

document.addEventListener('DOMContentLoaded', () => {
  let currentPage = 1;
  let currentCategory = '';
  const limit = 6;

  // Load featured post
  loadFeaturedPost();
  // Load blog posts
  loadBlogs();
  // Load popular posts
  loadPopularPosts();

  // Tab click
  document.querySelectorAll('.blog-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.blog-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      currentPage = 1;
      loadBlogs();
    });
  });

  // Search
  const searchBtn = document.getElementById('blogSearchBtn');
  const searchInput = document.getElementById('blogSearchInput');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      currentPage = 1;
      loadBlogs(searchInput.value.trim());
    });
  }
  if (searchInput) {
    searchInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        currentPage = 1;
        loadBlogs(searchInput.value.trim());
      }
    });
  }

  // Newsletter
  const newsletterBtn = document.getElementById('newsletterBtn');
  if (newsletterBtn) {
    newsletterBtn.addEventListener('click', () => {
      const email = document.getElementById('newsletterEmail').value.trim();
      if (!email) {
        showToast('Vui lòng nhập email', 'warning');
        return;
      }
      showToast('Đăng ký nhận tin thành công!', 'success');
      document.getElementById('newsletterEmail').value = '';
    });
  }

  // Update header auth
  if (typeof updateHeaderAuth === 'function') updateHeaderAuth();

  // === Functions ===

  async function loadFeaturedPost() {
    try {
      const res = await apiCall('/blogs?limit=1&sort=-views');
      const posts = res.data || res.blogs || res;
      const arr = Array.isArray(posts) ? posts : (posts.data || []);
      if (arr.length > 0) {
        renderFeaturedPost(arr[0]);
      }
    } catch (err) {
      renderFeaturedPostFallback();
    }
  }

  function renderFeaturedPost(post) {
    const el = document.getElementById('featuredPost');
    if (!el) return;
    const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '01/01/2026';
    const img = post.image || post.thumbnail || 'https://placehold.co/800x360/E8491D/ffffff?text=Sách+Hub+Blog';
    el.innerHTML = `
      <a href="/pages/bai-viet.html?slug=${post.slug}">
        <img src="${img}" alt="${post.title}">
        <div class="featured-overlay">
          <span class="badge-cat">${post.category || 'Tin tức'}</span>
          <h2>${post.title}</h2>
          <div class="meta"><span><i class="bi bi-calendar3"></i> ${date}</span> <span><i class="bi bi-eye"></i> ${post.views || 0} lượt xem</span></div>
        </div>
      </a>
    `;
  }

  function renderFeaturedPostFallback() {
    const el = document.getElementById('featuredPost');
    if (!el) return;
    el.innerHTML = `
      <img src="https://placehold.co/800x360/E8491D/ffffff?text=Sách+Hub+Blog" alt="Featured">
      <div class="featured-overlay">
        <span class="badge-cat">Review Sách</span>
        <h2>Top 10 cuốn sách hay nhất năm 2026 bạn không nên bỏ lỡ</h2>
        <div class="meta"><span><i class="bi bi-calendar3"></i> 15/03/2026</span> <span><i class="bi bi-eye"></i> 2,450 lượt xem</span></div>
      </div>
    `;
  }

  async function loadBlogs(search = '') {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="text-center py-4" style="grid-column:1/-1"><div class="spinner-border text-secondary" role="status"></div></div>';

    try {
      let url = `/blogs?page=${currentPage}&limit=${limit}`;
      if (currentCategory) url += `&category=${currentCategory}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await apiCall(url);
      const data = res.data || res;
      const posts = Array.isArray(data) ? data : (data.blogs || data.data || []);
      const pagination = res.pagination || data.pagination || {};
      const total = pagination.total || data.total || posts.length;
      const totalPages = pagination.totalPages || data.totalPages || Math.ceil(total / limit) || 1;

      if (posts.length === 0) {
        grid.innerHTML = '<div style="grid-column:1/-1" class="text-center py-5"><p class="text-muted">Chưa có bài viết nào.</p></div>';
        document.getElementById('blogPagination').innerHTML = '';
        return;
      }

      grid.innerHTML = posts.map(post => {
        const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '';
        const img = post.image || post.thumbnail || `https://placehold.co/400x200/f0f0f0/999?text=${encodeURIComponent(post.title?.substring(0,12) || 'Blog')}`;
        return `
          <div class="blog-card">
            <a href="/pages/bai-viet.html?slug=${post.slug}"><img src="${img}" alt="${post.title}"></a>
            <div class="blog-card-body">
              <span class="badge-cat">${post.category || 'Tin tức'}</span>
              <h3><a href="/pages/bai-viet.html?slug=${post.slug}">${post.title}</a></h3>
              <p class="excerpt">${post.excerpt || post.description || ''}</p>
              <div class="meta">
                <span><i class="bi bi-calendar3"></i> ${date}</span>
                <span><i class="bi bi-eye"></i> ${post.views || 0}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      renderPagination(totalPages);
    } catch (err) {
      renderFallbackBlogs(grid);
    }
  }

  function renderFallbackBlogs(grid) {
    const fallback = [
      { title: 'Review: Nhà Giả Kim - Hành trình tìm kiếm ước mơ', cat: 'Review Sách', date: '10/03/2026', views: 1820 },
      { title: '5 cuốn sách kỹ năng sống nên đọc trong năm 2026', cat: 'Kinh Nghiệm Đọc', date: '08/03/2026', views: 1540 },
      { title: 'Tác giả Nguyễn Nhật Ánh ra mắt tác phẩm mới', cat: 'Tác Giả', date: '05/03/2026', views: 2100 },
      { title: 'Hội sách TP.HCM 2026: Những điều cần biết', cat: 'Sự Kiện', date: '01/03/2026', views: 980 },
      { title: 'Xu hướng xuất bản sách điện tử tại Việt Nam', cat: 'Tin Tức Xuất Bản', date: '28/02/2026', views: 760 },
      { title: 'Cách xây dựng thói quen đọc sách mỗi ngày', cat: 'Kinh Nghiệm Đọc', date: '25/02/2026', views: 1350 },
    ];
    grid.innerHTML = fallback.map((p, i) => `
      <div class="blog-card">
        <img src="https://placehold.co/400x200/f0f0f0/999?text=Blog+${i + 1}" alt="${p.title}">
        <div class="blog-card-body">
          <span class="badge-cat">${p.cat}</span>
          <h3><a href="#">${p.title}</a></h3>
          <p class="excerpt">Lorem ipsum dolor sit amet consectetur adipisicing elit. Cập nhật thông tin mới nhất.</p>
          <div class="meta">
            <span><i class="bi bi-calendar3"></i> ${p.date}</span>
            <span><i class="bi bi-eye"></i> ${p.views}</span>
          </div>
        </div>
      </div>
    `).join('');
    document.getElementById('blogPagination').innerHTML = '';
  }

  function renderPagination(totalPages) {
    const nav = document.getElementById('blogPagination');
    if (!nav || totalPages <= 1) { if (nav) nav.innerHTML = ''; return; }

    let html = '<ul class="pagination justify-content-center">';
    html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage - 1}">&laquo;</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
    }
    html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}"><a class="page-link" href="#" data-page="${currentPage + 1}">&raquo;</a></li>`;
    html += '</ul>';
    nav.innerHTML = html;

    nav.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const page = parseInt(link.dataset.page);
        if (page >= 1 && page <= totalPages) {
          currentPage = page;
          loadBlogs();
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      });
    });
  }

  async function loadPopularPosts() {
    const list = document.getElementById('popularList');
    if (!list) return;

    try {
      const res = await apiCall('/blogs?sort=-views&limit=5');
      const data = res.data || res;
      const posts = Array.isArray(data) ? data : (data.blogs || data.data || []);

      if (posts.length > 0) {
        list.innerHTML = posts.map((post, i) => {
          const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '';
          return `
            <li>
              <span class="pop-num">${i + 1}</span>
              <div class="pop-info">
                <h5><a href="/pages/bai-viet.html?slug=${post.slug}">${post.title}</a></h5>
                <span><i class="bi bi-eye"></i> ${post.views || 0} lượt xem - ${date}</span>
              </div>
            </li>
          `;
        }).join('');
        return;
      }
    } catch (err) {}

    // Fallback
    const fallbackPop = [
      { title: 'Top 10 cuốn sách hay nhất 2026', views: 2450 },
      { title: 'Review: Nhà Giả Kim', views: 1820 },
      { title: 'Tác giả Nguyễn Nhật Ánh ra mắt sách mới', views: 2100 },
      { title: '5 cuốn sách kỹ năng sống nên đọc', views: 1540 },
      { title: 'Hội sách TP.HCM 2026', views: 980 },
    ];
    list.innerHTML = fallbackPop.map((p, i) => `
      <li>
        <span class="pop-num">${i + 1}</span>
        <div class="pop-info">
          <h5><a href="#">${p.title}</a></h5>
          <span><i class="bi bi-eye"></i> ${p.views} lượt xem</span>
        </div>
      </li>
    `).join('');
  }
});

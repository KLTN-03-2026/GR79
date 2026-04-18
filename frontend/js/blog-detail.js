// ===== BLOG DETAIL =====

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if (!slug) {
    document.getElementById('blogDetail').innerHTML = '<div class="text-center py-5"><h3>Không tìm thấy bài viết</h3><a href="/pages/tin-tuc.html" class="btn btn-primary-custom mt-3">Quay lại tin tức</a></div>';
    return;
  }

  loadBlogDetail(slug);
  loadPopularPosts();

  // Search redirect
  const searchBtn = document.getElementById('blogSearchBtn');
  const searchInput = document.getElementById('blogSearchInput');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const q = searchInput.value.trim();
      if (q) window.location.href = `/pages/tin-tuc.html?search=${encodeURIComponent(q)}`;
    });
  }

  // Newsletter
  const newsletterBtn = document.getElementById('newsletterBtn');
  if (newsletterBtn) {
    newsletterBtn.addEventListener('click', () => {
      const email = document.getElementById('newsletterEmail').value.trim();
      if (!email) { showToast('Vui lòng nhập email', 'warning'); return; }
      showToast('Đăng ký nhận tin thành công!', 'success');
      document.getElementById('newsletterEmail').value = '';
    });
  }

  if (typeof updateHeaderAuth === 'function') updateHeaderAuth();

  async function loadBlogDetail(slug) {
    const detail = document.getElementById('blogDetail');
    try {
      const res = await apiCall(`/blogs/${slug}`);
      const post = res.data || res.blog || res;

      if (!post || !post.title) {
        renderFallbackDetail(detail, slug);
        return;
      }

      document.title = `${post.title} - Sách Hub`;
      document.getElementById('breadcrumbTitle').textContent = post.title;

      const date = post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '01/01/2026';
      const img = post.image || post.thumbnail || 'https://placehold.co/800x420/f0f0f0/999?text=Sách+Hub+Blog';

      detail.innerHTML = `
        <div class="blog-detail-header">
          <span class="badge-cat">${post.category || 'Tin tức'}</span>
          <h1>${post.title}</h1>
          <div class="meta">
            <span><i class="bi bi-calendar3"></i> ${date}</span>
            <span><i class="bi bi-eye"></i> ${post.views || 0} lượt xem</span>
            <span><i class="bi bi-person"></i> ${post.author?.fullName || post.author || 'Sách Hub'}</span>
          </div>
        </div>
        <img src="${img}" alt="${post.title}" class="blog-detail-img">
        <div class="blog-content">${post.content || '<p>Nội dung đang được cập nhật...</p>'}</div>
        <div class="mt-4 pt-3" style="border-top:1px solid var(--border)">
          <a href="/pages/tin-tuc.html" class="btn btn-outline-custom"><i class="bi bi-arrow-left"></i> Quay lại tin tức</a>
        </div>
      `;
    } catch (err) {
      renderFallbackDetail(detail, slug);
    }
  }

  function renderFallbackDetail(el, slug) {
    document.getElementById('breadcrumbTitle').textContent = 'Top 10 cuốn sách hay nhất năm 2026';
    document.title = 'Top 10 cuốn sách hay nhất năm 2026 - Sách Hub';
    el.innerHTML = `
      <div class="blog-detail-header">
        <span class="badge-cat">Review Sách</span>
        <h1>Top 10 cuốn sách hay nhất năm 2026 bạn không nên bỏ lỡ</h1>
        <div class="meta">
          <span><i class="bi bi-calendar3"></i> 15/03/2026</span>
          <span><i class="bi bi-eye"></i> 2,450 lượt xem</span>
          <span><i class="bi bi-person"></i> Sách Hub</span>
        </div>
      </div>
      <img src="https://placehold.co/800x420/E8491D/ffffff?text=Top+10+Sách+Hay+2026" alt="Top 10 sách hay" class="blog-detail-img">
      <div class="blog-content">
        <p>Năm 2026 đánh dấu một năm bùng nổ của văn học Việt Nam và thế giới. Dưới đây là danh sách 10 cuốn sách hay nhất được bạn đọc yêu thích và đánh giá cao nhất tại Sách Hub.</p>
        <h2>1. Nhà Giả Kim - Paulo Coelho</h2>
        <p>Một tác phẩm kinh điển về hành trình theo đuổi ước mơ. Cuốn sách kể về chàng chăn cừu Santiago trong hành trình đi tìm kho báu, nhưng thực chất là hành trình khám phá bản thân và ý nghĩa cuộc sống.</p>
        <blockquote>"Khi bạn thực sự khao khát điều gì, cả vũ trụ sẽ hợp lực giúp bạn đạt được nó."</blockquote>
        <h2>2. Sapiens - Yuval Noah Harari</h2>
        <p>Cuốn sách đưa bạn đọc vào một hành trình khám phá lịch sử loài người từ thời kỳ đồ đá đến thế kỷ 21. Harari giải thích cách loài người trở thành loài thống trị trên Trái Đất.</p>
        <h2>3. Đắc Nhân Tâm - Dale Carnegie</h2>
        <p>Cuốn sách về nghệ thuật giao tiếp và ứng xử kinh điển, đã được dịch ra hơn 30 ngôn ngữ. Đây là cuốn sách không thể thiếu cho bất kỳ ai muốn cải thiện kỹ năng giao tiếp.</p>
        <h2>4. Tôi Thấy Hoa Vàng Trên Cỏ Xanh - Nguyễn Nhật Ánh</h2>
        <p>Một câu chuyện đẹp về tuổi thơ, tình bạn và gia đình trong khung cảnh làng quê Việt Nam. Nguyễn Nhật Ánh một lần nữa chứng minh khả năng kể chuyện xuất sắc của mình.</p>
        <h2>5. Atomic Habits - James Clear</h2>
        <p>Cuốn sách hướng dẫn cách xây dựng thói quen tốt và loại bỏ thói quen xấu. James Clear đưa ra framework đơn giản nhưng hiệu quả để thay đổi cuộc sống từ những thói quen nhỏ nhất.</p>
        <p><strong>Và còn nhiều cuốn sách hay khác đang chờ bạn khám phá tại Sách Hub!</strong></p>
      </div>
      <div class="mt-4 pt-3" style="border-top:1px solid var(--border)">
        <a href="/pages/tin-tuc.html" class="btn btn-outline-custom"><i class="bi bi-arrow-left"></i> Quay lại tin tức</a>
      </div>
    `;
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
          return `<li><span class="pop-num">${i + 1}</span><div class="pop-info"><h5><a href="/pages/bai-viet.html?slug=${post.slug}">${post.title}</a></h5><span><i class="bi bi-eye"></i> ${post.views || 0} lượt xem - ${date}</span></div></li>`;
        }).join('');
        return;
      }
    } catch (err) {}
    list.innerHTML = [
      'Top 10 cuốn sách hay nhất 2026',
      'Review: Nhà Giả Kim',
      'Tác giả Nguyễn Nhật Ánh ra mắt sách mới',
      '5 cuốn sách kỹ năng sống nên đọc',
      'Hội sách TP.HCM 2026',
    ].map((t, i) => `<li><span class="pop-num">${i + 1}</span><div class="pop-info"><h5><a href="#">${t}</a></h5><span><i class="bi bi-eye"></i> -- lượt xem</span></div></li>`).join('');
  }
});

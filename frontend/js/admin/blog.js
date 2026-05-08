// Quản lý Blog - Sách Hub Admin
let blogs = [];
let currentPage = 1;
let totalPages = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    if (user && user.role === 'staff') {
      window.location.href = '/pages/admin/dashboard.html';
    } else {
      window.location.href = '/';
    }
    return;
  }
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = user.fullName || user.name || 'Admin';
  loadBlogs();
});

async function loadBlogs(page = 1) {
  try {
    currentPage = page;
    const res = await apiCall(`/blogs?all=true&page=${page}&limit=${limit}`);
    blogs = res.blogs || res.data || [];
    const pagination = res.pagination || {};
    totalPages = pagination.totalPages || 1;
    renderBlogsTable();
    renderBlogPagination();
  } catch (err) {
    showToast('Không thể tải bài viết: ' + err.message, 'danger');
  }
}

function renderBlogPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadBlogs(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadBlogs(${i})">${i}</a>
      </li>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadBlogs(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

function renderBlogsTable() {
  const tbody = document.getElementById('blogsTable');
  if (!blogs.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-4 text-muted">Chưa có bài viết nào</td></tr>';
    return;
  }
  tbody.innerHTML = blogs.map((blog, i) => {
    const id = blog._id || blog.id;
    const published = blog.isPublished !== false && blog.published !== false && blog.status !== 'draft';
    const createdAt = blog.createdAt || blog.created_at || blog.publishedAt;
    return `
    <tr>
      <td class="text-muted">${i + 1}</td>
      <td>
        <img src="${blog.image || blog.thumbnail || 'https://placehold.co/70x50?text=No+Img'}"
             alt="" class="rounded" width="70" height="50" style="object-fit:cover;">
      </td>
      <td>
        <div class="fw-semibold">${blog.title}</div>
        <small class="text-muted">${(blog.excerpt || '').substring(0, 60)}${(blog.excerpt || '').length > 60 ? '...' : ''}</small>
      </td>
      <td><span class="badge bg-light text-dark">${blog.category || '-'}</span></td>
      <td>${blog.author && blog.author.fullName ? blog.author.fullName : '-'}</td>
      <td><i class="bi bi-eye me-1 text-muted"></i>${blog.views || 0}</td>
      <td>${createdAt ? new Date(createdAt).toLocaleDateString('vi-VN') : '-'}</td>
      <td>
        <span class="badge ${published ? 'bg-success' : 'bg-warning text-dark'}">
          ${published ? 'Xuất bản' : 'Nháp'}
        </span>
      </td>
      <td>
        <a href="blog-form.html?id=${id}" class="btn btn-sm btn-outline-primary me-1" title="Sửa">
          <i class="bi bi-pencil"></i>
        </a>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlog('${id}')" title="Xóa">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

async function deleteBlog(id) {
  if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
  try {
    await apiCall(`/blogs/${id}`, { method: 'DELETE' });
    showToast('Đã xóa bài viết!', 'success');
    loadBlogs(currentPage);
  } catch (err) {
    showToast('Lỗi khi xóa: ' + err.message, 'danger');
  }
}

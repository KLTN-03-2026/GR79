// Quản lý Blog - Sách Hub Admin
let blogs = [];
let editingBlogId = null;
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

  document.getElementById('blogForm').addEventListener('submit', handleBlogSubmit);
  document.getElementById('blogImage').addEventListener('change', previewBlogImage);
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
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditBlog('${id}')" title="Sửa">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlog('${id}')" title="Xóa">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>`;
  }).join('');
}

function openAddBlog() {
  editingBlogId = null;
  document.getElementById('blogModalTitle').textContent = 'Viết bài mới';
  document.getElementById('blogForm').reset();
  document.getElementById('blogId').value = '';
  document.getElementById('blogPublished').checked = true;
  document.getElementById('blogImagePreview').innerHTML = '';
}

function openEditBlog(id) {
  const blog = blogs.find(b => (b._id || b.id) === id);
  if (!blog) return;
  editingBlogId = id;
  document.getElementById('blogModalTitle').textContent = 'Sửa bài viết';
  document.getElementById('blogId').value = id;
  document.getElementById('blogTitle').value = blog.title;
  document.getElementById('blogCategory').value = blog.category || 'Review Sách';
  document.getElementById('blogExcerpt').value = blog.excerpt || '';
  document.getElementById('blogContent').value = blog.content || '';
  document.getElementById('blogTags').value = (blog.tags || []).join(', ');
  document.getElementById('blogPublished').checked = blog.isPublished !== false && blog.published !== false && blog.status !== 'draft';
  document.getElementById('blogImagePreview').innerHTML = blog.image
    ? `<img src="${blog.image}" class="rounded" width="120" height="80" style="object-fit:cover;">`
    : '';
  const modal = new bootstrap.Modal(document.getElementById('blogModal'));
  modal.show();
}

function previewBlogImage(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('blogImagePreview');
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.innerHTML = `<img src="${ev.target.result}" class="rounded" width="120" height="80" style="object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '';
  }
}

async function handleBlogSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSaveBlog');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang lưu...';

  try {
    const formData = new FormData();
    formData.append('title', document.getElementById('blogTitle').value.trim());
    formData.append('category', document.getElementById('blogCategory').value);
    formData.append('excerpt', document.getElementById('blogExcerpt').value.trim());
    formData.append('content', document.getElementById('blogContent').value.trim());
    formData.append('isPublished', document.getElementById('blogPublished').checked);

    const tagsVal = document.getElementById('blogTags').value.trim();
    if (tagsVal) {
      const tags = tagsVal.split(',').map(t => t.trim()).filter(Boolean);
      formData.append('tags', JSON.stringify(tags));
    }

    const imageFile = document.getElementById('blogImage').files[0];
    if (imageFile) formData.append('image', imageFile);

    let endpoint = '/blogs';
    let method = 'POST';
    if (editingBlogId) {
      endpoint = `/blogs/${editingBlogId}`;
      method = 'PUT';
    }

    await apiCall(endpoint, { method, body: formData, isFormData: true });
    showToast(editingBlogId ? 'Cập nhật bài viết thành công!' : 'Tạo bài viết thành công!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('blogModal')).hide();
    loadBlogs(currentPage);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Lưu bài viết';
  }
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

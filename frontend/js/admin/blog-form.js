// Blog Form - Thêm/Sửa bài viết
let editingBlogId = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user || user.role !== 'admin') {
    window.location.href = user && user.role === 'staff' ? '/pages/admin/dashboard.html' : '/';
    return;
  }

  // Lấy ID từ URL nếu đang sửa
  const params = new URLSearchParams(window.location.search);
  editingBlogId = params.get('id');

  if (editingBlogId) {
    document.getElementById('pageTitle').textContent = 'Sửa bài viết';
    document.title = 'Sửa bài viết - Admin Sách Hub';
    loadBlogData(editingBlogId);
  }

  document.getElementById('blogForm').addEventListener('submit', handleBlogSubmit);
  document.getElementById('blogImage').addEventListener('change', previewBlogImage);
});

async function loadBlogData(id) {
  try {
    const res = await apiCall(`/blogs/${id}`);
    const blog = res.blog || res.data || res;

    document.getElementById('blogId').value = id;
    document.getElementById('blogTitle').value = blog.title || '';
    document.getElementById('blogCategory').value = blog.category || 'Review Sách';
    document.getElementById('blogExcerpt').value = blog.excerpt || '';
    document.getElementById('blogContent').value = blog.content || '';
    document.getElementById('blogTags').value = (blog.tags || []).join(', ');
    document.getElementById('blogPublished').checked = blog.isPublished !== false && blog.published !== false && blog.status !== 'draft';
    document.getElementById('blogImagePreview').innerHTML = blog.image
      ? `<img src="${blog.image}" class="rounded" width="120" height="80" style="object-fit:cover;">`
      : '';
  } catch (err) {
    showToast('Không thể tải bài viết: ' + err.message, 'danger');
  }
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

    setTimeout(() => { window.location.href = 'blog.html'; }, 1000);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg"></i> Lưu bài viết';
  }
}

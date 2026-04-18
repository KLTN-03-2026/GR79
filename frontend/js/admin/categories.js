// Quản lý Danh mục - Sách Hub Admin
let categories = [];
let editingId = null;
let currentPage = 1;
let totalPages = 1;
const limit = 10;

document.addEventListener('DOMContentLoaded', () => {
  const user = getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) { window.location.href = '/'; return; }
  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = user.fullName || 'Admin';
  if (user.role === 'staff') {
    document.querySelectorAll('[data-role="admin"]').forEach(el => el.style.display = 'none');
    const badge = document.querySelector('.badge-admin');
    if (badge) badge.textContent = 'STAFF';
  }
  loadCategories();

  document.getElementById('categoryForm').addEventListener('submit', handleSubmit);
  document.getElementById('categoryImage').addEventListener('change', previewImage);
});

async function loadCategories(page = 1) {
  try {
    currentPage = page;
    const res = await apiCall(`/categories?all=true&page=${page}&limit=${limit}`);
    categories = res.categories || res.data || [];
    const pagination = res.pagination || {};
    totalPages = pagination.totalPages || 1;
    renderTable();
    renderCategoriesPagination();
  } catch (err) {
    showToast('Không thể tải danh mục: ' + err.message, 'danger');
  }
}

function renderCategoriesPagination() {
  const el = document.getElementById('pagination');
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadCategories(${currentPage - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      html += `<li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadCategories(${i})">${i}</a>
      </li>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadCategories(${currentPage + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

function renderTable() {
  const tbody = document.getElementById('categoriesTable');
  if (!categories.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Chưa có danh mục nào</td></tr>';
    return;
  }
  tbody.innerHTML = categories.map((cat, i) => `
    <tr>
      <td class="text-muted">${i + 1}</td>
      <td>
        <img src="${cat.image || 'https://placehold.co/50x50?text=No+Img'}"
             alt="${cat.name}" class="rounded" width="50" height="50" style="object-fit:cover;">
      </td>
      <td class="fw-semibold">${cat.name}</td>
      <td><code>${cat.slug || '-'}</code></td>
      <td><span class="badge bg-secondary">${cat.bookCount || cat.book_count || 0}</span></td>
      <td>
        <span class="badge ${cat.isActive !== false ? 'bg-success' : 'bg-danger'}">
          ${cat.isActive !== false ? 'Hoạt động' : 'Tạm ẩn'}
        </span>
      </td>
      <td>
        <button class="btn btn-sm btn-outline-primary me-1" onclick="openEditModal('${cat._id || cat.id}')" title="Sửa">
          <i class="bi bi-pencil"></i>
        </button>
        <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory('${cat._id || cat.id}')" title="Xóa">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openAddModal() {
  editingId = null;
  document.getElementById('modalTitle').textContent = 'Thêm danh mục';
  document.getElementById('categoryForm').reset();
  document.getElementById('categoryId').value = '';
  document.getElementById('categoryActive').checked = true;
  document.getElementById('imagePreview').innerHTML = '';
}

function openEditModal(id) {
  const cat = categories.find(c => (c._id || c.id) === id);
  if (!cat) return;
  editingId = id;
  document.getElementById('modalTitle').textContent = 'Sửa danh mục';
  document.getElementById('categoryId').value = id;
  document.getElementById('categoryName').value = cat.name;
  document.getElementById('categoryDesc').value = cat.description || '';
  document.getElementById('categoryActive').checked = cat.isActive !== false;
  document.getElementById('imagePreview').innerHTML = cat.image
    ? `<img src="${cat.image}" class="rounded" width="80" height="80" style="object-fit:cover;">`
    : '';
  const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
  modal.show();
}

function previewImage(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('imagePreview');
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.innerHTML = `<img src="${ev.target.result}" class="rounded" width="80" height="80" style="object-fit:cover;">`;
    };
    reader.readAsDataURL(file);
  } else {
    preview.innerHTML = '';
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('btnSave');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Đang lưu...';

  try {
    const formData = new FormData();
    formData.append('name', document.getElementById('categoryName').value.trim());
    formData.append('description', document.getElementById('categoryDesc').value.trim());
    formData.append('isActive', document.getElementById('categoryActive').checked);

    const imageFile = document.getElementById('categoryImage').files[0];
    if (imageFile) formData.append('image', imageFile);

    let endpoint = '/categories';
    let method = 'POST';
    if (editingId) {
      endpoint = `/categories/${editingId}`;
      method = 'PUT';
    }

    await apiCall(endpoint, { method, body: formData, isFormData: true });
    showToast(editingId ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!', 'success');
    bootstrap.Modal.getInstance(document.getElementById('categoryModal')).hide();
    loadCategories(currentPage);
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'danger');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-check-lg me-1"></i> Lưu';
  }
}

async function deleteCategory(id) {
  if (!confirm('Bạn có chắc muốn xóa danh mục này?')) return;
  try {
    await apiCall(`/categories/${id}`, { method: 'DELETE' });
    showToast('Đã xóa danh mục!', 'success');
    loadCategories(currentPage);
  } catch (err) {
    showToast('Lỗi khi xóa: ' + err.message, 'danger');
  }
}

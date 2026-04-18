// ====== ADMIN BOOKS MANAGEMENT ======

// Check admin/staff role
(function checkAdminOrStaff() {
  const user = getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '/';
    return;
  }
  const avatar = document.getElementById('avatarUser');
  if (avatar && user.fullName) {
    avatar.textContent = user.fullName.charAt(0).toUpperCase();
  }
  if (user.role === 'staff') {
    document.querySelectorAll('[data-role="admin"]').forEach(el => el.style.display = 'none');
    const badge = document.querySelector('.badge-admin');
    if (badge) badge.textContent = 'STAFF';
  }
})();

let currentPage = 1;
const limit = 10;
let editingBookId = null;
let selectedImages = [];

// ====== LOAD BOOKS ======
async function loadBooks(page = 1) {
  currentPage = page;
  const search = document.getElementById('searchInput').value.trim();
  const category = document.getElementById('filterCategory').value;
  const status = document.getElementById('filterStatus').value;

  let query = `/books?page=${page}&limit=${limit}`;
  if (search) query += `&search=${encodeURIComponent(search)}`;
  if (category) query += `&category=${encodeURIComponent(category)}`;
  if (status) query += `&status=${status}`;

  const tbody = document.getElementById('booksTable');
  tbody.innerHTML = '<tr><td colspan="10"><div class="admin-spinner"></div></td></tr>';

  try {
    const data = await apiCall(query);
    const books = data.books || data.data || [];
    const pagination = data.pagination || {};
    const total = pagination.total || data.total || data.totalCount || books.length;
    const totalPages = pagination.totalPages || data.totalPages || Math.ceil(total / limit);

    if (!books.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-muted">Không có sách nào</td></tr>';
      document.getElementById('pageInfo').textContent = 'Hiển thị 0 kết quả';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    tbody.innerHTML = books.map((book, index) => {
      const stt = (currentPage - 1) * limit + index + 1;
      const image = book.images?.[0] || book.image || '/images/placeholder.png';
      const isInStock = (book.stock || 0) > 0;

      return `
        <tr>
          <td>${stt}</td>
          <td><img src="${image}" alt="" class="table-thumb"></td>
          <td><strong>${book.title || book.name || ''}</strong></td>
          <td>${book.author || ''}</td>
          <td>${book.category?.name || book.categoryName || ''}</td>
          <td><strong class="text-danger">${formatPrice(book.price || 0)}</strong></td>
          <td>${book.stock || 0}</td>
          <td>${book.sold || 0}</td>
          <td>
            <span class="badge-status ${isInStock ? 'in-stock' : 'out-of-stock'}">
              ${isInStock ? 'Còn hàng' : 'Hết hàng'}
            </span>
          </td>
          <td>
            <div class="d-flex gap-1">
              <button class="btn-sm-action" title="Sửa" onclick="editBook('${book._id}')">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn-sm-action danger" title="Xóa" onclick="deleteBook('${book._id}', '${(book.title || book.name || '').replace(/'/g, "\\'")}')">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Page info
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
    document.getElementById('pageInfo').textContent = `Hiển thị ${start}-${end} trong ${total} sách`;

    // Pagination
    renderPagination(currentPage, totalPages);
  } catch (error) {
    console.error('Load books error:', error);
    tbody.innerHTML = '<tr><td colspan="10" class="text-center py-4 text-danger">Lỗi tải dữ liệu</td></tr>';
  }
}

function renderPagination(current, total) {
  const el = document.getElementById('pagination');
  if (total <= 1) { el.innerHTML = ''; return; }

  let html = '';
  html += `<li class="page-item ${current === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadBooks(${current - 1})"><i class="bi bi-chevron-left"></i></a>
  </li>`;

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - 1 && i <= current + 1)) {
      html += `<li class="page-item ${i === current ? 'active' : ''}">
        <a class="page-link" href="#" onclick="event.preventDefault(); loadBooks(${i})">${i}</a>
      </li>`;
    } else if (i === current - 2 || i === current + 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  html += `<li class="page-item ${current === total ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="event.preventDefault(); loadBooks(${current + 1})"><i class="bi bi-chevron-right"></i></a>
  </li>`;

  el.innerHTML = html;
}

// ====== LOAD CATEGORIES ======
async function loadCategories() {
  try {
    const data = await apiCall('/categories');
    const categories = data.categories || data.data || data || [];
    const options = categories.map(c => `<option value="${c._id}">${c.name}</option>`).join('');

    document.getElementById('filterCategory').innerHTML = '<option value="">Tất cả danh mục</option>' + options;
    document.getElementById('bookCategory').innerHTML = '<option value="">Chọn danh mục</option>' + options;
  } catch (error) {
    console.error('Load categories error:', error);
  }
}

// ====== MODAL ======
function openAddModal() {
  editingBookId = null;
  selectedImages = [];
  document.getElementById('bookModalTitle').textContent = 'Thêm sách mới';
  document.getElementById('bookForm').reset();
  document.getElementById('bookId').value = '';
  document.getElementById('imagePreview').innerHTML = '';
}

async function editBook(id) {
  editingBookId = id;
  selectedImages = [];
  document.getElementById('bookModalTitle').textContent = 'Sửa thông tin sách';
  document.getElementById('bookId').value = id;
  document.getElementById('bookForm').reset();

  try {
    const data = await apiCall(`/books/${id}`);
    const book = data.book || data;

    document.getElementById('bookName').value = book.title || book.name || '';
    document.getElementById('bookAuthor').value = book.author || '';
    document.getElementById('bookPublisher').value = book.publisher || '';
    document.getElementById('bookCategory').value = book.category?._id || book.category || '';
    document.getElementById('bookDescription').value = book.description || '';
    document.getElementById('bookPrice').value = book.price || '';
    document.getElementById('bookOriginalPrice').value = book.originalPrice || '';
    document.getElementById('bookDiscount').value = book.discount || 0;
    document.getElementById('bookStock').value = book.stock || 0;
    document.getElementById('bookPages').value = book.pages || '';
    document.getElementById('bookYear').value = book.publishYear || book.year || '';
    document.getElementById('bookFeatured').checked = book.isFeatured || book.featured || false;
    document.getElementById('bookFlashSale').checked = book.isFlashSale || book.flashSale || false;

    // Show existing images
    const preview = document.getElementById('imagePreview');
    const images = book.images || (book.image ? [book.image] : []);
    preview.innerHTML = images.map((img, i) => `
      <div class="preview-item">
        <img src="${img}" alt="">
        <button type="button" class="remove-img" onclick="this.parentElement.remove()"><i class="bi bi-x"></i></button>
      </div>
    `).join('');

    const modal = new bootstrap.Modal(document.getElementById('bookModal'));
    modal.show();
  } catch (error) {
    showToast('Lỗi tải thông tin sách!', 'error');
  }
}

// ====== IMAGE PREVIEW ======
let imageUidCounter = 0;

function previewImages(event) {
  const files = event.target.files;
  const preview = document.getElementById('imagePreview');

  Array.from(files).forEach(file => {
    const uid = 'img_' + (++imageUidCounter);
    file._uid = uid;
    selectedImages.push(file);
    const reader = new FileReader();
    reader.onload = function (e) {
      const div = document.createElement('div');
      div.className = 'preview-item';
      div.dataset.uid = uid;
      div.innerHTML = `
        <img src="${e.target.result}" alt="">
        <button type="button" class="remove-img" onclick="removeImage(this, '${uid}')"><i class="bi bi-x"></i></button>
      `;
      preview.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
  // Reset input để cùng 1 file có thể chọn lại
  event.target.value = '';
}

function removeImage(btn, uid) {
  const idx = selectedImages.findIndex(f => f._uid === uid);
  if (idx !== -1) selectedImages.splice(idx, 1);
  btn.parentElement.remove();
}

// ====== SAVE BOOK ======
async function saveBook() {
  const id = document.getElementById('bookId').value;
  const name = document.getElementById('bookName').value.trim();
  const author = document.getElementById('bookAuthor').value.trim();
  const price = document.getElementById('bookPrice').value;
  const stock = document.getElementById('bookStock').value;
  const category = document.getElementById('bookCategory').value;

  if (!name || !author || !price || !stock || !category) {
    showToast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('title', name);
  formData.append('author', author);
  formData.append('publisher', document.getElementById('bookPublisher').value.trim());
  formData.append('category', category);
  formData.append('description', document.getElementById('bookDescription').value.trim());
  formData.append('price', price);
  formData.append('originalPrice', document.getElementById('bookOriginalPrice').value || price);
  formData.append('discount', document.getElementById('bookDiscount').value || 0);
  formData.append('stock', stock);
  formData.append('pages', document.getElementById('bookPages').value || '');
  formData.append('publishYear', document.getElementById('bookYear').value || '');
  formData.append('isFeatured', document.getElementById('bookFeatured').checked);
  formData.append('isFlashSale', document.getElementById('bookFlashSale').checked);

  // Append images
  selectedImages.forEach(file => {
    formData.append('images', file);
  });

  try {
    const endpoint = id ? `/books/${id}` : '/books';
    const method = id ? 'PUT' : 'POST';

    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Lỗi');

    showToast(id ? 'Cập nhật sách thành công!' : 'Thêm sách thành công!');
    bootstrap.Modal.getInstance(document.getElementById('bookModal')).hide();
    selectedImages = [];
    loadBooks(currentPage);
  } catch (error) {
    showToast(error.message || 'Có lỗi xảy ra!', 'error');
  }
}

// ====== DELETE BOOK ======
async function deleteBook(id, name) {
  if (!confirm(`Bạn có chắc muốn xóa sách "${name}"?`)) return;

  try {
    await apiCall(`/books/${id}`, { method: 'DELETE' });
    showToast('Đã xóa sách thành công!');
    loadBooks(currentPage);
  } catch (error) {
    showToast(error.message || 'Lỗi xóa sách!', 'error');
  }
}

// ====== SEARCH ON ENTER ======
document.getElementById('searchInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') loadBooks();
});

// ====== INIT ======
loadCategories();
loadBooks();

// ====== ADDRESS PAGE ======

let addresses = [];
let provinceData = [];
let addressModal = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }
  updateHeaderAuth();
  addressModal = new bootstrap.Modal(document.getElementById('addressModal'));
  loadSidebar();
  loadAddresses();
  loadProvinces();

  // Province change -> load districts
  document.getElementById('addrProvince').addEventListener('change', function () {
    const code = this.value;
    const districtSelect = document.getElementById('addrDistrict');
    const wardSelect = document.getElementById('addrWard');
    districtSelect.innerHTML = '<option value="">Chọn quận/huyện</option>';
    wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
    districtSelect.disabled = true;
    wardSelect.disabled = true;
    if (code) loadDistricts(code);
  });

  // District change -> load wards
  document.getElementById('addrDistrict').addEventListener('change', function () {
    const code = this.value;
    const wardSelect = document.getElementById('addrWard');
    wardSelect.innerHTML = '<option value="">Chọn phường/xã</option>';
    wardSelect.disabled = true;
    if (code) loadWards(code);
  });
});

// ====== LOAD SIDEBAR INFO ======
async function loadSidebar() {
  try {
    const res = await apiCall('/auth/profile');
    const user = res.user || res;
    document.getElementById('sidebarName').textContent = user.fullName || '---';
    if (user.points !== undefined) {
      document.getElementById('sidebarPoints').textContent = user.points + ' Pts';
    }
  } catch (e) { /* ignore */ }
}

// ====== LOAD ADDRESSES ======
async function loadAddresses() {
  try {
    const res = await apiCall('/auth/addresses');
    addresses = res.data || [];
    renderAddresses();
  } catch (error) {
    document.getElementById('addressList').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-exclamation-circle"></i>
        <h5>Không thể tải danh sách địa chỉ</h5>
        <p>${error.message}</p>
      </div>`;
  }
}

// ====== RENDER ADDRESSES ======
function renderAddresses() {
  const container = document.getElementById('addressList');

  if (!addresses.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="bi bi-geo-alt"></i>
        <h5>Chưa có địa chỉ nào</h5>
        <p>Thêm địa chỉ giao hàng để đặt hàng nhanh hơn</p>
      </div>`;
    return;
  }

  // Sắp xếp: mặc định lên đầu
  const sorted = [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));

  container.innerHTML = sorted.map(addr => `
    <div class="address-card ${addr.isDefault ? 'default' : ''}">
      <div class="address-header">
        <div>
          <span class="address-name">${addr.fullName}</span>
          ${addr.isDefault ? '<span class="address-badge">Mặc định</span>' : ''}
        </div>
      </div>
      <div class="address-phone"><i class="bi bi-telephone me-1"></i> ${addr.phone}</div>
      <div class="address-detail">
        <i class="bi bi-geo-alt me-1"></i>
        ${addr.detail ? addr.detail + ', ' : ''}${addr.ward}, ${addr.district}, ${addr.province}
      </div>
      <div class="address-actions">
        <button class="btn-sm" onclick="openEditModal('${addr._id}')"><i class="bi bi-pencil"></i> Sửa</button>
        <button class="btn-sm btn-delete" onclick="deleteAddress('${addr._id}')"><i class="bi bi-trash"></i> Xóa</button>
        ${!addr.isDefault ? `<button class="btn-sm" onclick="setDefault('${addr._id}')"><i class="bi bi-check-circle"></i> Đặt làm mặc định</button>` : ''}
      </div>
    </div>
  `).join('');
}

// ====== PROVINCES API ======
async function loadProvinces() {
  try {
    const res = await fetch('https://provinces.open-api.vn/api/p/');
    provinceData = await res.json();
    const select = document.getElementById('addrProvince');
    provinceData.forEach(p => {
      select.innerHTML += `<option value="${p.code}" data-name="${p.name}">${p.name}</option>`;
    });
  } catch (e) {
    console.error('Không thể tải danh sách tỉnh thành:', e);
  }
}

async function loadDistricts(provinceCode) {
  try {
    const res = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
    const data = await res.json();
    const select = document.getElementById('addrDistrict');
    select.disabled = false;
    (data.districts || []).forEach(d => {
      select.innerHTML += `<option value="${d.code}" data-name="${d.name}">${d.name}</option>`;
    });
  } catch (e) {
    console.error('Không thể tải danh sách quận/huyện:', e);
  }
}

async function loadWards(districtCode) {
  try {
    const res = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
    const data = await res.json();
    const select = document.getElementById('addrWard');
    select.disabled = false;
    (data.wards || []).forEach(w => {
      select.innerHTML += `<option value="${w.code}" data-name="${w.name}">${w.name}</option>`;
    });
  } catch (e) {
    console.error('Không thể tải danh sách phường/xã:', e);
  }
}

// ====== MODAL ======
function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Thêm địa chỉ mới';
  document.getElementById('addressForm').reset();
  document.getElementById('addressId').value = '';
  document.getElementById('addrDistrict').innerHTML = '<option value="">Chọn quận/huyện</option>';
  document.getElementById('addrDistrict').disabled = true;
  document.getElementById('addrWard').innerHTML = '<option value="">Chọn phường/xã</option>';
  document.getElementById('addrWard').disabled = true;
  addressModal.show();
}

function openEditModal(id) {
  const addr = addresses.find(a => a._id === id);
  if (!addr) return;

  document.getElementById('modalTitle').textContent = 'Sửa địa chỉ';
  document.getElementById('addressId').value = id;
  document.getElementById('addrFullName').value = addr.fullName;
  document.getElementById('addrPhone').value = addr.phone;
  document.getElementById('addrDetail').value = addr.detail || '';
  document.getElementById('addrDefault').checked = addr.isDefault;

  // Set province by name matching
  const provinceSelect = document.getElementById('addrProvince');
  const provinceOption = Array.from(provinceSelect.options).find(o => o.dataset.name === addr.province);
  if (provinceOption) {
    provinceSelect.value = provinceOption.value;
    // Load districts then set district
    loadDistricts(provinceOption.value).then(() => {
      const districtSelect = document.getElementById('addrDistrict');
      const districtOption = Array.from(districtSelect.options).find(o => o.dataset.name === addr.district);
      if (districtOption) {
        districtSelect.value = districtOption.value;
        // Load wards then set ward
        loadWards(districtOption.value).then(() => {
          const wardSelect = document.getElementById('addrWard');
          const wardOption = Array.from(wardSelect.options).find(o => o.dataset.name === addr.ward);
          if (wardOption) wardSelect.value = wardOption.value;
        });
      }
    });
  }

  addressModal.show();
}

// ====== SAVE ADDRESS ======
async function saveAddress(e) {
  e.preventDefault();

  const id = document.getElementById('addressId').value;
  const provinceSelect = document.getElementById('addrProvince');
  const districtSelect = document.getElementById('addrDistrict');
  const wardSelect = document.getElementById('addrWard');

  const body = {
    fullName: document.getElementById('addrFullName').value.trim(),
    phone: document.getElementById('addrPhone').value.trim(),
    province: provinceSelect.options[provinceSelect.selectedIndex].dataset.name,
    district: districtSelect.options[districtSelect.selectedIndex].dataset.name,
    ward: wardSelect.options[wardSelect.selectedIndex].dataset.name,
    detail: document.getElementById('addrDetail').value.trim(),
    isDefault: document.getElementById('addrDefault').checked
  };

  if (!body.fullName || !body.phone || !body.province || !body.district || !body.ward) {
    showToast('Vui lòng nhập đầy đủ thông tin', 'error');
    return;
  }

  try {
    const url = id ? `/auth/addresses/${id}` : '/auth/addresses';
    const method = id ? 'PUT' : 'POST';

    const res = await apiCall(url, {
      method,
      body: JSON.stringify(body)
    });

    addresses = res.data || [];
    renderAddresses();
    addressModal.hide();
    showToast(id ? 'Cập nhật địa chỉ thành công!' : 'Thêm địa chỉ thành công!');
  } catch (error) {
    showToast(error.message || 'Lưu địa chỉ thất bại', 'error');
  }
}

// ====== DELETE ADDRESS ======
async function deleteAddress(id) {
  if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;

  try {
    const res = await apiCall(`/auth/addresses/${id}`, { method: 'DELETE' });
    addresses = res.data || [];
    renderAddresses();
    showToast('Xóa địa chỉ thành công!');
  } catch (error) {
    showToast(error.message || 'Xóa địa chỉ thất bại', 'error');
  }
}

// ====== SET DEFAULT ======
async function setDefault(id) {
  try {
    const res = await apiCall(`/auth/addresses/${id}/default`, { method: 'PUT' });
    addresses = res.data || [];
    renderAddresses();
    showToast('Đặt địa chỉ mặc định thành công!');
  } catch (error) {
    showToast(error.message || 'Thao tác thất bại', 'error');
  }
}

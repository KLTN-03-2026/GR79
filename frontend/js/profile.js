// ====== PROFILE PAGE ======

let isEditing = false;
let originalData = {};

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }
  updateHeaderAuth();
  loadProfile();
});

// ====== LOAD PROFILE ======
async function loadProfile() {
  try {
    const res = await apiCall('/auth/profile');
    const user = res.user || res;

    // Fill sidebar
    document.getElementById('sidebarName').textContent = user.fullName || '---';

    // Fill form
    document.getElementById('fullName').value = user.fullName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';

    if (user.dateOfBirth) {
      const date = new Date(user.dateOfBirth);
      document.getElementById('dateOfBirth').value = date.toISOString().split('T')[0];
    }

    // Gender
    if (user.gender) {
      const radio = document.querySelector(`input[name="gender"][value="${user.gender}"]`);
      if (radio) radio.checked = true;
    }

    // Save original data for cancel
    originalData = {
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      gender: user.gender || ''
    };

    // Update sidebar stats
    if (user.points !== undefined) {
      document.getElementById('sidebarPoints').textContent = user.points + ' Pts';
    }
    if (user.voucherCount !== undefined) {
      document.getElementById('sidebarVouchers').textContent = user.voucherCount + ' mã giảm giá';
    }

  } catch (error) {
    showToast(error.message || 'Không thể tải thông tin hồ sơ', 'error');
  }
}

// ====== TOGGLE EDIT MODE ======
function toggleEdit() {
  isEditing = !isEditing;
  const fields = ['fullName', 'phone', 'address', 'dateOfBirth'];
  const radios = document.querySelectorAll('input[name="gender"]');
  const formActions = document.getElementById('formActions');
  const btnEdit = document.getElementById('btnEditProfile');

  if (isEditing) {
    fields.forEach(id => document.getElementById(id).disabled = false);
    radios.forEach(r => r.disabled = false);
    formActions.classList.remove('d-none');
    btnEdit.innerHTML = '<i class="bi bi-x-lg"></i> Hủy chỉnh sửa';
    btnEdit.onclick = cancelEdit;
  } else {
    cancelEdit();
  }
}

// ====== CANCEL EDIT ======
function cancelEdit() {
  isEditing = false;
  const fields = ['fullName', 'phone', 'address', 'dateOfBirth'];
  const radios = document.querySelectorAll('input[name="gender"]');
  const formActions = document.getElementById('formActions');
  const btnEdit = document.getElementById('btnEditProfile');

  // Restore original data
  document.getElementById('fullName').value = originalData.fullName;
  document.getElementById('phone').value = originalData.phone;
  document.getElementById('address').value = originalData.address;
  document.getElementById('dateOfBirth').value = originalData.dateOfBirth;

  if (originalData.gender) {
    const radio = document.querySelector(`input[name="gender"][value="${originalData.gender}"]`);
    if (radio) radio.checked = true;
  } else {
    radios.forEach(r => r.checked = false);
  }

  // Disable fields
  fields.forEach(id => document.getElementById(id).disabled = true);
  radios.forEach(r => r.disabled = true);
  formActions.classList.add('d-none');
  btnEdit.innerHTML = '<i class="bi bi-pencil-square"></i> Chỉnh sửa hồ sơ';
  btnEdit.onclick = toggleEdit;
}

// ====== SAVE PROFILE ======
async function saveProfile(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const address = document.getElementById('address').value.trim();
  const dateOfBirth = document.getElementById('dateOfBirth').value;
  const genderRadio = document.querySelector('input[name="gender"]:checked');
  const gender = genderRadio ? genderRadio.value : '';

  if (!fullName) {
    showToast('Vui lòng nhập họ và tên', 'error');
    return;
  }

  try {
    const res = await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName, phone, gender, dateOfBirth, address })
    });

    showToast('Cập nhật hồ sơ thành công!');

    // Update local storage
    const user = getUser();
    if (user) {
      user.fullName = fullName;
      localStorage.setItem('user', JSON.stringify(user));
      updateHeaderAuth();
    }

    // Update sidebar name
    document.getElementById('sidebarName').textContent = fullName;

    // Update original data
    originalData = { ...originalData, fullName, phone, gender, dateOfBirth, address };

    // Exit edit mode
    cancelEdit();

  } catch (error) {
    showToast(error.message || 'Cập nhật thất bại', 'error');
  }
}

// ====== CHANGE PASSWORD ======
async function changePassword(e) {
  e.preventDefault();

  const currentPassword = document.getElementById('currentPassword').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  if (newPassword.length < 6) {
    showToast('Mật khẩu mới phải có ít nhất 6 ký tự', 'error');
    return;
  }

  if (newPassword !== confirmPassword) {
    showToast('Mật khẩu xác nhận không khớp', 'error');
    return;
  }

  try {
    await apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });

    showToast('Đổi mật khẩu thành công!');

    // Close modal and reset form
    const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
    modal.hide();
    document.getElementById('changePasswordForm').reset();

  } catch (error) {
    showToast(error.message || 'Đổi mật khẩu thất bại', 'error');
  }
}

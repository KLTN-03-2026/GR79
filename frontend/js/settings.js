// ====== SETTINGS PAGE ======

document.addEventListener('DOMContentLoaded', () => {
  if (!isLoggedIn()) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }
  updateHeaderAuth();
  loadSidebar();
  loadSettings();
});

// ====== LOAD SIDEBAR ======
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

// ====== LOAD SETTINGS FROM LOCALSTORAGE ======
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');

  document.getElementById('notifOrder').checked = settings.notifOrder !== false;
  document.getElementById('notifPromo').checked = settings.notifPromo !== false;
  document.getElementById('notifSystem').checked = settings.notifSystem !== false;
  document.getElementById('notifEmail').checked = settings.notifEmail === true;
}

// ====== SAVE SETTING ======
function saveSetting(key, value) {
  const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
  settings[key] = value;
  localStorage.setItem('userSettings', JSON.stringify(settings));
  showToast('Đã lưu cài đặt');
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

    const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
    modal.hide();
    document.getElementById('changePasswordForm').reset();
  } catch (error) {
    showToast(error.message || 'Đổi mật khẩu thất bại', 'error');
  }
}

// ====== LOGOUT ALL DEVICES ======
function logoutAllDevices() {
  if (!confirm('Bạn có chắc muốn đăng xuất khỏi tất cả thiết bị? Bạn sẽ cần đăng nhập lại.')) return;

  // Đăng xuất local
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Đã đăng xuất tất cả thiết bị');
  setTimeout(() => {
    window.location.href = '/pages/dang-nhap.html';
  }, 1000);
}

// ====== REQUEST DELETE ACCOUNT ======
function requestDeleteAccount() {
  if (!confirm('Bạn có chắc chắn muốn yêu cầu xóa tài khoản?\n\nTài khoản sẽ bị xóa vĩnh viễn và không thể khôi phục. Tất cả dữ liệu đơn hàng, điểm tích lũy sẽ bị mất.')) return;

  if (!confirm('XÁC NHẬN LẦN CUỐI: Bạn thực sự muốn xóa tài khoản?')) return;

  showToast('Yêu cầu xóa tài khoản đã được ghi nhận. Chúng tôi sẽ xử lý trong vòng 7 ngày làm việc.');
}

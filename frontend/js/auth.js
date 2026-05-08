// ====== REGISTER ======
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  // Password strength checker
  const passwordInput = document.getElementById('password');
  const strengthText = document.getElementById('passwordStrength');

  if (passwordInput && strengthText) {
    passwordInput.addEventListener('input', function () {
      const val = this.value;
      const hasUpper = /[A-Z]/.test(val);
      const hasNumber = /[0-9]/.test(val);
      const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(val);
      const longEnough = val.length >= 8;

      if (val.length === 0) {
        strengthText.textContent = 'Yêu cầu: 8+ ký tự, có chữ HOA, số, ký tự đặc biệt';
        strengthText.style.color = 'var(--text-light)';
      } else if (!longEnough) {
        strengthText.textContent = 'Độ bảo mật: Yếu (cần đủ 8 ký tự)';
        strengthText.style.color = 'var(--danger)';
      } else if (!hasUpper || !hasNumber || !hasSpecial) {
        const missing = [];
        if (!hasUpper) missing.push('chữ HOA');
        if (!hasNumber) missing.push('số');
        if (!hasSpecial) missing.push('ký tự đặc biệt');
        strengthText.textContent = 'Độ bảo mật: Trung bình (thiếu: ' + missing.join(', ') + ')';
        strengthText.style.color = 'var(--warning)';
      } else {
        strengthText.textContent = 'Độ bảo mật: Mạnh ✓';
        strengthText.style.color = 'var(--success)';
      }
    });
  }

  registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const agreeTerms = document.getElementById('agreeTerms').checked;

    if (!agreeTerms) {
      showToast('Vui lòng đồng ý với điều khoản dịch vụ', 'error');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Mật khẩu xác nhận không khớp', 'error');
      return;
    }

    // Validate mật khẩu mạnh
    if (password.length < 8) {
      showToast('Mật khẩu phải có ít nhất 8 ký tự', 'error');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      showToast('Mật khẩu phải có ít nhất 1 chữ in hoa', 'error');
      return;
    }
    if (!/[0-9]/.test(password)) {
      showToast('Mật khẩu phải có ít nhất 1 chữ số', 'error');
      return;
    }
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) {
      showToast('Mật khẩu phải có ít nhất 1 ký tự đặc biệt (!@#$%^&*...)', 'error');
      return;
    }

    // Validate số điện thoại
    const phoneDigits = phone.replace(/\D/g, '');
    if (!/^0\d{9,10}$/.test(phoneDigits)) {
      showToast('Số điện thoại phải có 10-11 chữ số và bắt đầu bằng 0', 'error');
      return;
    }

    const submitBtn = this.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner-border spinner-border-sm"></div> Đang xử lý...';

    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ fullName, email, phone, password })
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showToast('Đăng ký thành công!');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      showToast(error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Đăng ký ngay <i class="bi bi-arrow-right"></i>';
    }
  });
}

// ====== LOGIN ======
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Hide error message khi user submit lại
    const errorBox = document.getElementById('loginError');
    const errorText = document.getElementById('loginErrorText');
    if (errorBox) errorBox.style.display = 'none';

    const submitBtn = this.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner-border spinner-border-sm"></div> Đang xử lý...';

    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      showToast('Đăng nhập thành công!');
      setTimeout(() => {
        const user = data.user;
        if (user.role === 'admin' || user.role === 'staff') {
          window.location.href = '/pages/admin/dashboard.html';
        } else {
          window.location.href = '/';
        }
      }, 1000);
    } catch (error) {
      const msg = error.message || 'Email hoặc mật khẩu không đúng';
      // Hiện cả inline + toast để user chắc chắn thấy
      if (errorBox && errorText) {
        errorText.textContent = msg;
        errorBox.style.display = 'block';
      }
      showToast(msg, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Đăng nhập ngay <i class="bi bi-arrow-right"></i>';
    }
  });
}

// Redirect if already logged in
if (isLoggedIn() && (registerForm || loginForm)) {
  window.location.href = '/';
}

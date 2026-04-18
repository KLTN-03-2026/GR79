// ====== REGISTER ======
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  // Password strength checker
  const passwordInput = document.getElementById('password');
  const strengthText = document.getElementById('passwordStrength');

  if (passwordInput && strengthText) {
    passwordInput.addEventListener('input', function () {
      const val = this.value;
      if (val.length === 0) {
        strengthText.textContent = 'Độ bảo mật: Chưa nhập';
        strengthText.style.color = 'var(--text-light)';
      } else if (val.length < 6) {
        strengthText.textContent = 'Độ bảo mật: Yếu';
        strengthText.style.color = 'var(--danger)';
      } else if (val.length < 10 || !/[A-Z]/.test(val) || !/[0-9]/.test(val)) {
        strengthText.textContent = 'Độ bảo mật: Trung bình';
        strengthText.style.color = 'var(--warning)';
      } else {
        strengthText.textContent = 'Độ bảo mật: Mạnh';
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

    if (password.length < 6) {
      showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
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
        if (user.role === 'admin') {
          window.location.href = '/pages/admin/dashboard.html';
        } else {
          window.location.href = '/';
        }
      }, 1000);
    } catch (error) {
      showToast(error.message, 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Đăng nhập ngay <i class="bi bi-arrow-right"></i>';
    }
  });
}

// Redirect if already logged in
if (isLoggedIn() && (registerForm || loginForm)) {
  window.location.href = '/';
}

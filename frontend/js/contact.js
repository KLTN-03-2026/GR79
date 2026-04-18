// ===== CONTACT PAGE =====

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('ctSubmitBtn');

  if (typeof updateHeaderAuth === 'function') updateHeaderAuth();

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('ctName').value.trim();
      const email = document.getElementById('ctEmail').value.trim();
      const phone = document.getElementById('ctPhone').value.trim();
      const subject = document.getElementById('ctSubject').value;
      const message = document.getElementById('ctMessage').value.trim();

      if (!name || !email || !subject || !message) {
        showToast('Vui lòng điền đầy đủ các trường bắt buộc', 'warning');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showToast('Email không hợp lệ', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Đang gửi...';

      try {
        await apiCall('/contacts', {
          method: 'POST',
          body: JSON.stringify({ fullName: name, email, phone, subject, message })
        });

        showToast('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất.', 'success');
        form.reset();
      } catch (err) {
        showToast(err.message || 'Gửi tin nhắn thất bại, vui lòng thử lại', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-send"></i> Gửi tin nhắn';
      }
    });
  }
});

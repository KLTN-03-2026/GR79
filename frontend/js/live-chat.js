// ====== Live Chat Widget - Chat voi nhan vien ======
(function () {
  let isOpen = false;
  let socket = null;
  let conversationId = null;
  let currentUserId = null;
  let isConnected = false;
  let typingTimeout = null;

  function getToken() {
    return localStorage.getItem('token');
  }

  function getUser() {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) { return null; }
  }

  function isLoggedIn() {
    return !!getToken() && !!getUser();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function formatTime(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return time;
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + ' ' + time;
  }

  function createWidget() {
    // Khong hien cho trang admin
    if (window.location.pathname.includes('/admin/')) return;

    const widget = document.createElement('div');
    widget.id = 'sachhub-livechat';
    widget.innerHTML = `
      <button class="livechat-toggle" id="livechatToggle" title="Tư Vấn Trực Tuyến">
        <i class="bi bi-headset"></i>
        <span class="livechat-badge" id="livechatBadge" style="display:none;">0</span>
      </button>
      <div class="livechat-window" id="livechatWindow">
        <div class="livechat-header">
          <div class="livechat-header-info">
            <div class="livechat-avatar"><i class="bi bi-headset"></i></div>
            <div>
              <div class="livechat-name">Tư Vấn Trực Tuyến</div>
              <div class="livechat-status"><span class="livechat-status-dot"></span>Đang hoạt động</div>
            </div>
          </div>
          <button class="livechat-close" id="livechatClose"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="livechat-body" id="livechatBody">
          <div class="livechat-welcome">
            <i class="bi bi-chat-heart"></i>
            <h4>Xin chao!</h4>
            <p>Dang ket noi...</p>
          </div>
        </div>
        <div class="livechat-footer">
          <div class="livechat-input-wrapper">
            <input type="text" class="livechat-input" id="livechatInput" placeholder="Nhập tin nhắn..." autocomplete="off" disabled>
            <button class="livechat-send" id="livechatSend" disabled><i class="bi bi-send-fill"></i></button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    document.getElementById('livechatToggle').addEventListener('click', toggleChat);
    document.getElementById('livechatClose').addEventListener('click', toggleChat);
    document.getElementById('livechatSend').addEventListener('click', handleSend);
    document.getElementById('livechatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    // Typing indicator
    document.getElementById('livechatInput').addEventListener('input', () => {
      if (socket && conversationId) {
        socket.emit('typing', { conversationId, senderRole: 'user' });
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          socket.emit('stop-typing', { conversationId, senderRole: 'user' });
        }, 1500);
      }
    });
  }

  function toggleChat() {
    isOpen = !isOpen;
    const win = document.getElementById('livechatWindow');
    const btn = document.getElementById('livechatToggle');
    win.classList.toggle('open', isOpen);
    btn.classList.toggle('active', isOpen);

    if (isOpen) {
      document.getElementById('livechatBadge').style.display = 'none';
      if (!isLoggedIn()) {
        showLoginRequired();
        return;
      }
      if (!conversationId) {
        loadConversation();
      } else {
        markRead();
        setTimeout(() => document.getElementById('livechatInput').focus(), 300);
      }
      scrollToBottom();
    }
  }

  function showLoginRequired() {
    const body = document.getElementById('livechatBody');
    body.innerHTML = `
      <div class="livechat-login">
        <i class="bi bi-person-lock"></i>
        <h4>Vui lòng đăng nhập</h4>
        <p>Bạn cần đăng nhập để chat với nhân viên hỗ trợ.</p>
        <a href="/pages/dang-nhap.html" class="livechat-login-btn">Đăng nhập ngay</a>
      </div>
    `;
    document.getElementById('livechatInput').disabled = true;
    document.getElementById('livechatSend').disabled = true;
  }

  async function loadConversation() {
    const body = document.getElementById('livechatBody');
    body.innerHTML = `
      <div class="livechat-welcome">
        <i class="bi bi-chat-heart"></i>
        <h4>Xin chao!</h4>
        <p>Dang ket noi...</p>
      </div>
    `;

    try {
      const token = getToken();
      const user = getUser();
      currentUserId = user._id || user.id;

      const apiUrl = (typeof API_URL !== 'undefined') ? API_URL : 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/conversations/mine`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!data.success) throw new Error(data.message);

      conversationId = data.data._id;
      const messages = data.data.messages || [];

      body.innerHTML = '';

      if (messages.length === 0) {
        body.innerHTML = `
          <div class="livechat-welcome">
            <i class="bi bi-chat-heart"></i>
            <h4>Xin chào!</h4>
            <p>Hãy gửi tin nhắn để bắt đầu trò chuyện với nhân viên hỗ trợ của chúng tôi.</p>
          </div>
        `;
      } else {
        messages.forEach(msg => renderMessage(msg));
        scrollToBottom();
      }

      // Enable input
      document.getElementById('livechatInput').disabled = false;
      document.getElementById('livechatSend').disabled = false;
      setTimeout(() => document.getElementById('livechatInput').focus(), 300);

      // Connect socket
      connectSocket();
      markRead();
    } catch (error) {
      body.innerHTML = `
        <div class="livechat-welcome">
          <i class="bi bi-exclamation-triangle"></i>
          <h4>Loi ket noi</h4>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;
    }
  }

  function connectSocket() {
    if (socket) return;

    const token = getToken();
    if (!token) return;

    socket = io(window.location.origin, {
      auth: { token }
    });

    socket.on('connect', () => {
      isConnected = true;
      if (conversationId) {
        socket.emit('join-conversation', conversationId);
      }
    });

    socket.on('new-message', (data) => {
      if (data.conversationId === conversationId && data.message) {
        // Khong render lai tin nhan cua chinh minh (da render khi gui)
        if (data.message.sender && (data.message.sender._id || data.message.sender) !== currentUserId) {
          renderMessage(data.message);
          scrollToBottom();

          if (!isOpen) {
            const badge = document.getElementById('livechatBadge');
            const current = parseInt(badge.textContent) || 0;
            badge.textContent = current + 1;
            badge.style.display = 'flex';
          } else {
            markRead();
          }
        }
      }
    });

    socket.on('user-typing', (data) => {
      if (data.conversationId === conversationId && data.senderRole !== 'user') {
        showTypingIndicator();
      }
    });

    socket.on('user-stop-typing', (data) => {
      if (data.conversationId === conversationId) {
        hideTypingIndicator();
      }
    });

    socket.on('disconnect', () => {
      isConnected = false;
    });
  }

  function renderMessage(msg) {
    const body = document.getElementById('livechatBody');
    // Xoa welcome message neu con
    const welcome = body.querySelector('.livechat-welcome');
    if (welcome) welcome.remove();

    const isUser = msg.senderRole === 'user';
    const roleClass = isUser ? 'user' : 'staff';
    const icon = isUser ? 'bi-person' : 'bi-headset';
    const senderName = msg.sender && msg.sender.fullName ? msg.sender.fullName : '';

    const div = document.createElement('div');
    div.className = `livechat-msg ${roleClass}`;
    div.innerHTML = `
      <div class="livechat-msg-avatar"><i class="bi ${icon}"></i></div>
      <div>
        <div class="livechat-msg-bubble">${escapeHtml(msg.content)}</div>
        <div class="livechat-msg-time">${msg.createdAt ? formatTime(msg.createdAt) : ''}</div>
      </div>
    `;
    body.appendChild(div);
  }

  function showTypingIndicator() {
    if (document.getElementById('livechatTyping')) return;
    const body = document.getElementById('livechatBody');
    const div = document.createElement('div');
    div.className = 'livechat-typing';
    div.id = 'livechatTyping';
    div.innerHTML = `
      <div class="livechat-msg-avatar"><i class="bi bi-headset"></i></div>
      <div class="livechat-typing-dots"><span></span><span></span><span></span></div>
    `;
    body.appendChild(div);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const el = document.getElementById('livechatTyping');
    if (el) el.remove();
  }

  async function handleSend() {
    const input = document.getElementById('livechatInput');
    const text = input.value.trim();
    if (!text || !conversationId) return;

    input.value = '';

    // Render tin nhan ngay lap tuc
    const tempMsg = {
      sender: { _id: currentUserId },
      senderRole: 'user',
      content: text,
      createdAt: new Date().toISOString()
    };
    renderMessage(tempMsg);
    scrollToBottom();

    try {
      const token = getToken();
      const apiUrl = (typeof API_URL !== 'undefined') ? API_URL : 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: text })
      });
      const data = await res.json();

      if (data.success && socket) {
        socket.emit('send-message', {
          conversationId,
          message: data.data,
          senderRole: 'user'
        });
      }
    } catch (error) {
      console.error('Loi gui tin nhan:', error);
    }
  }

  async function markRead() {
    if (!conversationId) return;
    try {
      const token = getToken();
      const apiUrl = (typeof API_URL !== 'undefined') ? API_URL : 'http://localhost:5000/api';
      await fetch(`${apiUrl}/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { }
  }

  function scrollToBottom() {
    const body = document.getElementById('livechatBody');
    if (body) setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();

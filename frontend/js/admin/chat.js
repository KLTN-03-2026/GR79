// ====== Admin Chat Management ======
let socket = null;
let conversations = [];
let activeConversationId = null;
let currentUser = null;
let typingTimeout = null;

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  currentUser = getUser();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'staff')) {
    window.location.href = '/pages/dang-nhap.html';
    return;
  }

  // Kiểm tra token còn hợp lệ không
  const valid = await verifyAdminToken();
  if (!valid) return;

  // Avatar
  const avatarEl = document.getElementById('avatarUser');
  if (avatarEl && currentUser.fullName) {
    avatarEl.textContent = currentUser.fullName.charAt(0).toUpperCase();
  }

  // Hide admin-only menus for staff
  if (currentUser.role === 'staff') {
    document.querySelectorAll('[data-role="admin"]').forEach(el => {
      el.style.display = 'none';
    });
  }

  loadConversations();
  connectSocket();

  // Tim kiem
  document.getElementById('chatSearchInput').addEventListener('input', (e) => {
    filterConversations(e.target.value.trim().toLowerCase());
  });
});

// ====== LOAD CONVERSATIONS ======
async function loadConversations() {
  try {
    const data = await apiCall('/conversations');
    conversations = data.data || [];
    renderConversationList(conversations);
  } catch (error) {
    document.getElementById('chatList').innerHTML = `
      <div style="text-align:center; padding:40px; color:#EF4444;">
        <i class="bi bi-exclamation-triangle" style="font-size:32px;display:block;margin-bottom:8px;"></i>
        Lỗi tải dữ liệu
      </div>
    `;
  }
}

// ====== RENDER CONVERSATION LIST ======
function renderConversationList(list) {
  const container = document.getElementById('chatList');

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding:40px; color:#9CA3AF;">
        <i class="bi bi-chat-dots" style="font-size:32px;display:block;margin-bottom:8px;"></i>
        Chưa có cuộc hội thoại nào
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(conv => {
    const customer = conv.customer || {};
    const name = customer.fullName || 'Khách hàng';
    const initial = name.charAt(0).toUpperCase();
    const preview = conv.lastMessage || 'Chưa có tin nhắn';
    const time = conv.lastMessageAt ? formatTimeShort(conv.lastMessageAt) : '';
    const unread = conv.unreadByAdmin || 0;
    const isActive = conv._id === activeConversationId;

    return `
      <div class="chat-item ${isActive ? 'active' : ''}" onclick="selectConversation('${conv._id}')" data-id="${conv._id}" data-name="${name.toLowerCase()}">
        <div class="chat-item-avatar">${initial}</div>
        <div class="chat-item-info">
          <div class="chat-item-name">
            <span>${escapeHtml(name)}</span>
            <span class="chat-item-time">${time}</span>
          </div>
          <div class="chat-item-preview">${escapeHtml(preview)}</div>
        </div>
        ${unread > 0 ? `<div class="chat-item-unread">${unread}</div>` : ''}
      </div>
    `;
  }).join('');
}

// ====== FILTER ======
function filterConversations(query) {
  if (!query) {
    renderConversationList(conversations);
    return;
  }
  const filtered = conversations.filter(c => {
    const name = (c.customer && c.customer.fullName) || '';
    return name.toLowerCase().includes(query);
  });
  renderConversationList(filtered);
}

// ====== SELECT CONVERSATION ======
async function selectConversation(convId) {
  activeConversationId = convId;

  // Highlight trong list
  document.querySelectorAll('.chat-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === convId);
  });

  // Remove unread badge
  const activeItem = document.querySelector(`.chat-item[data-id="${convId}"]`);
  if (activeItem) {
    const badge = activeItem.querySelector('.chat-item-unread');
    if (badge) badge.remove();
  }

  // Mobile: show chat
  document.getElementById('chatLayout').classList.add('show-chat');

  try {
    const data = await apiCall(`/conversations/${convId}`);
    const conv = data.data;
    renderChatMain(conv);

    // Join socket room
    if (socket) {
      socket.emit('join-conversation', convId);
    }

    // Mark as read
    markAsRead(convId);

    // Update local data
    const idx = conversations.findIndex(c => c._id === convId);
    if (idx !== -1) conversations[idx].unreadByAdmin = 0;
  } catch (error) {
    console.error('Lỗi tải conversation:', error);
  }
}

// ====== RENDER CHAT MAIN ======
function renderChatMain(conv) {
  const mainEl = document.getElementById('chatMain');
  const customer = conv.customer || {};
  const name = customer.fullName || 'Khách hàng';
  const email = customer.email || '';
  const initial = name.charAt(0).toUpperCase();
  const messages = conv.messages || [];

  mainEl.innerHTML = `
    <div class="chat-main-header">
      <div class="chat-main-header-info">
        <button class="btn-icon d-md-none" onclick="document.getElementById('chatLayout').classList.remove('show-chat')">
          <i class="bi bi-arrow-left"></i>
        </button>
        <div class="chat-main-header-avatar">${initial}</div>
        <div>
          <div class="chat-main-header-name">${escapeHtml(name)}</div>
          <div class="chat-main-header-email">${escapeHtml(email)}</div>
        </div>
      </div>
      <div>
        <span class="badge ${conv.status === 'active' ? 'bg-success' : 'bg-secondary'}">${conv.status === 'active' ? 'Đang hoạt động' : 'Đã đóng'}</span>
      </div>
    </div>
    <div class="chat-messages" id="chatMessages">
      ${messages.length === 0 ? `
        <div style="text-align:center; padding:40px; color:#9CA3AF;">
          <i class="bi bi-chat-dots" style="font-size:32px;display:block;margin-bottom:8px;"></i>
          Chưa có tin nhắn
        </div>
      ` : messages.map(msg => renderMessageHTML(msg)).join('')}
    </div>
    <div class="chat-input-area">
      <input type="text" id="adminChatInput" placeholder="Nhập tin nhắn trả lời..." autocomplete="off">
      <button onclick="sendAdminMessage()" id="adminSendBtn"><i class="bi bi-send-fill"></i></button>
    </div>
  `;

  // Event listeners
  const input = document.getElementById('adminChatInput');
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAdminMessage();
  });
  input.addEventListener('input', () => {
    if (socket && activeConversationId) {
      socket.emit('typing', { conversationId: activeConversationId, senderRole: currentUser.role });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('stop-typing', { conversationId: activeConversationId });
      }, 1500);
    }
  });
  input.focus();

  scrollMessagesToBottom();
}

// ====== RENDER MESSAGE HTML ======
function renderMessageHTML(msg) {
  const isCustomer = msg.senderRole === 'user';
  const roleClass = isCustomer ? 'customer' : 'admin';
  const sender = msg.sender || {};
  const name = sender.fullName || (isCustomer ? 'Khách hàng' : 'Nhân viên');
  const initial = name.charAt(0).toUpperCase();
  const time = msg.createdAt ? formatTimeFull(msg.createdAt) : '';

  return `
    <div class="chat-msg ${roleClass}">
      <div class="chat-msg-avatar">${initial}</div>
      <div>
        <div class="chat-msg-content">${escapeHtml(msg.content)}</div>
        <div class="chat-msg-time">${time}</div>
      </div>
    </div>
  `;
}

// ====== SEND MESSAGE ======
async function sendAdminMessage() {
  const input = document.getElementById('adminChatInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !activeConversationId) return;

  input.value = '';

  // Render ngay
  const tempMsg = {
    sender: { fullName: currentUser.fullName, _id: currentUser._id || currentUser.id },
    senderRole: currentUser.role,
    content: text,
    createdAt: new Date().toISOString()
  };
  appendMessage(tempMsg);

  try {
    const data = await apiCall(`/conversations/${activeConversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content: text })
    });

    if (data.success && socket) {
      socket.emit('send-message', {
        conversationId: activeConversationId,
        message: data.data,
        senderRole: currentUser.role
      });
    }

    // Cap nhat preview trong list
    updateConversationPreview(activeConversationId, text);
  } catch (error) {
    console.error('Lỗi gửi tin nhắn:', error);
  }
}

function appendMessage(msg) {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  // Xoa empty state
  const empty = container.querySelector('[style*="text-align:center"]');
  if (empty) empty.remove();

  const div = document.createElement('div');
  div.innerHTML = renderMessageHTML(msg);
  container.appendChild(div.firstElementChild);
  scrollMessagesToBottom();
}

// ====== SOCKET.IO ======
function connectSocket() {
  const token = getToken();
  if (!token) return;

  socket = io(window.location.origin, {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('Admin socket connected');
    // Join tat ca conversation rooms
    conversations.forEach(c => {
      socket.emit('join-conversation', c._id);
    });
  });

  socket.on('new-message', (data) => {
    // Cap nhat danh sach conversations
    updateConversationPreview(data.conversationId, data.message?.content || '');

    // Neu dang xem conversation nay -> render message
    if (data.conversationId === activeConversationId && data.message) {
      const senderId = data.message.sender?._id || data.message.sender;
      const myId = currentUser._id || currentUser.id;
      if (senderId !== myId) {
        appendMessage(data.message);
        markAsRead(activeConversationId);
        hideTyping();
      }
    }
  });

  socket.on('conversation-updated', (data) => {
    // Reload list khi co conversation moi/cap nhat
    loadConversations();
  });

  socket.on('user-typing', (data) => {
    if (data.conversationId === activeConversationId && data.senderRole === 'user') {
      showTyping();
    }
  });

  socket.on('user-stop-typing', (data) => {
    if (data.conversationId === activeConversationId) {
      hideTyping();
    }
  });

  socket.on('disconnect', () => {
    console.log('Admin socket disconnected');
  });
}

function showTyping() {
  if (document.getElementById('adminTypingIndicator')) return;
  const container = document.getElementById('chatMessages');
  if (!container) return;

  const div = document.createElement('div');
  div.className = 'chat-typing';
  div.id = 'adminTypingIndicator';
  div.innerHTML = `
    <div class="chat-msg-avatar" style="background:#6B7280;">K</div>
    <div class="chat-typing-dots"><span></span><span></span><span></span></div>
  `;
  container.appendChild(div);
  scrollMessagesToBottom();
}

function hideTyping() {
  const el = document.getElementById('adminTypingIndicator');
  if (el) el.remove();
}

// ====== HELPERS ======
function updateConversationPreview(convId, message) {
  const idx = conversations.findIndex(c => c._id === convId);
  if (idx !== -1) {
    conversations[idx].lastMessage = message;
    conversations[idx].lastMessageAt = new Date().toISOString();
    if (convId !== activeConversationId) {
      conversations[idx].unreadByAdmin = (conversations[idx].unreadByAdmin || 0) + 1;
    }
    // Re-sort
    conversations.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
    renderConversationList(conversations);
  }
}

async function markAsRead(convId) {
  try {
    await apiCall(`/conversations/${convId}/read`, { method: 'PUT' });
  } catch (e) { }
}

function scrollMessagesToBottom() {
  const el = document.getElementById('chatMessages');
  if (el) setTimeout(() => { el.scrollTop = el.scrollHeight; }, 50);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatTimeShort(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return diffMin + ' phút';
  if (diffHr < 24) return diffHr + ' giờ';
  if (diffDay < 7) return diffDay + ' ngày';
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function formatTimeFull(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' +
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

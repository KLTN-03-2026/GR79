// Chatbot Widget for Sách Hub
(function() {
  let isOpen = false;
  let messages = [];

  function getStorageKey() {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user && user._id) return 'sachhub_chat_' + user._id;
      }
    } catch(e) {}
    return null;
  }

  function isUserLoggedIn() {
    return !!localStorage.getItem('token');
  }

  // Load history: chi load neu da dang nhap
  if (isUserLoggedIn()) {
    try {
      const key = getStorageKey();
      if (key) {
        const saved = localStorage.getItem(key);
        if (saved) messages = JSON.parse(saved);
      }
    } catch(e) {}
  }

  function saveHistory() {
    if (!isUserLoggedIn()) return;
    try {
      const key = getStorageKey();
      if (key) localStorage.setItem(key, JSON.stringify(messages.slice(-20)));
    } catch(e) {}
  }

  // Render markdown đơn giản (dùng marked nếu có, nếu không thì basic)
  function renderMarkdown(text) {
    if (!text) return '';
    // Escape HTML trước
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    // Code inline
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    // Headings
    html = html.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h2>$1</h2>');
    // Lists
    html = html.replace(/^[\*\-] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\s*)+/gs, '<ul>$&</ul>');
    // Numbered lists
    html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = html.replace(/\n/g, '<br>');
    html = '<p>' + html + '</p>';
    // Links - link nội bộ (bắt đầu bằng /) mở cùng tab, link ngoài mở tab mới
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, function(match, text, url) {
      if (url.startsWith('/')) {
        return '<a href="' + url + '">' + text + '</a>';
      }
      return '<a href="' + url + '" target="_blank">' + text + '</a>';
    });
    return html;
  }

  function createWidget() {
    const widget = document.createElement('div');
    widget.id = 'sachhub-chatbot';
    widget.innerHTML = `
      <button class="chat-toggle" id="chatToggle" title="Chat với chúng tôi">
        <i class="bi bi-chat-dots-fill"></i>
        <span class="chat-badge" id="chatBadge" style="display:none;">1</span>
      </button>

      <div class="chat-window" id="chatWindow">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="bot-avatar">
              <i class="bi bi-robot"></i>
            </div>
            <div>
              <div class="bot-name">Trợ lý Sách Hub</div>
              <div class="bot-status"><span class="status-dot"></span> Đang hoạt động</div>
            </div>
          </div>
          <button class="chat-close" id="chatClose"><i class="bi bi-x-lg"></i></button>
        </div>

        <div class="chat-body" id="chatBody">
          <div class="chat-suggestions" id="chatSuggestions">
            <button class="suggestion-chip" data-msg="Sách bán chạy nhất hiện nay là gì?">📚 Sách bán chạy</button>
            <button class="suggestion-chip" data-msg="Có khuyến mãi gì không?">🎁 Khuyến mãi</button>
            <button class="suggestion-chip" data-msg="Tôi muốn tìm sách kỹ năng sống">✨ Sách kỹ năng</button>
            <button class="suggestion-chip" data-msg="Phí vận chuyển bao nhiêu?">🚚 Vận chuyển</button>
            <button class="suggestion-chip" data-msg="Cách thanh toán?">💰 Thanh toán</button>
          </div>
        </div>

        <div class="chat-footer">
          <div class="chat-input-wrapper">
            <input type="text" id="chatInput" placeholder="Nhập tin nhắn..." autocomplete="off">
            <button class="chat-send" id="chatSend"><i class="bi bi-send-fill"></i></button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    // Event listeners
    document.getElementById('chatToggle').addEventListener('click', toggleChat);
    document.getElementById('chatClose').addEventListener('click', toggleChat);
    document.getElementById('chatSend').addEventListener('click', sendMessage);
    document.getElementById('chatInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    // Suggestion chips
    document.querySelectorAll('.suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const msg = chip.dataset.msg;
        document.getElementById('chatInput').value = msg;
        sendMessage();
      });
    });

    // Render existing messages
    if (messages.length > 0) {
      document.getElementById('chatSuggestions').style.display = 'none';
      messages.forEach(m => renderMessage(m.role, m.content, false));
    } else {
      // Welcome message
      renderMessage('assistant', '👋 Xin chào! Tôi là trợ lý của **Sách Hub**. Tôi có thể giúp bạn tìm sách, thông tin khuyến mãi, vận chuyển và nhiều thứ khác. Bạn cần hỗ trợ gì?', false);
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    document.getElementById('chatWindow').classList.toggle('open', isOpen);
    document.getElementById('chatToggle').classList.toggle('active', isOpen);
    if (isOpen) {
      document.getElementById('chatBadge').style.display = 'none';
      setTimeout(() => document.getElementById('chatInput').focus(), 300);
      scrollToBottom();
    }
  }

  function renderMessage(role, content, save = true) {
    const body = document.getElementById('chatBody');
    const suggestions = document.getElementById('chatSuggestions');
    if (suggestions) suggestions.style.display = 'none';

    const msgDiv = document.createElement('div');
    msgDiv.className = `chat-message ${role}`;

    if (role === 'assistant') {
      msgDiv.innerHTML = `
        <div class="msg-avatar"><i class="bi bi-robot"></i></div>
        <div class="msg-bubble">${renderMarkdown(content)}</div>
      `;
    } else {
      msgDiv.innerHTML = `<div class="msg-bubble">${escapeHtml(content)}</div>`;
    }

    body.appendChild(msgDiv);
    if (save) {
      messages.push({ role, content });
      saveHistory();
    }
    scrollToBottom();
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function scrollToBottom() {
    const body = document.getElementById('chatBody');
    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 50);
  }

  function showTyping() {
    const body = document.getElementById('chatBody');
    const typing = document.createElement('div');
    typing.className = 'chat-message assistant typing-indicator';
    typing.id = 'typingIndicator';
    typing.innerHTML = `
      <div class="msg-avatar"><i class="bi bi-robot"></i></div>
      <div class="msg-bubble">
        <div class="typing-dots"><span></span><span></span><span></span></div>
      </div>
    `;
    body.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    const t = document.getElementById('typingIndicator');
    if (t) t.remove();
  }

  async function sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    renderMessage('user', text);
    showTyping();

    try {
      const chatApiUrl = (typeof API_URL !== 'undefined') ? API_URL + '/chat' : 'http://localhost:5000/api/chat';
      const response = await fetch(chatApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.slice(-10) // Gửi 10 tin nhắn gần nhất để giữ context
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.success) {
        renderMessage('assistant', data.message);
      } else {
        renderMessage('assistant', data.reply || '⚠️ Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại sau.');
      }
    } catch (error) {
      hideTyping();
      renderMessage('assistant', '⚠️ Có lỗi kết nối. Vui lòng kiểm tra mạng và thử lại.');
    }
  }

  // Init khi DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }
})();

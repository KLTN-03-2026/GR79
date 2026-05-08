const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: true, credentials: true }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/users', require('./routes/users'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/conversations', require('./routes/conversations'));

// Serve frontend pages - hỗ trợ tất cả đường dẫn lồng nhau
app.get('/pages/admin/:page', (req, res) => {
  const filePath = path.join(__dirname, `../frontend/pages/admin/${req.params.page}`);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).sendFile(path.join(__dirname, '../frontend/index.html'));
  });
});

app.get('/pages/:page', (req, res) => {
  const filePath = path.join(__dirname, `../frontend/pages/${req.params.page}`);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).sendFile(path.join(__dirname, '../frontend/index.html'));
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Fallback - mọi route khác trả về trang chủ
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// Error handler
app.use(errorHandler);

// ====== SOCKET.IO SETUP ======
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Chưa đăng nhập'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (e) {
    next(new Error('Token không hợp lệ'));
  }
});

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.userId);

  // Join room theo conversationId
  socket.on('join-conversation', (conversationId) => {
    socket.join(conversationId);
  });

  // Leave room
  socket.on('leave-conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  // Khi gửi tin nhắn → emit cho room
  socket.on('send-message', (data) => {
    // data: { conversationId, message, senderRole }
    io.to(data.conversationId).emit('new-message', data);
    // Emit cho tất cả để admin cập nhật danh sách
    io.emit('conversation-updated', { conversationId: data.conversationId });
  });

  // Typing indicator
  socket.on('typing', (data) => {
    socket.to(data.conversationId).emit('user-typing', {
      conversationId: data.conversationId,
      userId: socket.userId,
      senderRole: data.senderRole
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(data.conversationId).emit('user-stop-typing', {
      conversationId: data.conversationId,
      userId: socket.userId
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.userId);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

// Load env
dotenv.config();

// Connect DB
connectDB();

const app = express();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});

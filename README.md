# Sách Hub - Website Bán Sách Trực Tuyến

Website thương mại điện tử bán sách trực tuyến với đầy đủ chức năng: duyệt sách, giỏ hàng, thanh toán VNPay, đánh giá, blog, live chat real-time, chatbot AI và quản trị hệ thống.

## Mục Lục

- [Giới thiệu](#giới-thiệu)
- [Tính năng](#tính-năng)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Cài đặt](#cài-đặt)
- [Cách chạy](#cách-chạy)
- [Tài khoản test](#tài-khoản-test)
- [Danh sách trang](#danh-sách-trang)
- [API Documentation](#api-documentation)

## Giới thiệu

**Sách Hub** là một nền tảng thương mại điện tử bán sách trực tuyến được xây dựng với giao diện hiện đại, thân thiện và đầy đủ chức năng. Dự án bao gồm phần khách hàng (frontend) và phần quản trị (admin) tách biệt rõ ràng, hỗ trợ 3 vai trò: **Admin**, **Staff** và **User**.

## Tính năng

### Khách vãng lai
- Xem trang chủ (banner, flash sale, sách bán chạy, sách mới)
- Duyệt sách theo danh mục, lọc theo giá và đánh giá, sắp xếp, phân trang
- **Tìm kiếm với dropdown gợi ý tức thì** (gõ ký tự là hiện sách phù hợp)
- Xem chi tiết sách: ảnh, mô tả, đánh giá, sách liên quan
- Đọc blog/tin tức, xem trang giới thiệu, liên hệ, tuyển dụng
- Gửi form liên hệ, ứng tuyển công việc
- Đăng ký tài khoản, đăng nhập

### Khách hàng (đã đăng nhập)
- Thêm vào giỏ hàng, quản lý giỏ (sửa số lượng, xóa, áp mã giảm giá)
- Đặt hàng và thanh toán **COD** hoặc **VNPay online**
- Xem lịch sử đơn hàng, hủy đơn (khi pending), theo dõi trạng thái
- Quản lý hồ sơ cá nhân, đổi mật khẩu, upload avatar
- Quản lý nhiều địa chỉ giao hàng (thêm/sửa/xóa, đặt mặc định)
- Xem voucher khả dụng, áp dụng mã giảm giá
- **Đánh giá sách** đã mua (rating + bình luận)
- Nhận **thông báo** đơn hàng, khuyến mãi, hệ thống
- **Live chat real-time** với nhân viên hỗ trợ (Socket.IO)
- **Chatbot AI** tư vấn sách (OpenAI)
- Trang cài đặt tài khoản

### Admin (Quản trị viên)
- Dashboard thống kê doanh thu, đơn hàng, biểu đồ (Chart.js)
- Quản lý sách (CRUD, upload ảnh Cloudinary, quản lý tồn kho)
- Quản lý danh mục sách (CRUD)
- Quản lý đơn hàng (xem, cập nhật trạng thái, lọc theo trạng thái)
- Quản lý người dùng (xem, khóa/mở tài khoản)
- Quản lý mã giảm giá / voucher (CRUD)
- Quản lý blog / tin tức (CRUD, soạn thảo nội dung)
- Quản lý liên hệ (xem, cập nhật trạng thái)
- Quản lý thông báo (gửi cho user cụ thể hoặc toàn hệ thống)
- Quản lý tin tuyển dụng (CRUD)
- **Live chat hỗ trợ** khách hàng real-time

### Staff (Nhân viên)
- Dashboard (xem)
- Quản lý sách (CRUD), danh mục (CRUD)
- Quản lý đơn hàng (xem + cập nhật trạng thái)
- Quản lý liên hệ (xem + cập nhật)
- Live chat hỗ trợ khách hàng
- *Không có quyền*: người dùng, khuyến mãi, blog, thông báo, tuyển dụng

## Công nghệ sử dụng

### Frontend
- **HTML5, CSS3, Bootstrap 5** — giao diện responsive
- **JavaScript (Vanilla)** — logic phía client
- **Bootstrap Icons** — icon set
- **Chart.js** — biểu đồ thống kê admin
- **Socket.IO Client** — live chat real-time

### Backend
- **Node.js + Express.js** — REST API server
- **MongoDB + Mongoose** — database NoSQL
- **Socket.IO** — real-time messaging
- **JWT (jsonwebtoken)** — xác thực
- **bcryptjs** — hash mật khẩu
- **Multer + Cloudinary** — upload ảnh
- **Slugify** — tạo URL slug
- **Crypto** — tạo signature VNPay

### Tích hợp bên thứ 3
- **Cloudinary** — lưu trữ và tối ưu ảnh
- **VNPay Sandbox** — thanh toán online
- **Resend** — gửi email thông báo
- **OpenAI** — chatbot AI tư vấn sách

## Cấu trúc thư mục

```
WebBanSach/
├── backend/
│   ├── config/                  # Cấu hình DB, Cloudinary
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/             # Xử lý logic
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── couponController.js
│   │   ├── reviewController.js
│   │   ├── blogController.js
│   │   ├── contactController.js
│   │   ├── userController.js
│   │   ├── dashboardController.js
│   │   ├── notificationController.js
│   │   ├── jobController.js
│   │   ├── chatController.js          # Chatbot AI
│   │   └── conversationController.js  # Live chat
│   ├── middlewares/             # Auth, error handler, upload
│   │   ├── auth.js              # protect, adminOnly, staffOrAdmin
│   │   └── errorHandler.js
│   ├── models/                  # Mongoose schemas
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Coupon.js
│   │   ├── Review.js
│   │   ├── Blog.js
│   │   ├── Contact.js
│   │   ├── Notification.js
│   │   ├── Job.js
│   │   └── Conversation.js
│   ├── routes/                  # API routes
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── categories.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── coupons.js
│   │   ├── reviews.js
│   │   ├── blogs.js
│   │   ├── contacts.js
│   │   ├── users.js
│   │   ├── upload.js
│   │   ├── dashboard.js
│   │   ├── notifications.js
│   │   ├── jobs.js
│   │   ├── chat.js              # Chatbot
│   │   └── conversations.js     # Live chat
│   ├── utils/                   # Helper functions
│   │   └── generateToken.js
│   ├── .env                     # Biến môi trường
│   ├── package.json
│   ├── server.js                # Entry point + Socket.IO
│   ├── seed.js                  # Seed dữ liệu mẫu
│   └── upload-images.js         # Upload ảnh sách lên Cloudinary
│
├── frontend/
│   ├── css/                     # Stylesheets
│   │   ├── style.css            # Global styles
│   │   ├── auth.css
│   │   ├── home.css
│   │   ├── product-detail.css
│   │   ├── book-list.css
│   │   ├── cart.css
│   │   ├── checkout.css
│   │   ├── profile.css
│   │   ├── blog.css
│   │   ├── contact.css
│   │   ├── about.css
│   │   ├── recruitment.css
│   │   ├── chatbot.css
│   │   ├── live-chat.css
│   │   └── admin.css            # Admin layout
│   ├── js/                      # JavaScript files
│   │   ├── components.js        # Header/Footer + Search Suggest
│   │   ├── utils.js             # API helper, toast, auth state
│   │   ├── auth.js
│   │   ├── home.js
│   │   ├── product-detail.js
│   │   ├── book-list.js
│   │   ├── search.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── profile.js
│   │   ├── orders.js
│   │   ├── address.js
│   │   ├── voucher.js
│   │   ├── settings.js
│   │   ├── notifications.js
│   │   ├── blog.js
│   │   ├── blog-detail.js
│   │   ├── contact.js
│   │   ├── jobs.js
│   │   ├── chatbot.js           # Chatbot AI widget
│   │   ├── live-chat.js         # Live chat widget
│   │   └── admin/               # Admin JS
│   │       ├── dashboard.js
│   │       ├── books.js
│   │       ├── orders.js
│   │       ├── categories.js
│   │       ├── users.js
│   │       ├── coupons.js
│   │       ├── blog.js
│   │       ├── blog-form.js
│   │       ├── contacts.js
│   │       ├── notifications.js
│   │       ├── jobs.js
│   │       ├── tuyen-dung-form.js
│   │       └── chat.js          # Admin live chat
│   ├── images/                  # Static images
│   ├── pages/                   # HTML pages
│   │   ├── dang-ky.html
│   │   ├── dang-nhap.html
│   │   ├── danh-sach-sach.html
│   │   ├── chi-tiet-sach.html
│   │   ├── tim-kiem.html
│   │   ├── gio-hang.html
│   │   ├── thanh-toan.html
│   │   ├── ho-so.html
│   │   ├── dia-chi.html
│   │   ├── voucher.html
│   │   ├── cai-dat.html
│   │   ├── don-hang.html
│   │   ├── thong-bao.html
│   │   ├── tin-tuc.html
│   │   ├── bai-viet.html
│   │   ├── lien-he.html
│   │   ├── gioi-thieu.html
│   │   ├── tuyen-dung.html
│   │   ├── chi-tiet-tuyen-dung.html
│   │   ├── vnpay-return.html
│   │   └── admin/               # Admin pages
│   │       ├── dashboard.html
│   │       ├── sach.html
│   │       ├── don-hang.html
│   │       ├── danh-muc.html
│   │       ├── nguoi-dung.html
│   │       ├── khuyen-mai.html
│   │       ├── blog.html
│   │       ├── blog-form.html
│   │       ├── lien-he.html
│   │       ├── thong-bao.html
│   │       ├── tuyen-dung.html
│   │       ├── tuyen-dung-form.html
│   │       └── chat.html        # Admin live chat
│   └── index.html               # Trang chủ
│
├── database/                    # JSON dữ liệu seed
├── UI-Mau/                      # Ảnh mẫu giao diện
├── CLAUDE.md                    # Tài liệu dự án (rule, palette, actor)
├── README.md                    # File này
├── taikhoan.txt                 # Danh sách tài khoản test
└── .gitignore
```

## Cài đặt

### Yêu cầu hệ thống
- **Node.js** >= 18.x
- **MongoDB** >= 6.x (chạy local hoặc MongoDB Atlas)
- **npm** hoặc **yarn**

### Bước 1: Clone repository
```bash
git clone <repository-url>
cd WebBanSach
```

### Bước 2: Cài đặt dependencies
```bash
cd backend
npm install
```

### Bước 3: Cấu hình môi trường
File `.env` đã có sẵn trong thư mục `backend/`:
```env
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sachhub

# JWT
JWT_SECRET=sachhub_jwt_secret_key_2024_very_secure
JWT_EXPIRE=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=daytrfyrg
CLOUDINARY_API_KEY=784438178628159
CLOUDINARY_API_SECRET=DHKWrW5-kS_ItxG1TibCZNEnGgM

# VNPay Sandbox
VNPAY_TMN_CODE=B77INC60
VNPAY_HASH_SECRET=NU3W61XPNAW4DDRSYM30E0G4GL97VG7M
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/pages/vnpay-return.html

# Resend (email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
MAIL_FROM_ADDRESS=noreply@sachhub.vn
MAIL_FROM_NAME=Sách Hub

# OpenAI (chatbot AI - optional)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
```

## Cách chạy

### 1. Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên `mongodb://localhost:27017`

### 2. Seed dữ liệu mẫu
```bash
cd backend
node seed.js
```

### 3. Upload ảnh sách lên Cloudinary
```bash
node upload-images.js
```

### 4. Khởi động server
```bash
npm start
# hoặc development mode (nodemon)
npm run dev
```

### 5. Truy cập website
Mở trình duyệt và vào: **http://localhost:5000**

## Tài khoản test

### Admin
```
Email:    admin@sachhub.vn
Mật khẩu: admin123
URL:      http://localhost:5000/pages/admin/dashboard.html
```

### Staff (Nhân viên)
```
Email:    staff@sachhub.vn
Mật khẩu: staff123
Quyền:    Dashboard (xem), Sách (CRUD), Đơn hàng (xem+cập nhật),
          Danh mục (CRUD), Liên hệ (xem+cập nhật), Live chat
```

### Khách hàng
```
Email:    user@sachhub.vn   |  Mật khẩu: user123  (Nguyễn Văn Anh)
Email:    user2@sachhub.vn  |  Mật khẩu: user123  (Trần Thị Bích)
```

### Mã giảm giá test
| Mã | Loại | Giá trị | Đơn tối thiểu |
|---|---|---|---|
| WELCOME20 | % | 20% (max 50.000đ) | 100.000đ |
| FREESHIP | Cố định | 19.000đ | 200.000đ |
| SALE50K | Cố định | 50.000đ | 300.000đ |
| SACHHAY10 | % | 10% | 50.000đ |

## Danh sách trang

### Trang khách hàng
| Trang | URL |
|---|---|
| Trang chủ | `/` |
| Đăng nhập | `/pages/dang-nhap.html` |
| Đăng ký | `/pages/dang-ky.html` |
| Danh sách sách | `/pages/danh-sach-sach.html` |
| Chi tiết sách | `/pages/chi-tiet-sach.html?slug=xxx` |
| Tìm kiếm | `/pages/tim-kiem.html?q=xxx` |
| Giỏ hàng | `/pages/gio-hang.html` |
| Thanh toán | `/pages/thanh-toan.html` |
| VNPay return | `/pages/vnpay-return.html` |
| Hồ sơ cá nhân | `/pages/ho-so.html` |
| Địa chỉ giao hàng | `/pages/dia-chi.html` |
| Voucher | `/pages/voucher.html` |
| Cài đặt | `/pages/cai-dat.html` |
| Đơn hàng | `/pages/don-hang.html` |
| Thông báo | `/pages/thong-bao.html` |
| Tin tức | `/pages/tin-tuc.html` |
| Chi tiết bài viết | `/pages/bai-viet.html?slug=xxx` |
| Liên hệ | `/pages/lien-he.html` |
| Giới thiệu | `/pages/gioi-thieu.html` |
| Tuyển dụng | `/pages/tuyen-dung.html` |
| Chi tiết tuyển dụng | `/pages/chi-tiet-tuyen-dung.html?slug=xxx` |

### Trang Admin
| Trang | URL |
|---|---|
| Dashboard | `/pages/admin/dashboard.html` |
| Quản lý sách | `/pages/admin/sach.html` |
| Quản lý đơn hàng | `/pages/admin/don-hang.html` |
| Quản lý danh mục | `/pages/admin/danh-muc.html` |
| Quản lý người dùng | `/pages/admin/nguoi-dung.html` |
| Quản lý khuyến mãi | `/pages/admin/khuyen-mai.html` |
| Quản lý blog | `/pages/admin/blog.html` |
| Soạn blog | `/pages/admin/blog-form.html` |
| Quản lý liên hệ | `/pages/admin/lien-he.html` |
| Quản lý thông báo | `/pages/admin/thong-bao.html` |
| Quản lý tuyển dụng | `/pages/admin/tuyen-dung.html` |
| Soạn tin tuyển dụng | `/pages/admin/tuyen-dung-form.html` |
| Live chat hỗ trợ | `/pages/admin/chat.html` |

## API Documentation

Base URL: `http://localhost:5000/api`

### Authentication
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/auth/register` | Đăng ký | - |
| POST | `/auth/login` | Đăng nhập | - |
| POST | `/auth/logout` | Đăng xuất | User |
| GET | `/auth/profile` | Xem hồ sơ | User |
| PUT | `/auth/profile` | Cập nhật hồ sơ | User |
| PUT | `/auth/change-password` | Đổi mật khẩu | User |

### Books
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/books` | Danh sách sách (filter, sort, pagination, search) | - |
| GET | `/books/flash-sale` | Sách flash sale | - |
| GET | `/books/featured` | Sách nổi bật | - |
| GET | `/books/:slug` | Chi tiết sách (theo slug hoặc ID) | - |
| POST | `/books` | Thêm sách | Admin/Staff |
| PUT | `/books/:id` | Sửa sách | Admin/Staff |
| DELETE | `/books/:id` | Xóa sách (soft delete) | Admin/Staff |

### Categories
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/categories` | Danh sách danh mục | - |
| GET | `/categories/:slug` | Chi tiết danh mục | - |
| POST | `/categories` | Thêm danh mục | Admin/Staff |
| PUT | `/categories/:id` | Sửa | Admin/Staff |
| DELETE | `/categories/:id` | Xóa | Admin/Staff |

### Cart
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/cart` | Xem giỏ hàng | User |
| POST | `/cart/add` | Thêm vào giỏ | User |
| PUT | `/cart/update` | Cập nhật số lượng | User |
| DELETE | `/cart/:bookId` | Xóa item | User |
| DELETE | `/cart` | Xóa toàn bộ | User |

### Orders
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/orders` | Tạo đơn hàng | User |
| GET | `/orders/my-orders` | Đơn hàng của tôi | User |
| GET | `/orders/:id` | Chi tiết đơn | User |
| PUT | `/orders/:id/cancel` | Hủy đơn (pending) | User |
| POST | `/orders/vnpay-create` | Tạo URL thanh toán VNPay | User |
| GET | `/orders/vnpay-return` | Verify VNPay callback | - |
| GET | `/orders` | Tất cả đơn hàng (có counts) | Admin/Staff |
| PUT | `/orders/:id/status` | Cập nhật trạng thái | Admin/Staff |

### Coupons
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/coupons/validate` | Validate mã giảm giá | User |
| GET | `/coupons` | Danh sách mã | Admin |
| POST | `/coupons` | Tạo mã | Admin |
| PUT | `/coupons/:id` | Sửa | Admin |
| DELETE | `/coupons/:id` | Xóa | Admin |

### Reviews (Đánh giá)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/reviews/:bookId` | Đánh giá theo sách | - |
| POST | `/reviews` | Tạo đánh giá | User |
| DELETE | `/reviews/:id` | Xóa đánh giá (owner/admin) | User |

### Blogs
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/blogs` | Danh sách bài viết | - |
| GET | `/blogs/:slug` | Chi tiết bài viết | - |
| POST | `/blogs` | Tạo | Admin |
| PUT | `/blogs/:id` | Sửa | Admin |
| DELETE | `/blogs/:id` | Xóa | Admin |

### Notifications
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/notifications` | Thông báo của tôi | User |
| GET | `/notifications/unread-count` | Số thông báo chưa đọc | User |
| PUT | `/notifications/:id/read` | Đánh dấu đã đọc | User |
| PUT | `/notifications/read-all` | Đánh dấu tất cả đã đọc | User |
| GET | `/notifications/admin/all` | Tất cả thông báo | Admin |
| POST | `/notifications` | Tạo thông báo | Admin |
| DELETE | `/notifications/:id` | Xóa | Admin |

### Jobs (Tuyển dụng)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/jobs` | Danh sách tin tuyển dụng | - |
| GET | `/jobs/:slug` | Chi tiết tin | - |
| POST | `/jobs` | Đăng tin | Admin |
| PUT | `/jobs/:id` | Sửa | Admin |
| DELETE | `/jobs/:id` | Xóa | Admin |

### Conversations (Live chat)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/conversations/mine` | Lấy/tạo conversation của user | User |
| GET | `/conversations` | Danh sách conversations | Admin/Staff |
| GET | `/conversations/:id` | Chi tiết conversation | Admin/Staff |
| POST | `/conversations/:id/messages` | Gửi tin nhắn | User+ |
| PUT | `/conversations/:id/read` | Đánh dấu đã đọc | User+ |

### Chat (Chatbot AI)
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/chat` | Gửi câu hỏi cho chatbot | - |

### Khác
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/dashboard/stats` | Thống kê dashboard | Admin/Staff |
| GET | `/users` | Danh sách users | Admin |
| PUT | `/users/:id/toggle-active` | Khóa/mở user | Admin |
| GET | `/contacts` | Danh sách liên hệ | Admin/Staff |
| POST | `/contacts` | Gửi liên hệ | - |
| PUT | `/contacts/:id/status` | Cập nhật trạng thái | Admin/Staff |
| POST | `/upload` | Upload file | User |

### Socket.IO Events (Live chat)
| Event | Hướng | Mô tả |
|---|---|---|
| `join-conversation` | Client → Server | Tham gia phòng chat |
| `leave-conversation` | Client → Server | Rời phòng chat |
| `send-message` | Client → Server | Gửi tin nhắn |
| `new-message` | Server → Client | Nhận tin nhắn mới |
| `conversation-updated` | Server → Client | Cập nhật danh sách hội thoại |
| `typing` / `stop-typing` | Cả hai chiều | Hiển thị "đang gõ..." |

## Dữ liệu mẫu

Sau khi chạy `node seed.js`, hệ thống sẽ có:
- **4 tài khoản** (1 admin, 1 staff, 2 user)
- **6 danh mục** (Văn học, Kỹ năng sống, Kinh tế, Thiếu nhi, Ngoại ngữ, Khoa học)
- **12 cuốn sách** với ảnh Cloudinary
- **4 bài blog** mẫu
- **4 mã giảm giá**
- **5 thông báo** (3 global + 2 cá nhân)
- **5 tin tuyển dụng**

## Bảng màu

| Tên | Mã |
|---|---|
| Primary | `#E8491D` |
| Primary Hover | `#D63A0E` |
| Primary Light | `#FFF3ED` |
| Text Dark | `#1A1A1A` |
| Text Gray | `#6B7280` |
| Background | `#FFFFFF` |
| Background Alt | `#F9FAFB` |
| Border | `#E5E7EB` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |

## Tính năng bảo mật

- Mật khẩu hash với **bcryptjs** (12 rounds)
- Xác thực bằng **JWT token** (expires 7 ngày)
- Middleware `protect`, `adminOnly`, `staffOrAdmin` bảo vệ routes
- Socket.IO xác thực qua JWT trong handshake
- Validate input ở Mongoose schema
- CORS configured
- Cookie httpOnly, sameSite strict

## Phát triển

### Scripts NPM
```bash
npm start              # Chạy production
npm run dev            # Chạy development với nodemon
node seed.js           # Seed dữ liệu mẫu
node upload-images.js  # Upload ảnh sách lên Cloudinary
```

### Quy ước code
- Comment code bằng tiếng Anh
- Text UI bằng tiếng Việt có dấu
- Tên biến/hàm bằng tiếng Anh
- File HTML/CSS/JS theo kebab-case
- Hàm JS theo camelCase
- Backend MVC: routes → controllers → models
- Frontend: mỗi trang 1 file HTML + JS riêng + CSS chung (`style.css`) + CSS riêng

## Tác giả

Dự án được phát triển trong khuôn khổ học tập, áp dụng kiến thức về:
- HTML/CSS/JavaScript, Bootstrap responsive
- Node.js + Express RESTful API
- MongoDB + Mongoose ODM
- JWT Authentication, RBAC (Admin/Staff/User)
- Real-time với Socket.IO
- Tích hợp dịch vụ cloud (Cloudinary, VNPay, Resend, OpenAI)

## License

Dự án phục vụ mục đích học tập.

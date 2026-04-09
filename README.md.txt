# Sách Hub - Website Bán Sách Trực Tuyến

Website thương mại điện tử bán sách trực tuyến với đầy đủ chức năng từ duyệt sách, giỏ hàng, thanh toán đến quản trị hệ thống.

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

**Sách Hub** là một nền tảng thương mại điện tử bán sách trực tuyến được xây dựng với giao diện hiện đại, thân thiện và đầy đủ chức năng. Dự án bao gồm phần khách hàng (frontend) và phần quản trị (admin) tách biệt rõ ràng.

## Tính năng

### Khách hàng
- Đăng ký, đăng nhập (JWT)
- Duyệt sách theo danh mục, lọc theo giá, đánh giá
- Tìm kiếm sách theo tên, tác giả
- Xem chi tiết sách với ảnh, mô tả, đánh giá
- Quản lý giỏ hàng (thêm/sửa/xóa, áp mã giảm giá)
- Đặt hàng với thanh toán COD hoặc VNPay
- Lịch sử đơn hàng, theo dõi trạng thái
- Quản lý hồ sơ cá nhân, đổi mật khẩu
- Nhận thông báo (đơn hàng, khuyến mãi, hệ thống)
- Đọc blog, tin tức về sách
- Liên hệ, gửi tin nhắn cho admin
- Xem thông tin tuyển dụng, ứng tuyển

### Quản trị (Admin)
- Dashboard thống kê doanh thu, đơn hàng (Chart.js)
- Quản lý sách (CRUD, upload ảnh Cloudinary)
- Quản lý đơn hàng (cập nhật trạng thái, xem chi tiết)
- Quản lý danh mục sách
- Quản lý người dùng (khóa/mở tài khoản)
- Quản lý mã giảm giá / voucher
- Quản lý blog / tin tức
- Quản lý liên hệ
- Quản lý thông báo (gửi cho user hoặc toàn hệ thống)
- Quản lý tin tuyển dụng

## Công nghệ sử dụng

### Frontend
- **HTML5, CSS3, Bootstrap 5** - Giao diện responsive
- **JavaScript (Vanilla)** - Logic phía client
- **Bootstrap Icons** - Icon set
- **Chart.js** - Biểu đồ thống kê admin

### Backend
- **Node.js + Express.js** - REST API server
- **MongoDB + Mongoose** - Database NoSQL
- **JWT (jsonwebtoken)** - Xác thực
- **bcryptjs** - Hash mật khẩu
- **Multer + Cloudinary** - Upload ảnh
- **Slugify** - Tạo URL slug
- **Crypto** - Tạo signature VNPay

### Tích hợp bên thứ 3
- **Cloudinary** - Lưu trữ và tối ưu ảnh
- **VNPay Sandbox** - Thanh toán online
- **Resend** - Gửi email

## Cấu trúc thư mục

```
WebBanSach/
├── backend/
│   ├── config/              # Cấu hình DB, Cloudinary
│   │   ├── db.js
│   │   └── cloudinary.js
│   ├── controllers/         # Xử lý logic
│   │   ├── authController.js
│   │   ├── bookController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── couponController.js
│   │   ├── blogController.js
│   │   ├── contactController.js
│   │   ├── userController.js
│   │   ├── dashboardController.js
│   │   ├── notificationController.js
│   │   └── jobController.js
│   ├── middlewares/         # Auth, error handler
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/              # Mongoose schemas
│   │   ├── User.js
│   │   ├── Book.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   ├── Order.js
│   │   ├── Coupon.js
│   │   ├── Blog.js
│   │   ├── Contact.js
│   │   ├── Notification.js
│   │   └── Job.js
│   ├── routes/              # API routes
│   │   ├── auth.js
│   │   ├── books.js
│   │   ├── categories.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── coupons.js
│   │   ├── blogs.js
│   │   ├── contacts.js
│   │   ├── users.js
│   │   ├── upload.js
│   │   ├── dashboard.js
│   │   ├── notifications.js
│   │   └── jobs.js
│   ├── utils/               # Helper functions
│   │   └── generateToken.js
│   ├── .env                 # Biến môi trường
│   ├── package.json
│   ├── server.js            # Entry point
│   ├── seed.js              # Seed dữ liệu mẫu
│   └── upload-images.js     # Upload ảnh sách lên Cloudinary
│
├── frontend/
│   ├── css/                 # Stylesheets
│   │   ├── style.css        # Global styles
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
│   │   └── admin.css        # Admin layout
│   ├── js/                  # JavaScript files
│   │   ├── components.js    # Header/Footer dùng chung
│   │   ├── utils.js         # API helper, toast, auth state
│   │   ├── auth.js
│   │   ├── home.js
│   │   ├── product-detail.js
│   │   ├── book-list.js
│   │   ├── search.js
│   │   ├── cart.js
│   │   ├── checkout.js
│   │   ├── profile.js
│   │   ├── orders.js
│   │   ├── notifications.js
│   │   ├── blog.js
│   │   ├── blog-detail.js
│   │   ├── contact.js
│   │   ├── jobs.js
│   │   └── admin/           # Admin JS
│   │       ├── dashboard.js
│   │       ├── books.js
│   │       ├── orders.js
│   │       ├── categories.js
│   │       ├── users.js
│   │       ├── coupons.js
│   │       ├── blog.js
│   │       ├── contacts.js
│   │       ├── notifications.js
│   │       └── jobs.js
│   ├── images/              # Static images
│   ├── pages/               # HTML pages
│   │   ├── dang-ky.html
│   │   ├── dang-nhap.html
│   │   ├── danh-sach-sach.html
│   │   ├── chi-tiet-sach.html
│   │   ├── tim-kiem.html
│   │   ├── gio-hang.html
│   │   ├── thanh-toan.html
│   │   ├── ho-so.html
│   │   ├── don-hang.html
│   │   ├── thong-bao.html
│   │   ├── tin-tuc.html
│   │   ├── bai-viet.html
│   │   ├── lien-he.html
│   │   ├── gioi-thieu.html
│   │   ├── tuyen-dung.html
│   │   ├── chi-tiet-tuyen-dung.html
│   │   ├── vnpay-return.html
│   │   └── admin/           # Admin pages
│   │       ├── dashboard.html
│   │       ├── sach.html
│   │       ├── don-hang.html
│   │       ├── danh-muc.html
│   │       ├── nguoi-dung.html
│   │       ├── khuyen-mai.html
│   │       ├── blog.html
│   │       ├── lien-he.html
│   │       ├── thong-bao.html
│   │       └── tuyen-dung.html
│   └── index.html           # Trang chủ
│
├── UI-Mau/                  # Ảnh mẫu giao diện
├── CLAUDE.md                # Tài liệu dự án
├── README.md                # File này
├── taikhoan.txt             # Danh sách tài khoản test
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

# Cloudinary (đã có sẵn)
CLOUDINARY_CLOUD_NAME=daytrfyrg
CLOUDINARY_API_KEY=784438178628159
CLOUDINARY_API_SECRET=DHKWrW5-kS_ItxG1TibCZNEnGgM

# VNPay Sandbox
VNPAY_TMN_CODE=B77INC60
VNPAY_HASH_SECRET=NU3W61XPNAW4DDRSYM30E0G4GL97VG7M
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/pages/vnpay-return.html
```

## Cách chạy

### 1. Khởi động MongoDB
Đảm bảo MongoDB đang chạy trên `mongodb://localhost:27017`

### 2. Seed dữ liệu mẫu
```bash
cd backend
node seed.js
```

Output sẽ hiển thị:
```
Users seeded!
Categories seeded!
Books seeded!
Blogs seeded!
Coupons seeded!
Notifications seeded!
Jobs seeded!
========================================
SEED DATA HOÀN TẤT!
```

### 3. Upload ảnh sách lên Cloudinary
```bash
node upload-images.js
```

### 4. Khởi động server
```bash
npm start
# hoặc
node server.js
# hoặc development mode với nodemon
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

### Khách hàng
```
Email:    user@sachhub.vn
Mật khẩu: user123
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
| Hồ sơ cá nhân | `/pages/ho-so.html` |
| Đơn hàng | `/pages/don-hang.html` |
| Thông báo | `/pages/thong-bao.html` |
| Tin tức | `/pages/tin-tuc.html` |
| Liên hệ | `/pages/lien-he.html` |
| Giới thiệu | `/pages/gioi-thieu.html` |
| Tuyển dụng | `/pages/tuyen-dung.html` |

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
| Quản lý liên hệ | `/pages/admin/lien-he.html` |
| Quản lý thông báo | `/pages/admin/thong-bao.html` |
| Quản lý tuyển dụng | `/pages/admin/tuyen-dung.html` |

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
| GET | `/books` | Danh sách sách (filter, sort, pagination) | - |
| GET | `/books/flash-sale` | Sách flash sale | - |
| GET | `/books/featured` | Sách nổi bật | - |
| GET | `/books/:slug` | Chi tiết sách (theo slug hoặc ID) | - |
| POST | `/books` | Thêm sách | Admin |
| PUT | `/books/:id` | Sửa sách | Admin |
| DELETE | `/books/:id` | Xóa sách (soft delete) | Admin |

### Categories
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/categories` | Danh sách danh mục | - |
| GET | `/categories/:slug` | Chi tiết danh mục | - |
| POST | `/categories` | Thêm danh mục | Admin |
| PUT | `/categories/:id` | Sửa | Admin |
| DELETE | `/categories/:id` | Xóa | Admin |

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
| GET | `/orders` | Tất cả đơn hàng (có counts) | Admin |
| PUT | `/orders/:id/status` | Cập nhật trạng thái | Admin |

### Coupons
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| POST | `/coupons/validate` | Validate mã giảm giá | User |
| GET | `/coupons` | Danh sách mã | Admin |
| POST | `/coupons` | Tạo mã | Admin |
| PUT | `/coupons/:id` | Sửa | Admin |
| DELETE | `/coupons/:id` | Xóa | Admin |

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

### Khác
| Method | Endpoint | Mô tả | Auth |
|---|---|---|---|
| GET | `/dashboard/stats` | Thống kê dashboard | Admin |
| GET | `/users` | Danh sách users | Admin |
| PUT | `/users/:id/toggle-active` | Khóa/mở user | Admin |
| GET | `/contacts` | Danh sách liên hệ | Admin |
| POST | `/contacts` | Gửi liên hệ | - |
| PUT | `/contacts/:id/status` | Cập nhật trạng thái | Admin |
| POST | `/upload` | Upload file | User |

## Dữ liệu mẫu

Sau khi chạy `node seed.js`, hệ thống sẽ có:
- **2 tài khoản** (1 admin, 1 user)
- **6 danh mục** sách
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
- Middleware `protect` và `adminOnly` bảo vệ routes
- Validate input ở Mongoose schema
- CORS configured
- Cookie httpOnly, sameSite strict

## Phát triển

### Scripts NPM
```bash
npm start       # Chạy production
npm run dev     # Chạy development với nodemon
node seed.js    # Seed dữ liệu mẫu
node upload-images.js  # Upload ảnh sách
```

### Quy ước code
- Comment code bằng tiếng Anh
- Text UI bằng tiếng Việt có dấu
- Tên biến/hàm bằng tiếng Anh
- File HTML/CSS/JS theo kebab-case
- Component JS theo camelCase

## Tác giả

Dự án được phát triển trong khuôn khổ học tập, áp dụng kiến thức về:
- HTML/CSS/JavaScript
- Bootstrap responsive design
- Node.js + Express RESTful API
- MongoDB + Mongoose ODM
- JWT Authentication
- Cloud services (Cloudinary, VNPay)

## License

Dự án phục vụ mục đích học tập.

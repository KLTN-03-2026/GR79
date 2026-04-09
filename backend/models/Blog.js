const mongoose = require('mongoose');
const slugify = require('slugify');

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  content: {
    type: String,
    required: [true, 'Vui lòng nhập nội dung']
  },
  excerpt: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Review Sách', 'Tin Tức Xuất Bản', 'Tác Giả', 'Kinh Nghiệm Đọc', 'Sự Kiện'],
    default: 'Tin Tức Xuất Bản'
  },
  tags: [{
    type: String
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

blogSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, locale: 'vi' }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Blog', blogSchema);

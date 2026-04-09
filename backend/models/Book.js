const mongoose = require('mongoose');
const slugify = require('slugify');

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tên sách'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  author: {
    type: String,
    required: [true, 'Vui lòng nhập tên tác giả'],
    trim: true
  },
  publisher: {
    type: String,
    default: ''
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Vui lòng chọn danh mục']
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Vui lòng nhập giá sách'],
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  images: [{
    type: String
  }],
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  sold: {
    type: Number,
    default: 0
  },
  pages: {
    type: Number
  },
  publishYear: {
    type: Number
  },
  bookLanguage: {
    type: String,
    default: 'Tiếng Việt'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numReviews: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isFlashSale: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

bookSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, locale: 'vi' }) + '-' + Date.now();
  }
  next();
});

bookSchema.index({ title: 'text', author: 'text' }, { language_override: 'searchLang', default_language: 'none' });

module.exports = mongoose.model('Book', bookSchema);

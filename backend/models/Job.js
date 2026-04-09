const mongoose = require('mongoose');
const slugify = require('slugify');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Vui lòng nhập tiêu đề công việc'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Vui lòng chọn phòng ban']
  },
  location: {
    type: String,
    default: 'TP. Hồ Chí Minh'
  },
  jobType: {
    type: String,
    enum: ['Toàn thời gian', 'Bán thời gian', 'Thực tập', 'Cộng tác viên'],
    default: 'Toàn thời gian'
  },
  salary: {
    type: String,
    default: 'Thỏa thuận'
  },
  experience: {
    type: String,
    default: '1-2 năm'
  },
  description: {
    type: String,
    default: ''
  },
  requirements: {
    type: String,
    default: ''
  },
  benefits: {
    type: String,
    default: ''
  },
  quantity: {
    type: Number,
    default: 1
  },
  deadline: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

jobSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    this.slug = slugify(this.title, { lower: true, locale: 'vi', strict: true }) + '-' + Date.now();
  }
  next();
});

module.exports = mongoose.model('Job', jobSchema);

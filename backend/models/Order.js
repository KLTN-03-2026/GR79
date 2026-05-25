const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  title: String,
  image: String,
  price: Number,
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderCode: {
    type: String,
    unique: true
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: String,
    phone: String,
    address: String
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'VNPAY'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  refundedAt: {
    type: Date,
    default: null
  },
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  coupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coupon'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  note: {
    type: String,
    default: ''
  },
  vnpTxnRef: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

orderSchema.pre('save', function(next) {
  if (!this.orderCode) {
    this.orderCode = 'DH-' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);

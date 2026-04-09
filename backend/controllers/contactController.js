const Contact = require('../models/Contact');

// Gửi liên hệ (public)
const createContact = async (req, res) => {
  try {
    const { fullName, email, phone, subject, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin bắt buộc' });
    }

    const contact = await Contact.create({
      fullName,
      email,
      phone,
      subject: subject || 'Hỗ trợ chung',
      message
    });

    res.status(201).json({ success: true, message: 'Gửi liên hệ thành công', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Lấy tất cả liên hệ
const getAllContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Contact.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Cập nhật trạng thái liên hệ
const updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['new', 'read', 'replied'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
    }

    res.json({ success: true, message: 'Cập nhật trạng thái thành công', data: contact });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createContact, getAllContacts, updateContactStatus };

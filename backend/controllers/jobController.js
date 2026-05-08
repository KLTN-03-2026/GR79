const Job = require('../models/Job');

// Lấy danh sách công việc (public)
const getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    // Mặc định public chỉ hiện job đang tuyển. Admin có thể xem tất cả khi truyền all=true
    if (req.query.all !== 'true') {
      filter.isActive = true;
    }

    if (req.query.department) {
      filter.department = req.query.department;
    }

    if (req.query.jobType) {
      filter.jobType = req.query.jobType;
    }

    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Job.countDocuments(filter)
    ]);

    res.json({
      success: true,
      jobs,
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

// Lấy chi tiết công việc theo slug (public)
const getJobBySlug = async (req, res) => {
  try {
    const param = req.params.slug;
    let job;

    // Hỗ trợ tìm theo ID (cho admin edit) hoặc slug (cho frontend)
    if (param.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(param);
    } else {
      job = await Job.findOne({ slug: param });
    }

    if (!job) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng' });
    }

    res.json({ success: true, job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Tạo tin tuyển dụng
const createJob = async (req, res) => {
  try {
    const {
      title, department, location, jobType, salary, experience,
      description, requirements, benefits, quantity, deadline, isActive
    } = req.body;

    const job = await Job.create({
      title,
      department,
      location,
      jobType,
      salary,
      experience,
      description,
      requirements,
      benefits,
      quantity,
      deadline: deadline || undefined,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, message: 'Tạo tin tuyển dụng thành công', job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Cập nhật tin tuyển dụng
const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng' });
    }

    const fields = [
      'title', 'department', 'location', 'jobType', 'salary', 'experience',
      'description', 'requirements', 'benefits', 'quantity', 'deadline', 'isActive'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    await job.save();

    res.json({ success: true, message: 'Cập nhật tin tuyển dụng thành công', job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: Xóa mềm (set isActive = false)
const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tin tuyển dụng' });
    }

    job.isActive = false;
    await job.save();

    res.json({ success: true, message: 'Đã đóng tin tuyển dụng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getJobs, getJobBySlug, createJob, updateJob, deleteJob };

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.use(requireAuth, requireAdmin);

// ─── GET /api/admin/recruiters ────────────────────────────────────────────
router.get('/recruiters', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, search, isActive } = req.query;
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) query.$text = { $search: search };

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-passwordHash -refreshTokens -passwordResetToken -passwordResetExpires')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: { users, pagination: { total, page: parseInt(page), limit: parseInt(limit) } } });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/admin/recruiters ──────────────────────────────────────────
router.post('/recruiters', async (req, res, next) => {
  try {
    const { name, email, password, role, department, title } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const user = await User.create({
      name, email: email.toLowerCase(),
      passwordHash: password,
      role: role || 'recruiter',
      department: department || 'Human Resources',
      title: title || 'Recruiter',
    });

    res.status(201).json({ success: true, data: { user: user.profile } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/recruiters/:id ───────────────────────────────────────
router.get('/recruiters/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-passwordHash -refreshTokens');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const [jobCount, candidateCount] = await Promise.all([
      Job.countDocuments({ postedBy: user._id }),
      Candidate.countDocuments({ uploadedBy: user._id }),
    ]);

    res.json({ success: true, data: { user: user.profile, stats: { jobCount, candidateCount } } });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/admin/recruiters/:id ───────────────────────────────────────
router.put('/recruiters/:id', async (req, res, next) => {
  try {
    // Prevent self-demotion for the last admin
    if (req.body.role && req.params.id === req.user._id.toString()) {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1 && req.body.role !== 'admin') {
        return res.status(400).json({ success: false, message: 'Cannot remove the last admin' });
      }
    }

    const allowed = ['name', 'role', 'department', 'title', 'isActive'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
      .select('-passwordHash -refreshTokens');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, data: { user: user.profile } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/admin/recruiters/:id ────────────────────────────────────
router.delete('/recruiters/:id', async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/admin/platform-stats ───────────────────────────────────────
router.get('/platform-stats', async (req, res, next) => {
  try {
    const [users, jobs, candidates] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Candidate.countDocuments(),
    ]);

    const roleBreakdown = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const jobsByStatus = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: { users, jobs, candidates, roleBreakdown, jobsByStatus },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

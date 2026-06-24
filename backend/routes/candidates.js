const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const { requireAuth, requireRecruiter } = require('../middleware/auth');
const { rankCandidate } = require('../services/aiRanking');

router.use(requireAuth);

// ─── GET /api/candidates ──────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, jobId, status, parseStatus,
      minScore, maxScore, search, isShortlisted,
      sortBy = 'matchScore', sortOrder = 'desc', skills,
    } = req.query;

    const query = {};
    if (jobId) query.jobId = jobId;
    if (status) query.status = status;
    if (parseStatus) query.parseStatus = parseStatus;
    if (isShortlisted !== undefined) query.isShortlisted = isShortlisted === 'true';
    if (minScore || maxScore) {
      query.matchScore = {};
      if (minScore) query.matchScore.$gte = parseInt(minScore);
      if (maxScore) query.matchScore.$lte = parseInt(maxScore);
    }
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim().toLowerCase());
      query.skills = { $in: skillList };
    }
    if (search) query.$text = { $search: search };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [candidates, total] = await Promise.all([
      Candidate.find(query)
        .populate('jobId', 'title department location status')
        .populate('uploadedBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Candidate.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        candidates,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/candidates/:id ──────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('jobId', 'title department location requiredSkills minExperience description')
      .populate('resumeId')
      .populate('uploadedBy', 'name avatar');

    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    res.json({ success: true, data: { candidate } });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/candidates/:id ──────────────────────────────────────────────
router.put('/:id', requireRecruiter, async (req, res, next) => {
  try {
    const allowed = ['status', 'isShortlisted', 'notes', 'interviewDate', 'name', 'email', 'phone', 'location', 'linkedinUrl', 'portfolioUrl'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id, { $set: updates }, { new: true, runValidators: true }
    ).populate('jobId', 'title department');

    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, data: { candidate } });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/candidates/:id/shortlist ───────────────────────────────────
router.put('/:id/shortlist', requireRecruiter, async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    candidate.isShortlisted = !candidate.isShortlisted;
    candidate.status = candidate.isShortlisted ? 'shortlisted' : 'reviewing';
    await candidate.save();

    res.json({ success: true, data: { candidate, shortlisted: candidate.isShortlisted } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/candidates/:id ──────────────────────────────────────────
router.delete('/:id', requireRecruiter, async (req, res, next) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });
    res.json({ success: true, message: 'Candidate deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/candidates/:id/rescore ────────────────────────────────────
router.post('/:id/rescore', requireRecruiter, async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id).select('+rawText');
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const job = await Job.findById(candidate.jobId);
    if (!job) return res.status(404).json({ success: false, message: 'Associated job not found' });

    const scoring = await rankCandidate(candidate, job);
    const updated = await Candidate.findByIdAndUpdate(candidate._id, { $set: scoring }, { new: true });

    res.json({ success: true, data: { candidate: updated } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/candidates/:id/report ──────────────────────────────────────
router.get('/:id/report', async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('jobId', 'title requiredSkills minExperience description');
    if (!candidate) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const report = {
      candidate: {
        name: candidate.name,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        skills: candidate.skills,
        experienceYears: candidate.experienceYears,
        education: candidate.education,
      },
      scoring: {
        matchScore: candidate.matchScore,
        breakdown: candidate.scoreBreakdown,
        matchedSkills: candidate.matchedSkills,
        missingSkills: candidate.missingSkills,
        aiInsight: candidate.aiInsight,
        scoredAt: candidate.scoredAt,
      },
      job: {
        title: candidate.jobId?.title,
        requiredSkills: candidate.jobId?.requiredSkills,
        minExperience: candidate.jobId?.minExperience,
      },
      status: candidate.status,
      appliedAt: candidate.createdAt,
    };

    res.json({ success: true, data: { report } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

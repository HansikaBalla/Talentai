const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const { requireAuth, requireRecruiter } = require('../middleware/auth');
const { rankAllCandidatesForJob } = require('../services/aiRanking');

// All job routes require authentication
router.use(requireAuth);

// ─── GET /api/jobs ────────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, status, department,
      search, sortBy = 'createdAt', sortOrder = 'desc',
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (department) query.department = department;
    if (search) query.$text = { $search: search };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .populate('postedBy', 'name email avatar')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Job.countDocuments(query),
    ]);

    // Attach candidate counts
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const [total, shortlisted, top] = await Promise.all([
          Candidate.countDocuments({ jobId: job._id }),
          Candidate.countDocuments({ jobId: job._id, isShortlisted: true }),
          Candidate.find({ jobId: job._id, matchScore: { $gte: 80 } }).countDocuments(),
        ]);
        return { ...job.toJSON(), candidateCount: total, shortlistedCount: shortlisted, topMatchCount: top };
      })
    );

    res.json({
      success: true,
      data: {
        jobs: jobsWithCounts,
        pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/jobs ───────────────────────────────────────────────────────
router.post('/', requireRecruiter, async (req, res, next) => {
  try {
    const {
      title, department, location, locationType, type,
      description, requirements, requiredSkills, niceToHaveSkills,
      minExperience, maxExperience, salaryMin, salaryMax, salaryCurrency, status,
    } = req.body;

    if (!title || !department || !location || !description) {
      return res.status(400).json({ success: false, message: 'Title, department, location and description are required' });
    }

    const job = await Job.create({
      title, department, location,
      locationType: locationType || 'Remote',
      type: type || 'Full-time',
      description, requirements,
      requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
      niceToHaveSkills: Array.isArray(niceToHaveSkills) ? niceToHaveSkills : [],
      minExperience: minExperience || 0,
      maxExperience,
      salaryMin, salaryMax, salaryCurrency,
      status: status || 'active',
      postedBy: req.user._id,
    });

    const populated = await Job.findById(job._id).populate('postedBy', 'name email avatar');
    res.status(201).json({ success: true, data: { job: populated } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/jobs/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name email avatar');
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    job.viewCount = (job.viewCount || 0) + 1;
    await job.save();

    const candidateCount = await Candidate.countDocuments({ jobId: job._id });
    const stats = await Candidate.aggregate([
      { $match: { jobId: job._id, matchScore: { $ne: null } } },
      { $group: { _id: null, avgScore: { $avg: '$matchScore' }, maxScore: { $max: '$matchScore' }, count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        job: { ...job.toJSON(), candidateCount },
        stats: stats[0] || { avgScore: 0, maxScore: 0, count: 0 },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── PUT /api/jobs/:id ────────────────────────────────────────────────────
router.put('/:id', requireRecruiter, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const allowedUpdates = ['title', 'department', 'location', 'locationType', 'type', 'description',
      'requirements', 'requiredSkills', 'niceToHaveSkills', 'minExperience', 'maxExperience',
      'salaryMin', 'salaryMax', 'status'];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) job[field] = req.body[field];
    });

    await job.save();
    const updated = await Job.findById(job._id).populate('postedBy', 'name email avatar');
    res.json({ success: true, data: { job: updated } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/jobs/:id ─────────────────────────────────────────────────
router.delete('/:id', requireRecruiter, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    await Candidate.deleteMany({ jobId: job._id });
    await job.deleteOne();

    res.json({ success: true, message: 'Job and associated candidates deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/jobs/:id/rank ──────────────────────────────────────────────
router.post('/:id/rank', requireRecruiter, async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

    const candidates = await Candidate.find({
      jobId: job._id,
      parseStatus: 'completed',
    }).select('+rawText');

    if (candidates.length === 0) {
      return res.json({ success: true, message: 'No parsed candidates to rank', data: { ranked: 0 } });
    }

    const rankings = await rankAllCandidatesForJob(candidates, job);

    // Bulk update all candidates
    const bulkOps = rankings.map(r => ({
      updateOne: {
        filter: { _id: r.candidateId },
        update: {
          $set: {
            matchScore: r.matchScore,
            scoreBreakdown: r.scoreBreakdown,
            matchedSkills: r.matchedSkills,
            missingSkills: r.missingSkills,
            aiInsight: r.aiInsight,
            rankPosition: r.rankPosition,
            scoredAt: r.scoredAt,
          },
        },
      },
    }));

    await Candidate.bulkWrite(bulkOps);
    job.lastRankedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: `Ranked ${rankings.length} candidates successfully`,
      data: { ranked: rankings.length, topScore: rankings[0]?.matchScore || 0 },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/jobs/departments/list ──────────────────────────────────────
router.get('/meta/departments', async (req, res, next) => {
  try {
    const departments = await Job.distinct('department');
    res.json({ success: true, data: { departments } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

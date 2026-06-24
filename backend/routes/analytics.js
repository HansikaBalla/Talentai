const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// ─── GET /api/analytics/overview ─────────────────────────────────────────
router.get('/overview', async (req, res, next) => {
  try {
    const [
      totalJobs, activeJobs,
      totalCandidates, shortlistedCandidates, hiredCandidates,
      totalResumes,
      scoreStats,
    ] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: 'active' }),
      Candidate.countDocuments(),
      Candidate.countDocuments({ isShortlisted: true }),
      Candidate.countDocuments({ status: 'hired' }),
      Resume.countDocuments(),
      Candidate.aggregate([
        { $match: { matchScore: { $ne: null } } },
        { $group: { _id: null, avg: { $avg: '$matchScore' }, max: { $max: '$matchScore' }, min: { $min: '$matchScore' } } },
      ]),
    ]);

    // Estimate time saved: 40 min per resume manually
    const timeSavedHours = Math.round((totalResumes * 40) / 60);
    const topMatches = await Candidate.countDocuments({ matchScore: { $gte: 80 } });

    res.json({
      success: true,
      data: {
        overview: {
          totalJobs, activeJobs,
          totalCandidates, shortlistedCandidates, hiredCandidates,
          totalResumes, topMatches,
          avgMatchScore: Math.round(scoreStats[0]?.avg || 0),
          timeSavedHours,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/funnel ────────────────────────────────────────────
router.get('/funnel', async (req, res, next) => {
  try {
    const { jobId } = req.query;
    const matchStage = jobId ? { jobId: new mongoose.Types.ObjectId(jobId) } : {};

    const [total, shortlisted, interviewed, offered, hired] = await Promise.all([
      Candidate.countDocuments(matchStage),
      Candidate.countDocuments({ ...matchStage, status: { $in: ['shortlisted', 'reviewing', 'interviewed', 'offered', 'hired'] } }),
      Candidate.countDocuments({ ...matchStage, status: { $in: ['interviewed', 'offered', 'hired'] } }),
      Candidate.countDocuments({ ...matchStage, status: { $in: ['offered', 'hired'] } }),
      Candidate.countDocuments({ ...matchStage, status: 'hired' }),
    ]);

    res.json({
      success: true,
      data: {
        funnel: [
          { stage: 'Sourced', count: total },
          { stage: 'Screened', count: shortlisted },
          { stage: 'Interviewed', count: interviewed },
          { stage: 'Offered', count: offered },
          { stage: 'Hired', count: hired },
        ],
        conversionRate: total > 0 ? ((hired / total) * 100).toFixed(1) : '0.0',
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/skills ────────────────────────────────────────────
router.get('/skills', async (req, res, next) => {
  try {
    const topSkills = await Candidate.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
      { $project: { skill: '$_id', count: 1, _id: 0 } },
    ]);

    const total = await Candidate.countDocuments();
    const skillsWithPercent = topSkills.map(s => ({
      ...s,
      percentage: total > 0 ? Math.round((s.count / total) * 100) : 0,
    }));

    res.json({ success: true, data: { skills: skillsWithPercent } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/score-distribution ───────────────────────────────
router.get('/score-distribution', async (req, res, next) => {
  try {
    const buckets = await Candidate.aggregate([
      { $match: { matchScore: { $ne: null } } },
      {
        $bucket: {
          groupBy: '$matchScore',
          boundaries: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
          default: '100',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    res.json({ success: true, data: { distribution: buckets } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/departments ──────────────────────────────────────
router.get('/departments', async (req, res, next) => {
  try {
    const deptStats = await Candidate.aggregate([
      {
        $lookup: {
          from: 'jobs',
          localField: 'jobId',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
      {
        $group: {
          _id: '$job.department',
          avgScore: { $avg: '$matchScore' },
          count: { $sum: 1 },
          shortlisted: { $sum: { $cond: ['$isShortlisted', 1, 0] } },
        },
      },
      { $sort: { avgScore: -1 } },
      {
        $project: {
          department: '$_id',
          avgScore: { $round: ['$avgScore', 0] },
          count: 1,
          shortlisted: 1,
          _id: 0,
        },
      },
    ]);

    res.json({ success: true, data: { departments: deptStats } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/analytics/recent-activity ──────────────────────────────────
router.get('/recent-activity', async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [recentJobs, recentCandidates] = await Promise.all([
      Job.find({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('postedBy', 'name'),
      Candidate.find({ createdAt: { $gte: sevenDaysAgo } })
        .sort({ matchScore: -1 })
        .limit(5)
        .populate('jobId', 'title'),
    ]);

    res.json({ success: true, data: { recentJobs, recentCandidates } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

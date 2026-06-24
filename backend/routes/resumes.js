const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const upload = require('../middleware/upload');
const { requireAuth, requireRecruiter } = require('../middleware/auth');
const { parseResume } = require('../services/resumeParser');
const { rankCandidate } = require('../services/aiRanking');

router.use(requireAuth);

// ─── POST /api/resumes/upload ─────────────────────────────────────────────
router.post('/upload', requireRecruiter, upload.array('resumes', 10), async (req, res, next) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      // Clean up uploaded files
      req.files?.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      return res.status(400).json({ success: false, message: 'jobId is required' });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      req.files?.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const results = [];

    for (const file of req.files) {
      try {
        // 1. Save resume file record
        const resume = await Resume.create({
          originalName: file.originalname,
          storedName: file.filename,
          mimeType: file.mimetype,
          filePath: file.path,
          fileSize: file.size,
          uploadedBy: req.user._id,
          jobId,
        });

        // 2. Create candidate in 'processing' state
        const candidate = await Candidate.create({
          name: file.originalname.replace(/\.(pdf|docx?)$/i, '').replace(/[-_]/g, ' '),
          jobId,
          resumeId: resume._id,
          parseStatus: 'processing',
          uploadedBy: req.user._id,
        });

        resume.candidateId = candidate._id;
        await resume.save();

        // 3. Parse resume asynchronously
        parseResume(file.path, file.mimetype)
          .then(async (parsed) => {
            const updateData = {
              name: parsed.name !== 'Unknown Candidate' ? parsed.name : candidate.name,
              email: parsed.email,
              phone: parsed.phone,
              location: parsed.location,
              skills: parsed.skills,
              experienceYears: parsed.experienceYears,
              education: parsed.education,
              highestDegreeLevel: parsed.highestDegreeLevel,
              summary: parsed.summary,
              rawText: parsed.rawText,
              parseStatus: 'completed',
            };

            const updatedCandidate = await Candidate.findByIdAndUpdate(
              candidate._id, { $set: updateData }, { new: true }
            ).select('+rawText');

            // Auto-rank after parsing
            if (updatedCandidate && job) {
              const scoring = await rankCandidate(updatedCandidate, job);
              await Candidate.findByIdAndUpdate(candidate._id, { $set: scoring });
            }

            // Update job application count
            await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });
          })
          .catch(async (err) => {
            await Candidate.findByIdAndUpdate(candidate._id, {
              $set: { parseStatus: 'failed', parseError: err.message },
            });
          });

        results.push({
          fileId: resume._id,
          candidateId: candidate._id,
          fileName: file.originalname,
          status: 'queued',
        });
      } catch (fileErr) {
        results.push({ fileName: file.originalname, status: 'error', error: fileErr.message });
      }
    }

    res.status(201).json({
      success: true,
      message: `${results.length} resume(s) uploaded and queued for AI analysis`,
      data: { results },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/resumes ─────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, jobId } = req.query;
    const query = {};
    if (jobId) query.jobId = jobId;

    const [resumes, total] = await Promise.all([
      Resume.find(query)
        .populate('candidateId', 'name parseStatus matchScore')
        .populate('uploadedBy', 'name')
        .sort({ createdAt: -1 })
        .skip((parseInt(page) - 1) * parseInt(limit))
        .limit(parseInt(limit)),
      Resume.countDocuments(query),
    ]);

    res.json({ success: true, data: { resumes, pagination: { total, page: parseInt(page), limit: parseInt(limit) } } });
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/resumes/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id)
      .populate('candidateId')
      .populate('uploadedBy', 'name email');
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    res.json({ success: true, data: { resume } });
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/resumes/:id ──────────────────────────────────────────────
router.delete('/:id', requireRecruiter, async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });

    // Delete physical file
    if (fs.existsSync(resume.filePath)) {
      fs.unlinkSync(resume.filePath);
    }

    // Update candidate
    if (resume.candidateId) {
      await Candidate.findByIdAndUpdate(resume.candidateId, { $set: { resumeId: null } });
    }

    await resume.deleteOne();
    res.json({ success: true, message: 'Resume deleted' });
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/resumes/:id/reparse ───────────────────────────────────────
router.post('/:id/reparse', requireRecruiter, async (req, res, next) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ success: false, message: 'Resume not found' });
    if (!fs.existsSync(resume.filePath)) {
      return res.status(400).json({ success: false, message: 'Resume file not found on disk' });
    }

    await Candidate.findByIdAndUpdate(resume.candidateId, { $set: { parseStatus: 'processing' } });

    const parsed = await parseResume(resume.filePath, resume.mimeType);
    await Candidate.findByIdAndUpdate(resume.candidateId, {
      $set: { ...parsed, parseStatus: 'completed' },
    });

    res.json({ success: true, message: 'Resume re-parsed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

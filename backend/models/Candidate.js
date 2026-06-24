const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    // ─── Identity ─────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },
    location: {
      type: String,
      default: null,
    },
    linkedinUrl: {
      type: String,
      default: null,
    },
    portfolioUrl: {
      type: String,
      default: null,
    },
    avatar: {
      type: String,
      default: null,
    },

    // ─── Job Association ──────────────────────────────────────────────────
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },

    // ─── Resume ───────────────────────────────────────────────────────────
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },

    // ─── Parsed Data ──────────────────────────────────────────────────────
    skills: {
      type: [String],
      default: [],
    },
    experienceYears: {
      type: Number,
      default: 0,
    },
    experienceDetails: [
      {
        title: String,
        company: String,
        duration: String,
        years: Number,
      },
    ],
    education: [
      {
        degree: String,
        institution: String,
        year: String,
        level: { type: Number, default: 0 }, // 0=none,1=hs,2=assoc,3=bach,4=mast,5=phd
      },
    ],
    highestDegreeLevel: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      default: '',
    },
    rawText: {
      type: String,
      default: '',
      select: false, // Don't return raw text by default (large)
    },
    parseStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    parseError: {
      type: String,
      default: null,
    },

    // ─── AI Scoring ───────────────────────────────────────────────────────
    matchScore: {
      type: Number,
      default: null,
      min: 0,
      max: 100,
    },
    scoreBreakdown: {
      skillsMatch: { type: Number, default: 0 },
      experienceMatch: { type: Number, default: 0 },
      educationMatch: { type: Number, default: 0 },
      keywordDensity: { type: Number, default: 0 },
    },
    matchedSkills: {
      type: [String],
      default: [],
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    rankPosition: {
      type: Number,
      default: null,
    },
    aiInsight: {
      type: String,
      default: null,
    },
    scoredAt: {
      type: Date,
      default: null,
    },

    // ─── Pipeline Status ──────────────────────────────────────────────────
    status: {
      type: String,
      enum: ['new', 'shortlisted', 'reviewing', 'interviewed', 'offered', 'rejected', 'hired'],
      default: 'new',
    },
    isShortlisted: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
    },
    interviewDate: {
      type: Date,
      default: null,
    },

    // ─── Uploaded By ──────────────────────────────────────────────────────
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
candidateSchema.index({ jobId: 1, matchScore: -1 });
candidateSchema.index({ jobId: 1, status: 1 });
candidateSchema.index({ uploadedBy: 1 });
candidateSchema.index({ parseStatus: 1 });
candidateSchema.index({ name: 'text', email: 'text', skills: 'text' });

module.exports = mongoose.model('Candidate', candidateSchema);

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    locationType: {
      type: String,
      enum: ['Remote', 'Hybrid', 'On-site'],
      default: 'Remote',
    },
    type: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Internship'],
      default: 'Full-time',
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
      maxlength: [10000, 'Description too long'],
    },
    requirements: {
      type: String,
      default: '',
    },
    requiredSkills: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 30,
        message: 'Cannot have more than 30 required skills',
      },
    },
    niceToHaveSkills: {
      type: [String],
      default: [],
    },
    minExperience: {
      type: Number,
      default: 0,
      min: 0,
      max: 30,
    },
    maxExperience: {
      type: Number,
      default: null,
    },
    salaryMin: {
      type: Number,
      default: null,
    },
    salaryMax: {
      type: Number,
      default: null,
    },
    salaryCurrency: {
      type: String,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft', 'paused'],
      default: 'active',
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    applicationCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    lastRankedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ department: 1 });
jobSchema.index({ postedBy: 1 });
jobSchema.index({ title: 'text', description: 'text', requiredSkills: 'text' });

module.exports = mongoose.model('Job', jobSchema);

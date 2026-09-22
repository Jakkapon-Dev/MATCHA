import mongoose from 'mongoose';

const deletionRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxLength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'in_review', 'reviewed', 'approved', 'rejected', 'completed'],
      default: 'pending',
      index: true
    },
    reviewedBy: {
      type: String,
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    approvedBy: {
      type: String,
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectedBy: {
      type: String,
      default: null
    },
    rejectedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true
    },
    completedBy: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: '',
      trim: true
    },
    anonymizedSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true,
    bufferCommands: false
  }
);

// Partial unique index: only ONE pending request per userId at any time
deletionRequestSchema.index(
  { userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' }
  }
);

const DeletionRequest = mongoose.models.DeletionRequest || mongoose.model('DeletionRequest', deletionRequestSchema);
export default DeletionRequest;

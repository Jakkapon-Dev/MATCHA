import mongoose from 'mongoose';

const deletionRequestSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
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
    enum: ['pending', 'reviewed', 'completed', 'rejected'],
    default: 'pending',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  reviewedAt: {
    type: Date
  },
  notes: {
    type: String,
    default: ''
  }
});

const DeletionRequest = mongoose.models.DeletionRequest || mongoose.model('DeletionRequest', deletionRequestSchema);
export default DeletionRequest;

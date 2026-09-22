import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true
    },
    performedBy: {
      type: String,
      required: true,
      index: true
    },
    performedByRole: {
      type: String,
      default: 'Admin'
    },
    targetUserId: {
      type: String,
      default: null,
      index: true
    },
    targetEmail: {
      type: String,
      default: null
    },
    targetEntity: {
      type: String,
      default: 'DeletionRequest',
      index: true
    },
    targetEntityId: {
      type: String,
      default: null
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({})
    },
    ip: {
      type: String,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    bufferCommands: false
  }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;

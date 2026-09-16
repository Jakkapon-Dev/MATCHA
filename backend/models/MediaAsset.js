const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  url: { type: String, required: true, unique: true },
  thumbnailUrl: String,
  originalName: String,
  alt: { type: String, default: '' },
  width: Number,
  height: Number,
  bytes: Number,
  mimeType: String,
  sourcePath: { type: String, unique: true, sparse: true },
  archived: { type: Boolean, default: false },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
module.exports = mongoose.model('MediaAsset', schema);

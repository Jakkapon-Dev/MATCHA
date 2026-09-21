import mongoose from 'mongoose';

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
  /* Cloudinary's handle for the asset, and the only way to ever transform or
     delete it — the delivery URL alone cannot be turned back into one. Null
     for every asset written to local disk, including every asset that existed
     before Cloudinary was wired up. Not unique: null is the normal value. */
  publicId: { type: String, default: null },
  archived: { type: Boolean, default: false },
  /* A String, not an ObjectId, because the ids this field actually receives
     are not ObjectIds. requireAuth builds req.user from whichever store knows
     the token: the Mongoose User model gives an ObjectId, but the JSON user
     store gives "u_1a2b3c4d", the demo admin gives "demo-admin", and a token
     whose user has since gone gives the raw payload id. Three of those four
     fail the cast outright, so an admin signed in through the JSON store could
     not upload an image at all — the write was rejected before it was made.
     Same shape, same reason, as Order.userId. The ref is dropped with it:
     populate cannot join across the two id systems, and nothing populated it. */
  uploadedBy: { type: String, default: null }
}, { timestamps: true });

const MediaAsset = mongoose.models.MediaAsset || mongoose.model('MediaAsset', schema);

export default MediaAsset;
export { MediaAsset };

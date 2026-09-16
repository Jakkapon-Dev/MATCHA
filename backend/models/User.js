const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Schema, model } = mongoose;

const addressSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false
    },
    role: {
      type: String,
      enum: ['Member', 'Admin'],
      default: 'Member'
    },
    tier: {
      type: String,
      enum: ['Regular Member', 'Silver', 'Gold', 'VIP', 'VIP Connoisseur'],
      default: 'Regular Member'
    },
    phone: {
      type: String,
      trim: true
    },
    addresses: {
      type: [addressSchema],
      default: []
    }
  },
  { 
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.__v;
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('name').get(function getFullName() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Hash password อัตโนมัติก่อนบันทึก
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = model('User', userSchema);

module.exports = User;

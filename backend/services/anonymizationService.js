import { User } from './userStore.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import AuditLog from '../models/AuditLog.js';

/**
 * Anonymizes user personal data while retaining commercial/financial order records
 * required for tax, accounting, and legal audit compliance.
 *
 * @param {string} userId - Target user ID to anonymize
 * @param {object} options
 * @param {string} options.performedBy - Admin identifier performing the operation
 * @param {string} [options.targetEmail] - Email fallback if user record is already partially removed
 * @param {string} [options.requestId] - Associated DeletionRequest _id
 * @param {string} [options.ip] - Request IP address
 * @returns {Promise<{ success: boolean, userId: string, anonymizedOrdersCount: number, userAnonymized: boolean }>}
 */
export async function anonymizeUserData(userId, options = {}) {
  const { performedBy = 'system', targetEmail = null, requestId = null, ip = null } = options;

  // 1. Locate user record
  let user = null;
  if (typeof User.findById === 'function') {
    try {
      user = await User.findById(userId);
    } catch {
      user = null;
    }
  }

  const emailToMatch = user?.email || targetEmail;

  // 2. Anonymize order customer identification while strictly preserving financial/accounting records
  let anonymizedOrdersCount = 0;
  if (typeof Order.find === 'function') {
    const orderQuery = {
      $or: [
        { userId }
      ]
    };
    if (emailToMatch) {
      orderQuery.$or.push({ 'customer.email': emailToMatch.toLowerCase().trim() });
    }

    const orders = await Order.find(orderQuery);
    for (const order of orders) {
      order.customer = {
        firstName: 'Anonymized',
        lastName: 'Customer',
        email: `anonymized_${order._id || order.orderNumber}@privacy.local`,
        phone: '0000000000',
        address: 'Redacted (GDPR/PDPA Right to Erasure)',
        city: 'Redacted',
        state: 'Redacted',
        zipCode: '00000',
        country: order.customer?.country || 'Thailand'
      };
      order.isAnonymized = true;
      order.anonymizedAt = new Date();
      if (typeof order.save === 'function') {
        await order.save();
      }
      anonymizedOrdersCount++;
    }
  }

  // 3. Purge active carts
  if (typeof Cart.deleteMany === 'function') {
    try {
      await Cart.deleteMany({ userId });
    } catch {
      // Non-fatal if Cart collection is empty or fails
    }
  }

  // 4. Anonymize user account personal data
  let userAnonymized = false;
  if (user) {
    user.name = 'Deleted User';
    user.firstName = 'Deleted';
    user.lastName = 'User';
    user.phone = '';
    // Unique scrambled email to satisfy unique index constraint without retaining PII
    user.email = `deleted_${userId.replace(/[^a-zA-Z0-9]/g, '')}_${Date.now()}@anonymized.local`;
    user.passwordHash = '';
    user.addresses = [];
    user.avatarUrl = '';
    user.avatarPublicId = '';
    user.avatarThumbnailUrl = '';
    user.firebaseUid = undefined;
    user.authProviders = [];
    user.marketingConsent = {
      optedIn: false,
      version: '1.0',
      updatedAt: new Date()
    };
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    user.isAnonymized = true;
    user.anonymizedAt = new Date();

    if (typeof user.save === 'function') {
      await user.save();
      userAnonymized = true;
    }
  }

  // 5. Create immutable audit log entry
  try {
    if (typeof AuditLog.create === 'function') {
      await AuditLog.create({
        action: 'DELETION_REQUEST_COMPLETED',
        performedBy,
        performedByRole: 'Admin',
        targetUserId: userId,
        targetEmail: emailToMatch,
        targetEntity: 'DeletionRequest',
        targetEntityId: requestId ? String(requestId) : null,
        details: {
          anonymizedOrdersCount,
          userAnonymized,
          financialRecordsPreserved: true,
          purgedCart: true
        },
        ip
      });
    }
  } catch (err) {
    console.error('Failed to write audit log for anonymization:', err);
  }

  return {
    success: true,
    userId,
    anonymizedOrdersCount,
    userAnonymized
  };
}

export default { anonymizeUserData };

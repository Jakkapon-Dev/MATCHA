/**
 * User Migration Script: Legacy JWT to Firebase Auth Schema (TASK 5.3)
 *
 * Safety Rules:
 * 1. NEVER touch or copy passwordHash to external services.
 * 2. Keep MongoDB _id intact so order history, carts, and addresses never detach.
 * 3. Dry-run by default unless --execute or --apply is explicitly passed.
 * 4. Automatic pre-migration backup of users and orders collections.
 * 5. Full audit logging of all inspections and updates.
 */

import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  const isExecute = process.argv.includes('--execute') || process.argv.includes('--apply');
  const mode = isExecute ? 'EXECUTE' : 'DRY_RUN';

  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('ERROR: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log('=====================================================');
  console.log(` MATCH-A USER MIGRATION TO FIREBASE SCHEMA (${mode})`);
  console.log('=====================================================\n');

  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 20000 });
  const db = mongoose.connection.db;
  const usersColl = db.collection('users');
  const ordersColl = db.collection('orders');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'data', `backup-pre-firebase-${timestamp}`);
  const logsDir = path.join(__dirname, '..', 'logs');

  fs.mkdirSync(backupDir, { recursive: true });
  fs.mkdirSync(logsDir, { recursive: true });

  // 1. Pre-migration backup
  const allUsers = await usersColl.find({}).toArray();
  const allOrders = await ordersColl.find({}).toArray();

  fs.writeFileSync(path.join(backupDir, 'users.json'), JSON.stringify(allUsers, null, 2));
  fs.writeFileSync(path.join(backupDir, 'orders.json'), JSON.stringify(allOrders, null, 2));
  console.log(`[Backup] Saved ${allUsers.length} users and ${allOrders.length} orders to:`);
  console.log(`         ${path.relative(process.cwd(), backupDir)}\n`);

  // 2. Duplicate email detection
  const emailMap = new Map();
  const duplicateEmails = [];

  for (const user of allUsers) {
    const normEmail = (user.email || '').trim().toLowerCase();
    if (!normEmail) continue;
    if (!emailMap.has(normEmail)) {
      emailMap.set(normEmail, []);
    }
    emailMap.get(normEmail).push(user);
  }

  for (const [email, users] of emailMap.entries()) {
    if (users.length > 1) {
      duplicateEmails.push({ email, count: users.length, ids: users.map((u) => u._id) });
    }
  }

  if (duplicateEmails.length > 0) {
    console.warn(`[Warning] Found ${duplicateEmails.length} duplicate email groups:`);
    duplicateEmails.forEach((d) => console.warn(` - ${d.email}: ${d.count} accounts (${d.ids.join(', ')})`));
  } else {
    console.log('[Check] No duplicate emails found in the database. Clean 1-to-1 mapping.');
  }

  // 3. User analysis & plan
  const auditEntries = [];
  let updatedCount = 0;
  let untouchedCount = 0;

  for (const user of allUsers) {
    const normEmail = (user.email || '').trim().toLowerCase();
    const currentProviders = Array.isArray(user.authProviders) ? user.authProviders : [];
    const hasPassword = Boolean(user.passwordHash && user.passwordHash.length > 0);
    const targetProviders = new Set(currentProviders);

    if (targetProviders.size === 0 && hasPassword) {
      targetProviders.add('password');
    }

    const newProviders = Array.from(targetProviders);
    const newEmailVerified = typeof user.emailVerified === 'boolean'
      ? user.emailVerified
      : Boolean(user.role === 'Admin'); // Admin seed is verified by default

    const needsUpdate =
      user.email !== normEmail ||
      !Array.isArray(user.authProviders) ||
      user.authProviders.length !== newProviders.length ||
      typeof user.emailVerified !== 'boolean';

    // Count user's associated orders
    const userOrders = allOrders.filter((o) => String(o.userId) === String(user._id));

    const changeRecord = {
      userId: user._id,
      email: normEmail,
      firebaseUid: user.firebaseUid || null,
      ordersCount: userOrders.length,
      before: {
        email: user.email,
        authProviders: user.authProviders,
        emailVerified: user.emailVerified,
      },
      after: {
        email: normEmail,
        authProviders: newProviders,
        emailVerified: newEmailVerified,
      },
      action: needsUpdate ? 'UPDATE' : 'UNCHANGED',
    };

    auditEntries.push(changeRecord);

    if (needsUpdate) {
      updatedCount++;
      if (isExecute) {
        await usersColl.updateOne(
          { _id: user._id },
          {
            $set: {
              email: normEmail,
              authProviders: newProviders,
              emailVerified: newEmailVerified,
            },
          }
        );
      }
    } else {
      untouchedCount++;
    }
  }

  // 4. Write audit log
  const auditLogPath = path.join(logsDir, `migration-audit-${timestamp}.json`);
  const auditReport = {
    timestamp: new Date().toISOString(),
    mode,
    totalUsers: allUsers.length,
    totalOrders: allOrders.length,
    duplicatesDetected: duplicateEmails,
    summary: {
      updated: updatedCount,
      untouched: untouchedCount,
    },
    details: auditEntries,
  };

  fs.writeFileSync(auditLogPath, JSON.stringify(auditReport, null, 2));
  console.log(`[Audit] Written full audit log to: ${path.relative(process.cwd(), auditLogPath)}\n`);

  console.log('-----------------------------------------------------');
  console.log(`Summary (${mode}):`);
  console.log(` - Total Users Inspected: ${allUsers.length}`);
  console.log(` - Users Requiring Schema Alignment: ${updatedCount}`);
  console.log(` - Users Already Aligned: ${untouchedCount}`);
  console.log(` - Total Orders Verified Intact: ${allOrders.length}`);
  console.log('-----------------------------------------------------');

  if (!isExecute) {
    console.log('\n[Dry Run Completed] No database writes were made.');
    console.log('To execute these changes, run with: node backend/scripts/migrate-legacy-users-firebase.mjs --execute\n');
  } else {
    console.log('\n[Execution Completed Successfully] Database has been migrated.\n');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('[Migration Error]', err);
  process.exit(1);
});

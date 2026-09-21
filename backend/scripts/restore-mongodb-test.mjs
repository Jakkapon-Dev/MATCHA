#!/usr/bin/env node
/**
 * MatchA — MongoDB Test Database Restore Utility
 * 
 * Safety & Production Protection Guarantees:
 * 1. DESIGNED FOR TEST / STAGING / LOCAL DATABASES ONLY.
 * 2. Strict Safety Guard: Detects and BLOCKS restoration to Production databases.
 * 3. Verifies SHA-256 integrity of backup files before writing.
 * 4. Outputs post-restoration verification report.
 * 
 * Usage:
 *   node backend/scripts/restore-mongodb-test.mjs --backup-dir=backend/backups/backup_xxx --confirm-test-restore
 *   node backend/scripts/restore-mongodb-test.mjs --uri="mongodb://localhost:27017/matcha_test" --backup-dir=... --confirm-test-restore
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getArg(flag) {
  const arg = process.argv.find(a => a.startsWith(`${flag}=`));
  return arg ? arg.split('=')[1].trim() : null;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function redactUri(uri) {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
  } catch {
    return 'mongodb://[REDACTED]';
  }
}

async function sha256(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function runRestore() {
  const uri = getArg('--uri') || process.env.TEST_MONGODB_URI || process.env.MONGODB_URI || '';
  const backupDir = getArg('--backup-dir');
  const confirmTest = hasFlag('--confirm-test-restore');
  const forceProd = hasFlag('--force-allow-production-restore-DANGEROUS');

  if (!uri) {
    console.error('\n❌ [RESTORE ERROR] No target MongoDB connection URI provided.');
    console.error('Usage:');
    console.error('  node backend/scripts/restore-mongodb-test.mjs --uri="mongodb://localhost:27017/matcha_test" --backup-dir=<path> --confirm-test-restore\n');
    process.exit(1);
  }

  if (!backupDir) {
    console.error('\n❌ [RESTORE ERROR] Missing --backup-dir parameter.');
    console.error('Specify the folder containing manifest.json:');
    console.error('  --backup-dir=backend/backups/backup_matcha_...\n');
    process.exit(1);
  }

  // 1. Production Detection & Safety Guards
  const lowerUri = uri.toLowerCase();
  const isProdName = /prod|production|live/.test(lowerUri);

  if (isProdName && !forceProd) {
    console.error('\n🚨 ======================================================');
    console.error('🚨 SAFETY GUARD TRIGGERED: ATTEMPTED RESTORE TO PRODUCTION');
    console.error('🚨 ======================================================');
    console.error(`Target URI appears to be a PRODUCTION database: ${redactUri(uri)}`);
    console.error('This script is strictly intended for local and test databases.');
    console.error('If you intentionally intended to overwrite a production database,');
    console.error('you must explicitly supply:');
    console.error('  --force-allow-production-restore-DANGEROUS');
    console.error('Restoration aborted with ZERO modifications made.\n');
    process.exit(1);
  }

  if (!confirmTest && !forceProd) {
    console.error('\n⚠️ [CONFIRMATION REQUIRED] To prevent accidental overwrites,');
    console.error('please pass the confirmation flag:');
    console.error('  --confirm-test-restore\n');
    process.exit(1);
  }

  // 2. Read and verify manifest
  const manifestPath = path.resolve(backupDir, 'manifest.json');
  let manifest;
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(raw);
  } catch (err) {
    console.error(`\n❌ [MANIFEST ERROR] Cannot read valid manifest.json at ${manifestPath}: ${err.message}\n`);
    process.exit(1);
  }

  console.log('🍵 [MatchA Restore] Target Database:', redactUri(uri));
  console.log(`📦 Source Backup:     ${backupDir}`);
  console.log(`🕒 Backup Timestamp:  ${manifest.timestamp}\n`);

  // 3. Verify file checksums before connecting
  console.log('🔍 Verifying SHA-256 checksums of backup files...');
  for (const [colName, info] of Object.entries(manifest.collections)) {
    const filePath = path.resolve(backupDir, info.file);
    const checksum = await sha256(filePath);
    if (checksum !== info.sha256) {
      console.error(`\n❌ [CHECKSUM MISMATCH] Collection "${colName}" checksum failed!`);
      console.error(`   Expected: ${info.sha256}`);
      console.error(`   Actual:   ${checksum}`);
      console.error('Backup files may have been tampered with or corrupted. Restoration aborted.\n');
      process.exit(1);
    }
  }
  console.log('✔ All checksums verified successfully.\n');

  // 4. Connect and perform restore
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    console.log(`🍃 Connected to target database: "${db.databaseName}"\n`);

    const report = [];

    for (const [colName, info] of Object.entries(manifest.collections)) {
      const filePath = path.resolve(backupDir, info.file);
      const raw = await fs.readFile(filePath, 'utf-8');
      const docs = JSON.parse(raw);

      const targetCol = db.collection(colName);
      // Clean existing test collection
      await targetCol.deleteMany({});

      if (docs.length > 0) {
        await targetCol.insertMany(docs);
      }

      const count = await targetCol.countDocuments();
      report.push({ collection: colName, restored: docs.length, inDb: count });
      console.log(`  ✔ [${colName}] Restored ${docs.length} documents (Verified in DB: ${count})`);
    }

    console.log('\n======================================================');
    console.log('✅ Restoration & Verification Completed Successfully!');
    console.table(report);
    console.log('======================================================\n');
  } catch (err) {
    console.error(`\n❌ [RESTORE FAILED]: ${err.message}\n`);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

runRestore();

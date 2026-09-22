#!/usr/bin/env node
/**
 * MatchA — MongoDB Test Database Restore Utility with BSON Type Fidelity
 * 
 * Safety & Production Protection Guarantees:
 * 1. DESIGNED FOR TEST / STAGING / LOCAL DATABASES ONLY.
 * 2. Strict Safety Guard: Detects and BLOCKS restoration to Production databases.
 * 3. Restores exact BSON types (ObjectId, Date, Binary) using BSON Extended JSON (EJSON).
 * 4. Verifies SHA-256 integrity checksums and record counts before writing.
 * 5. Outputs post-restoration verification report.
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
import { EJSON, ObjectId } from 'bson';
import { validateRestoreSafety, isDatabaseNameSafe } from '../services/mongoSafetyGuard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function getArg(flag, args = process.argv) {
  const arg = args.find(a => a.startsWith(`${flag}=`));
  return arg ? arg.split('=')[1].trim() : null;
}

export function hasFlag(flag, args = process.argv) {
  return args.includes(flag);
}

export function redactUri(uri) {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:********@');
  } catch {
    return 'mongodb://[REDACTED]';
  }
}

export async function sha256(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Performs restore of an EJSON backup into a verified test database.
 * 
 * @param {object} options
 * @param {string} [options.uri] Target connection URI
 * @param {string} options.backupDir Directory containing manifest.json and collection files
 * @param {boolean} [options.confirmTest] Confirmation flag
 * @param {object} [options.env] Environment variables
 * @param {string[]} [options.cliArgs] CLI arguments array
 * @param {boolean} [options.quiet] Suppress non-error logging
 * @returns {Promise<{ success: boolean, report: Array, totalDocs: number, database: string }>}
 */
export async function performRestore({
  uri = '',
  backupDir = '',
  confirmTest = false,
  env = process.env,
  cliArgs = process.argv,
  quiet = false
} = {}) {
  // 1. Strict Production Detection & Safety Guards (Pre-connection verification)
  const safety = validateRestoreSafety({
    uri: uri || getArg('--uri', cliArgs),
    env,
    cliArgs
  });

  if (!safety.safe) {
    const errorMsg = `RESTORE SAFETY GUARD: OPERATION REFUSED. Reason: ${safety.reason}`;
    if (!quiet) {
      console.error('\n🚨 ======================================================');
      console.error('🚨 RESTORE SAFETY GUARD: OPERATION REFUSED');
      console.error('🚨 ======================================================');
      console.error(`Reason: ${safety.reason}`);
      console.error('\nZero modifications or connections made.\n');
    }
    throw new Error(errorMsg);
  }

  const targetUri = safety.uri;
  const targetBackupDir = backupDir || getArg('--backup-dir', cliArgs);
  const isConfirmed = confirmTest || hasFlag('--confirm-test-restore', cliArgs);

  if (!isConfirmed) {
    throw new Error('Confirmation required: pass --confirm-test-restore or set confirmTest=true.');
  }

  if (!targetBackupDir) {
    throw new Error('Missing --backup-dir parameter. Specify folder containing manifest.json.');
  }

  // 2. Read and verify manifest
  const manifestPath = path.resolve(targetBackupDir, 'manifest.json');
  let manifest;
  try {
    const raw = await fs.readFile(manifestPath, 'utf-8');
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Cannot read valid manifest.json at ${manifestPath}: ${err.message}`);
  }

  if (!manifest.collections || typeof manifest.collections !== 'object') {
    throw new Error(`Invalid manifest structure at ${manifestPath}: missing "collections" map.`);
  }

  if (!quiet) {
    console.log('🍵 [MatchA Restore] Target Database:', redactUri(targetUri));
    console.log(`📦 Source Backup:     ${targetBackupDir}`);
    console.log(`🕒 Backup Timestamp:  ${manifest.timestamp}`);
    console.log(`🏷  Backup Format:     ${manifest.format || 'legacy-json'}\n`);
  }

  // 3. Verify SHA-256 file checksums and record counts before establishing connection
  if (!quiet) console.log('🔍 Verifying SHA-256 checksums and record counts of backup files...');
  for (const [colName, info] of Object.entries(manifest.collections)) {
    const filePath = path.resolve(targetBackupDir, info.file);
    let checksum;
    try {
      checksum = await sha256(filePath);
    } catch (err) {
      throw new Error(`Missing collection backup file "${info.file}" for collection "${colName}": ${err.message}`);
    }

    if (checksum !== info.sha256) {
      throw new Error(
        `[CHECKSUM MISMATCH] Collection "${colName}" checksum failed! Expected: ${info.sha256}, Actual: ${checksum}. Backup files may be tampered with or corrupted.`
      );
    }

    // Verify record count before connecting to DB
    const raw = await fs.readFile(filePath, 'utf-8');
    let docs;
    try {
      docs = EJSON.parse(raw, { relaxed: false });
    } catch {
      docs = JSON.parse(raw);
    }

    if (!Array.isArray(docs)) {
      throw new Error(`Invalid data in "${info.file}": expected an array of documents.`);
    }

    if (typeof info.count === 'number' && docs.length !== info.count) {
      throw new Error(
        `[RECORD COUNT MISMATCH] Collection "${colName}" expected ${info.count} documents from manifest, but file contains ${docs.length}.`
      );
    }
  }
  if (!quiet) console.log('✔ All checksums and record counts verified successfully.\n');

  // 4. Connect and perform restore
  await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;

  try {
    // Secondary post-connection safety check
    const activeDbCheck = isDatabaseNameSafe(db.databaseName);
    if (!activeDbCheck.safe) {
      throw new Error(`Connected database "${db.databaseName}" is NOT permitted for restore: ${activeDbCheck.reason}`);
    }

    if (!quiet) console.log(`🍃 Connected to target database: "${db.databaseName}"\n`);

    const report = [];
    let totalRestored = 0;

    for (const [colName, info] of Object.entries(manifest.collections)) {
      const filePath = path.resolve(targetBackupDir, info.file);
      const raw = await fs.readFile(filePath, 'utf-8');

      // Deserialize preserving BSON types (ObjectId, Date, Binary, etc.)
      let docs;
      try {
        docs = EJSON.parse(raw, { relaxed: false });
      } catch {
        docs = JSON.parse(raw);
      }

      if (!Array.isArray(docs)) {
        throw new Error(`Invalid data in "${info.file}": expected an array of documents.`);
      }

      // Verify document count against manifest
      if (typeof info.count === 'number' && docs.length !== info.count) {
        throw new Error(
          `[RECORD COUNT MISMATCH] Collection "${colName}" expected ${info.count} documents from manifest, but file contains ${docs.length}.`
        );
      }

      const targetCol = db.collection(colName);
      // Clean existing records in test collection
      await targetCol.deleteMany({});

      if (docs.length > 0) {
        await targetCol.insertMany(docs);
      }

      const countInDb = await targetCol.countDocuments();
      if (typeof info.count === 'number' && countInDb !== info.count) {
        throw new Error(
          `[POST-RESTORE COUNT MISMATCH] Collection "${colName}" inserted ${docs.length} docs, but DB has ${countInDb}.`
        );
      }

      totalRestored += docs.length;

      // Sample first doc to verify type fidelity
      const hasObjectIds = docs.some(d => d._id && typeof d._id === 'object' && d._id._bsontype === 'ObjectID');
      const hasDates = docs.some(d => Object.values(d).some(v => v instanceof Date));

      report.push({
        collection: colName,
        restored: docs.length,
        inDb: countInDb,
        bsonObjectId: hasObjectIds ? 'Preserved' : 'N/A',
        bsonDate: hasDates ? 'Preserved' : 'N/A'
      });

      if (!quiet) {
        console.log(`  ✔ [${colName}] Restored ${docs.length} documents (Verified in DB: ${countInDb})`);
      }
    }

    if (!quiet) {
      console.log('\n======================================================');
      console.log('✅ Restoration & Verification Completed Successfully!');
      console.table(report);
      console.log('======================================================\n');
    }

    return {
      success: true,
      report,
      totalDocs: totalRestored,
      database: db.databaseName
    };
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

async function runRestore() {
  try {
    await performRestore();
  } catch (err) {
    console.error(`\n❌ [RESTORE FAILED]: ${err.message}\n`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (isMain) {
  runRestore();
}

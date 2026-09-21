#!/usr/bin/env node
/**
 * MatchA — MongoDB Automated Backup Utility
 * 
 * Safety & Security Guarantees:
 * 1. ZERO hardcoded credentials. Reads from MONGODB_URI or BACKUP_MONGODB_URI environment variable or --uri flag.
 * 2. Redacts all sensitive credentials in console output.
 * 3. Exports to local gitignored `backend/backups/` directory with SHA-256 manifest.
 * 
 * Usage:
 *   node backend/scripts/backup-mongodb.mjs
 *   node backend/scripts/backup-mongodb.mjs --uri="mongodb+srv://..."
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.resolve(__dirname, '../backups');

// 1. Resolve MongoDB URI securely (CLI arg or environment variable)
function getMongoUri() {
  const arg = process.argv.find(a => a.startsWith('--uri='));
  if (arg) return arg.split('=')[1].trim();
  return process.env.BACKUP_MONGODB_URI || process.env.MONGODB_URI || '';
}

// 2. Redact sensitive connection string for safe logging
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

async function runBackup() {
  const uri = getMongoUri();
  if (!uri) {
    console.error('\n❌ [BACKUP ERROR] No MongoDB connection URI provided.');
    console.error('Provide the URI via environment variable or CLI argument:');
    console.error('  export MONGODB_URI="mongodb+srv://..."');
    console.error('  node backend/scripts/backup-mongodb.mjs\n');
    process.exit(1);
  }

  console.log('🍵 [MatchA Backup] Connecting to database...');
  console.log(`   Target: ${redactUri(uri)}`);

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    const db = mongoose.connection.db;
    const dbName = db.databaseName;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(BACKUP_ROOT, `backup_${dbName}_${timestamp}`);
    await fs.mkdir(backupDir, { recursive: true });

    console.log(`📁 Backup Destination: ${backupDir}\n`);

    const collections = await db.listCollections().toArray();
    const manifest = {
      timestamp: new Date().toISOString(),
      database: dbName,
      collections: {}
    };

    let totalDocs = 0;

    for (const col of collections) {
      const colName = col.name;
      // Skip system collections
      if (colName.startsWith('system.')) continue;

      const cursor = db.collection(colName).find({});
      const docs = await cursor.toArray();
      totalDocs += docs.length;

      const filePath = path.join(backupDir, `${colName}.json`);
      await fs.writeFile(filePath, JSON.stringify(docs, null, 2), 'utf-8');

      const checksum = await sha256(filePath);
      manifest.collections[colName] = {
        count: docs.length,
        file: `${colName}.json`,
        sha256: checksum
      };

      console.log(`  ✔ [${colName}] exported ${docs.length} documents (SHA-256: ${checksum.slice(0, 8)}...)`);
    }

    // Write manifest file
    const manifestPath = path.join(backupDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    console.log('\n======================================================');
    console.log(`✅ Backup Completed Successfully!`);
    console.log(`   Total Collections: ${Object.keys(manifest.collections).length}`);
    console.log(`   Total Documents:   ${totalDocs}`);
    console.log(`   Manifest:          ${manifestPath}`);
    console.log('======================================================\n');
  } catch (err) {
    console.error(`\n❌ [BACKUP FAILED]: ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

runBackup();

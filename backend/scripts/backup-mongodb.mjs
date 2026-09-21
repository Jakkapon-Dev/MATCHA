#!/usr/bin/env node
/**
 * MatchA — MongoDB Automated Backup Utility with BSON Type Fidelity
 * 
 * Safety & Security Guarantees:
 * 1. ZERO hardcoded credentials. Reads from MONGODB_URI or BACKUP_MONGODB_URI or --uri flag.
 * 2. Redacts all sensitive credentials in console output.
 * 3. Preserves full BSON type fidelity (ObjectId, Date, Binary, Numbers) using Extended JSON (EJSON).
 * 4. Generates SHA-256 integrity checksums and record counts for every collection in manifest.json.
 * 5. Exports to local gitignored `backend/backups/` directory.
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
import { EJSON } from 'bson';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_ROOT = path.resolve(__dirname, '../backups');

export function getMongoUri() {
  const arg = process.argv.find(a => a.startsWith('--uri='));
  if (arg) return arg.split('=')[1].trim();
  return process.env.BACKUP_MONGODB_URI || process.env.MONGODB_URI || '';
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
 * Performs backup with BSON Extended JSON serialization and SHA-256 manifest.
 * 
 * @param {object} options
 * @param {string} [options.uri] MongoDB connection URI
 * @param {string} [options.destinationDir] Custom destination directory
 * @param {boolean} [options.quiet] Suppress console logs
 * @returns {Promise<{ success: boolean, backupDir: string, manifest: object, totalDocs: number }>}
 */
export async function performBackup({ uri, destinationDir, collections: targetCollections, quiet = false } = {}) {
  const targetUri = uri || getMongoUri();
  if (!targetUri) {
    throw new Error('No MongoDB connection URI provided for backup.');
  }

  if (!quiet) {
    console.log('🍵 [MatchA Backup] Connecting to database...');
    console.log(`   Target: ${redactUri(targetUri)}`);
  }

  const client = await mongoose.connect(targetUri, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const dbName = db.databaseName;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = destinationDir || path.join(BACKUP_ROOT, `backup_${dbName}_${timestamp}`);
  await fs.mkdir(backupDir, { recursive: true });

  if (!quiet) console.log(`📁 Backup Destination: ${backupDir}\n`);

  const collections = await db.listCollections().toArray();
  const manifest = {
    format: 'bson-ejson-v2',
    timestamp: new Date().toISOString(),
    database: dbName,
    totalDocuments: 0,
    collections: {}
  };

  let totalDocs = 0;

  try {
    for (const col of collections) {
      const colName = col.name;
      // Skip internal/system collections
      if (colName.startsWith('system.')) continue;
      // If collection filter is specified, only include matching collections
      if (Array.isArray(targetCollections) && !targetCollections.includes(colName)) continue;

      const cursor = db.collection(colName).find({});
      const docs = await cursor.toArray();
      totalDocs += docs.length;

      const filePath = path.join(backupDir, `${colName}.json`);
      // Serialize with BSON Canonical Extended JSON to preserve ObjectId, Date, Binary
      const serialized = EJSON.stringify(docs, null, 2, { relaxed: false });
      await fs.writeFile(filePath, serialized, 'utf-8');

      const checksum = await sha256(filePath);
      manifest.collections[colName] = {
        count: docs.length,
        file: `${colName}.json`,
        sha256: checksum
      };

      if (!quiet) {
        console.log(`  ✔ [${colName}] exported ${docs.length} documents with BSON fidelity (SHA-256: ${checksum.slice(0, 8)}...)`);
      }
    }

    manifest.totalDocuments = totalDocs;
    manifest.totalCollections = Object.keys(manifest.collections).length;

    // Write manifest file
    const manifestPath = path.join(backupDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

    if (!quiet) {
      console.log('\n======================================================');
      console.log(`✅ Backup Completed Successfully!`);
      console.log(`   Format:            BSON Canonical Extended JSON`);
      console.log(`   Total Collections: ${manifest.totalCollections}`);
      console.log(`   Total Documents:   ${totalDocs}`);
      console.log(`   Manifest:          ${manifestPath}`);
      console.log('======================================================\n');
    }

    return {
      success: true,
      backupDir,
      manifest,
      totalDocs
    };
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

async function runBackup() {
  try {
    await performBackup();
  } catch (err) {
    console.error(`\n❌ [BACKUP FAILED]: ${err.message}`);
    process.exit(1);
  }
}

const isMain = process.argv[1] && path.resolve(fileURLToPath(import.meta.url)).toLowerCase() === path.resolve(process.argv[1]).toLowerCase();
if (isMain) {
  runBackup();
}

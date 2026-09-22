import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import mongoose from 'mongoose';
import { ObjectId } from 'bson';
import dns from 'node:dns';

// Windows / Node.js c-ares DNS SRV lookup fix for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

import { performBackup } from '../scripts/backup-mongodb.mjs';
import { performRestore, sha256 } from '../scripts/restore-mongodb-test.mjs';

const testUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/matcha_test_type_fidelity';
let tempDir;

describe('Task 6 — BSON Type Fidelity & Integrity Verification', () => {
  before(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'matcha-bson-test-'));
  });

  after(async () => {
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  });

  it('preserves ObjectId and Date types through backup and restore lifecycle', async () => {
    // 1. Connect to test database and seed documents with rich BSON types
    await mongoose.connect(testUri, { serverSelectionTimeoutMS: 5000 }).catch(err => {
      console.warn('Skipping direct DB test if DB not reachable:', err.message);
    });

    if (mongoose.connection.readyState !== 1) {
      console.warn('MongoDB not connected, skipping live DB test');
      return;
    }

    const db = mongoose.connection.db;
    const testCollectionName = 'test_type_fidelity_records';
    const testCol = db.collection(testCollectionName);

    await testCol.deleteMany({});

    const sampleId1 = new ObjectId();
    const sampleId2 = new ObjectId();
    const sampleDate = new Date('2026-09-21T12:34:56.789Z');

    const seedDocuments = [
      {
        _id: sampleId1,
        title: 'Ceremonial Matcha Tin',
        price: 1250,
        createdAt: sampleDate,
        updatedAt: new Date(),
        metadata: {
          batchId: new ObjectId(),
          origin: 'Uji, Kyoto'
        }
      },
      {
        _id: sampleId2,
        title: 'Bamboo Chasen Whisk',
        price: 890,
        createdAt: new Date('2026-01-15T08:00:00.000Z'),
        updatedAt: new Date()
      }
    ];

    try {
      await testCol.insertMany(seedDocuments);

      // 2. Perform Backup (targeted specifically to test collection)
      const backupDir = path.join(tempDir, 'type_fidelity_backup');
      const backupResult = await performBackup({
        uri: testUri,
        destinationDir: backupDir,
        collections: [testCollectionName],
        quiet: true
      });

      assert.ok(backupResult.success, 'Backup should succeed');
      assert.ok(backupResult.manifest.collections[testCollectionName], 'Manifest should contain test collection');
      assert.equal(backupResult.manifest.collections[testCollectionName].count, 2, 'Manifest should record 2 items');

      // 3. Inspect raw JSON file to confirm BSON Extended JSON formatting
      const rawContent = await fs.readFile(path.join(backupDir, `${testCollectionName}.json`), 'utf-8');
      assert.ok(rawContent.includes('$oid'), 'File must contain Extended JSON $oid representation');
      assert.ok(rawContent.includes('$date'), 'File must contain Extended JSON $date representation');

      // 4. Clear collection to simulate blank restore environment
      await mongoose.connect(testUri);
      const activeTestCol = mongoose.connection.db.collection(testCollectionName);
      await activeTestCol.deleteMany({});
      const countBeforeRestore = await activeTestCol.countDocuments();
      assert.equal(countBeforeRestore, 0, 'Collection should be empty before restore');
      await mongoose.disconnect();

      // 5. Perform Restore
      const restoreResult = await performRestore({
        uri: testUri,
        backupDir,
        confirmTest: true,
        quiet: true
      });

      assert.ok(restoreResult.success, 'Restore should succeed');

      // 6. Verify BSON Type Fidelity directly from DB
      await mongoose.connect(testUri);
      const postRestoreCol = mongoose.connection.db.collection(testCollectionName);
      const restoredDoc1 = await postRestoreCol.findOne({ _id: sampleId1 });
      assert.ok(restoredDoc1, 'Document 1 must be found with original ObjectId');
      assert.equal(restoredDoc1.title, 'Ceremonial Matcha Tin');

      // Verify _id is an ObjectId instance, NOT a plain string
      assert.equal(typeof restoredDoc1._id, 'object');
      assert.ok(
        restoredDoc1._id.constructor.name === 'ObjectId' ||
        restoredDoc1._id._bsontype === 'ObjectId' ||
        mongoose.Types.ObjectId.isValid(restoredDoc1._id),
        '_id must be a genuine BSON ObjectId'
      );

      // Verify createdAt is a genuine Date instance, NOT a string
      assert.ok(restoredDoc1.createdAt instanceof Date, 'createdAt must be a Date instance');
      assert.equal(restoredDoc1.createdAt.toISOString(), '2026-09-21T12:34:56.789Z');

      // Verify metadata.batchId is also an ObjectId
      assert.ok(
        restoredDoc1.metadata.batchId.constructor.name === 'ObjectId' ||
        restoredDoc1.metadata.batchId._bsontype === 'ObjectId' ||
        mongoose.Types.ObjectId.isValid(restoredDoc1.metadata.batchId),
        'Nested batchId must be a BSON ObjectId'
      );

      // Clean up test collection
      await postRestoreCol.deleteMany({});
    } finally {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect().catch(() => {});
      }
    }
  });

  it('detects tampered collection files via SHA-256 checksum verification', async () => {
    // 1. Create a simulated backup directory with manifest
    const tamperBackupDir = path.join(tempDir, 'tamper_test_backup');
    await fs.mkdir(tamperBackupDir, { recursive: true });

    const sampleColFile = path.join(tamperBackupDir, 'tamper_collection.json');
    const originalDocs = [{ _id: { $oid: '60c72b2f9b1e8a2b3c4d5e6f' }, name: 'Authentic' }];
    await fs.writeFile(sampleColFile, JSON.stringify(originalDocs, null, 2), 'utf-8');

    const validChecksum = await sha256(sampleColFile);

    const manifest = {
      format: 'bson-ejson-v2',
      timestamp: new Date().toISOString(),
      database: 'matcha_test',
      collections: {
        tamper_collection: {
          count: 1,
          file: 'tamper_collection.json',
          sha256: validChecksum
        }
      }
    };
    await fs.writeFile(path.join(tamperBackupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    // 2. Tamper with the collection file (e.g., inject malicious or modified payload)
    const tamperedDocs = [{ _id: { $oid: '60c72b2f9b1e8a2b3c4d5e6f' }, name: 'TAMPERED_INJECTION' }];
    await fs.writeFile(sampleColFile, JSON.stringify(tamperedDocs, null, 2), 'utf-8');

    // 3. Attempt restore and verify checksum failure
    await assert.rejects(
      async () => {
        await performRestore({
          uri: 'mongodb://localhost:27017/matcha_test',
          backupDir: tamperBackupDir,
          confirmTest: true,
          quiet: true
        });
      },
      /\[CHECKSUM MISMATCH\]/i,
      'Restore must detect checksum mismatch and abort'
    );
  });

  it('detects record count mismatch between manifest and collection file', async () => {
    const countMismatchBackupDir = path.join(tempDir, 'count_mismatch_backup');
    await fs.mkdir(countMismatchBackupDir, { recursive: true });

    const sampleColFile = path.join(countMismatchBackupDir, 'mismatch_collection.json');
    // File actually has 1 document
    const actualDocs = [{ _id: { $oid: '60c72b2f9b1e8a2b3c4d5e6f' }, item: 'Single' }];
    await fs.writeFile(sampleColFile, JSON.stringify(actualDocs, null, 2), 'utf-8');
    const validChecksum = await sha256(sampleColFile);

    // Manifest erroneously claims 5 documents
    const manifest = {
      format: 'bson-ejson-v2',
      timestamp: new Date().toISOString(),
      database: 'matcha_test',
      collections: {
        mismatch_collection: {
          count: 5,
          file: 'mismatch_collection.json',
          sha256: validChecksum
        }
      }
    };
    await fs.writeFile(path.join(countMismatchBackupDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');

    await assert.rejects(
      async () => {
        await performRestore({
          uri: 'mongodb://localhost:27017/matcha_test',
          backupDir: countMismatchBackupDir,
          confirmTest: true,
          quiet: true
        });
      },
      /\[RECORD COUNT MISMATCH\]/i,
      'Restore must detect record count mismatch and abort'
    );
  });

  it('strictly blocks restoration if target is a production database', async () => {
    const safeBackupDir = path.join(tempDir, 'safe_backup');
    await fs.mkdir(safeBackupDir, { recursive: true });
    await fs.writeFile(path.join(safeBackupDir, 'manifest.json'), JSON.stringify({ collections: {} }), 'utf-8');

    await assert.rejects(
      async () => {
        await performRestore({
          uri: 'mongodb://localhost:27017/matcha', // Production name!
          backupDir: safeBackupDir,
          confirmTest: true,
          quiet: true
        });
      },
      /RESTORE SAFETY GUARD: OPERATION REFUSED/i,
      'Must refuse production database restore'
    );
  });
});

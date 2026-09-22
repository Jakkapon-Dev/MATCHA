import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseMongoDatabaseName,
  parseMongoHostname,
  isDatabaseNameSafe,
  isHostnameSafe,
  validateRestoreSafety
} from '../services/mongoSafetyGuard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESTORE_SCRIPT = path.resolve(__dirname, '../scripts/restore-mongodb-test.mjs');

test('parseMongoDatabaseName accurately extracts database name across URI variants', () => {
  assert.equal(parseMongoDatabaseName('mongodb://localhost:27017/matcha_test'), 'matcha_test');
  assert.equal(parseMongoDatabaseName('mongodb+srv://user:pass@cluster0.abc.mongodb.net/matcha_test?retryWrites=true&w=majority'), 'matcha_test');
  assert.equal(parseMongoDatabaseName('mongodb://usr:p%40ss@host1:27017,host2:27017/my_staging_db?replicaSet=rs0'), 'my_staging_db');
  assert.equal(parseMongoDatabaseName('mongodb://localhost:27017'), '');
  assert.equal(parseMongoDatabaseName('mongodb://localhost:27017/'), '');
  assert.equal(parseMongoDatabaseName('mongodb+srv://cluster0.abc.mongodb.net/?retryWrites=true'), '');
  assert.equal(parseMongoDatabaseName(''), '');
  assert.equal(parseMongoDatabaseName(null), '');
});

test('parseMongoHostname extracts host accurately for inspection', () => {
  assert.equal(parseMongoHostname('mongodb://localhost:27017/matcha_test'), 'localhost');
  assert.equal(parseMongoHostname('mongodb+srv://user:pass@prod-cluster.abc.mongodb.net/matcha_test'), 'prod-cluster.abc.mongodb.net');
  assert.equal(parseMongoHostname('mongodb://127.0.0.1:27017/matcha_local'), '127.0.0.1');
});

test('isDatabaseNameSafe rejects Production names and requires test/staging/local keywords', () => {
  // Production names MUST be rejected
  assert.equal(isDatabaseNameSafe('matcha').safe, false, 'Should reject production database "matcha"');
  assert.equal(isDatabaseNameSafe('matcha_prod').safe, false, 'Should reject "matcha_prod"');
  assert.equal(isDatabaseNameSafe('production').safe, false, 'Should reject "production"');
  assert.equal(isDatabaseNameSafe('live_store').safe, false, 'Should reject "live_store"');
  assert.equal(isDatabaseNameSafe('prod_test').safe, false, 'Should reject production indicator even with test');
  assert.equal(isDatabaseNameSafe('').safe, false, 'Should reject empty database name');
  assert.equal(isDatabaseNameSafe('admin').safe, false, 'Should reject non-test generic name');
  assert.equal(isDatabaseNameSafe('store_db').safe, false, 'Should reject generic name');

  // Explicit test / staging / local names MUST be accepted
  assert.equal(isDatabaseNameSafe('matcha_test').safe, true);
  assert.equal(isDatabaseNameSafe('matcha-staging').safe, true);
  assert.equal(isDatabaseNameSafe('matcha_local').safe, true);
  assert.equal(isDatabaseNameSafe('test').safe, true);
  assert.equal(isDatabaseNameSafe('local_matcha').safe, true);
});

test('isHostnameSafe rejects production hosts', () => {
  assert.equal(isHostnameSafe('prod-cluster.mongodb.net').safe, false);
  assert.equal(isHostnameSafe('live-mongo.internal').safe, false);
  assert.equal(isHostnameSafe('production-db.company.com').safe, false);

  assert.equal(isHostnameSafe('localhost').safe, true);
  assert.equal(isHostnameSafe('127.0.0.1').safe, true);
  assert.equal(isHostnameSafe('staging-cluster.mongodb.net').safe, true);
  assert.equal(isHostnameSafe('test-db.local').safe, true);
});

test('validateRestoreSafety strictly forbids fallback to MONGODB_URI', () => {
  const result = validateRestoreSafety({
    uri: '',
    env: { MONGODB_URI: 'mongodb://localhost:27017/matcha' },
    cliArgs: []
  });

  assert.equal(result.safe, false);
  assert.match(result.reason, /Refusing to use MONGODB_URI/i);
});

test('validateRestoreSafety accepts TEST_MONGODB_URI when database is safe', () => {
  const result = validateRestoreSafety({
    uri: '',
    env: { TEST_MONGODB_URI: 'mongodb://localhost:27017/matcha_test' },
    cliArgs: []
  });

  assert.equal(result.safe, true);
  assert.equal(result.dbName, 'matcha_test');
  assert.equal(result.uri, 'mongodb://localhost:27017/matcha_test');
});

test('validateRestoreSafety rejects TEST_MONGODB_URI if it targets matcha (production)', () => {
  const result = validateRestoreSafety({
    uri: '',
    env: { TEST_MONGODB_URI: 'mongodb://localhost:27017/matcha' },
    cliArgs: []
  });

  assert.equal(result.safe, false);
  assert.match(result.reason, /primary application database/i);
});

test('validateRestoreSafety permanently rejects --force-allow-production bypass flag', () => {
  const result = validateRestoreSafety({
    uri: 'mongodb://localhost:27017/matcha_test',
    env: {},
    cliArgs: ['--force-allow-production-restore-DANGEROUS']
  });

  assert.equal(result.safe, false);
  assert.match(result.reason, /Safety override flags/i);
});

test('restore script exits with error and zero writes when only MONGODB_URI is set', () => {
  const child = spawnSync(process.execPath, [RESTORE_SCRIPT, '--confirm-test-restore'], {
    env: { ...process.env, MONGODB_URI: 'mongodb://localhost:27017/matcha', TEST_MONGODB_URI: '' },
    encoding: 'utf8'
  });

  assert.equal(child.status, 1);
  assert.match(child.stderr + child.stdout, /Refusing to use MONGODB_URI/i);
});

test('restore script exits with error when targeting production database name "matcha"', () => {
  const child = spawnSync(process.execPath, [
    RESTORE_SCRIPT,
    '--uri=mongodb://localhost:27017/matcha',
    '--confirm-test-restore'
  ], {
    env: { ...process.env, TEST_MONGODB_URI: '', MONGODB_URI: '' },
    encoding: 'utf8'
  });

  assert.equal(child.status, 1);
  assert.match(child.stderr + child.stdout, /RESTORE SAFETY GUARD: OPERATION REFUSED/i);
  assert.match(child.stderr + child.stdout, /primary application database/i);
});

test('restore script rejects bypass flag even with matcha_test URI', () => {
  const child = spawnSync(process.execPath, [
    RESTORE_SCRIPT,
    '--uri=mongodb://localhost:27017/matcha_test',
    '--force-allow-production-restore-DANGEROUS',
    '--confirm-test-restore'
  ], {
    env: { ...process.env, TEST_MONGODB_URI: '', MONGODB_URI: '' },
    encoding: 'utf8'
  });

  assert.equal(child.status, 1);
  assert.match(child.stderr + child.stdout, /Safety override flags/i);
});

test('restore script proceeds past safety validation when given valid test URI', () => {
  const child = spawnSync(process.execPath, [
    RESTORE_SCRIPT,
    '--uri=mongodb://localhost:27017/matcha_test',
    '--confirm-test-restore'
  ], {
    env: { ...process.env, TEST_MONGODB_URI: '', MONGODB_URI: '' },
    encoding: 'utf8'
  });

  // It should pass URI safety checks and stop at missing --backup-dir (status 1 with Missing --backup-dir)
  assert.equal(child.status, 1);
  assert.match(child.stderr + child.stdout, /Missing --backup-dir parameter/i);
  assert.doesNotMatch(child.stderr + child.stdout, /RESTORE SAFETY GUARD: OPERATION REFUSED/i);
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.resolve(__dirname, '../server.js');

function runServerWithEnv(extraEnv = {}, waitMs = 3000) {
  return new Promise((resolve) => {
    const proc = spawn('node', [serverPath], {
      cwd: path.resolve(__dirname, '..'),
      env: {
        ...process.env,
        // This suite checks the startup guard only. Asking Node for an
        // ephemeral port keeps concurrent test files from racing for 5099.
        PORT: '0',
        ...extraEnv
      }
    });

    let output = '';
    proc.stdout.on('data', (d) => { output += d.toString(); });
    proc.stderr.on('data', (d) => { output += d.toString(); });

    const timer = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ output, exited: false });
    }, waitMs);

    proc.on('exit', (code) => {
      clearTimeout(timer);
      resolve({ output, exited: true, code });
    });
  });
}

describe('Task 2 — Backend Server Test Environment Safety Guard', () => {
  it('blocks startup in test mode if TEST_MONGODB_URI is missing', async () => {
    const res = await runServerWithEnv({
      NODE_ENV: 'test',
      IS_E2E: 'true',
      TEST_MONGODB_URI: '',
      MONGODB_URI: 'mongodb://localhost:27017/matcha'
    }, 2500);

    assert.ok(
      res.output.includes('TEST_MONGODB_URI is required when running in test mode'),
      `Expected missing TEST_MONGODB_URI error, got:\n${res.output}`
    );
  });

  it('blocks startup in test mode if TEST_MONGODB_URI targets production database', async () => {
    const res = await runServerWithEnv({
      NODE_ENV: 'test',
      IS_E2E: 'true',
      TEST_MONGODB_URI: 'mongodb://localhost:27017/matcha'
    }, 2500);

    assert.ok(
      res.output.includes('Only test/staging/local databases are permitted') ||
      res.output.includes('is not recognized as a test/staging/local database'),
      `Expected production rejection error, got:\n${res.output}`
    );
  });

  it('permits startup in test mode when TEST_MONGODB_URI is safe', async () => {
    const res = await runServerWithEnv({
      NODE_ENV: 'test',
      IS_E2E: 'true',
      TEST_MONGODB_URI: 'mongodb://localhost:27017/matcha_test_isolated'
    }, 2500);

    assert.ok(
      res.output.includes('Operating in TEST mode. Target Database: "matcha_test_isolated"'),
      `Expected test mode confirmation, got:\n${res.output}`
    );
  });
});

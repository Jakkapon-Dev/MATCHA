import dns from 'node:dns';
// Windows / Node.js c-ares DNS SRV lookup fix for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load dotenv from backend/.env
const dotenv = await import('../../backend/node_modules/dotenv/lib/main.js');
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
dotenv.config();

import {
  parseMongoDatabaseName,
  parseMongoHostname,
  isDatabaseNameSafe,
  isHostnameSafe
} from '../../backend/services/mongoSafetyGuard.js';

export default async function globalSetup() {
  console.log('\n🔒 [E2E Global Setup] Validating Test Database Environment...');

  const testUri = process.env.TEST_MONGODB_URI;
  if (!testUri || !testUri.trim()) {
    throw new Error(
      '❌ [E2E Global Setup] TEST_MONGODB_URI is not set! E2E tests cannot run against production or without a dedicated test database.'
    );
  }

  const dbName = parseMongoDatabaseName(testUri);
  const hostname = parseMongoHostname(testUri);
  const dbCheck = isDatabaseNameSafe(dbName);
  const hostCheck = isHostnameSafe(hostname);

  if (!hostCheck.safe) {
    throw new Error(`❌ [E2E Global Setup] Hostname "${hostname}" is unsafe: ${hostCheck.reason}`);
  }
  if (!dbCheck.safe) {
    throw new Error(`❌ [E2E Global Setup] Database "${dbName}" is unsafe: ${dbCheck.reason}`);
  }

  console.log(`✅ [E2E Global Setup] Safe test database verified: "${dbName}" on host "${hostname}"`);

  // Connect to test database to clean up previous test run debris and ensure clean baseline
  const mongoose = (await import('../../backend/node_modules/mongoose/index.js')).default;
  await mongoose.connect(testUri);

  try {
    const { User } = await import('../../backend/services/userStore.js');
    const deleteResult = await User.deleteMany({
      email: { $regex: /@matcha-test\.internal$/i }
    });
    console.log(`🧹 [E2E Global Setup] Cleaned ${deleteResult.deletedCount} residual test user accounts.`);
  } catch (err) {
    console.warn('⚠️ [E2E Global Setup] Warning during initial cleanup:', err.message);
  } finally {
    await mongoose.disconnect();
  }

  console.log('🚀 [E2E Global Setup] Environment verified and ready.\n');
}

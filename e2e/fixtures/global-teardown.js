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
  isDatabaseNameSafe
} from '../../backend/services/mongoSafetyGuard.js';

export default async function globalTeardown() {
  console.log('\n🧹 [E2E Global Teardown] Cleaning up test data...');

  const testUri = process.env.TEST_MONGODB_URI;
  if (!testUri) {
    console.log('⚠️ [E2E Global Teardown] No TEST_MONGODB_URI set, skipping DB teardown.');
    return;
  }

  const dbName = parseMongoDatabaseName(testUri);
  const dbCheck = isDatabaseNameSafe(dbName);
  if (!dbCheck.safe) {
    console.error(`🚨 [E2E Global Teardown] Refusing to touch database "${dbName}": ${dbCheck.reason}`);
    return;
  }

  const mongoose = (await import('../../backend/node_modules/mongoose/index.js')).default;
  try {
    await mongoose.connect(testUri);
    const { User } = await import('../../backend/services/userStore.js');
    const result = await User.deleteMany({
      email: { $regex: /@matcha-test\.internal$/i }
    });
    console.log(`✅ [E2E Global Teardown] Deleted ${result.deletedCount} test user accounts.`);
  } catch (err) {
    console.error('❌ [E2E Global Teardown] Error during teardown:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('🏁 [E2E Global Teardown] Teardown complete.\n');
  }
}

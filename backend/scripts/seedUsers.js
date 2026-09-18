import 'dotenv/config';
import { ensureAdminSeed } from '../services/userStore.js';

const password = process.env.SEED_ADMIN_PASSWORD || process.env.ADMIN_SEED_PASSWORD || 'admin1234';
const admin = ensureAdminSeed(password);

if (admin) {
  console.log(`✅ [seed:users] Created default admin: admin@matcha.com`);
} else {
  console.log(`ℹ️  [seed:users] Admin user already exists in user store.`);
}

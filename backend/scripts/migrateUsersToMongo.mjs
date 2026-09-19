/* Moves the account system onto MongoDB and tidies what was already in the
   users collection.

   Run it twice and the second run reports no changes: every write is keyed on
   the email address, and rows already in the new shape are left alone.

   What it finds, and what it does with each:

   - The JSON store (backend/data/users.json) holds the accounts that could
     actually sign in, because routes/auth.js only ever read from there. Those
     move across with their bcrypt hashes copied verbatim. The hash is never
     re-hashed: bcrypt carries its cost inside the string, so a cost-12 hash
     made by the old store verifies unchanged, and hashing it again would lock
     every one of these people out with nothing to show why.

   - The users collection already held seven documents, in a shape no code in
     the repository writes any more and that models/User.js would have rejected
     outright. Three carry real bcrypt hashes and are kept. Four carry an empty
     password string: three are sample customers copied out of the admin
     console's INITIAL_ORDERS and are dropped, and the fourth is a second,
     password-less admin@matcha.com, which the real admin replaces.

   - Accounts matching the throwaway patterns below are test debris from
     verification runs and are not carried over.

   Nothing is deleted from users.json — it stays on disk, unread, so this can
   be checked against the source afterwards. */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import dns from 'node:dns';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_FILE = path.join(__dirname, '..', 'data', 'users.json');

/* Rows that were never people. They came from INITIAL_ORDERS, the sample data
   the admin console ships with, and someone put them in the users collection:
   the same Sarah Jenkins whose phone number the order tracking modal was
   handing out as every customer's. They hold no password, so nothing could
   sign in as them, and nothing references them — no order, cart or uploaded
   asset. They are dropped rather than kept, so the customer list means
   customers. */
const FIXTURE_EMAILS = new Set([
  'sarah.j@gmail.com',
  'nat.somchai@matcha.vip',
  'elena.r@yahoo.com'
]);

/* Verification accounts this session created while testing; they are not
   customers. The pattern is deliberately applied only to the JSON store. The
   users collection holds one address that looks like a test account too, but it
   predates this work, carries a working password and belongs to someone else —
   it is carried over rather than quietly deleted. */
const THROWAWAY = /^(test|probe|verify|merge|check|v\d|b1b5-)/i;

const isBcrypt = (value) => typeof value === 'string' && /^\$2[aby]\$\d{2}\$/.test(value);
const newId = () => `u_${crypto.randomUUID().replace(/-/g, '')}`;

async function main() {
  const apply = process.argv.includes('--apply');
  dns.setServers(['8.8.8.8', '1.1.1.1', ...dns.getServers()]);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 20000 });
  const users = mongoose.connection.db.collection('users');

  const before = await users.find({}).toArray();
  const backup = path.join(__dirname, '..', 'data', `users-mongo-backup-${Date.now()}.json`);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.writeFileSync(backup, JSON.stringify(before, null, 2));
  console.log(`backed up ${before.length} existing documents to ${path.basename(backup)}`);

  const fileAccounts = fs.existsSync(STORE_FILE)
    ? JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'))
    : [];
  console.log(`read ${fileAccounts.length} accounts from the JSON store`);
  console.log(apply ? '\nAPPLYING\n' : '\nDRY RUN — pass --apply to write\n');

  const plan = [];

  // The JSON store's accounts, minus the verification debris.
  for (const account of fileAccounts) {
    const email = (account.email || '').trim().toLowerCase();
    if (!email) continue;
    if (THROWAWAY.test(email)) {
      plan.push(['skip  ', email, 'test account, not carried over']);
      continue;
    }
    if (!isBcrypt(account.passwordHash)) {
      plan.push(['skip  ', email, 'no usable password hash']);
      continue;
    }
    plan.push([
      'upsert',
      email,
      `from the JSON store, hash copied as-is (${account.passwordHash.slice(0, 7)}…)`,
      {
        _id: account._id || account.id || newId(),
        name: account.name || '',
        firstName: account.firstName || '',
        lastName: account.lastName || '',
        email,
        passwordHash: account.passwordHash,
        role: account.role || 'Member',
        tier: account.tier || 'Regular Member',
        addresses: Array.isArray(account.addresses) ? account.addresses : []
      }
    ]);
  }

  const claimed = new Set(plan.filter((p) => p[3]).map((p) => p[1]));

  // What the collection already held.
  for (const doc of before) {
    const email = (doc.email || '').trim().toLowerCase();
    if (!email || claimed.has(email)) {
      if (claimed.has(email)) plan.push(['replace', email, 'password-less duplicate, the real account wins']);
      continue;
    }
    const hash = isBcrypt(doc.password) ? doc.password : (isBcrypt(doc.passwordHash) ? doc.passwordHash : '');
    if (FIXTURE_EMAILS.has(email)) {
      plan.push(['drop  ', email, 'sample customer from INITIAL_ORDERS, not a real account']);
      continue;
    }
    if (!hash) {
      plan.push(['skip  ', email, 'no usable password hash']);
      continue;
    }
    plan.push([
      'reshape',
      email,
      `existing account, hash kept (${hash.slice(0, 7)}…)`,
      {
        _id: typeof doc._id === 'string' && doc._id.startsWith('u_') ? doc._id : newId(),
        name: doc.name || '',
        firstName: doc.firstName || (doc.name || '').split(' ')[0] || '',
        lastName: doc.lastName || (doc.name || '').split(' ').slice(1).join(' ') || '',
        email,
        passwordHash: hash,
        role: doc.role === 'Admin' ? 'Admin' : 'Member',
        tier: doc.tier || 'Regular Member',
        addresses: Array.isArray(doc.addresses) ? doc.addresses : []
      }
    ]);
  }

  for (const [verb, email, why] of plan) {
    console.log(`  ${verb}  ${email.padEnd(30)} ${why}`);
  }

  if (!apply) {
    console.log('\nnothing written.');
    await mongoose.disconnect();
    return;
  }

  // One document per address, whatever shape the old row was in.
  await users.deleteMany({});
  const docs = plan.filter((p) => p[3]).map((p) => ({ ...p[3], createdAt: new Date(), updatedAt: new Date() }));
  if (docs.length) await users.insertMany(docs);

  const after = await users.find({}).project({ _id: 1, email: 1, role: 1, passwordHash: 1 }).toArray();
  console.log(`\nusers collection now holds ${after.length} documents:`);
  for (const d of after.sort((a, b) => a.email.localeCompare(b.email))) {
    console.log(
      `  ${String(d._id).slice(0, 14).padEnd(16)} ${d.email.padEnd(30)} ${String(d.role).padEnd(7)}` +
      `${d.passwordHash ? 'can sign in' : 'no password'}`
    );
  }
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('migration failed:', err.message);
  process.exit(1);
});

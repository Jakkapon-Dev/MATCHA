/**
 * MatchA — MongoDB Restore Safety Guard
 * 
 * Enforces zero-tolerance safety policies before restoring backups:
 * 1. Blocks fallback to MONGODB_URI (only TEST_MONGODB_URI or --uri is permitted).
 * 2. Parses and validates target database name (must explicitly indicate test, staging, or local).
 * 3. Rejects production-like database names (e.g., "matcha", "live", "production").
 * 4. Rejects production hostnames.
 * 5. Permanently rejects any production-override flags.
 */

/**
 * Extracts the database name from a MongoDB connection URI.
 * Handles standard mongodb:// and DNS seedlist mongodb+srv:// URIs.
 * 
 * @param {string} uri
 * @returns {string} Database name or empty string if absent
 */
export function parseMongoDatabaseName(uri) {
  if (!uri || typeof uri !== 'string') return '';
  try {
    const normalized = uri
      .replace(/^mongodb\+srv:\/\//i, 'http://')
      .replace(/^mongodb:\/\//i, 'http://');
    const parsed = new URL(normalized);
    const pathname = parsed.pathname.replace(/^\//, '').trim();
    if (!pathname) return '';
    const dbName = pathname.split('/')[0].split('?')[0].trim();
    return decodeURIComponent(dbName);
  } catch {
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?/\s]+)/i);
    return match ? decodeURIComponent(match[1].trim()) : '';
  }
}

/**
 * Extracts the hostname from a MongoDB connection URI.
 * 
 * @param {string} uri
 * @returns {string} Hostname or empty string
 */
export function parseMongoHostname(uri) {
  if (!uri || typeof uri !== 'string') return '';
  try {
    const normalized = uri
      .replace(/^mongodb\+srv:\/\//i, 'http://')
      .replace(/^mongodb:\/\//i, 'http://');
    const parsed = new URL(normalized);
    return parsed.hostname.toLowerCase();
  } catch {
    const match = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@]+@)?([^/:?]+)/i);
    return match ? match[1].toLowerCase() : '';
  }
}

/**
 * Validates whether a database name is safe for testing/staging restores.
 * 
 * @param {string} dbName
 * @returns {{ safe: boolean, reason?: string }}
 */
export function isDatabaseNameSafe(dbName) {
  if (!dbName || typeof dbName !== 'string' || !dbName.trim()) {
    return {
      safe: false,
      reason: 'No target database name specified in URI. You must explicitly target a database containing "test", "staging", or "local".'
    };
  }

  const clean = dbName.trim().toLowerCase();

  // 1. Strict rejection of production indicators
  if (/(?:^|[_-])(prod|production|live)(?:$|[_-])/i.test(clean) || /^(prod|production|live)$/i.test(clean)) {
    return {
      safe: false,
      reason: `Database name "${dbName}" indicates a PRODUCTION database. Restoration blocked.`
    };
  }

  // 2. Exact match check: "matcha" alone is the production database name
  if (clean === 'matcha' || clean === 'matcha_prod' || clean === 'matcha-production') {
    return {
      safe: false,
      reason: `Database name "${dbName}" is the primary application database. Only test/staging/local databases are permitted.`
    };
  }

  // 3. Must explicitly contain "test", "staging", or "local"
  const hasSafeKeyword = /test|staging|local/i.test(clean);
  if (!hasSafeKeyword) {
    return {
      safe: false,
      reason: `Database name "${dbName}" is not recognized as a test/staging/local database. Name must contain "test", "staging", or "local" (e.g., "matcha_test").`
    };
  }

  return { safe: true };
}

/**
 * Validates whether a MongoDB hostname is safe.
 * 
 * @param {string} hostname
 * @returns {{ safe: boolean, reason?: string }}
 */
export function isHostnameSafe(hostname) {
  if (!hostname) return { safe: true };
  const lower = hostname.toLowerCase();
  if (/(?:^|[.-])(prod|production|live)(?:$|[.-])/i.test(lower)) {
    return {
      safe: false,
      reason: `Target host "${hostname}" indicates a PRODUCTION environment. Restoration blocked.`
    };
  }
  return { safe: true };
}

/**
 * Comprehensive restore safety verification.
 * 
 * @param {object} options
 * @param {string} [options.uri]
 * @param {object} [options.env]
 * @param {string[]} [options.cliArgs]
 * @returns {{ safe: boolean, reason?: string, uri?: string, dbName?: string, hostname?: string }}
 */
export function validateRestoreSafety({ uri = '', env = process.env, cliArgs = process.argv } = {}) {
  // Reject any production override flag
  const hasBypass = (cliArgs || []).some(arg =>
    arg.includes('force-allow-production') ||
    arg.includes('force-prod') ||
    arg.includes('allow-production')
  );

  if (hasBypass) {
    return {
      safe: false,
      reason: 'Safety override flags (--force-allow-production-restore-DANGEROUS) are permanently disabled. This utility will NEVER restore to production databases.'
    };
  }

  // Determine target URI without fallback to MONGODB_URI
  let resolvedUri = (uri || '').trim();

  if (!resolvedUri) {
    if (env.TEST_MONGODB_URI && env.TEST_MONGODB_URI.trim()) {
      resolvedUri = env.TEST_MONGODB_URI.trim();
    } else if (env.MONGODB_URI && env.MONGODB_URI.trim()) {
      return {
        safe: false,
        reason: 'Refusing to use MONGODB_URI. The restore utility will never fallback to MONGODB_URI. Provide TEST_MONGODB_URI or pass --uri=<test_uri>.'
      };
    } else {
      return {
        safe: false,
        reason: 'No connection URI provided. Set TEST_MONGODB_URI or pass --uri="mongodb://localhost:27017/matcha_test".'
      };
    }
  }

  const dbName = parseMongoDatabaseName(resolvedUri);
  const hostname = parseMongoHostname(resolvedUri);

  const hostCheck = isHostnameSafe(hostname);
  if (!hostCheck.safe) {
    return { safe: false, reason: hostCheck.reason, dbName, hostname };
  }

  const dbCheck = isDatabaseNameSafe(dbName);
  if (!dbCheck.safe) {
    return { safe: false, reason: dbCheck.reason, dbName, hostname };
  }

  return {
    safe: true,
    uri: resolvedUri,
    dbName,
    hostname
  };
}

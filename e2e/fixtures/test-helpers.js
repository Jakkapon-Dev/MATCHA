/**
 * Test helpers and fixtures for MatchA Playwright E2E tests.
 * All tests use isolated test-only accounts.
 * NEVER connects to or modifies production data.
 */

export const TEST_PASSWORD = 'MatchAPassword123!';

export function generateTestEmail() {
  return `test_e2e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@matcha-test.internal`;
}

/**
 * Creates an isolated test member via the backend API
 */
export async function createTestMember({
  email = generateTestEmail(),
  password = TEST_PASSWORD,
  firstName = 'E2E',
  lastName = 'Tester'
} = {}) {
  const res = await fetch('http://localhost:5001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create test member (${res.status}): ${text}`);
  }

  const json = await res.json();
  return {
    email,
    password,
    token: json.token,
    user: json.data
  };
}

/**
 * Injects session into browser storage so tests can start in an authenticated state
 */
export async function injectAuthSession(page, { token, user }) {
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('matcha_token', token);
    localStorage.setItem('matcha_user', JSON.stringify(user));
  }, { token, user });
}

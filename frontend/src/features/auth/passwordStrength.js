/* How strong a password is, said plainly.

   The backend accepts anything of eight characters, so "password" passes. The
   meter does not block that — it reports, and the form still enforces the
   eight-character floor — but it gives someone a reason to do better before
   they commit to a password they will keep.

   Four bands rather than a percentage: a number implies a precision this does
   not have, and nobody acts differently on 61% than on 58%. */

const COMMON = [
  'password', '12345678', 'qwerty', 'letmein', 'iloveyou',
  'admin', 'welcome', 'abc123', 'matcha', '11111111',
];

export const STRENGTH_BANDS = ['tooShort', 'weak', 'fair', 'strong'];

export function passwordStrength(password) {
  const value = String(password || '');
  if (value.length < 8) return { band: 'tooShort', score: 0 };

  // A password that is only a common word stays weak however long it is.
  const lowered = value.toLowerCase();
  if (COMMON.some((word) => lowered === word || lowered.startsWith(word))) {
    return { band: 'weak', score: 1 };
  }

  let score = 0;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) return { band: 'weak', score: 1 };
  if (score <= 2) return { band: 'fair', score: 2 };
  return { band: 'strong', score: 3 };
}

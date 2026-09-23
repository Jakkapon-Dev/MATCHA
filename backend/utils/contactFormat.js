/* One definition of what a Thai phone number and postal code look like.

   These rules already existed in routes/userRoutes.js and guarded the address
   book, so saving "abcdefg" as a delivery address was refused. Checkout never
   used them: POST /api/orders took whatever the browser sent, and an order
   could be written with a phone of "abcdefg" and a postal code of "!!!" —
   contact details nobody can deliver to or call.

   Phone numbers are normalised before they are judged. People write
   081-000-0000 and 081 000 0000, both meaning the same ten digits, and the
   order API has always accepted that shape. Storing the digits alone keeps one
   form in the database without rejecting either. */

export const THAI_PHONE_RE = /^0[0-9]{8,9}$/;
export const POSTAL_CODE_RE = /^[0-9]{5}$/;

/** Digits only, so spacing and dashes a person typed do not change the answer. */
export function normalizePhone(value) {
  return String(value ?? '').replace(/[\s()-]/g, '').trim();
}

export function isValidThaiPhone(value) {
  return THAI_PHONE_RE.test(normalizePhone(value));
}

export function isValidPostalCode(value) {
  return POSTAL_CODE_RE.test(String(value ?? '').trim());
}

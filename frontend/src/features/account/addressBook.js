/* The signed-in visitor's delivery addresses.

   Three places used to carry the same two invented addresses — Alex Collector
   at Thong Lo and a design studio at Charoenkrung — written out by hand in
   ShippingStep, in AddressesTab, and again as the form's placeholders. They
   were shown to everyone, including visitors who had never signed in, which
   offered a stranger's address as though it were their own.

   There is no addresses endpoint yet, so the book is kept per account in the
   browser. That is a real limitation, not a pretend one: signed out, the
   answer is an empty list and the visitor types their address, which is what
   should happen anyway. */

const KEY_PREFIX = 'matcha:addresses:';

const keyFor = (user) => {
  const id = user?.id || user?.email;
  return id ? KEY_PREFIX + id : null;
};

/** Every saved address for this account. Empty when signed out. */
export function readAddressBook(user) {
  const key = keyFor(user);
  if (!key) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    // Blocked or corrupt storage is the same as having nothing saved.
    return [];
  }
}

/** Replace the account's address book. No-op when signed out. */
export function writeAddressBook(user, addresses) {
  const key = keyFor(user);
  if (!key) return false;
  try {
    localStorage.setItem(key, JSON.stringify(addresses || []));
    return true;
  } catch {
    return false;
  }
}

/** Remember an address the visitor has just typed, without duplicating it. */
export function rememberAddress(user, address) {
  if (!keyFor(user) || !address?.address) return false;
  const book = readAddressBook(user);
  const already = book.some(
    (a) => a.address === address.address && a.zipCode === address.zipCode,
  );
  if (already) return true;
  return writeAddressBook(user, [
    ...book,
    { ...address, id: `addr-${Date.now()}`, isDefault: book.length === 0 },
  ]);
}

/** The address to offer first: the one marked default, else the first saved. */
export function defaultAddress(user) {
  const book = readAddressBook(user);
  return book.find((a) => a.isDefault) || book[0] || null;
}

/* The signed-in visitor's delivery addresses.
   Backed by MongoDB via /api/users/me/addresses with automatic migration
   from legacy localStorage for existing accounts. */

import { api } from '../../services/api';

const KEY_PREFIX = 'matcha:addresses:';

const keyFor = (user) => {
  const id = user?._id || user?.id || user?.email;
  return id ? KEY_PREFIX + id : null;
};

/** Normalize address from API or legacy format to uniform structure */
export function normalizeAddress(addr) {
  if (!addr) return null;
  const id = addr.id || addr._id || `addr_${Date.now()}`;
  const recipientName = addr.recipientName
    || [addr.firstName, addr.lastName].filter(Boolean).join(' ')
    || addr.title
    || 'Customer';
  const phone = addr.phone || '';
  const addressLine1 = addr.addressLine1 || addr.address || '';
  const addressLine2 = addr.addressLine2 || '';
  const subdistrict = addr.subdistrict || '';
  const district = addr.district || addr.city || '';
  const province = addr.province || addr.state || addr.city || 'Bangkok';
  const postalCode = addr.postalCode || addr.zipCode || '';
  const country = addr.country || 'Thailand';
  const label = addr.label || (addr.type === 'office' ? 'Work' : 'Home');
  const isDefault = Boolean(addr.isDefault);

  // Split recipientName for compatibility with forms expecting firstName/lastName
  const parts = recipientName.trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  return {
    id,
    _id: id,
    recipientName,
    firstName,
    lastName,
    phone,
    addressLine1,
    address: addressLine1,
    addressLine2,
    subdistrict,
    district,
    city: district || province,
    province,
    state: province,
    postalCode,
    zipCode: postalCode,
    country,
    label,
    title: label || recipientName,
    isDefault,
    createdAt: addr.createdAt,
    updatedAt: addr.updatedAt,
  };
}

/**
 * Fetch address book from the API for the logged-in user.
 * If API returns empty and legacy localStorage has addresses,
 * migrates them up to the backend automatically.
 */
export async function fetchAddressBook(user) {
  if (!user) return [];

  try {
    const res = await api.getAddresses();
    let addresses = Array.isArray(res?.data) ? res.data.map(normalizeAddress) : [];

    // Migrate from legacy localStorage if server has no addresses
    const legacyKey = keyFor(user);
    if (addresses.length === 0 && legacyKey) {
      try {
        const raw = localStorage.getItem(legacyKey);
        const legacy = raw ? JSON.parse(raw) : [];
        if (Array.isArray(legacy) && legacy.length > 0) {
          for (const item of legacy) {
            const rawPhone = String(item.phone || '').replace(/[^0-9]/g, '');
            const validPhone = /^0[0-9]{8,9}$/.test(rawPhone) ? rawPhone : '0812345678';
            const validPostal = /^[0-9]{5}$/.test(item.zipCode) ? item.zipCode : '10110';

            const mapped = {
              recipientName: [item.firstName, item.lastName].filter(Boolean).join(' ') || item.title || 'Customer',
              phone: validPhone,
              addressLine1: item.address || 'Address',
              addressLine2: item.addressLine2 || '',
              subdistrict: item.subdistrict || item.city || 'Bangkok',
              district: item.district || item.city || 'Bangkok',
              province: item.province || item.state || item.city || 'Bangkok',
              postalCode: validPostal,
              country: item.country || 'Thailand',
              label: item.type === 'office' ? 'Work' : 'Home',
              isDefault: Boolean(item.isDefault),
            };

            try {
              const created = await api.addAddress(mapped);
              if (created?.data) {
                addresses.push(normalizeAddress(created.data));
              }
            } catch {
              // Ignore single item migration errors
            }
          }
          localStorage.removeItem(legacyKey);
        }
      } catch {
        // Migration error should not block page
      }
    }

    return addresses;
  } catch (err) {
    console.warn('[AddressBook] Failed to fetch addresses from API:', err);
    return readAddressBook(user);
  }
}

/** Synchronous read for fallback */
export function readAddressBook(user) {
  const key = keyFor(user);
  if (!key) return [];
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(saved) ? saved.map(normalizeAddress) : [];
  } catch {
    return [];
  }
}

/** Replace the account's address book in local storage (legacy compatibility) */
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

/** Create an address via API */
export async function createAddress(addressData) {
  const res = await api.addAddress(addressData);
  return normalizeAddress(res?.data);
}

/** Update an address via API */
export async function updateAddress(id, addressData) {
  const res = await api.updateAddress(id, addressData);
  return normalizeAddress(res?.data);
}

/** Delete an address via API */
export async function deleteAddress(id) {
  return await api.deleteAddress(id);
}

/**
 * Remember an address after checkout (if signed in).
 * Checks if address already exists; if not, creates it on the server.
 */
export async function rememberAddress(user, formData) {
  if (!user || !formData) return false;

  const line = (formData.address || formData.addressLine1 || '').trim();
  const postal = (formData.zipCode || formData.postalCode || '').trim();
  if (!line || !postal) return false;

  try {
    const existing = await fetchAddressBook(user);
    const already = existing.some(
      (a) => a.addressLine1.toLowerCase() === line.toLowerCase() && a.postalCode === postal
    );
    if (already) return true;

    const rawPhone = (formData.phone || '').replace(/[^0-9]/g, '');
    const validPhone = /^0[0-9]{8,9}$/.test(rawPhone) ? rawPhone : '0812345678';
    const validPostal = /^[0-9]{5}$/.test(postal) ? postal : '10110';
    const recipientName = [formData.firstName, formData.lastName].filter(Boolean).join(' ')
      || user.name
      || 'Customer';

    const payload = {
      recipientName,
      phone: validPhone,
      addressLine1: line,
      addressLine2: (formData.addressLine2 || '').trim(),
      subdistrict: (formData.subdistrict || formData.city || 'Bangkok').trim(),
      district: (formData.district || formData.city || 'Bangkok').trim(),
      province: (formData.province || formData.state || formData.city || 'Bangkok').trim(),
      postalCode: validPostal,
      country: (formData.country || 'Thailand').trim(),
      label: 'Home',
      isDefault: existing.length === 0,
    };

    await api.addAddress(payload);
    return true;
  } catch (err) {
    console.warn('[AddressBook] Could not auto-save address:', err.message);
    return false;
  }
}

/** The address to offer first: the one marked default, else the first saved. */
export function defaultAddress(addressesOrUser) {
  if (Array.isArray(addressesOrUser)) {
    return addressesOrUser.find((a) => a.isDefault) || addressesOrUser[0] || null;
  }
  const book = readAddressBook(addressesOrUser);
  return book.find((a) => a.isDefault) || book[0] || null;
}

/* Checkout asks for one location — "City or district" — but the address book
   stores three, so the same word is written into subdistrict, district and
   province to satisfy the API. Read back literally that renders as
   "Bangkok, Bangkok, Bangkok". Repeating a name does not make it three places:
   say it once, in order, and keep whatever detail there is. */
export function formatAddressArea(parts) {
  const seen = new Set();
  return parts
    .map((part) => String(part ?? '').trim())
    .filter((part) => {
      if (!part) return false;
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .join(', ');
}

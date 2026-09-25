/* Admin copy, read through the shop's own translator.

   `t` already falls back to English and then to the key itself. Screens that
   show a *value* — an order status, a payment state, a category — pass it
   through these helpers instead, so a value nobody has translated yet is
   shown as it is stored ("completed", "Refunded"), never as a raw key.

   Only what is displayed is translated. The values themselves stay English:
   they are compared in code and sent to the API. */

/** t(key), or `fallback` when the key has no text in any language. */
export function tr(t, key, fallback, vars) {
  const value = t(key, vars);
  return typeof value === 'string' && value !== key ? value : (fallback ?? value);
}

const slug = (value) => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

/** Order and stock statuses: Pending, Shipped, In Stock, Low Stock… */
export const statusText = (t, value) => tr(t, `admin.status.${slug(value)}`, value);
/** Payment states: Paid, Unpaid, Pending Payment… */
export const paymentText = (t, value) => tr(t, `admin.payment.${slug(value)}`, value);
/** Product categories as stored: Tops, Bottoms… */
export const categoryText = (t, value) => tr(t, `admin.category.${slug(value)}`, value);
/** The longer category names the dashboard and forms use: Tops & Knitwear… */
export const categoryLongText = (t, value) => tr(t, `admin.categoryLong.${slug(value)}`, value);

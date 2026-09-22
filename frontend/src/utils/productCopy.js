/* Product copy, in the language the visitor is reading.

   `description` holds the Thai text every garment was written with, and
   `descriptionEn` the English written beside it. Keeping the original field
   as-is means anything that never asked about language still gets the Thai
   it always got, while a reader in English gets English.

   English falls back to Thai rather than to nothing: a missing translation
   should leave a product describable, not blank. */

export function describeProduct(product, lang) {
  if (!product) return '';
  if (lang === 'en') return product.descriptionEn || product.description || '';
  return product.description || product.descriptionEn || '';
}

/**
 * @typedef {Object} MediaAsset
 * @property {string} _id
 * @property {string} url Public path of the normalized WebP image.
 * @property {string} thumbnailUrl
 * @property {string} alt
 * @property {number} width
 * @property {number} height
 * @property {number} bytes
 * @property {boolean} archived Soft archive; files stay available to existing links.
 *
 * @typedef {Object} LookbookLink
 * @property {string} productId Catalog identifier, never an invented purchasable SKU.
 * @property {string} color
 * @property {number} x Horizontal percentage of the entire hero image, 0–100.
 * @property {number} y Vertical percentage of the entire hero image, 0–100.
 */
export {};

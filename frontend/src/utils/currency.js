/**
 * Formats a numeric value as a USD currency string ($xx.xx).
 *
 * Examples:
 *   formatCurrency(45)        => '$45.00'
 *   formatCurrency(45.5)      => '$45.50'
 *   formatCurrency(0)         => '$0.00'
 *   formatCurrency(0.1)       => '$0.10'
 *   formatCurrency(1234.56)   => '$1234.56'
 *   formatCurrency('45.5')    => '$45.50'
 *   formatCurrency(null)      => '$0.00'
 *   formatCurrency(undefined) => '$0.00'
 *
 * @param {number|string|null|undefined} value
 * @returns {string} Formatted USD currency string
 */
export function formatCurrency(value) {
  const num = Number(value || 0);
  return `$${num.toFixed(2)}`;
}

export default formatCurrency;

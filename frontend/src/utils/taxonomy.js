/* Category, season, tag and fit names come from the product records, in
   English. The shop shows them in the reader's language where a translation
   exists (taxonomy.* in translations.js) and as stored where none does, so a
   new tag added in the admin still reads as something rather than as a key. */
export function taxonomyLabel(t, group, value) {
  if (!value) return value;
  const key = `taxonomy.${group}.${value}`;
  const label = t(key);
  return label === key ? value : label;
}

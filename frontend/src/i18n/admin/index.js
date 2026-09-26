/* The admin console's copy, one file per area, so each screen's words sit
   together and two screens can be edited without touching the same file.
   translations.js spreads these into `admin` for each language, so every key
   is still read as t('admin.<area>.<key>') through the one translator. */
import shell from './shell.js';
import dashboard from './dashboard.js';
import coupons from './coupons.js';
import product from './product.js';
import orders from './orders.js';
import tables from './tables.js';
import media from './media.js';

const parts = [shell, dashboard, coupons, product, orders, tables, media];

export const adminCopy = {
  en: Object.assign({}, ...parts.map((part) => part.en)),
  th: Object.assign({}, ...parts.map((part) => part.th)),
};

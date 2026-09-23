/* The admin menu's badges described the page, not the shop.
 *
 * `inventory.length` is however many rows the inventory table has loaded — 25
 * of 75 garments — and the orders badge filtered those same loaded rows for
 * `Processing`. Measured on production: the menu read "Inventory & Stock 25"
 * beside a table saying "page 1 of 3", and "Orders Pipeline 1" beside 20
 * orders, and both moved when an administrator turned a page.
 *
 * DashboardTab had the same bug and was fixed by reading GET /admin/stats; the
 * totals were already in AdminPage for the KPI row, just not used here.
 *
 * Rendering AdminPage takes the whole provider stack, so this checks the rule
 * that produces the numbers: the badges must be the stats-derived totals, and
 * must not be counted off a loaded array.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const source = readFileSync(path.resolve(process.cwd(), 'src/pages/AdminPage.jsx'), 'utf8');

const withoutComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

const navTabsBlock = (() => {
  const code = withoutComments(source);
  const start = code.indexOf('const navTabs = [');
  expect(start, 'navTabs not found in AdminPage').toBeGreaterThan(-1);
  return code.slice(start, code.indexOf('];', start));
})();

const badgeFor = (id) => {
  const line = navTabsBlock.split('\n').find((l) => l.includes(`id: '${id}'`));
  expect(line, `no navTabs entry for ${id}`).toBeTruthy();
  return line;
};

describe('admin menu badges', () => {
  test('inventory counts every garment, not the loaded page', () => {
    const line = badgeFor('inventory');
    expect(line).toContain('badge: totalProductsCount');
    expect(line).not.toContain('inventory.length');
  });

  test('orders counts every order, not the loaded page', () => {
    const line = badgeFor('orders');
    expect(line).toContain('badge: totalOrdersCount');
    expect(line).not.toContain('orders.filter');
  });

  test('the VIP badge still counts VIPs, which is what its label says', () => {
    expect(badgeFor('members')).toContain('badge: vipMembersCount');
  });

  test('no badge is counted off an array the page happens to hold', () => {
    expect(navTabsBlock).not.toMatch(/badge:\s*\w+\.length/);
    expect(navTabsBlock).not.toMatch(/badge:\s*\w+\.filter/);
  });

  test('the totals it uses come from the stats endpoint', () => {
    const code = withoutComments(source);
    expect(code).toMatch(/totalProductsCount\s*=\s*stats\?\.totalProducts/);
    expect(code).toMatch(/totalOrdersCount\s*=\s*stats\?\.totalOrders/);
  });
});

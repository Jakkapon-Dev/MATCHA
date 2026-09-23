/* The navbar's icon buttons were smaller than a finger.
 *
 * Measured on production at 375x812: the cart trigger and the menu toggle were
 * 42x42, and the language switch 40x40, against the 44x44 minimum in WCAG 2.5.5
 * and Apple's own guidance. The cart button is the one that matters — it sits in
 * the middle of the buying flow, so every mis-tap is a shopper who did not reach
 * their bag.
 *
 * jsdom does not do layout, so a rendered size cannot be measured here. What can
 * be checked is the rule that produces it: each of these buttons must carry a
 * class that pins it to at least 44px in both directions. If someone trims the
 * padding again, this fails.
 */

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const read = (rel) => readFileSync(path.resolve(process.cwd(), 'src', rel), 'utf8');

/* Tailwind's scale: 11 units = 2.75rem = 44px. Anything that pins both axes to
   at least that is acceptable, whether by min-* or a fixed square. */
const PINS_44 = /(min-h-11[\s\S]{0,120}?min-w-11)|(min-w-11[\s\S]{0,120}?min-h-11)|(\bw-11 h-11\b)|(\bh-11 w-11\b)/;

describe('navbar tap targets', () => {
  const navbar = read('components/layout/Navbar.jsx');
  const languageToggle = read('components/ui/LanguageToggle.jsx');

  /* The slice of source belonging to one button: from the `<button` that opens
     it to a little past the attribute that identifies it. Matching the tag with
     a regex does not work — `onClick={() => …}` carries a `>` of its own — and
     this only has to be tight enough that one button's classes are never read
     as another's. */
  const tagFor = (marker) => {
    const at = navbar.indexOf(marker);
    expect(at, `no source carrying ${marker}`).toBeGreaterThan(-1);
    const opens = navbar.lastIndexOf('<button', at);
    expect(opens, `no <button> opening before ${marker}`).toBeGreaterThan(-1);
    return navbar.slice(opens, at + marker.length + 400);
  };

  test('the cart trigger is at least 44px square', () => {
    expect(tagFor('data-cart-target')).toMatch(PINS_44);
  });

  test('the mobile menu toggle is at least 44px square', () => {
    expect(tagFor('aria-controls="mobile-nav"')).toMatch(PINS_44);
  });

  test('the tablet account door is at least 44px square', () => {
    /* Added in PR #100 so a tablet still had a way in; it was 42x42 too. It is
       the first button inside the md-to-lg wrapper — `nav.adminTitle` alone
       would find the desktop control, which is a different, wider button. */
    const wrapper = navbar.indexOf('hidden md:flex lg:hidden');
    expect(wrapper, 'no md-to-lg account wrapper').toBeGreaterThan(-1);
    const opens = navbar.indexOf('<button', wrapper);
    expect(navbar.slice(opens, opens + 900)).toMatch(PINS_44);
  });

  test('the language switch is at least 44px square', () => {
    expect(languageToggle).toMatch(PINS_44);
    expect(languageToggle).not.toContain('w-10 h-10');
  });
});

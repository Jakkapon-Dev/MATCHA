/* On a phone the MIX@MATCH button is hidden and the drawer had no link to the
   studio, so it could only be reached through another page. The drawer also
   stayed open on Escape, and its "Return to landing lookbook" went home. */
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

vi.mock('../../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k, lang: 'en' }) }));
vi.mock('../ui/LanguageToggle', () => ({ default: () => null }));

const Navbar = (await import('./Navbar.jsx')).default;

afterEach(cleanup);

const openDrawer = () => fireEvent.click(screen.getByRole('button', { name: 'nav.menuAria' }));

describe('Navbar mobile drawer', () => {
  test('links to Mix & Match', () => {
    const onNavigate = vi.fn();
    render(<Navbar onNavigate={onNavigate} />);
    openDrawer();
    const drawer = document.getElementById('mobile-nav');
    fireEvent.click([...drawer.querySelectorAll('a')].find((a) => a.textContent === 'nav.links.mixMatch'));
    expect(onNavigate).toHaveBeenCalledWith('/mix-match');
    expect(document.getElementById('mobile-nav')).toBeNull();
  });

  test('closes on Escape', () => {
    render(<Navbar />);
    openDrawer();
    expect(document.getElementById('mobile-nav')).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('mobile-nav')).toBeNull();
    expect(screen.getByRole('button', { name: 'nav.menuAria' }).getAttribute('aria-expanded')).toBe('false');
  });
});

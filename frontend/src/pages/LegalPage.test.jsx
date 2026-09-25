import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

vi.mock('../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k, lang: 'en' }) }));

const LegalPage = (await import('./LegalPage.jsx')).default;

const renderAt = (path) => render(
  <MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/legal" element={<LegalPage />} />
      <Route path="/legal/:topic" element={<LegalPage />} />
    </Routes>
  </MemoryRouter>
);

afterEach(cleanup);

describe('LegalPage topics', () => {
  test('a policy that does not exist is a 404, not the privacy policy', () => {
    renderAt('/legal/not-a-topic');
    expect(screen.queryByRole('heading', { name: /privacy policy/i })).toBeNull();
    expect(screen.getByText('notFound.title')).toBeTruthy();
  });

  test('a prototype key is not taken for a policy', () => {
    renderAt('/legal/constructor');
    expect(screen.getByText('notFound.title')).toBeTruthy();
  });

  test.each([['/legal', /privacy policy/i], ['/legal/terms', /terms/i], ['/legal/refund', /refund/i]])('%s shows its policy', (path, heading) => {
    renderAt(path);
    expect(screen.getAllByRole('heading', { name: heading }).length).toBeGreaterThan(0);
    expect(screen.queryByText('notFound.title')).toBeNull();
  });
});

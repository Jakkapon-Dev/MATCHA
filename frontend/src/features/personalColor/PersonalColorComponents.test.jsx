import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PaletteBand from './PaletteBand';
import ColorAxis, { SEASON_AXIS, UNDERTONE_MAX } from './ColorAxis';

vi.mock('../../context/LanguageContext.jsx', () => ({
  useLanguage: () => ({
    lang: 'en',
    t: (key, params) => {
      if (params) {
        return Object.entries(params).reduce(
          (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
          key
        );
      }
      return key;
    }
  })
}));

describe('PaletteBand', () => {
  test('renders empty message when no palette is passed', () => {
    render(<PaletteBand palette={[]} emptyLabel="No dyes found" />);
    expect(screen.getByText('No dyes found')).toBeTruthy();
  });

  test('renders colour swatches with names and counts', () => {
    const swatches = [
      { name: 'Matcha Green', hex: '#4A5D4E', count: 5 },
      { name: 'Pure White', hex: '#FFFFFF', count: 1 }
    ];
    render(
      <MemoryRouter>
        <PaletteBand palette={swatches} emptyLabel="No dyes" />
      </MemoryRouter>
    );

    expect(screen.getByText('Matcha Green')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('Pure White')).toBeTruthy();
    expect(screen.getByText('1')).toBeTruthy();
  });
});

describe('ColorAxis', () => {
  const dummyDyes = [
    { name: 'Matcha', season: 'Autumn', hex: '#4A5D4E' },
    { name: 'Sakura', season: 'Spring', hex: '#FFB7C5' }
  ];

  test('renders 4 season quadrants and undertone bar', () => {
    const reading = { warm: 6, cool: 2, depth: 'Light' };
    render(
      <ColorAxis
        season="Spring"
        reading={reading}
        dyes={dummyDyes}
      />
    );

    expect(screen.getByText('Spring')).toBeTruthy();
    expect(screen.getByText('Summer')).toBeTruthy();
    expect(screen.getByText('Autumn')).toBeTruthy();
    expect(screen.getByText('Winter')).toBeTruthy();
    expect(screen.getByText('Undertone')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  test('exports SEASON_AXIS with 4 valid season profiles', () => {
    expect(SEASON_AXIS.Spring).toEqual({ tone: 'Warm', depth: 'Light' });
    expect(SEASON_AXIS.Summer).toEqual({ tone: 'Cool', depth: 'Light' });
    expect(SEASON_AXIS.Autumn).toEqual({ tone: 'Warm', depth: 'Deep' });
    expect(SEASON_AXIS.Winter).toEqual({ tone: 'Cool', depth: 'Deep' });
    expect(UNDERTONE_MAX).toBe(8);
  });
});

/* The drop-list form promised drops "delivered directly to your inbox" and
   filed each address in localStorage. No mailing list exists behind it, so the
   address went nowhere anyone would read. It now keeps nothing and says so. */
import { describe, test, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';

const showToast = vi.fn();
vi.mock('../../context/ToastContext.jsx', () => ({ useToast: () => ({ showToast }) }));
vi.mock('../../context/LanguageContext.jsx', () => ({ useLanguage: () => ({ t: (k) => k }) }));
vi.mock('../motion', () => ({ Reveal: ({ children, className }) => <div className={className}>{children}</div> }));
vi.mock('../ui/BorderBeam', () => ({ default: () => null }));

const JoinDropList = (await import('./JoinDropList.jsx')).default;

afterEach(() => { cleanup(); localStorage.clear(); vi.clearAllMocks(); });

describe('JoinDropList', () => {
  test('signing up keeps no address and hands over the code', () => {
    render(<JoinDropList />);
    fireEvent.change(screen.getByLabelText('drop.emailPlaceholder'), { target: { value: 'someone@example.com' } });
    fireEvent.submit(screen.getByLabelText('drop.emailPlaceholder').closest('form'));

    expect(localStorage.getItem('matcha_subscribers')).toBeNull();
    expect(Object.keys(localStorage)).toEqual([]);
    expect(screen.getByText('drop.successTitle')).toBeTruthy();
    expect(showToast).toHaveBeenCalledWith('drop.toast', 'success');
  });

  test('an empty submission does nothing', () => {
    render(<JoinDropList />);
    fireEvent.submit(screen.getByLabelText('drop.emailPlaceholder').closest('form'));
    expect(showToast).not.toHaveBeenCalled();
    expect(screen.queryByText('drop.successTitle')).toBeNull();
  });
});

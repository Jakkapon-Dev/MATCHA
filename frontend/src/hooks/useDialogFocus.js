import { useEffect } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
  'textarea:not([disabled])', '[tabindex]:not([tabindex="-1"])'
].join(',');

/* Keyboard focus for a modal dialog.

   The product modal is aria-modal, but opening it left focus on the button
   behind it, Tab walked on through the page underneath, and closing it dropped
   focus on <body>. While `active`, this moves focus into the dialog, keeps Tab
   and Shift+Tab inside it, and on close hands focus back to whatever had it
   before. The dialog element needs tabIndex={-1} so it can hold focus itself
   when it has nothing focusable. */
export default function useDialogFocus(ref, active) {
  useEffect(() => {
    if (!active) return undefined;
    const dialog = ref.current;
    if (!dialog) return undefined;

    const previous = document.activeElement;
    const focusables = () => [...dialog.querySelectorAll(FOCUSABLE)];
    if (!dialog.contains(document.activeElement)) (focusables()[0] || dialog).focus();

    const onKeyDown = (event) => {
      if (event.key !== 'Tab') return;
      const list = focusables();
      if (list.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = list[0];
      const last = list[list.length - 1];
      const inside = dialog.contains(document.activeElement);
      if (event.shiftKey && (!inside || document.activeElement === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (!inside || document.activeElement === last)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (previous && typeof previous.focus === 'function' && document.contains(previous)) previous.focus();
    };
  }, [ref, active]);
}

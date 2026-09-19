import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { formatOrdersForDisplay } from '../utils/orderHistory';
import OrdersTab from '../components/account/OrdersTab.jsx';

/* Somewhere for a guest to find what they ordered.

   The order list is scoped to whoever asks: an administrator sees everything,
   a signed-in customer sees their own, and a guest sees the orders carrying
   the guest id their browser already sends. That last case had nowhere to be
   read — /account sits behind RequireAuth — so the API could answer and
   nothing could ask.

   The page is deliberately open. It holds no secret of its own: without the
   browser's guest id the same request returns an empty list, so an
   unauthenticated visitor sees exactly what they are entitled to, which is
   usually nothing.

   It renders through the same OrdersTab the account page uses, from the same
   formatter, so the two cannot drift apart. */
export default function GuestOrdersPage() {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getOrders()
      .then((res) => {
        if (!isMounted) return;
        setOrders(formatOrdersForDisplay(res?.data || []));
      })
      .catch((err) => {
        // An empty history and an unreachable server look the same on screen,
        // so the reason goes somewhere it can be read.
        console.warn('Could not load order history:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });
    return () => { isMounted = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#F1F1F1] px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="space-y-2">
          <div className="flex items-center gap-2 text-[#042509]">
            <Package size={20} />
            <h1 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-[#0A0A0A]">
              {t('account.guestOrdersTitle')}
            </h1>
          </div>
          <p className="text-sm text-[#444444] max-w-xl">
            {isAuthenticated ? t('account.guestOrdersSignedIn') : t('account.guestOrdersLead')}
          </p>
        </header>

        {!isLoaded && (
          <p className="text-xs font-mono uppercase tracking-wider text-[#666666]">
            {t('account.guestOrdersLoading')}…
          </p>
        )}

        <OrdersTab orders={orders} isLoaded={isLoaded} />

        {/* Said once the list has settled, so it reads as a caveat on what is
            shown rather than a warning about something that failed to load. */}
        {isLoaded && !isAuthenticated && (
          <aside className="border border-dashed border-[#DCDCDC] bg-white p-4 sm:p-5 space-y-3">
            <p className="text-xs text-[#666666] leading-relaxed max-w-2xl">
              {t('account.guestOrdersNote')}
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#042509] hover:bg-[#021505] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors"
            >
              {t('account.guestOrdersCreateAccount')}
            </Link>
          </aside>
        )}
      </div>
    </main>
  );
}

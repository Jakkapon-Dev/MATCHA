import React, { useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { formatCurrency } from '../../utils/currency.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function AdminNotificationsMenu({
  notifications = [],
  unreadCount = 0,
  isOpen: controlledIsOpen,
  onToggle,
  onClose,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) {
  const langCtx = useLanguage();
  const t = langCtx?.t || ((key, fallback) => (typeof fallback === 'object' ? key : (fallback || key)));
  const lang = langCtx?.lang || 'en';
  const dateLocale = lang === 'th' ? 'th-TH' : undefined;

  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : uncontrolledIsOpen;
  const toggle = onToggle || (() => setUncontrolledIsOpen(prev => !prev));
  const close = onClose || (() => setUncontrolledIsOpen(false));

  const notifLabel = langCtx?.t ? t('admin.shell.notifications') : 'Order Notifications';
  const newOrdersLabel = langCtx?.t ? t('admin.shell.newOrders') : 'New Orders';
  const markAllReadLabel = langCtx?.t ? t('admin.shell.markAllRead') : 'Mark all read';
  const noNotifsLabel = langCtx?.t ? t('admin.shell.noNotifications') : 'No new order notifications yet.';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={notifLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
        className="relative h-9 w-9 rounded-xl bg-white border border-matcha-border hover:border-matcha-primary text-matcha-text transition-all cursor-pointer flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary"
        title={notifLabel}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-mono text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-20 cursor-default" onClick={close} />
          <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] bg-white rounded-2xl border border-matcha-border shadow-2xl p-3 z-30 font-mono text-xs animate-fade-in max-h-96 flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-matcha-border px-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-matcha-text uppercase font-sans">{newOrdersLabel}</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                    {langCtx?.t ? t('admin.shell.unread', { count: unreadCount }) : `${unreadCount} unread`}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllNotificationsRead}
                  className="text-[11px] text-matcha-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck size={12} />
                  <span>{markAllReadLabel}</span>
                </button>
              )}
            </div>

            <div className="overflow-y-auto divide-y divide-matcha-border/40 my-1 flex-1 max-h-72">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-matcha-muted text-xs">
                  {noNotifsLabel}
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id || n._id}
                    onClick={() => onMarkNotificationRead?.(n)}
                    className={`p-2.5 hover:bg-matcha-bg/80 transition-colors cursor-pointer rounded-lg flex items-start gap-2.5 ${!n.read ? 'bg-amber-50/60' : ''}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-red-500' : 'bg-transparent'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-matcha-text truncate">{n.orderNumber}</span>
                        <span className="font-bold text-matcha-primary shrink-0">{formatCurrency(n.total)}</span>
                      </div>
                      <div className="text-[11px] text-matcha-muted truncate">
                        {langCtx?.t ? t('admin.shell.notificationCustomer', { name: n.customerName }) : `Customer: ${n.customerName}`}
                      </div>
                      <div className="text-[10px] text-matcha-muted/70 mt-0.5">
                        {new Date(n.createdAt).toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString(dateLocale)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

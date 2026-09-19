import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { CheckCircle2, ArrowRight, Printer, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OrderSuccessModal({
  isOpen,
  order,
  orderNumber = 'MTA-2026-8942',
  formData,
  totalAmount = 0,
  purchaseDateTime,
  onDone
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  if (!isOpen) return null;

  const currentDateTime = purchaseDateTime || (order?.createdAt 
    ? new Date(order.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }));

  const activeOrderId = order?.orderId || orderNumber;
  const paymentMethod = order?.paymentMethod || 'visa';

  const handleFinish = () => {
    if (onDone) onDone();
    navigate('/catalog');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div 
        data-lenis-prevent="true"
        className="bg-white border border-matcha-border p-6 sm:p-8 max-w-md w-full text-center space-y-6 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-matcha-bg border border-matcha-secondary/30 text-matcha-primary flex items-center justify-center">
            <CheckCircle2 size={36} strokeWidth={1.8} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[#0A0A0A] tracking-tight">
              {t('checkout.orderConfirmed')}
            </h2>
            <p className="text-xs font-mono text-matcha-muted mt-1">
              {t('checkout.orderThanks', { name: formData?.firstName || '', ref: `#${activeOrderId}` })}
            </p>
          </div>
        </div>

        {/* Receipt Box */}
        <div className="p-4 bg-matcha-bg border border-matcha-border text-left text-xs font-mono space-y-2.5">
          <div className="flex justify-between items-baseline pb-2 border-b border-matcha-border">
            <span className="text-matcha-muted">{t('checkout.orderRef')}</span>
            <span className="font-bold text-sm text-matcha-primary">#{activeOrderId}</span>
          </div>

          <div className="flex justify-between items-start text-[11px]">
            <span className="text-matcha-muted">{t('checkout.deliveringTo')}</span>
            <span className="font-medium text-[#0A0A0A] text-right max-w-[200px] truncate">
              {formData?.address || '123 Sukhumvit Road'}, {formData?.city || 'Bangkok'}
            </span>
          </div>

          <div className="flex justify-between items-center text-[11px]">
            <span className="text-matcha-muted">{t('checkout.payment')}</span>
            <span className="font-medium text-[#0A0A0A] uppercase">{paymentMethod}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-matcha-border">
            <span className="text-matcha-muted">{t('checkout.total')}</span>
            <span className="font-bold text-base text-matcha-primary">${totalAmount?.toFixed(2)}</span>
          </div>

          <div className="text-[10px] text-matcha-muted pt-1">
            {t('checkout.orderDate')}: {currentDateTime}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleFinish}
            className="w-full py-3.5 bg-matcha-primary hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>{t('checkout.backToCatalog')}</span>
            <ArrowRight size={14} />
          </button>

          {/* Where the order can be read again. Without this the page exists
              and nobody arrives at it — and this is the one moment a customer
              is certain to want it. */}
          <button
            type="button"
            onClick={() => {
              if (onDone) onDone();
              navigate('/orders');
            }}
            className="w-full py-2.5 border border-matcha-primary text-matcha-primary hover:bg-matcha-primary hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Package size={13} />
            <span>{t('account.viewOrders')}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2 text-xs font-mono text-matcha-muted hover:text-matcha-primary flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer size={13} />
            <span>{t('checkout.printReceipt')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

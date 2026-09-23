import React, { useEffect, useState, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Home,
  Building2,
  Check,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import {
  fetchAddressBook,
  createAddress,
  updateAddress,
  deleteAddress,
  formatAddressArea,
} from '../../features/account/addressBook';

const INITIAL_FORM = {
  recipientName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  subdistrict: '',
  district: '',
  province: '',
  postalCode: '',
  country: 'Thailand',
  label: 'Home',
  isDefault: false,
};

export default function AddressesTab({ addresses: initialAddresses }) {
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [addresses, setAddresses] = useState(
    Array.isArray(initialAddresses) ? initialAddresses : []
  );
  const [loading, setLoading] = useState(
    !Array.isArray(initialAddresses) || initialAddresses.length === 0
  );
  const [error, setError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingAddress, setDeletingAddress] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAddresses = useCallback(async () => {
    if (!currentUser) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAddressBook(currentUser);
      setAddresses(list);
    } catch (err) {
      console.error('Failed to load addresses:', err);
      setError(err.message || 'Could not load addresses');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Dismiss toast after 3 seconds
  useEffect(() => {
    if (!successToast) return;
    const timer = setTimeout(() => setSuccessToast(null), 3000);
    return () => clearTimeout(timer);
  }, [successToast]);

  // Dismiss modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalOpen && !isSubmitting) {
          closeModal();
        } else if (deletingAddress && !isDeleting) {
          setDeletingAddress(null);
        }
      }
    };
    if (modalOpen || deletingAddress) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen, deletingAddress, isSubmitting, isDeleting]);

  const openCreateModal = () => {
    setEditingAddress(null);
    setFormData({
      ...INITIAL_FORM,
      recipientName: currentUser?.name || '',
      isDefault: addresses.length === 0,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingAddress(addr);
    setFormData({
      recipientName: addr.recipientName || '',
      phone: addr.phone || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      subdistrict: addr.subdistrict || '',
      district: addr.district || '',
      province: addr.province || '',
      postalCode: addr.postalCode || '',
      country: addr.country || 'Thailand',
      label: addr.label || 'Home',
      isDefault: Boolean(addr.isDefault),
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalOpen(false);
    setEditingAddress(null);
    setFormErrors({});
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.recipientName.trim()) {
      errs.recipientName = t('account.requiredFields');
    }

    const cleanPhone = formData.phone.trim().replace(/[^0-9]/g, '');
    if (!cleanPhone || !/^0[0-9]{8,9}$/.test(cleanPhone)) {
      errs.phone = t('account.invalidPhone');
    }

    if (!formData.addressLine1.trim()) {
      errs.addressLine1 = t('account.requiredFields');
    }
    if (!formData.subdistrict.trim()) {
      errs.subdistrict = t('account.requiredFields');
    }
    if (!formData.district.trim()) {
      errs.district = t('account.requiredFields');
    }
    if (!formData.province.trim()) {
      errs.province = t('account.requiredFields');
    }

    const cleanPostal = formData.postalCode.trim();
    if (!cleanPostal || !/^[0-9]{5}$/.test(cleanPostal)) {
      errs.postalCode = t('account.invalidPostal');
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        recipientName: formData.recipientName.trim(),
        phone: formData.phone.trim(),
        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim(),
        subdistrict: formData.subdistrict.trim(),
        district: formData.district.trim(),
        province: formData.province.trim(),
        postalCode: formData.postalCode.trim(),
        country: formData.country.trim() || 'Thailand',
        label: formData.label.trim() || 'Home',
        isDefault: Boolean(formData.isDefault),
      };

      if (editingAddress) {
        await updateAddress(editingAddress.id, payload);
        setSuccessToast(t('account.saved'));
      } else {
        if (addresses.length >= 20) {
          setFormErrors({ general: t('account.limitReached') });
          setIsSubmitting(false);
          return;
        }
        await createAddress(payload);
        setSuccessToast(t('account.saved'));
      }

      await loadAddresses();
      closeModal();
    } catch (err) {
      console.error('Failed to save address:', err);
      setFormErrors({ general: err.message || 'Failed to save address' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (addr) => {
    try {
      await updateAddress(addr.id, { isDefault: true });
      await loadAddresses();
      setSuccessToast(t('account.saved'));
    } catch (err) {
      console.error('Failed to set default address:', err);
    }
  };

  const handleDelete = async () => {
    if (!deletingAddress) return;
    setIsDeleting(true);
    try {
      await deleteAddress(deletingAddress.id);
      setDeletingAddress(null);
      await loadAddresses();
      setSuccessToast(t('account.saved'));
    } catch (err) {
      console.error('Failed to delete address:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-matcha-bg border border-matcha-border p-6 sm:p-8 space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0A0A0A] text-white px-4 py-3 border border-matcha-border shadow-lg text-xs font-mono animate-fade-in">
          <CheckCircle2 size={16} className="text-matcha-accent" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-matcha-border gap-4">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-[#0A0A0A]" aria-hidden="true" />
          <h2 className="text-base font-extrabold uppercase tracking-tight text-[#0A0A0A]">
            {t('account.addresses')} ({addresses.length})
          </h2>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={addresses.length >= 20}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A0A0A] hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <Plus size={14} />
          <span>{t('account.addAddress')}</span>
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-matcha-muted font-mono text-xs gap-3">
          <Loader2 size={24} className="animate-spin text-matcha-primary" />
          <span>Loading addresses…</span>
        </div>
      )}

      {!loading && error && (
        <div className="p-4 border border-red-300 bg-red-50 text-red-700 text-xs font-mono flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={loadAddresses}
            className="underline font-bold hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && addresses.length === 0 && (
        <div className="text-center py-12 px-4 border border-dashed border-matcha-border space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-matcha-border/40 flex items-center justify-center text-matcha-muted">
            <MapPin size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-[#0A0A0A]">{t('account.addresses')}</p>
            <p className="max-w-[48ch] mx-auto text-xs text-matcha-muted font-mono leading-relaxed">
              {t('account.noAddresses')}
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-matcha-primary hover:bg-[#1A381F] text-white text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            <Plus size={14} />
            <span>{t('account.addAddress')}</span>
          </button>
        </div>
      )}

      {/* Address Cards Grid */}
      {!loading && !error && addresses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => {
            const isHome = (addr.label || '').toLowerCase().includes('home') || addr.label === 'บ้าน';
            return (
              <div
                key={addr.id}
                className="bg-white border border-matcha-border p-5 flex flex-col justify-between space-y-4 transition-shadow hover:border-matcha-secondary/60"
              >
                <div className="space-y-3">
                  {/* Card Top Row: Label & Default Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 border border-matcha-border text-[10px] font-mono uppercase text-[#0A0A0A]">
                      {isHome ? <Home size={11} /> : <Building2 size={11} />}
                      <span>{addr.label || 'Home'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {addr.isDefault ? (
                        <span className="px-2 py-0.5 bg-matcha-primary text-white text-[10px] font-mono font-bold uppercase shrink-0 flex items-center gap-1">
                          <Check size={10} />
                          {t('account.defaultAddress')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr)}
                          className="text-[10px] font-mono text-matcha-muted hover:text-[#0A0A0A] underline cursor-pointer"
                        >
                          {t('account.setAsDefault')}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Recipient & Phone */}
                  <div>
                    <div className="text-sm font-bold text-[#0A0A0A]">
                      {addr.recipientName}
                    </div>
                    {addr.phone && (
                      <div className="text-xs font-mono text-matcha-muted mt-0.5">
                        {t('checkout.tel')}: {addr.phone}
                      </div>
                    )}
                  </div>

                  {/* Street & Details */}
                  <div className="text-xs font-mono text-[#0A0A0A] space-y-0.5 leading-relaxed">
                    <div>{addr.addressLine1}</div>
                    {addr.addressLine2 && (
                      <div className="text-matcha-muted">{addr.addressLine2}</div>
                    )}
                    <div className="text-matcha-muted">
                      {formatAddressArea([addr.subdistrict, addr.district, addr.province])}{' '}
                      {addr.postalCode}
                    </div>
                    <div className="text-[11px] text-matcha-muted">{addr.country}</div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-3 border-t border-matcha-border flex items-center justify-end gap-3 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => openEditModal(addr)}
                    className="inline-flex items-center gap-1 text-matcha-muted hover:text-[#0A0A0A] transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                    <span>{t('account.editAddress')}</span>
                  </button>

                  <span className="text-matcha-border">|</span>

                  <button
                    type="button"
                    onClick={() => setDeletingAddress(addr)}
                    className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>{t('account.deleteAddress')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="address-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
        >
          <div className="bg-white border border-matcha-border p-6 sm:p-8 max-w-lg w-full space-y-6 my-8 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-matcha-border">
              <h3 id="address-modal-title" className="text-sm font-bold uppercase tracking-tight text-[#0A0A0A]">
                {editingAddress ? t('account.editAddress') : t('account.addAddress')}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                aria-label={t('account.cancel')}
                className="text-matcha-muted hover:text-[#0A0A0A] cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                <X size={18} />
              </button>
            </div>

            {formErrors.general && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{formErrors.general}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 font-mono text-xs">
              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-recipientName" className="block text-matcha-muted mb-1">
                    {t('account.recipientName')} <span className="text-matcha-accent">*</span>
                  </label>
                  <input
                    id="addr-recipientName"
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="Somchai Jaidee"
                    className={`w-full px-3 py-2 border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary transition-colors ${
                      formErrors.recipientName ? 'border-red-500' : 'border-matcha-border focus:border-matcha-primary'
                    }`}
                    required
                  />
                  {formErrors.recipientName && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{formErrors.recipientName}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="addr-phone" className="block text-matcha-muted mb-1">
                    {t('account.phone')} <span className="text-matcha-accent">*</span>
                  </label>
                  <input
                    id="addr-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0812345678"
                    className={`w-full px-3 py-2 border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary transition-colors ${
                      formErrors.phone ? 'border-red-500' : 'border-matcha-border focus:border-matcha-primary'
                    }`}
                    required
                  />
                  {formErrors.phone && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{formErrors.phone}</span>
                  )}
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label htmlFor="addr-addressLine1" className="block text-matcha-muted mb-1">
                  {t('account.addressLine1')} <span className="text-matcha-accent">*</span>
                </label>
                <input
                  id="addr-addressLine1"
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                  placeholder="123/45 Sukhumvit 55, Thong Lo"
                  className={`w-full px-3 py-2 border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary transition-colors ${
                    formErrors.addressLine1 ? 'border-red-500' : 'border-matcha-border focus:border-matcha-primary'
                  }`}
                  required
                />
                {formErrors.addressLine1 && (
                  <span className="text-[10px] text-red-500 mt-0.5 block">{formErrors.addressLine1}</span>
                )}
              </div>

              {/* Address Line 2 */}
              <div>
                <label htmlFor="addr-addressLine2" className="block text-matcha-muted mb-1">
                  {t('account.addressLine2')}
                </label>
                <input
                  id="addr-addressLine2"
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  placeholder="Floor 4, Unit 402"
                  className="w-full px-3 py-2 border border-matcha-border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary focus:border-matcha-primary transition-colors"
                />
              </div>

              {/* Subdistrict & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-subdistrict" className="block text-matcha-muted mb-1">
                    {t('account.subdistrict')} <span className="text-matcha-accent">*</span>
                  </label>
                  <input
                    id="addr-subdistrict"
                    type="text"
                    value={formData.subdistrict}
                    onChange={(e) => setFormData({ ...formData, subdistrict: e.target.value })}
                    placeholder="Khlong Tan Nuea"
                    className={`w-full px-3 py-2 border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary transition-colors ${
                      formErrors.subdistrict ? 'border-red-500' : 'border-matcha-border focus:border-matcha-primary'
                    }`}
                    required
                  />
                  {formErrors.subdistrict && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{formErrors.subdistrict}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="addr-district" className="block text-matcha-muted mb-1">
                    {t('account.district')} <span className="text-matcha-accent">*</span>
                  </label>
                  <input
                    id="addr-district"
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Watthana"
                    className={`w-full px-3 py-2 border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary transition-colors ${
                      formErrors.district ? 'border-red-500' : 'border-matcha-border focus:border-matcha-primary'
                    }`}
                    required
                  />
                  {formErrors.district && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{formErrors.district}</span>
                  )}
                </div>
              </div>

              {/* Province & Postal Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="addr-province" className="block text-matcha-muted mb-1">
                    {t('account.province')} <span className="text-matcha-accent">*</span>
                  </label>
                  <input
                    id="addr-province"
                    type="text"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    placeholder="Bangkok"
                    className={`w-full px-3 py-2 border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary transition-colors ${
                      formErrors.province ? 'border-red-500' : 'border-matcha-border focus:border-matcha-primary'
                    }`}
                    required
                  />
                  {formErrors.province && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{formErrors.province}</span>
                  )}
                </div>

                <div>
                  <label htmlFor="addr-postalCode" className="block text-matcha-muted mb-1">
                    {t('account.postalCode')} <span className="text-matcha-accent">*</span>
                  </label>
                  <input
                    id="addr-postalCode"
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="10110"
                    maxLength={5}
                    className={`w-full px-3 py-2 border bg-matcha-bg text-[#0A0A0A] outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary transition-colors ${
                      formErrors.postalCode ? 'border-red-500' : 'border-matcha-border focus:border-matcha-primary'
                    }`}
                    required
                  />
                  {formErrors.postalCode && (
                    <span className="text-[10px] text-red-500 mt-0.5 block">{formErrors.postalCode}</span>
                  )}
                </div>
              </div>

              {/* Label selector */}
              <div>
                <label className="block text-matcha-muted mb-1.5">
                  {t('account.label')}
                </label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((lbl) => {
                    const active = formData.label === lbl;
                    return (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setFormData({ ...formData, label: lbl })}
                        className={`px-3 py-1.5 border text-xs font-mono transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary ${
                          active
                            ? 'border-matcha-primary bg-matcha-primary text-white'
                            : 'border-matcha-border bg-matcha-bg text-[#0A0A0A] hover:border-matcha-secondary'
                        }`}
                      >
                        {lbl === 'Home' ? t('account.labelHome') : lbl === 'Work' ? t('account.labelWork') : t('account.labelOther')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Default checkbox */}
              <div className="pt-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="accent-matcha-primary w-4 h-4 cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary"
                  />
                  <span className="text-xs text-[#0A0A0A]">{t('account.setAsDefault')}</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-matcha-border">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-matcha-border text-[#0A0A0A] hover:bg-matcha-border/20 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
                >
                  {t('account.cancel')}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-matcha-primary hover:bg-[#1A381F] text-white font-bold transition-colors disabled:opacity-50 cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-matcha-primary"
                >
                  {isSubmitting && <Loader2 size={13} className="animate-spin" />}
                  <span>{isSubmitting ? t('account.saving') : t('account.save')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingAddress && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-desc"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white border border-matcha-border p-6 sm:p-8 max-w-sm w-full space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
              <Trash2 size={22} />
            </div>

            <div className="space-y-1">
              <h3 id="delete-modal-title" className="text-sm font-bold text-[#0A0A0A] uppercase tracking-tight">
                {t('account.deleteConfirmTitle')}
              </h3>
              <p id="delete-modal-desc" className="text-xs text-matcha-muted font-mono leading-relaxed">
                {t('account.deleteConfirmMessage')}
              </p>
              <p className="text-xs font-bold text-[#0A0A0A] pt-1">
                {deletingAddress.recipientName} ({deletingAddress.addressLine1})
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => setDeletingAddress(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-matcha-border text-[#0A0A0A] hover:bg-matcha-border/20 transition-colors cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-[#0A0A0A]"
              >
                {t('account.cancel')}
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold transition-colors disabled:opacity-50 cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-red-600"
              >
                {isDeleting && <Loader2 size={12} className="animate-spin" />}
                <span>{isDeleting ? t('account.deleting') : t('account.confirmDelete')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

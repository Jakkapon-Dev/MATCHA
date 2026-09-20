import React from 'react';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function AdminDataState({ resources, status, errors, children }) {
  const { t } = useLanguage();
  const failed = resources.filter(key => status[key] === 'error');
  if (failed.length) return <div role="alert" className="p-6 bg-white rounded-xl border border-red-300 text-red-900">
    <p className="font-bold">{t('errors.loadFailed')}</p>
    {failed.map(key => <p key={key}>{key}: {errors[key]}</p>)}
    <p className="mt-2">{t('errors.loadFailedHint')}</p>
  </div>;
  if (resources.some(key => status[key] !== 'ready')) return <p role="status" className="p-6">{t('admin.loadingData')}</p>;
  return children;
}

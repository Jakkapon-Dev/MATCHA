import React from 'react';

export default function AdminDataState({ resources, status, errors, children }) {
  const failed = resources.filter(key => status[key] === 'error');
  if (failed.length) return <div role="alert" className="p-6 bg-white rounded-xl border border-red-300 text-red-900">
    <p className="font-bold">โหลดข้อมูลไม่สำเร็จ / Could not load data</p>
    {failed.map(key => <p key={key}>{key}: {errors[key]}</p>)}
    <p className="mt-2">กด Refresh data เพื่อลองใหม่ ข้อมูลที่โหลดไม่สำเร็จจะไม่แสดงในรายงาน</p>
  </div>;
  if (resources.some(key => status[key] !== 'ready')) return <p role="status" className="p-6">กำลังโหลดข้อมูล / Loading data…</p>;
  return children;
}

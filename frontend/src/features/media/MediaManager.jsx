import { webpSrc } from '../../utils/imageFallback';
import { formatCurrency } from '../../utils/currency.js';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Upload, ArrowUp, ArrowDown, X, Archive, RefreshCw, Plus, ExternalLink } from 'lucide-react';
import useMediaManager from './useMediaManager';
import { mediaRequest } from './mediaApi';
import './media.css';

function Pager({ page, total, onChange, disabled }) {
  return <div className="media-pager"><button disabled={disabled || page === 1} onClick={() => onChange(page - 1)}>ก่อนหน้า</button><span>หน้า {page} / {Math.max(1, Math.ceil(total / 40))}</span><button disabled={disabled || page * 40 >= total} onClick={() => onChange(page + 1)}>ถัดไป</button></div>;
}
function AssetEditor({ asset, manager }) {
  const [alt, setAlt] = useState(asset.alt);
  const [references, setReferences] = useState(null);
  const [error, setError] = useState('');
  async function checkUsage() {
    try { setError(''); setReferences((await mediaRequest(`/admin/media/${asset._id}/usage`)).data); }
    catch (e) { setError(e.message); }
  }
  return <article className="media-asset">
    <img src={webpSrc(asset.thumbnailUrl || asset.url)} alt={asset.alt} loading="lazy" />
    <label>คำอธิบายภาพ<input value={alt} maxLength={300} onChange={e => setAlt(e.target.value)} /></label>
    <p className="media-meta">{asset.width} × {asset.height} · {Math.round(asset.bytes / 1024)} KB</p>
    <div className="media-actions"><button disabled={manager.busy || !alt.trim()} onClick={() => manager.updateAsset(asset._id, { alt })}>บันทึกคำอธิบาย</button><button onClick={checkUsage}>ดูการใช้งาน</button></div>
    {references && <p>{references.length ? references.map(r => r.name).join(', ') : 'ยังไม่มีรายการใช้รูปนี้'}</p>}
    {error && <p role="alert">{error}</p>}
    <button disabled={manager.busy} onClick={() => manager.updateAsset(asset._id, { archived: !asset.archived })}><Archive size={15} />{asset.archived ? 'คืนรูปเข้าคลัง' : 'เก็บรูปที่ไม่ได้ใช้'}</button>
  </article>;
}
function GalleryEditor({ product, manager, onSaved }) {
  const [images, setImages] = useState((product.gallery || []).map(g => ({ mediaId: String(g.mediaId), color: g.color || '', url: g.url, alt: g.alt })));
  function move(index, offset) {
    setImages(current => { const next = [...current]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
  }
  return <section className="media-editor">
    <h3>รูปของ {product.name}</h3><p>รูปแรกเป็นรูปหลัก เลือกสีให้รูปตรงกับตัวเลือกสินค้า</p>
    {!images.length && <p className="media-empty">ยังไม่มีรูปในคลังที่ผูกกับสินค้านี้ รูปเดิมจะคงอยู่จนกดบันทึก</p>}
    <div className="media-gallery">{images.map((item, index) => <div key={`${item.mediaId}-${index}`} className="media-gallery-row">
      <img src={webpSrc(item.url)} alt={item.alt || product.name} /><span>{index === 0 ? 'รูปหลัก' : `รูป ${index + 1}`}</span>
      <label>สี<select value={item.color} onChange={e => setImages(list => list.map((g, i) => i === index ? { ...g, color: e.target.value } : g))}><option value="">ทุกสี</option>{[...new Set([product.color, ...(product.variants || []).map(v => v.color)].filter(Boolean))].map(c => <option key={c}>{c}</option>)}</select></label>
      <button aria-label={`เลื่อนรูป ${index + 1} ขึ้น`} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button>
      <button aria-label={`เลื่อนรูป ${index + 1} ลง`} disabled={index === images.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button>
      <button aria-label={`นำรูป ${index + 1} ออกจากสินค้า`} onClick={() => setImages(list => list.filter((_, i) => i !== index))}><X size={16} /></button>
    </div>)}</div>
    <label>เพิ่มรูปจากคลัง<select value="" disabled={manager.archived || images.length >= 12} onChange={e => { const asset = manager.assets.find(a => a._id === e.target.value); if (asset) setImages(list => [...list, { mediaId: asset._id, color: '', url: asset.url, alt: asset.alt }]); }}><option value="">เลือกรูป (สูงสุด 12 รูป)</option>{manager.assets.filter(a => !images.some(i => i.mediaId === a._id)).map(a => <option key={a._id} value={a._id}>{a.alt}</option>)}</select></label>
    <button className="media-primary" disabled={manager.busy || !images.length} onClick={async () => { const result = await manager.saveGallery(product, images.map(({ mediaId, color }) => ({ mediaId, color }))); if (result?.data) onSaved(result.data); }}>บันทึกรูปสินค้า</button>
  </section>;
}
const MAX_PINS = 16;
const clampPct = v => Math.max(0, Math.min(100, Math.round(v * 10) / 10));
const pointOn = (board, e) => {
  const bounds = board.getBoundingClientRect();
  return { x: clampPct((e.clientX - bounds.left) / bounds.width * 100), y: clampPct((e.clientY - bounds.top) / bounds.height * 100) };
};
const findProduct = (products, productId) => products.find(p => p.id === productId || p._id === productId);

/* The hotspot editor. Coordinates are percentages of the whole photograph,
   the same values the storefront compensates for its own crop, so a pin put
   on a garment here lands on that garment at every screen size.

   Click an empty part of the photograph to drop a new pin there — its product
   picker takes focus — drag a pin to move it, arrow keys nudge the selected
   pin, and the side panel holds the exact values. Nothing is written until
   Save; the server re-checks every product and coordinate. */
function LookEditor({ initial, manager, onSaved }) {
  const [look, setLook] = useState(initial);
  const [selected, setSelected] = useState(initial.items.length ? 0 : -1);
  const [focusIndex, setFocusIndex] = useState(null);
  const boardRef = useRef(null);
  const drag = useRef(null);
  const pickers = useRef([]);
  const updateItem = (index, changes) => setLook(l => ({ ...l, items: l.items.map((item, i) => index === i ? { ...item, ...changes } : item) }));
  useEffect(() => {
    if (focusIndex === null) return;
    const picker = pickers.current[focusIndex];
    picker?.scrollIntoView?.({ block: 'nearest' });
    picker?.focus();
    setFocusIndex(null);
  }, [focusIndex]);

  const addPin = e => {
    if (drag.current?.moved) { drag.current = null; return; }
    if (!look.heroImage || look.items.length >= MAX_PINS) return;
    const index = look.items.length;
    const point = pointOn(e.currentTarget, e);
    setLook(l => ({ ...l, items: [...l.items, { productId: '', color: '', ...point }] }));
    setSelected(index);
    setFocusIndex(index);
  };
  const removePin = index => {
    setLook(l => ({ ...l, items: l.items.filter((_, i) => i !== index) }));
    setSelected(s => (s === index ? -1 : s > index ? s - 1 : s));
  };
  const nudge = (index, e) => {
    const step = e.shiftKey ? 5 : 0.5;
    const delta = { ArrowLeft: ['x', -step], ArrowRight: ['x', step], ArrowUp: ['y', -step], ArrowDown: ['y', step] }[e.key];
    if (!delta) return;
    e.preventDefault();
    updateItem(index, { [delta[0]]: clampPct(look.items[index][delta[0]] + delta[1]) });
  };

  // Photographs the lookbook already ships with can front a new look too,
  // without re-uploading them into the library first.
  const lookbookPhotos = [...new Set(manager.looks.flatMap(l => [l.heroImage, ...(l.editorial?.detailImages || [])]).filter(u => typeof u === 'string' && u.startsWith('/images/')))];
  const ids = look.items.map(i => i.productId).filter(Boolean);
  const duplicates = new Set(ids.filter((id, i) => ids.indexOf(id) !== i));
  const missingProduct = look.items.some(i => !i.productId);
  const canSave = !manager.busy && look.title.trim() && look.heroImage && !missingProduct && !duplicates.size;

  return <section className="media-editor"><h3>{initial.isDraft ? 'ลุคใหม่' : 'แก้ไขลุค'}</h3>
    <div className="media-look-layout"><div>
      {look.heroImage ? <div ref={boardRef} className="media-pin-board" onClick={addPin} data-testid="pin-board">
        <img src={webpSrc(look.heroImage)} alt={look.title} draggable={false} />
        {look.items.map((item, index) => {
          const product = findProduct(manager.products, item.productId);
          const name = product?.name || item.productId || 'ยังไม่เลือกสินค้า';
          return <button key={index} type="button"
            aria-label={`จุดสินค้า ${index + 1}: ${name}`} title={name}
            aria-pressed={selected === index}
            data-invalid={!item.productId || duplicates.has(item.productId) || undefined}
            style={{ left: `${item.x}%`, top: `${item.y}%`, touchAction: 'none' }}
            onPointerDown={e => { e.stopPropagation(); setSelected(index); drag.current = { index, moved: false }; e.currentTarget.setPointerCapture?.(e.pointerId); }}
            onPointerMove={e => { if (drag.current?.index !== index || !boardRef.current || !Number.isFinite(e.clientX)) return; drag.current.moved = true; updateItem(index, pointOn(boardRef.current, e)); }}
            onPointerUp={e => { e.currentTarget.releasePointerCapture?.(e.pointerId); }}
            onClick={e => { e.stopPropagation(); drag.current = null; setSelected(index); }}
            onKeyDown={e => nudge(index, e)}>{index + 1}</button>;
        })}
      </div> : <p className="media-empty">เลือกภาพนายแบบ / นางแบบทางขวาก่อน แล้วจึงวางจุดสินค้า</p>}
      <p>คลิกบนภาพเพื่อวางจุดใหม่ ลากจุดเพื่อย้าย หรือเลือกจุดแล้วกดลูกศร (Shift = ทีละ 5%) · สูงสุด {MAX_PINS} จุด</p>
    </div><div className="media-fields">
      <label>ชื่อลุค<input value={look.title} maxLength={180} onChange={e => setLook(l => ({ ...l, title: e.target.value }))} /></label>
      <label>{look.heroImage ? 'เปลี่ยนภาพนายแบบ / นางแบบ' : 'ภาพนายแบบ / นางแบบ'}<select value="" disabled={manager.archived} onChange={e => e.target.value && setLook(l => ({ ...l, heroImage: e.target.value }))}><option value="">{look.heroImage ? 'ใช้ภาพปัจจุบัน' : 'เลือกภาพ'}</option>{manager.assets.length > 0 && <optgroup label="คลังรูป">{manager.assets.map(a => <option key={a._id} value={a.url}>{a.alt}</option>)}</optgroup>}{lookbookPhotos.length > 0 && <optgroup label="ภาพ Lookbook ที่มีอยู่">{lookbookPhotos.map(url => <option key={url} value={url}>{url.split('/').pop()}</option>)}</optgroup>}</select></label>
      <label className="media-checkbox"><input type="checkbox" checked={look.published} onChange={e => setLook(l => ({ ...l, published: e.target.checked }))} />แสดงลุคบนหน้าเว็บ</label>
      {look.items.map((item, index) => {
        const product = findProduct(manager.products, item.productId);
        const duplicate = duplicates.has(item.productId);
        return <fieldset key={index} className="media-hotspot" aria-current={selected === index || undefined} onFocus={() => setSelected(index)}><legend>จุดสินค้า {index + 1}</legend>
          <label>สินค้า<select ref={el => { pickers.current[index] = el; }} value={item.productId} aria-invalid={!item.productId || duplicate} onChange={e => { const p = manager.products.find(p => (p.id || p._id) === e.target.value); updateItem(index, { productId: e.target.value, color: p?.color || '' }); }}>
            <option value="">เลือกสินค้า</option>{!product && item.productId && <option value={item.productId}>{item.productId} — ค้นหาหรือนำเข้าสินค้าเดิม</option>}{manager.products.map(p => <option key={p._id} value={p.id || p._id}>{p.name}</option>)}
          </select></label>
          {product ? <div className="media-hotspot-preview"><img src={webpSrc(product.image)} alt="" /><div><strong>{product.name}</strong><span>{product.category} · {formatCurrency(product.price)}</span></div></div>
            : item.productId ? <p className="media-hint">ไม่พบสินค้านี้ในหน้ารายการปัจจุบัน — ค้นหาด้านบนเพื่อดูตัวอย่าง ระบบจะตรวจอีกครั้งตอนบันทึก</p> : null}
          {duplicate && <p role="alert" className="media-hint media-hint-error">สินค้านี้อยู่ในลุคแล้ว หนึ่งสินค้าใช้ได้หนึ่งจุด</p>}
          <label>สี<select value={item.color} onChange={e => updateItem(index, { color: e.target.value })}><option value="">สีหลัก</option>{[...new Set([item.color, product?.color, ...(product?.variants || []).map(v => v.color)].filter(Boolean))].map(c => <option key={c}>{c}</option>)}</select></label>
          <div className="media-actions">{['x', 'y'].map(axis => <label key={axis}>{axis === 'x' ? 'แนวนอน (%)' : 'แนวตั้ง (%)'}<input type="number" min="0" max="100" step="0.1" value={item[axis]} onFocus={() => setSelected(index)} onChange={e => updateItem(index, { [axis]: clampPct(Number(e.target.value)) })} /></label>)}</div>
          <button type="button" onClick={() => removePin(index)}>นำจุดนี้ออก</button>
        </fieldset>;
      })}
      <button type="button" disabled={!look.heroImage || look.items.length >= MAX_PINS} onClick={() => { const index = look.items.length; setLook(l => ({ ...l, items: [...l.items, { productId: '', color: '', x: 50, y: 50 }] })); setSelected(index); setFocusIndex(index); }}>เพิ่มจุดสินค้า</button>
      <button className="media-primary" disabled={!canSave} onClick={async () => { if (await manager.saveLook(look)) onSaved?.(look.id); }}>บันทึก Lookbook</button>
    </div></div>
  </section>;
}

export default function MediaManager({ initialTab = 'library' }) {
  const manager = useMediaManager();
  const [tab, setTab] = useState(initialTab);
  const [file, setFile] = useState(null);
  const [alt, setAlt] = useState('');
  const [productId, setProductId] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [lookId, setLookId] = useState('');
  const listedProduct = manager.products.find(p => p._id === productId);
  const product = listedProduct && (listedProduct.mediaRevision || 0) >= (selectedProduct?.mediaRevision || 0) ? listedProduct : selectedProduct;
  const [draft, setDraft] = useState(null);
  const look = draft || manager.looks.find(l => l.id === lookId);
  const startDraft = () => {
    const id = `LOOK-${Date.now().toString(36).toUpperCase()}`;
    setDraft({ id, title: '', heroImage: '', published: false, revision: 0, items: [], isDraft: true });
    setLookId(id);
  };
  return <div className="media-manager">
    <header className="media-header"><div><h2>รูปสินค้าและ Lookbook</h2><p>จัดรูปให้ตรงกับสินค้าจริง และเชื่อมแต่ละลุคจากที่เดียว</p></div><button disabled={manager.busy} onClick={manager.reload}><RefreshCw size={16} />โหลดใหม่</button></header>
    <nav className="media-tabs" aria-label="จัดการรูป">{[['library', 'คลังรูป'], ['products', 'รูปสินค้า'], ['looks', 'Lookbook']].map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {manager.error && <div className="media-error" role="alert">{manager.error}<button onClick={manager.reload}>ลองใหม่</button></div>}
    {manager.notice && <p className="media-notice" role="status">{manager.notice}</p>}
    <fieldset disabled={manager.busy} className="media-workspace" aria-busy={manager.busy || manager.loading}>
    {tab === 'library' && <>
      <form className="media-upload" onSubmit={async e => { e.preventDefault(); const form = e.currentTarget; if (await manager.upload(file, alt)) { setFile(null); setAlt(''); form.reset(); } }}>
        <h3><Upload size={20} />เพิ่มรูป</h3><label>ไฟล์ภาพ<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setFile(e.target.files[0])} /></label><label>คำอธิบายภาพ<input value={alt} required maxLength={300} placeholder="เช่น แจ็กเก็ตม่วงเหลือบ มุมด้านหน้า" onChange={e => setAlt(e.target.value)} /></label><p>JPEG, PNG หรือ WebP ไม่เกิน 8 MB · ระบบสร้างรูปหลักและรูปย่อให้</p><button className="media-primary" disabled={!file || !alt.trim()} type="submit">{manager.busy ? 'กำลังบันทึก…' : 'อัปโหลดรูป'}</button>
      </form>
      <div className="media-import"><div><h3>ภาพ Lookbook เดิม 16 รูป</h3><p>นำเข้าคลังพร้อมข้อมูลสินค้าเดิม สินค้าใหม่เริ่มด้วยสต็อก 0 และยังไม่ระบุไซซ์</p></div><button onClick={manager.importOriginals}>นำเข้าภาพเดิม</button></div>
    </>}
    <div className="media-actions"><label className="media-checkbox"><input type="checkbox" checked={manager.archived} onChange={e => manager.setArchived(e.target.checked)} />ดูรูปที่เก็บไว้</label><Pager page={manager.page} total={manager.total} onChange={manager.setPage} disabled={manager.loading} /></div>
    {manager.loading && !manager.looks.length ? <div className="media-skeleton" role="status" aria-label="กำลังโหลดรูป"><div /><div /><div /></div> : tab === 'library' ? manager.assets.length ? <div className="media-grid">{manager.assets.map(a => <AssetEditor key={`${a._id}-${a.updatedAt}`} asset={a} manager={manager} />)}</div> : <div className="media-empty"><Image size={28} /><h3>ยังไม่มีรูปในส่วนนี้</h3><p>อัปโหลดรูปใหม่ หรือนำเข้าภาพ Lookbook เดิมด้านบน</p><button onClick={() => document.querySelector('.media-upload input')?.focus()}>เลือกไฟล์ภาพ</button></div> : <>
      <form className="media-search" onSubmit={e => { e.preventDefault(); manager.setSearch(new FormData(e.currentTarget).get('search')); }}><label>ค้นหาสินค้า<input name="search" defaultValue={manager.search} placeholder="ชื่อหรือรหัสสินค้า" maxLength={100} /></label><button>ค้นหา</button></form>
      <Pager page={manager.productPage} total={manager.productTotal} onChange={manager.setProductPage} disabled={manager.loading} />
      {tab === 'products' ? <><label>เลือกสินค้า<select value={productId} onChange={e => { setProductId(e.target.value); setSelectedProduct(manager.products.find(p => p._id === e.target.value) || null); }}><option value="">เลือกสินค้าที่ต้องการจัดรูป</option>{product && !manager.products.some(p => p._id === product._id) && <option value={product._id}>{product.name}</option>}{manager.products.map(p => <option value={p._id} key={p._id}>{p.name}</option>)}</select></label>{product ? <GalleryEditor key={`${product._id}-${product.mediaRevision || 0}`} product={product} manager={manager} onSaved={setSelectedProduct} /> : <p className="media-empty">เลือกสินค้าด้านบนเพื่อจัดรูปหลักและรูปเพิ่มเติม</p>}</> : <><div className="media-look-picker"><label>เลือกลุค<select value={draft ? '' : lookId} onChange={e => { setDraft(null); setLookId(e.target.value); }}><option value="">{draft ? 'ลุคใหม่ (ยังไม่บันทึก)' : 'เลือกลุคที่ต้องการแก้ไข'}</option>{manager.looks.map(l => <option value={l.id} key={l.id}>{l.title}{l.published === false ? ' (ซ่อนอยู่)' : ''} · {l.items?.length || 0} จุด</option>)}</select></label><button type="button" onClick={startDraft}><Plus size={15} />สร้างลุคใหม่</button><a href="/lookbook" target="_blank" rel="noreferrer"><ExternalLink size={15} />ดูหน้า Lookbook</a></div>{look && <LookEditor key={`${look.id}-${look.revision}${look.isDraft ? '-draft' : ''}`} initial={look} manager={manager} onSaved={id => { setDraft(null); setLookId(id); }} />}</>}
    </>}
    </fieldset>
  </div>;
}

import { webpSrc } from '../../utils/imageFallback';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Upload, ArrowUp, ArrowDown, X, Archive, RefreshCw, Plus, ExternalLink } from 'lucide-react';
import useMediaManager from './useMediaManager';
import { mediaRequest } from './mediaApi';
import { useLanguage } from '../../context/LanguageContext.jsx';
import './media.css';

function Pager({ page, total, onChange, disabled }) {
  const { t } = useLanguage();
  return <div className="media-pager"><button disabled={disabled || page === 1} onClick={() => onChange(page - 1)}>{t('admin.common.previous')}</button><span>{t('admin.media.pageOf', { page, total: Math.max(1, Math.ceil(total / 40)) })}</span><button disabled={disabled || page * 40 >= total} onClick={() => onChange(page + 1)}>{t('admin.common.next')}</button></div>;
}
function AssetEditor({ asset, manager }) {
  const { t } = useLanguage();
  const [alt, setAlt] = useState(asset.alt);
  const [references, setReferences] = useState(null);
  const [error, setError] = useState('');
  async function checkUsage() {
    try { setError(''); setReferences((await mediaRequest(`/admin/media/${asset._id}/usage`)).data); }
    catch (e) { setError(e.message); }
  }
  return <article className="media-asset">
    <img src={webpSrc(asset.thumbnailUrl || asset.url)} alt={asset.alt} loading="lazy" />
    <label>{t('admin.media.altText')}<input value={alt} maxLength={300} onChange={e => setAlt(e.target.value)} /></label>
    <p className="media-meta">{asset.width} × {asset.height} · {Math.round(asset.bytes / 1024)} KB</p>
    <div className="media-actions"><button disabled={manager.busy || !alt.trim()} onClick={() => manager.updateAsset(asset._id, { alt })}>{t('admin.media.saveAlt')}</button><button onClick={checkUsage}>{t('admin.media.checkUsage')}</button></div>
    {references && <p>{references.length ? references.map(r => r.name).join(', ') : t('admin.media.noUsage')}</p>}
    {error && <p role="alert">{error}</p>}
    <button disabled={manager.busy} onClick={() => manager.updateAsset(asset._id, { archived: !asset.archived })}><Archive size={15} />{asset.archived ? t('admin.media.restore') : t('admin.media.archive')}</button>
  </article>;
}
function GalleryEditor({ product, manager, onSaved }) {
  const { t } = useLanguage();
  const [images, setImages] = useState((product.gallery || []).map(g => ({ mediaId: String(g.mediaId), color: g.color || '', url: g.url, alt: g.alt })));
  function move(index, offset) {
    setImages(current => { const next = [...current]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; return next; });
  }
  return <section className="media-editor">
    <h3>{t('admin.media.galleryTitle', { name: product.name })}</h3><p>{t('admin.media.galleryHint')}</p>
    {!images.length && <p className="media-empty">{t('admin.media.galleryEmpty')}</p>}
    <div className="media-gallery">{images.map((item, index) => <div key={`${item.mediaId}-${index}`} className="media-gallery-row">
      <img src={webpSrc(item.url)} alt={item.alt || product.name} /><span>{index === 0 ? t('admin.media.mainImage') : t('admin.media.imageN', { n: index + 1 })}</span>
      <label>{t('admin.media.color')}<select value={item.color} onChange={e => setImages(list => list.map((g, i) => i === index ? { ...g, color: e.target.value } : g))}><option value="">{t('admin.media.allColors')}</option>{[...new Set([product.color, ...(product.variants || []).map(v => v.color)].filter(Boolean))].map(c => <option key={c}>{c}</option>)}</select></label>
      <button aria-label={t('admin.media.moveUp', { n: index + 1 })} disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={16} /></button>
      <button aria-label={t('admin.media.moveDown', { n: index + 1 })} disabled={index === images.length - 1} onClick={() => move(index, 1)}><ArrowDown size={16} /></button>
      <button aria-label={t('admin.media.removeImage', { n: index + 1 })} onClick={() => setImages(list => list.filter((_, i) => i !== index))}><X size={16} /></button>
    </div>)}</div>
    <label>{t('admin.media.addFromLibrary')}<select value="" disabled={manager.archived || images.length >= 12} onChange={e => { const asset = manager.assets.find(a => a._id === e.target.value); if (asset) setImages(list => [...list, { mediaId: asset._id, color: '', url: asset.url, alt: asset.alt }]); }}><option value="">{t('admin.media.pickImage')}</option>{manager.assets.filter(a => !images.some(i => i.mediaId === a._id)).map(a => <option key={a._id} value={a._id}>{a.alt}</option>)}</select></label>
    <button className="media-primary" disabled={manager.busy || !images.length} onClick={async () => { const result = await manager.saveGallery(product, images.map(({ mediaId, color }) => ({ mediaId, color }))); if (result?.data) onSaved(result.data); }}>{t('admin.media.saveGallery')}</button>
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
  const { t } = useLanguage();
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

  return <section className="media-editor"><h3>{initial.isDraft ? t('admin.media.newLook') : t('admin.media.editLook')}</h3>
    <div className="media-look-layout"><div>
      {look.heroImage ? <div ref={boardRef} className="media-pin-board" onClick={addPin} data-testid="pin-board">
        <img src={webpSrc(look.heroImage)} alt={look.title} draggable={false} />
        {look.items.map((item, index) => {
          const product = findProduct(manager.products, item.productId);
          const name = product?.name || item.productId || t('admin.media.noProduct');
          return <button key={index} type="button"
            aria-label={t('admin.media.pinLabel', { n: index + 1, name })} title={name}
            aria-pressed={selected === index}
            data-invalid={!item.productId || duplicates.has(item.productId) || undefined}
            style={{ left: `${item.x}%`, top: `${item.y}%`, touchAction: 'none' }}
            onPointerDown={e => { e.stopPropagation(); setSelected(index); drag.current = { index, moved: false }; e.currentTarget.setPointerCapture?.(e.pointerId); }}
            onPointerMove={e => { if (drag.current?.index !== index || !boardRef.current || !Number.isFinite(e.clientX)) return; drag.current.moved = true; updateItem(index, pointOn(boardRef.current, e)); }}
            onPointerUp={e => { e.currentTarget.releasePointerCapture?.(e.pointerId); }}
            onClick={e => { e.stopPropagation(); drag.current = null; setSelected(index); }}
            onKeyDown={e => nudge(index, e)}>{index + 1}</button>;
        })}
      </div> : <p className="media-empty">{t('admin.media.emptyHero')}</p>}
      <p>{t('admin.media.boardHint', { max: MAX_PINS })}</p>
    </div><div className="media-fields">
      <label>{t('admin.media.lookTitle')}<input value={look.title} maxLength={180} onChange={e => setLook(l => ({ ...l, title: e.target.value }))} /></label>
      <label>{look.heroImage ? t('admin.media.changeHero') : t('admin.media.hero')}<select value="" disabled={manager.archived} onChange={e => e.target.value && setLook(l => ({ ...l, heroImage: e.target.value }))}><option value="">{look.heroImage ? t('admin.media.keepCurrent') : t('admin.media.chooseImage')}</option>{manager.assets.length > 0 && <optgroup label={t('admin.media.libraryGroup')}>{manager.assets.map(a => <option key={a._id} value={a.url}>{a.alt}</option>)}</optgroup>}{lookbookPhotos.length > 0 && <optgroup label={t('admin.media.lookbookPhotos')}>{lookbookPhotos.map(url => <option key={url} value={url}>{url.split('/').pop()}</option>)}</optgroup>}</select></label>
      <label className="media-checkbox"><input type="checkbox" checked={look.published} onChange={e => setLook(l => ({ ...l, published: e.target.checked }))} />{t('admin.media.publishLook')}</label>
      {look.items.map((item, index) => {
        const product = findProduct(manager.products, item.productId);
        const duplicate = duplicates.has(item.productId);
        return <fieldset key={index} className="media-hotspot" aria-current={selected === index || undefined} onFocus={() => setSelected(index)}><legend>{t('admin.media.hotspotLegend', { n: index + 1 })}</legend>
          <label>{t('admin.media.product')}<select ref={el => { pickers.current[index] = el; }} value={item.productId} aria-invalid={!item.productId || duplicate} onChange={e => { const p = manager.products.find(p => (p.id || p._id) === e.target.value); updateItem(index, { productId: e.target.value, color: p?.color || '' }); }}>
            <option value="">{t('admin.media.selectProduct')}</option>{!product && item.productId && <option value={item.productId}>{t('admin.media.unlistedProduct', { id: item.productId })}</option>}{manager.products.map(p => <option key={p._id} value={p.id || p._id}>{p.name}</option>)}
          </select></label>
          {product ? <div className="media-hotspot-preview"><img src={webpSrc(product.image)} alt="" /><div><strong>{product.name}</strong><span>{product.category} · ${Number(product.price || 0).toFixed(2)}</span></div></div>
            : item.productId ? <p className="media-hint">{t('admin.media.notListed')}</p> : null}
          {duplicate && <p role="alert" className="media-hint media-hint-error">{t('admin.media.duplicate')}</p>}
          <label>{t('admin.media.color')}<select value={item.color} onChange={e => updateItem(index, { color: e.target.value })}><option value="">{t('admin.media.mainColor')}</option>{[...new Set([item.color, product?.color, ...(product?.variants || []).map(v => v.color)].filter(Boolean))].map(c => <option key={c}>{c}</option>)}</select></label>
          <div className="media-actions">{['x', 'y'].map(axis => <label key={axis}>{axis === 'x' ? t('admin.media.horizontal') : t('admin.media.vertical')}<input type="number" min="0" max="100" step="0.1" value={item[axis]} onFocus={() => setSelected(index)} onChange={e => updateItem(index, { [axis]: clampPct(Number(e.target.value)) })} /></label>)}</div>
          <button type="button" onClick={() => removePin(index)}>{t('admin.media.removeHotspot')}</button>
        </fieldset>;
      })}
      <button type="button" disabled={!look.heroImage || look.items.length >= MAX_PINS} onClick={() => { const index = look.items.length; setLook(l => ({ ...l, items: [...l.items, { productId: '', color: '', x: 50, y: 50 }] })); setSelected(index); setFocusIndex(index); }}>{t('admin.media.addHotspot')}</button>
      <button className="media-primary" disabled={!canSave} onClick={async () => { if (await manager.saveLook(look)) onSaved?.(look.id); }}>{t('admin.media.saveLookbook')}</button>
    </div></div>
  </section>;
}

export default function MediaManager({ initialTab = 'library' }) {
  const { t } = useLanguage();
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
    <header className="media-header"><div><h2>{t('admin.media.title')}</h2><p>{t('admin.media.subtitle')}</p></div><button disabled={manager.busy} onClick={manager.reload}><RefreshCw size={16} />{t('admin.media.reload')}</button></header>
    <nav className="media-tabs" aria-label={t('admin.media.tabsLabel')}>{[['library', t('admin.media.tabLibrary')], ['products', t('admin.media.tabProducts')], ['looks', t('admin.media.tabLooks')]].map(([key, label]) => <button key={key} aria-pressed={tab === key} onClick={() => setTab(key)}>{label}</button>)}</nav>
    {manager.error && <div className="media-error" role="alert">{manager.error}<button onClick={manager.reload}>{t('admin.media.retry')}</button></div>}
    {manager.notice && <p className="media-notice" role="status">{manager.notice}</p>}
    <fieldset disabled={manager.busy} className="media-workspace" aria-busy={manager.busy || manager.loading}>
    {tab === 'library' && <>
      <form className="media-upload" onSubmit={async e => { e.preventDefault(); const form = e.currentTarget; if (await manager.upload(file, alt)) { setFile(null); setAlt(''); form.reset(); } }}>
        <h3><Upload size={20} />{t('admin.media.uploadTitle')}</h3><label>{t('admin.media.file')}<input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setFile(e.target.files[0])} /></label><label>{t('admin.media.altText')}<input value={alt} required maxLength={300} placeholder={t('admin.media.altPlaceholder')} onChange={e => setAlt(e.target.value)} /></label><p>{t('admin.media.uploadHint')}</p><button className="media-primary" disabled={!file || !alt.trim()} type="submit">{manager.busy ? t('admin.common.saving') : t('admin.media.uploadButton')}</button>
      </form>
      <div className="media-import"><div><h3>{t('admin.media.importTitle')}</h3><p>{t('admin.media.importBody')}</p></div><button onClick={manager.importOriginals}>{t('admin.media.importButton')}</button></div>
    </>}
    <div className="media-actions"><label className="media-checkbox"><input type="checkbox" checked={manager.archived} onChange={e => manager.setArchived(e.target.checked)} />{t('admin.media.showArchived')}</label><Pager page={manager.page} total={manager.total} onChange={manager.setPage} disabled={manager.loading} /></div>
    {manager.loading && !manager.looks.length ? <div className="media-skeleton" role="status" aria-label={t('admin.media.loadingImages')}><div /><div /><div /></div> : tab === 'library' ? manager.assets.length ? <div className="media-grid">{manager.assets.map(a => <AssetEditor key={`${a._id}-${a.updatedAt}`} asset={a} manager={manager} />)}</div> : <div className="media-empty"><Image size={28} /><h3>{t('admin.media.emptyTitle')}</h3><p>{t('admin.media.emptyBody')}</p><button onClick={() => document.querySelector('.media-upload input')?.focus()}>{t('admin.media.chooseFile')}</button></div> : <>
      <form className="media-search" onSubmit={e => { e.preventDefault(); manager.setSearch(new FormData(e.currentTarget).get('search')); }}><label>{t('admin.media.searchProducts')}<input name="search" defaultValue={manager.search} placeholder={t('admin.media.searchPlaceholder')} maxLength={100} /></label><button>{t('admin.common.search')}</button></form>
      <Pager page={manager.productPage} total={manager.productTotal} onChange={manager.setProductPage} disabled={manager.loading} />
      {tab === 'products' ? <><label>{t('admin.media.selectProduct')}<select value={productId} onChange={e => { setProductId(e.target.value); setSelectedProduct(manager.products.find(p => p._id === e.target.value) || null); }}><option value="">{t('admin.media.pickProductOption')}</option>{product && !manager.products.some(p => p._id === product._id) && <option value={product._id}>{product.name}</option>}{manager.products.map(p => <option value={p._id} key={p._id}>{p.name}</option>)}</select></label>{product ? <GalleryEditor key={`${product._id}-${product.mediaRevision || 0}`} product={product} manager={manager} onSaved={setSelectedProduct} /> : <p className="media-empty">{t('admin.media.pickProductEmpty')}</p>}</> : <><div className="media-look-picker"><label>{t('admin.media.selectLook')}<select value={draft ? '' : lookId} onChange={e => { setDraft(null); setLookId(e.target.value); }}><option value="">{draft ? t('admin.media.newLookUnsaved') : t('admin.media.pickLookOption')}</option>{manager.looks.map(l => <option value={l.id} key={l.id}>{l.title}{l.published === false ? ` (${t('admin.media.hidden')})` : ''} · {t('admin.media.pinCount', { n: l.items?.length || 0 })}</option>)}</select></label><button type="button" onClick={startDraft}><Plus size={15} />{t('admin.media.createLook')}</button><a href="/lookbook" target="_blank" rel="noreferrer"><ExternalLink size={15} />{t('admin.media.viewLookbook')}</a></div>{look && <LookEditor key={`${look.id}-${look.revision}${look.isDraft ? '-draft' : ''}`} initial={look} manager={manager} onSaved={id => { setDraft(null); setLookId(id); }} />}</>}
    </>}
    </fieldset>
  </div>;
}

// Isolated UI fixture, no credentials, production API or database connection.
import { createServer } from 'vite';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const express = require('../../backend/node_modules/express');
const spreads = require('../src/data/editorialSpreads.json');
const { defaultLookbooks } = require('../../backend/services/lookbook');
let looks = defaultLookbooks();
let assets = spreads.flatMap(l => l.shoppableItems).map((i, index) => ({ _id: (index + 1).toString(16).padStart(24, '0'), url: i.image, thumbnailUrl: i.image, alt: i.name, width: 1254, height: 1254, bytes: 160000, archived: false }));
let products = spreads.flatMap(l => l.shoppableItems).map((i, index) => ({ ...i, _id: (index + 100).toString(16).padStart(24, '0'), quantity: 0, sizes: [], variants: [], mediaRevision: 0, gallery: [{ mediaId: assets[index]._id, url: i.image, alt: i.name, color: i.color }] }));
const fixture = express(); fixture.use(express.json());
fixture.get('/api/admin/media', (req, res) => res.json({ data: assets.filter(a => a.archived === (req.query.archived === 'true')), total: assets.length }));
fixture.get('/api/admin/lookbooks', (req, res) => res.json({ data: looks }));
fixture.get('/api/admin/media/products', (req, res) => { const result = products.filter(p => (p.name + p.id).toLowerCase().includes(String(req.query.search || '').toLowerCase())); res.json({ data: result, total: result.length }); });
fixture.put('/api/admin/lookbooks/:id', (req, res) => { looks = looks.map(l => l.id === req.params.id ? { ...l, ...req.body, revision: l.revision + 1 } : l); res.json({ success: true }); });
fixture.put('/api/admin/media/products/:id/gallery', (req, res) => { products = products.map(p => p._id === req.params.id ? { ...p, mediaRevision: p.mediaRevision + 1, gallery: req.body.images.map(i => ({ ...i, url: assets.find(a => a._id === i.mediaId).url })) } : p); res.json({ success: true }); });
fixture.use('/api', (req, res) => res.status(400).json({ message: 'This isolated fixture supports gallery and Lookbook editing only.' }));
const server = await createServer({ server: { host: '127.0.0.1', port: 5184, strictPort: true }, plugins: [{ name: 'isolated-media-preview', configureServer(vite) {
  vite.middlewares.use(fixture);
  vite.middlewares.use('/__media-preview', async (req, res) => {
    const html = await vite.transformIndexHtml('/__media-preview', '<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Media UI — isolated fixture</title><body style="margin:0;background:#faf8f5"><p style="padding:12px;margin:0;background:#e9e4da">หน้าทดสอบแยก · ไม่เชื่อมฐานข้อมูลจริง</p><div id="root" style="padding:24px"></div><script type="module">import "/src/index.css"; import React from "react"; import {createRoot} from "react-dom/client"; import MediaManager from "/src/features/media/MediaManager.jsx"; createRoot(document.getElementById("root")).render(React.createElement(MediaManager));</script></body></html>');
    res.setHeader('Content-Type', 'text/html'); res.end(html);
  });
} }] });
await server.listen();
console.log('Isolated media preview: http://127.0.0.1:5184/__media-preview');

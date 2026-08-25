const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '../frontend/public/images/products');

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatName(str) {
  return str.split(/[-_]/).map(capitalize).join(' ');
}

const colorHexMap = {
  'burnt_orange': '#C05C2B',
  'mustard': '#D4A338',
  'olive': '#556B2F',
  'brown': '#5C4033',
  'warm_brown': '#6E473B',
  'dark_brown': '#3E2723',
  'caramel': '#A0522D',
  'fuchsia': '#C2185B',
  'lavender': '#9575CD',
  'sky': '#64B5F6',
  'blue': '#1976D2',
  'teal': '#00796B',
  'pink': '#E91E63',
  'coral': '#FF6F61',
  'charcoal': '#2C3539',
  'cobalt': '#1A365D',
  'crimson': '#800020',
  'red': '#B71C1C',
  'white': '#F5F5F5',
  'cream': '#FFFDD0',
  'emerald': '#2E7D32',
  'sage': '#8F9779',
  'gold': '#D4AF37',
  'silver': '#C0C0C0',
  'black': '#1E2022'
};

function getColorHex(colorKey) {
  for (const [key, hex] of Object.entries(colorHexMap)) {
    if (colorKey.toLowerCase().includes(key)) return hex;
  }
  return '#2D5A27';
}

function getCategory(folderCat, subCat) {
  const c = (folderCat || '').toLowerCase();
  const s = (subCat || '').toLowerCase();
  if (c === 'tops') {
    if (s.includes('coat') || s.includes('jacket') || s.includes('parka') || s.includes('blazer')) return 'Outerwear';
    return 'Tops';
  }
  if (c === 'bottoms') return 'Bottoms';
  if (c === 'accessories') return 'Accessories';
  if (c === 'shoes') return 'Accessories';
  return 'Tops';
}

function getFit(category, subCat) {
  const s = (subCat || '').toLowerCase();
  if (s.includes('hoodie') || s.includes('sweat') || s.includes('crop') || s.includes('tee') || s.includes('tank')) return 'Oversized';
  if (s.includes('jean') || s.includes('chino') || s.includes('pant') || s.includes('linen')) return 'Wide Leg';
  if (s.includes('coat') || s.includes('blazer') || s.includes('suit') || s.includes('trouser')) return 'Tailored';
  if (s.includes('knit') || s.includes('sweater') || s.includes('polo') || s.includes('cardigan')) return 'Vintage Boxy';
  return 'Relaxed';
}

function getBasePrice(category, subCat) {
  const s = (subCat || '').toLowerCase();
  if (s.includes('coat') || s.includes('jacket') || s.includes('trench')) return 129.99;
  if (s.includes('sweater') || s.includes('knit') || s.includes('blazer') || s.includes('boots')) return 89.99;
  if (s.includes('jean') || s.includes('pants') || s.includes('chinos') || s.includes('jogger') || s.includes('linen')) return 69.99;
  if (s.includes('hoodie') || s.includes('sneaker') || s.includes('skirt') || s.includes('dress') || s.includes('loafer')) return 59.99;
  if (s.includes('shirt') || s.includes('shorts') || s.includes('polo') || s.includes('cardigan')) return 49.99;
  if (s.includes('t-shirt') || s.includes('tank') || s.includes('crop') || s.includes('sandal')) return 36.99;
  if (s.includes('bag') || s.includes('hat') || s.includes('sunglass')) return 39.99;
  if (s.includes('scarf') || s.includes('beanie') || s.includes('glove')) return 28.99;
  return 49.99;
}

// 1. Group all raw files by distinct product model
const rawModels = {};

function scanDir(dir, relPath = '') {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDir(fullPath, path.join(relPath, file));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
      // EXCLUDE all_colors.jpeg COMPLETELY
      if (file.toLowerCase() === 'all_colors.jpeg') continue;

      const parts = relPath.split(path.sep);
      const season = parts[0] || 'Core';
      const folderCat = parts[1] || 'Tops';
      let subCat = parts[2] || '';
      
      let standaloneId = '';
      if (folderCat === 'standalone' || season === 'standalone') {
        standaloneId = file.replace(/\.[^/.]+$/, '');
        subCat = standaloneId;
      }

      const modelKey = season + '__' + folderCat + '__' + subCat;
      if (!rawModels[modelKey]) {
        rawModels[modelKey] = {
          season: season === 'standalone' ? 'Artisan' : season,
          folderCat: folderCat === 'standalone' ? 'Tops' : folderCat,
          subCat: subCat || 'Essentials',
          images: []
        };
      }

      const imgPath = '/images/products/' + path.join(relPath, file).replace(/\\/g, '/');

      // extract color
      let colorName = 'Signature Blend';
      let colorKey = 'matcha';
      const match = file.match(/color_\d+_(.+)\.(jpeg|jpg|png|webp)/i);
      if (match) {
        colorKey = match[1];
        colorName = formatName(match[1]);
      } else {
        const base = file.replace(/\.[^/.]+$/, '');
        colorName = formatName(base);
        colorKey = base;
      }

      rawModels[modelKey].images.push({
        color: colorName,
        colorHex: getColorHex(colorKey),
        image: imgPath
      });
    }
  }
}

scanDir(baseDir);

// 2. Transform into structured master products
const masterProducts = [];
let idx = 1;

for (const [key, model] of Object.entries(rawModels)) {
  const mainCat = getCategory(model.folderCat, model.subCat);
  const fit = getFit(mainCat, model.subCat);
  const basePrice = getBasePrice(mainCat, model.subCat);
  const priceVariance = (idx * 4) % 15;
  const price = Number((basePrice + priceVariance).toFixed(2));
  const originalPrice = Number((price * 1.25).toFixed(2));

  const tags = ['Best Seller', 'New Drop', 'Limited 2026', 'Essentials', 'Trending', 'Popular'];
  const tag = tags[idx % tags.length];

  const prefix = model.season.substring(0, 3).toUpperCase();
  const catPrefix = mainCat.substring(0, 3).toUpperCase();
  const id = `${prefix}-${catPrefix}-${String(idx).padStart(3, '0')}`;

  const nameSub = formatName(model.subCat);
  const nameSeason = capitalize(model.season);
  const productName = `MatchA ${nameSeason} ${nameSub}`;

  const variants = model.images;
  const primaryVariant = variants[0] || { color: 'Matcha Sage', colorHex: '#8F9779', image: '/images/products/standalone/mustard_sweater.jpg' };

  masterProducts.push({
    id,
    name: productName,
    description: `Crafted for the ${nameSeason} capsule with premium heavyweight textiles, precision tailored seams, and signature MatchA earth tones.`,
    price,
    originalPrice,
    tag,
    image: primaryVariant.image,
    category: mainCat,
    subCategory: nameSub,
    season: nameSeason,
    color: primaryVariant.color,
    colorHex: primaryVariant.colorHex,
    fit,
    sizes: mainCat === 'Accessories' ? ['OS'] : ['S', 'M', 'L', 'XL', 'XXL'],
    variants: variants,
    inStock: idx % 11 !== 0,
    rating: Number((4.6 + (idx % 5) * 0.1).toFixed(1)),
    reviewsCount: 24 + (idx * 9) % 190,
    isFeatured: idx % 4 === 0,
    createdAt: '2026-02-' + String((idx % 26) + 1).padStart(2, '0')
  });

  idx++;
}

console.log('Total Master Products generated:', masterProducts.length);

// Write to backend
const backendFile = path.resolve(__dirname, '../backend/data/products.js');
const backendContent = 'const products = ' + JSON.stringify(masterProducts, null, 2) + ';\n\nmodule.exports = products;\n';
fs.writeFileSync(backendFile, backendContent);

// Write to frontend
const frontendFile = path.resolve(__dirname, '../frontend/src/data/productsData.js');
const frontendContent = 'export const productsData = ' + JSON.stringify(masterProducts, null, 2) + ';\n';
fs.writeFileSync(frontendFile, frontendContent);

console.log('Successfully updated both backend and frontend master products data!');

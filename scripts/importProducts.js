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
  'silver': '#C0C0C0'
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
  if (s.includes('hoodie') || s.includes('sweat') || s.includes('crop') || s.includes('tee')) return 'Oversized';
  if (s.includes('jean') || s.includes('chino') || s.includes('pant')) return 'Wide Leg';
  if (s.includes('coat') || s.includes('blazer') || s.includes('suit') || s.includes('trouser')) return 'Tailored';
  if (s.includes('knit') || s.includes('sweater') || s.includes('polo')) return 'Vintage Boxy';
  return 'Relaxed';
}

function getBasePrice(category, subCat) {
  const s = (subCat || '').toLowerCase();
  if (s.includes('coat') || s.includes('jacket') || s.includes('trench')) return 119.99;
  if (s.includes('sweater') || s.includes('knit') || s.includes('blazer') || s.includes('boots')) return 89.99;
  if (s.includes('jean') || s.includes('pants') || s.includes('chinos') || s.includes('jogger')) return 69.99;
  if (s.includes('hoodie') || s.includes('sneaker') || s.includes('skirt') || s.includes('dress')) return 59.99;
  if (s.includes('shirt') || s.includes('shorts') || s.includes('polo')) return 45.99;
  if (s.includes('t-shirt') || s.includes('tank') || s.includes('crop')) return 34.99;
  if (s.includes('bag') || s.includes('hat') || s.includes('sunglass')) return 39.99;
  if (s.includes('scarf') || s.includes('beanie') || s.includes('glove')) return 26.99;
  return 49.99;
}

const products = [];
let index = 1;

function walk(dir, relPath = '') {
  const list = fs.readdirSync(dir);
  
  // check if directory contains all_colors.jpeg
  const hasAllColors = list.includes('all_colors.jpeg');
  const allColorsRel = hasAllColors ? '/images/products/' + relPath.replace(/\\/g, '/') + '/all_colors.jpeg' : null;

  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      walk(fullPath, path.join(relPath, file));
    } else if (/\.(jpg|jpeg|png|webp)$/i.test(file)) {
      const parts = relPath.split(path.sep);
      const season = parts[0] || 'Core';
      const folderCat = parts[1] || 'Tops';
      const subCat = parts[2] || (folderCat === 'standalone' ? file.replace(/\.[^/.]+$/, '') : '');

      const imgPath = '/images/products/' + path.join(relPath, file).replace(/\\/g, '/');

      // extract color name from filename like color_1_burnt_orange.jpeg
      let colorName = 'Signature Blend';
      let colorKey = 'matcha';
      const match = file.match(/color_\d+_(.+)\.(jpeg|jpg|png|webp)/i);
      if (match) {
        colorKey = match[1];
        colorName = formatName(match[1]);
      } else if (file === 'all_colors.jpeg') {
        colorName = 'Multi-Color Palette';
        colorKey = 'multi';
      } else {
        const base = file.replace(/\.[^/.]+$/, '');
        colorName = formatName(base);
        colorKey = base;
      }

      const mainCat = getCategory(folderCat, subCat);
      const fit = getFit(mainCat, subCat);
      const basePrice = getBasePrice(mainCat, subCat);
      const priceVariance = ((index * 3) % 15);
      const price = Number((basePrice + priceVariance).toFixed(2));
      const originalPrice = Number((price * 1.25).toFixed(2));

      const tags = ['Best Seller', 'New Drop', 'Limited 2026', 'Essentials', 'Trending', 'Popular'];
      const tag = tags[index % tags.length];

      const prefix = season.substring(0, 3).toUpperCase();
      const catPrefix = mainCat.substring(0, 3).toUpperCase();
      const id = `${prefix}-${catPrefix}-${String(index).padStart(3, '0')}`;

      const nameSub = formatName(subCat || 'Street Style');
      const nameSeason = capitalize(season === 'standalone' ? 'Artisan' : season);
      const productName = `MatchA ${nameSeason} ${nameSub} in ${colorName}`;

      products.push({
        id,
        name: productName,
        description: `Premium ${nameSeason} collection ${nameSub.toLowerCase()} crafted from ethically sourced fabrics with ${colorName.toLowerCase()} tone finish.`,
        price,
        originalPrice,
        tag,
        image: imgPath,
        secondaryImage: allColorsRel || imgPath,
        category: mainCat,
        subCategory: formatName(subCat),
        season: capitalize(season),
        color: colorName,
        colorHex: getColorHex(colorKey),
        fit,
        sizes: mainCat === 'Accessories' ? ['OS'] : ['S', 'M', 'L', 'XL', 'XXL'],
        inStock: index % 12 !== 0,
        rating: Number((4.5 + (index % 6) * 0.1).toFixed(1)),
        reviewsCount: 15 + (index * 7) % 180,
        isFeatured: index % 5 === 0,
        createdAt: '2026-02-' + String((index % 25) + 1).padStart(2, '0')
      });

      index++;
    }
  }
}

walk(baseDir);

console.log('Total products generated:', products.length);

// Write to backend
const backendFile = path.resolve(__dirname, '../backend/data/products.js');
const backendContent = 'const products = ' + JSON.stringify(products, null, 2) + ';\n\nmodule.exports = products;\n';
fs.writeFileSync(backendFile, backendContent);

// Write to frontend
const frontendFile = path.resolve(__dirname, '../frontend/src/data/productsData.js');
const frontendContent = 'export const productsData = ' + JSON.stringify(products, null, 2) + ';\n';
fs.writeFileSync(frontendFile, frontendContent);

console.log('Successfully written all products to both backend and frontend data files!');

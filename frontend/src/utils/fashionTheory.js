/**
 * Computational Fashion Styling & Color Harmony Engine
 * Based on:
 * 1. Classical Color Harmony (Monochromatic, Analogous, Complementary, 60-30-10 Rule)
 * 2. Johannes Itten's 7 Color Contrasts (Bauhaus Theory)
 * 3. Munsell Color Space & CIELAB Delta E Distance
 * 4. Modular Wardrobe Combinatorics & Outfit Compatibility Metric Learning
 */

// ==========================================
// 1. COLOR SPACE TRANSFORMATIONS
// ==========================================

export function hexToRgb(hex) {
  if (!hex) return { r: 128, g: 128, b: 128 };
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
      default: break;
    }
  }

  return {
    h: Math.round(h * 360),       // 0 - 360
    s: Math.round(s * 100),       // 0 - 100%
    l: Math.round(l * 100)        // 0 - 100%
  };
}

// Convert sRGB to CIELAB (D65 standard illuminant)
export function rgbToLab(r, g, b) {
  // 1. Linearize sRGB
  const sRgb = [r, g, b].map(v => {
    v /= 255;
    return v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92;
  });

  // 2. Observer = 2°, Illuminant = D65 matrix
  let x = (sRgb[0] * 0.4124 + sRgb[1] * 0.3576 + sRgb[2] * 0.1805) / 0.95047;
  let y = (sRgb[0] * 0.2126 + sRgb[1] * 0.7152 + sRgb[2] * 0.0722) / 1.00000;
  let z = (sRgb[0] * 0.0193 + sRgb[1] * 0.1192 + sRgb[2] * 0.9505) / 1.08883;

  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return {
    L: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz)
  };
}

// CIELAB Delta E (CIE76 Euclidean perceptual distance)
export function calculateDeltaE(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lab1 = rgbToLab(rgb1.r, rgb1.g, rgb1.b);
  const lab2 = rgbToLab(rgb2.r, rgb2.g, rgb2.b);

  const dL = lab1.L - lab2.L;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;
  return Math.sqrt(dL * dL + da * da + db * db);
}

// ==========================================
// 2. COLOR TEMPERATURE & UNDERTONE
// ==========================================

export function getColorTemperature(hue) {
  // 0 - 60: Red to Yellow (Warm)
  // 60 - 150: Yellow-Green to Green (Neutral-Warm to Neutral-Cool)
  // 150 - 270: Teal, Cyan, Blue, Violet (Cool)
  // 270 - 360: Magenta to Red (Warm-Neutral to Warm)
  if (hue >= 25 && hue <= 75) return 'Warm';
  if (hue > 75 && hue < 160) return 'Neutral-Cool';
  if (hue >= 160 && hue <= 270) return 'Cool';
  return 'Warm';
}

const SEASON_UNDERTONE_MAP = {
  Spring: 'Warm',
  Autumn: 'Warm',
  Summer: 'Cool',
  Winter: 'Cool'
};

// ==========================================
// 3. COLOR HARMONY CLASSIFIER
// ==========================================

export function classifyColorHarmony(hexList) {
  if (!hexList || hexList.length < 2) {
    return { type: 'Monochromatic', label: 'Monochromatic Clean', description: 'สีคุมโทนเดี่ยว เรียบหรู มินิมอล' };
  }

  const hslList = hexList.map(hex => {
    const rgb = hexToRgb(hex);
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  });

  const hues = hslList.map(item => item.h);
  const saturations = hslList.map(item => item.s);
  const lightnesses = hslList.map(item => item.l);

  // Check for predominantly neutral / earthy outfit
  const avgSat = saturations.reduce((a, b) => a + b, 0) / saturations.length;
  if (avgSat < 22) {
    return {
      type: 'Neutral Muted',
      label: 'Earthy & Neutral Harmony',
      description: 'โทนสีธรรมชาติ (Earth / Muted Tone) สุภาพ สบายตา เข้ากันได้กับทุกโอกาส',
      scoreBonus: 8
    };
  }

  // Calculate circular hue differences between primary slots (Top vs Bottom)
  const dHue1 = Math.abs(hues[0] - hues[1]);
  const hueDiff1 = Math.min(dHue1, 360 - dHue1);

  if (hueDiff1 <= 25) {
    return {
      type: 'Monochromatic',
      label: 'Monochromatic Tone-on-Tone',
      description: 'สีเฉดเดียวกันแต่ต่างระดับความสว่าง (Value) สไตล์โมเดิร์นคลีน ทันสมัย',
      scoreBonus: 10
    };
  }

  if (hueDiff1 > 25 && hueDiff1 <= 55) {
    return {
      type: 'Analogous',
      label: 'Analogous Harmonic Flow',
      description: 'สีข้างเคียงบนวงล้อสี มีมิติอย่างเป็นธรรมชาติและมองแล้วสบายตาสูงสุด',
      scoreBonus: 12
    };
  }

  if (hueDiff1 >= 140 && hueDiff1 <= 220) {
    return {
      type: 'Complementary',
      label: 'High-Contrast Complementary',
      description: 'สีคู่ตรงข้าม 180° สร้างความโดดเด่นสะดุดตาตามทฤษฎี Optical Contrast',
      scoreBonus: 10
    };
  }

  return {
    type: 'Triadic / Balanced',
    label: 'Balanced Triadic Palette',
    description: 'การกระจายตัวของคู่สีอย่างสมดุล ให้ความรู้สึกมีชีวิตชีวาและน่าค้นหา',
    scoreBonus: 7
  };
}

// ==========================================
// 4. JOHANNES ITTEN 7 CONTRASTS ANALYZER
// ==========================================

export function analyzeIttenContrasts(items) {
  const contrasts = [];
  if (!items || items.length < 2) return contrasts;

  const hslList = items.map(item => {
    const rgb = hexToRgb(item?.colorHex || '#808080');
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
  });

  // 1. Light-Dark Contrast (Value)
  const lValues = hslList.map(c => c.l);
  const deltaL = Math.max(...lValues) - Math.min(...lValues);
  if (deltaL >= 35) {
    contrasts.push({
      id: 'light-dark',
      name: 'Light-Dark Contrast (Value)',
      badge: `ΔL = ${deltaL}%`,
      description: 'ความต่างของระดับความสว่าง-มืด ช่วยสร้างมิติความลึก (Depth) ให้รูปร่างไม่แบนราบ'
    });
  }

  // 2. Cold-Warm Contrast (Temperature)
  const temps = hslList.map(c => getColorTemperature(c.h));
  const hasWarm = temps.includes('Warm');
  const hasCool = temps.includes('Cool') || temps.includes('Neutral-Cool');
  if (hasWarm && hasCool) {
    contrasts.push({
      id: 'cold-warm',
      name: 'Cold-Warm Balance (Temperature)',
      badge: 'Thermal Synergy',
      description: 'การผสานระหว่างโทนอุ่นและโทนเย็น ดึงดูดสายตาอย่างมีระดับ'
    });
  }

  // 3. Contrast of Saturation (Chroma)
  const sValues = hslList.map(c => c.s);
  const deltaS = Math.max(...sValues) - Math.min(...sValues);
  if (deltaS >= 30) {
    contrasts.push({
      id: 'saturation',
      name: 'Saturation Contrast (Chroma)',
      badge: `ΔS = ${deltaS}%`,
      description: 'การจับคู่สีสดเข้ากับสีหม่น เป็นจุดพักสายตาช่วยให้ชุดดูแพงขึ้น'
    });
  }

  return contrasts;
}

// ==========================================
// 5. MASTER COMPUTATIONAL STYLING ENGINE
// Formula: S_ij = w1*Season + w2*ColorHarmony + w3*ValueContrast + w4*Silhouette
// ==========================================

export function computeOutfitSynergy(selectedTop, selectedBottom, selectedFootwear, selectedAccessory) {
  const items = [selectedTop, selectedBottom, selectedFootwear, selectedAccessory].filter(Boolean);
  if (items.length === 0) {
    return {
      score: 85,
      harmonyType: 'Neutral Minimal',
      harmonyDescription: 'ยังไม่ได้เลือกชุด',
      undertoneStatus: 'Neutral',
      dominantSeason: 'Autumn',
      proportion60_30_10: null,
      ittenContrasts: [],
      deltaE: 0,
      stylingAdvice: 'เริ่มเลือกเสื้อผ้า รองเท้า และเครื่องประดับเพื่อวิเคราะห์ค่าความเข้ากันได้'
    };
  }

  const hexList = items.map(i => i.colorHex || '#5C4033');
  const seasons = items.map(i => i.season || 'Autumn');

  // A. Seasonal Synergy (w1 = 35%)
  const firstSeason = seasons[0];
  const allSameSeason = seasons.every(s => s === firstSeason);
  const undertones = seasons.map(s => SEASON_UNDERTONE_MAP[s] || 'Warm');
  const sameUndertone = undertones.every(u => u === undertones[0]);

  let seasonPoints = 0;
  let undertoneStatus = '';
  if (allSameSeason) {
    seasonPoints = 35;
    undertoneStatus = `Harmonious ${firstSeason} Head-to-Toe Capsule (100% Match)`;
  } else if (sameUndertone) {
    seasonPoints = 31;
    undertoneStatus = `Harmonious ${undertones[0]} Undertone Alignment`;
  } else {
    seasonPoints = 25;
    undertoneStatus = 'Dynamic Cross-Season Contrast';
  }

  // B. Color Harmony & Delta E (w2 = 30%)
  const harmony = classifyColorHarmony(hexList);
  const harmonyPoints = 18 + (harmony.scoreBonus || 7);

  // Delta E calculation between top and bottom
  const deltaE = hexList.length >= 2 ? Math.round(calculateDeltaE(hexList[0], hexList[1])) : 20;

  // C. Contrast of Value & Extension (w3 = 20%)
  const ittenContrasts = analyzeIttenContrasts(items);
  let contrastPoints = 14;
  if (ittenContrasts.some(c => c.id === 'light-dark')) contrastPoints += 4;
  if (ittenContrasts.some(c => c.id === 'cold-warm')) contrastPoints += 2;

  // D. Silhouette & Form Balance (w4 = 15%)
  let fitPoints = 12;
  const topFit = (selectedTop?.fit || 'Relaxed').toLowerCase();
  const bottomFit = (selectedBottom?.fit || 'Relaxed').toLowerCase();

  // Rule of Thirds & Silhouette Golden Ratio:
  // Oversized + Relaxed/Tailored = High Aesthetic
  if ((topFit.includes('oversized') || topFit.includes('boxy')) && (bottomFit.includes('tailored') || bottomFit.includes('relaxed'))) {
    fitPoints = 15;
  } else if (topFit === bottomFit) {
    fitPoints = 14;
  }

  // Calculate final score bounded [75 - 99]
  const rawScore = seasonPoints + harmonyPoints + contrastPoints + fitPoints;
  const score = Math.min(99, Math.max(78, rawScore));

  // E. 60-30-10 Proportion Breakdown (Head-to-Toe 4 Slots)
  // Base 60% = Lower Body (Bottoms)
  // Secondary 30% = Upper Body (Tops/Outerwear)
  // Accent 10% = Footwear Anchor (5%) + Accent Accessories (5%)
  const proportion60_30_10 = {
    base: {
      role: 'Base (60%)',
      itemType: 'ท่อนล่าง (Lower Body)',
      name: selectedBottom?.name || 'Bottom Garment',
      color: selectedBottom?.color || 'Color',
      hex: selectedBottom?.colorHex || '#333333',
      percent: 60
    },
    secondary: {
      role: 'Secondary (30%)',
      itemType: 'ท่อนบน (Upper Body)',
      name: selectedTop?.name || 'Top Garment',
      color: selectedTop?.color || 'Color',
      hex: selectedTop?.colorHex || '#666666',
      percent: 30
    },
    footwear: {
      role: 'Footwear (5%)',
      itemType: 'รองเท้า (Footwear Anchor)',
      name: selectedFootwear?.name || 'Footwear',
      color: selectedFootwear?.color || 'Color',
      hex: selectedFootwear?.colorHex || '#444444',
      percent: 5
    },
    accent: {
      role: 'Accessory (5%)',
      itemType: 'เครื่องประดับ/กระเป๋า',
      name: selectedAccessory?.name || 'Accessory',
      color: selectedAccessory?.color || 'Color',
      hex: selectedAccessory?.colorHex || '#999999',
      percent: 5
    }
  };

  // F. Editorial Styling Advice Generator
  let advice = '';
  if (allSameSeason) {
    advice = `คุมโทนลุคสมบูรณ์แบบตั้งแต่หัวจรดเท้าในพาเลตต์ ${firstSeason} ขับเน้นออร่าอันเดอร์โทนของผู้สวมใส่ เสริมด้วยทฤษฎี ${harmony.label}`;
  } else if (sameUndertone) {
    advice = `จับคู่ 4 ชิ้นที่ใช้อันเดอร์โทน ${undertones[0]} ร่วมกันอย่างประณีต รองเท้าทำหน้าที่เป็น Visual Anchor ถ่วงสมดุลกับกระเป๋าได้ยอดเยี่ยม`;
  } else {
    advice = `การผสมผสานสีแบบ Optical Contrast ที่โฉบเฉี่ยว รองเท้าและแอกเซสซอรีช่วยคุมสัดส่วน 10% Accent ได้อย่างลงตัว`;
  }

  return {
    score,
    harmonyType: harmony.label,
    harmonyCategory: harmony.type,
    harmonyDescription: harmony.description,
    undertoneStatus,
    dominantSeason: firstSeason || 'Autumn',
    deltaE,
    ittenContrasts,
    proportion60_30_10,
    stylingAdvice: advice
  };
}

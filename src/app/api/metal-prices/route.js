// src/app/api/metal-prices/route.js
// Fetches official BAJUS gold & silver prices from goldr.org
// goldr.org aggregates directly from Bangladesh Jewellers Association (BAJUS)
// Falls back to gold-api.com international spot if scraping fails

export const dynamic = 'force-dynamic';

const GRAMS_PER_VORI    = 11.664;
const NISAB_SILVER_GRAMS = 612.36; // 52.5 Tola × 11.664g

// ── Bengali numeral → ASCII ────────────────────────────────────────────────
const BENGALI = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
const bn2ascii = (s) => s.replace(/[০-৯]/g, (c) => BENGALI[c] ?? c);

// Extract number from a Bengali or ASCII price string (e.g. "২২,৩৮০" → 22380)
const parsePrice = (s) => {
  if (!s) return null;
  const digits = bn2ascii(s).replace(/[^\d]/g, '');
  return digits.length ? parseInt(digits, 10) : null;
};

// ─── Primary: scrape goldr.org ─────────────────────────────────────────────
// goldr.org renders BAJUS prices in HTML tables as:
// <td>22 Karat Gold</td><td><strong>৳২২,৩৮০</strong> $183.14</td>...
// The page has 4 unit sections (gram, vori, ana, rati) so each label appears 4×
// We take: 1st occurrence = per gram, 2nd = per vori
async function scrapeGoldr() {
  const res = await fetch('https://www.goldr.org/', {
    headers: {
      'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Cache-Control':   'no-cache',
    },
    next: { revalidate: 3600 }, // 1-hour cache — BAJUS updates prices once daily
  });
  if (!res.ok) throw new Error(`goldr.org returned HTTP ${res.status}`);
  const html = await res.text();

  // ── Core row extractor ─────────────────────────────────────────────────
  // Finds ALL occurrences of a label's row and returns prices in order
  // Each table row in HTML: ...<td>LABEL</td><td><strong>৳PRICE</strong>...
  function allPricesForLabel(label) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Match label then first <strong>৳...</strong> that follows (greedy-lazy)
    const rx = new RegExp(esc + '[\\s\\S]*?<strong>৳([\\d,০-৯]+)<\\/strong>', 'g');
    const results = [];
    let m;
    while ((m = rx.exec(html)) !== null) {
      const price = parsePrice(m[1]);
      if (price) results.push(price);
    }
    return results;
  }

  // ── Gold per-gram (1st occurrence) and per-vori (2nd occurrence) ──────
  const gold22  = allPricesForLabel('22 Karat Gold');
  const gold21  = allPricesForLabel('21 Karat Gold');
  const gold18  = allPricesForLabel('18 Karat Gold');
  // "Traditional" appears in BOTH gold and silver tables — grab all then split
  const tradAll = allPricesForLabel('Traditional');

  // ── Silver per-gram and per-vori ──────────────────────────────────────
  const silver22 = allPricesForLabel('22 Karat Silver');
  const silver21 = allPricesForLabel('21 Karat Silver');
  const silver18 = allPricesForLabel('18 Karat Silver');

  // Validate we got core prices
  if (!gold22.length || !silver22.length) {
    throw new Error(
      `Could not extract prices from goldr.org. ` +
      `gold22=${JSON.stringify(gold22)}, silver22=${JSON.stringify(silver22)}. ` +
      `HTML length=${html.length}. Page structure may have changed.`
    );
  }

  // Per-gram = index 0, per-vori = index 1 (page shows gram first, then vori)
  const g = (arr, i) => arr[i] ?? null;
  const deriveVori = (gram) => gram ? Math.round(gram * GRAMS_PER_VORI) : null;

  // "Traditional" appears in both gold and silver tables.
  // Page order: gold/gram table, silver/gram table, gold/vori table, silver/vori table
  // So tradAll indices: 0=gold-gram, 1=silver-gram, 2=gold-vori, 3=silver-vori
  // (each table section has exactly one Traditional row)
  const tradGoldGram   = g(tradAll, 0);
  const tradSilverGram = g(tradAll, 1) ?? null;
  const tradGoldVori   = g(tradAll, 2) ?? deriveVori(tradGoldGram);
  const tradSilverVori = g(tradAll, 3) ?? (tradSilverGram ? Math.round(tradSilverGram * GRAMS_PER_VORI) : null);

  // ── FX rate (goldr.org shows it in footer: "১ ডলার = 122.20 টাকা") ──
  // The Bengali "১ ডলার" = \u09E7 \u09A1\u09B2\u09BE\u09B0
  // The number is in ASCII digits, টাকা = \u099F\u09BE\u0995\u09BE
  const fxMatch = html.match(/\u09E7\s+\u09A1\u09B2\u09BE\u09B0\s*=\s*([\d.]+)/);
  const usdToBdt = fxMatch ? parseFloat(fxMatch[1]) : null;

  return {
    source:   'goldr.org (official BAJUS rates)',
    usdToBdt,
    gold: {
      karat22:     { perGram: g(gold22, 0),  perVori: g(gold22, 1)  ?? deriveVori(g(gold22, 0))  },
      karat21:     { perGram: g(gold21, 0),  perVori: g(gold21, 1)  ?? deriveVori(g(gold21, 0))  },
      karat18:     { perGram: g(gold18, 0),  perVori: g(gold18, 1)  ?? deriveVori(g(gold18, 0))  },
      traditional: { perGram: tradGoldGram,  perVori: tradGoldVori  },
    },
    silver: {
      karat22: { perGram: g(silver22, 0), perVori: g(silver22, 1) ?? deriveVori(g(silver22, 0)) },
      karat21: { perGram: g(silver21, 0), perVori: g(silver21, 1) ?? deriveVori(g(silver21, 0)) },
      karat18: { perGram: g(silver18, 0), perVori: g(silver18, 1) ?? deriveVori(g(silver18, 0)) },
      traditional: { perGram: tradSilverGram, perVori: tradSilverVori },
    },
  };
}

// ─── Fallback: gold-api.com + open.er-api.com ─────────────────────────────
async function fetchSpotFallback() {
  const [goldRes, silverRes, fxRes] = await Promise.all([
    fetch('https://api.gold-api.com/price/XAU'),
    fetch('https://api.gold-api.com/price/XAG'),
    fetch('https://open.er-api.com/v6/latest/USD'),
  ]);
  const { price: goldUSD }   = await goldRes.json();
  const { price: silverUSD } = await silverRes.json();
  const { rates }            = await fxRes.json();
  const usdToBdt = rates?.BDT ?? 122;

  const TROY = 31.1034768;
  const goldGram   = (goldUSD   / TROY) * usdToBdt;
  const silverGram = (silverUSD / TROY) * usdToBdt;
  const k = (gram, karat) => Math.round(gram * karat / 24);

  return {
    source:        'gold-api.com (international spot — not BAJUS)',
    isSpotFallback: true,
    usdToBdt,
    gold: {
      karat22:     { perGram: k(goldGram,22), perVori: Math.round(k(goldGram,22) * GRAMS_PER_VORI) },
      karat21:     { perGram: k(goldGram,21), perVori: Math.round(k(goldGram,21) * GRAMS_PER_VORI) },
      karat18:     { perGram: k(goldGram,18), perVori: Math.round(k(goldGram,18) * GRAMS_PER_VORI) },
      traditional: { perGram: k(goldGram,14), perVori: Math.round(k(goldGram,14) * GRAMS_PER_VORI) },
    },
    silver: {
      karat22:     { perGram: k(silverGram,22), perVori: Math.round(k(silverGram,22) * GRAMS_PER_VORI) },
      karat21:     { perGram: k(silverGram,21), perVori: Math.round(k(silverGram,21) * GRAMS_PER_VORI) },
      karat18:     { perGram: k(silverGram,18), perVori: Math.round(k(silverGram,18) * GRAMS_PER_VORI) },
      traditional: { perGram: k(silverGram,10), perVori: Math.round(k(silverGram,10) * GRAMS_PER_VORI) },
    },
  };
}

// ─── Route handler ─────────────────────────────────────────────────────────
export async function GET() {
  let data;
  let scrapeError = null;

  try {
    data = await scrapeGoldr();
  } catch (err) {
    scrapeError = err.message;
    try {
      data = await fetchSpotFallback();
    } catch (fallbackErr) {
      return Response.json({ success: false, error: fallbackErr.message }, { status: 500 });
    }
  }

  const g22g  = data.gold.karat22.perGram;
  const g22v  = data.gold.karat22.perVori;

  // Nisab is always calculated from Traditional (Sanaton) silver —
  // the standard Islamic reference is pure silver equivalent, not jewellery grade.
  // Traditional silver is the closest to raw silver price in BAJUS pricing.
  const stg   = data.silver.traditional.perGram;  // Traditional silver per gram
  const stv   = data.silver.traditional.perVori;  // Traditional silver per vori

  // Fallback: if Traditional silver not fetched, use lowest available karat
  const nisabBase = stg
    ?? data.silver.karat18?.perGram
    ?? data.silver.karat21?.perGram
    ?? data.silver.karat22?.perGram;

  const nisabFull    = Math.round(nisabBase * NISAB_SILVER_GRAMS);
  const nisabMinus15 = Math.round(nisabFull * 0.85);

  return Response.json({
    success:        !data.isSpotFallback,
    isSpotFallback: data.isSpotFallback ?? false,
    scrapeError,
    source:         data.source,
    fetchedAt:      new Date().toISOString(),
    usdToBdt:       data.usdToBdt,

    gold:   data.gold,
    silver: data.silver,

    primaryGold: {
      perGram:        g22g,
      perVori:        g22v,
      perGramMinus15: Math.round(g22g * 0.85),
      perVoriMinus15: Math.round(g22v * 0.85),
    },
    // primarySilver = Traditional silver (used for Nisab calculation)
    primarySilver: {
      perGram:        stg,
      perVori:        stv,
      perGramMinus15: stg ? Math.round(stg * 0.85) : null,
      perVoriMinus15: stv ? Math.round(stv * 0.85) : null,
    },
    nisab: {
      full:         nisabFull,
      withMinus15:  nisabMinus15,
      silverGrams:  NISAB_SILVER_GRAMS,
      silverVori:   52.5,
      silverKarat:  'Traditional',
      basePricePerGram: nisabBase,
    },
  });
}

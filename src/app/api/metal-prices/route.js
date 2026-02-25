// src/app/api/metal-prices/route.js
// Scrapes real BAJUS prices from goldr.org (server-side, no CORS issues)
// Falls back to gold-api.com international spot if scraping fails

export const dynamic = 'force-dynamic';

// ─── Bengali numeral → ASCII digit conversion ────────────────────────────────
const BENGALI_DIGITS = { '০':'0','১':'1','২':'2','৩':'3','৪':'4','৫':'5','৬':'6','৭':'7','৮':'8','৯':'9' };
function bengaliToAscii(str) {
  return str.replace(/[০-৯]/g, (ch) => BENGALI_DIGITS[ch] || ch);
}

// Parse a Bengali price like "৳২২,৩৮০" → 22380
function parseBengaliPrice(str) {
  const ascii = bengaliToAscii(str);
  const digits = ascii.replace(/[^\d.]/g, '');
  return digits ? parseFloat(digits) : null;
}

// ─── Primary: scrape goldr.org ───────────────────────────────────────────────
async function scrapeGoldr() {
  const res = await fetch('https://www.goldr.org/', {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; NisabWallet/1.0)',
      'Cache-Control': 'no-cache',
    },
    next: { revalidate: 3600 }, // cache 1 hour — BAJUS updates prices daily
  });

  if (!res.ok) throw new Error(`goldr.org returned HTTP ${res.status}`);
  const html = await res.text();

  // ── Gold per gram ──────────────────────────────────────────────────────────
  // Pattern: "22 Karat Gold" row, first bold price cell
  // HTML: | 22 Karat Gold | **৳২২,৩৮০** $183.14 | **৳১৮,৫৭৫** $152.00 |
  const goldGramMatch = html.match(
    /22 Karat Gold[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/
  );
  // Traditional gold per gram (for reference)
  const tradGoldMatch = html.match(
    /Traditional[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/
  );
  // 18K gold per gram
  const gold18Match = html.match(
    /18 Karat Gold[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/
  );
  // 21K gold per gram
  const gold21Match = html.match(
    /21 Karat Gold[^|]*\|\s*\*\*৳([\d,০-৭]+)\*\*/
  );

  // ── Silver per gram ────────────────────────────────────────────────────────
  // Pattern: "22 Karat Silver" row
  const silverGramMatch = html.match(
    /22 Karat Silver[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/
  );
  const silver21Match = html.match(
    /21 Karat Silver[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/
  );
  const silver18Match = html.match(
    /18 Karat Silver[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/
  );

  // ── Gold per vori ──────────────────────────────────────────────────────────
  // The page repeats the table with "per vori" section — same row pattern
  // Find all occurrences of 22 Karat Gold and take the 2nd match (vori section)
  const allGold22 = [...html.matchAll(/22 Karat Gold[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/g)];
  const goldVoriMatch = allGold22[1]; // second occurrence = per vori table

  const allSilver22 = [...html.matchAll(/22 Karat Silver[^|]*\|\s*\*\*৳([\d,০-৯]+)\*\*/g)];
  const silverVoriMatch = allSilver22[1]; // second occurrence = per vori table

  // ── Exchange rate from page (they show it in the footer) ──────────────────
  // "১ ডলার = ১২২.২০৪০৫৫৩৭ টাকা"
  const fxMatch = html.match(/১ ডলার = ([\d.]+) টাকা/);
  const usdToBdt = fxMatch ? parseFloat(fxMatch[1]) : null;

  // ── Parse all values ───────────────────────────────────────────────────────
  const parse = (m) => m ? parseBengaliPrice(m[1]) : null;

  const gold22PerGram  = parse(goldGramMatch);
  const gold21PerGram  = parse(gold21Match);
  const gold18PerGram  = parse(gold18Match);
  const goldTradGram   = parse(tradGoldMatch);
  const gold22PerVori  = goldVoriMatch ? parseBengaliPrice(goldVoriMatch[1]) : null;

  const silver22PerGram = parse(silverGramMatch);
  const silver21PerGram = parse(silver21Match);
  const silver18PerGram = parse(silver18Match);
  const silver22PerVori = silverVoriMatch ? parseBengaliPrice(silverVoriMatch[1]) : null;

  if (!gold22PerGram || !silver22PerGram) {
    throw new Error('Could not parse gold/silver prices from goldr.org HTML. Page structure may have changed.');
  }

  // Derive per-vori from per-gram if vori table not found
  const GRAM_PER_VORI = 11.664;
  const g22Vori  = gold22PerVori  || Math.round(gold22PerGram  * GRAM_PER_VORI);
  const s22Vori  = silver22PerVori || Math.round(silver22PerGram * GRAM_PER_VORI);

  return {
    source: 'goldr.org (BAJUS)',
    usdToBdt,
    gold: {
      karat22: { perGram: gold22PerGram, perVori: g22Vori },
      karat21: { perGram: gold21PerGram, perVori: gold21PerGram ? Math.round(gold21PerGram * GRAM_PER_VORI) : null },
      karat18: { perGram: gold18PerGram, perVori: gold18PerGram ? Math.round(gold18PerGram * GRAM_PER_VORI) : null },
      traditional: { perGram: goldTradGram, perVori: goldTradGram ? Math.round(goldTradGram * GRAM_PER_VORI) : null },
    },
    silver: {
      karat22: { perGram: silver22PerGram, perVori: s22Vori },
      karat21: { perGram: silver21PerGram, perVori: silver21PerGram ? Math.round(silver21PerGram * GRAM_PER_VORI) : null },
      karat18: { perGram: silver18PerGram, perVori: silver18PerGram ? Math.round(silver18PerGram * GRAM_PER_VORI) : null },
    },
  };
}

// ─── Fallback: gold-api.com international spot + open.er-api.com FX ─────────
async function fetchSpotFallback() {
  const GRAM_PER_VORI = 11.664;
  const TROY_OZ_TO_GRAM = 31.1034768;

  const [goldRes, silverRes, fxRes] = await Promise.all([
    fetch('https://api.gold-api.com/price/XAU'),
    fetch('https://api.gold-api.com/price/XAG'),
    fetch('https://open.er-api.com/v6/latest/USD'),
  ]);

  const goldData   = await goldRes.json();
  const silverData = await silverRes.json();
  const fxData     = await fxRes.json();

  const usdToBdt = fxData?.rates?.BDT || 122;
  const goldUSD  = goldData.price;
  const silverUSD = silverData.price;

  // Convert spot USD/oz → BDT/gram (international, no BAJUS premium)
  const goldGram   = Math.round((goldUSD   / TROY_OZ_TO_GRAM) * usdToBdt);
  const silverGram = Math.round((silverUSD / TROY_OZ_TO_GRAM) * usdToBdt);

  // Karat conversions
  const karat = (gram, k) => Math.round(gram * k / 24);

  return {
    source: 'gold-api.com (international spot — not BAJUS)',
    usdToBdt,
    gold: {
      karat22: { perGram: karat(goldGram, 22), perVori: Math.round(karat(goldGram, 22) * GRAM_PER_VORI) },
      karat21: { perGram: karat(goldGram, 21), perVori: Math.round(karat(goldGram, 21) * GRAM_PER_VORI) },
      karat18: { perGram: karat(goldGram, 18), perVori: Math.round(karat(goldGram, 18) * GRAM_PER_VORI) },
      traditional: { perGram: karat(goldGram, 14), perVori: Math.round(karat(goldGram, 14) * GRAM_PER_VORI) },
    },
    silver: {
      karat22: { perGram: karat(silverGram, 22), perVori: Math.round(karat(silverGram, 22) * GRAM_PER_VORI) },
      karat21: { perGram: karat(silverGram, 21), perVori: Math.round(karat(silverGram, 21) * GRAM_PER_VORI) },
      karat18: { perGram: karat(silverGram, 18), perVori: Math.round(karat(silverGram, 18) * GRAM_PER_VORI) },
    },
    isSpotFallback: true,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────
export async function GET() {
  const NISAB_SILVER_GRAMS = 612.36; // 52.5 Tola × 11.664g

  try {
    // Try primary: goldr.org BAJUS prices
    let data;
    let scrapeError = null;

    try {
      data = await scrapeGoldr();
    } catch (err) {
      scrapeError = err.message;
      // Fall back to spot prices
      data = await fetchSpotFallback();
    }

    const s22g = data.silver.karat22.perGram;
    const s22v = data.silver.karat22.perVori;
    const g22g = data.gold.karat22.perGram;
    const g22v = data.gold.karat22.perVori;

    // Nisab based on 22K silver (standard for Zakat in BD)
    const nisabFull     = Math.round(s22g * NISAB_SILVER_GRAMS);
    // Nisab with 15% BAJUS deduction applied
    const nisabMinus15  = Math.round(nisabFull * 0.85);

    return Response.json({
      success:      !data.isSpotFallback,
      isSpotFallback: data.isSpotFallback || false,
      scrapeError,
      source:       data.source,
      fetchedAt:    new Date().toISOString(),
      usdToBdt:     data.usdToBdt,

      gold:   data.gold,
      silver: data.silver,

      // Convenience fields for the modal (22K as primary for Zakat)
      primaryGold: {
        perGram: g22g,
        perVori: g22v,
        perGramMinus15: Math.round(g22g * 0.85),
        perVoriMinus15: Math.round(g22v * 0.85),
      },
      primarySilver: {
        perGram: s22g,
        perVori: s22v,
        perGramMinus15: Math.round(s22g * 0.85),
        perVoriMinus15: Math.round(s22v * 0.85),
      },
      nisab: {
        full:          nisabFull,
        withMinus15:   nisabMinus15,
        silverGrams:   NISAB_SILVER_GRAMS,
        silverVori:    52.5,
        silverKarat:   '22K',
      },
    });

  } catch (err) {
    return Response.json({
      success: false,
      error:   err.message || 'Failed to fetch metal prices',
    }, { status: 500 });
  }
}
/**
 * pricing.js — حساب أجرة التكسي
 * ------------------------------------------------------------
 * الفئتان:
 *   1) اقتصادي (داخل بغداد وما حولها)
 *        السعر = 1650 + (كم × 100) + (دقائق × 100)
 *        التقريب لأقرب 250 دينار
 *
 *   2) نقل خارجي (بين المحافظات)
 *        السعر = 1620 + (كم × 350)
 *        التقريب لأقرب 50 دينار
 *        (الوقت لا يدخل في المعادلة)
 *
 * طريقة الحساب:
 *   - km      : المسافة بالكيلومتر (من خريطة التطبيق)
 *   - minutes : الوقت المتوقع بالدقائق
 *   - النتيجة تُقرّب ثم تُطبّق عليها الحد الأدنى
 *
 * ملاحظة: المعادلات مستنتجة من أمثلة الشاشات، وليست الصيغة الرسمية
 * للتطبيق الأصلي، فقد يظهر فرق حتى 200 دينار في الخارجي.
 * ------------------------------------------------------------
 */

const PRICING = {
  economy: {
    base: 1650,        // الأجرة الثابتة
    perKm: 100,        // سعر الكيلومتر
    perMinute: 100,    // سعر الدقيقة
    roundStep: 250,    // التقريب
    minFare: 2500,     // حد أدنى (غيّره أو احذفه حسب رغبتك)
  },
  outstation: {
    base: 1620,
    perKm: 350,
    roundStep: 50,
    minFare: 2500,
  },
};

const roundTo = (n, step) => Math.round(n / step) * step;

/**
 * @param {number}  km            المسافة بالكيلومتر
 * @param {number}  minutes       الوقت بالدقائق
 * @param {boolean} isOutstation  true = نقل خارجي، false = اقتصادي
 * @returns {number} السعر بالدينار العراقي
 */
function calcPrice(km, minutes, isOutstation = false, mult = 1) {
  const p = isOutstation ? PRICING.outstation : PRICING.economy;
  const raw = isOutstation
    ? p.base + km * p.perKm
    : p.base + km * p.perKm + minutes * p.perMinute;
  return Math.max(roundTo(raw * (mult || 1), p.roundStep), p.minFare);
}

/** تنسيق السعر للعرض: 6250 → "6,250 د.ع" */
function formatPrice(price) {
  return price.toLocaleString("en-US") + " د.ع";
}

// ------------------------------------------------------------
// إضافات المشروع (تتحكم بها لوحة التحكم عبر DB.cfg)
// ------------------------------------------------------------

/** الرحلة تعتبر "نقل خارجي" إذا بلغت المسافة هذا الحد (كم). قابل للتعديل من لوحة التحكم (cfg.outKm). */
PRICING.outKm = 50;

/** مضاعف الذروة: cfg.peak = { on, pct, until } — until وقت انتهاء تلقائي (ms) أو 0 = بلا انتهاء */
function peakMult(cfg, now = Date.now()) {
  const p = cfg && cfg.peak;
  if (!p || !p.on) return 1;
  if (p.until && now > p.until) return 1;
  return 1 + Math.max(0, +p.pct || 0) / 100;
}

/** هل الرحلة خارجية؟ */
function isOutstationKm(km, cfg) {
  const t = +(cfg && cfg.outKm) || PRICING.outKm;
  return km >= t;
}

/**
 * أجرة الرحلة النهائية: التسعيرة الجديدة × مضاعف نوع السيارة (eco=1, super=1.1, plus=1.3) × الذروة
 * @param {number} km
 * @param {number} minutes
 * @param {object} cfg        DB.cfg
 * @param {number} typeMult   مضاعف نوع السيارة
 * @param {boolean} withPeak  false عند حساب الحد الأدنى في السيرفر
 */
function rideFare(km, minutes, cfg, typeMult = 1, withPeak = true, now = Date.now()) {
  const out = isOutstationKm(km, cfg);
  const mult = (typeMult || 1) * (withPeak ? peakMult(cfg, now) : 1);
  return calcPrice(km, minutes, out, mult);
}

/**
 * أجرة توصيل الطعام (من المطعم إلى الزبون، وهي نفسها أجرة عامل التوصيل)
 *   حتى b كم (افتراضي 5)     = p (افتراضي 2500) — الحد الأدنى
 *   كل كم بعدها              = + k (افتراضي 300)  → 10 كم = 4000
 *   x = سقف أعلى اختياري (0 = بدون سقف) • تُقرّب لأقرب 250 للأعلى
 */
function deliveryFee(km, cfg) {
  const s = (cfg && cfg.dl) || {}, num = (v, d) => (v == null || v === "" || !Number.isFinite(+v)) ? d : +v;
  const b = num(s.b, 5), p = num(s.p, 2500), k = num(s.k, 300), x = num(s.x, 0);
  km = +km > 0 ? +km : 0;
  let f = km <= b ? p : p + (km - b) * k;
  f = Math.ceil(f / 250) * 250;
  return x > 0 ? Math.min(f, Math.max(x, p)) : f;
}

/** رسوم الخدمة على طلب الطعام (للتطبيق): مبلغ ثابت svc + نسبة svcP% من الأصناف بعد الخصم */
function serviceFee(sub, cfg) {
  const c = cfg || {}, a = Math.max(0, +c.svc || 0), p = Math.max(0, +c.svcP || 0), s = Math.max(0, +sub || 0);
  if (!a && !p) return 0;
  return Math.ceil((a + s * p / 100) / 250) * 250;
}

// تصدير للمتصفح وNode
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calcPrice, formatPrice, PRICING, peakMult, isOutstationKm, rideFare, deliveryFee, serviceFee };
}
if (typeof window !== "undefined") {
  window.calcPrice = calcPrice;
  window.formatPrice = formatPrice;
  window.PRICING = PRICING;
  window.peakMult = peakMult;
  window.isOutstationKm = isOutstationKm;
  window.rideFare = rideFare;
  window.deliveryFee = deliveryFee;
  window.serviceFee = serviceFee;
}

// ------------------------------------------------------------
// اختبار سريع: node pricing.js
// ------------------------------------------------------------
if (typeof require !== "undefined" && require.main === module) {
  const tests = [
    // [km, min, outstation, الفعلي]
    [11.6, 17, false, 4500],
    [12.1, 18, false, 4750],
    [18.9, 28, false, 6250],
    [33.0, 49, false, 9750],
    [104.9, 157, true, 38500],
    [105.8, 159, true, 38600],
    [167.7, 252, true, 60300],
    [106.9, 160, true, 38950],
    [179.4, 269, true, 64500],
    [264.2, 396, true, 94250],
    [357.1, 536, true, 126800],
    [361.0, 541, true, 127850],
    [363.4, 545, true, 128900],
  ];
  for (const [km, min, out, actual] of tests) {
    const got = calcPrice(km, min, out);
    const diff = got - actual;
    console.log(
      `${out ? "خارجي " : "اقتصادي"} ${km} كم | الفعلي ${actual} | الناتج ${got} | الفرق ${diff}`
    );
  }
}

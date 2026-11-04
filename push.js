'use strict';
/* push.js — إشعارات Web Push بدون مكتبات خارجية (VAPID RFC 8292 + تشفير RFC 8291 aes128gcm)
   - مفاتيح VAPID: من المتغيرين VAPID_PUBLIC / VAPID_PRIVATE، وإلا تُولَّد مرة واحدة وتُحفظ في vapid.json بجانب ملف البيانات
   - الاشتراكات تُحفظ في push-subs.json بجانب ملف البيانات (خارج مجلد public)
   - تعمل على المتصفحات وعلى تطبيق Play Store المبني بـ TWA (Chrome)، ولا تعمل داخل WebView الخاص بـ Capacitor */
const crypto = require('crypto'), https = require('https'), fs = require('fs'), path = require('path');
const { URL } = require('url');

module.exports = function (opt) {
  const dir = (opt && opt.dir) || process.cwd();
  const SUBF = path.join(dir, 'push-subs.json'), KEYF = path.join(dir, 'vapid.json');
  const b64 = b => Buffer.from(b).toString('base64url');
  const unb = s => Buffer.from(String(s), 'base64url');
  const MAXPER = 5;               // أجهزة لكل مستخدم
  const HOSTS = /(^|\.)(fcm\.googleapis\.com|push\.services\.mozilla\.com|push\.apple\.com|notify\.windows\.com)$/; // منع SSRF: خدمات الدفع المعروفة فقط

  /* ---------- مفاتيح VAPID ---------- */
  function loadKeys() {
    if (process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE) return { pub: process.env.VAPID_PUBLIC, priv: process.env.VAPID_PRIVATE };
    try { const k = JSON.parse(fs.readFileSync(KEYF, 'utf8')); if (k.pub && k.priv) return k; } catch (e) {}
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const pj = publicKey.export({ format: 'jwk' }), vj = privateKey.export({ format: 'jwk' });
    const k = { pub: b64(Buffer.concat([Buffer.from([4]), unb(pj.x), unb(pj.y)])), priv: vj.d };
    try { fs.writeFileSync(KEYF, JSON.stringify(k), { mode: 0o600 }); }
    catch (e) { console.error('[PUSH] تعذر حفظ مفاتيح VAPID (ستتغير عند كل تشغيل). ضع VAPID_PUBLIC و VAPID_PRIVATE في المتغيرات:', e.message); }
    return k;
  }
  const keys = loadKeys();
  const pubRaw = unb(keys.pub);
  const signKey = crypto.createPrivateKey({ key: { kty: 'EC', crv: 'P-256', x: b64(pubRaw.subarray(1, 33)), y: b64(pubRaw.subarray(33, 65)), d: keys.priv }, format: 'jwk' });

  function vapidJwt(aud) {
    const h = b64(JSON.stringify({ typ: 'JWT', alg: 'ES256' }));
    const c = b64(JSON.stringify({ aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: process.env.VAPID_SUBJECT || 'mailto:admin@example.com' }));
    const sig = crypto.sign('sha256', Buffer.from(h + '.' + c), { key: signKey, dsaEncoding: 'ieee-p1363' });
    return h + '.' + c + '.' + b64(sig);
  }

  /* ---------- تشفير الحمولة (RFC 8291) ---------- */
  const hk = (salt, ikm, info, len) => Buffer.from(crypto.hkdfSync('sha256', ikm, salt, info, len));
  function encrypt(sub, text) {
    const uaPub = unb(sub.keys.p256dh), auth = unb(sub.keys.auth);
    const ecdh = crypto.createECDH('prime256v1'); ecdh.generateKeys();
    const asPub = ecdh.getPublicKey(), secret = ecdh.computeSecret(uaPub);
    const prk = hk(auth, secret, Buffer.concat([Buffer.from('WebPush: info\0'), uaPub, asPub]), 32);
    const salt = crypto.randomBytes(16);
    const cek = hk(salt, prk, Buffer.from('Content-Encoding: aes128gcm\0'), 16);
    const nonce = hk(salt, prk, Buffer.from('Content-Encoding: nonce\0'), 12);
    const ci = crypto.createCipheriv('aes-128-gcm', cek, nonce);
    const ct = Buffer.concat([ci.update(Buffer.concat([Buffer.from(text), Buffer.from([2])])), ci.final(), ci.getAuthTag()]);
    const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
    return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, ct]);
  }

  /* ---------- التخزين ---------- */
  let subs = {}, tm = null;
  try { subs = JSON.parse(fs.readFileSync(SUBF, 'utf8')) || {}; } catch (e) {}
  const persist = () => { if (tm) return; tm = setTimeout(() => { tm = null; fs.writeFile(SUBF, JSON.stringify(subs), { mode: 0o600 }, () => {}); }, 1500); if (tm.unref) tm.unref(); };

  function valid(sub) {
    try {
      if (!sub || typeof sub.endpoint !== 'string' || !sub.keys) return false;
      const u = new URL(sub.endpoint);
      if (u.protocol !== 'https:' || !HOSTS.test(u.hostname)) return false;
      return unb(sub.keys.p256dh).length === 65 && unb(sub.keys.auth).length >= 16;
    } catch (e) { return false; }
  }
  function add(role, id, sub) {
    if (!valid(sub)) return false;
    for (const o in subs) { if (o !== role + ':' + id) { subs[o] = subs[o].filter(x => x.endpoint !== sub.endpoint); if (!subs[o].length) delete subs[o]; } } // الجهاز لآخر مستخدم فقط
    const k = role + ':' + id, a = (subs[k] || []).filter(x => x.endpoint !== sub.endpoint);
    a.push({ endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth }, at: Date.now() });
    subs[k] = a.slice(-MAXPER);
    persist();
    return true;
  }
  function rm(role, id, endpoint) {
    const k = role + ':' + id; if (!subs[k]) return;
    subs[k] = subs[k].filter(x => x.endpoint !== endpoint);
    if (!subs[k].length) delete subs[k];
    persist();
  }

  /* ---------- الإرسال ---------- */
  function post(sub, body, ttl) {
    return new Promise(res => {
      try {
        const u = new URL(sub.endpoint);
        const req = https.request({
          hostname: u.hostname, port: u.port || 443, path: u.pathname + u.search, method: 'POST', timeout: 10000,
          headers: {
            Authorization: 'vapid t=' + vapidJwt(u.origin) + ', k=' + keys.pub,
            'Content-Encoding': 'aes128gcm', 'Content-Type': 'application/octet-stream',
            'Content-Length': body.length, TTL: String(ttl), Urgency: 'high'
          }
        }, r => { r.resume(); r.on('end', () => res(r.statusCode)); });
        req.on('error', () => res(0)).on('timeout', () => { req.destroy(); res(0); });
        req.end(body);
      } catch (e) { res(0); }
    });
  }
  /** إرسال إشعار لمستخدم: payload = { t: العنوان, b: النص, u: الرابط, tag } — لا يرمي أخطاء أبداً */
  async function send(role, id, payload, ttl) {
    try {
      const k = role + ':' + id, list = subs[k];
      if (!list || !list.length) return 0;
      const text = JSON.stringify(payload).slice(0, 3000);
      let sent = 0;
      await Promise.all(list.slice().map(async sub => {
        const st = await post(sub, encrypt(sub, text), ttl || 600);
        if (st >= 200 && st < 300) sent++;
        else if (st === 404 || st === 410) rm(role, id, sub.endpoint);
      }));
      return sent;
    } catch (e) { return 0; }
  }

  return { key: () => keys.pub, add, rm, send, _encrypt: encrypt, _count: () => Object.keys(subs).length };
};

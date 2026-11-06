'use strict';
/* fcm.js — إشعارات Firebase Cloud Messaging (HTTP v1) بدون مكتبات خارجية
   تصل الإشعارات للهاتف حتى لو كان التطبيق مغلقاً تماماً (يعرضها نظام أندرويد)
   المتغير المطلوب: FIREBASE_SERVICE_ACCOUNT = محتوى ملف حساب الخدمة JSON (نصاً أو base64) */
const crypto = require('crypto'), https = require('https');

module.exports = function () {
  let sa = null;
  try {
    let raw = String(process.env.FIREBASE_SERVICE_ACCOUNT || '').trim();
    if (raw && !raw.startsWith('{')) raw = Buffer.from(raw, 'base64').toString('utf8');
    if (raw) { sa = JSON.parse(raw); if (!sa.private_key || !sa.client_email || !sa.project_id) sa = null; }
  } catch (e) { console.error('[FCM] FIREBASE_SERVICE_ACCOUNT غير صالح:', e.message); sa = null; }
  if (sa) console.log('[FCM] مفعّل للمشروع', sa.project_id); else console.log('[FCM] غير مفعّل — أضف FIREBASE_SERVICE_ACCOUNT لتصل الإشعارات والتطبيق مغلق');

  const b64 = x => Buffer.from(x).toString('base64url');
  let tok = null, tokExp = 0, tokP = null;
  const req = (host, path, body, headers) => new Promise(ok => {
    const r = https.request({ host, path, method: 'POST', headers: { 'Content-Length': Buffer.byteLength(body), ...headers }, timeout: 10000 }, s => {
      let d = ''; s.on('data', c => d += c); s.on('end', () => { let j = null; try { j = JSON.parse(d) } catch (e) {} ok({ st: s.statusCode, j, d }) });
    });
    r.on('error', e => ok({ st: 0, d: e.message })); r.on('timeout', () => r.destroy(new Error('timeout'))); r.end(body);
  });
  async function access() {
    if (tok && Date.now() < tokExp) return tok;
    if (tokP) return tokP;
    tokP = (async () => {
      const now = Math.floor(Date.now() / 1000);
      const h = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' })), c = b64(JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
      const sig = crypto.sign('RSA-SHA256', Buffer.from(h + '.' + c), sa.private_key);
      const body = 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + h + '.' + c + '.' + b64(sig);
      const r = await req('oauth2.googleapis.com', '/token', body, { 'Content-Type': 'application/x-www-form-urlencoded' });
      if (r.st != 200 || !r.j || !r.j.access_token) { console.error('[FCM] فشل الحصول على رمز الوصول', r.st, String(r.d).slice(0, 200)); return null }
      tok = r.j.access_token; tokExp = Date.now() + (r.j.expires_in - 120) * 1000; return tok;
    })().finally(() => { tokP = null });
    return tokP;
  }
  /** يرسل لقائمة رموز، ويعيد الرموز غير الصالحة لحذفها. payload = {t,b,u,tag,ch} */
  async function send(tokens, p) {
    if (!sa || !tokens || !tokens.length) return { sent: 0, bad: [] };
    const at = await access(); if (!at) return { sent: 0, bad: [] };
    const bad = []; let sent = 0;
    await Promise.all(tokens.map(async t => {
      const msg = { message: { token: t,
        notification: { title: String(p.t || 'تكسي المتميز').slice(0, 120), body: String(p.b || '').slice(0, 400) },
        data: { u: String(p.u || ''), tag: String(p.tag || '') },
        android: { priority: 'HIGH', ttl: (p.ttl || 3600) + 's', notification: { channel_id: p.ch || 'main', sound: 'default', tag: p.tag ? String(p.tag).slice(0, 60) : undefined, default_vibrate_timings: true, notification_priority: 'PRIORITY_MAX', visibility: 'PUBLIC' } } } };
      const r = await req('fcm.googleapis.com', '/v1/projects/' + sa.project_id + '/messages:send', JSON.stringify(msg), { 'Content-Type': 'application/json', Authorization: 'Bearer ' + at });
      if (r.st == 200) sent++;
      else if (r.st == 404 || (r.st == 400 && /registration|INVALID_ARGUMENT|UNREGISTERED/i.test(r.d))) bad.push(t);
      else if (r.st == 401) { tok = null }
    }));
    return { sent, bad };
  }
  return { on: () => !!sa, send, project: () => sa && sa.project_id };
};

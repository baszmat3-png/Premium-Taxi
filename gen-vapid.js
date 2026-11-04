/* node gen-vapid.js  → يطبع مفاتيح VAPID لوضعها في Render كمتغيرات بيئة (تبقى ثابتة بعد كل نشر) */
const c=require('crypto'),b=x=>Buffer.from(x).toString('base64url');
const {publicKey,privateKey}=c.generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const p=publicKey.export({format:'jwk'}),v=privateKey.export({format:'jwk'});
console.log('VAPID_PUBLIC='+b(Buffer.concat([Buffer.from([4]),Buffer.from(p.x,'base64url'),Buffer.from(p.y,'base64url')])));
console.log('VAPID_PRIVATE='+v.d);
console.log('VAPID_SUBJECT=mailto:support@your-domain.com');

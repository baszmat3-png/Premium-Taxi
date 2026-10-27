const http=require('http'),fs=require('fs'),path=require('path');
const F=process.env.DATA_FILE||'data.json',ADMIN=process.env.ADMIN_PIN||'1234',KEY=process.env.GOOGLE_MAPS_KEY||'',PUB=path.join(__dirname,'public');
let db={topups:{},tx:{},customers:{},rests:{},orders:{},rides:{},drivers:{},tickets:{},staff:{},offers:{},cards:{},apps:{},cardorders:{},wd:{},incw:{},ctop:{},ctx:{},cfg:{base:1500,km:700,min:3000,foodKm:400,auto:1,maxKm:10}};
try{Object.assign(db,JSON.parse(fs.readFileSync(F)))}catch(e){}
db.cfg={maxDev:3,vpnBlock:1,timeGuard:1,timeTol:3,appPct:15,restPct:5,taxiPct:5,minBal:-15000,pay:[],minWd:15000,rt:[{id:'eco',n:'توفير',d:'التكسي الأوفر',m:1,g:'taxi'},{id:'super',n:'سوبر',d:'الخيار الأفضل',m:1.18,g:'taxi'},{id:'plus',n:'بلس',d:'راحة أكثر',m:1.3,g:'taxi'},{id:'box',n:'بوكس',d:'توصيل طرود وأغراض',m:1.1,g:'box'}],...db.cfg};if(!db.cfg.mig5){db.cfg.mig5=1;db.cfg.restPct=5;db.cfg.taxiPct=5}db.wd=db.wd||{};db.incw=db.incw||{};db.ctop=db.ctop||{};db.ctx=db.ctx||{};
const pubc=c=>({base:c.base,km:c.km,min:c.min,foodKm:c.foodKm,rt:c.rt,pay:c.pay,restPct:c.restPct,theme:c.theme});
const save=()=>fs.writeFile(F,JSON.stringify(db),()=>{});
const AUF=process.env.AUTH_FILE||'auth.json',GCID=process.env.GOOGLE_CLIENT_ID||'',WAU=process.env.WA_API_URL||'',WAK=process.env.WA_API_KEY||'',cr=require('crypto'),OTP={},FAIL={},RG={};
let AU={sessions:{}};try{AU=JSON.parse(fs.readFileSync(AUF))}catch(e){}AU.sessions=AU.sessions||{};AU.pw=AU.pw||{};AU.rev=AU.rev||{};
if(!process.env.SESSION_SECRET&&!AU.sec){AU.sec=cr.randomBytes(32).toString('hex');fs.writeFile(AUF,JSON.stringify(AU),()=>{})}
const SEC=process.env.SESSION_SECRET||AU.sec,YEAR=365*864e5,b64=x=>Buffer.from(x).toString('base64url'),sg=x=>cr.createHmac('sha256',SEC).update(x).digest('base64url');
const mk=id=>{const p=b64(id)+'.'+Date.now();return p+'.'+sg(p)};
const sid=t=>{t=String(t||'');const o=AU.sessions[t];if(o)return o.id;const a=t.split('.');if(a.length!=3)return'';const p=a[0]+'.'+a[1],x=Buffer.from(sg(p)),y=Buffer.from(a[2]);if(x.length!=y.length||!cr.timingSafeEqual(x,y))return'';const at=+a[1],id=Buffer.from(a[0],'base64url').toString();if(!(at>0)||Date.now()-at>YEAR||at<(AU.rev[id]||0))return'';return id};
process.on('uncaughtException',e=>console.error('uncaught',e));process.on('unhandledRejection',e=>console.error('unhandled',e));
const saveA=()=>fs.writeFile(AUF,JSON.stringify(AU),()=>{});
const nph=x=>{let p=String(x||'').replace(/\D/g,'');if(p.startsWith('00'))p=p.slice(2);if(p.startsWith('0'))p='964'+p.slice(1);return/^\d{10,15}$/.test(p)?p:''};
async function sendWA(p,c){const m='رمز دخولك إلى تكسي المتميز: '+c;if(!WAU){console.log('[OTP]',p,c);return 1}try{const r=await fetch(WAU,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+WAK,apikey:WAK},body:JSON.stringify({to:p,number:p,phone:p,message:m,text:m})});return r.ok}catch(e){return 0}}

// ---- حماية الأجهزة / VPN / الوقت ----
const HOPS=process.env.TRUST_PROXY_HOPS==null?1:Math.max(0,+process.env.TRUST_PROXY_HOPS||0),PCK=process.env.PROXYCHECK_KEY||'',DEVTTL=30*864e5;
const cip=q=>{const a=String(q.headers['x-forwarded-for']||'').split(',').map(x=>x.trim()).filter(Boolean);const ip=(HOPS&&a.length)?a[Math.max(0,a.length-HOPS)]:(q.socket.remoteAddress||'');return String(ip).replace(/^::ffff:/,'').slice(0,60)};
const cdev=x=>/^[\w-]{16,64}$/.test(String(x||''))?String(x):'';
const priv=ip=>!ip||/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80)/i.test(ip);
const IPC=new Map();
function ipinfo(ip){if(priv(ip))return Promise.resolve({vpn:0,priv:1});const n=Date.now(),e=IPC.get(ip);if(e&&n-e.t<(e.r?216e5:6e4))return e.p;
 const e2={t:n,r:0,v:null};e2.p=(async()=>{let v;try{
  if(PCK){const x=await fetch('https://proxycheck.io/v2/'+encodeURIComponent(ip)+'?key='+encodeURIComponent(PCK)+'&vpn=1&asn=1',{signal:AbortSignal.timeout(4000)}).then(r=>r.json()),o=x[ip]||{};if(x.status=='error')throw 0;v={vpn:o.proxy=='yes'?1:0,cn:o.isocode||'',city:o.city||'',isp:String(o.provider||'').slice(0,60),tz:o.timezone||''};}
  else{const x=await fetch('http://ip-api.com/json/'+encodeURIComponent(ip)+'?fields=status,countryCode,city,isp,timezone,proxy,hosting',{signal:AbortSignal.timeout(4000)}).then(r=>r.json());if(x.status!='success')throw 0;v={vpn:(x.proxy||x.hosting)?1:0,cn:x.countryCode||'',city:x.city||'',isp:String(x.isp||'').slice(0,60),tz:x.timezone||''}}
  e2.r=1}catch(err){v={vpn:0,err:1}}
  e2.v=v;return v})();IPC.set(ip,e2);return e2.p}
setInterval(()=>{if(IPC.size>5000)IPC.clear()},36e5).unref();
const MSG={vpn:'تم اكتشاف VPN أو بروكسي. أوقفه ثم أعد المحاولة.',time:'وقت جهازك غير صحيح. فعّل «التاريخ والوقت التلقائي» من إعدادات الهاتف ثم أعد فتح التطبيق.'};
const gTime=h=>{const c=db.cfg;if(c.timeGuard===0)return null;const t=+h['x-ct'];return(!(t>0)||Math.abs(Date.now()-t)>Math.max(1,+c.timeTol||3)*6e4)?{c:'time',e:MSG.time}:null};
const gVpn=h=>{if(db.cfg.vpnBlock===0)return null;const ip=h['x-ip'],x=IPC.get(ip);if(x&&x.v&&x.v.vpn)return{c:'vpn',e:MSG.vpn};if(!x||(!x.r&&Date.now()-x.t>=6e4))ipinfo(ip);return null};
const guard=h=>{const r=h['x-role'];return(r=='customer'||r=='driver')?(gTime(h)||gVpn(h)):null};
const parseUA=ua=>{ua=String(ua||'');let os='',nm='',m;
 if(m=ua.match(/Android ([\d.]+)/)){os='Android '+m[1];const d=ua.match(/Android [\d.]+;\s*([^;)]+?)(?:\s+Build|;|\))/);nm=d?d[1].trim():''}
 else if(m=ua.match(/iPhone OS ([\d_]+)/)){os='iOS '+m[1].replace(/_/g,'.');nm='iPhone'}
 else if(/iPad/.test(ua)){os='iPadOS';nm='iPad'}else if(/Windows NT/.test(ua)){os='Windows';nm='كمبيوتر'}else if(/Mac OS X/.test(ua)){os='macOS';nm='Mac'}else if(/Linux/.test(ua)){os='Linux';nm='كمبيوتر'}
 const br=/; wv\)|\bwv\b/.test(ua)?'WebView (التطبيق)':/Edg\//.test(ua)?'Edge':/OPR\//.test(ua)?'Opera':/Chrome\//.test(ua)?'Chrome':/Firefox\//.test(ua)?'Firefox':/Safari\//.test(ua)?'Safari':'';
 return{os:os.slice(0,40),nm:nm.slice(0,60),br}};
const actDev=c=>Object.values(c.devs||{}).filter(x=>!x.st&&Date.now()-(x.last||0)<DEVTTL);
// تسجيل دخول من جهاز: يفرض حد الأجهزة ويسجّل الجلسة
function devLogin(c,q,b,m,geo){const now=Date.now(),ip=q.headers['x-ip'],mt=b&&b.dev&&typeof b.dev=='object'?b.dev:{},d=cdev(q.headers['x-dev']||mt.id),u=parseUA(q.headers['user-agent']);
 c.sess=c.sess||[];c.devs=c.devs||{};
 const lg=(ok,why)=>{c.sess.push({at:now,dev:d,ip,m:S(m,12),ok,why:why||'',nm:u.nm,os:u.os,cn:(geo&&geo.cn)||''});if(c.sess.length>40)c.sess.splice(0,c.sess.length-40)};
 if(!d){lg(0,'nodev');return{c:'nodev',e:'تعذر تحديد الجهاز، حدّث التطبيق وأعد المحاولة'}}
 let x=c.devs[d];const max=Math.min(20,Math.max(1,+db.cfg.maxDev||3));
 if(x&&x.st==1){lg(0,'blocked');return{c:'blocked',e:'هذا الجهاز محظور من قبل الإدارة'}}
 if(!x||x.st==2||now-(x.last||0)>=DEVTTL){if(actDev(c).filter(v=>v.id!=d).length>=max){lg(0,'limit');c.att=c.att||[];c.att.push({at:now,dev:d,ip,nm:u.nm,os:u.os});if(c.att.length>20)c.att.splice(0,c.att.length-20);return{c:'limit',e:'وصل هذا الحساب إلى الحد الأقصى ('+max+' أجهزة). سجّل الخروج من أحد أجهزتك الأخرى (الحساب ← الأجهزة والجلسات) أو تواصل مع الدعم.'}}
  x=c.devs[d]={id:d,first:now}}
 Object.assign(x,{st:0,nm:u.nm,os:u.os,br:u.br,app:mt.app?1:0,scr:S(mt.scr,20),tz:S(mt.tz,60),lang:S(mt.lang,20),ip,last:now,lat:now,cn:(geo&&geo.cn)||'',city:(geo&&geo.city)||'',isp:(geo&&geo.isp)||'',tzm:(geo&&geo.tz&&mt.tz&&geo.tz!=mt.tz)?1:0});
 lg(1);return{ok:1}}
// فحص الجهاز في كل طلب بعد تسجيل الدخول (يُسجَّل الحساب القديم تلقائيًا)
function devCheck(id,h){const c=db.customers[id];if(!c)return false;const d=cdev(h['x-dev']);if(!d)return false;const now=Date.now(),ip=h['x-ip'];
 if(!c.devs){c.devs={};c.sess=c.sess||[];c.devs[d]={id:d,first:now,last:now,lat:now,ip,st:0,...parseUA(h['user-agent'])};return true}
 const x=c.devs[d];if(!x||x.st)return false;
 if(x.ip!=ip){x.ip=ip;x.lat=now}x.last=now;return true}
const who=h=>{if(h['x-role']=='customer')h['x-id']=sid(h['x-token'])};
const W={customer:['orders','rides','tickets','apps','cardorders','ctop'],driver:['orders','rides','drivers','topups','wd'],rest:['rests','orders'],support:['orders','rides','tickets','drivers','apps','cardorders','topups','wd','ctop'],admin:['cdev','rests','orders','rides','drivers','tickets','staff','cfg','offers','cards','apps','cardorders','topups','wd','wallet','incw','ctop','cwallet']};
const LK={},RL={};
const lk=(k,f)=>{const n=Date.now(),e=LK[k]||(LK[k]={n:0,t:n});if(n-e.t>6e5){e.n=0;e.t=n}if(f===1)e.n++;else if(f===0)e.n=0;return e.n>=10};
const eq=(a,b)=>{if(a==null||b==null||a===''||b==='')return false;a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length==b.length&&cr.timingSafeEqual(a,b)};
const rl=h=>{const k=h['x-role']+'|'+(h['x-id']||h['x-ip']),n=Date.now(),e=RL[k]||(RL[k]={n:0,t:n});if(n-e.t>6e4){e.n=0;e.t=n}return ++e.n>240};
setInterval(()=>{const n=Date.now();for(const k in LK)if(n-LK[k].t>6e5)delete LK[k];for(const k in RL)if(n-RL[k].t>6e4)delete RL[k]},6e5).unref();
const ok0=h=>{const r=h['x-role'],p=h['x-pin'],i=h['x-id'];
 return r=='customer'?!!i:r=='admin'?eq(p,ADMIN):r=='support'?Object.values(db.staff).some(s=>eq(s.pin,p)):r=='rest'?!!db.rests[i]&&eq(db.rests[i].pin,p):r=='driver'?!!db.drivers[i]&&eq(db.drivers[i].pin,p)&&(!db.drivers[i].tfa||sid(h['x-token'])=='d:'+i):false};
const ok=h=>{const r=h['x-role'];if(r=='customer')return ok0(h);const k=(h['x-ip']||'')+'|'+r+'|'+(r=='admin'||r=='support'?'':(h['x-id']||''));if(lk(k))return false;const g=ok0(h),d=r=='driver'&&db.drivers[h['x-id']],bad=!g&&!!h['x-pin']&&!(d&&eq(d.pin,h['x-pin']));lk(k,g?0:bad?1:undefined);return g};
if(ADMIN=='1234')console.warn('[SECURITY] ADMIN_PIN الافتراضي 1234 مستخدم! عيّن ADMIN_PIN قويًا في متغيرات البيئة.');
// ---- TOTP (RFC 6238) للمصادقة الثنائية ----
const B32='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const b32e=b=>{let t='',o='';for(const x of b)t+=x.toString(2).padStart(8,'0');for(let i=0;i<t.length;i+=5)o+=B32[parseInt(t.slice(i,i+5).padEnd(5,'0'),2)];return o};
const b32d=x=>{let t='';for(const c of x)t+=Math.max(0,B32.indexOf(c)).toString(2).padStart(5,'0');const o=[];for(let i=0;i+8<=t.length;i+=8)o.push(parseInt(t.slice(i,i+8),2));return Buffer.from(o)};
const hotp=(k,c)=>{const b=Buffer.alloc(8);b.writeBigUInt64BE(BigInt(c));const h=cr.createHmac('sha1',b32d(k)).update(b).digest(),o=h[19]&15;return String((h.readUInt32BE(o)&0x7fffffff)%1e6).padStart(6,'0')};
const totp=(k,code,d)=>{code=String(code||'').replace(/\s/g,'');if(!k||!/^\d{6}$/.test(code))return 0;const st=Math.floor(Date.now()/3e4);for(let i=-1;i<=1;i++){const s=st+i;if(s>(d.tl||0)&&eq(hotp(k,s),code)){d.tl=s;return 1}}return 0};
const audit=(h,what,id,amt)=>{db.audit=db.audit||[];db.audit.push({at:Date.now(),role:h['x-role'],by:h['x-id']||'',ip:h['x-ip']||'',what,id,amt:amt||0});if(db.audit.length>3000)db.audit.splice(0,db.audit.length-3000)};
const clean=(o,f)=>Object.fromEntries(Object.entries(o).map(([k,v])=>{v={...v};f.forEach(x=>delete v[x]);return[k,v]}));
const flt=(c,fn)=>Object.fromEntries(Object.entries(db[c]).filter(([,v])=>fn(v)));
function view(h){const r=h['x-role'],i=h['x-id'],rs=clean(db.rests,['pin']);
 if(r=='admin')return db;
 if(r=='support')return{...db,customers:clean(db.customers,['devs','sess','att']),rests:rs,drivers:clean(db.drivers,['pin','tfa','tfaP','tl']),staff:{}};
 if(r=='rest'){const os=flt('orders',v=>v.rid==i),ids=[...new Set(Object.values(os).map(v=>v.did).filter(d=>d&&db.drivers[d]))];return{cfg:pubc(db.cfg),rests:{[i]:db.rests[i]},orders:os,drivers:Object.fromEntries(ids.map(d=>{const x=db.drivers[d];return[d,{id:d,n:x.n,ph:x.ph,car:x.car,loc:x.loc,locAt:x.locAt}]}))}}
 if(r=='driver')return{cfg:db.cfg,topups:flt('topups',v=>v.did==i),tx:flt('tx',v=>v.did==i),wd:flt('wd',v=>v.did==i),incw:flt('incw',v=>v.did==i),rests:rs,orders:clean(flt('orders',v=>v.did==i||(v.st==2&&!v.did)),['rnote']),rides:clean(flt('rides',v=>v.did==i||(v.st==0&&!v.did)),['rnote']),drivers:{[i]:{...clean(db.drivers,['pin','tfa','tfaP','tl'])[i],tfaOn:db.drivers[i]&&db.drivers[i].tfa?1:0}}};
 const mine=v=>v.cid==i,orders=flt('orders',mine),rides=flt('rides',mine);
 const ids=[...new Set([...Object.values(orders),...Object.values(rides)].map(v=>v.did).filter(d=>d&&db.drivers[d]))];
 return{cfg:pubc(db.cfg),rests:rs,orders,rides,tickets:flt('tickets',mine),offers:db.offers,cards:db.cards,apps:flt('apps',mine),cardorders:flt('cardorders',mine),me:{bal:(db.customers[i]||{}).bal||0},ctop:flt('ctop',mine),ctx:flt('ctx',mine),drivers:Object.fromEntries(ids.map(d=>{const x=db.drivers[d];return[d,{id:d,n:x.n,ph:x.ph,car:x.car,plate:x.plate,color:x.color,img:x.img,loc:x.loc}]}))}}
function credit(d,a,why){const x=db.drivers[d];if(!x)return;x.bal=(x.bal||0)+a;if(x.bal<=db.cfg.minBal)x.on=0;const t='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);db.tx[t]={id:t,did:d,amt:a,why,bal:x.bal,at:Date.now()}}
function ccredit(c,a,why){const x=db.customers[c];if(!x||!a)return 0;x.bal=(x.bal||0)+a;const t='x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);db.ctx[t]={id:t,cid:c,amt:a,why,bal:x.bal,at:Date.now()};return 1}
const tripsOf=(d,n)=>{const f=+n.from||0,t=+n.to||9e15,k=n.kind||'all',g=o=>o.did==d&&o.st==4&&o.at>=f&&o.at<=t;return(k!='food'?Object.values(db.rides).filter(g).length:0)+(k!='taxi'?Object.values(db.orders).filter(g).length:0)};
function charge(k,o){const c=db.cfg;o.chg=1;if(o.paid&&o.did&&!o.dpd){o.dpd=1;credit(o.did,k=='orders'?(o.tot||0):(o.fare||0),'دفع بالمحفظة '+o.id)}if(k=='orders'){o.com=Math.round((o.fee||0)*c.appPct/100);const r=db.rests[o.rid],sb=(o.its||[]).reduce((s,i)=>s+i.q*i.p,0);const rp=+((r&&r.pct!=null&&r.pct!=='')?r.pct:c.restPct)||0;o.rpct=rp;o.rcom=Math.round(sb*rp/100)}else o.com=Math.round((o.fare||0)*c.taxiPct/100);if(o.com)credit(o.did,-o.com,(k=='orders'?'عمولة طلب ':'عمولة رحلة ')+o.id)}
const cleanItems=a=>{if(!Array.isArray(a)||a.length>1000)return null;const ids=new Set(),o=[],tm=t=>/^\d{2}:\d{2}$/.test(String(t||''))?t:'';for(const x of a){if(!x||typeof x!='object')return null;const id=String(x.id||'').slice(0,40),p=Math.round(+x.p),n=String(x.n||'').trim();if(!id||ids.has(id)||!n||!(p>=0)||p>1e8)return null;ids.add(id);const im=String(x.img||'');o.push({id,n:n.slice(0,80),p,d:String(x.d||'').slice(0,500),cat:String(x.cat||'').trim().slice(0,60),f:tm(x.f),t:tm(x.t),off:x.off?1:0,pu:+x.pu>0?+x.pu:0,img:/^\/u\/[a-f0-9]{32}\.\w+$/.test(im)||(/^data:image\/(jpeg|png|webp);base64,/.test(im)&&im.length<4e5)?im:''})}return o};
const num=x=>Number.isFinite(+x)?+x:0,S=(x,n)=>String(x==null?'':x).slice(0,n),pt=p=>{p=p||{};const a=+p.lat,g=+p.lng;return p.lat!=null&&Number.isFinite(a)&&Number.isFinite(g)&&Math.abs(a)<=90&&Math.abs(g)<=180?{lat:a,lng:g}:null};
function cust(k,v,nw){const c=db.cfg,o={cid:v.cid};if(nw){o.st=0;o.at=Date.now()}
 if(k=='orders'){const R=db.rests[v.rid],loc=pt(v.loc);if(!R||!loc||!Array.isArray(v.its)||!v.its.length||v.its.length>60)return null;const its=[];for(const x of v.its){const it=(R.items||[]).find(y=>y.n==(x&&x.n));if(!it)return null;its.push({n:it.n,q:Math.min(99,Math.max(1,(+x.q)|0)),p:it.p})}
  const sb=its.reduce((a,x)=>a+x.q*x.p,0),mp=Math.max(0,...Object.values(db.offers||{}).filter(x=>x.on!==0&&(!x.rid||x.rid==v.rid)).map(x=>+x.pct||0)),fee=Math.max(c.min,Math.round((c.base+(pt(R.loc)?hv(R.loc,loc)*1.3*c.foodKm:0))/250)*250),dsc=Math.round(sb*mp/100);
  Object.assign(o,{rid:S(v.rid,40),rn:S(R.n,80),rloc:pt(R.loc),its,fee,disc:dsc,tot:sb-dsc+fee,cn:S(v.cn,60),cp:S(v.cp,30),loc,note:S(v.note,300),pay:S(v.pay,10)});return o}
 if(k=='rides'){const f=pt(v.from),t=pt(v.to),rt=(c.rt||[]).find(x=>x.id==v.rt);if(!f||!t||!rt)return null;const fl=Math.max(c.min,Math.round((c.base+hv(f,t)*.95*c.km)*(rt.m||1)/250)*250);
  Object.assign(o,{cn:S(v.cn,60),cp:S(v.cp,30),from:f,to:t,fa:S(v.fa,120),ta:S(v.ta,120),km:Math.min(500,Math.max(0,num(v.km))),min:Math.min(1440,Math.max(0,num(v.min))),fare:Math.min(5e6,Math.max(fl,Math.round(num(v.fare)))),rt:rt.id,rtn:rt.n,rg:rt.g,note:S(v.note,300),pay:S(v.pay,10)});return o}
 if(k=='cardorders'){const cd=db.cards[v.card];if(!cd)return null;Object.assign(o,{cn:S(v.cn,60),cp:S(v.cp,30),card:S(v.card,40),cn2:S(cd.n,80),pay:S(v.pay,10)});return o}
 if(k=='tickets'){Object.assign(o,{cn:S(v.cn,60),cp:S(v.cp,30),oid:S(v.oid,40),msg:S(v.msg,1000)});return o}
 if(k=='apps'){const dc={};Object.entries(v.docs&&typeof v.docs=='object'?v.docs:{}).slice(0,12).forEach(([a,b])=>{if(/^\/u\/[a-f0-9]{32}\.\w+$/.test(String(b)))dc[S(a,20)]=b});Object.assign(o,{type:S(v.type,20),n:S(v.n,60),ph:S(v.ph,30),city:S(v.city,60),car:S(v.car,60),plate:S(v.plate,30),docs:dc});return o}
 return null}
function set(h,b){const{k,id}=b;let v=b.v;const r=h['x-role'],i=h['x-id'];
 if(!W[r]||!W[r].includes(k)||!id)return 0;
 const old=db[k]&&db[k][id],mn=db.cfg.minBal;
 if(k=='cdev'){if(r!='admin'||!v)return 0;const c=db.customers[id];if(!c)return 0;c.devs=c.devs||{};const x=c.devs[S(v.dev,64)];
  if(v.a=='reset'){Object.values(c.devs).forEach(y=>{if(!y.st)y.st=2});AU.rev[id]=Date.now();saveA();audit(h,'cdev-reset',id);return 1}
  if(!x)return 0;if(v.a=='rm'){x.st=2;audit(h,'cdev-rm',id);return 1}if(v.a=='block'){x.st=1;audit(h,'cdev-block',id);return 1}if(v.a=='unblock'){x.st=2;audit(h,'cdev-unblock',id);return 1}return 0}
 if(k=='wallet'){const d=db.drivers[id],a=Math.round(+(v&&v.amt));if(!d||!a)return 0;credit(id,a,String((v&&v.why)||'شحن من لوحة التحكم').slice(0,100));audit(h,'wallet',id,a);return 1}
 if(k=='cwallet'){const a=Math.round(+(v&&v.amt));if(r!='admin'||!db.customers[id]||!a)return 0;audit(h,'cwallet',id,a);return ccredit(id,a,String(v.why||'شحن من لوحة التحكم').slice(0,100))}
 if(k=='incw'){if(r!='admin'||old||!v)return 0;const n=(db.cfg.inc||[]).find(x=>x.id==v.iid),d=db.drivers[v.did];if(!n||!d||id!=n.id+'_'+d.id||tripsOf(d.id,n)<n.trips)return 0;credit(d.id,+n.amt,'حافز: '+String(n.n).slice(0,60));db.incw[id]={id,iid:n.id,did:d.id,n:n.n,amt:+n.amt,trips:n.trips,at:Date.now()};return 1}
 if(k=='ctop'){if(r=='customer'){if(old||!v||v.cid!=i||!db.customers[i])return 0;const a=Math.round(+v.amt);if(!(a>=1000)||a>5e6)return 0;const im=String(v.img||'').slice(0,200),rf=String(v.ref||'').trim().slice(0,100);if((im&&Object.values(db.ctop).some(x=>x.st>=0&&x.img==im))||(rf&&Object.values(db.ctop).some(x=>x.st>=0&&x.ref==rf)))return 0;if(Object.values(db.ctop).filter(x=>x.cid==i&&x.st==0).length>=5)return 0;db.ctop[id]={id,cid:i,amt:a,m:v.m=='zain'?'zain':'master',img:im,ref:rf,st:0,at:Date.now()};return 1}
  if(!old||!v||old.st!=0)return 0;if(v.st==1){ccredit(old.cid,old.amt,'شحن المحفظة ('+(old.m=='zain'?'زين كاش':'ماستر كارد')+')');audit(h,'ctop-ok',id,old.amt);db.ctop[id]={...old,st:1,by:r,ok:Date.now()};return 1}if(v.st==-1){db.ctop[id]={...old,st:-1,why:String(v.why||'').slice(0,200)};return 1}return 0}
 if(k=='wd'){
  if(r=='driver'){const d=db.drivers[i];if(old||!v||!d)return 0;const a=Math.round(+v.amt),ac=String(v.acc||'').trim().slice(0,60);if(!(a>=(db.cfg.minWd||15000))||a>(d.bal||0)||!ac||(db.cfg.req2fa&&!d.tfa))return 0;if(Object.values(db.wd).some(x=>x.did==i&&x.st==0))return 0;db.wd[id]={id,did:i,amt:a,m:String(v.m||'').slice(0,40),acc:ac,st:0,at:Date.now()};return 1}
  if(r!='admin'||!v)return 0;
  if(!old){const d=db.drivers[v.did],a=Math.round(+v.amt);if(!d||!(a>0)||a>(d.bal||0))return 0;credit(d.id,-a,'سحب رصيد ('+String(v.m||'').slice(0,40)+')');db.wd[id]={id,did:d.id,amt:a,m:String(v.m||'').slice(0,40),acc:String(v.acc||'').slice(0,60),st:1,by:'admin',at:Date.now(),ok:Date.now(),ref:String(v.ref||'').slice(0,100)};return 1}
  if(old.st!=0)return 0;
  if(v.st==1){const d=db.drivers[old.did];if(!d||(d.bal||0)<old.amt)return 0;credit(old.did,-old.amt,'سحب رصيد ('+(old.m||'')+')');audit(h,'wd-ok',id,old.amt);db.wd[id]={...old,st:1,by:r,ok:Date.now(),ref:String(v.ref||'').slice(0,100)};return 1}
  if(v.st==-1){db.wd[id]={...old,st:-1,why:String(v.why||'').slice(0,200)};return 1}
  return 0}
 if(k=='topups'){if(r=='driver'){if(old||!v||v.did!=i||!(+v.amt>0)||+v.amt>5e6)return 0;{const im=String(v.img||'').slice(0,200);if(im&&Object.values(db.topups).some(x=>x.st>=0&&x.img==im))return 0}v={did:i,amt:Math.round(+v.amt),m:String(v.m||'').slice(0,60),img:String(v.img||'').slice(0,200),note:String(v.note||'').slice(0,300),st:0,at:Date.now()}}else{if(!old||!v)return 0;if(v.st==1&&old.st==0){credit(old.did,old.amt,'شحن بوصل تحويل ('+(old.m||'')+')');audit(h,'topup-ok',id,old.amt);db.topups[id]={...old,st:1,by:r,ok:Date.now()};return 1}if(v.st==-1&&old.st==0){db.topups[id]={...old,st:-1,why:String(v.why||'').slice(0,200)};return 1}return 0}}
 if(r=='customer'&&(!v||v.cid!=i||(old&&old.cid!=i)||(k!='tickets'&&v.st>0)||(['apps','cardorders'].includes(k)&&old&&(k=='cardorders'||old.st!==0))))return 0;
 if(r=='customer'&&(['tickets','apps'].includes(k)||(!old&&['orders','rides','cardorders'].includes(k)))){v=cust(k,v,!old);if(!v)return 0}
 if(r=='customer'&&k=='orders'&&!old){const R=db.rests[v.rid];if(!R||!R.open||R.pu>Date.now())return 0}
 if(r=='customer'&&['orders','rides','cardorders'].includes(k)){
  if(!old){delete v.paid;delete v.refd;delete v.dpd;delete v.rated;delete v.rnote;delete v.did;
   if(k=='cardorders'){const c=db.cards[v.card];if(!c)return 0;v.p=c.p}
   if(k=='orders'){const R=db.rests[v.rid],sb=(v.its||[]).reduce((s,x)=>{const it=((R&&R.items)||[]).find(y=>y.n==x.n);return s+(it?it.p:+x.p||0)*Math.max(1,x.q|0)},0),mp=Math.max(0,...Object.values(db.offers||{}).filter(o=>o.on!==0&&(!o.rid||o.rid==v.rid)).map(o=>+o.pct||0)),fl=Math.round(sb*(100-mp)/100)+db.cfg.min;if(!(v.tot>=fl))v.tot=fl}
   if(k=='rides'&&!(v.fare>=db.cfg.min))v.fare=db.cfg.min;
   const amt=k=='orders'?v.tot:k=='rides'?v.fare:v.p;
   if(v.pay=='wallet'){const c=db.customers[i];if(!c||(c.bal||0)<amt)return 0;ccredit(i,-amt,(k=='orders'?'طلب طعام ':k=='rides'?'رحلة تكسي ':'شراء بطاقة ')+id);v.paid=1}
   else v.pay=k=='cardorders'?(v.pay=='zain'?'zain':'master'):'cash'}
  else{const n={cid:i};if(v.st==-1&&(k=='rides'?old.st>=0&&old.st<3:old.st==0))n.st=-1;if(+v.rated>0&&old.st==4&&!old.rated)n.rated=Math.min(5,Math.max(1,+v.rated|0));if('rnote' in v&&old.st==4)n.rnote=String(v.rnote||'').slice(0,300);if('tip' in v&&!old.paid)n.tip=+v.tip>0?+v.tip:0;if('fare' in v&&!old.paid&&+v.fare>=old.fare)n.fare=+v.fare;v=n}}
 if(r=='admin'&&k=='drivers'&&v&&v.tfaReset){const d=db.drivers[id];if(!d)return 0;delete d.tfa;delete d.tfaP;delete d.tl;AU.rev['d:'+id]=Date.now();saveA();audit(h,'2fa-reset',id);return 1}
 if(r=='admin'&&k=='rests'&&v){v={...v};if('items' in v){v.items=cleanItems(v.items);if(!v.items)return 0}if('pct' in v)v.pct=(v.pct===''||v.pct==null)?'':Math.min(100,Math.max(0,+v.pct||0))}
 if(r=='rest'&&k=='rests'){if(id!=i||!v)return 0;const n={};['open','pu','cs','items','n','c','loc','img','prep'].forEach(f=>{if(f in v)n[f]=v[f]});if('items' in n){n.items=cleanItems(n.items);if(!n.items)return 0}v=n}
 if(r=='rest'&&k=='orders'){if(!old||old.rid!=i||!v)return 0;const n={};if('why' in v)n.why=String(v.why).slice(0,200);if(('pt' in v||'prep' in v)&&old.st>1)return 0;if('prep' in v)n.prep=Math.min(180,Math.max(0,+v.prep|0));if('pt' in v)n.pt=+v.pt||0;if('st' in v){const a=old.st,c=v.st;if(!((a==0&&(c==1||c==-1))||(a==1&&(c==2||c==-1))))return 0;n.st=c;if(c==1){n.acc=Date.now();if(!n.pt)n.pt=n.acc+(n.prep||old.prep||15)*6e4}if(c==2)n.rdy=Date.now()}v=n}
 if(r=='rest'&&(k=='rests'||k=='orders'?0:1))return 0;
 if(r=='rest'&&(k=='rests'?id!=i:!old||old.rid!=i||!v))return 0;
 if(r=='driver'&&k!='topups'&&(k=='drivers'?id!=i:!old||(old.did&&old.did!=i)||(v&&v.did&&v.did!=i)))return 0;
 if(r=='driver'&&k=='drivers'){if(!v)return 0;const n={};if('on' in v)n.on=v.on&&(db.drivers[i].bal||0)>mn?1:0;if(v.loc){const a=+v.loc.lat,g=+v.loc.lng;if(!(Math.abs(a)<=90&&Math.abs(g)<=180))return 0;n.loc={lat:a,lng:g}}['car','plate','color'].forEach(f=>{if(f in v)n[f]=String(v[f]).trim().slice(0,60)});if(/^\/u\/[a-f0-9]{32}\.\w+$/.test(String(v.img||'')))n.img=v.img;v=n}
 if(r=='driver'&&(k=='orders'||k=='rides')){if(!v)return 0;const n={};if('did' in v){if(v.did&&(db.drivers[i].bal||0)<=mn)return 0;n.did=v.did}if('rej' in v&&old.did==i&&!v.did){n.rej=[...new Set([...(old.rej||[]),i])];const fee=Math.round(+db.cfg.rejFee)||0;if(k=='orders'&&old.st<3&&fee>0)credit(i,-fee,'غرامة رفض طلب #'+id)}if('st' in v){if((old.did!=i&&n.did!=i)||!((v.st==old.st+1&&(k=='rides'||old.st>=2))||(k=='rides'&&old.st==1&&v.st==0)))return 0;if(v.st==4&&old.t3&&Date.now()-old.t3<(k=='rides'?45e3:3e4))return 0;n.st=v.st;n['t'+v.st]=Date.now()}v=n}
 if(k=='cfg'){v={...(v||{})};['appPct','restPct','taxiPct'].forEach(f=>{if(f in v)v[f]=Math.min(100,Math.max(0,+v[f]||0))});delete v.mig5;if('req2fa' in v)v.req2fa=v.req2fa?1:0;if('theme' in v)v.theme=['auto','royal','night','ocean','ember','carbon','emerald','sunset','rose'].includes(v.theme)?v.theme:'auto';if('rejFee' in v)v.rejFee=Math.min(1e6,Math.max(0,Math.round(+v.rejFee)||0));if('auto' in v)v.auto=v.auto?1:0;if('maxKm' in v)v.maxKm=Math.min(200,Math.max(1,+v.maxKm||10));if('maxDev' in v)v.maxDev=Math.min(20,Math.max(1,Math.round(+v.maxDev)||3));['vpnBlock','timeGuard'].forEach(f=>{if(f in v)v[f]=v[f]?1:0});if('timeTol' in v)v.timeTol=Math.min(60,Math.max(1,Math.round(+v.timeTol)||3));db.cfg={...db.cfg,...v};audit(h,'cfg',id);return 1}
 if(k=='drivers'&&v&&v.loc)v.locAt=Date.now();
 if(v==null)delete db[k][id];else db[k][id]={...old,...v,id};
 {const nw=db[k]&&db[k][id];if(nw&&nw.paid&&!nw.refd&&nw.st<0&&['orders','rides','cardorders'].includes(k)){nw.refd=1;ccredit(nw.cid,k=='orders'?nw.tot:k=='rides'?nw.fare:nw.p,'استرجاع '+id)}}
 if((k=='orders'||k=='rides')&&v&&db[k][id].st==4&&!db[k][id].chg&&db[k][id].did)charge(k,db[k][id]);
 return 1}
const SSE=new Set();let VER=0,BT=0;
const bump=()=>{if(BT)return;BT=setTimeout(()=>{BT=0;VER++;for(const r of SSE)try{r.write('data:'+VER+'\n\n')}catch(e){SSE.delete(r)}},350)};
setInterval(()=>{for(const r of SSE)try{r.write(': p\n\n')}catch(e){SSE.delete(r)}},25000);
const nk=s=>String(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim().toLowerCase();
function menuOp(h,b){const r=h['x-role'],rid=r=='rest'?h['x-id']:r=='admin'?String(b.rid||''):'',R=db.rests[rid];if(!R||(r!='rest'&&r!='admin'))return null;const cur=(Array.isArray(R.items)?R.items:[]).map(i=>({...i}));
 if(b.op=='img'){const im=String(b.img||''),m=im.match(/^\/u\/([a-f0-9]{32})\.(jpg|png|webp)$/);if(!m||!fs.existsSync(path.join(UP,m[1]+'.'+m[2])))return null;const it=cur.find(i=>i.id==b.id);if(!it)return null;it.img=im;R.items=cleanItems(cur);return R.items?{ok:1,img:im}:null}
 if(b.op=='import'){const inc=Array.isArray(b.items)?b.items.slice(0,1000):null;if(!inc)return null;const idx=new Map(cur.map(i=>[nk(i.cat)+'|'+nk(i.n),i])),seen=new Set();let add=0,upd=0,skip=0;
  for(const x of inc){const n=String((x&&x.n)||'').trim().slice(0,80),p=Math.round(+(x&&x.p)),cat=String((x&&x.cat)||'').trim().slice(0,60),d=String((x&&x.d)||'').slice(0,500);if(!n||!(p>=0)||p>1e8){skip++;continue}const k=nk(cat)+'|'+nk(n);if(seen.has(k)){skip++;continue}seen.add(k);const o=idx.get(k);
   if(o){o.p=p;if(d)o.d=d;upd++}else{const it={id:'i'+Date.now().toString(36)+cr.randomBytes(3).toString('hex'),n,p,d,cat,f:'',t:'',off:0,pu:0,img:''};cur.push(it);idx.set(k,it);add++}}
  const cl=cleanItems(cur);if(!cl)return null;R.items=cl;return{ok:1,add,upd,skip,total:cl.length}}
 return null}
/* ===== استيراد المنيو بالذكاء الاصطناعي (صور / PDF / نص) ===== */
const AIK=process.env.ANTHROPIC_API_KEY||'',AIM=process.env.AI_MODEL||'claude-sonnet-5-5',AIU=process.env.ANTHROPIC_API_URL||'https://api.anthropic.com/v1/messages',AIH={};
const AIE=(code,m)=>Object.assign(new Error(m),{code});
const AI_TOOL={name:'save_menu',description:'احفظ الأقسام والأصناف المستخرجة من المنيو كما هي بالضبط.',input_schema:{type:'object',properties:{
 prices_in_thousands:{type:'boolean',description:'true فقط إذا كانت الأسعار في المنيو مكتوبة بالآلاف (مثل 5 أو 7.5 أو 12 وتعني 5000 و7500 و12000 دينار)'},
 categories:{type:'array',items:{type:'object',properties:{name:{type:'string',description:'اسم القسم كما في المنيو'},items:{type:'array',items:{type:'object',properties:{
  n:{type:'string',description:'اسم الصنف كما هو مكتوب'},p:{type:'number',description:'السعر رقمًا كما هو مكتوب في المنيو (بدون عملة). إن وُجدت أحجام متعددة فأنشئ صنفًا لكل حجم باسم مثل «بيتزا - كبير»'},d:{type:'string',description:'الوصف/المكونات إن وُجدت وإلا نص فارغ'}},required:['n','p']}}},required:['name','items']}},
 notes:{type:'string',description:'ملاحظات قصيرة عن أي جزء غير واضح أو لم يُقرأ'}},required:['categories']}};
async function menuAI(rid,b){
 if(!AIK)throw AIE(501,'ميزة الذكاء الاصطناعي غير مفعّلة. أضف متغير البيئة ANTHROPIC_API_KEY في السيرفر.');
 const now=Date.now(),a=(AIH[rid]||[]).filter(t=>now-t<36e5);if(a.length>=15)throw AIE(429,'تجاوزت الحد (15 تحليلًا في الساعة). حاول لاحقًا.');a.push(now);AIH[rid]=a;
 const C=[],OK={'image/jpeg':1,'image/png':1,'image/webp':1,'image/gif':1};
 const files=Array.isArray(b.files)?b.files.slice(0,8):[];
 for(const f of files){const mt=String(f&&f.mime||''),d=String(f&&f.data||'').replace(/^data:[^,]*,/,'');if(!d||!/^[A-Za-z0-9+/=\s]+$/.test(d.slice(0,2000)))throw AIE(400,'ملف غير صالح');
  if(mt=='application/pdf')C.push({type:'document',source:{type:'base64',media_type:mt,data:d}});else if(OK[mt])C.push({type:'image',source:{type:'base64',media_type:mt,data:d}});else throw AIE(415,'نوع الملف غير مدعوم (صورة أو PDF فقط)')}
 const tx=String(b.text||'').slice(0,60000).trim();if(tx)C.push({type:'text',text:'نص المنيو:\n'+tx});
 if(!C.length)throw AIE(400,'لا يوجد محتوى لتحليله');
 const ex=[...new Set((db.rests[rid].items||[]).map(i=>String(i.cat||'').trim()).filter(Boolean))].slice(0,60);
 C.push({type:'text',text:'استخرج كل الأقسام والأصناف من هذا المنيو واستدعِ الأداة save_menu.'});
 const sys=`أنت خبير في قراءة قوائم المطاعم (منيو) العربية والإنجليزية والكردية، وتستخرج منها بيانات منظمة لنظام طلب طعام في العراق.
القواعد:
- استخرج كل صنف ظاهر دون إسقاط أي صنف، ولا تخترع أصنافًا أو أسعارًا غير موجودة.
- انسخ أسماء الأصناف والأقسام بلغتها الأصلية كما هي (صحّح الأخطاء الإملائية الواضحة الناتجة عن جودة الصورة فقط).
- كل صنف يتبع القسم المكتوب تحته/بجانبه في المنيو. إن لم تُوجد أقسام فاقترح قسمًا منطقيًا قصيرًا (مثل: برغر، بيتزا، مشروبات، حلويات، مقبلات).
- إن كان القسم الظاهر في المنيو يطابق قسمًا من الأقسام الحالية التالية بالمعنى فاستخدم الاسم الحالي حرفيًا لتجنب التكرار: ${ex.length?ex.join(' | '):'(لا توجد أقسام حالية)'}.
- السعر رقم فقط كما كُتب. حوّل الأرقام الهندية (٠-٩) إلى إنجليزية. إن كُتبت الأسعار بالآلاف (مثل 5 أو 7.5 أو 12) فاجعل prices_in_thousands=true وأبقِ الأرقام كما هي، وإلا اجعلها false.
- الأحجام/الخيارات ذات الأسعار المختلفة (صغير/وسط/كبير…) صنف مستقل لكل حجم باسم «الاسم - الحجم».
- إن ظهر صنف مرتين بنفس القسم فاذكره مرة واحدة.
- الوصف: المكونات أو الملاحظة المكتوبة تحت الصنف فقط، وإلا فارغ.
- تجاهل أرقام الهواتف والعناوين وساعات العمل والإعلانات.
- إن كان صنف بلا سعر واضح فتجاهله واذكره في notes.`;
 const r=await fetch(AIU,{method:'POST',headers:{'content-type':'application/json','x-api-key':AIK,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:AIM,max_tokens:16000,system:sys,tools:[AI_TOOL],tool_choice:{type:'tool',name:'save_menu'},messages:[{role:'user',content:C}]}),signal:AbortSignal.timeout(120000)}).catch(()=>{throw AIE(502,'تعذر الاتصال بخدمة الذكاء الاصطناعي')});
 const j=await r.json().catch(()=>({}));
 if(!r.ok){console.error('menu-ai',r.status,JSON.stringify(j).slice(0,300));throw AIE(r.status==401||r.status==403?502:r.status==429?429:502,r.status==429?'الخدمة مشغولة، أعد المحاولة بعد قليل':r.status==401||r.status==403?'مفتاح الذكاء الاصطناعي غير صالح':'تعذر تحليل المنيو، جرّب صورة أوضح')}
 const t=(j.content||[]).find(x=>x.type=='tool_use'&&x.name=='save_menu');if(!t||!t.input)throw AIE(502,'لم يتم العثور على أصناف في الملف');
 const items=[],seen=new Set();
 for(const c of Array.isArray(t.input.categories)?t.input.categories:[])for(const x of Array.isArray(c&&c.items)?c.items:[]){
  const n=String(x&&x.n||'').replace(/\s+/g,' ').trim().slice(0,80),p=+x.p,cat=String(c.name||'').replace(/\s+/g,' ').trim().slice(0,60),d=String(x&&x.d||'').trim().slice(0,500);
  if(!n||!Number.isFinite(p)||p<0)continue;const k=nk(cat)+'|'+nk(n);if(seen.has(k))continue;seen.add(k);items.push({cat,n,p,d})}
 if(!items.length)throw AIE(422,'لم يتم العثور على أصناف بأسعار في الملف');
 return{items:items.slice(0,1000),k:t.input.prices_in_thousands===true?1:0,notes:String(t.input.notes||'').slice(0,400),truncated:j.stop_reason=='max_tokens'?1:0}}
const rad=x=>x*Math.PI/180,hv=(a,b)=>{const dl=rad(b.lat-a.lat),dg=rad(b.lng-a.lng),x=Math.sin(dl/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dg/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const busy=d=>Object.values(db.orders).some(o=>o.did==d&&o.st>=0&&o.st<4)||Object.values(db.rides).some(r=>r.did==d&&r.st>=0&&r.st<4);
let DC=0;function dispatch(){if(db.cfg.auto===0)return;const mx=db.cfg.maxKm||10,now=Date.now();
 const q=[...Object.values(db.orders).filter(o=>(o.st==2||(o.st==1&&o.pt&&o.pt-now<=6e5))&&!o.did&&o.rloc).map(o=>[o,'orders',o.rloc]),...Object.values(db.rides).filter(r=>r.st==0&&!r.did&&r.from).map(r=>[r,'rides',r.from])].sort((a,b)=>a[0].at-b[0].at);
 for(const[o,k,p]of q){let best=null,bd=1e9;
  for(const d of Object.values(db.drivers)){if(!d.on||(d.bal||0)<=db.cfg.minBal||!d.loc||(d.locAt&&now-d.locAt>12e4)||(o.rej||[]).includes(d.id)||busy(d.id)||(d.type&&d.type!='both'&&d.type!=(k=='rides'?'taxi':'delivery')))continue;const x=hv(d.loc,p);if(x<=mx&&x<bd){bd=x;best=d}}
  if(best){DC++;o.did=best.id;o.auto=1;o.aat=now;if(k=='rides')o.st=1}}}
setInterval(()=>{const c=DC;dispatch();if(DC!=c)bump();save()},5000);
let UP=process.env.UPLOAD_DIR||path.join(path.dirname(path.resolve(F)),'uploads');
try{fs.mkdirSync(UP,{recursive:true});fs.accessSync(UP,fs.constants.W_OK)}catch(e){console.error('UPLOAD_DIR not writable, using local uploads:',e.message);UP=path.join(__dirname,'uploads');try{fs.mkdirSync(UP,{recursive:true})}catch(_){}}
const LIM=+process.env.MAX_UPLOAD_MB>0?process.env.MAX_UPLOAD_MB*1048576:1e8,X={'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/x-m4v':'mp4','video/webm':'webm','video/quicktime':'mov','video/3gpp':'3gp'},MT={jpg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime','3gp':'video/3gpp'};
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8'};
http.createServer((q,s)=>{
 q.headers['x-ip']=cip(q);who(q.headers);if(q.headers['x-role']=='customer'&&q.headers['x-id']&&!devCheck(q.headers['x-id'],q.headers))q.headers['x-id']='';
 const SH={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'};
 const u=q.url.split('?')[0],j=(c,d)=>{s.writeHead(c,{'Content-Type':'application/json'});s.end(JSON.stringify(d))};
 if(u.startsWith('/api/')&&!u.startsWith('/api/auth/')&&u!='/api/stream'&&u!='/api/driver/login'){const gx=guard(q.headers);if(gx){q.resume();return j(403,gx)}}
 if(u=='/config.js'){s.writeHead(200,{'Content-Type':'text/javascript'});return s.end('window.GKEY='+JSON.stringify(KEY)+';window.GCID='+JSON.stringify(GCID))}

 if(u.startsWith('/api/auth/')&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>1e4)q.destroy()});q.on('end',async()=>{try{b=JSON.parse(b);const a=u.slice(10),now=Date.now(),tg=gTime(q.headers);if(tg&&a!='logout')return j(403,tg);let GEO=null;if(db.cfg.vpnBlock!==0||['login','register','google','wa-verify'].includes(a)){GEO=await ipinfo(q.headers['x-ip']);if(db.cfg.vpnBlock!==0&&GEO.vpn)return j(403,{c:'vpn',e:MSG.vpn})}const tk=()=>{const i=sid(q.headers['x-token']);return i&&db.customers[i]&&devCheck(i,q.headers)?i:''},hp=(w,sl)=>cr.scryptSync(w,sl,32).toString('hex'),In=(id,info,m)=>{const c0=db.customers[id]||{},dl=devLogin(c0,q,b,m||'pw',GEO);if(!dl.ok){if(db.customers[id])save();return j(403,dl)}db.customers[id]={...c0,id,...info,last:now};if(!db.customers[id].at)db.customers[id].at=now;save();const t=mk(id);saveA();return j(200,{id,token:t,n:db.customers[id].n||'',ver:db.customers[id].ver!==0?1:0})};
 if(a=='wa-request'){const p=nph(b.phone);if(!p)return j(400,{e:'رقم غير صحيح'});const o=OTP[p];if(o&&now-o.t<6e4)return j(429,{e:'انتظر دقيقة قبل إعادة الإرسال'});const c=String(cr.randomInt(1e5,1e6));OTP[p]={c,t:now,n:0};return await sendWA(p,c)?j(200,{ok:1,phone:p}):j(502,{e:'تعذر إرسال الرمز'})}
 if(a=='wa-verify'){const p=nph(b.phone),o=OTP[p];if(!o||now-o.t>3e5||o.n>=5)return j(400,{e:'انتهت صلاحية الرمز، اطلب رمزًا جديدًا'});if(String(b.code).trim()!==o.c){o.n++;return j(400,{e:'الرمز خاطئ'})}delete OTP[p];{const id='c'+p,c=db.customers[id];if(c&&c.ver===0){delete AU.pw[id];AU.rev[id]=Date.now();for(const k in AU.sessions)if(AU.sessions[k].id==id)delete AU.sessions[k]}}return In('c'+p,{ph:p,ver:1},'wa')}
 if(a=='google'){if(!GCID)return j(501,{e:'تسجيل جوجل غير مفعّل. أضف GOOGLE_CLIENT_ID في السيرفر'});let g;
  if(b.at){const r=await fetch('https://oauth2.googleapis.com/tokeninfo?access_token='+encodeURIComponent(String(b.at).slice(0,4000)));g=await r.json();if(!r.ok||(g.aud!=GCID&&g.azp!=GCID)||!g.sub||g.email_verified=='false')return j(401,{e:'فشل التحقق من حساب جوجل'});if(!g.name){try{const u2=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+b.at}}).then(r=>r.json());g.name=u2.name||'';g.email=g.email||u2.email||''}catch(e){}}}
  else{const r=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(String(b.cred||'').slice(0,4000)));g=await r.json();if(!r.ok||g.aud!=GCID||g.email_verified=='false')return j(401,{e:'فشل التحقق من حساب جوجل'})}
  return In('g'+g.sub,{n:g.name||'',em:g.email||'',ver:1},'google')}
 if(a=='register'){const p=nph(b.phone),n=String(b.name||'').trim().slice(0,60),pw=String(b.password||''),ip=q.headers['x-ip'],g=RG[ip]||(RG[ip]={n:0,t:now});if(now-g.t>36e5){g.n=0;g.t=now}if(g.n>=10)return j(429,{e:'محاولات كثيرة، حاول لاحقًا'});if(!n)return j(400,{e:'اكتب اسمك'});if(!p)return j(400,{e:'رقم غير صحيح'});if(pw.length<6||pw.length>100)return j(400,{e:'كلمة المرور 6 أحرف على الأقل'});if(db.customers['c'+p])return j(409,{e:'هذا الرقم مسجّل مسبقًا، سجّل الدخول'});g.n++;const sl=cr.randomBytes(16).toString('hex');AU.pw['c'+p]={s:sl,h:hp(pw,sl)};return In('c'+p,{ph:p,n,ver:0},'reg')}
 if(a=='login'){const p=nph(b.phone),id='c'+p,w=AU.pw[id],f=FAIL[p]||(FAIL[p]={n:0,t:now});if(now-f.t>6e5){f.n=0;f.t=now}if(f.n>=5)return j(429,{e:'محاولات كثيرة، انتظر 10 دقائق'});let good=false;if(w){const x=Buffer.from(hp(String(b.password||'').slice(0,100),w.s),'hex'),y=Buffer.from(w.h,'hex');good=x.length==y.length&&cr.timingSafeEqual(x,y)}if(!good){f.n++;return j(401,{e:'الرقم أو كلمة المرور غير صحيحة'})}delete FAIL[p];return In(id,{},'pw')}
 if(a=='me'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id];return j(200,{ph:c.ph||'',n:c.n||'',ver:c.ver!==0?1:0})}
 if(a=='sessions'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],cur=cdev(q.headers['x-dev']);return j(200,{cur,max:Math.max(1,+db.cfg.maxDev||3),devs:Object.values(c.devs||{}).filter(x=>x.st!=2).sort((a,b)=>(b.last||0)-(a.last||0)).map(x=>({id:x.id,nm:x.nm,os:x.os,br:x.br,ip:x.ip,cn:x.cn,city:x.city,first:x.first,last:x.last,st:x.st||0,app:x.app})),sess:(c.sess||[]).slice(-25).reverse()})}
 if(a=='revoke'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],d=cdev(b.target),x=c.devs&&c.devs[d];if(!x||d==cdev(q.headers['x-dev']))return j(400,{e:'لا يمكن إزالة هذا الجهاز من هنا'});if(x.st!=1)x.st=2;save();return j(200,{ok:1})}
 if(a=='logout'){const i=sid(q.headers['x-token']),c=i&&db.customers[i],d=cdev(q.headers['x-dev']);if(c&&c.devs&&c.devs[d]&&c.devs[d].st!=1){c.devs[d].st=2;save()}return j(200,{ok:1})}
 if(a=='verify-request'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id];if(c.ver!==0||!c.ph)return j(200,{ok:1,ver:1});const k='v'+c.ph,o=OTP[k];if(o&&now-o.t<6e4)return j(429,{e:'انتظر دقيقة قبل إعادة الإرسال'});const cd=String(cr.randomInt(1e5,1e6));OTP[k]={c:cd,t:now,n:0};return await sendWA(c.ph,cd)?j(200,{ok:1}):j(502,{e:'تعذر إرسال الرمز'})}
 if(a=='verify-confirm'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],k='v'+c.ph,o=OTP[k];if(!o||now-o.t>3e5||o.n>=5)return j(400,{e:'انتهت صلاحية الرمز، اطلب رمزًا جديدًا'});if(String(b.code).trim()!==o.c){o.n++;return j(400,{e:'الرمز خاطئ'})}delete OTP[k];c.ver=1;save();return j(200,{ok:1,ver:1})}
 j(404,{})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/driver/login'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>5e3)q.destroy()});q.on('end',()=>{try{b=JSON.parse(b);const id=String(b.id||'').slice(0,60),d=db.drivers[id],key='L|'+q.headers['x-ip']+'|'+id;if(lk(key))return j(429,{e:'محاولات كثيرة، انتظر 10 دقائق'});
  if(!d||!eq(d.pin,b.pin)){lk(key,1);return j(401,{e:'بيانات الدخول غير صحيحة'})}
  if(d.tfa){if(!String(b.code||'').trim())return j(200,{need2fa:1});if(!totp(d.tfa,b.code,d)){lk(key,1);return j(401,{e:'رمز التحقق غير صحيح أو مستخدم'})}save()}
  lk(key,0);return j(200,{token:mk('d:'+id),tfa:d.tfa?1:0})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/driver/2fa'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>2e3)q.destroy()});q.on('end',()=>{try{b=JSON.parse(b);const h=q.headers;if(h['x-role']!='driver'||!ok(h))return j(401,{e:'انتهت الجلسة'});const id=h['x-id'],d=db.drivers[id],key='F|'+h['x-ip']+'|'+id;if(lk(key))return j(429,{e:'محاولات كثيرة'});
  if(b.a=='setup'){if(d.tfa)return j(409,{e:'المصادقة الثنائية مفعّلة'});d.tfaP=b32e(cr.randomBytes(20));save();return j(200,{secret:d.tfaP,uri:'otpauth://totp/'+encodeURIComponent('Taxi:'+id)+'?secret='+d.tfaP+'&issuer=Taxi'})}
  if(b.a=='enable'){if(!d.tfaP||!totp(d.tfaP,b.code,d)){lk(key,1);return j(400,{e:'الرمز غير صحيح'})}d.tfa=d.tfaP;delete d.tfaP;lk(key,0);audit(h,'2fa-on',id);save();bump();return j(200,{ok:1,token:mk('d:'+id)})}
  if(b.a=='disable'){if(!d.tfa||!totp(d.tfa,b.code,d)){lk(key,1);return j(400,{e:'الرمز غير صحيح'})}delete d.tfa;delete d.tfaP;AU.rev['d:'+id]=Date.now();saveA();audit(h,'2fa-off',id);save();bump();return j(200,{ok:1})}
  j(400,{e:'طلب غير صالح'})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/stream'){s.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});s.write('retry:1500\n\ndata:'+VER+'\n\n');SSE.add(s);q.on('close',()=>SSE.delete(s));return}
 if(u=='/api/menu'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>3e6)q.destroy()});q.on('end',()=>{try{if(ok(q.headers)){const r=menuOp(q.headers,JSON.parse(b));if(r){save();bump();return j(200,r)}}}catch(e){}j(403,{})});return}
 if(u=='/api/menu-ai'&&q.method=='POST'){let b='',big=0;q.on('data',c=>{if(big)return;b+=c;if(b.length>18e6){big=1;b='';q.resume();j(413,{e:'الملفات كبيرة جدًا، قلّل عدد الصور أو حجمها'})}});q.on('end',async()=>{if(big)return;try{const h=q.headers;if(!ok(h))return j(401,{e:'انتهت الجلسة'});const r=h['x-role'];if(r!='rest'&&r!='admin')return j(403,{});b=JSON.parse(b);const rid=r=='rest'?h['x-id']:String(b.rid||'');if(!db.rests[rid])return j(403,{});
  const out=await menuAI(rid,b);j(200,out)}catch(e){j(e&&typeof e.code=='number'?e.code:500,{e:e&&typeof e.code=='number'?e.message:'تعذر تحليل المنيو'})}});return}
 if(u=='/api/menu-ai/status')return ok(q.headers)?j(200,{ai:!!AIK}):j(401,{});
 if(u=='/api/db')return ok(q.headers)?j(200,view(q.headers)):j(401,{});
 if(u=='/api/set'&&q.method=='POST'){if(rl(q.headers)){q.resume();return j(429,{e:'طلبات كثيرة'})}let b='';q.on('data',c=>{b+=c;if(b.length>8e6)q.destroy()});q.on('end',()=>{try{if(ok(q.headers)&&set(q.headers,JSON.parse(b))){dispatch();save();bump();return j(200,{ok:1})}}catch(e){}j(403,{})});return}
 if(u=='/api/upload'&&q.method=='POST'){const e=X[(q.headers['content-type']||'').split(';')[0].trim()];if(!ok(q.headers)){q.resume();return j(401,{e:'انتهت الجلسة'})}if(!e){q.resume();return j(415,{e:'نوع الملف غير مدعوم'})}const LM=['admin','support'].includes(q.headers['x-role'])?LIM:Math.min(LIM,15e6);if(+q.headers['content-length']>LM){q.resume();return j(413,{e:'الملف كبير'})}const n=cr.randomBytes(16).toString('hex')+'.'+e,fp=path.join(UP,n);let sz=0,bad=0;try{fs.mkdirSync(UP,{recursive:true})}catch(_){}const w=fs.createWriteStream(fp);q.on('data',c=>{sz+=c.length;if(sz>LM&&!bad){bad=1;q.unpipe(w);w.destroy();fs.unlink(fp,()=>{});j(413,{e:'الملف كبير'});q.resume()}});q.pipe(w);w.on('finish',()=>{if(!bad)j(200,{url:'/u/'+n})});w.on('error',()=>{if(!bad){bad=1;j(500,{e:'تعذر حفظ الملف'})}});return}
 if(u.startsWith('/u/')){const n=path.basename(u),m=n.match(/^[a-f0-9]{32}\.(\w+)$/);if(!m||!MT[m[1]]){s.writeHead(404);return s.end()}const p=path.join(UP,n);fs.stat(p,(er,st)=>{if(er){s.writeHead(404);return s.end()}const r=(q.headers.range||'').match(/bytes=(\d*)-(\d*)/);let a=0,b=st.size-1,c=200;if(r){a=r[1]?+r[1]:0;b=r[2]?Math.min(+r[2],b):b;c=206}s.writeHead(c,{'Content-Type':MT[m[1]],'Accept-Ranges':'bytes','Content-Length':b-a+1,'Cache-Control':'private,max-age=86400','X-Content-Type-Options':'nosniff',...(c==206?{'Content-Range':`bytes ${a}-${b}/${st.size}`}:{})});fs.createReadStream(p,{start:a,end:b}).pipe(s)});return}
 const f=path.join(PUB,u=='/'?'customer.html':u);
 if(!f.startsWith(PUB))return s.end();
 fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end('404')}s.writeHead(200,{...SH,'Content-Type':T[path.extname(f)]||'application/octet-stream'});s.end(d)})
}).listen(process.env.PORT||3000);

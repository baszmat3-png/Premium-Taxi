const http=require('http'),fs=require('fs'),path=require('path');
const F=process.env.DATA_FILE||'data.json',ADMIN=process.env.ADMIN_PIN||'1234',KEY=process.env.GOOGLE_MAPS_KEY||'',PUB=path.join(__dirname,'public');
let db={topups:{},tx:{},customers:{},rests:{},orders:{},rides:{},drivers:{},tickets:{},staff:{},offers:{},cards:{},apps:{},cardorders:{},cfg:{base:1500,km:700,min:3000,foodKm:400,auto:1,maxKm:10}};
try{Object.assign(db,JSON.parse(fs.readFileSync(F)))}catch(e){}
db.cfg={appPct:15,restPct:10,taxiPct:10,minBal:-15000,pay:[],...db.cfg};
const pubc=c=>({base:c.base,km:c.km,min:c.min,foodKm:c.foodKm});
const save=()=>fs.writeFile(F,JSON.stringify(db),()=>{});
const AUF=process.env.AUTH_FILE||'auth.json',GCID=process.env.GOOGLE_CLIENT_ID||'',WAU=process.env.WA_API_URL||'',WAK=process.env.WA_API_KEY||'',cr=require('crypto'),OTP={};
let AU={sessions:{}};try{AU=JSON.parse(fs.readFileSync(AUF))}catch(e){}
const saveA=()=>fs.writeFile(AUF,JSON.stringify(AU),()=>{});
const nph=x=>{let p=String(x||'').replace(/\D/g,'');if(p.startsWith('00'))p=p.slice(2);if(p.startsWith('0'))p='964'+p.slice(1);return/^\d{10,15}$/.test(p)?p:''};
async function sendWA(p,c){const m='رمز دخولك إلى تكسي المتميز: '+c;if(!WAU){console.log('[OTP]',p,c);return 1}try{const r=await fetch(WAU,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+WAK,apikey:WAK},body:JSON.stringify({to:p,number:p,phone:p,message:m,text:m})});return r.ok}catch(e){return 0}}
const who=h=>{if(h['x-role']=='customer'){const t=AU.sessions[h['x-token']];h['x-id']=t?t.id:''}};
const W={customer:['orders','rides','tickets','apps','cardorders'],driver:['orders','rides','drivers','topups'],rest:['rests','orders'],support:['orders','rides','tickets','drivers','apps','cardorders','topups'],admin:['rests','orders','rides','drivers','tickets','staff','cfg','offers','cards','apps','cardorders','topups','wallet']};
const ok=h=>{const r=h['x-role'],p=h['x-pin'],i=h['x-id'];
 return r=='customer'?!!i:r=='admin'?p==ADMIN:r=='support'?Object.values(db.staff).some(s=>s.pin==p):r=='rest'?!!db.rests[i]&&db.rests[i].pin==p:r=='driver'?!!db.drivers[i]&&db.drivers[i].pin==p:false};
const clean=(o,f)=>Object.fromEntries(Object.entries(o).map(([k,v])=>{v={...v};f.forEach(x=>delete v[x]);return[k,v]}));
const flt=(c,fn)=>Object.fromEntries(Object.entries(db[c]).filter(([,v])=>fn(v)));
function view(h){const r=h['x-role'],i=h['x-id'],rs=clean(db.rests,['pin']);
 if(r=='admin')return db;
 if(r=='support')return{...db,rests:rs,drivers:clean(db.drivers,['pin']),staff:{}};
 if(r=='rest'){const os=flt('orders',v=>v.rid==i),ids=[...new Set(Object.values(os).map(v=>v.did).filter(d=>d&&db.drivers[d]))];return{cfg:pubc(db.cfg),rests:{[i]:db.rests[i]},orders:os,drivers:Object.fromEntries(ids.map(d=>{const x=db.drivers[d];return[d,{id:d,n:x.n,ph:x.ph,car:x.car,loc:x.loc,locAt:x.locAt}]}))}}
 if(r=='driver')return{cfg:db.cfg,topups:flt('topups',v=>v.did==i),tx:flt('tx',v=>v.did==i),rests:rs,orders:flt('orders',v=>v.did==i||(v.st==2&&!v.did)),rides:flt('rides',v=>v.did==i||(v.st==0&&!v.did)),drivers:{[i]:clean(db.drivers,['pin'])[i]}};
 const mine=v=>v.cid==i,orders=flt('orders',mine),rides=flt('rides',mine);
 const ids=[...new Set([...Object.values(orders),...Object.values(rides)].map(v=>v.did).filter(d=>d&&db.drivers[d]))];
 return{cfg:pubc(db.cfg),rests:rs,orders,rides,tickets:flt('tickets',mine),offers:db.offers,cards:db.cards,apps:flt('apps',mine),cardorders:flt('cardorders',mine),drivers:Object.fromEntries(ids.map(d=>{const x=db.drivers[d];return[d,{id:d,n:x.n,ph:x.ph,car:x.car,loc:x.loc}]}))}}
function credit(d,a,why){const x=db.drivers[d];if(!x)return;x.bal=(x.bal||0)+a;if(x.bal<=db.cfg.minBal)x.on=0;const t='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);db.tx[t]={id:t,did:d,amt:a,why,bal:x.bal,at:Date.now()}}
function charge(k,o){const c=db.cfg;o.chg=1;if(k=='orders'){o.com=Math.round((o.fee||0)*c.appPct/100);const r=db.rests[o.rid],sb=(o.its||[]).reduce((s,i)=>s+i.q*i.p,0);o.rcom=Math.round(sb*((r&&r.pct!=null&&r.pct!=='')?r.pct:c.restPct)/100)}else o.com=Math.round((o.fare||0)*c.taxiPct/100);if(o.com)credit(o.did,-o.com,(k=='orders'?'عمولة طلب ':'عمولة رحلة ')+o.id)}
function set(h,b){const{k,id}=b;let v=b.v;const r=h['x-role'],i=h['x-id'];
 if(!W[r]||!W[r].includes(k)||!id)return 0;
 const old=db[k]&&db[k][id],mn=db.cfg.minBal;
 if(k=='wallet'){const d=db.drivers[id],a=Math.round(+(v&&v.amt));if(!d||!a)return 0;credit(id,a,String((v&&v.why)||'شحن من لوحة التحكم').slice(0,100));return 1}
 if(k=='topups'){if(r=='driver'){if(old||!v||v.did!=i||!(+v.amt>0))return 0;v={did:i,amt:Math.round(+v.amt),m:String(v.m||'').slice(0,60),img:String(v.img||'').slice(0,200),note:String(v.note||'').slice(0,300),st:0,at:Date.now()}}else{if(!old||!v)return 0;if(v.st==1&&old.st==0){credit(old.did,old.amt,'شحن بوصل تحويل ('+(old.m||'')+')');db.topups[id]={...old,st:1,by:r,ok:Date.now()};return 1}if(v.st==-1&&old.st==0){db.topups[id]={...old,st:-1,why:String(v.why||'').slice(0,200)};return 1}return 0}}
 if(r=='customer'&&(!v||v.cid!=i||(old&&old.cid!=i)||(k!='tickets'&&v.st>0)||(['apps','cardorders'].includes(k)&&old&&(k=='cardorders'||old.st!==0))))return 0;
 if(r=='customer'&&k=='orders'&&!old){const R=db.rests[v.rid];if(!R||!R.open||R.pu>Date.now())return 0}
 if(r=='rest'&&k=='rests'){if(id!=i||!v)return 0;const n={};['open','pu','cs','items','n','c','loc','img','prep'].forEach(f=>{if(f in v)n[f]=v[f]});v=n}
 if(r=='rest'&&k=='orders'){if(!old||old.rid!=i||!v)return 0;const n={};if('why' in v)n.why=String(v.why).slice(0,200);if(('pt' in v||'prep' in v)&&old.st>1)return 0;if('prep' in v)n.prep=Math.min(180,Math.max(0,+v.prep|0));if('pt' in v)n.pt=+v.pt||0;if('st' in v){const a=old.st,c=v.st;if(!((a==0&&(c==1||c==-1))||(a==1&&(c==2||c==-1))))return 0;n.st=c;if(c==1){n.acc=Date.now();if(!n.pt)n.pt=n.acc+(n.prep||old.prep||15)*6e4}if(c==2)n.rdy=Date.now()}v=n}
 if(r=='rest'&&(k=='rests'||k=='orders'?0:1))return 0;
 if(r=='rest'&&(k=='rests'?id!=i:!old||old.rid!=i||!v))return 0;
 if(r=='driver'&&k!='topups'&&(k=='drivers'?id!=i:!old||(old.did&&old.did!=i)||(v&&v.did&&v.did!=i)))return 0;
 if(r=='driver'&&k=='drivers'){if(!v)return 0;const n={};if('on' in v)n.on=v.on&&(db.drivers[i].bal||0)>mn?1:0;if(v.loc)n.loc=v.loc;v=n}
 if(r=='driver'&&(k=='orders'||k=='rides')){if(!v)return 0;const n={};if('did' in v){if(v.did&&(db.drivers[i].bal||0)<=mn)return 0;n.did=v.did}if('rej' in v)n.rej=v.rej;if('st' in v){if((old.did!=i&&n.did!=i)||!((v.st==old.st+1&&(k=='rides'||old.st>=2))||(k=='rides'&&old.st==1&&v.st==0)))return 0;n.st=v.st}v=n}
 if(k=='cfg'){db.cfg={...db.cfg,...v};return 1}
 if(k=='drivers'&&v&&v.loc)v.locAt=Date.now();
 if(v==null)delete db[k][id];else db[k][id]={...old,...v,id};
 if((k=='orders'||k=='rides')&&v&&db[k][id].st==4&&!db[k][id].chg&&db[k][id].did)charge(k,db[k][id]);
 return 1}
const rad=x=>x*Math.PI/180,hv=(a,b)=>{const dl=rad(b.lat-a.lat),dg=rad(b.lng-a.lng),x=Math.sin(dl/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dg/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const busy=d=>Object.values(db.orders).some(o=>o.did==d&&o.st>=0&&o.st<4)||Object.values(db.rides).some(r=>r.did==d&&r.st>=0&&r.st<4);
function dispatch(){if(db.cfg.auto===0)return;const mx=db.cfg.maxKm||10,now=Date.now();
 const q=[...Object.values(db.orders).filter(o=>(o.st==2||(o.st==1&&o.pt&&o.pt-now<=6e5))&&!o.did&&o.rloc).map(o=>[o,'orders',o.rloc]),...Object.values(db.rides).filter(r=>r.st==0&&!r.did&&r.from).map(r=>[r,'rides',r.from])].sort((a,b)=>a[0].at-b[0].at);
 for(const[o,k,p]of q){let best=null,bd=1e9;
  for(const d of Object.values(db.drivers)){if(!d.on||(d.bal||0)<=db.cfg.minBal||!d.loc||(d.locAt&&now-d.locAt>12e4)||(o.rej||[]).includes(d.id)||busy(d.id)||(d.type&&d.type!='both'&&d.type!=(k=='rides'?'taxi':'delivery')))continue;const x=hv(d.loc,p);if(x<=mx&&x<bd){bd=x;best=d}}
  if(best){o.did=best.id;o.auto=1;o.aat=now;if(k=='rides')o.st=1}}}
setInterval(()=>{dispatch();save()},15000);
const UP=process.env.UPLOAD_DIR||path.join(path.dirname(path.resolve(F)),'uploads'),X={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/webm':'webm','video/quicktime':'mov'},MT={jpg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime'};
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8'};
http.createServer((q,s)=>{
 who(q.headers);
 const u=q.url.split('?')[0],j=(c,d)=>{s.writeHead(c,{'Content-Type':'application/json'});s.end(JSON.stringify(d))};
 if(u=='/config.js'){s.writeHead(200,{'Content-Type':'text/javascript'});return s.end('window.GKEY='+JSON.stringify(KEY)+';window.GCID='+JSON.stringify(GCID))}

 if(u.startsWith('/api/auth/')&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>1e4)q.destroy()});q.on('end',async()=>{try{b=JSON.parse(b);const a=u.slice(10),now=Date.now(),In=(id,info)=>{db.customers[id]={...db.customers[id],id,...info,last:now};if(!db.customers[id].at)db.customers[id].at=now;save();const t=cr.randomBytes(24).toString('hex');AU.sessions[t]={id,at:now};saveA();return j(200,{id,token:t,n:db.customers[id].n||''})};
 if(a=='wa-request'){const p=nph(b.phone);if(!p)return j(400,{e:'رقم غير صحيح'});const o=OTP[p];if(o&&now-o.t<6e4)return j(429,{e:'انتظر دقيقة قبل إعادة الإرسال'});const c=String(cr.randomInt(1e5,1e6));OTP[p]={c,t:now,n:0};return await sendWA(p,c)?j(200,{ok:1,phone:p}):j(502,{e:'تعذر إرسال الرمز'})}
 if(a=='wa-verify'){const p=nph(b.phone),o=OTP[p];if(!o||now-o.t>3e5||o.n>=5)return j(400,{e:'انتهت صلاحية الرمز، اطلب رمزًا جديدًا'});if(String(b.code).trim()!==o.c){o.n++;return j(400,{e:'الرمز خاطئ'})}delete OTP[p];return In('c'+p,{ph:p})}
 if(a=='google'){if(!GCID)return j(501,{e:'تسجيل جوجل غير مفعّل'});const r=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(b.cred||'')),g=await r.json();if(!r.ok||g.aud!=GCID||g.email_verified=='false')return j(401,{e:'فشل التحقق من حساب جوجل'});return In('g'+g.sub,{n:g.name||'',em:g.email||''})}
 j(404,{})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/db')return ok(q.headers)?j(200,view(q.headers)):j(401,{});
 if(u=='/api/set'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>8e6)q.destroy()});q.on('end',()=>{try{if(ok(q.headers)&&set(q.headers,JSON.parse(b))){dispatch();save();return j(200,{ok:1})}}catch(e){}j(403,{})});return}
 if(u=='/api/upload'&&q.method=='POST'){const e=X[(q.headers['content-type']||'').split(';')[0]];if(!ok(q.headers)||!e){q.resume();return j(403,{})}const n=require('crypto').randomBytes(16).toString('hex')+'.'+e;fs.mkdirSync(UP,{recursive:true});let sz=0;const w=fs.createWriteStream(path.join(UP,n));q.on('data',c=>{sz+=c.length;if(sz>6e7){q.destroy();w.destroy();fs.unlink(path.join(UP,n),()=>{})}});q.pipe(w);w.on('finish',()=>j(200,{url:'/u/'+n}));w.on('error',()=>j(500,{}));return}
 if(u.startsWith('/u/')){const n=path.basename(u),m=n.match(/^[a-f0-9]{32}\.(\w+)$/);if(!m||!MT[m[1]]){s.writeHead(404);return s.end()}const p=path.join(UP,n);fs.stat(p,(er,st)=>{if(er){s.writeHead(404);return s.end()}const r=(q.headers.range||'').match(/bytes=(\d*)-(\d*)/);let a=0,b=st.size-1,c=200;if(r){a=r[1]?+r[1]:0;b=r[2]?Math.min(+r[2],b):b;c=206}s.writeHead(c,{'Content-Type':MT[m[1]],'Accept-Ranges':'bytes','Content-Length':b-a+1,'Cache-Control':'private,max-age=86400',...(c==206?{'Content-Range':`bytes ${a}-${b}/${st.size}`}:{})});fs.createReadStream(p,{start:a,end:b}).pipe(s)});return}
 const f=path.join(PUB,u=='/'?'customer.html':u);
 if(!f.startsWith(PUB))return s.end();
 fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);return s.end('404')}s.writeHead(200,{'Content-Type':T[path.extname(f)]||'application/octet-stream'});s.end(d)})
}).listen(process.env.PORT||3000);

const http=require('http'),fs=require('fs'),path=require('path'),ZL=require('zlib');
// ---- تحميل آمن + حفظ ذرّي مؤجَّل (لا يمسح بياناتك عند تلف الملف) ----
function loadJSON(f){for(const p of [f,f+'.bak']){if(!fs.existsSync(p))continue;try{const t=fs.readFileSync(p,'utf8');if(!t.trim())continue;if(p!==f)console.error('[DB] استُخدمت النسخة الاحتياطية',p);return JSON.parse(t)}catch(e){console.error('[DB] تعذر قراءة',p,e.message)}}
 if(fs.existsSync(f)&&fs.statSync(f).size>2){console.error('[FATAL] ملف البيانات '+f+' موجود لكنه تالف ولا توجد نسخة سليمة. أوقفت التشغيل كي لا أمسح بياناتك.');process.exit(1)}return null}
const yl=()=>new Promise(r=>setImmediate(r));
async function serMap(m,st){const out=[];let t=Date.now();for(const k in m){const sv=JSON.stringify(m[k]);if(sv!==undefined)out.push(JSON.stringify(k)+':'+sv);if(Date.now()-t>6){st.ms+=Date.now()-t;await yl();t=Date.now()}}st.ms+=Date.now()-t;return'{'+out.join(',')+'}'}
async function serAsync(o,st){const parts=[];for(const k of Object.keys(o)){const v=o[k];const sv=v&&typeof v=='object'&&!Array.isArray(v)&&Object.keys(v).length>300?await serMap(v,st):JSON.stringify(v);if(sv!==undefined)parts.push(JSON.stringify(k)+':'+sv)}return'{'+parts.join(',')+'}'}
function mkSaver(file,get,minMs){let dirty=0,tm=null,wip=0,ms=0,bakAt=0;
 const bak=()=>{if(Date.now()-bakAt>6e5&&fs.existsSync(file)){bakAt=Date.now();try{fs.copyFileSync(file,file+'.bak')}catch(e){}}};
 function flush(sync){if(tm){clearTimeout(tm);tm=null}if(!dirty)return;if(wip&&!sync){tm=setTimeout(flush,200);return}
  const tmp=file+'.tmp';
  if(sync){let s;try{s=JSON.stringify(get())}catch(e){console.error('[SAVE] stringify',e.message);return}dirty=0;try{fs.writeFileSync(tmp,s);bak();fs.renameSync(tmp,file)}catch(e){console.error('[SAVE]',e.message);dirty=1}return}
  wip=1;dirty=0;const st={ms:0};serAsync(get(),st).then(s=>{ms=st.ms;fs.writeFile(tmp,s,e=>{if(e){wip=0;dirty=1;console.error('[SAVE]',e.message);if(!tm)tm=setTimeout(flush,2e3);return}bak();fs.rename(tmp,file,e2=>{wip=0;if(e2){dirty=1;console.error('[SAVE]',e2.message)}})})}).catch(e=>{wip=0;dirty=1;console.error('[SAVE] serialize',e&&e.message)})}
 return{mark:()=>{dirty=1;if(!tm)tm=setTimeout(flush,Math.max(minMs,ms*4))},flush,ms:()=>ms}}
let MUT=0,WHY='';const RTC=new Map(),RTR=new Map();
function decPl(e){const o=[];let i=0,la=0,ln=0;while(i<e.length){let b,sh=0,r=0;do{b=e.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);la+=r&1?~(r>>1):r>>1;sh=0;r=0;do{b=e.charCodeAt(i++)-63;r|=(b&31)<<sh;sh+=5}while(b>=32);ln+=r&1?~(r>>1):r>>1;o.push([la/1e5,ln/1e5])}return o}const APT=new Map(),APR=new Map();setInterval(()=>{const t=Date.now();for(const[k,v]of APT)if(v.exp<t)APT.delete(k)},6e5).unref();
const F=process.env.DATA_FILE||'data.json',ADMIN=process.env.ADMIN_PIN||'1234',KEY=process.env.GOOGLE_MAPS_KEY||'',MBT=process.env.MAPBOX_TOKEN||'',PUB=path.join(__dirname,'public');
let db={chat:{},codes:{},exp:{},topups:{},tx:{},customers:{},rests:{},orders:{},rides:{},drivers:{},tickets:{},staff:{},offers:{},cards:{},apps:{},cardorders:{},wd:{},incw:{},ctop:{},ctx:{},cfg:{base:1000,km:390,min:3000,foodKm:400,auto:1,maxKm:10}};
{const L0=loadJSON(F);if(L0)Object.assign(db,L0)}
db.chat=db.chat||{};db.cfg={maxDev:3,vpnBlock:1,timeGuard:1,timeTol:3,appPct:15,restPct:5,taxiPct:5,minBal:-15000,pay:[],minWd:25000,wOn:1,wTaxiN:3,wTaxiPct:30,wTaxiMax:0,wFoodN:4,capBonus:10000,abOn:1,abWarn:4,abBan:6,abDays:3,abWin:30,abGrace:60,rt:[{id:'eco',n:'توفير',d:'التكسي الأوفر',m:1,g:'taxi'},{id:'super',n:'سوبر',d:'الخيار الأفضل',m:1.1,g:'taxi'},{id:'plus',n:'بلس',d:'راحة أكثر',m:1.3,g:'taxi'},{id:'box',n:'بوكس',d:'توصيل طرود وأغراض',m:1.1,g:'box'}],...db.cfg};if(!db.cfg.mig5){db.cfg.mig5=1;db.cfg.restPct=5;db.cfg.taxiPct=5}if(!db.cfg.mig6){db.cfg.mig6=1;db.cfg.base=1000;db.cfg.km=390;db.cfg.min=3000;(db.cfg.rt||[]).forEach(x=>{if(x.id=='eco')x.m=1;if(x.id=='super')x.m=1.1;if(x.id=='plus')x.m=1.3})}if(!db.cfg.mig7){db.cfg.mig7=1;db.cfg.min=2500;db.cfg.outKm=50;db.cfg.peak={on:0,pct:20,until:0};db.cfg.esc={on:1,sec:180,pct:10,n:2};db.cfg.dl={n:4,m:8,p1:1500,p2:2000,p3:3000}}db.lines=db.lines||{};db.lreqs=db.lreqs||{};db.wd=db.wd||{};db.incw=db.incw||{};db.ctop=db.ctop||{};db.ctx=db.ctx||{};db.vars=db.vars||{};
for(const[k,x]of Object.entries({maintenance:{v:0,t:'b',pub:1,d:'وضع الصيانة: يوقف الطلبات الجديدة من الزبائن ويعرض لهم رسالة'},maintMsg:{v:'التطبيق في صيانة قصيرة، نعود قريبًا.',t:'s',pub:1,d:'رسالة الصيانة'},banner:{v:'',t:'s',pub:1,d:'شريط إعلان أعلى كل التطبيقات (فارغ = مخفي)'},rlPerMin:{v:240,t:'n',pub:0,d:'حد طلبات المستخدم الواحد في الدقيقة'},bumpMs:{v:350,t:'n',pub:0,d:'تأخير بث التحديثات الفورية (مللي ثانية) — ارفعه عند الضغط العالي'},maxSSE:{v:20000,t:'n',pub:0,d:'أقصى اتصالات بث مباشر؛ الزائد يعمل بالاستطلاع'},archiveDays:{v:0,t:'n',pub:0,d:'أرشفة الطلبات/الرحلات المنتهية الأقدم من N يوم إلى مجلد archive (0 = إيقاف). يبقي السيرفر سريعًا مع نمو السجل؛ الرصيد والمحاسبة لا تتأثر لكن الأقدم يختفي من اللوحة'}}))if(!db.vars[k])db.vars[k]={id:k,...x,at:Date.now()};
const VAR=(k,d)=>{const x=db.vars[k];return x==null||x.v==null||x.v===''?d:x.v};
let PVM=-1,PVC={};function PV(){if(PVM!==MUT){PVM=MUT;PVC={};for(const k in db.vars){const x=db.vars[k];if(x&&x.pub)PVC[k]=x.v}}return PVC}
const pubc=c=>({base:c.base,km:c.km,min:c.min,foodKm:c.foodKm,outKm:c.outKm,peak:c.peak,esc:c.esc,dl:c.dl,rt:c.rt,pay:c.pay,restPct:c.restPct,theme:c.theme,wTaxiPct:c.wTaxiPct,payHide:c.payHide||{},gw:{mc:c.gw&&c.gw.mc?1:0,zc:c.gw&&c.gw.zc?1:0},vars:PV()});
const PRC=require('./public/pricing.js'),PUSH=require('./push.js')({dir:path.dirname(path.resolve(F))});
const DBS=mkSaver(F,()=>db,Math.max(200,+process.env.SAVE_INTERVAL_MS||1500)),save=()=>{MUT++;CV++;DBS.mark()},savel=()=>{MUT++;DBS.mark()};
const AUF=process.env.AUTH_FILE||'auth.json',GCID=process.env.GOOGLE_CLIENT_ID||'',WAU=process.env.WA_API_URL||'',WAK=process.env.WA_API_KEY||'',cr=require('crypto'),OTP={},FAIL={},RG={};
let AU=loadJSON(AUF)||{sessions:{}};AU.sessions=AU.sessions||{};AU.pw=AU.pw||{};AU.rev=AU.rev||{};
if(!process.env.SESSION_SECRET&&!AU.sec){AU.sec=cr.randomBytes(32).toString('hex');fs.writeFileSync(AUF,JSON.stringify(AU))}
const SEC=process.env.SESSION_SECRET||AU.sec,YEAR=365*864e5,b64=x=>Buffer.from(x).toString('base64url'),sg=x=>cr.createHmac('sha256',SEC).update(x).digest('base64url');
const mk=id=>{const p=b64(id)+'.'+Date.now();return p+'.'+sg(p)};
const sid=t=>{t=String(t||'');const o=AU.sessions[t];if(o)return o.id;const a=t.split('.');if(a.length!=3)return'';const p=a[0]+'.'+a[1],x=Buffer.from(sg(p)),y=Buffer.from(a[2]);if(x.length!=y.length||!cr.timingSafeEqual(x,y))return'';const at=+a[1],id=Buffer.from(a[0],'base64url').toString();if(!(at>0)||Date.now()-at>YEAR||at<(AU.rev[id]||0))return'';return id};
process.on('uncaughtException',e=>console.error('uncaught',e));process.on('unhandledRejection',e=>console.error('unhandled',e));
const AUS=mkSaver(AUF,()=>AU,1000),saveA=()=>AUS.mark();
// ---- نسخ احتياطي: كل ساعة + يومي مؤرَّخ (مضغوط) + نسخة خارجية اختيارية إلى مستودع GitHub خاص ----
const BKD=process.env.BACKUP_DIR||path.join(path.dirname(path.resolve(F)),'backups'),BKH=Math.max(1,+process.env.BACKUP_KEEP_DAYS||30);
const bkName=(t,k)=>{const d=new Date(t+3*36e5).toISOString();return 'backup-'+d.slice(0,10)+'_'+d.slice(11,16).replace(':','')+'-'+k+'.json.gz'};
function bkList(){try{return fs.readdirSync(BKD).filter(n=>/^backup-.*\.json\.gz$/.test(n)).map(n=>{const st=fs.statSync(path.join(BKD,n));return{n,sz:st.size,at:st.mtimeMs}}).sort((a,b)=>b.at-a.at)}catch(e){return[]}}
const GHT=()=>process.env.BACKUP_GH_TOKEN,GHR=()=>process.env.BACKUP_GH_REPO;
function ghApi(method,p,body,raw){return new Promise((ok,no)=>{const b=body?JSON.stringify(body):null;const rq=require('https').request({host:'api.github.com',path:'/repos/'+GHR()+p,method,headers:{'Authorization':'Bearer '+GHT(),'User-Agent':'premium-taxi-backup','Accept':raw?'application/vnd.github.raw+json':'application/vnd.github+json',...(b?{'Content-Type':'application/json','Content-Length':Buffer.byteLength(b)}:{})},timeout:60000},r=>{const ch=[];r.on('data',c=>ch.push(c));r.on('end',()=>{const buf=Buffer.concat(ch);if(r.statusCode>=300)return no(new Error('GitHub '+r.statusCode+' '+buf.toString().slice(0,160)));ok(raw?buf:JSON.parse(buf.toString()||'{}'))})});rq.on('timeout',()=>rq.destroy(new Error('timeout')));rq.on('error',no);if(b)rq.write(b);rq.end()})}
async function ghPut(p,buf,msg){let sha;try{sha=(await ghApi('GET','/contents/'+p+'?ref=main')).sha}catch(e){}return ghApi('PUT','/contents/'+p,{message:msg,content:buf.toString('base64'),...(sha?{sha}:{})})}
let GHB=0;async function bkGh(name,buf){if(!GHT()||!GHR()||GHB)return 0;GHB=1;try{if(name)await ghPut('backups/'+name,buf,'backup '+name);await ghPut('backups/latest.json.gz',buf,'latest '+new Date().toISOString());db.cfg.bkGhAt=Date.now();return 1}catch(e){console.error('[BACKUP] GitHub',e.message);return 0}finally{GHB=0}}
const bkBuf=()=>ZL.gzipSync(JSON.stringify({v:1,at:Date.now(),data:db,auth:AU}));
/* استعادة: نستبدل محتوى البيانات في مكانها حتى تبقى كل المراجع صالحة */
function applyBackup(buf){let o;try{o=JSON.parse((buf[0]==0x1f&&buf[1]==0x8b?ZL.gunzipSync(buf):buf).toString())}catch(e){throw new Error('الملف ليس نسخة احتياطية صالحة')}const d=o&&o.data;if(!d||typeof d!='object'||!d.cfg)throw new Error('الملف لا يحتوي بيانات التطبيق');
 for(const k of Object.keys(db))delete db[k];Object.assign(db,d);if(o.auth&&typeof o.auth=='object'){for(const k of Object.keys(AU))delete AU[k];Object.assign(AU,o.auth);AU.sessions=AU.sessions||{};AU.pw=AU.pw||{};AU.rev=AU.rev||{}}
 IXF=1;try{CKS=null}catch(e){}save();saveA();DBS.flush(true);AUS.flush(true);bump();return{customers:Object.keys(db.customers||{}).length,drivers:Object.keys(db.drivers||{}).length,rests:Object.keys(db.rests||{}).length,orders:Object.keys(db.orders||{}).length,rides:Object.keys(db.rides||{}).length,at:o.at}}
const dbEmpty=()=>!Object.keys(db.customers||{}).length&&!Object.keys(db.drivers||{}).length&&!Object.keys(db.rests||{}).length;
async function ghRestoreLatest(){const buf=await ghApi('GET','/contents/backups/latest.json.gz?ref=main',null,true);return applyBackup(buf)}
function backupNow(kind){try{fs.mkdirSync(BKD,{recursive:true});const t=Date.now(),name=bkName(t,kind),buf=ZL.gzipSync(JSON.stringify({v:1,at:t,data:db,auth:AU}));fs.writeFileSync(path.join(BKD,name+'.tmp'),buf);fs.renameSync(path.join(BKD,name+'.tmp'),path.join(BKD,name));
  const L=bkList(),now=Date.now();L.forEach(x=>{const old=now-x.at;if((x.n.includes('-hourly')&&old>2*864e5)||(x.n.includes('-daily')&&old>BKH*864e5)||(x.n.includes('-manual')&&old>BKH*864e5))try{fs.unlinkSync(path.join(BKD,x.n))}catch(e){}});
  bkGh(kind=='hourly'?'':name,buf);console.log('[BACKUP]',name,(buf.length/1024|0)+'KB');return name}catch(e){console.error('[BACKUP]',e.message);return null}}
setTimeout(()=>{let lastDay='',lastH=-1;const tick=()=>{const d=new Date(Date.now()+3*36e5),day=d.toISOString().slice(0,10),h=d.getUTCHours();if(!bkList().some(x=>x.n.includes(day)&&x.n.includes('-daily'))&&day!==lastDay){lastDay=day;backupNow('daily')}else if(h!==lastH){if(lastH!==-1)backupNow('hourly');}lastH=h};tick();setInterval(tick,5*6e4).unref()},15e3).unref();
for(const sg of ['SIGTERM','SIGINT'])process.on(sg,()=>{try{DBS.flush(1);AUS.flush(1)}catch(e){}if(!GHT()||!GHR()||dbEmpty())return process.exit(0);const t=setTimeout(()=>process.exit(0),20000);bkGh('',bkBuf()).finally(()=>{clearTimeout(t);console.log('[BACKUP] saved to GitHub before shutdown');process.exit(0)})});
/* حفظ إضافي إلى GitHub كل 10 دقائق إذا تغيّرت البيانات */
{let lastM=-1;setInterval(()=>{if(MUT!==lastM&&!dbEmpty()){lastM=MUT;bkGh('',bkBuf())}},6e5).unref()}
const nph=x=>{let p=String(x||'').replace(/\D/g,'');if(p.startsWith('00'))p=p.slice(2);if(p.startsWith('0'))p='964'+p.slice(1);return/^\d{10,15}$/.test(p)?p:''};
/* إرسال رمز واتساب. يكفي WA_API_KEY وحده (افتراضياً WaSender API)، أو حدّد WA_API_URL لمزوّد آخر */
async function sendWA(p,c){const m='رمز دخولك إلى تكسي المتميز: '+c+'\nلا تشارك هذا الرمز مع أي شخص.',U=WAU||(WAK?'https://www.wasenderapi.com/api/send-message':'');
 if(!U){console.log('[OTP] لا يوجد WA_API_KEY — الرمز لم يُرسل:',p,c);return 0}
 const d=String(p).replace(/\D/g,''),to='+'+d;
 try{const r=await fetch(U,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',Authorization:'Bearer '+WAK,apikey:WAK,'x-api-key':WAK},body:JSON.stringify({to,number:d,phone:d,message:m,text:m}),signal:AbortSignal.timeout(15000)});const t=await r.text().catch(()=>'');
  if(!r.ok||/"success"\s*:\s*false|"status"\s*:\s*"?(error|failed)/i.test(t)){console.error('[WA] فشل الإرسال',r.status,t.slice(0,300));return 0}console.log('[WA] أُرسل الرمز إلى',to.slice(0,6)+'****');return 1}catch(e){console.error('[WA] خطأ اتصال',e.message);return 0}}

// ---- حماية الأجهزة / VPN / الوقت ----
const HOPS=process.env.TRUST_PROXY_HOPS==null?1:Math.max(0,+process.env.TRUST_PROXY_HOPS||0),PCK=process.env.PROXYCHECK_KEY||'',DEVTTL=30*864e5;
const cip=q=>{const cf=String(q.headers['cf-connecting-ip']||'').trim();if(cf&&process.env.TRUST_PROXY_HOPS==null)return cf.replace(/^::ffff:/,'').slice(0,60);const a=String(q.headers['x-forwarded-for']||'').split(',').map(x=>x.trim()).filter(Boolean);const ip=(HOPS&&a.length)?a[Math.max(0,a.length-HOPS)]:(q.socket.remoteAddress||'');return String(ip).replace(/^::ffff:/,'').slice(0,60)};
const cdev=x=>/^[\w-]{16,64}$/.test(String(x||''))?String(x):'';
const priv=ip=>!ip||/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|169\.254\.|::1$|fc|fd|fe80)/i.test(ip);
const IPC=new Map();
function ipinfo(ip){if(priv(ip))return Promise.resolve({vpn:0,priv:1});const n=Date.now(),e=IPC.get(ip);if(e&&n-e.t<(e.r&&!(e.v&&e.v.vpn)?216e5:12e4))return e.p;
 const e2={t:n,r:0,v:null};e2.p=(async()=>{let v;try{
  if(PCK){const x=await fetch('https://proxycheck.io/v2/'+encodeURIComponent(ip)+'?key='+encodeURIComponent(PCK)+'&vpn=1&asn=1',{signal:AbortSignal.timeout(4000)}).then(r=>r.json()),o=x[ip]||{};if(x.status=='error')throw 0;v={vpn:o.proxy=='yes'?1:0,cn:o.isocode||'',city:o.city||'',isp:String(o.provider||'').slice(0,60),tz:o.timezone||''};}
  else{const x=await fetch('http://ip-api.com/json/'+encodeURIComponent(ip)+'?fields=status,countryCode,city,isp,timezone,proxy,hosting,mobile',{signal:AbortSignal.timeout(4000)}).then(r=>r.json());if(x.status!='success')throw 0;v={vpn:((x.proxy||x.hosting)&&!x.mobile)?1:0,mob:x.mobile?1:0,cn:x.countryCode||'',city:x.city||'',isp:String(x.isp||'').slice(0,60),tz:x.timezone||''}}
  e2.r=1}catch(err){v={vpn:0,err:1}}
  e2.v=v;return v})();IPC.set(ip,e2);return e2.p}
setInterval(()=>{if(IPC.size>5000)IPC.clear()},36e5).unref();
const MSG={vpn:'تم اكتشاف VPN أو بروكسي. أوقفه ثم أعد المحاولة.',time:'وقت جهازك غير صحيح. فعّل «التاريخ والوقت التلقائي» من إعدادات الهاتف ثم أعد فتح التطبيق.'};
const gTime=h=>{const c=db.cfg;if(c.timeGuard===0)return null;const t=+h['x-ct'];return(!(t>0)||Math.abs(Date.now()-t)>Math.max(1,+c.timeTol||3)*6e4)?{c:'time',e:MSG.time}:null};
const gVpn=h=>{if(db.cfg.vpnBlock===0)return null;const ip=h['x-ip'],x=IPC.get(ip);if(x&&x.v&&!x.v.err){const v=x.v,al=String(VAR('allowCn','IQ')||'').toUpperCase().split(/[\s,]+/).filter(Boolean),off=al.includes('OFF'),geo=!off&&al.length&&v.cn&&!v.mob&&!al.includes(String(v.cn).toUpperCase());if(v.vpn||geo)return{c:'vpn',e:MSG.vpn,ip,cn:v.cn||'',why:v.vpn?'proxy':'country'}}if(!x||(!x.r&&Date.now()-x.t>=6e4)||(x.r&&Date.now()-x.t>=(x.v&&x.v.vpn?12e4:216e5)))ipinfo(ip);return null};
/* ---- حماية من التلاعب: إلغاء الطلب بعد الموافقة عليه (تحذير ثم إيقاف مؤقت) — الأرقام من لوحة التحكم ---- */
const abK=()=>{const c=db.cfg,w=Math.min(50,Math.max(1,Math.round(+c.abWarn)||4));return{on:c.abOn!==0,w,b:Math.min(100,Math.max(w,Math.round(+c.abBan)||6)),days:Math.min(365,Math.max(1,Math.round(+c.abDays)||3)),win:Math.min(365,Math.max(0,Math.round(+c.abWin)||0)),gr:Math.min(600,Math.max(0,Math.round(+c.abGrace)||0))}};
const abAct=c=>{const K=abK(),n=Date.now(),w=K.win*864e5;return(c&&c.ab||[]).filter(t=>!w||n-t<w).length};
const abInfo=i=>{const c=db.customers[i],K=abK();return c&&K.on?{n:abAct(c),w:K.w,b:K.b,d:K.days}:0};
function abNew(cid){const c=db.customers[cid],K=abK();if(!c||!K.on)return;const now=Date.now(),w=K.win*864e5;c.ab=(c.ab||[]).filter(t=>!w||now-t<w);c.ab.push(now);if(c.ab.length>200)c.ab=c.ab.slice(-200);
 if(c.ab.length>=K.b){const until=now+K.days*864e5;c.ban={at:now,until,n:c.ab.length};c.ab=[];db.banDev=db.banDev||{};for(const d of Object.keys(c.devs||{}))db.banDev[d]=until;audit({'x-role':'system','x-id':cid},'ab-ban',cid,K.days)}CV++}
const abTxt=u=>{const t=Math.max(0,Math.ceil((u-Date.now())/36e5)),d=Math.floor(t/24),h=t%24;return(d?d+' يوم':'')+(d&&h?' و':'')+(h?h+' ساعة':'')||'أقل من ساعة'};
const gBan=h=>{if(h['x-role']!='customer')return null;const c=h['x-id']&&db.customers[h['x-id']],n=Date.now(),d=cdev(h['x-dev']);let u=c&&c.ban&&c.ban.until>n?c.ban.until:0;if(!u&&d&&db.banDev&&db.banDev[d]>n)u=db.banDev[d];
 return u?{c:'ban',e:'تم إيقاف حسابك مؤقتًا بسبب تكرار إلغاء الطلبات بعد الموافقة عليها. يتبقى على انتهاء الإيقاف: '+abTxt(u)+'. للاستفسار تواصل مع الدعم.',until:u}:null};
const guard=h=>{const r=h['x-role'];return(r=='customer'||r=='driver')?(gTime(h)||gVpn(h)||gBan(h)):null};
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
const W={customer:['orders','rides','tickets','apps','cardorders','ctop','chat','lreqs'],driver:['orders','rides','drivers','topups','wd','lines','lreqs'],rest:['rests','orders'],support:['orders','rides','tickets','drivers','apps','cardorders','topups','wd','ctop','chat'],admin:['chat','vars','cdev','rests','orders','rides','drivers','tickets','staff','cfg','offers','cards','apps','cardorders','topups','wd','wallet','incw','ctop','cwallet','exp','lines','lreqs']};
const LK={},RL={};
const lk=(k,f)=>{const n=Date.now(),e=LK[k]||(LK[k]={n:0,t:n});if(n-e.t>6e5){e.n=0;e.t=n}if(f===1)e.n++;else if(f===0)e.n=0;return e.n>=10};
const eq=(a,b)=>{if(a==null||b==null||a===''||b==='')return false;a=Buffer.from(String(a));b=Buffer.from(String(b));return a.length==b.length&&cr.timingSafeEqual(a,b)};
const rl=h=>{const k=h['x-role']+'|'+(h['x-id']||h['x-ip']),n=Date.now(),e=RL[k]||(RL[k]={n:0,t:n});if(n-e.t>6e4){e.n=0;e.t=n}return ++e.n>Math.max(20,+VAR('rlPerMin',240)||240)};
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
// ---- فهارس تُحدَّث تدريجيًا: كل سجل يتغيّر يُعاد فهرسته وحده (O(1)) بدل إعادة بناء كل شيء ----
const mp=()=>Object.create(null);
const IXS={orders:{co:'cid',do:'did',ro:'rid'},rides:{cr:'cid',dr:'did'},tickets:{ct:'cid'},chat:{ch:'cid'},apps:{ca:'cid'},cardorders:{cc:'cid'},ctop:{cp:'cid'},ctx:{cx:'cid'},topups:{dt:'did'},tx:{dx:'did'},wd:{dw:'did'},incw:{di:'did'},lines:{ln:'did'},lreqs:{cl:'cid',dl:'did'}};
const IXM_=['co','do','ro','cr','dr','ct','ch','ca','cc','cp','cx','dt','dx','dw','di','ln','cl','dl'];
let IX=null,IXF=1,CV=0;
function ixNew(){const I={rv:mp(),pO:mp(),pR:mp(),pend:mp(),busy:mp()};for(const m of IXM_)I[m]=mp();return I}
function ixAdd(I,c,id,o){const rv=[],sp=IXS[c];
 for(const m in sp){const k=o[sp[m]];if(k==null||k==='')continue;(I[m][k]||(I[m][k]=mp()))[id]=o;rv.push(m,k)}
 if(c=='orders'){if(!o.did){if(o.st==2){I.pO[id]=o;rv.push('pO',id)}if((o.st==2||(o.st==1&&o.pt))&&o.rloc){I.pend['o'+id]=[o,'orders',o.rloc,id];rv.push('pend','o'+id)}}else if(o.st>=0&&o.st<4){I.busy[o.did]=(I.busy[o.did]||0)+1;rv.push('busy',o.did)}}
 else if(c=='rides'){if(!o.did){if(o.st==0){I.pR[id]=o;rv.push('pR',id);if(o.from){I.pend['r'+id]=[o,'rides',o.from,id];rv.push('pend','r'+id)}}}else if(o.st>=0&&o.st<4){I.busy[o.did]=(I.busy[o.did]||0)+1;rv.push('busy',o.did)}}
 I.rv[c+'|'+id]=rv}
function ixRem(I,c,id){const key=c+'|'+id,rv=I.rv[key];if(!rv)return;delete I.rv[key];
 for(let i=0;i<rv.length;i+=2){const m=rv[i],k=rv[i+1];if(m=='pO'||m=='pR'||m=='pend')delete I[m][k];else if(m=='busy'){if(--I.busy[k]<=0)delete I.busy[k]}else{const b=I[m][k];if(b){delete b[id];let e=1;for(const _ in b){e=0;break}if(e)delete I[m][k]}}}}
function ixBuild(){const I=ixNew();for(const c in IXS){const col=db[c];if(col)for(const id in col)ixAdd(I,c,id,col[id])}return I}
const ix=()=>{if(!IX||IXF){IX=ixBuild();IXF=0}return IX};
const touch=(c,id)=>{if(IX&&!IXF&&IXS[c]){ixRem(IX,c,id);const o=db[c]&&db[c][id];if(o)ixAdd(IX,c,id,o)}};
setInterval(()=>{IXF=1},12e4).unref(); // شبكة أمان: إعادة بناء كاملة كل دقيقتين
// وضع تحقق (IX_VERIFY=1): يقارن الفهرس التدريجي بفهرس جديد بعد كل عملية ويصلّح نفسه
function ixCheck(tag){if(!IX||IXF)return;const J=ixBuild(),sg=I=>{const o=[];for(const m of IXM_)for(const k in I[m])o.push(m+':'+k+'='+Object.keys(I[m][k]).sort().join(','));for(const m of ['pO','pR','pend'])o.push(m+'='+Object.keys(I[m]).sort().join(','));o.push('busy='+Object.keys(I.busy).sort().map(k=>k+':'+I.busy[k]).join(','));return o.sort()},a=sg(IX),b=sg(J);
 if(a.length!=b.length||a.some((x,i)=>x!==b[i])){const sa=new Set(a),sb=new Set(b);console.error('[IX MISMATCH]',tag,'extra:',a.filter(x=>!sb.has(x)).slice(0,3),'missing:',b.filter(x=>!sa.has(x)).slice(0,3));IXF=1}}
const FR={v:-1},frag=(k,f)=>{if(FR.v!==CV){for(const x in FR)delete FR[x];FR.v=CV}return FR[k]!==undefined?FR[k]:(FR[k]=f())};
const E0={};
function custParts(i,I){const orders=I.co[i]||E0,rides=I.cr[i]||E0;
 const ids=new Set(),live=new Set();for(const k in orders){const o=orders[k],d=o.did;if(d&&db.drivers[d]){ids.add(d);if(o.st>=0&&o.st<4)live.add(d)}}for(const k in rides){const o=rides[k],d=o.did;if(d&&db.drivers[d]){ids.add(d);if(o.st>=0&&o.st<4)live.add(d)}}
 const drivers={};for(const d of ids){const x=db.drivers[d];drivers[d]={id:d,n:x.n,ph:x.ph,car:x.car,plate:x.plate,color:x.color,img:x.img,loc:live.has(d)?x.loc:undefined,hd:live.has(d)?x.hd:undefined}}
 return{orders,rides,tickets:I.ct[i]||E0,chat:I.ch[i]||E0,apps:I.ca[i]||E0,cardorders:clean(I.cc[i]||E0,['cost','by']),me:{bal:(db.customers[i]||{}).bal||0,ab:abInfo(i),cx:CXC(),po:myOff(i),wl:db.cfg.wOn===0?{t:0,f:0}:wlOf(db.customers[i],i)},ctop:I.cp[i]||E0,ctx:I.cx[i]||E0,lreqs:I.cl[i]||E0,drivers}}
const rsOf=I=>frag('rs',()=>clean(db.rests,['pin']));
const chatV=()=>Object.fromEntries(Object.values(db.chat||{}).sort((a,b)=>b.at-a.at).slice(0,200).map(t=>[t.id,{...t,msgs:(t.msgs||[]).slice(-60)}]));
function view(h){const r=h['x-role'],i=h['x-id'],I=ix();
 if(r=='admin')return{...db,codes:codeSum(),chat:chatV()};
 if(r=='support')return{...db,customers:clean(db.customers,['devs','sess','att']),rests:rsOf(I),drivers:clean(db.drivers,['pin','tfa','tfaP','tl']),staff:{},exp:{},codes:{},chat:chatV(),cards:clean(db.cards,['cost','v']),cardorders:clean(db.cardorders,['cost']),vars:PV()};
 if(r=='rest'){const os=I.ro[i]||E0,ids=[...new Set(Object.values(os).map(v=>v.did).filter(d=>d&&db.drivers[d]))];return{cfg:pubc(db.cfg),rests:{[i]:db.rests[i]},orders:os,drivers:Object.fromEntries(ids.map(d=>{const x=db.drivers[d];return[d,{id:d,n:x.n,ph:x.ph,car:x.car,loc:x.loc,locAt:x.locAt}]}))}}
 if(r=='driver'){const me=db.drivers[i],dm=me?(()=>{const x={...me};['pin','tfa','tfaP','tl'].forEach(f=>delete x[f]);x.tfaOn=me.tfa?1:0;return x})():undefined;
  return{lsug:lsOpen(),cfg:{...db.cfg,vars:PV()},topups:I.dt[i]||E0,tx:I.dx[i]||E0,wd:I.dw[i]||E0,incw:I.di[i]||E0,rests:rsOf(I),orders:clean({...(I.do[i]||E0),...I.pO},['rnote']),rides:clean({...(I.dr[i]||E0),...I.pR},['rnote']),lines:I.ln[i]||E0,lreqs:I.dl[i]||E0,drivers:{[i]:dm}}}
 return{cfg:pubc(db.cfg),rests:rsOf(I),...custParts(i,I),lines:frag('flo',()=>linesPub()),lsug:lsMine(i),offers:pubOff(),cards:JSON.parse(cardsPub())}}
// نسخة JSON جاهزة: الأجزاء المشتركة (إعدادات/مطاعم/عروض) تُحوَّل لنص مرة واحدة لكل تغيير
function viewJSON(h){const R=h['x-role'];
 if(R=='driver'){const I=ix(),i=h['x-id'],me=db.drivers[i],J=JSON.stringify;if(!me)return J(view(h));const dm={...me};['pin','tfa','tfaP','tl'].forEach(f=>delete dm[f]);dm.tfaOn=me.tfa?1:0;
  return'{"cfg":'+frag('dc',()=>J({...db.cfg,vars:PV()}))+',"topups":'+J(I.dt[i]||E0)+',"tx":'+J(I.dx[i]||E0)+',"wd":'+J(I.dw[i]||E0)+',"incw":'+J(I.di[i]||E0)+',"rests":'+frag('fr',()=>J(rsOf(I)))+',"orders":'+J(clean({...(I.do[i]||E0),...I.pO},['rnote']))+',"rides":'+J(clean({...(I.dr[i]||E0),...I.pR},['rnote']))+',"lsug":'+J(lsOpen())+',"lines":'+J(I.ln[i]||E0)+',"lreqs":'+J(I.dl[i]||E0)+',"drivers":{'+J(i)+':'+J(dm)+'}}'}
 if(R!='customer')return JSON.stringify(view(h));
 const I=ix(),p=custParts(h['x-id'],I),J=JSON.stringify;
 return'{"cfg":'+frag('fc',()=>J(pubc(db.cfg)))+',"rests":'+frag('fr',()=>J(rsOf(I)))+',"orders":'+J(p.orders)+',"rides":'+J(p.rides)+',"tickets":'+J(p.tickets)+',"chat":'+J(p.chat)+',"offers":'+frag('fo',()=>J(pubOff()))+',"cards":'+cardsPub()+',"apps":'+J(p.apps)+',"cardorders":'+J(p.cardorders)+',"me":'+J(p.me)+',"ctop":'+J(p.ctop)+',"ctx":'+J(p.ctx)+',"lsug":'+J(lsMine(h['x-id']))+',"lines":'+frag('fl',()=>J(linesPub()))+',"lreqs":'+J(p.lreqs)+',"drivers":'+J(p.drivers)+'}'}
const VC=new Map();setInterval(()=>{for(const[k,e]of VC)if(e.m!==MUT)VC.delete(k)},3e4).unref();
const inm=(q,t)=>String(q.headers['if-none-match']||'').split(',').some(x=>x.trim().replace(/^W\//,'')===t);
function sendView(q,s){const h=q.headers,key=h['x-role']+'|'+(h['x-id']||''),now=Date.now();let e=VC.get(key);
 if(!e||e.m!==MUT||now-e.t>3e3){const body=viewJSON(h);e={m:MUT,t:now,body,etag:'"'+cr.createHash('md5').update(body).digest('hex').slice(0,20)+'"',gz:null};VC.set(key,e);if(VC.size>2e4)VC.clear()}
 const H={'Content-Type':'application/json','ETag':e.etag,'Cache-Control':'no-cache','Vary':'X-Role, X-Id, Accept-Encoding','X-Content-Type-Options':'nosniff'};
 if(inm(q,e.etag)){s.writeHead(304,H);return s.end()}
 if(e.body.length>1024&&/\bgzip\b/.test(h['accept-encoding']||'')){(e.gz||(e.gz=new Promise(r=>ZL.gzip(e.body,{level:4},(er,b)=>r(er?null:b))))).then(b=>{if(!b){s.writeHead(200,H);return s.end(e.body)}H['Content-Encoding']='gzip';H['Content-Length']=b.length;s.writeHead(200,H);s.end(b)});return}
 H['Content-Length']=Buffer.byteLength(e.body);s.writeHead(200,H);s.end(e.body)}
function credit(d,a,why){const x=db.drivers[d];if(!x)return;x.bal=(x.bal||0)+a;if(x.bal<=db.cfg.minBal)x.on=0;const t='t'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);db.tx[t]={id:t,did:d,amt:a,why,bal:x.bal,at:Date.now()};touch('tx',t)}
const CXC=()=>({sec:Math.max(0,+(db.cfg.cxSec??100)),fee:Math.max(0,Math.round(+(db.cfg.cxFee??1000))),on:db.cfg.cxFeeOn===0?0:1});
function ccredit(c,a,why){const x=db.customers[c];if(!x||!a)return 0;x.bal=(x.bal||0)+a;const t='x'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);db.ctx[t]={id:t,cid:c,amt:a,why,bal:x.bal,at:Date.now()};touch('ctx',t);return 1}
const tripsOf=(d,n)=>{const f=+n.from||0,t=+n.to||9e15,k=n.kind||'all',g=o=>o.did==d&&o.st==4&&o.at>=f&&o.at<=t;return(k!='food'?Object.values(db.rides).filter(g).length:0)+(k!='taxi'?Object.values(db.orders).filter(g).length:0)};
const pvOf=c=>!!c&&(c.pv===1||(String(c.id||'')[0]=='c'&&!!c.ph&&c.ver!==0));
function proState(c){const p=c&&c.pro;if(!p)return null;const now=Date.now();if((p.st=='trial'||p.st=='active')&&p.end<=now){const pr=+VAR('proPrice',5000)||0;if(p.auto&&pr>0&&(c.bal||0)>=pr){ccredit(c.id,-pr,'تجديد اشتراك برو');p.st='active';p.start=now;p.end=now+30*864e5;p.left=+VAR('proTrips',5)||5}else p.st='expired';save()}return p}
const proOn=c=>{const p=proState(c);return !!p&&(p.st=='trial'||p.st=='active')&&p.end>Date.now()};
function proView(c){const p=proState(c);return{st:p?p.st:'none',end:p?p.end:0,left:p&&p.left>0?p.left:0,auto:p&&p.auto?1:0,used:p&&p.used?1:0,price:+VAR('proPrice',5000)||0,days:+VAR('proTrialDays',14)||14,taxi:+VAR('proTaxi',1000)||0,trips:+VAR('proTrips',5)||5}}
const autoOff=x=>x&&x.on!==0&&!x.code&&(!x.cat||x.cat=='food');
const HM=new Map();
function hasH(i){const t=HM.get(i);if(t&&Date.now()-t[1]<60000)return t[0];let h=false;for(const k in db.rides){const o=db.rides[k];if(o.cid==i&&o.st==4){h=true;break}}if(!h)for(const k in db.orders){const o=db.orders[k];if(o.cid==i&&o.st==4){h=true;break}}HM.set(i,[h,Date.now()]);return h}
function wlOf(c,i){if(!c)return{t:0,f:0};if(!c.wl){const h=hasH(i);c.wl=h||db.cfg.wOn===0?{t:0,f:0}:{t:+db.cfg.wTaxiN>=0?+db.cfg.wTaxiN:3,f:+db.cfg.wFoodN>=0?+db.cfg.wFoodN:4}}return c.wl}
const wFreeF=cid=>db.cfg.wOn!==0&&wlOf(db.customers[cid],cid).f>0;
const offOk=(o,i)=>o.on!==0&&(!o.uid||o.uid==i)&&(o.aud=='new'?!hasH(i):o.aud=='old'?hasH(i):true);
const pubOff=()=>Object.fromEntries(Object.entries(db.offers||{}).filter(([k,o])=>!o.uid&&(!o.aud||o.aud=='all')));
const myOff=i=>Object.fromEntries(Object.entries(db.offers||{}).filter(([k,o])=>(o.uid||(o.aud&&o.aud!='all'))&&offOk(o,i)));
function perks(o){o.cb=1;const c=db.customers[o.cid];if(!c)return;let amt=0,why=[];
 if(proOn(c)&&c.pro.left>0){const d=+VAR('proTaxi',1000)||0;if(d){amt+=d;c.pro.left--;why.push('برو')}}
 const code=String(o.promo||'').trim().toLowerCase();if(code){const of=Object.values(db.offers||{}).find(x=>x.on!==0&&x.cat=='taxi'&&String(x.code||'').trim().toLowerCase()==code&&offOk(x,o.cid));if(of){const u=c.pu||(c.pu={}),n=u[of.id]||0,T=String(of.tiers||'').split(',').map(t=>t.split(':').map(Number)).filter(t=>t[0]>0),tr=T.length?T[n]:(n<(+of.n||1)?[+of.pct||0,+of.max||0]:null);if(tr&&tr[0]>0){let d=Math.round((o.fare||0)*tr[0]/100);if(tr[1]>0)d=Math.min(d,tr[1]);if(d>0){amt+=d;u[of.id]=n+1;why.push('كود '+of.code)}}}}
 if(db.cfg.wOn!==0&&!why.some(x=>x.startsWith('كود'))){const wl=wlOf(c,o.cid);if(wl.t>0){const pc=+db.cfg.wTaxiPct>=0?+db.cfg.wTaxiPct:30;let d=Math.round((o.fare||0)*pc/100);if(+db.cfg.wTaxiMax>0)d=Math.min(d,+db.cfg.wTaxiMax);if(d>0){amt+=d;wl.t--;why.push('ترحيب '+pc+'%')}}}
 if(amt>0){o.cbAmt=amt;ccredit(o.cid,amt,'خصم '+why.join(' + ')+' — رحلة '+o.id)}save()}
function charge(k,o){const c=db.cfg;o.chg=1;
 if(k=='orders'&&o.ret){const r=db.rests[o.rid],sb=(o.its||[]).reduce((s,i)=>s+i.q*i.p,0),rp=+((r&&r.pct!=null&&r.pct!=='')?r.pct:c.restPct)||0;o.rpct=rp;o.rcom=0;o.owed=(o.fee||0)+Math.round(sb*rp/100);if(o.paid&&!o.refd){o.refd=1;ccredit(o.cid,o.tot||0,'استرجاع طلب راجع '+o.id)}if(o.did){if(o.fee)credit(o.did,o.fee,'أجرة توصيل طلب راجع '+o.id);o.com=Math.round((o.fee||0)*c.appPct/100);if(o.com)credit(o.did,-o.com,'عمولة طلب راجع '+o.id)}return}if(o.paid&&o.did&&!o.dpd){o.dpd=1;credit(o.did,k=='orders'?(o.tot||0):(o.fare||0),'دفع بالمحفظة '+o.id)}if(k=='orders'){o.com=Math.round((o.fee||0)*c.appPct/100);const r=db.rests[o.rid],sb=(o.its||[]).reduce((s,i)=>s+i.q*i.p,0);const rp=+((r&&r.pct!=null&&r.pct!=='')?r.pct:c.restPct)||0;o.rpct=rp;o.rcom=Math.round(sb*rp/100)}else o.com=Math.round((o.fare||0)*c.taxiPct/100);if(o.com)credit(o.did,-o.com,(k=='orders'?'عمولة طلب ':'عمولة رحلة ')+o.id)}
const okImg=s=>typeof s=='string'&&(s===''||/^\/u\/[a-f0-9]{32}\.\w+$/.test(s)||(/^data:image\/(jpeg|png|webp);base64,/.test(s)&&s.length<4e5));
const cleanItems=a=>{if(!Array.isArray(a)||a.length>1000)return null;const ids=new Set(),o=[],tm=t=>/^\d{2}:\d{2}$/.test(String(t||''))?t:'';for(const x of a){if(!x||typeof x!='object')return null;const id=String(x.id||'').slice(0,40),p=Math.round(+x.p),n=String(x.n||'').trim();if(!id||ids.has(id)||!n||!(p>=0)||p>1e8)return null;ids.add(id);const im=String(x.img||'');o.push({id,n:n.slice(0,80),p,d:String(x.d||'').slice(0,500),cat:String(x.cat||'').trim().slice(0,60),f:tm(x.f),t:tm(x.t),off:x.off?1:0,pu:+x.pu>0?+x.pu:0,img:/^\/u\/[a-f0-9]{32}\.\w+$/.test(im)||(/^data:image\/(jpeg|png|webp);base64,/.test(im)&&im.length<4e5)?im:''})}return o};
const num=x=>Number.isFinite(+x)?+x:0,S=(x,n)=>String(x==null?'':x).slice(0,n),pt=p=>{p=p||{};const a=+p.lat,g=+p.lng;return p.lat!=null&&Number.isFinite(a)&&Number.isFinite(g)&&Math.abs(a)<=90&&Math.abs(g)<=180?{lat:a,lng:g}:null};
function cust(k,v,nw){const c=db.cfg,o={cid:v.cid};if(nw){o.st=0;o.at=Date.now()}
 if(k=='orders'){const R=db.rests[v.rid],loc=pt(v.loc);if(!R||!loc||!Array.isArray(v.its)||!v.its.length||v.its.length>60)return null;const its=[];for(const x of v.its){const it=(R.items||[]).find(y=>y.n==(x&&x.n));if(!it)return null;if(it.off||it.pu>Date.now())return null;{const cz=(R.cs||{})[it.cat||''];if(cz&&(cz.off||cz.pu>Date.now()))return null}its.push({n:it.n,q:Math.min(99,Math.max(1,(+x.q)|0)),p:it.p})}
  const sb=its.reduce((a,x)=>a+x.q*x.p,0),mp=Math.max(0,...Object.values(db.offers||{}).filter(x=>autoOff(x)&&(!x.rid||x.rid==v.rid)).map(x=>+x.pct||0)),pf=proOn(db.customers[v.cid])&&R.pro?1:0,wf=nw&&!R.fd&&!pf&&wFreeF(v.cid)?1:0,fee=(R.fd||pf||wf)?0:PRC.deliveryFee(pt(R.loc)?hv(R.loc,loc)*1.3:0,c),dsc=Math.round(sb*mp/100);
  if(wf){db.customers[v.cid].wl.f--;o.wf=1}Object.assign(o,{pf,rid:S(v.rid,40),rn:S(R.n,80),rloc:pt(R.loc),its,fee,disc:dsc,tot:sb-dsc+fee,cn:S(v.cn,60),cp:S(v.cp,30),loc,note:S(v.note,300),pay:S(v.pay,10)});return o}
 if(k=='rides'){const f=pt(v.from),t=pt(v.to),rt=(c.rt||[]).find(x=>x.id==v.rt);if(!f||!t||!rt)return null;const kf=hv(f,t)*.95,fl=Math.max(c.min,PRC.rideFare(kf,kf*.5,c,rt.m||1,false));
  Object.assign(o,{cn:S(v.cn,60),cp:S(v.cp,30),from:f,to:t,fa:S(v.fa,120),ta:S(v.ta,120),km:Math.min(500,Math.max(0,num(v.km))),min:Math.min(1440,Math.max(0,num(v.min))),fare:Math.min(5e6,Math.max(fl,Math.round(num(v.fare)))),rt:rt.id,rtn:rt.n,rg:rt.g,note:S(v.note,300),promo:S(v.promo,30),pay:S(v.pay,10),stop:pt(v.stop),sn:S(v.stop&&v.stop.n,80),d2:pt(v.d2),dn2:S(v.d2&&v.d2.n,80),rt2:v.rt2?1:0});return o}
 if(k=='cardorders'){const cd=db.cards[v.card];if(!cd)return null;Object.assign(o,{cn:S(v.cn,60),cp:S(v.cp,30),card:S(v.card,40),cn2:S(cd.n,80),pay:S(v.pay,10)});return o}
 if(k=='tickets'){Object.assign(o,{cn:S(v.cn,60),cp:S(v.cp,30),oid:S(v.oid,40),msg:S(v.msg,1000)});return o}
 if(k=='apps'){const dc={};Object.entries(v.docs&&typeof v.docs=='object'?v.docs:{}).slice(0,12).forEach(([a,b])=>{if(/^\/u\/[a-f0-9]{32}\.\w+$/.test(String(b)))dc[S(a,20)]=b});Object.assign(o,{type:S(v.type,20),n:S(v.n,60),ph:S(v.ph,30),city:S(v.city,60),car:S(v.car,60),plate:S(v.plate,30),docs:dc});return o}
 return null}
/* ===== مصاريف/إيرادات يدوية متكررة شهريًا (إيجار، رواتب، اشتراكات سيرفرات) ===== */
function nextMonth(ts){const d=new Date(ts),day=Math.min(d.getDate(),28),n=new Date(d.getFullYear(),d.getMonth()+1,day,d.getHours(),d.getMinutes(),d.getSeconds());return +n}
function runRecurring(now){now=now||Date.now();let made=0;db.exp=db.exp||{};
 for(const e of Object.values(db.exp)){if(!e.rec||e.src||!e.nx)continue;let g=0;
  while(e.nx<=now&&g++<24){const id='r'+e.id.slice(0,20)+'_'+e.nx.toString(36);if(!db.exp[id]){db.exp[id]={id,t:e.t,cat:e.cat,amt:e.amt,n:e.n,at:e.nx,by:'auto',cr:now,src:e.id};made++}e.nx=nextMonth(e.nx)}}
 return made}
setInterval(()=>{if(runRecurring()){save();bump()}},36e5).unref();
setTimeout(()=>{if(runRecurring()){save();bump()}},3e3).unref();
/* ===== مخزون الأكواد التسلسلية (بطاقات / ألعاب / كروت شحن) + التسليم الفوري + الاسترداد ===== */
const ckey=x=>String(x==null?'':x).toUpperCase().replace(/[\s-]/g,'');
let CKS=null;
function ckSet(){if(!CKS){CKS=new Set();for(const c of Object.values(db.codes||{})){for(const x of c.a||[])CKS.add(ckey(x));for(const x of c.s||[])CKS.add(ckey(x.c))}}return CKS}
const cbox=id=>{db.codes=db.codes||{};return db.codes[id]||(db.codes[id]={a:[],s:[]})};
const stockOf=id=>{const c=db.codes&&db.codes[id];return c&&c.a?c.a.length:0};
function codeSum(){const o={};for(const k in db.codes||{}){const c=db.codes[k];o[k]={a:(c.a||[]).length,s:(c.s||[]).length}}return o}
function cardsPub(){return frag('fkp',()=>JSON.stringify(Object.fromEntries(Object.entries(db.cards||{}).filter(([k,c])=>c.kind!='wallet'&&c.kind!='cap').map(([k,c])=>{const x={...c};delete x.cost;delete x.v;if(c.auto)x.stock=stockOf(k);return[k,x]}))))}
function takeCode(id,meta){const c=db.codes&&db.codes[id];if(!c||!c.a||!c.a.length)return null;const code=c.a.shift();c.s.push({c:code,...meta,at:Date.now()});CV++;return code}
function deliver(v,id,cid,cc){const code=takeCode(cc.id,{cid,oid:id});v.code=code;v.st=1;v.dat=Date.now();v.by='auto';if(cc.cost!=null&&cc.cost!=='')v.cost=+cc.cost;return code}
const ALPH='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function genCode(g,l){let o=[];for(let i=0;i<g;i++){let p='';for(let j=0;j<l;j++)p+=ALPH[cr.randomInt(ALPH.length)];o.push(p)}return o.join('-')}
function codesOp(h,b){const cc=db.cards[String(b.card||'')];const op=b.op;
 if(op=='summary')return{ok:1,sum:codeSum()};
 if(!cc)return{e:'البطاقة غير موجودة'};const box=cbox(cc.id);
 if(op=='add'){const raw=Array.isArray(b.codes)?b.codes:String(b.text||'').split(/[\r\n,;\t]+/);if(raw.length>50000)return{e:'الحد الأقصى 50,000 كود في المرة الواحدة'};
  const S=ckSet();let add=0,dup=0,bad=0;for(let x of raw){x=String(x||'').trim().replace(/\s+/g,' ');if(!x)continue;if(x.length<3||x.length>80||/[<>"'\\`]/.test(x)){bad++;continue}const k=ckey(x);if(S.has(k)){dup++;continue}S.add(k);box.a.push(x);add++}
  if(add){audit(h,'codes-add',cc.id,add);CV++}return{ok:1,add,dup,bad,avail:box.a.length}}
 if(op=='gen'){const n=Math.min(5000,Math.max(1,Math.round(+b.n)||0)),g=Math.min(6,Math.max(1,Math.round(+b.g)||3)),l=Math.min(8,Math.max(3,Math.round(+b.l)||4)),S=ckSet(),out=[];let t=0;
  while(out.length<n&&t++<n*20){const x=genCode(g,l),k=ckey(x);if(S.has(k))continue;S.add(k);out.push(x)}box.a.push(...out);audit(h,'codes-gen',cc.id,out.length);CV++;return{ok:1,add:out.length,avail:box.a.length,codes:out.slice(0,5000)}}
 if(op=='list'){const w=b.which=='s'?'s':'a',all=!!b.all,lim=all?50000:Math.min(500,Math.max(1,+b.limit||200));const arr=box[w];return{ok:1,total:arr.length,items:w=='s'?arr.slice(-lim).reverse():arr.slice(0,lim)}}
 if(op=='del'){const k=ckey(b.code),i=box.a.findIndex(x=>ckey(x)==k);if(i<0)return{e:'الكود غير موجود في المتوفر'};box.a.splice(i,1);CKS=null;audit(h,'codes-del',cc.id,1);CV++;return{ok:1,avail:box.a.length}}
 if(op=='clear'){const n=box.a.length;box.a=[];CKS=null;audit(h,'codes-clear',cc.id,n);CV++;return{ok:1,removed:n}}
 return{e:'عملية غير معروفة'}}
function redeem(role,id,code,h){const kind=role=='customer'?'wallet':'cap',key=ckey(code);if(key.length<4)return{e:'أدخل الكود كاملًا'};
 for(const cid in db.codes||{}){const cd=db.cards[cid];if(!cd||cd.kind!=kind)continue;const box=db.codes[cid],i=box.a.findIndex(x=>ckey(x)==key);if(i<0)continue;
  const amt=Math.round(+cd.v)||0;if(!(amt>0))return{e:'الكود غير صالح'};const c=box.a.splice(i,1)[0];box.s.push({c,[role=='customer'?'cid':'did']:id,at:Date.now(),red:1,amt});CV++;
  if(role=='customer'){if(!ccredit(id,amt,'شحن بكود: '+cd.n))return{e:'تعذر الشحن'}}else{if(!db.drivers[id])return{e:'تعذر الشحن'};credit(id,amt,'شحن بكود: '+cd.n)}
  audit(h,'redeem',id,amt);return{ok:1,amt,bal:role=='customer'?db.customers[id].bal:db.drivers[id].bal}}
 return{e:'الكود غير صالح أو مستخدم'}}
/* ===== الخطوط (سيارات ستاركس 4/10/11 راكب): يسجّل كابتن الخطوط خطه وسعره، والزبون يطلب مقعداً، وصاحب الخط يوافق أو يرفض ===== */
const lineTaken=(lid,skip)=>Object.values(db.lreqs).reduce((a,x)=>a+(x.lid==lid&&x.st==1&&x.id!=skip?(x.seats||0):0),0);
const lineFree=(L,skip)=>Math.max(0,(L.seats||0)-lineTaken(L.id,skip));
const lineLive=L=>!!L&&L.on!==0&&!L.off;
function linesPub(){const o={};for(const[id,L]of Object.entries(db.lines)){if(!lineLive(L))continue;const d=db.drivers[L.did]||{};o[id]={...L,free:lineFree(L),dn:d.n||'',dimg:L.dimg||d.img||''}}return o}
function cleanLine(v,old){const n={},has=f=>f in v,tm=x=>/^\d{2}:\d{2}$/.test(String(x||''))?String(x):'';
 for(const f of ['from','to']){if(has(f)){const q=pt(v[f]);if(!q)return null;n[f]=q}else if(!old)return null}
 for(const f of ['fa','ta']){if(has(f))n[f]=S(v[f],120).trim();if(!old&&!n[f])return null}
 if(has('scope'))n.scope=v.scope=='out'?'out':'in';else if(!old)n.scope='in';
 if(has('gov'))n.gov=S(v.gov,40);
 if(has('seats')){const x=Math.round(+v.seats);if(!(x>=1&&x<=20))return null;n.seats=x}else if(!old)return null;
 if(has('price')){const x=Math.round(+v.price);if(!(x>=0)||x>5e6)return null;n.price=x}else if(!old)return null;
 if(has('t1'))n.t1=tm(v.t1);if(has('t2'))n.t2=tm(v.t2);
 if(has('days')){const a=[...new Set((Array.isArray(v.days)?v.days:[]).map(x=>Math.round(+x)).filter(x=>x>=0&&x<=6))].sort();if(!a.length)return null;n.days=a}else if(!old)return null;
 if(has('svc')){const q=v.svc||{};n.svc={ac:q.ac?1:0,heat:q.heat?1:0,net:q.net?1:0}}else if(!old)n.svc={ac:0,heat:0,net:0};
 for(const f of ['car','color','plate','year'])if(has(f))n[f]=S(v[f],f=='car'?60:30);
 for(const f of ['img','img2','dimg'])if(has(f)&&okImg(v[f]))n[f]=v[f];
 if(has('note'))n.note=S(v.note,300);
 if(has('on'))n.on=v.on?1:0;
 return n}
const lsOpen=()=>Object.values(db.lsug||{}).filter(x=>x.st==0&&Date.now()-x.at<60*864e5).sort((a,b)=>b.at-a.at).slice(0,200).map(x=>({id:x.id,fa:x.fa,ta:x.ta,tm:x.tm,seats:x.seats,days:x.days,note:x.note,at:x.at,n:x.n||1}));
const lsMine=i=>Object.fromEntries(Object.values(db.lsug||{}).filter(x=>x.cid==i).map(x=>[x.id,x]));
function setLine(h,k,id,v,old){const r=h['x-role'],i=h['x-id'];if(!/^[A-Za-z0-9_-]{1,40}$/.test(String(id)))return 0;
 if(k=='lines'){
  if(r=='admin'){if(v==null){if(!old)return 0;for(const x of Object.values(db.lreqs))if(x.lid==id&&x.st>=0&&x.st<2)x.st=-2;delete db.lines[id];CV++;audit(h,'line-del',id);return 1}
   if(!old||typeof v!='object')return 0;db.lines[id]={...old,off:v.off?1:0};CV++;audit(h,'line-off',id);return 1}
  if(r!='driver')return 0;const d=db.drivers[i];if(!d||d.type!='line'||(old&&old.did!=i))return 0;
  if(v==null){if(!old)return 0;for(const x of Object.values(db.lreqs))if(x.lid==id&&x.st>=0&&x.st<2){x.st=-2;PUSH.send('customer',x.cid,{t:'تم إيقاف الخط',b:'ألغى الكابتن الخط '+(x.ll||''),u:'/customer.html',tag:'l'+x.id})}delete db.lines[id];CV++;return 1}
  if(typeof v!='object')return 0;if(!old&&Object.values(db.lines).filter(x=>x.did==i).length>=10)return 0;
  const n=cleanLine(v,old);if(!n)return 0;const nw={...(old||{}),...n,id,did:i,at:(old&&old.at)||Date.now(),up:Date.now()};
  if(lineTaken(id)>nw.seats)return 0;db.lines[id]=nw;CV++;return 1}
 if(k=='lreqs'){
  if(r=='customer'){const c=db.customers[i];if(!c)return 0;
   if(!old){if(!v||typeof v!='object')return 0;const L=db.lines[S(v.lid,40)];if(!lineLive(L))return 0;
    const q=Math.round(+v.seats),f=pt(v.from),t=pt(v.to);if(!(q>=1&&q<=L.seats)||q>lineFree(L)||!f||!t)return 0;
    const ac=Object.values(db.lreqs).filter(x=>x.cid==i&&x.st>=0&&x.st<2);if(ac.length>=5||ac.some(x=>x.lid==L.id))return 0;
    const cn=S(v.cn||c.n||c.name,60);
    db.lreqs[id]={id,lid:L.id,did:L.did,cid:i,cn,cp:S(v.cp||c.ph||c.phone,30),seats:q,from:f,to:t,fa:S(v.fa,120),ta:S(v.ta,120),note:S(v.note,300),pimg:okImg(v.pimg)?v.pimg:'',price:L.price,tot:q*L.price,ll:S(L.fa+' ← '+L.ta,200),st:0,at:Date.now()};
    CV++;PUSH.send('driver',L.did,{t:'🚐 طلب جديد على خطك',b:(cn||'زبون')+' يطلب '+q+' مقعد',u:'/driver.html',tag:'l'+id});return 1}
   if(old.cid!=i||!v||v.st!==-1||old.st<0||old.st>1)return 0;
   db.lreqs[id]={...old,st:-1,ca:Date.now()};CV++;PUSH.send('driver',old.did,{t:'ألغى الزبون طلبه',b:(old.cn||'زبون')+' ألغى طلب المقعد',u:'/driver.html',tag:'l'+id});return 1}
  if(r=='driver'){if(!old||old.did!=i||!v||typeof v!='object')return 0;
   if(v.st===1&&old.st===0){const L=db.lines[old.lid];if(!L||old.seats>lineFree(L,id))return 0;const d=db.drivers[i]||{};
    db.lreqs[id]={...old,st:1,ok:Date.now(),dn:S(d.n,60),dph:S(d.ph,30)};CV++;PUSH.send('customer',old.cid,{t:'✅ تمت الموافقة على طلبك',b:'قبل الكابتن طلب مقعدك في '+(old.ll||'الخط'),u:'/customer.html',tag:'l'+id});return 1}
   if(v.st===2&&(old.st===0||old.st===1)){db.lreqs[id]={...old,st:2,why:S(v.why,200),no:Date.now()};CV++;PUSH.send('customer',old.cid,{t:'تعذّر قبول طلبك',b:S(v.why,100)||'اعتذر الكابتن عن الطلب',u:'/customer.html',tag:'l'+id});return 1}
   return 0}
  if(r=='admin'){if(!old||v!=null)return 0;delete db.lreqs[id];CV++;audit(h,'lreq-del',id);return 1}}
 return 0}
function set(h,b){const{k,id}=b;let v=b.v;const r=h['x-role'],i=h['x-id'];
 if(!W[r]||!W[r].includes(k)||!id)return 0;
 const old=db[k]&&db[k][id],mn=db.cfg.minBal;if(k=='lines'||k=='lreqs')return setLine(h,k,id,v,old);
 if((k=='rides'||k=='orders')&&old&&v&&'msg' in v){const me=r=='customer'&&old.cid==i?'c':r=='driver'&&old.did==i?'d':null;if(!me||!old.did||!(old.st>=1&&old.st<4))return 0;const t=String(v.msg||'').trim().slice(0,400);if(!t)return 0;if((old.cm||[]).length>=150)return 0;old.cm=(old.cm||[]).concat({f:me,t,at:Date.now()});try{PUSH&&PUSH.send&&0}catch(e){}return 1}
 if(k=='cdev'){if(r!='admin'||!v)return 0;const c=db.customers[id];if(!c)return 0;c.devs=c.devs||{};const x=c.devs[S(v.dev,64)];
  if(v.a=='reset'){Object.values(c.devs).forEach(y=>{if(!y.st)y.st=2});AU.rev[id]=Date.now();saveA();audit(h,'cdev-reset',id);return 1}
  if(v.a=='unban'){delete c.ban;c.ab=[];if(db.banDev)for(const d of Object.keys(c.devs))delete db.banDev[d];audit(h,'ab-unban',id);CV++;return 1}if(!x)return 0;if(v.a=='rm'){x.st=2;audit(h,'cdev-rm',id);return 1}if(v.a=='block'){x.st=1;audit(h,'cdev-block',id);return 1}if(v.a=='unblock'){x.st=2;audit(h,'cdev-unblock',id);return 1}return 0}
 if(k=='wallet'){const d=db.drivers[id],a=Math.round(+(v&&v.amt));if(!d||!a)return 0;credit(id,a,String((v&&v.why)||'شحن من لوحة التحكم').slice(0,100));audit(h,'wallet',id,a);return 1}
 if(k=='cwallet'){const a=Math.round(+(v&&v.amt));if(r!='admin'||!db.customers[id]||!a)return 0;audit(h,'cwallet',id,a);return ccredit(id,a,String(v.why||'شحن من لوحة التحكم').slice(0,100))}
 if(k=='incw'){if(r!='admin'||old||!v)return 0;const n=(db.cfg.inc||[]).find(x=>x.id==v.iid),d=db.drivers[v.did];if(!n||!d||id!=n.id+'_'+d.id||tripsOf(d.id,n)<n.trips)return 0;credit(d.id,+n.amt,'حافز: '+String(n.n).slice(0,60));db.incw[id]={id,iid:n.id,did:d.id,n:n.n,amt:+n.amt,trips:n.trips,at:Date.now()};return 1}
 if(r=='admin'&&k=='cards'){if(!/^[A-Za-z0-9_-]{1,40}$/.test(String(id)))return 0;
  if(v==null){if(stockOf(id)>0)return 0;if(db.codes&&db.codes[id])delete db.codes[id];CKS=null;CV++}
  else{if(typeof v!='object')return 0;const n={};
   if('n' in v){n.n=String(v.n||'').trim().slice(0,80);if(!n.n)return 0}else if(!old)return 0;
   if('p' in v){const p=Math.round(+v.p);if(!(p>=0)||p>1e9)return 0;n.p=p}else if(!old)return 0;
   if('cost' in v){if(v.cost===''||v.cost==null)n.cost='';else{const c=Math.round(+v.cost);if(!(c>=0)||c>1e9)return 0;n.cost=c}}
   ['d'].forEach(f=>{if(f in v)n[f]=String(v[f]||'').slice(0,300)});if('cat' in v)n.cat=String(v.cat||'').trim().slice(0,60);if('e' in v)n.e=String(v.e||'').slice(0,8)||'💳';
   if('kind' in v)n.kind=['card','wallet','cap'].includes(v.kind)?v.kind:'card';
   if('auto' in v)n.auto=v.auto?1:0;
   if('v' in v){const a=Math.round(+v.v);if(!(a>=0)||a>1e9)return 0;n.v=a}
   const kd=n.kind||(old&&old.kind)||'card';if(kd!='card'){n.auto=1;if(!((+(n.v!=null?n.v:old&&old.v))>0))return 0}
   if('img' in v&&okImg(v.img))n.img=v.img;v=n;CV++}}
 if(k=='exp'){if(r!='admin')return 0;db.exp=db.exp||{};
  if(!/^[A-Za-z0-9_-]{1,40}$/.test(String(id)))return 0;
  if(v==null){if(!old)return 0;audit(h,'exp-del',id,old.amt);delete db.exp[id];return 1}
  if(typeof v!='object')return 0;
  const t=v.t=='in'?'in':v.t=='out'?'out':(old&&old.t);if(!t)return 0;
  const a=Math.round(+(('amt' in v)?v.amt:old&&old.amt)*100)/100;if(!(a>0)||a>1e11)return 0;
  const cat=String(('cat' in v)?v.cat:(old&&old.cat)||'').trim().slice(0,40);if(!cat)return 0;
  let at=+(('at' in v)?v.at:(old&&old.at)||Date.now());if(!(at>=1577836800000)||at>Date.now()+864e5*366)at=Date.now();
  if(!old&&Object.keys(db.exp).length>=50000)return 0;
  const o={id,t,cat,amt:a,n:String(('n' in v)?v.n:(old&&old.n)||'').trim().slice(0,300),at,by:(old&&old.by)||'admin',cr:(old&&old.cr)||Date.now()};
  if(old&&old.src)o.src=old.src;
  const rc=('rec' in v)?(v.rec?1:0):(old&&old.rec?1:0);
  if(rc&&!o.src){o.rec=1;o.nx=(old&&old.nx&&!('at' in v))?old.nx:nextMonth(at)}
  db.exp[id]=o;if(o.rec)runRecurring();audit(h,old?'exp-edit':'exp-add',id,a);return 1}
 if(k=='ctop'){if(r=='customer'){if(old||!v||v.cid!=i||!db.customers[i])return 0;const a=Math.round(+v.amt);if(!(a>=1000)||a>5e6)return 0;const im=String(v.img||'').slice(0,200),rf=String(v.ref||'').trim().slice(0,100);if((im&&Object.values(db.ctop).some(x=>x.st>=0&&x.img==im))||(rf&&Object.values(db.ctop).some(x=>x.st>=0&&x.ref==rf)))return 0;if(Object.values(db.ctop).filter(x=>x.cid==i&&x.st==0).length>=5)return 0;db.ctop[id]={id,cid:i,amt:a,m:v.m=='zain'?'zain':'master',img:im,ref:rf,st:0,at:Date.now()};return 1}
  if(!old||!v||old.st!=0)return 0;if(v.st==1){ccredit(old.cid,old.amt,'شحن المحفظة ('+(old.m=='zain'?'زين كاش':'ماستر كارد')+')');audit(h,'ctop-ok',id,old.amt);db.ctop[id]={...old,st:1,by:r,ok:Date.now()};return 1}if(v.st==-1){db.ctop[id]={...old,st:-1,why:String(v.why||'').slice(0,200)};return 1}return 0}
 if(k=='wd'){
  if(r=='driver'){const d=db.drivers[i];if(old||!v||!d)return 0;const a=Math.round(+v.amt),ac=String(v.acc||'').trim().slice(0,60);if(!(a>=(db.cfg.minWd||25000))||a>(d.bal||0)||!ac||(db.cfg.req2fa&&!d.tfa))return 0;const mm=String(v.m||'').slice(0,40);if(!['كي كارد','زين كاش'].includes(mm))return 0;const an=String(v.an||'').trim().slice(0,80),bc=String(v.bc||'').slice(0,200);if(!an)return 0;if(Object.values(db.wd).some(x=>x.did==i&&x.st==0))return 0;db.wd[id]={id,did:i,amt:a,m:mm,acc:ac,an,bc,st:0,at:Date.now()};return 1}
  if(r!='admin'||!v)return 0;
  if(!old){const d=db.drivers[v.did],a=Math.round(+v.amt);if(!d||!(a>0)||a>(d.bal||0))return 0;credit(d.id,-a,'سحب رصيد ('+String(v.m||'').slice(0,40)+')');db.wd[id]={id,did:d.id,amt:a,m:String(v.m||'').slice(0,40),acc:String(v.acc||'').slice(0,60),st:1,by:'admin',at:Date.now(),ok:Date.now(),ref:String(v.ref||'').slice(0,100)};return 1}
  if(old.st!=0)return 0;
  if(v.st==1){const d=db.drivers[old.did];if(!d||(d.bal||0)<old.amt)return 0;credit(old.did,-old.amt,'سحب رصيد ('+(old.m||'')+')');audit(h,'wd-ok',id,old.amt);db.wd[id]={...old,st:1,by:r,ok:Date.now(),ref:String(v.ref||'').slice(0,100)};return 1}
  if(v.st==-1){db.wd[id]={...old,st:-1,why:String(v.why||'').slice(0,200)};return 1}
  return 0}
 if(k=='topups'){if(r=='driver'){if(old||!v||v.did!=i||!(+v.amt>0)||+v.amt>5e6)return 0;{const im=String(v.img||'').slice(0,200);if(im&&Object.values(db.topups).some(x=>x.st>=0&&x.img==im))return 0}v={did:i,amt:Math.round(+v.amt),m:String(v.m||'').slice(0,60),img:String(v.img||'').slice(0,200),note:String(v.note||'').slice(0,300),st:0,at:Date.now()}}else{if(!old||!v)return 0;if(v.st==1&&old.st==0){credit(old.did,old.amt,'شحن بوصل تحويل ('+(old.m||'')+')');audit(h,'topup-ok',id,old.amt);db.topups[id]={...old,st:1,by:r,ok:Date.now()};return 1}if(v.st==-1&&old.st==0){db.topups[id]={...old,st:-1,why:String(v.why||'').slice(0,200)};return 1}return 0}}
 if(k=='chat'){const now=Date.now(),str=(x,n)=>String(x==null?'':x).slice(0,n);
  if(!v||typeof v!='object')return 0;
  if(r=='customer'){if(id!='h'+i||(old&&old.cid!=i))return 0}else if(!old)return 0;
  if(v.read){if(!old)return 1;const k2=r=='customer'?'cu':'su';if((old[k2]||0)===0)return 1;db.chat[id]={...old,[k2]:0};return 1}
  const m=v.m;if(!m||typeof m!='object')return 0;
  const t=str(m.t,1000).trim(),im=/^\/u\/[a-f0-9]{32}\.\w+$/.test(String(m.img||''))?String(m.img):'';if(!t&&!im)return 0;
  const cu=db.customers[i]||{},th=old||{id,cid:i,cn:str(cu.n||v.cn,60),cp:str(cu.ph||v.cp,30),msgs:[],cu:0,su:0},c=r=='customer';
  if(c&&!old&&(!th.cn||!th.cp)){th.cn=th.cn||str(v.cn,60);th.cp=th.cp||str(v.cp,30)}
  db.chat[id]={...th,msgs:[...(th.msgs||[]),{f:c?'c':'s',t,img:im,at:now}].slice(-300),at:now,last:t||'📷 صورة',lf:c?'c':'s',su:c?(th.su||0)+1:0,cu:c?0:(th.cu||0)+1};
  return 1}
 if(r=='customer'&&(!v||v.cid!=i||(old&&old.cid!=i)||(k!='tickets'&&v.st>0)||(['apps','cardorders'].includes(k)&&old&&(k=='cardorders'||old.st!==0))))return 0;
 if(r=='customer'&&(['tickets','apps'].includes(k)||(!old&&['orders','rides','cardorders'].includes(k)))){v=cust(k,v,!old);if(!v)return 0}
 if(r=='customer'&&k=='orders'&&!old){const R=db.rests[v.rid];if(!R||!R.open||R.pu>Date.now()||R.bz==1||R.bz>Date.now())return 0}
 if(r=='customer'&&['orders','rides','cardorders'].includes(k)){
  if(!old){delete v.paid;delete v.refd;delete v.dpd;delete v.rated;delete v.rnote;delete v.did;
   if(k=='cardorders'){const c=db.cards[v.card];if(!c)return 0;v.p=c.p}
   if(k=='orders'){const R=db.rests[v.rid],sb=(v.its||[]).reduce((s,x)=>{const it=((R&&R.items)||[]).find(y=>y.n==x.n);return s+(it?it.p:+x.p||0)*Math.max(1,x.q|0)},0),mp=Math.max(0,...Object.values(db.offers||{}).filter(o=>autoOff(o)&&(!o.rid||o.rid==v.rid)).map(o=>+o.pct||0)),fl=Math.round(sb*(100-mp)/100)+((R&&R.fd)||v.pf||wFreeF(v.cid)?0:PRC.deliveryFee(0,db.cfg));if(!(v.tot>=fl))v.tot=fl}
   if(k=='rides'&&!(v.fare>=db.cfg.min))v.fare=db.cfg.min;
   const amt=k=='orders'?v.tot:k=='rides'?v.fare:v.p;
   if(k=='cardorders'){const cc=db.cards[v.card];if(!cc||cc.kind=='wallet'||cc.kind=='cap'||(cc.auto&&!stockOf(cc.id)))return 0}
   if(v.pay=='wallet'){const c=db.customers[i];if(!c||(c.bal||0)<amt)return 0;ccredit(i,-amt,(k=='orders'?'طلب طعام ':k=='rides'?'رحلة تكسي ':'شراء بطاقة ')+id);v.paid=1;if(k=='cardorders'){const cc=db.cards[v.card];if(cc&&cc.auto)deliver(v,id,i,cc)}}
   else v.pay=k=='cardorders'?(v.pay=='zain'?'zain':'master'):'cash'}
  else{const n={cid:i};if(v.st==-1&&(k=='rides'?old.st>=0&&old.st<3:old.st==0))n.st=-1;if(n.st==-1&&k=='rides')n.cr=String(v.cr||'').slice(0,60);if(n.st==-1&&k=='rides'&&old.did&&old.st>=1){const C=CXC(),ta=+old.aat||+old.t1||0;if(C.on&&C.fee>0&&ta&&Date.now()-ta>C.sec*1e3){ccredit(i,-C.fee,'غرامة إلغاء رحلة '+id);credit(old.did,C.fee,'تعويض إلغاء رحلة #'+id+' من الزبون');n.fee=C.fee}}if(k=='rides'){if(v.bd&&old.st==2&&!old.bd)n.bd=Date.now();if(v.dok&&old.st==3&&!old.dok)n.dok=Date.now();if(v.nok&&old.st==3&&!old.dok){n.req=0;n.dno=Date.now()}}if(+v.rated>0&&old.st==4&&!old.rated)n.rated=Math.min(5,Math.max(1,+v.rated|0));if('rnote' in v&&old.st==4)n.rnote=String(v.rnote||'').slice(0,300);if('tip' in v&&!old.paid)n.tip=+v.tip>0?+v.tip:0;if('fare' in v&&!old.paid&&+v.fare>=old.fare)n.fare=+v.fare;v=n}}
 if(r=='admin'&&k=='drivers'&&v&&v.tfaReset){const d=db.drivers[id];if(!d)return 0;delete d.tfa;delete d.tfaP;delete d.tl;AU.rev['d:'+id]=Date.now();saveA();audit(h,'2fa-reset',id);return 1}
 if((r=='admin'||r=='support')&&k=='orders'&&old&&v&&('its' in v)){const R=db.rests[old.rid];if(old.st<0||old.st>=4||!Array.isArray(v.its)||!v.its.length||v.its.length>60)return 0;const its=[];for(const x of v.its){const q=Math.min(99,Math.max(1,(+x.q)|0)),prev=(old.its||[]).find(y=>y.n==(x&&x.n)),it=((R&&R.items)||[]).find(y=>y.n==(x&&x.n)),p=prev?prev.p:it?it.p:null;if(p==null)return 0;its.push({n:S(x.n,80),q,p})}
 const sb=its.reduce((a,x)=>a+x.q*x.p,0),osb=(old.its||[]).reduce((a,x)=>a+x.q*x.p,0),mp=osb?(old.disc||0)/osb:0,dsc=Math.round(sb*mp),tot=Math.max(0,sb-dsc+(old.fee||0)),diff=tot-(old.tot||0);
 if(old.paid&&diff){const c=db.customers[old.cid];if(!c)return 0;if(diff>0&&(c.bal||0)<diff)return 0;ccredit(old.cid,-diff,(diff<0?'استرجاع فرق تعديل طلب ':'فرق تعديل طلب ')+id)}
 const mods=(old.mods||[]).concat([{at:Date.now(),by:r,txt:S(v.mtxt,200),diff}]).slice(-20);audit(h,'ord-edit',id,diff);v={its,disc:dsc,tot,mods,edt:Date.now()}}
if(r=='admin'&&k=='rests'&&v){v={...v};if('items' in v){v.items=cleanItems(v.items);if(!v.items)return 0}if('pct' in v)v.pct=(v.pct===''||v.pct==null)?'':Math.min(100,Math.max(0,+v.pct||0))}
 if(r=='rest'&&k=='rests'){if(id!=i||!v)return 0;const n={};['open','pu','bz','cs','items','n','c','loc','img','cv','prep'].forEach(f=>{if(f in v)n[f]=v[f]});['img','cv'].forEach(f=>{if(f in n&&!okImg(n[f]))delete n[f]});if('n' in n)n.n=String(n.n||'').trim().slice(0,80)||(old&&old.n)||'';if('c' in n)n.c=String(n.c||'').slice(0,80);if('prep' in n)n.prep=Math.min(180,Math.max(0,+n.prep|0));if('bz' in n)n.bz=+n.bz==1?1:(+n.bz>Date.now()?Math.round(+n.bz):0);if('items' in n){n.items=cleanItems(n.items);if(!n.items)return 0}v=n}
 if(r=='rest'&&k=='orders'){if(!old||old.rid!=i||!v)return 0;const n={};if('why' in v)n.why=String(v.why).slice(0,200);if(('pt' in v||'prep' in v)&&old.st>1)return 0;if('prep' in v)n.prep=Math.min(180,Math.max(0,+v.prep|0));if('pt' in v)n.pt=+v.pt||0;if('st' in v){const a=old.st,c=v.st;if(!((a==0&&(c==1||c==-1))||(a==1&&(c==2||c==-1))||(a==2&&c==3&&old.did)))return 0;n.st=c;if(c==3){n.t3=Date.now();n.hby='rest'}if(c==1){n.acc=Date.now();if(!n.pt)n.pt=n.acc+(n.prep||old.prep||15)*6e4}if(c==2)n.rdy=Date.now()}v=n}
 if(r=='rest'&&(k=='rests'||k=='orders'?0:1))return 0;
 if(r=='rest'&&(k=='rests'?id!=i:!old||old.rid!=i||!v))return 0;
 if(r=='driver'&&k!='topups'&&(k=='drivers'?id!=i:!old||(old.did&&old.did!=i)||(v&&v.did&&v.did!=i)))return 0;
 if(r=='driver'&&k=='drivers'){if(!v)return 0;const n={};if('on' in v)n.on=v.on&&(db.drivers[i].bal||0)>mn?1:0;if(v.loc){const a=+v.loc.lat,g=+v.loc.lng;if(!(Math.abs(a)<=90&&Math.abs(g)<=180))return 0;n.loc={lat:a,lng:g}}if('hd' in v){const x=+v.hd;n.hd=Number.isFinite(x)&&x>=0&&x<360?Math.round(x):-1}['car','plate','color'].forEach(f=>{if(f in v)n[f]=String(v[f]).trim().slice(0,60)});if(/^\/u\/[a-f0-9]{32}\.\w+$/.test(String(v.img||'')))n.img=v.img;v=n}
 if(r=='driver'&&(k=='orders'||k=='rides')){if(!v)return 0;if(old&&old.did==i&&v.did==i){if(old.st<0||old.st>=4){WHY='انتهى هذا الطلب';return 0}v={...v};delete v.did;if(k=='rides'&&v.st==1&&old.st>=1)delete v.st;if(!Object.keys(v).length){old.acc=Date.now();return 1}}if(old&&old.did&&old.did!=i){WHY='أخذ هذا الطلب كابتن آخر';return 0}if(old&&old.st<0){WHY='ألغى الزبون هذا الطلب';return 0}const n={};if('did' in v){if(v.did&&(db.drivers[i].bal||0)<=mn){WHY='رصيدك منخفض — اشحن رصيدك لاستلام الطلبات';return 0}n.did=v.did;if(v.did)n.aat=Date.now()}if('rej' in v&&old.did==i&&!v.did){n.rej=[...new Set([...(old.rej||[]),i])];const fee=Math.round(+db.cfg.rejFee)||0;if(k=='orders'&&old.st<3&&fee>0)credit(i,-fee,'غرامة رفض طلب #'+id)}if(k=='orders'&&old.did==i&&'pimg' in v&&old.st>=2){const im=String(v.pimg||'');if(!/^\/u\/[a-f0-9]{32}\.\w+$/.test(im))return 0;n.pimg=im}if(k=='orders'&&v.ret&&old.did==i&&old.st==3&&!old.ret){const RR=['لم يستلم الزبون','الزبون لا يرد','استلم جزءاً من الطلب'],im=String(v.ret.img||'');if(!/^\/u\/[a-f0-9]{32}\.\w+$/.test(im))return 0;n.ret={r:RR.includes(v.ret.r)?v.ret.r:RR[0],img:im,at:Date.now()};n.st=4;n.t4=Date.now()}if(k=='orders'&&v.st==3&&db.cfg.pkImg!==0&&!(old.pimg||n.pimg))return 0;if(k=='rides'&&'req' in v&&old.st==3&&old.did==i&&!old.dok){n.req=v.req?Date.now():0;if(v.req)n.dno=0}if('st' in v){if((old.did!=i&&n.did!=i)||!((v.st==old.st+1&&(k=='rides'||old.st>=2))||(k=='rides'&&old.st==1&&v.st==0)))return 0;if(v.st==4&&old.t3&&Date.now()-old.t3<(k=='rides'?45e3:3e4))return 0;if(v.st==4&&k=='rides'&&db.cfg.endConf!==0&&!old.dok){const L=db.drivers[i].loc,T=old.to;if(!L||!T||hv(L,T)>(+db.cfg.endKm||0.4))return 0}n.st=v.st;n['t'+v.st]=Date.now()}v=n}
 if(r=='admin'&&k=='offers'&&v&&v.gen){const g=v.gen,aud=['all','new','old'].includes(g.aud)?g.aud:'all',pct=Math.min(100,Math.max(1,+g.pct||0)),mx=Math.max(0,Math.round(+g.max)||0),used=new Set(Object.values(db.offers).map(o=>String(o.code||'').toLowerCase()));let c=0;if(!(pct>0))return 0;
  for(const cid in db.customers){if(c>=5000)break;if(aud=='new'&&hasH(cid))continue;if(aud=='old'&&!hasH(cid))continue;let code;do{code=(S(g.pre,6).replace(/[^A-Za-z0-9]/g,'')+Math.random().toString(36).slice(2,8)).toUpperCase()}while(used.has(code.toLowerCase()));used.add(code.toLowerCase());const oid='g'+Date.now().toString(36)+(c++).toString(36);db.offers[oid]={id:oid,t:S(g.t,60)||'كود خاص بحسابك',d:'يعمل داخل حسابك فقط',pct,max:mx,n:1,cat:'taxi',code,uid:cid,on:1}}
  audit(h,'gen-codes',String(c),0);return 1}
 if(k=='cfg'){v={...(v||{})};['wOn'].forEach(f=>{if(f in v)v[f]=v[f]?1:0});if('payHide' in v){const p=v.payHide||{};v.payHide={master:p.master?1:0,zain:p.zain?1:0}}if('gw' in v){const g=v.gw||{};v.gw={mc:g.mc?1:0,zc:g.zc?1:0}}if('rrMin' in v)v.rrMin=Math.min(120,Math.max(3,Math.round(+v.rrMin)||20));if('wTaxiN' in v)v.wTaxiN=Math.min(100,Math.max(0,Math.round(+v.wTaxiN)||0));if('wFoodN' in v)v.wFoodN=Math.min(100,Math.max(0,Math.round(+v.wFoodN)||0));if('wTaxiPct' in v)v.wTaxiPct=Math.min(100,Math.max(0,+v.wTaxiPct||0));if('wTaxiMax' in v)v.wTaxiMax=Math.min(1e6,Math.max(0,Math.round(+v.wTaxiMax)||0));if('capBonus' in v)v.capBonus=Math.min(1e7,Math.max(0,Math.round(+v.capBonus)||0));if('minWd' in v)v.minWd=Math.min(1e8,Math.max(1000,Math.round(+v.minWd)||25000));['appPct','restPct','taxiPct'].forEach(f=>{if(f in v)v[f]=Math.min(100,Math.max(0,+v[f]||0))});delete v.mig5;delete v.mig6;delete v.mig7;if('outKm' in v)v.outKm=Math.min(1000,Math.max(5,+v.outKm||50));if('peak' in v){const p=v.peak||{};v.peak={on:p.on?1:0,pct:Math.min(300,Math.max(0,+p.pct||0)),until:+p.until>Date.now()?Math.round(+p.until):0}}if('esc' in v){const e=v.esc||{};v.esc={on:e.on?1:0,sec:Math.min(3600,Math.max(30,Math.round(+e.sec)||180)),pct:Math.min(50,Math.max(1,+e.pct||10)),n:Math.min(5,Math.max(0,Math.round(+e.n)||0))}}if('dl' in v){const d=v.dl||{},n=Math.min(50,Math.max(0.5,+d.n||4)),m=Math.min(100,Math.max(n,+d.m||8)),q=x=>Math.min(1e6,Math.max(0,Math.round(+x)||0));v.dl={n,m,p1:q(d.p1),p2:q(d.p2),p3:q(d.p3)}}if('req2fa' in v)v.req2fa=v.req2fa?1:0;if('theme' in v)v.theme=['auto','royal','night','ocean','ember','carbon','emerald','sunset','rose'].includes(v.theme)?v.theme:'auto';if('rejFee' in v)v.rejFee=Math.min(1e6,Math.max(0,Math.round(+v.rejFee)||0));if('auto' in v)v.auto=v.auto?1:0;if('maxKm' in v)v.maxKm=Math.min(200,Math.max(1,+v.maxKm||10));if('maxDev' in v)v.maxDev=Math.min(20,Math.max(1,Math.round(+v.maxDev)||3));['vpnBlock','timeGuard'].forEach(f=>{if(f in v)v[f]=v[f]?1:0});if('timeTol' in v)v.timeTol=Math.min(60,Math.max(1,Math.round(+v.timeTol)||3));if('cxSec' in v)v.cxSec=Math.min(3600,Math.max(0,Math.round(+v.cxSec)||0));if('cxFee' in v)v.cxFee=Math.min(1e6,Math.max(0,Math.round(+v.cxFee)||0));['cxFeeOn','endConf'].forEach(f=>{if(f in v)v[f]=v[f]?1:0});if('endKm' in v)v.endKm=Math.min(50,Math.max(0.05,+v.endKm||0.4));if('abOn' in v)v.abOn=v.abOn?1:0;if('abWarn' in v)v.abWarn=Math.min(50,Math.max(1,Math.round(+v.abWarn)||4));if('abBan' in v)v.abBan=Math.min(100,Math.max(1,Math.round(+v.abBan)||6));if('abDays' in v)v.abDays=Math.min(365,Math.max(1,Math.round(+v.abDays)||3));if('abWin' in v)v.abWin=Math.min(365,Math.max(0,Math.round(+v.abWin)||0));if('abGrace' in v)v.abGrace=Math.min(600,Math.max(0,Math.round(+v.abGrace)||0));db.cfg={...db.cfg,...v};audit(h,'cfg',id);return 1}
  if(k=='vars'){if(r!='admin'||!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(String(id)))return 0;if(v!=null){const t=['s','n','b'].includes(v.t)?v.t:((old&&old.t)||'s');let x=v.v!==undefined?v.v:(old&&old.v);x=t=='n'?(Number.isFinite(+x)?+x:0):t=='b'?(x&&x!=='0'&&x!=='false'?1:0):String(x==null?'':x).slice(0,500);if(!old&&Object.keys(db.vars).length>=200)return 0;v={v:x,t,pub:('pub' in v?(v.pub?1:0):(old?old.pub:0)),d:String('d' in v?v.d:(old&&old.d)||'').slice(0,120),at:Date.now()}}audit(h,'var',id)}
 if(k=='drivers'&&v&&v.loc)v.locAt=Date.now();
 if(k=='cardorders'&&old&&old.st==0&&v&&v.st>0&&r!='customer'){const cc=db.cards[old.card];
  if(cc&&cc.auto&&!old.code&&!String(v.code||'').trim()){if(!stockOf(cc.id))return 0;const o2={};deliver(o2,id,old.cid,cc);v={...v,...o2,by:r}}
  else{v={...v,dat:Date.now(),by:r};if(cc&&cc.cost!=null&&cc.cost!=='')v.cost=+cc.cost}}
 if(r=='customer'&&(k=='rides'||k=='orders')&&old&&v&&v.st==-1&&old.st>=1&&old.st<4){const gr=abK().gr*1e3,ta=+old.aat||+old.acc||0;if(!(gr&&ta&&Date.now()-ta<gr))abNew(i)}
 if(v==null)delete db[k][id];else db[k][id]={...old,...v,id};
 {const nw=db[k]&&db[k][id];if(nw&&nw.paid&&!nw.refd&&nw.st<0&&['orders','rides','cardorders'].includes(k)){nw.refd=1;ccredit(nw.cid,k=='orders'?nw.tot:k=='rides'?nw.fare:nw.p,'استرجاع '+id)}}
 if((k=='orders'||k=='rides')&&v&&db[k][id].st==4&&!db[k][id].chg&&db[k][id].did)charge(k,db[k][id]);
 if(k=='rides'&&v&&db.rides[id]&&db.rides[id].st==4&&!db.rides[id].cb&&db.rides[id].did)perks(db.rides[id]);
 return 1}
const SSE=new Set();let VER=0,BT=0;const bump=()=>{if(BT)return;BT=setTimeout(()=>{BT=0;VER++;const m='data:'+VER+'\n\n';for(const r of SSE)try{r.write(m)}catch(e){SSE.delete(r)}},Math.min(5e3,Math.max(100,+VAR('bumpMs',350)||350)))};
let LAG=0;setInterval(()=>{const t=Date.now();setImmediate(()=>{LAG=Date.now()-t})},2e3).unref();
setInterval(()=>{for(const r of SSE)try{r.write(': p\n\n')}catch(e){SSE.delete(r)}},25000);
const nk=s=>String(s||'').replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim().toLowerCase();
function menuOp(h,b){const r=h['x-role'],rid=r=='rest'?h['x-id']:r=='admin'?String(b.rid||''):'',R=db.rests[rid];if(!R||(r!='rest'&&r!='admin'))return null;const cur=(Array.isArray(R.items)?R.items:[]).map(i=>({...i}));
 if(b.op=='img'){const im=String(b.img||''),m=im.match(/^\/u\/([a-f0-9]{32})\.(jpg|png|webp)$/);if(!m||!fs.existsSync(path.join(UP,m[1]+'.'+m[2])))return null;const it=cur.find(i=>i.id==b.id);if(!it)return null;it.img=im;R.items=cleanItems(cur);return R.items?{ok:1,img:im}:null}
 if(b.op=='import'){const inc=Array.isArray(b.items)?b.items.slice(0,1000):null;if(!inc)return null;const idx=new Map(cur.map(i=>[nk(i.cat)+'|'+nk(i.n),i])),seen=new Set();let add=0,upd=0,skip=0;
  for(const x of inc){const n=String((x&&x.n)||'').trim().slice(0,80),p=Math.round(+(x&&x.p)),cat=String((x&&x.cat)||'').trim().slice(0,60),d=String((x&&x.d)||'').slice(0,500);if(!n||!(p>=0)||p>1e8){skip++;continue}const k=nk(cat)+'|'+nk(n);if(seen.has(k)){skip++;continue}seen.add(k);const o=idx.get(k);
   if(o){o.p=p;if(d)o.d=d;upd++}else{const it={id:'i'+Date.now().toString(36)+cr.randomBytes(3).toString('hex'),n,p,d,cat,f:'',t:'',off:0,pu:0,img:''};cur.push(it);idx.set(k,it);add++}}
  const cl=cleanItems(cur);if(!cl)return null;R.items=cl;return{ok:1,add,upd,skip,total:cl.length}}
 return null}
/* ===== استيراد المنيو بالذكاء الاصطناعي (صور / PDF / نص) — Google Gemini ===== */
const AIK=process.env.GEMINI_API_KEY||'',AIU='https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',AIH={};
const AIE=(code,m)=>Object.assign(new Error(m),{code});
const AI_MAXB=15*1024*1024; /* مجموع حجم الملفات المرفوعة بعد فك base64 */
const AI_MIMES={'image/jpeg':1,'image/png':1,'image/webp':1,'image/heic':1,'image/heif':1,'application/pdf':1};
const aiMagic=(mt,d)=>{let h;try{h=Buffer.from(d.slice(0,64),'base64')}catch(e){return false}
 if(mt=='image/jpeg')return h[0]==0xFF&&h[1]==0xD8;if(mt=='image/png')return h.slice(1,4).toString()=='PNG';
 if(mt=='image/webp')return h.slice(0,4).toString()=='RIFF'&&h.slice(8,12).toString()=='WEBP';
 if(mt=='application/pdf')return h.slice(0,4).toString()=='%PDF';return h.slice(4,8).toString()=='ftyp'};
const aiEn=s=>String(s).replace(/[٠-٩]/g,c=>c.charCodeAt(0)-0x660).replace(/[۰-۹]/g,c=>c.charCodeAt(0)-0x6F0).replace(/٫/g,'.').replace(/٬/g,',');
/* السعر: أرقام عربية→إنجليزية، وتجاهل «د.ع» و«ألف» وأي رموز */
function aiPrice(v){if(typeof v=='number')return Number.isFinite(v)?v:NaN;
 const m=aiEn(v).replace(/\s+/g,'').match(/\d[\d.,]*/);if(!m)return NaN;let t=m[0].replace(/[.,]+$/,'');
 if(/^\d{1,3}([.,]\d{3})+$/.test(t))t=t.replace(/[.,]/g,'');else t=t.replace(/,/g,'.');
 if((t.match(/\./g)||[]).length>1)t=t.replace(/\./g,'');return parseFloat(t)}
/* استخراج JSON من رد النموذج، مع إصلاح المصفوفة المقطوعة (عند تجاوز الحد الأقصى للإخراج) */
function aiJSON(t){t=String(t||'').replace(/^\uFEFF/,'').replace(/^```(?:json)?\s*/i,'').replace(/```\s*$/,'').trim();
 const tryP=x=>{try{return JSON.parse(x)}catch(e){return undefined}};let v=tryP(t);if(v!==undefined)return{v,fixed:0};
 const i=t.indexOf('[');if(i<0)return null;let c=t.slice(i);
 for(let n=0;n<400;n++){const k=c.lastIndexOf('}');if(k<0)break;c=c.slice(0,k+1);v=tryP(c+']');if(v!==undefined)return{v,fixed:1};c=c.slice(0,k)}
 return null}
async function menuAI(rid,b){
 if(!AIK)throw AIE(501,'ميزة الذكاء الاصطناعي غير مفعّلة. أضف متغير البيئة GEMINI_API_KEY في السيرفر.');
 const now=Date.now(),a=(AIH[rid]||[]).filter(t=>now-t<36e5);if(a.length>=15)throw AIE(429,'تجاوزت الحد (15 تحليلًا في الساعة). حاول لاحقًا.');
 const P=[],files=Array.isArray(b.files)?b.files.slice(0,8):[];let tot=0;
 for(const f of files){const mt=String(f&&f.mime||'').toLowerCase(),d=String(f&&f.data||'').replace(/^data:[^,]*,/,'').replace(/\s+/g,'');
  if(!d||!/^[A-Za-z0-9+/]+={0,2}$/.test(d))throw AIE(400,'ملف غير صالح');
  if(!AI_MIMES[mt])throw AIE(415,'نوع الملف غير مدعوم (صور JPG/PNG/WEBP أو PDF فقط)');
  if(!aiMagic(mt,d))throw AIE(415,'محتوى الملف لا يطابق نوعه. استخدم صورة أو PDF سليمًا');
  tot+=Math.floor(d.length*3/4);if(tot>AI_MAXB)throw AIE(413,'الملفات كبيرة جدًا (الحد الأقصى 15MB مجموعًا)، قلّل عدد الصور أو حجمها');
  P.push({inline_data:{mime_type:mt,data:d}})}
 const tx=String(b.text||'').slice(0,60000).trim();
 if(!P.length&&!tx)throw AIE(400,'لا يوجد محتوى لتحليله');
 if(tx)P.push({text:'نص المنيو:\n'+tx});
 const ex=[...new Set((db.rests[rid].items||[]).map(i=>String(i.cat||'').trim()).filter(Boolean))].slice(0,60);
 P.push({text:'استخرج كل أصناف المنيو من هذه الصور/الملف/النص (عربي أو إنجليزي) وأعدها JSON فقط: مصفوفة عناصر، كل عنصر فيه: category, name, price (رقم فقط), description. لا تخترع أصنافاً غير موجودة.'
  +'\nإن ظهرت أحجام بأسعار مختلفة فاجعل لكل حجم عنصراً باسم «الاسم - الحجم». اترك description نصاً فارغاً إن لم يوجد وصف. تجاهل أرقام الهواتف والعناوين وساعات العمل.'
  +(ex.length?'\nإن طابق قسمٌ في المنيو قسماً من الأقسام الحالية بالمعنى فاستخدم الاسم الحالي حرفياً: '+ex.join(' | '):'')});
 a.push(now);AIH[rid]=a;
 const r=await fetch(AIU,{method:'POST',headers:{'content-type':'application/json','x-goog-api-key':AIK},body:JSON.stringify({contents:[{role:'user',parts:P}],generationConfig:{responseMimeType:'application/json',temperature:0.1}}),signal:AbortSignal.timeout(120000)}).catch(e=>{throw AIE(502,e&&e.name=='TimeoutError'?'انتهت مهلة خدمة الذكاء الاصطناعي، جرّب صورة أصغر أو أقل عددًا':'تعذر الاتصال بخدمة الذكاء الاصطناعي')});
 const j=await r.json().catch(()=>({}));
 if(!r.ok){const em=String(j&&j.error&&j.error.message||'');console.error('menu-ai',r.status,em.slice(0,300));
  if(r.status==429)throw AIE(429,'انتهت حصة الذكاء الاصطناعي أو الخدمة مشغولة. أعد المحاولة بعد قليل (أو تحقق من حصة مفتاح Gemini).');
  if(r.status==413||/too large|exceeds the maximum|request payload size/i.test(em))throw AIE(413,'الملفات كبيرة جدًا، قلّل عدد الصور أو حجمها');
  if(r.status==401||r.status==403||/api key/i.test(em))throw AIE(502,'مفتاح GEMINI_API_KEY غير صالح أو غير مصرّح له');
  if(r.status==400)throw AIE(502,'تعذر تحليل الملف، جرّب صورة أوضح أو PDF أصغر');
  throw AIE(502,'خدمة الذكاء الاصطناعي غير متاحة حاليًا، حاول بعد قليل')}
 if(j.promptFeedback&&j.promptFeedback.blockReason)throw AIE(422,'تم رفض تحليل هذا الملف من خدمة الذكاء الاصطناعي، جرّب صورة أخرى');
 const cand=(j.candidates||[])[0]||{},txt=((cand.content&&cand.content.parts)||[]).map(x=>x&&x.text||'').join('');
 const trunc=cand.finishReason=='MAX_TOKENS'?1:0;
 if(!txt.trim())throw AIE(502,'لم يتم العثور على أصناف في الملف');
 const pj=aiJSON(txt);if(!pj)throw AIE(502,'تعذّر فهم رد الذكاء الاصطناعي (JSON غير صالح). أعد المحاولة أو جرّب صورة أوضح.');
 let arr=pj.v;if(arr&&!Array.isArray(arr)&&typeof arr=='object')arr=arr.items||arr.menu||arr.data||Object.values(arr).find(Array.isArray);
 if(!Array.isArray(arr))throw AIE(502,'تعذّر فهم رد الذكاء الاصطناعي (JSON غير صالح). أعد المحاولة.');
 let items=[];const seen=new Set();
 for(const x of arr){if(!x||typeof x!='object')continue;
  const n=String(x.name||x.n||'').replace(/\s+/g,' ').trim().slice(0,80),p=aiPrice(x.price!=null?x.price:x.p),cat=String(x.category||x.cat||'').replace(/\s+/g,' ').trim().slice(0,60),d=String(x.description||x.d||'').trim().slice(0,500);
  if(!n||!Number.isFinite(p)||p<0)continue;const k=nk(cat)+'|'+nk(n);if(seen.has(k))continue;seen.add(k);items.push({cat,n,p,d})}
 if(!items.length)throw AIE(422,'لم يتم العثور على أصناف بأسعار في الملف');
 items=items.slice(0,1000);
 /* الأسعار المكتوبة بالآلاف (5 ← 5000): نفس منطق الواجهة؛ الكسور تُضرب هنا لأن الواجهة تقرّب الأرقام */
 let k=0;if(items.every(i=>i.p<1000)&&items.some(i=>i.p>0)){if(items.every(i=>Number.isInteger(i.p)))k=1;else items.forEach(i=>{i.p=Math.round(i.p*1000)})}
 items.forEach(i=>{if(!k)i.p=Math.round(i.p)});
 return{items,k,notes:pj.fixed?'الرد كان مقطوعًا فاستُخرج الجزء المكتمل فقط.':'',truncated:(trunc||pj.fixed)?1:0}}
const rad=x=>x*Math.PI/180,hv=(a,b)=>{const dl=rad(b.lat-a.lat),dg=rad(b.lng-a.lng),x=Math.sin(dl/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dg/2)**2;return 12742*Math.asin(Math.sqrt(x))};
let DC=0;function dispatch(){if(db.cfg.auto===0)return;const mx=db.cfg.maxKm||10,now=Date.now(),I=ix();
 const q=Object.values(I.pend).filter(([o,k])=>k=='orders'?(o.st==2||(o.st==1&&o.pt&&o.pt-now<=6e5))&&!o.did:o.st==0&&!o.did).sort((a,b)=>a[0].at-b[0].at);
 if(!q.length)return;const bs=new Set(Object.keys(I.busy)),onl=Object.values(db.drivers).filter(d=>d.on&&d.loc);
 for(const[o,k,p,id]of q){let best=null,bd=1e9;
  for(const d of onl){if((d.bal||0)<=db.cfg.minBal||(d.locAt&&now-d.locAt>12e4)||(o.rej||[]).includes(d.id)||bs.has(d.id)||(d.type&&d.type!='both'&&d.type!=(k=='rides'?'taxi':'delivery')))continue;const x=hv(d.loc,p);if(x<=mx&&x<bd){bd=x;best=d}}
  if(best){DC++;o.did=best.id;o.auto=1;o.aat=now;if(k=='rides')o.st=1;bs.add(best.id);touch(k,id);try{PUSH.send('driver',best.id,{t:k=='rides'?'🚕 طلب رحلة جديد':'🛵 طلب توصيل جديد',b:'افتح التطبيق لقبول الطلب',u:'/driver.html',tag:'job'});if(k=='rides')pushState(k,id)}catch(e){}}}}
setInterval(()=>{const c=DC;dispatch();if(DC!=c){savel();bump()}},5000);
/* زيادة الأجرة تلقائياً: إذا لم يقبل أي كابتن الرحلة خلال cfg.esc.sec (افتراضي 3 دقائق) تزداد الأجرة بنسبة صغيرة، مرتين فقط (cfg.esc.n) ثم تثبت. تُخصم الزيادة من محفظة الزبون إن دفع بالمحفظة */
function escalate(){const E=db.cfg.esc;if(!E||!E.on||!(E.n>0))return 0;const now=Date.now(),I=ix();let n=0;
 for(const[id,o]of Object.entries(I.pR)){if(o.did||o.st!=0)continue;const k=o.esc|0;if(k>=E.n)continue;if(now<(o.ea||o.at||now)+E.sec*1e3)continue;
  const inc=Math.max(250,Math.round((o.fare||0)*E.pct/100/250)*250);
  if(o.paid){const c=db.customers[o.cid];if(!c||(c.bal||0)<inc)continue;ccredit(o.cid,-inc,'زيادة أجرة رحلة '+id)}
  if(!o.f0)o.f0=o.fare;o.fare=(o.fare||0)+inc;o.esc=k+1;o.ea=now;touch('rides',id);n++;
  try{PUSH.send('customer',o.cid,{t:'تمت زيادة الأجرة قليلاً',b:'زدنا الأجرة '+inc.toLocaleString('en-US')+' د.ع لنجد لك كابتن أسرع',u:'/customer.html',tag:'fare'})}catch(e){}}
 return n}
setInterval(()=>{try{if(escalate()){savel();bump()}}catch(e){console.error('[ESC]',e.message)}},10000).unref();
/* إشعارات تغيّر حالة الرحلة/الطلب (يُستدعى بعد كل تعديل ناجح) */
function pushState(k,id){if(k!='rides'&&k!='orders')return;const o=db[k]&&db[k][id];if(!o)return;const prev=o.ps===undefined?-9:o.ps;if(prev===o.st)return;o.ps=o.st;
 const C=(t,b,tag)=>o.cid&&PUSH.send('customer',o.cid,{t,b,u:'/customer.html',tag:tag||k[0]+id});
 if(k=='rides'){if(o.st==1)C('🚕 الكابتن في الطريق إليك','تم قبول رحلتك');else if(o.st==2)C('📍 الكابتن وصل','الكابتن بانتظارك عند نقطة الانطلاق');else if(o.st==3)C('بدأت رحلتك','نتمنى لك رحلة سعيدة');else if(o.st==4)C('✅ انتهت الرحلة','شكراً لاستخدامك التطبيق، لا تنسَ تقييم الكابتن');else if(o.st==-1&&o.did)PUSH.send('driver',o.did,{t:'تم إلغاء الرحلة',b:'ألغى الزبون الرحلة',u:'/driver.html',tag:'k'+id})}
 else{if(o.st==0&&prev==-9&&o.rid)PUSH.send('rest',o.rid,{t:'🍽️ طلب جديد',b:'وصلك طلب جديد من '+(o.cn||'زبون'),u:'/rest.html',tag:'new'});else if(o.st==1)C('المطعم يجهّز طلبك','تم قبول طلبك وبدأ التحضير');else if(o.st==2)C('🍽️ طلبك جاهز','بانتظار وصول المندوب');else if(o.st==3)C('🛵 المندوب في الطريق إليك','طلبك في الطريق');else if(o.st==4)C('✅ تم تسليم طلبك','بالعافية!');else if(o.st==-1)C('تم إلغاء طلبك','تواصل مع الدعم إن كان لديك استفسار')}}
// أرشفة اختيارية: تنقل المنتهي والأقدم من N يوم لملفات NDJSON شهرية ثم تحذفه من الذاكرة
function archive(){const dd=Math.floor(+VAR('archiveDays',0)||0);if(dd<30)return;const lim=Date.now()-dd*864e5,dir=path.join(path.dirname(path.resolve(F)),'archive'),by={},del=[];
 for(const c of ['orders','rides','tx','ctx'])for(const id in db[c]){const o=db[c][id];if(!o||!(o.at<lim))continue;if((c=='orders'||c=='rides')&&!(o.st==4||o.st<0))continue;const m=new Date(o.at).toISOString().slice(0,7);(by[m]||(by[m]=[])).push(JSON.stringify({c,id,v:o}));del.push([c,id])}
 if(!del.length)return;try{fs.mkdirSync(dir,{recursive:true});for(const m in by)fs.appendFileSync(path.join(dir,m+'.ndjson'),by[m].join('\n')+'\n')}catch(e){console.error('[ARCHIVE] فشل الكتابة، لم يُحذف شيء:',e.message);return}
 for(const[c,id]of del)delete db[c][id];IXF=1;save();bump();console.log('[ARCHIVE] moved',del.length,'records')}
setInterval(()=>{try{archive()}catch(e){console.error('[ARCHIVE]',e.message)}},6e5).unref();
let UP=process.env.UPLOAD_DIR||path.join(path.dirname(path.resolve(F)),'uploads');
try{fs.mkdirSync(UP,{recursive:true});fs.accessSync(UP,fs.constants.W_OK)}catch(e){console.error('UPLOAD_DIR not writable, using local uploads:',e.message);UP=path.join(__dirname,'uploads');try{fs.mkdirSync(UP,{recursive:true})}catch(_){}}
const LIM=+process.env.MAX_UPLOAD_MB>0?process.env.MAX_UPLOAD_MB*1048576:1e8,X={'image/jpeg':'jpg','image/jpg':'jpg','image/png':'png','image/webp':'webp','video/mp4':'mp4','video/x-m4v':'mp4','video/webm':'webm','video/quicktime':'mov','video/3gpp':'3gp'},MT={jpg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',webm:'video/webm',mov:'video/quicktime','3gp':'video/3gpp'};
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8','.json':'application/json;charset=utf-8','.webmanifest':'application/manifest+json;charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain;charset=utf-8'};
const LIGHT=new Set(['orders','rides','tickets','chat','apps','cardorders','ctop','topups','wd','incw','drivers','wallet','cwallet','cdev']),IXV_=!!process.env.IX_VERIFY;
const SC=new Map();
function serveStatic(q,s,f,SH){const ae=String(q.headers['accept-encoding']||''),now=Date.now();let e=SC.get(f);
 const send=()=>{const ext=path.extname(f),tx=T[ext],enc=tx&&e.br&&/\bbr\b/.test(ae)?'br':tx&&e.gz&&/\bgzip\b/.test(ae)?'gzip':'',h={...SH,'Content-Type':tx||({'.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp'})[ext]||'application/octet-stream','ETag':e.etag,'Cache-Control':ext=='.html'?'no-cache':'public,max-age=60,must-revalidate','Vary':'Accept-Encoding'};
  if(inm(q,e.etag)){s.writeHead(304,h);return s.end()}const b=enc=='br'?e.br:enc=='gzip'?e.gz:e.buf;if(enc)h['Content-Encoding']=enc;h['Content-Length']=b.length;s.writeHead(200,h);s.end(q.method=='HEAD'?undefined:b)};
 if(e&&now-e.t<5e3)return send();
 fs.stat(f,(er,st)=>{if(er||!st.isFile()){s.writeHead(404);return s.end('404')}if(e&&e.m===st.mtimeMs){e.t=now;return send()}
  fs.readFile(f,(er2,buf)=>{if(er2){s.writeHead(404);return s.end('404')}const ext=path.extname(f);e={t:now,m:st.mtimeMs,buf,etag:'"'+cr.createHash('md5').update(buf).digest('hex').slice(0,16)+'"'};if(T[ext]&&buf.length>512){e.gz=ZL.gzipSync(buf,{level:6});e.br=ZL.brotliCompressSync(buf,{params:{[ZL.constants.BROTLI_PARAM_QUALITY]:5}})}SC.set(f,e);send()})})}
const SRV=http.createServer((q,s)=>{
 if(q.url=='/healthz'){s.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return s.end(JSON.stringify({ok:1,up:process.uptime()|0,mut:MUT,sse:SSE.size,lagMs:LAG,saveMs:DBS.ms(),rssMB:Math.round(process.memoryUsage().rss/1048576)}))}
 q.headers['x-ip']=cip(q);who(q.headers);if(q.headers['x-role']=='customer'&&q.headers['x-id']&&!devCheck(q.headers['x-id'],q.headers))q.headers['x-id']='';
 const SH={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'};
 const u=q.url.split('?')[0],j=(c,d)=>{s.writeHead(c,{'Content-Type':'application/json'});s.end(JSON.stringify(d))};
 if(u.startsWith('/api/')&&!u.startsWith('/api/auth/')&&u!='/api/stream'&&u!='/api/driver/login'){const gx=guard(q.headers);if(gx){q.resume();return j(403,gx)}}
 if(u=='/config.js'){s.writeHead(200,{'Content-Type':'text/javascript'});return s.end('window.MBT='+JSON.stringify(MBT)+';window.GKEY='+JSON.stringify(KEY)+';window.GCID='+JSON.stringify(GCID))}

 if(u.startsWith('/api/auth/')&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>1e4)q.destroy()});q.on('end',async()=>{try{b=JSON.parse(b);const a=u.slice(10),now=Date.now(),tg=gTime(q.headers);if(tg&&a!='logout')return j(403,tg);let GEO=null;if(db.cfg.vpnBlock!==0||['login','register','google','wa-verify'].includes(a)){GEO=await ipinfo(q.headers['x-ip']);if(db.cfg.vpnBlock!==0&&GEO.vpn)return j(403,{c:'vpn',e:MSG.vpn})}const tk=()=>{const i=sid(q.headers['x-token']);return i&&db.customers[i]&&devCheck(i,q.headers)?i:''},hp=(w,sl)=>cr.scryptSync(w,sl,32).toString('hex'),In=(id,info,m)=>{const c0=db.customers[id]||{},dl=devLogin(c0,q,b,m||'pw',GEO);if(!dl.ok){if(db.customers[id])save();return j(403,dl)}db.customers[id]={...c0,id,...info,last:now};if(!db.customers[id].at)db.customers[id].at=now;save();const t=mk(id);saveA();return j(200,{id,token:t,n:db.customers[id].n||'',ver:db.customers[id].ver!==0?1:0})};
 if(a=='wa-request'){const p=nph(b.phone);if(!p)return j(400,{e:'رقم غير صحيح'});const o=OTP[p];if(o&&now-o.t<6e4)return j(429,{e:'انتظر دقيقة قبل إعادة الإرسال'});const c=String(cr.randomInt(1e5,1e6));OTP[p]={c,t:now,n:0};return await sendWA(p,c)?j(200,{ok:1,phone:p}):j(502,{e:'تعذر إرسال الرمز'})}
 if(a=='wa-verify'){const p=nph(b.phone),o=OTP[p];if(!o||now-o.t>3e5||o.n>=5)return j(400,{e:'انتهت صلاحية الرمز، اطلب رمزًا جديدًا'});if(String(b.code).trim()!==o.c){o.n++;return j(400,{e:'الرمز خاطئ'})}delete OTP[p];{const id='c'+p,c=db.customers[id];if(c&&c.ver===0){delete AU.pw[id];AU.rev[id]=Date.now();for(const k in AU.sessions)if(AU.sessions[k].id==id)delete AU.sessions[k]}}return In('c'+p,{ph:p,ver:1},'wa')}
 if(a=='google'){if(!GCID)return j(501,{e:'تسجيل جوجل غير مفعّل. أضف GOOGLE_CLIENT_ID في السيرفر'});let g;
  if(b.at){const r=await fetch('https://oauth2.googleapis.com/tokeninfo?access_token='+encodeURIComponent(String(b.at).slice(0,4000)));g=await r.json();if(!r.ok||(g.aud!=GCID&&g.azp!=GCID)||!g.sub||g.email_verified=='false')return j(401,{e:'فشل التحقق من حساب جوجل'});if(!g.name){try{const u2=await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+b.at}}).then(r=>r.json());g.name=u2.name||'';g.email=g.email||u2.email||''}catch(e){}}}
  else{const r=await fetch('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(String(b.cred||'').slice(0,4000)));g=await r.json();if(!r.ok||g.aud!=GCID||g.email_verified=='false')return j(401,{e:'فشل التحقق من حساب جوجل'})}
  return In('g'+g.sub,{n:g.name||'',em:g.email||'',ver:1},'google')}
 if(a=='register'){const p=nph(b.phone),n=String(b.name||'').trim().slice(0,60),pw=String(b.password||''),ip=q.headers['x-ip'],g=RG[ip]||(RG[ip]={n:0,t:now});if(now-g.t>36e5){g.n=0;g.t=now}if(g.n>=10)return j(429,{e:'محاولات كثيرة، حاول لاحقًا'});if(!n)return j(400,{e:'اكتب اسمك'});if(!p)return j(400,{e:'رقم غير صحيح'});if(pw.length<6||pw.length>100)return j(400,{e:'كلمة المرور 6 أحرف على الأقل'});if(db.customers['c'+p])return j(409,{e:'هذا الرقم مسجّل مسبقًا، سجّل الدخول'});g.n++;const sl=cr.randomBytes(16).toString('hex');AU.pw['c'+p]={s:sl,h:hp(pw,sl)};return In('c'+p,{ph:p,n,ver:0},'reg')}
 if(a=='login'){const p=nph(b.phone),id='c'+p,w=AU.pw[id],f=FAIL[p]||(FAIL[p]={n:0,t:now});if(now-f.t>6e5){f.n=0;f.t=now}if(f.n>=5)return j(429,{e:'محاولات كثيرة، انتظر 10 دقائق'});let good=false;if(w){const x=Buffer.from(hp(String(b.password||'').slice(0,100),w.s),'hex'),y=Buffer.from(w.h,'hex');good=x.length==y.length&&cr.timingSafeEqual(x,y)}if(!good){f.n++;return j(401,{e:'الرقم أو كلمة المرور غير صحيحة'})}delete FAIL[p];return In(id,{},'pw')}
 if(a=='me'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id];return j(200,{ph:c.ph||'',n:c.n||'',em:c.em||'',g:id[0]=='g'?1:0,pv:pvOf(c)?1:0,ver:c.ver!==0?1:0,pro:proView(c)})}
 if(a=='phone-add'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const p=nph(b.phone);if(!p)return j(400,{e:'رقم غير صحيح'});const c=db.customers[id];if(c.ph==p&&pvOf(c))return j(409,{e:'هذا الرقم موثّق مسبقًا'});const ox=db.customers['c'+p];if((ox&&ox.id!=id&&ox.ver!==0)||Object.values(db.customers).some(x=>x.id!=id&&x.ph==p&&pvOf(x)))return j(409,{e:'هذا الرقم مرتبط بحساب آخر'});const k='a'+id,o=OTP[k];if(o&&now-o.t<6e4)return j(429,{e:'انتظر دقيقة قبل إعادة الإرسال'});const cd=String(cr.randomInt(1e5,1e6));OTP[k]={c:cd,t:now,n:0,p};return await sendWA(p,cd)?j(200,{ok:1,phone:p}):j(502,{e:'تعذر إرسال الرمز'})}
 if(a=='phone-confirm'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],k='a'+id,o=OTP[k];if(!o||now-o.t>3e5||o.n>=5)return j(400,{e:'انتهت صلاحية الرمز، اطلب رمزًا جديدًا'});if(String(b.code).trim()!==o.c){o.n++;return j(400,{e:'الرمز خاطئ'})}delete OTP[k];c.ph=o.p;c.pv=1;save();return j(200,{ok:1,ph:c.ph})}
 if(a=='pro-start'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],cur=proState(c);if(proOn(c))return j(409,{e:'اشتراكك فعّال'});const price=+VAR('proPrice',5000)||0,trial=!(c.pro&&c.pro.used),td=+VAR('proTrialDays',14)||14;if(!trial&&price>0){if((c.bal||0)<price)return j(402,{e:'رصيد المحفظة غير كافٍ لدفع الاشتراك ('+price+' دينار). اشحن محفظتك أولًا'});ccredit(id,-price,'اشتراك برو')}c.pro={st:trial?'trial':'active',start:now,end:now+(trial?td:30)*864e5,left:+VAR('proTrips',5)||5,used:1,auto:1};if(trial)c.pro.left=Math.min(c.pro.left,2);save();return j(200,{ok:1,pro:proView(c)})}
 if(a=='pro-cancel'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id];if(c.pro){c.pro.auto=b.on?1:0;save()}return j(200,{ok:1,pro:proView(c)})}
 if(a=='sessions'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],cur=cdev(q.headers['x-dev']);return j(200,{cur,max:Math.max(1,+db.cfg.maxDev||3),devs:Object.values(c.devs||{}).filter(x=>x.st!=2).sort((a,b)=>(b.last||0)-(a.last||0)).map(x=>({id:x.id,nm:x.nm,os:x.os,br:x.br,ip:x.ip,cn:x.cn,city:x.city,first:x.first,last:x.last,st:x.st||0,app:x.app})),sess:(c.sess||[]).slice(-25).reverse()})}
 if(a=='revoke'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],d=cdev(b.target),x=c.devs&&c.devs[d];if(!x||d==cdev(q.headers['x-dev']))return j(400,{e:'لا يمكن إزالة هذا الجهاز من هنا'});if(x.st!=1)x.st=2;save();return j(200,{ok:1})}
 if(a=='logout'){const i=sid(q.headers['x-token']),c=i&&db.customers[i],d=cdev(q.headers['x-dev']);if(c&&c.devs&&c.devs[d]&&c.devs[d].st!=1){c.devs[d].st=2;save()}return j(200,{ok:1})}
 if(a=='verify-request'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id];if(c.ver!==0||!c.ph)return j(200,{ok:1,ver:1});const k='v'+c.ph,o=OTP[k];if(o&&now-o.t<6e4)return j(429,{e:'انتظر دقيقة قبل إعادة الإرسال'});const cd=String(cr.randomInt(1e5,1e6));OTP[k]={c:cd,t:now,n:0};return await sendWA(c.ph,cd)?j(200,{ok:1}):j(502,{e:'تعذر إرسال الرمز'})}
 if(a=='verify-confirm'){const id=tk();if(!id)return j(401,{e:'سجّل الدخول'});const c=db.customers[id],k='v'+c.ph,o=OTP[k];if(!o||now-o.t>3e5||o.n>=5)return j(400,{e:'انتهت صلاحية الرمز، اطلب رمزًا جديدًا'});if(String(b.code).trim()!==o.c){o.n++;return j(400,{e:'الرمز خاطئ'})}delete OTP[k];c.ver=1;save();return j(200,{ok:1,ver:1})}
 j(404,{})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/driver/login'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>5e3)q.destroy()});q.on('end',()=>{try{b=JSON.parse(b);const id=String(b.id||'').slice(0,60),d=db.drivers[id],key='L|'+q.headers['x-ip']+'|'+id;if(lk(key))return j(429,{e:'محاولات كثيرة، انتظر 10 دقائق'});
  if(!d||!eq(d.pin,b.pin)){lk(key,1);return j(401,{e:'بيانات الدخول غير صحيحة'})}
  if(d.tfa){if(!String(b.code||'').trim())return j(200,{need2fa:1});if(!totp(d.tfa,b.code,d)){lk(key,1);return j(401,{e:'رمز التحقق غير صحيح أو مستخدم'})}save()}
  lk(key,0);{const bn=Math.max(0,Math.round(+db.cfg.capBonus>=0?+db.cfg.capBonus:10000));if(!d.bonus&&bn>0){d.bonus=Date.now();credit(id,bn,'مكافأة تسجيل الدخول الأولى');save()}}return j(200,{token:mk('d:'+id),tfa:d.tfa?1:0})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/driver/2fa'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>2e3)q.destroy()});q.on('end',()=>{try{b=JSON.parse(b);const h=q.headers;if(h['x-role']!='driver'||!ok(h))return j(401,{e:'انتهت الجلسة'});const id=h['x-id'],d=db.drivers[id],key='F|'+h['x-ip']+'|'+id;if(lk(key))return j(429,{e:'محاولات كثيرة'});
  if(b.a=='setup'){if(d.tfa)return j(409,{e:'المصادقة الثنائية مفعّلة'});d.tfaP=b32e(cr.randomBytes(20));save();return j(200,{secret:d.tfaP,uri:'otpauth://totp/'+encodeURIComponent('Taxi:'+id)+'?secret='+d.tfaP+'&issuer=Taxi'})}
  if(b.a=='enable'){if(!d.tfaP||!totp(d.tfaP,b.code,d)){lk(key,1);return j(400,{e:'الرمز غير صحيح'})}d.tfa=d.tfaP;delete d.tfaP;lk(key,0);audit(h,'2fa-on',id);save();bump();return j(200,{ok:1,token:mk('d:'+id)})}
  if(b.a=='disable'){if(!d.tfa||!totp(d.tfa,b.code,d)){lk(key,1);return j(400,{e:'الرمز غير صحيح'})}delete d.tfa;delete d.tfaP;AU.rev['d:'+id]=Date.now();saveA();audit(h,'2fa-off',id);save();bump();return j(200,{ok:1})}
  j(400,{e:'طلب غير صالح'})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/stream'){if(SSE.size>=Math.max(0,+VAR('maxSSE',20000)||0)){s.writeHead(204);return s.end()}s.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});s.write('retry:1500\n\ndata:'+VER+'\n\n');SSE.add(s);q.on('close',()=>SSE.delete(s));return}
 if(u.startsWith('/api/backups')){const h=q.headers;if(h['x-role']!='admin'||!ok(h)){q.resume();return j(403,{})}
  if(u=='/api/backups'&&q.method=='GET')return j(200,{dir:BKD,gh:!!(process.env.BACKUP_GH_TOKEN&&process.env.BACKUP_GH_REPO),ghAt:db.cfg.bkGhAt||0,disk:!!process.env.DATA_FILE,weak:ADMIN==='1234'||String(ADMIN).length<6,vapid:!!process.env.VAPID_PRIVATE,items:bkList().slice(0,120)});
  if(u=='/api/backups/now'&&q.method=='POST'){q.resume();DBS.flush(true);AUS.flush(true);const n=backupNow('manual');return n?j(200,{ok:1,n,gh:!!(GHT()&&GHR())}):j(500,{e:'تعذر إنشاء النسخة'})}
  if(u=='/api/backups/download'&&q.method=='GET'){q.resume();DBS.flush(true);AUS.flush(true);const n=bkName(Date.now(),'download');audit(h,'backup-download',n,0);const buf=bkBuf();s.writeHead(200,{'Content-Type':'application/gzip','Content-Disposition':'attachment; filename="'+n+'"','Content-Length':buf.length,'Cache-Control':'no-store'});return s.end(buf)}
  if(u=='/api/backups/restore'&&q.method=='POST'){const ch=[];let sz=0;q.on('data',c=>{sz+=c.length;if(sz>3e8)q.destroy();else ch.push(c)});q.on('end',async()=>{try{const body=Buffer.concat(ch);let r;try{backupNow('prerestore')}catch(e){}
   if(String(q.headers['content-type']||'').includes('json')){const b=JSON.parse(body.toString()||'{}');if(b.from=='github')r=await ghRestoreLatest();else if(b.name){const n=path.basename(String(b.name));if(!/^backup-[\w-]+\.json\.gz$/.test(n))return j(400,{e:'اسم غير صالح'});r=applyBackup(fs.readFileSync(path.join(BKD,n)))}else return j(400,{e:'حدد مصدر الاستعادة'})}else r=applyBackup(body);
   audit(h,'backup-restore','',0);j(200,{ok:1,...r})}catch(e){j(400,{e:e.message})}});return}
  if(u.startsWith('/api/backups/get/')){const n=path.basename(decodeURIComponent(u.slice(17)));if(!/^backup-[\w-]+\.json\.gz$/.test(n)||!fs.existsSync(path.join(BKD,n)))return j(404,{});audit(h,'backup-download',n,0);s.writeHead(200,{'Content-Type':'application/gzip','Content-Disposition':'attachment; filename="'+n+'"','Cache-Control':'no-store'});return fs.createReadStream(path.join(BKD,n)).pipe(s)}
  q.resume();return j(404,{})}
 if(u=='/api/codes'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>4e6)q.destroy()});q.on('end',()=>{try{const h=q.headers;if(h['x-role']!='admin'||!ok(h))return j(403,{});const bb=JSON.parse(b),r=codesOp(h,bb);if(r.ok&&bb.op!='list'&&bb.op!='summary'){save();bump()}return j(r.e?400:200,r)}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/route'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>8e3)q.destroy()});q.on('end',()=>{try{const h=q.headers;if(!ok(h))return j(401,{});const K=process.env.GOOGLE_ROUTES_KEY;if(!K)return j(404,{e:'nokey'});
  const bb=JSON.parse(b||'{}'),P=x=>{const a=+(x&&x.lat),g=+(x&&x.lng);return Math.abs(a)<=90&&Math.abs(g)<=180&&(a||g)?{lat:a,lng:g}:null},A=P(bb.a),B=P(bb.b);if(!A||!B)return j(400,{});const V=(Array.isArray(bb.via)?bb.via:[]).map(P).filter(Boolean).slice(0,20);
  const ck=[A,B,...V].map(p=>p.lat.toFixed(4)+','+p.lng.toFixed(4)).join('|'),hit=RTC.get(ck);if(hit&&Date.now()-hit.t<9e4)return j(200,hit.v);
  const ip=String(h['x-ip']||q.socket.remoteAddress||''),t=Date.now(),L=(RTR.get(ip)||[]).filter(x=>t-x<6e4);if(L.length>=30)return j(429,{});L.push(t);RTR.set(ip,L);
  const ll=p=>({location:{latLng:{latitude:p.lat,longitude:p.lng}}}),body=JSON.stringify({origin:ll(A),destination:ll(B),intermediates:V.map(p=>({...ll(p),via:true})),travelMode:'DRIVE',routingPreference:'TRAFFIC_AWARE',languageCode:'ar',units:'METRIC'});
  const rq=require('https').request({host:'routes.googleapis.com',path:'/directions/v2:computeRoutes',method:'POST',headers:{'Content-Type':'application/json','X-Goog-Api-Key':K,'X-Goog-FieldMask':'routes.duration,routes.staticDuration,routes.distanceMeters,routes.polyline.encodedPolyline','Content-Length':Buffer.byteLength(body)},timeout:8000},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{try{const J=JSON.parse(d),R=J.routes&&J.routes[0];if(r.statusCode!=200||!R){console.error('[ROUTES]',r.statusCode,String(d).slice(0,200));return j(502,{e:'route'})}
    const sec=parseInt(R.duration)||0,st=parseInt(R.staticDuration)||sec,v={km:(R.distanceMeters||0)/1000,min:Math.max(1,Math.round(sec/60)),free:Math.max(1,Math.round(st/60)),line:decPl(R.polyline&&R.polyline.encodedPolyline||''),traffic:1};
    RTC.set(ck,{t:Date.now(),v});if(RTC.size>3000)RTC.delete(RTC.keys().next().value);j(200,v)}catch(e){j(502,{})}})});rq.on('timeout',()=>rq.destroy());rq.on('error',()=>j(502,{}));rq.end(body)}catch(e){j(400,{})}});return}
 if(u=='/api/lsug'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>4e3)q.destroy()});q.on('end',()=>{try{const h=q.headers,r=h['x-role'],i=h['x-id'];if(!ok(h))return j(401,{e:'سجّل الدخول'});const bb=JSON.parse(b);db.lsug=db.lsug||{};
  if(bb.op=='add'&&r=='customer'){const fa=S(bb.fa,80).trim(),ta=S(bb.ta,80).trim();if(!fa||!ta)return j(400,{e:'أدخل منطقة الانطلاق والوجهة'});if(Object.values(db.lsug).filter(x=>x.cid==i&&x.st==0).length>=5)return j(400,{e:'لديك 5 طلبات مفتوحة'});const c=db.customers[i]||{},id='s'+Date.now().toString(36)+cr.randomBytes(2).toString('hex');
   const same=Object.values(db.lsug).find(x=>x.st==0&&x.fa==fa&&x.ta==ta&&x.tm==S(bb.tm,20));db.lsug[id]={id,cid:i,cn:S(c.n,60),cp:S(c.ph||c.phone,20),fa,ta,tm:S(bb.tm,20),seats:Math.min(11,Math.max(1,Math.round(+bb.seats)||1)),days:S(bb.days,60),note:S(bb.note,200),st:0,at:Date.now()};if(same)same.n=(same.n||1)+1;save();bump();return j(200,{ok:1})}
  if(bb.op=='close'){const x=db.lsug[S(bb.id,40)];if(!x||!(r=='admin'||(r=='customer'&&x.cid==i)))return j(403,{});x.st=r=='admin'?2:-1;save();bump();return j(200,{ok:1})}
  return j(400,{e:'عملية غير معروفة'})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/pay/start'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>2e3)q.destroy()});q.on('end',()=>{try{const h=q.headers;if(h['x-role']!='customer'||!ok(h))return j(401,{e:'سجّل الدخول'});const bb=JSON.parse(b),m=bb.m=='zain'?'zc':'mc',g=db.cfg.gw||{};if(!g[m])return j(400,{e:'الدفع الإلكتروني غير مفعّل'});
  /* نقطة ربط البوابة لاحقاً: عيّن PAY_MC_URL أو PAY_ZC_URL (رابط صفحة الدفع لدى البوابة) وطبّق التحقق عبر webhook */
  const base=process.env[m=='zc'?'PAY_ZC_URL':'PAY_MC_URL'];if(!base)return j(501,{e:'بوابة الدفع لم تُربط بعد — استخدم التحويل اليدوي'});const amt=Math.round(+bb.amt)||0;if(amt<1000||amt>5e6)return j(400,{e:'مبلغ غير صالح'});const ref='p'+Date.now().toString(36)+cr.randomBytes(3).toString('hex');db.pays=db.pays||{};db.pays[ref]={ref,cid:h['x-id'],m,amt,st:0,at:Date.now()};save();return j(200,{url:base+(base.includes('?')?'&':'?')+'ref='+ref+'&amount='+amt})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/redeem'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>2e3)q.destroy()});q.on('end',()=>{try{const h=q.headers,r=h['x-role'];if(!ok(h)||!h['x-id']||(r!='customer'&&r!='driver'))return j(401,{e:'انتهت الجلسة'});const key='R|'+h['x-ip']+'|'+h['x-id'];if(lk(key))return j(429,{e:'محاولات كثيرة، حاول بعد 10 دقائق'});
  const x=redeem(r,h['x-id'],JSON.parse(b).code,h);if(!x.ok){lk(key,1);return j(400,{e:x.e})}save();bump();return j(200,x)}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/menu'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>3e6)q.destroy()});q.on('end',()=>{try{if(ok(q.headers)){const r=menuOp(q.headers,JSON.parse(b));if(r){save();bump();return j(200,r)}}}catch(e){}j(403,{})});return}
 if(u=='/api/menu-ai'&&q.method=='POST'){let b='',big=0;q.on('data',c=>{if(big)return;b+=c;if(b.length>18e6){big=1;b='';q.resume();j(413,{e:'الملفات كبيرة جدًا، قلّل عدد الصور أو حجمها'})}});q.on('end',async()=>{if(big)return;try{const h=q.headers;if(!ok(h))return j(401,{e:'انتهت الجلسة'});const r=h['x-role'];if(r!='rest'&&r!='admin')return j(403,{});b=JSON.parse(b);const rid=r=='rest'?h['x-id']:String(b.rid||'');if(!db.rests[rid])return j(403,{});
  const out=await menuAI(rid,b);j(200,out)}catch(e){j(e&&typeof e.code=='number'?e.code:500,{e:e&&typeof e.code=='number'?e.message:'تعذر تحليل المنيو'})}});return}
 if(u=='/api/menu-ai/status')return ok(q.headers)?j(200,{ai:!!AIK}):j(401,{});
 if(u=='/api/push/key')return j(200,{key:PUSH.key()});
 if(u=='/api/push/sub'&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>8e3)q.destroy()});q.on('end',()=>{try{const r=q.headers['x-role'];if(!['customer','driver','rest'].includes(r)||!ok(q.headers))return j(401,{});const x=JSON.parse(b);const id=q.headers['x-id']||'';if(!id)return j(401,{});if(x.off){PUSH.rm(r,id,x.endpoint);return j(200,{ok:1})}return j(PUSH.add(r,id,x.sub)?200:400,{ok:1})}catch(e){j(400,{})}});return}
 if(u=='/api/db')return ok(q.headers)?sendView(q,s):j(401,{});
 if(u=='/api/set'&&q.method=='POST'){if(rl(q.headers)){q.resume();return j(429,{e:'طلبات كثيرة'})}let b='';q.on('data',c=>{b+=c;if(b.length>8e6)q.destroy()});q.on('end',()=>{try{const bb=JSON.parse(b);if(q.headers['x-role']=='customer'&&+VAR('maintenance',0)&&['orders','rides','cardorders','ctop'].includes(bb.k))return j(503,{c:'maint',e:String(VAR('maintMsg','التطبيق في صيانة قصيرة'))});WHY='';if(ok(q.headers)&&set(q.headers,bb)){const K=bb.k,hot=q.headers['x-role']=='driver'&&K=='drivers'&&bb.v&&typeof bb.v=='object'&&Object.keys(bb.v).every(f=>f=='loc'||f=='on'||f=='hd'),light=hot||LIGHT.has(K);touch(K,String(bb.id));try{pushState(K,String(bb.id))}catch(e){}const c0=DC;dispatch();if(IXV_)ixCheck('set:'+K);if(light&&(!hot||DC==c0))savel();else save();bump();return j(200,{ok:1})}}catch(e){}j(403,WHY?{e:WHY}:{})});return}
 if(u.startsWith('/api/apply/')&&q.method=='POST'){let b='';q.on('data',c=>{b+=c;if(b.length>8e3)q.destroy()});q.on('end',()=>{try{const bb=JSON.parse(b||'{}'),ip=String(q.headers['x-ip']||q.socket.remoteAddress||'');
  if(u=='/api/apply/start'){const k='ap|'+ip,t=Date.now(),L=(APR.get(k)||[]).filter(x=>t-x<36e5);if(L.length>=6)return j(429,{e:'محاولات كثيرة، حاول بعد ساعة'});L.push(t);APR.set(k,L);const tok=cr.randomBytes(18).toString('hex');APT.set(tok,{ip,n:0,exp:t+3*36e5});return j(200,{apt:tok})}
  if(u=='/api/apply/send'){const T=APT.get(String(bb.apt||''));if(!T||T.exp<Date.now())return j(400,{e:'انتهت صلاحية الجلسة، أعد المحاولة'});const ty=['taxi','delivery','both','line'].includes(bb.type)?bb.type:'taxi',n=S(bb.n,60).trim(),ph=S(bb.ph,30).replace(/[^\d+]/g,'');if(n.length<5||ph.length<10)return j(400,{e:'أدخل الاسم الثلاثي ورقم هاتف صحيح'});
   if(Object.values(db.apps).some(a=>a.ph==ph&&a.st==0))return j(400,{e:'لديك طلب قيد المراجعة بهذا الرقم'});const dc={};Object.entries(bb.docs&&typeof bb.docs=='object'?bb.docs:{}).slice(0,16).forEach(([a,x])=>{if(/^\/u\/[a-f0-9]{32}\.\w+$/.test(String(x)))dc[S(a,20)]=x});
   const need=ty=='delivery'?['idf','idb','self','veh1','v1']:['idf','idb','lic','reg1','self','car1','car2','car3','v1','v2'];const miss=need.filter(x=>!dc[x]);if(miss.length)return j(400,{e:'أكمل المستمسكات المطلوبة ('+miss.length+')'});
   const id='a'+Date.now().toString(36)+cr.randomBytes(2).toString('hex'),key=cr.randomBytes(16).toString('hex');db.apps[id]={id,cid:'',src:'driver-app',key,type:ty,veh:S(bb.veh,20),n,ph,city:S(bb.city,60),car:S(bb.car,60),plate:S(bb.plate,30),color:S(bb.color,30),year:S(bb.year,8),docs:dc,st:0,at:Date.now()};APT.delete(String(bb.apt));touch('apps',id);save();bump();try{PUSH.send&&PUSH.send('admin','',{t:'🧑‍✈️ طلب تسجيل كابتن جديد',b:n,u:'/panel.html'})}catch(e){}return j(200,{id,key})}
  if(u=='/api/apply/status'){const a=db.apps[S(bb.id,40)];if(!a||!a.key||a.key!==String(bb.key||''))return j(404,{e:'لم يُعثر على الطلب'});return j(200,{st:a.st,why:a.why||'',n:a.n,type:a.type,did:a.st>0?a.did:undefined,pin:a.st>0?a.pin:undefined})}
  j(404,{})}catch(e){j(400,{e:'طلب غير صالح'})}});return}
 if(u=='/api/upload'&&q.method=='POST'){const e=X[(q.headers['content-type']||'').split(';')[0].trim()],AT=APT.get(String(q.headers['x-apt']||''));const apu=!!(AT&&AT.exp>Date.now()&&AT.n<20);if(!ok(q.headers)&&!apu){q.resume();return j(401,{e:'انتهت الجلسة'})}if(!e){q.resume();return j(415,{e:'نوع الملف غير مدعوم'})}if(apu&&!ok(q.headers))AT.n++;const LM=['admin','support'].includes(q.headers['x-role'])?LIM:Math.min(LIM,apu?6e7:15e6);if(+q.headers['content-length']>LM){q.resume();return j(413,{e:'الملف كبير'})}const n=cr.randomBytes(16).toString('hex')+'.'+e,fp=path.join(UP,n);let sz=0,bad=0;try{fs.mkdirSync(UP,{recursive:true})}catch(_){}const w=fs.createWriteStream(fp);q.on('data',c=>{sz+=c.length;if(sz>LM&&!bad){bad=1;q.unpipe(w);w.destroy();fs.unlink(fp,()=>{});j(413,{e:'الملف كبير'});q.resume()}});q.pipe(w);w.on('finish',()=>{if(!bad)j(200,{url:'/u/'+n})});w.on('error',()=>{if(!bad){bad=1;j(500,{e:'تعذر حفظ الملف'})}});return}
 if(u.startsWith('/u/')){const n=path.basename(u),m=n.match(/^[a-f0-9]{32}\.(\w+)$/);if(!m||!MT[m[1]]){s.writeHead(404);return s.end()}const p=path.join(UP,n);fs.stat(p,(er,st)=>{if(er){s.writeHead(404);return s.end()}const r=(q.headers.range||'').match(/bytes=(\d*)-(\d*)/);let a=0,b=st.size-1,c=200;if(r){a=r[1]?+r[1]:0;b=r[2]?Math.min(+r[2],b):b;c=206}s.writeHead(c,{'Content-Type':MT[m[1]],'Accept-Ranges':'bytes','Content-Length':b-a+1,'Cache-Control':'private,max-age=86400','X-Content-Type-Options':'nosniff',...(c==206?{'Content-Range':`bytes ${a}-${b}/${st.size}`}:{})});fs.createReadStream(p,{start:a,end:b}).pipe(s)});return}
 const f=path.join(PUB,u=='/'?'customer.html':u);
 if(!f.startsWith(PUB)){s.writeHead(403);return s.end()}
 return serveStatic(q,s,f,SH)
});SRV.keepAliveTimeout=65e3;SRV.headersTimeout=66e3;const LISTEN=()=>SRV.listen(process.env.PORT||3000,()=>console.log('[SERVER] port',process.env.PORT||3000));
if(dbEmpty()&&GHT()&&GHR()){console.log('[RESTORE] البيانات فارغة — أحاول الاستعادة من GitHub…');Promise.race([ghRestoreLatest(),new Promise((_,n)=>setTimeout(()=>n(new Error('timeout')),45000))]).then(r=>console.log('[RESTORE] تمت الاستعادة',JSON.stringify(r))).catch(e=>console.error('[RESTORE] لم تتم:',e.message)).finally(LISTEN)}else LISTEN();

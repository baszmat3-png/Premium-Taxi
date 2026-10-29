const $=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('ar-IQ')+' د.ع';
const FS=['جديد','تحضير','جاهز','بالطريق','سُلّم'],RS=['بانتظار كابتن','قبل الكابتن','وصل','بالرحلة','انتهت'];
const DBD={rests:{},orders:{},rides:{},drivers:{},tickets:{},staff:{},cfg:{base:1500,km:700,min:3000,foodKm:400}};
let AUTH={},KEY='',DB=DBD;
const auth=k=>{KEY='a_'+k;AUTH=JSON.parse(localStorage[KEY]||'null')||{role:k}};
const signin=(role,id,pin)=>{AUTH={role,id,pin};localStorage[KEY]=JSON.stringify(AUTH)};
const logout=()=>{localStorage.removeItem(KEY);location.reload()};
const devId=()=>{try{let d=localStorage.did;if(!/^[\w-]{16,64}$/.test(d||'')){d=(crypto.randomUUID?crypto.randomUUID():[...crypto.getRandomValues(new Uint8Array(16))].map(x=>x.toString(16).padStart(2,'0')).join('')).replace(/-/g,'');localStorage.did=d}return d}catch(e){return''}};
const devMeta=()=>{let tz='';try{tz=Intl.DateTimeFormat().resolvedOptions().timeZone||''}catch(e){}return{id:devId(),scr:screen.width+'x'+screen.height,tz,lang:navigator.language||'',app:window.Capacitor&&Capacitor.isNativePlatform&&Capacitor.isNativePlatform()?1:0}};
const H=()=>({'Content-Type':'application/json','x-role':AUTH.role,'x-id':AUTH.id||'','x-pin':AUTH.pin||'','x-token':AUTH.token||'','x-dev':devId(),'x-ct':String(Date.now())});
/* شاشة حجب: VPN أو وقت الجهاز غير صحيح */
const BM={maint:['🛠️','التطبيق في صيانة','نعود قريبًا.'],vpn:['🛡️','تم اكتشاف VPN أو بروكسي','أوقف الـ VPN ثم اضغط «إعادة المحاولة». التطبيق لا يعمل مع الـ VPN.'],time:['🕒','وقت جهازك غير صحيح','فعّل «التاريخ والوقت التلقائي» من إعدادات الهاتف ثم اضغط «إعادة المحاولة».'],ban:['⛔','تم إيقاف حسابك مؤقتًا','تواصل مع الدعم للاستفسار.']};
function blockUI(c,f){let e=document.getElementById('blk');if(!c){if(e&&(f||e.dataset.c!='maint'))e.remove();return}const m=BM[c];if(!m)return;if(!e){e=document.createElement('div');e.id='blk';e.dataset.c=c;e.style.cssText='position:fixed;inset:0;z-index:99999;background:var(--bg,#fff);color:var(--tx,#111);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:28px;text-align:center';document.body.appendChild(e)}
 e.innerHTML='<div style="font-size:64px">'+m[0]+'</div><b style="font-size:20px">'+m[1]+'</b><div style="opacity:.75;line-height:1.7">'+m[2]+'</div>'+(c=='vpn'&&window.__vd?'<div style="opacity:.5;font-size:12px;direction:ltr">'+window.__vd+'</div>':'')+'<button class="big" style="max-width:260px" onclick="location.reload()">إعادة المحاولة</button>'}
async function chk(r){if(r.status==503){try{const d=await r.clone().json();if(d&&d.c=='maint'){BM.maint[2]=d.e||BM.maint[2];if(AUTH.role=='customer')blockUI('maint');return true}}catch(e){}}if(r.status==403||r.status==409){try{const d=await r.clone().json();if(d&&(d.c=='vpn'||d.c=='time'||d.c=='ban')){if(d.c=='vpn')window.__vd=(d.ip?'IP: '+String(d.ip).replace(/[<>&"]/g,'')+' • ':'')+(d.cn?'الدولة: '+String(d.cn).replace(/[<>&"]/g,'')+' • ':'')+(d.why=='country'?'السبب: دولة الاتصال':'السبب: بروكسي');if(d.c=='ban')BM.ban[2]=String(d.e||BM.ban[2]).replace(/[<>&]/g,'');blockUI(d.c);return true}}catch(e){}}return false}
async function load(){try{const r=await fetch('/api/db',{headers:H()});if(!r.ok){if(await chk(r))return 0;if(r.status==401&&AUTH.role=='customer'&&AUTH.token){localStorage.removeItem('tok');localStorage.removeItem('cid');location.reload()}return 0}blockUI(0);DB={...DBD,...await r.json()};applyVars();return 1}catch(e){return 0}}
async function set(k,id,v){try{const r=await fetch('/api/set',{method:'POST',headers:H(),body:JSON.stringify({k,id,v})});if(!r.ok&&await chk(r))return 0;await load();return r.ok}catch(e){return 0}}
async function act(k,id,v){if(!await set(k,id,v))alert('تعذر تنفيذ العملية. ربما أخذها شخص آخر.');draw()}
/* ===== المتغيرات الفورية: V('الاسم', القيمة الافتراضية) — تُدار من لوحة التحكم > المتغيرات وتصل خلال ثوانٍ ===== */
const V=(k,d)=>{const m=(DB.cfg&&DB.cfg.vars)||DB.vars||{},x=m[k],v=x&&typeof x=='object'?x.v:x;return v==null||v===''?d:v};
function applyVars(){try{const bn=String(V('banner','')).trim();let b=document.getElementById('vbn');
 if(bn){if(!b){b=document.createElement('div');b.id='vbn';b.style.cssText='position:sticky;top:0;z-index:9998;background:#f59e0b;color:#111;text-align:center;font-weight:700;font-size:14px;padding:calc(6px + env(safe-area-inset-top,0px)) 12px 6px';document.body.prepend(b)}if(b.textContent!==bn)b.textContent=bn}else if(b)b.remove();
 if(AUTH.role=='customer'&&+V('maintenance',0)){BM.maint[2]=String(V('maintMsg',BM.maint[2]));blockUI('maint')}else{const e=document.getElementById('blk');if(e&&e.dataset.c=='maint')blockUI(0,1)}}catch(e){}}
let _last='';
const start=fn=>{if(window.draw&&!window.draw.__k){const d0=window.draw;window.draw=function(){return keepScroll(()=>d0.apply(this,arguments))};window.draw.__k=1}
let ld=0,pd=0;const t=async()=>{if(ld){pd=1;return}ld=1;try{if(await load()||!window.__s1){window.__s1=1;const j=JSON.stringify(DB),ch=j!=_last;_last=j;fn(ch)}}finally{ld=0;if(pd){pd=0;t()}}};t();setInterval(t,8000);
try{if(window.EventSource){const es=new EventSource('/api/stream');es.onmessage=()=>setTimeout(t,Math.random()*Math.max(0,+V('jitterMs',700)||0))}}catch(e){}};
const busy=()=>/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
const IC=[[/مندي|كبسة|دجاج|رز|تمن/,'🍛'],[/مشاوي|كباب|تكة|طاووق|لحم/,'🍢'],[/بيتزا/,'🍕'],[/برغر/,'🍔'],[/شاورما|سندويش/,'🌯'],[/سمك|مسكوف|أسماك/,'🐟'],[/حلوي|كنافة|بقلاوة|كيك/,'🍰'],[/قهوة/,'☕'],[/عصير|مشروب|كولا|لبن/,'🥤'],[/سلطة|مقبلات|فلافل/,'🥗'],[/فطور/,'🍳']];
const ico=x=>{const s=[x.n,x.c,x.cat].join(' ');return(IC.find(a=>a[0].test(s))||[0,'🍽️'])[1]};
const pic=x=>`<div class="em">${x.img?`<img alt="" src="${esc(x.img)}">`:ico(x)}</div>`;
const steps=(S,st)=>`<div class="steps">${S.map((s,i)=>`<div class="st ${i<=st?'d':''} ${i==st?'c':''}"><i></i>${s}</div>`).join('')}</div>`;
const mins=s=>{const a=s.split(':');return +a[0]*60+ +a[1]};
function inT(f,t){if(!f||!t)return true;const n=new Date(),m=n.getHours()*60+n.getMinutes(),a=mins(f),b=mins(t);return a==b||(a<b?m>=a&&m<b:m>=a||m<b)}
const rOpen=r=>!!r.open&&!(r.pu>Date.now());
const itOk=(i,r)=>{const c=(r&&r.cs&&r.cs[i.cat||''])||{};return !i.off&&!(i.pu>Date.now())&&inT(i.f,i.t)&&!c.off&&!(c.pu>Date.now())&&inT(c.f,c.t)};
const BG={lat:33.3152,lng:44.3661};
const dist=(a,b)=>{const r=x=>x*Math.PI/180,dl=r(b.lat-a.lat),dg=r(b.lng-a.lng),x=Math.sin(dl/2)**2+Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(dg/2)**2;return 12742*Math.asin(Math.sqrt(x))};
const nav=p=>`https://www.google.com/maps/dir/?api=1&destination=${+p.lat||0},${+p.lng||0}&travelmode=driving`;
const gps=cb=>{if(!navigator.geolocation)return alert('الجهاز لا يدعم تحديد الموقع');let best=null,done=0,w,tm;const fin=()=>{if(done)return;done=1;navigator.geolocation.clearWatch(w);clearTimeout(tm);best?cb(best):alert('فعّل صلاحية الموقع للتطبيق')};tm=setTimeout(fin,8000);w=navigator.geolocation.watchPosition(p=>{const c=p.coords;if(!best||c.accuracy<best.acc)best={lat:c.latitude,lng:c.longitude,acc:c.accuracy};if(c.accuracy<=25)fin()},()=>{if(!best)fin()},{enableHighAccuracy:true,timeout:10000,maximumAge:0})};
function lf(cb){if(window.L)return cb();(window.__lq=window.__lq||[]).push(cb);if(window.__ll)return;window.__ll=1;const c=document.createElement('link');c.rel='stylesheet';c.href='https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';document.head.appendChild(c);const sc=document.createElement('script');sc.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';sc.onload=()=>{window.__mlx=1;window.__lq.forEach(f=>f())};sc.onerror=()=>{window.__ll=0;alert('تعذر تحميل الخريطة. تحقق من الاتصال بالإنترنت')};document.head.appendChild(sc)}
const gm=lf,MI={a:[22,22],b:[22,22],u:[22,22],s:[26,26],c:[40,40]},LB={'أ':'a','ب':'b','ك':'c','م':'s','ز':'u'};
const mkIcon=t=>L.divIcon({className:'mk '+t,html:t=='c'?'🚕':t=='s'?'🍽️':(window.MKLABEL&&(t=='a'||t=='b'))?'<i></i><span class="ml">'+(t=='a'?'الانطلاق':'الوصول')+'</span>':'<i></i>',iconSize:MI[t],iconAnchor:[MI[t][0]/2,MI[t][1]/2]});
function initMap(el,c,z){if(el._m)return el._m;const IQ=L.latLngBounds([28.9,38.6],[37.5,49.1]),m=L.map(el,{center:[c.lat,c.lng],zoom:z||15,zoomControl:false,attributionControl:false,minZoom:6,maxBounds:IQ,maxBoundsViscosity:1});L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,keepBuffer:4,attribution:''}).addTo(m);
el._m=m;setTimeout(()=>m.invalidateSize(),0);el._k={};el._r=L.layerGroup().addTo(m);m.on('moveend',()=>{el._mv&&el._mv(m.getCenter())});new ResizeObserver(()=>m.invalidateSize()).observe(el);return m}
const RC={},RP={};
const fj=async(u,o)=>{o=o||{};if(o.sg&&o.sg.aborted)throw 0;const c=new AbortController(),t=setTimeout(()=>c.abort(),o.t||6000),ab=()=>c.abort();o.sg&&o.sg.addEventListener('abort',ab);try{const r=await fetch(u,{signal:c.signal});if(!r.ok)throw 0;return await r.json()}finally{clearTimeout(t);o.sg&&o.sg.removeEventListener('abort',ab)}};
let NQ=Promise.resolve(),NT=0;
const nom=(p,o)=>{const r=NQ.then(async()=>{if(o&&o.sg&&o.sg.aborted)throw 0;const w=NT+1100-Date.now();if(w>0)await new Promise(f=>setTimeout(f,w));if(o&&o.sg&&o.sg.aborted)throw 0;NT=Date.now();return fj('https://nominatim.openstreetmap.org/'+p,o)});NQ=r.catch(()=>0);return r};
const OSV=['https://router.project-osrm.org/route/v1/driving/','https://routing.openstreetmap.de/routed-car/route/v1/driving/'];
(function(){try{['https://router.project-osrm.org','https://unpkg.com','https://nominatim.openstreetmap.org'].forEach(h=>{const l=document.createElement('link');l.rel='preconnect';l.href=h;l.crossOrigin='';document.head.appendChild(l)})}catch(e){}})();
function osrm(a,b){const k=[a,b].map(p=>p.lat.toFixed(3)+','+p.lng.toFixed(3)).join('|');if(RC[k])return Promise.resolve(RC[k]);if(RP[k])return RP[k];const q=`${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
 return RP[k]=Promise.any(OSV.map(u=>fj(u+q,{t:7000}).then(j=>{if(!j.routes||!j.routes[0])throw 0;return j.routes[0]}))).then(x=>RC[k]={km:x.distance/1000,min:Math.max(1,Math.round(x.duration/60)),line:x.geometry.coordinates.map(c=>[c[1],c[0]])}).catch(()=>{const d=dist(a,b)*1.35;return{km:d,min:Math.max(1,Math.round(d/28*60)),line:[[a.lat,a.lng],[b.lat,b.lng]],est:1}}).finally(()=>{delete RP[k]})}
const eta=(a,b)=>a&&b?{km:dist(a,b)*1.35,min:Math.max(1,Math.round(dist(a,b)*1.35/28*60))}:null;
function showMap(el,pts,opt){opt=opt||{};lf(()=>{const P=pts.filter(x=>x.p),m=initMap(el,P[0]?P[0].p:BG,14);m.invalidateSize();const keep={};
P.forEach(x=>{const t=LB[x.l]||'a';keep[x.l]=1;let k=el._k[x.l];if(!k)k=el._k[x.l]=L.marker([x.p.lat,x.p.lng],{icon:mkIcon(t),title:x.t||'',zIndexOffset:t=='c'?1000:0}).addTo(m);else k.setLatLng([x.p.lat,x.p.lng])});
Object.keys(el._k).forEach(id=>{if(!keep[id]){m.removeLayer(el._k[id]);delete el._k[id]}});
const fk=P.filter(x=>x.l!='ك').map(x=>x.l+x.p.lat.toFixed(4)+x.p.lng.toFixed(4)).join('|')+(opt.pb||0)+'/'+P.length;
if(el._fk!==fk&&P.length){el._fk=fk;const b=L.latLngBounds(P.map(x=>[x.p.lat,x.p.lng]));P.length==1?(m.setView(b.getCenter(),Math.max(m.getZoom(),15)),opt.pb&&m.panBy([0,opt.pb/2],{animate:false})):m.fitBounds(b,{paddingTopLeft:[40,opt.pt||90],paddingBottomRight:[40,(opt.pb||0)+40],maxZoom:17})}
if(opt.route&&P.length>1){const tk=el._t=(el._t||0)+1,pr=[];for(let i=0;i<P.length-1;i++)pr.push(osrm(P[i].p,P[i+1].p));Promise.all(pr).then(R=>{if(tk!=el._t)return;el._r.clearLayers();R.forEach(r=>{if(!r)return;L.polyline(r.line,{color:'#fff',weight:10,opacity:.95}).addTo(el._r);L.polyline(r.line,{color:'#2b44ff',weight:6,opacity:.95,lineCap:'round',dashArray:r.est?'4 12':null}).addTo(el._r)});opt.onRoute&&opt.onRoute(R)})}else{el._t=(el._t||0)+1;el._r.clearLayers()}})}
function pinMode(el,t,cb,at){lf(()=>{const m=initMap(el,at||BG,16);if(!el._pin){el._pin=document.createElement('div');el.appendChild(el._pin)}el._pin.className='cpin '+(t||'a');el._pin.innerHTML='<i></i><u></u>';el._pin.hidden=!t;el._mv=t?cb:null;if(t){const p=at||BG,go=()=>{m.invalidateSize();m.setView([p.lat,p.lng],16,{animate:false})};go();cb&&cb(m.getCenter());[300,900,2200].forEach(d=>setTimeout(()=>{if(el._pin&&!el._pin.hidden&&m.getZoom()<12){go();cb&&cb(m.getCenter())}},d))}})}
function mapPick(el,init,onSet,pre){const c={cur:'a',pos:{}};lf(()=>{const m=initMap(el,init,15),K={};c.map=m;c.put=(k,p)=>{c.pos[k]=p;if(!K[k]){K[k]=L.marker([p.lat,p.lng],{icon:mkIcon(k),draggable:true}).addTo(m);K[k].on('dragend',e=>{const q=e.target.getLatLng();c.pos[k]={lat:q.lat,lng:q.lng};onSet(c.pos)})}K[k].setLatLng([p.lat,p.lng]);m.panTo([p.lat,p.lng])};m.on('click',e=>{c.put(c.cur,{lat:e.latlng.lat,lng:e.latlng.lng});onSet(c.pos)});if(pre)for(const k in pre)if(pre[k])c.put(k,pre[k])});return c}
const GE=(()=>{try{return JSON.parse(localStorage.ge||'{}')}catch(e){return{}}})(),GF={};let GS=null;
async function geoRev(p){const k=p.lat.toFixed(4)+','+p.lng.toFixed(4);if(GE[k])return GE[k];try{const j=await nom(`reverse?format=jsonv2&accept-language=ar&zoom=18&addressdetails=1&lat=${p.lat}&lon=${p.lng}`,{t:8000}),a=j.address||{},t=[a.road||a.pedestrian||a.neighbourhood||a.hamlet,a.suburb||a.neighbourhood||a.city_district||a.city||a.town||a.village].filter((x,i,A)=>x&&A.indexOf(x)==i).join('، ')||(j.display_name||'').split(',').slice(0,2).join('،');if(!t)return'موقع على الخريطة';GE[k]=t;try{const ks=Object.keys(GE);if(ks.length>300)delete GE[ks[0]];localStorage.ge=JSON.stringify(GE)}catch(e){}return t}catch(e){return'موقع على الخريطة'}}
async function geoFind(q,near){q=String(q||'').trim();const k=q+'|'+(near?near.lat.toFixed(2)+','+near.lng.toFixed(2):'');if(GF[k])return GF[k];if(GS)GS.abort();const sg=(GS=new AbortController()).signal,uniq=a=>a.filter((y,i,A)=>y&&A.indexOf(y)==i);
 const A=(async()=>{const v=near?`&viewbox=${near.lng-.6},${near.lat+.5},${near.lng+.6},${near.lat-.5}`:'';const j=await nom(`search?format=jsonv2&accept-language=ar&countrycodes=iq&addressdetails=1&dedupe=1&limit=8${v}&q=${encodeURIComponent(q)}`,{sg,t:8000});return j.map(x=>{const a=x.address||{},rd=a.road||a.pedestrian||'',ar=a.suburb||a.neighbourhood||a.city_district||'',ct=a.city||a.town||a.village||a.state||'';return{n:x.name||rd||x.display_name.split(',')[0],a:uniq([rd&&rd!=x.name?rd:'',ar,ct]).join('، ')||x.display_name.split(',').slice(0,3).join('،'),lat:+x.lat,lng:+x.lon}})})().catch(()=>[]);
 const B=(async()=>{const u='https://photon.komoot.io/api/?limit=10&q='+encodeURIComponent(q)+(near?`&lat=${near.lat}&lon=${near.lng}&location_bias_scale=0.7`:'');const j=await fj(u,{sg,t:6000});return(j.features||[]).filter(f=>f.geometry&&(f.properties.countrycode||'')=='IQ').map(f=>{const o=f.properties||{},c=f.geometry.coordinates;return{n:o.name||o.street||o.district||o.city||'',a:uniq([o.street&&o.street!=o.name?o.street:'',o.district||o.locality||'',o.city||o.county||o.state||'']).join('، '),lat:+c[1],lng:+c[0]}}).filter(x=>x.n)})().catch(()=>[]);
 try{const[R1,R2]=await Promise.all([A,B]);if(sg.aborted)return[];const nq=fnorm(q),M=[];for(const x of[...R2,...R1]){if(!isFinite(x.lat)||!isFinite(x.lng))continue;if(M.some(y=>dist(y,x)<.05||(fnorm(y.n)==fnorm(x.n)&&dist(y,x)<.6)))continue;M.push(x)}
  M.forEach(x=>{x.km=near?dist(near,x):0;const n=fnorm(x.n);x.s=x.km-(n==nq?6:n.startsWith(nq)?3:n.includes(nq)?1:0)});M.sort((a,b)=>a.s-b.s);const R=M.slice(0,8);if(R.length)GF[k]=R;return R}catch(e){return[]}}
const fnorm=s=>String(s||'').toLowerCase().replace(/[\u064B-\u0652\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\w\u0600-\u06FF ]/g,'').trim();
let _ac=null;document.addEventListener('click',()=>{try{_ac=_ac||new(window.AudioContext||webkitAudioContext)();_ac.resume()}catch(e){}});
function ring(n){n=n||3;try{_ac=_ac||new(window.AudioContext||webkitAudioContext)();for(let i=0;i<n;i++)[880,1175].forEach((f,j)=>{const o=_ac.createOscillator(),g=_ac.createGain(),t=_ac.currentTime+i*.7+j*.22;o.type='sine';o.frequency.value=f;o.connect(g);g.connect(_ac.destination);g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.5,t+.03);g.gain.exponentialRampToValueAtTime(.001,t+.2);o.start(t);o.stop(t+.22)})}catch(e){}navigator.vibrate&&navigator.vibrate([300,120,300])}
const fm=n=>Number(n||0).toLocaleString('en-US')+' دينار',hrs=t=>new Date(t).toLocaleString('ar-IQ',{weekday:'long',hour:'numeric',minute:'2-digit'});
function keepScroll(fn){const S=['.tabs','.bn','.chips','.cg','.rq'],p=S.map(s=>[...document.querySelectorAll(s)].map(e=>e.scrollLeft)),y=scrollY,r=fn();S.forEach((s,i)=>document.querySelectorAll(s).forEach((e,j)=>{if(p[i][j])e.scrollLeft=p[i][j]}));scrollTo(0,y);return r}
function imgPick(file,cb,mx=480){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,mx/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.8))};i.src=r.result};r.readAsDataURL(file)}

(()=>{const TH=[['','تلقائي','#0f766e'],['emerald','زمرد','#059669'],['sunset','غروب','#ea580c'],['ocean','محيط','#0284c7'],['royal','ملكي','#7c3aed'],['rose','وردي','#e11d48'],['night','ليلي','#a3e635']],d=document.documentElement;
const ap=t=>{t?d.dataset.theme=t:delete d.dataset.theme;try{localStorage.theme=t}catch(e){}setTimeout(()=>{let m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=getComputedStyle(d).getPropertyValue('--bg').trim()||'#fff'},50)};
let cur='';
const TG={'جديد':'w','بانتظار كابتن':'w','تحضير':'i','قبل الكابتن':'i','وصل':'i','جاهز':'k','بالطريق':'k','بالرحلة':'k','سُلّم':'s','انتهت':'s','ملغي':'x','ملغية':'x','تعيين تلقائي':'k'};
const tg=()=>document.querySelectorAll('.tag:not([data-c])').forEach(e=>{e.dataset.c=1;const c=TG[e.textContent.trim()];if(c)e.classList.add(c)});
addEventListener('DOMContentLoaded',()=>{
 const f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap';document.head.appendChild(f);
 const tb=document.createElement('header');tb.className='tb';tb.innerHTML='<b><i>'+(/كابتن/.test(document.title)?'🚕':/تحكم/.test(document.title)?'📊':'🍽️')+'</i>'+esc(document.title.split(' - ')[1]||document.title)+'</b><button aria-label="المظهر">🎨</button>';
 document.body.prepend(tb);
 tb.querySelector('button').onclick=()=>{if(window.openThemes)return openThemes();const s=document.createElement('div');s.className='sheet';s.innerHTML='<div><b style="font-size:18px">مظهر التطبيق</b><div class="mu">اختر الثيم الذي يناسبك</div><div class="sw">'+TH.map(t=>`<button data-t="${t[0]}" class="${t[0]==cur?'a':''}"><i style="background:${t[2]}"></i>${t[1]}</button>`).join('')+'</div></div>';
  s.onclick=e=>{const b=e.target.closest('button');if(b){cur=b.dataset.t;ap(cur);s.querySelectorAll('button').forEach(x=>x.classList.toggle('a',x==b));return}if(e.target==s)s.remove()};document.body.appendChild(s)};
 new MutationObserver(tg).observe(document.body,{childList:true,subtree:true});tg()})})();

async function upl(file,mx){let b=file;if((file.type||'').startsWith('image/'))b=await new Promise(r=>imgPick(file,d=>fetch(d).then(x=>x.blob()).then(r),mx||1280));const r=await fetch('/api/upload',{method:'POST',headers:{...H(),'Content-Type':b.type||file.type||(/\.mov$/i.test(file.name||'')?'video/quicktime':'video/mp4')},body:b});if(!r.ok){await chk(r);throw r.status}return(await r.json()).url}

/* ===== استيراد الأصناف والأقسام ===== */
const _en=s=>String(s==null?'':s).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c)).replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/٫/g,'.').replace(/٬/g,',');
function parsePrice(v){let s=_en(v).replace(/[^0-9.,]/g,'').replace(/^[.,]+|[.,]+$/g,'');if(!s)return NaN;if(/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))s=s.replace(/,/g,'');else if(/^\d{1,3}(\.\d{3})+$/.test(s))s=s.replace(/\./g,'');else s=s.replace(',','.');const n=Math.round(parseFloat(s));return n>=0?n:NaN}
function csvRows(t,d){const R=[];let r=[],c='',q=0;for(let i=0;i<t.length;i++){const h=t[i];if(q){if(h=='"'){if(t[i+1]=='"'){c+='"';i++}else q=0}else c+=h}else if(h=='"'&&!c.trim())q=1;else if(h==d){r.push(c);c=''}else if(h=='\n'||h=='\r'){if(h=='\r'&&t[i+1]=='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()))R.push(r);r=[]}else c+=h}r.push(c);if(r.some(x=>x.trim()))R.push(r);return R}
const _HM=[['n',/^(الاسم|اسم|اسم الصنف|اسم المنتج|الصنف|المنتج|name|item|product|title)$/i],['p',/^(السعر|سعر|price|cost|amount)$/i],['cat',/^(القسم|الفئه|الفئة|التصنيف|category|section|cat|group)$/i],['d',/^(الوصف|التفاصيل|تفاصيل|وصف|description|details|desc)$/i]];
function parseMenu(txt){txt=String(txt||'').replace(/^\uFEFF/,'').trim();const out=[];let bad=0;if(!txt)return{items:out,bad};
 if(/^[\[{]/.test(txt)){try{const j=JSON.parse(txt),walk=(a,cat)=>a.forEach(x=>{if(!x||typeof x!='object')return;const it=x.items||x.products||x['الأصناف']||x['الاصناف']||x['المنتجات'],nm=x.name||x.n||x.title||x['الاسم']||x['اسم'];if(Array.isArray(it))walk(it,x.category||x.cat||nm||cat);else{const p=parsePrice(x.price!=null?x.price:x.p!=null?x.p:x['السعر']);if(!nm||isNaN(p))bad++;else out.push({n:String(nm).trim(),p,d:String(x.description||x.d||x.desc||x['الوصف']||'').trim(),cat:String(x.category||x.cat||x['القسم']||cat||'').trim()})}});
  if(Array.isArray(j))walk(j,'');else{const L=j.categories||j.sections||j.menu||j.items||j.products||j['الأقسام']||j['الاقسام'];if(Array.isArray(L))walk(L,'');else Object.entries(j).forEach(([k,v])=>Array.isArray(v)&&walk(v,k))}return{items:out,bad}}catch(e){return{items:out,bad:1,err:'ملف JSON غير صالح'}}}
 const l0=txt.split(/\r?\n/)[0],dl=['\t',';',','].map(d=>[d,l0.split(d).length]).sort((a,b)=>b[1]-a[1])[0],D=dl[1]>1?dl[0]:'\t',rows=csvRows(txt,D);if(!rows.length)return{items:out,bad};
 const hd=rows[0].map(x=>{x=_en(x).trim().replace(/\s+/g,' ');const m=_HM.find(h=>h[1].test(x));return m?m[0]:''}),hasH=hd.includes('n')&&hd.includes('p'),col=hasH?hd:['n','p','cat','d'];let cat='';
 rows.slice(hasH?1:0).forEach(r=>{const o={};r.forEach((c,i)=>{if(col[i]&&!(col[i] in o))o[col[i]]=String(c).trim()});const nm=o.n||'',pr=parsePrice(o.p);
  if(nm&&(o.p===''||o.p==null)&&!o.d&&!o.cat){cat=nm;return}
  if(!nm||isNaN(pr)){if(r.some(x=>String(x).trim()))bad++;return}out.push({n:nm,p:pr,d:o.d||'',cat:o.cat||cat})});
 return{items:out,bad}}
async function readTxt(f){const b=await f.arrayBuffer();try{return new TextDecoder('utf-8',{fatal:true}).decode(b)}catch(e){try{return new TextDecoder('windows-1256').decode(b)}catch(_){return new TextDecoder().decode(b)}}}
/* محلل نصوص حرة (بدون ذكاء اصطناعي): "برغر لحم .... 5000" والأسطر بلا سعر = قسم أو وصف */
function parseFree(txt){const out=[];let cat='',last=null,bad=0;
 const dec=s=>s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,'').trim();
 for(let raw of String(txt||'').split(/\r?\n/)){raw=_en(raw).replace(/[‎‏‪-‮]/g,'').trim();if(!raw){last=null;continue}
  const m=raw.match(/^(.*?\S)[\s.\-–—:·…_|]+(\d[\d.,]*)\s*(?:(ألف|الف|الاف|آلاف|k)|(?:د\.?\s?ع|دينار|iqd))?\s*$/i);
  if(m){let p=parsePrice(m[2]);const n=dec(m[1]);if(isNaN(p)||p>5e6||/^\d{8,}$/.test(m[2])||!/[؀-ۿa-zA-Z]/.test(n)){bad++;continue}if(m[3]&&p<1000)p*=1000;const it={cat,n:n.slice(0,80),p,d:''};out.push(it);last=it;continue}
  const t=dec(raw);if(!t)continue;const deco=/^[\s=\-*#_~•]{2,}|[=\-*#_~]{2,}\s*$|:\s*$|^#/.test(raw),words=t.split(/\s+/).length;
  if(!last||deco||(words<=2&&t.length<=25)){if(t.length<=60&&!/\d{4,}/.test(t)){cat=t.slice(0,60);last=null}else bad++}
  else last.d=((last.d?last.d+' ':'')+t).slice(0,500)}
 return{items:out,bad}}
const _nk=s=>String(s||'').replace(/[ً-ْـ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim().toLowerCase();
const _b64=f=>new Promise((ok,no)=>{const r=new FileReader();r.onload=()=>ok(String(r.result).split(',')[1]||'');r.onerror=no;r.readAsDataURL(f)});
const _shrink=(f,mx)=>new Promise((ok,no)=>{const r=new FileReader();r.onerror=no;r.onload=()=>{const i=new Image();i.onerror=()=>no(new Error('img'));i.onload=()=>{const k=Math.min(1,mx/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0,c.width,c.height);ok(c.toDataURL('image/jpeg',.86).split(',')[1])};i.src=r.result};r.readAsDataURL(f)});
async function aiMenuCall(rid,files,text){const fl=[];let tot=0;
 for(const f of files){if(f.type=='application/pdf'){if(f.size>9e6)throw new Error('ملف PDF كبير (الحد 9MB)');fl.push({mime:'application/pdf',data:await _b64(f)})}else if(/^image\//.test(f.type)||/\.(jpe?g|png|webp|heic)$/i.test(f.name||'')){try{fl.push({mime:'image/jpeg',data:await _shrink(f,2000)})}catch(e){throw new Error('تعذر قراءة الصورة «'+(f.name||'')+'». استخدم JPG أو PNG.')}}else throw new Error('نوع الملف غير مدعوم: '+(f.name||''));tot+=fl[fl.length-1].data.length}
 if(tot>16e6)throw new Error('الملفات كبيرة جدًا، قلّل عدد الصور');
 const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),135000);
 try{const r=await fetch('/api/menu-ai',{method:'POST',headers:H(),body:JSON.stringify({rid,files:fl,text:text||''}),signal:ac.signal});
  if(!r.ok){if(await chk(r))throw new Error('');let m='';try{m=(await r.json()).e}catch(e){}throw new Error(m||'تعذر تحليل المنيو (رمز '+r.status+')')}
  return await r.json()}catch(e){if(e.name=='AbortError')throw new Error('انتهت مهلة التحليل، جرّب صورة أصغر أو أقل عددًا');throw e}finally{clearTimeout(tm)}}
function menuImport(rid,done){rid=rid||AUTH.id;const s=document.createElement('div');s.className='sheet';let items=[],busy=0,kOn=0;
 const ex0=()=>((window.DB&&DB.rests&&DB.rests[rid])||{}).items||[];
 s.innerHTML=`<div style="max-height:92vh;overflow:auto"><b style="font-size:18px">⬆ استيراد المنيو</b>
 <div class="card" style="margin:10px 0;border:1.5px solid var(--pr)"><b>🤖 استيراد ذكي بالذكاء الاصطناعي</b><div class="mu" style="margin:4px 0 8px">صوّر المنيو أو ارفع صورته أو ملف PDF (يمكن اختيار عدة صور). يقرأ النظام الأقسام والأصناف والأسعار والوصف تلقائيًا، وتراجعها وتعدّلها قبل الإضافة.</div>
 <label class="big" style="display:block;text-align:center;cursor:pointer;padding:14px;border-radius:14px;background:var(--pr);color:#fff;font-weight:800">📷 اختيار صور المنيو أو PDF<input class="ai" type="file" accept="image/*,application/pdf" multiple style="display:none"></label><div class="st mu" style="margin-top:8px"></div></div>
 <div class="mu" style="margin:8px 0">أو ملف CSV / JSON (من إكسل: حفظ باسم CSV UTF-8) أو الصق الجدول/النص مباشرة (الأعمدة: القسم، الاسم، السعر، الوصف، ويُفهم أيضًا النص الحر مثل «برغر لحم .... 5000»).</div>
 <input class="fi" type="file" accept=".csv,.tsv,.txt,.json,text/*,application/json"><textarea rows="4" placeholder="أو الصق الأصناف هنا"></textarea>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px"><button class="l aitx" disabled>🤖 تحليل النص بالذكاء الاصطناعي</button><button class="l ex">إدراج مثال</button></div>
 <div class="rv" hidden><label style="display:flex;align-items:center;gap:8px;margin:6px 0"><input class="kk" type="checkbox"> <span>الأسعار مكتوبة بالآلاف (5 ← 5000)</span></label><div class="pv mu" style="margin:6px 0"></div><datalist id="dlc"></datalist><div class="ls"></div></div>
 <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button class="go" disabled style="flex:1">استيراد الآن</button><button class="l cl">إغلاق</button></div></div>`;
 const $q=x=>s.querySelector(x),ta=$q('textarea'),pv=$q('.pv'),go=$q('.go'),ls=$q('.ls'),rv=$q('.rv'),st=$q('.st'),kk=$q('.kk'),aib=$q('.aitx');
 const stat=(h,c)=>{st.innerHTML=h;st.style.color=c||''};
 const badge=i=>{const o=ex0().find(x=>_nk(x.cat)==_nk(i.cat)&&_nk(x.n)==_nk(i.n));return !o?['جديد','on']:(+o.p!=+i.p?['تحديث السعر','']:['موجود','mu'])};
 const sum=()=>{const g={};items.forEach(i=>{const c=i.cat||'بدون قسم';g[c]=(g[c]||0)+1});const bad=items.filter(i=>!i.n||!(i.p>=0)).length;
  pv.innerHTML=items.length?`<b class="on">✔ ${items.length} صنف في ${Object.keys(g).length} قسم</b>${bad?` <span class="off">• ${bad} صنف ناقص الاسم/السعر سيُتجاهل</span>`:''}<div>${Object.entries(g).map(([k,v])=>esc(k)+' ('+v+')').join(' • ')}</div>`:'';
  const n=items.filter(i=>i.n&&i.p>=0).length;go.disabled=!n||busy;go.textContent=n?'استيراد '+n+' صنف الآن':'استيراد الآن';
  $q('#dlc').innerHTML=[...new Set([...items.map(i=>i.cat),...ex0().map(i=>i.cat)].filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('')};
 const draw=()=>{rv.hidden=!items.length;kk.checked=!!kOn;
  ls.innerHTML=items.map((i,x)=>{const b=badge(i);return `<div class="card" data-x="${x}" style="margin:6px 0;padding:10px"><div style="display:flex;gap:6px;align-items:center"><input class="in" value="${esc(i.n)}" placeholder="اسم الصنف" style="margin:0;flex:1"><span class="bd ${b[1]}" style="font-size:12px;white-space:nowrap;font-weight:700">${b[0]}</span></div><div style="display:flex;gap:6px;margin-top:6px"><input class="ic" list="dlc" value="${esc(i.cat)}" placeholder="القسم" style="margin:0;flex:1.3"><input class="ip" type="number" inputmode="numeric" min="0" value="${i.p}" style="margin:0;flex:1"><button class="l rm" style="min-width:44px;padding:0 10px;margin:0">✕</button></div>${i.d?`<input class="id" value="${esc(i.d)}" placeholder="الوصف" style="margin:6px 0 0">`:''}</div>`}).join('');sum()};
 ls.oninput=e=>{const c=e.target.closest('[data-x]');if(!c)return;const i=items[+c.dataset.x],t=e.target.className;if(t.includes('in'))i.n=e.target.value;else if(t.includes('ic'))i.cat=e.target.value;else if(t.includes('ip'))i.p=Math.round(+e.target.value);else if(t.includes('id'))i.d=e.target.value;
  const b=badge(i),sp=c.querySelector('.bd');sp.textContent=b[0];sp.className='bd '+b[1];sum()};
 ls.onclick=e=>{const r=e.target.closest('.rm');if(!r)return;items.splice(+r.closest('[data-x]').dataset.x,1);draw()};
 kk.onchange=()=>{kOn=kk.checked?1:0;items.forEach(i=>{if(kOn&&!i._k&&i.p<1000){i.p*=1000;i._k=1}else if(!kOn&&i._k){i.p=Math.round(i.p/1000);i._k=0}});draw()};
 const setItems=(a,k)=>{items=a.map(x=>({cat:String(x.cat||''),n:String(x.n||''),p:Math.round(+x.p),d:String(x.d||''),_k:0}));kOn=0;if(k){items.forEach(i=>{if(i.p<1000){i.p*=1000;i._k=1}});kOn=1}draw()};
 const run=txt=>{let r=parseMenu(txt);if(txt.trim()&&!/^[\[{]/.test(txt.trim())&&r.items.length<=r.bad){const f=parseFree(txt);if(f.items.length>r.items.length)r=f}
  const k=r.items.length&&r.items.every(i=>i.p<1000)?1:0;setItems(r.items,k);aib.disabled=!txt.trim();
  if(r.err)pv.innerHTML=`<b class="off">${esc(r.err)}</b>`,rv.hidden=0;else if(!items.length&&txt.trim()){rv.hidden=0;pv.innerHTML='<b class="off">لم يُعثر على أصناف بأسعار. جرّب «تحليل النص بالذكاء الاصطناعي» أو الصور.</b>'}
  else if(r.bad)pv.insertAdjacentHTML('beforeend',` <span class="off">• تم تجاهل ${r.bad} سطر</span>`)};
 const ai=async(files,text)=>{if(busy)return;busy=1;go.disabled=true;aib.disabled=true;stat('<span class="spin">⏳</span> جارٍ قراءة المنيو بالذكاء الاصطناعي… قد يستغرق حتى دقيقة.');
  try{const r=await aiMenuCall(rid,files,text);setItems(r.items,r.k);stat(`✔ تمت القراءة: ${r.items.length} صنف. راجعها وعدّل ما تريد ثم اضغط استيراد.${r.truncated?' <b class="off">المنيو طويل وقد يكون جزء منه لم يُقرأ؛ ارفع الصفحات المتبقية بشكل منفصل.</b>':''}${r.notes?'<div class="mu">ملاحظة: '+esc(r.notes)+'</div>':''}`,'');rv.scrollIntoView({behavior:'smooth',block:'nearest'})}
  catch(e){stat('✖ '+esc(e.message||'تعذر التحليل'),'#e8412c')}finally{busy=0;aib.disabled=!ta.value.trim();sum()}};
 $q('.ai').onchange=e=>{const f=[...e.target.files];e.target.value='';if(f.length)ai(f,'')};
 aib.onclick=()=>ai([],ta.value);
 $q('.fi').onchange=async e=>{const f=e.target.files[0];if(!f)return;const t=await readTxt(f);ta.value=t;run(t)};
 ta.oninput=()=>run(ta.value);
 $q('.ex').onclick=()=>{ta.value='القسم\tالاسم\tالسعر\tالوصف\nبرغر\tتشيز برغر\t5000\tلحم مشوي مع جبن\nبرغر\tدجاج كرسبي\t4500\t\nمشروبات\tكولا\t1000\t';run(ta.value)};
 $q('.cl').onclick=()=>s.remove();s.onclick=e=>{if(e.target==s&&!busy)s.remove()};
 go.onclick=async()=>{const send=items.filter(i=>i.n.trim()&&i.p>=0).map(i=>({cat:i.cat.trim(),n:i.n.trim(),p:i.p,d:i.d||''}));if(!send.length)return;go.disabled=true;go.textContent='جارٍ الاستيراد…';
  try{const r=await fetch('/api/menu',{method:'POST',headers:H(),body:JSON.stringify({op:'import',rid,items:send})});if(!r.ok)throw 0;const j=await r.json();await load();s.remove();alert(`تم الاستيراد ✔\nأصناف جديدة: ${j.add}\nأصناف حُدِّثت: ${j.upd}${j.skip?'\nمتجاهَلة: '+j.skip:''}\nالإجمالي: ${j.total}`);done&&done();window.draw&&draw()}catch(e){go.disabled=false;go.textContent='إعادة المحاولة';alert('تعذر الاستيراد. تحقق من الاتصال والبيانات.')}};
 document.body.appendChild(s)}

/* ===== تتبّع مباشر + وقت الوصول + مشاركة الوجهة ===== */
function setEta(el,t){if(!el)return;let b=el._eta;if(!b){b=el._eta=document.createElement('div');b.style.cssText='position:absolute;left:50%;transform:translateX(-50%);z-index:1000;max-width:92%;background:#fff;color:#111;border-radius:14px;padding:8px 14px;font-weight:700;font-size:14px;box-shadow:0 4px 14px #0004;text-align:center;pointer-events:none';el.appendChild(b)}b.style.top=el.id=='tmap'?'72px':'10px';b.hidden=!t;b.textContent=t||''}
const etaClock=m=>new Date(Date.now()+m*6e4).toLocaleTimeString('ar-IQ',{hour:'numeric',minute:'2-digit'});
const etaTxt=m=>m<=1?'يصل خلال أقل من دقيقة':'يصل خلال '+m+' دقيقة • الساعة '+etaClock(m);
function shareDest(lat,lng,name){lat=+lat;lng=+lng;if(!Number.isFinite(lat)||!Number.isFinite(lng))return alert('لا توجد نقطة لمشاركتها');
 const w=`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`,g=`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,tx=(name||'نقطة الوصول')+': '+g;
 const o=document.createElement('div');o.style.cssText='position:fixed;inset:0;z-index:99999;background:#0007;display:flex;align-items:flex-end;justify-content:center';
 const b=(t,f)=>{const e=document.createElement('button');e.textContent=t;e.style.cssText='display:block;width:100%;padding:14px;margin-top:8px;border:0;border-radius:14px;background:#f2f3f7;color:#111;font:700 16px inherit;font-family:inherit';e.onclick=()=>{f();o.remove()};return e};
 const c=document.createElement('div');c.style.cssText='background:#fff;color:#111;width:100%;max-width:560px;border-radius:24px 24px 0 0;padding:16px 16px calc(16px + env(safe-area-inset-bottom,0px));direction:rtl';
 c.innerHTML='<div style="text-align:center;font-weight:800;font-size:17px;margin-bottom:4px">📍 '+(name||'نقطة الوصول')+'</div><div style="text-align:center;color:#666;font-size:13px">اختر التطبيق الذي تريد فتح المسار الدقيق فيه</div>';
 c.append(b('🚙 فتح في Waze',()=>window.open(w,'_blank')),b('🗺️ فتح في خرائط Google',()=>window.open(g,'_blank')),b('📤 مشاركة عبر أي تطبيق',()=>{navigator.share?navigator.share({title:name||'نقطة الوصول',text:tx,url:g}).catch(()=>{}):window.open('https://wa.me/?text='+encodeURIComponent(tx),'_blank')}),b('📋 نسخ الرابط',()=>{navigator.clipboard?navigator.clipboard.writeText(g).then(()=>alert('تم نسخ الرابط')):prompt('انسخ الرابط',g)}),b('إغلاق',()=>{}));
 o.onclick=e=>{if(e.target==o)o.remove()};o.appendChild(c);document.body.appendChild(o)}

try{if('serviceWorker' in navigator&&location.protocol=='https:')addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}))}catch(e){}

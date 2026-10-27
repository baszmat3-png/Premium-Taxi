const $=s=>document.querySelector(s),esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n||0).toLocaleString('ar-IQ')+' د.ع';
const FS=['جديد','تحضير','جاهز','بالطريق','سُلّم'],RS=['بانتظار كابتن','قبل الكابتن','وصل','بالرحلة','انتهت'];
const DBD={rests:{},orders:{},rides:{},drivers:{},tickets:{},staff:{},cfg:{base:1500,km:700,min:3000,foodKm:400}};
let AUTH={},KEY='',DB=DBD;
const auth=k=>{KEY='a_'+k;AUTH=JSON.parse(localStorage[KEY]||'null')||{role:k}};
const signin=(role,id,pin)=>{AUTH={role,id,pin};localStorage[KEY]=JSON.stringify(AUTH)};
const logout=()=>{localStorage.removeItem(KEY);location.reload()};
const H=()=>({'Content-Type':'application/json','x-role':AUTH.role,'x-id':AUTH.id||'','x-pin':AUTH.pin||'','x-token':AUTH.token||''});
async function load(){try{const r=await fetch('/api/db',{headers:H()});if(!r.ok){if(r.status==401&&AUTH.role=='customer'&&AUTH.token){localStorage.removeItem('tok');location.reload()}return 0}DB={...DBD,...await r.json()};return 1}catch(e){return 0}}
async function set(k,id,v){try{const r=await fetch('/api/set',{method:'POST',headers:H(),body:JSON.stringify({k,id,v})});await load();return r.ok}catch(e){return 0}}
async function act(k,id,v){if(!await set(k,id,v))alert('تعذر تنفيذ العملية. ربما أخذها شخص آخر.');draw()}
const start=fn=>{load().then(fn);setInterval(()=>load().then(fn),3000)};
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
const nav=p=>`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&travelmode=driving`;
const gps=cb=>navigator.geolocation?navigator.geolocation.getCurrentPosition(p=>cb({lat:p.coords.latitude,lng:p.coords.longitude}),()=>alert('فعّل صلاحية الموقع للتطبيق'),{enableHighAccuracy:true,timeout:10000}):alert('الجهاز لا يدعم تحديد الموقع');
function gm(cb){if(window.google&&google.maps)return cb();(window.__q=window.__q||[]).push(cb);if(window.__l)return;window.__l=1;window.__g=()=>window.__q.forEach(f=>f());const s=document.createElement('script');s.src='https://maps.googleapis.com/maps/api/js?key='+(window.GKEY||'')+'&language=ar&callback=__g';s.onerror=()=>alert('تعذر تحميل خرائط جوجل. تحقق من GOOGLE_MAPS_KEY');document.head.appendChild(s)}
function mapPick(el,init,onSet,pre){const c={cur:'a',pos:{}};gm(()=>{const m=new google.maps.Map(el,{center:init,zoom:15,disableDefaultUI:true,zoomControl:true,gestureHandling:'greedy'}),K={};
 c.put=(k,p)=>{c.pos[k]=p;if(!K[k]){K[k]=new google.maps.Marker({map:m,label:k=='a'?'أ':'ب',draggable:true});K[k].addListener('dragend',e=>{c.pos[k]={lat:e.latLng.lat(),lng:e.latLng.lng()};onSet(c.pos)})}K[k].setPosition(p);m.panTo(p)};
 m.addListener('click',e=>{c.put(c.cur,{lat:e.latLng.lat(),lng:e.latLng.lng()});onSet(c.pos)});
 if(pre)for(const k in pre)if(pre[k])c.put(k,pre[k])});return c}
function showMap(el,pts){const key=JSON.stringify(pts);if(el._s==key)return;el._s=key;gm(()=>{const m=el._m||(el._m=new google.maps.Map(el,{center:BG,zoom:13,disableDefaultUI:true,zoomControl:true,gestureHandling:'greedy'}));(el._k||[]).forEach(k=>k.setMap(null));el._k=[];const b=new google.maps.LatLngBounds();pts.filter(x=>x.p).forEach(x=>{el._k.push(new google.maps.Marker({map:m,position:x.p,label:x.l,title:x.t}));b.extend(x.p)});if(el._k.length==1){m.setCenter(b.getCenter());m.setZoom(15)}else if(el._k.length>1)m.fitBounds(b,40)})}
function imgPick(file,cb,mx=480){const r=new FileReader();r.onload=()=>{const i=new Image();i.onload=()=>{const k=Math.min(1,mx/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=i.width*k;c.height=i.height*k;c.getContext('2d').drawImage(i,0,0,c.width,c.height);cb(c.toDataURL('image/jpeg',.8))};i.src=r.result};r.readAsDataURL(file)}

(()=>{const TH=[['','تلقائي','#0f766e'],['emerald','زمرد','#059669'],['sunset','غروب','#ea580c'],['ocean','محيط','#0284c7'],['royal','ملكي','#7c3aed'],['rose','وردي','#e11d48'],['night','ليلي','#a3e635']],d=document.documentElement;
const ap=t=>{t?d.dataset.theme=t:delete d.dataset.theme;try{localStorage.theme=t}catch(e){}setTimeout(()=>{let m=document.querySelector('meta[name=theme-color]');if(!m){m=document.createElement('meta');m.name='theme-color';document.head.appendChild(m)}m.content=getComputedStyle(d).getPropertyValue('--bg').trim()||'#fff'},50)};
let cur='';try{cur=localStorage.theme||''}catch(e){}ap(cur);
const TG={'جديد':'w','بانتظار كابتن':'w','تحضير':'i','قبل الكابتن':'i','وصل':'i','جاهز':'k','بالطريق':'k','بالرحلة':'k','سُلّم':'s','انتهت':'s','ملغي':'x','ملغية':'x','تعيين تلقائي':'k'};
const tg=()=>document.querySelectorAll('.tag:not([data-c])').forEach(e=>{e.dataset.c=1;const c=TG[e.textContent.trim()];if(c)e.classList.add(c)});
addEventListener('DOMContentLoaded',()=>{
 const f=document.createElement('link');f.rel='stylesheet';f.href='https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap';document.head.appendChild(f);
 const tb=document.createElement('header');tb.className='tb';tb.innerHTML='<b><i>'+(/كابتن/.test(document.title)?'🚕':/تحكم/.test(document.title)?'📊':'🍽️')+'</i>'+esc(document.title.split(' - ')[1]||document.title)+'</b><button aria-label="المظهر">🎨</button>';
 document.body.prepend(tb);
 tb.querySelector('button').onclick=()=>{const s=document.createElement('div');s.className='sheet';s.innerHTML='<div><b style="font-size:18px">مظهر التطبيق</b><div class="mu">اختر الثيم الذي يناسبك</div><div class="sw">'+TH.map(t=>`<button data-t="${t[0]}" class="${t[0]==cur?'a':''}"><i style="background:${t[2]}"></i>${t[1]}</button>`).join('')+'</div></div>';
  s.onclick=e=>{const b=e.target.closest('button');if(b){cur=b.dataset.t;ap(cur);s.querySelectorAll('button').forEach(x=>x.classList.toggle('a',x==b));return}if(e.target==s)s.remove()};document.body.appendChild(s)};
 new MutationObserver(tg).observe(document.body,{childList:true,subtree:true});tg()})})();

async function upl(file,mx){let b=file;if((file.type||'').startsWith('image/'))b=await new Promise(r=>imgPick(file,d=>fetch(d).then(x=>x.blob()).then(r),mx||1280));const r=await fetch('/api/upload',{method:'POST',headers:{...H(),'Content-Type':b.type||file.type||(/\.mov$/i.test(file.name||'')?'video/quicktime':'video/mp4')},body:b});if(!r.ok)throw r.status;return(await r.json()).url}

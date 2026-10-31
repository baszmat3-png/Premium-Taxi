/* ملاحة صوتية داخل تطبيق الكابتن: مسار OSRM بخطوات + إرشاد عربي + سهم متحرك + إعادة حساب */
(function(){
const N=window.NAV={on:0,mute:localStorage.nvm==='1',steps:[],line:[],idx:1,said:{},follow:1,key:'',lastRe:0,off:0,hd:0,last:null,spd:0,busy:0,total:1,min:1,km:0,wl:null,mapOn:0,minD:1e9};
const md=(a,b)=>dist(a,b)*1000;
const AR={left:'يساراً',right:'يميناً','slight left':'يساراً قليلاً','slight right':'يميناً قليلاً','sharp left':'يساراً بحدة','sharp right':'يميناً بحدة',straight:'مستقيماً',uturn:'للخلف'};
const GL={left:'↰',right:'↱','slight left':'↖','slight right':'↗','sharp left':'↲','sharp right':'↳',straight:'⬆',uturn:'↩'};
const ORD=['','الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر'];
const HW={100:'مئة',200:'مئتي',300:'ثلاثمئة',400:'أربعمئة',500:'خمسمئة',600:'ستمئة',700:'سبعمئة',800:'ثمانمئة',900:'تسعمئة'};
function dw(m){if(m>=950){const k=Math.round(m/100)/10;return k==1?'كيلومتر واحد':k==2?'كيلومترين':k+' كيلومتر'}const r=Math.max(50,Math.round(m/50)*50);return(HW[r]||r)+' متر'}
function dtx(m){return m>=1000?(m/1000).toFixed(1)+' كم':Math.max(10,Math.round(m/10)*10)+' م'}
function phr(s){const m=s.maneuver||{},t=m.type,o=m.modifier;
 if(t=='arrive')return'وصلت إلى وجهتك';
 if(t=='depart')return'ابدأ بالتحرك'+(s.name?' في '+s.name:'');
 if(/roundabout|rotary/.test(t||''))return'ادخل الدوار وخذ المخرج '+(ORD[m.exit]||'التالي');
 if(o=='uturn')return'استدر للخلف';
 if(t=='fork')return'خذ المسار '+(o&&o.includes('left')?'الأيسر':'الأيمن');
 if(t=='off ramp')return'اتجه إلى المخرج '+(o&&o.includes('left')?'الأيسر':'الأيمن');
 if(t=='merge')return'اندمج '+(AR[o]||'');
 if(!o||o=='straight')return'استمر مستقيماً';
 return'انعطف '+(AR[o]||'')}
const glyph=s=>{const m=s.maneuver||{};return m.type=='arrive'?'🏁':/roundabout|rotary/.test(m.type||'')?'⟳':(GL[m.modifier]||'⬆')};
let vs=[];const loadV=()=>{try{vs=speechSynthesis.getVoices()||[]}catch(e){}};try{loadV();speechSynthesis.onvoiceschanged=loadV}catch(e){}
function say(t){if(N.mute||!window.speechSynthesis)return;try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='ar-SA';u.rate=.95;const v=vs.find(x=>/^ar/i.test(x.lang));if(v)u.voice=v;speechSynthesis.speak(u)}catch(e){}}
const brg=(a,b)=>{const r=Math.PI/180,y=Math.sin((b.lng-a.lng)*r)*Math.cos(b.lat*r),x=Math.cos(a.lat*r)*Math.sin(b.lat*r)-Math.sin(a.lat*r)*Math.cos(b.lat*r)*Math.cos((b.lng-a.lng)*r);return(Math.atan2(y,x)/r+360)%360};
function segD(p,a,b){const k=111320,c=Math.cos(p.lat*Math.PI/180),ax=(a.lng-p.lng)*k*c,ay=(a.lat-p.lat)*k,bx=(b.lng-p.lng)*k*c,by=(b.lat-p.lat)*k,dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy;let t=l?-(ax*dx+ay*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(ax+t*dx,ay+t*dy)}
function offD(p){const L=N.line;if(L.length<2)return 0;let m=1e9;for(let i=0;i<L.length-1;i++){const d=segD(p,L[i],L[i+1]);if(d<m)m=d}return m}
function target(){try{const a=jobs().mine[0];if(!a)return null;const o=a.o,rd=a.k=='rides',st=o.st,p=rd?(st<3?o.from:o.to):(st<3?o.rloc:o.loc);return p?{p,st,id:o.id,rd}:null}catch(e){return null}}
async function fetchRoute(a,b){const q=`${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson&steps=true`;const j=await Promise.any(OSV.map(u=>fj(u+q,{t:9000}))),r=j.routes&&j.routes[0];if(!r)throw 0;const st=[];r.legs.forEach(l=>l.steps.forEach(s=>st.push({maneuver:s.maneuver,name:s.name||'',distance:s.distance,loc:{lat:s.maneuver.location[1],lng:s.maneuver.location[0]}})));return{line:r.geometry.coordinates.map(c=>({lat:c[1],lng:c[0]})),steps:st,km:r.distance/1000,min:Math.max(1,Math.round(r.duration/60)),m:r.distance}}
function mapEl(){return document.getElementById('dm')}
function arrow(p,hd){const el=mapEl(),m=el&&el._m;if(!m||!window.L)return;if(!el._nv){el._nv=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'navar',html:'<div class="nvi"><svg viewBox="0 0 40 40" width="46" height="46"><circle cx="20" cy="20" r="18" fill="#fff" opacity=".9"/><path d="M20 5l11 28-11-6-11 6z" fill="#1f4fff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg></div>',iconSize:[46,46],iconAnchor:[23,23]}),interactive:false,keyboard:false,zIndexOffset:2000}).addTo(m)}else el._nv.setLatLng([p.lat,p.lng]);const i=el._nv._icon&&el._nv._icon.firstChild;if(i)i.style.transform='rotate('+Math.round(hd||0)+'deg)';
 if(!N.mapOn){N.mapOn=1;m.on('dragstart',()=>{if(N.on){N.follow=0;recBtn()}})}
 const k=el._k&&el._k['ك'];if(k&&k._icon)k._icon.style.display='none'}
function follow(p){const el=mapEl(),m=el&&el._m;if(!m||!N.follow)return;const z=N.spd<4?18:N.spd<11?17:16,bs=document.querySelector('.bs'),off=bs?bs.offsetHeight/2-30:0;try{const pt=m.project([p.lat,p.lng],z).add([0,off]);m.setView(m.unproject(pt,z),z,{animate:true,duration:.9})}catch(e){}}
function recBtn(){let b=document.getElementById('nvr');if(!N.on||N.follow){if(b)b.remove();return}if(!b){b=document.createElement('button');b.id='nvr';b.textContent='🧭 إعادة التمركز';b.onclick=()=>{N.follow=1;recBtn();if(N.last)follow(N.last)};document.body.appendChild(b)}const bs=document.querySelector('.bs');b.style.bottom=((bs?bs.offsetHeight:200)+14)+'px'}
function banner(h){let b=document.getElementById('nvb');if(!N.on){if(b)b.remove();return}if(!b){b=document.createElement('div');b.id='nvb';document.body.appendChild(b)}if(b._h!==h){b._h=h;b.innerHTML=h}}
function render(p){const s=N.steps[N.idx];if(!s){banner('<div class="nvt"><b>جارٍ حساب المسار…</b></div>'+ctl());return}const d=md(p,s.loc);let rem=d,i=N.idx;for(;i<N.steps.length;i++)rem+=N.steps[i].distance;const mins=Math.max(1,Math.round(N.min*Math.min(1,rem/Math.max(1,N.total))));
 banner(`<div class="nvg">${glyph(s)}</div><div class="nvt"><b>${dtx(d)} • ${phr(s)}</b><span>${s.name?esc(s.name)+' • ':''}متبقي ${(rem/1000).toFixed(1)} كم • ${mins} د</span></div>`+ctl())}
const ctl=()=>`<button onclick="navMute()" aria-label="الصوت">${N.mute?'🔇':'🔊'}</button><button onclick="navToggle()" aria-label="إيقاف">✕</button>`;
function progress(p){if(!N.steps.length)return;const t=target();
 {const s0=N.steps[N.idx],d0=md(p,s0.loc);if(d0<N.minD)N.minD=d0;if(N.idx<N.steps.length-1&&(d0<22||(N.minD<70&&d0>N.minD+18))){N.idx++;N.minD=1e9}}
 const s=N.steps[N.idx],d=md(p,s.loc),k=N.idx+'_',last=s.maneuver&&s.maneuver.type=='arrive';
 if(t&&t.st<3&&t.rd&&!N.said['near'+t.id]&&md(p,t.p)<=200){N.said['near'+t.id]=1;say('اقتربت من الزبون')}
 else if(d<=45&&!N.said[k+'c']){N.said[k+'c']=1;say(phr(s))}
 else if(!last&&d<=240&&d>110&&!N.said[k+'b']){N.said[k+'b']=1;N.said[k+'a']=1;say('بعد '+dw(d)+'، '+phr(s))}
 else if(!last&&d<=560&&d>300&&!N.said[k+'a']){N.said[k+'a']=1;say('بعد '+dw(d)+'، '+phr(s))}
 else if(N.idx==1&&d>700&&!N.said['s'+N.key]){N.said['s'+N.key]=1;say('استمر مستقيماً لمسافة '+dw(d))}
 const od=offD(p);N.off=od>55?N.off+1:0;if(N.off>=2&&Date.now()-N.lastRe>15000){N.lastRe=Date.now();N.off=0;N.key='';N.said={};say('تم تغيير المسار')}
 render(p)}
async function ensure(p){const t=target();if(!t){navStop();return}const key=t.id+'|'+t.st;if(N.busy||(N.key===key&&N.steps.length))return;N.busy=1;try{const r=await fetchRoute(p,t.p);const first=!N.key;N.key=key;N.steps=r.steps;N.line=r.line;N.idx=Math.min(1,r.steps.length-1);N.minD=1e9;N.said={};N.total=Math.max(1,r.m);N.min=r.min;N.km=r.km;if(!first||true)say(t.st<3?'تم تحديد المسار إلى الزبون':'تم تحديد المسار إلى الوجهة')}catch(e){}finally{N.busy=0}progress(p)}
window.navTick=function(c){if(!N.on)return;const p={lat:c.latitude,lng:c.longitude};let hd=c.heading;N.spd=c.speed>0?c.speed:0;if(!(hd>=0)||!(c.speed>0.8)){hd=N.last&&md(N.last,p)>6?brg(N.last,p):N.hd}N.last=p;N.hd=hd||0;arrow(p,N.hd);follow(p);if(N.steps.length&&N.key)progress(p);else render(p);ensure(p)};
window.navToggle=function(){N.on?navStop(true):navStart();if(window.draw)draw()};
window.navMute=function(){N.mute=!N.mute;localStorage.nvm=N.mute?'1':'0';if(N.mute)try{speechSynthesis.cancel()}catch(e){}else say('تم تشغيل الصوت');if(N.last)render(N.last);else banner('<div class="nvt"><b>الملاحة الصوتية</b></div>'+ctl())};
function navStart(){N.on=1;N.follow=1;N.key='';N.steps=[];N.said={};localStorage.dnav='1';try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(w=>N.wl=w).catch(()=>{})}catch(e){}banner('<div class="nvt"><b>جارٍ حساب المسار…</b></div>'+ctl());if(window.pos){navTick({latitude:pos.lat,longitude:pos.lng,heading:null,speed:0})}try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('بدأت الملاحة الصوتية');u.lang='ar-SA';if(!N.mute)speechSynthesis.speak(u)}catch(e){}}
function navStop(user){N.on=0;N.steps=[];N.key='';if(user)localStorage.dnav='0';banner();recBtn();try{speechSynthesis.cancel()}catch(e){}try{N.wl&&N.wl.release();N.wl=null}catch(e){}const el=mapEl();if(el&&el._nv){el._nv.remove();el._nv=null}const k=el&&el._k&&el._k['ك'];if(k&&k._icon)k._icon.style.display=''}
window.navCheck=function(){const t=target();if(N.on&&!t)navStop();else if(!N.on&&t&&localStorage.dnav==='1')navStart()};
})();

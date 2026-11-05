/* vmap.js — خريطة متجهة بأسلوب Waze فوق Leaflet الحالي
   - MapLibre GL + OpenFreeMap (بيانات OpenStreetMap)، شوارع بيضاء بحواف خضراء، أسماء عربية أولاً
   - وضع ليلي/نهاري (تلقائي حسب الساعة، وزر للتبديل يُحفظ في localStorage.vmn)
   - لا يغيّر markers ولا المسارات ولا nav.js: كلها تبقى على Leaflet كما هي
   - إذا فشل التحميل أو لم يدعم الجهاز WebGL تبقى خريطة OSM الحالية تعمل كما كانت */
(function(){
if(window.__vmap)return;window.__vmap=1;
const V='4.7.1',U='https://unpkg.com/',
 CSS=U+'maplibre-gl@'+V+'/dist/maplibre-gl.css',
 JS=U+'maplibre-gl@'+V+'/dist/maplibre-gl.js',
 PLG=U+'@maplibre/maplibre-gl-leaflet@0.0.22/leaflet-maplibre-gl.js',
 STYLE='https://tiles.openfreemap.org/styles/liberty';
const C={
 day:{bg:'#f4f0e6',water:'#a9d6f5',road:'#ffffff',casing:'#22c55e',txt:'#2b2f36',halo:'#ffffff'},
 night:{bg:'#12171c',water:'#0c2433',road:'#2a3640',casing:'#15803d',txt:'#d5ede0',halo:'#0b0f12',land:'#16241d',bld:'#1b232b'}};
const isNight=()=>{const v=localStorage.vmn,h=new Date().getHours();return v==='1'||(v==null&&(h>=19||h<6))};
const SKIP=/rail|ferry|aerialway|cable|path|pedestrian|footway|steps|track|transit/;

/* تلوين الستايل: نحفظ القيم الأصلية أول مرة حتى نرجعها عند الوضع النهاري */
function tint(g,night){
 const c=night?C.night:C.day,o=g.__o=g.__o||{};
 const sp=(id,p,v)=>{try{const k=id+'|'+p;if(!(k in o))o[k]=g.getPaintProperty(id,p);g.setPaintProperty(id,p,v===undefined?o[k]:v)}catch(e){}};
 (g.getStyle().layers||[]).forEach(l=>{
  const id=l.id,t=l.type,s=l['source-layer']||'';
  if(t=='background'){sp(id,'background-color',c.bg);return}
  if(t=='fill'){
   if(s=='water')sp(id,'fill-color',c.water);
   else if(/landcover|landuse|park/.test(s))sp(id,'fill-color',night?c.land:undefined);
   else if(s=='building')sp(id,'fill-color',night?c.bld:undefined);
   return}
  if(t=='line'&&s=='transportation'){
   if(SKIP.test(id))return;
   sp(id,'line-color',/casing/.test(id)?c.casing:c.road);return}
  if(t=='symbol'){
   if(l.layout&&l.layout['text-field']&&!g.__ar){
    try{g.setLayoutProperty(id,'text-field',['coalesce',['get','name:ar'],['get','name'],['get','name:latin']])}catch(e){}}
   sp(id,'text-color',c.txt);sp(id,'text-halo-color',c.halo)}
 });
 g.__ar=1}

let ld=null;
function load(){
 if(ld)return ld;
 return ld=new Promise((ok,no)=>{
  const l=document.createElement('link');l.rel='stylesheet';l.href=CSS;document.head.appendChild(l);
  const js=src=>new Promise((a,b)=>{const s=document.createElement('script');s.src=src;s.onload=a;s.onerror=b;document.head.appendChild(s)});
  js(JS).then(()=>js(PLG)).then(()=>window.maplibregl&&window.L&&L.maplibreGL?maplibregl.setRTLTextPlugin(U+'@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js',false):Promise.reject()).then(ok).catch(no)})}

(function(){const s=document.createElement('style');s.textContent=
 '.vmn{position:absolute;z-index:900;right:10px;top:50%;transform:translateY(-50%);width:40px;height:40px;min-height:0;padding:0;margin:0;border:0;border-radius:50%;background:#fff;color:#111;box-shadow:0 4px 14px #0004;font-size:19px;line-height:40px;text-align:center;cursor:pointer}'+
 '.vma{position:absolute;z-index:800;left:6px;bottom:4px;font:10px/1.2 sans-serif;color:#333;background:#fffb;padding:1px 5px;border-radius:6px;pointer-events:none;direction:ltr}';
 document.head.appendChild(s)})();

const VM=[];
function addUI(el){
 if(el._vb)return;el._vb=1;
 const b=document.createElement('button');b.type='button';b.className='vmn';b.setAttribute('aria-label','الوضع الليلي');
 b.textContent=isNight()?'☀️':'🌙';
 b.onclick=()=>{const n=isNight()?'0':'1';localStorage.vmn=n;
  document.querySelectorAll('.vmn').forEach(x=>x.textContent=n==='1'?'☀️':'🌙');
  VM.forEach(g=>{try{tint(g,n==='1')}catch(e){}})};
 try{L.DomEvent.disableClickPropagation(b)}catch(e){}
 el.appendChild(b);
 const a=document.createElement('div');a.className='vma';a.textContent='© OpenStreetMap • OpenFreeMap';el.appendChild(a)}

function attach(el,m){
 if(el._vm)return;el._vm=1;
 let ras=null;
 m.eachLayer(x=>{if(x instanceof L.TileLayer&&/openstreetmap/.test(x._url||''))ras=x});
 load().then(()=>{
  const gl=L.maplibreGL({style:STYLE,attributionControl:false,interactive:false}).addTo(m),g=gl.getMaplibreMap();
  VM.push(g);
  g.on('style.load',()=>tint(g,isNight()));
  g.once('load',()=>{if(ras&&m.hasLayer(ras))m.removeLayer(ras)});
  addUI(el)}).catch(()=>{})}

/* نلفّ initMap الأصلية: كل الشاشات (زبون/كابتن/لوحة/مطعم) تستفيد تلقائياً */
const orig=window.initMap;
if(typeof orig=='function')window.initMap=function(el){const first=!el._m,m=orig.apply(this,arguments);if(first&&m){try{attach(el,m)}catch(e){}}return m};
})();

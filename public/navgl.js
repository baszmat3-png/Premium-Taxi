/* navgl.js — عرض قيادة مثل Waze: خريطة متجهة تدور مع اتجاه السير، مقرّبة على المسار، والسهم في الوسط.
   يعمل فوق خريطة Leaflet داخل نفس العنصر. إذا لم يدعم الجهاز WebGL تبقى خريطة Leaflet كما هي. */
(function(){
const NGL=window.NGL={};
/* البوصلة: اتجاه الجهاز الحقيقي حتى عند التوقف، ويُدمج مع اتجاه GPS أثناء السير */
let CMP=-1,cmpOn=0,cmpT=0;const EL=new Set();
function onOri(e){let h=-1;if(typeof e.webkitCompassHeading=='number')h=e.webkitCompassHeading;else if(e.absolute&&typeof e.alpha=='number')h=360-e.alpha;else return;h=(h+((screen.orientation&&screen.orientation.angle)||window.orientation||0)+360)%360;
 CMP=CMP<0?h:(CMP+((((h-CMP)%360)+540)%360-180)*.35+360)%360;const t=Date.now();if(t-cmpT<200)return;cmpT=t;EL.forEach(el=>{const S=el._ng;if(S&&S.useC&&!(S.spd>2.5)){S.hd=CMP;S.car&&S.car.setRotation(S.hd);cam(el,2)}})}
function cmpStart(){if(cmpOn)return;cmpOn=1;const go=()=>{window.addEventListener('deviceorientationabsolute',onOri,true);window.addEventListener('deviceorientation',onOri,true)};
 if(window.DeviceOrientationEvent&&typeof DeviceOrientationEvent.requestPermission=='function'){const ask=()=>{DeviceOrientationEvent.requestPermission().then(r=>{if(r=='granted')go()}).catch(()=>{});document.removeEventListener('click',ask,true)};document.addEventListener('click',ask,true)}else go()}
NGL.heading=()=>CMP>=0?Math.round(CMP):-1;
const R2=Math.PI/180,brg=(a,b)=>{const y=Math.sin((b.lng-a.lng)*R2)*Math.cos(b.lat*R2),x=Math.cos(a.lat*R2)*Math.sin(b.lat*R2)-Math.sin(a.lat*R2)*Math.cos(b.lat*R2)*Math.cos((b.lng-a.lng)*R2);return(Math.atan2(y,x)/R2+360)%360},
 dm=(a,b)=>{const x=(b.lng-a.lng)*R2*Math.cos((a.lat+b.lat)/2*R2),y=(b.lat-a.lat)*R2;return Math.sqrt(x*x+y*y)*6371e3};
function nearD(p,line){let bd=1e9;for(let i=0;i<line.length;i++){const d=dm(p,{lat:line[i][0],lng:line[i][1]});if(d<bd)bd=d}return bd}
function ahead(p,line){if(!line||line.length<2)return null;let bi=0,bd=1e9;for(let i=0;i<line.length;i++){const d=dm(p,{lat:line[i][0],lng:line[i][1]});if(d<bd){bd=d;bi=i}}let acc=0;for(let i=bi;i<line.length-1;i++){const a={lat:line[i][0],lng:line[i][1]},b={lat:line[i+1][0],lng:line[i+1][1]};acc+=dm(a,b);if(acc>35)return b}const l=line[line.length-1];return{lat:l[0],lng:l[1]}}
const st=document.createElement('style');st.textContent=`.ngl,.ngl.maplibregl-map{position:absolute!important;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:650}.ngl .maplibregl-canvas{outline:none}.ngcar{width:46px;height:46px;display:grid;place-items:center}.ngcar svg{filter:drop-shadow(0 3px 4px #0006)}.ngar{position:absolute;z-index:655;left:50%;width:54px;height:54px;margin-left:-27px;margin-top:-27px;pointer-events:none;filter:drop-shadow(0 4px 6px #0007);transition:opacity .2s}.ngdst{width:22px;height:22px;border-radius:6px;background:#2b44ff;border:3px solid #fff;box-shadow:0 2px 6px #0006}
.ngb{position:absolute;z-index:660;inset-inline:12px;display:flex;gap:10px;pointer-events:none}.ngb button{pointer-events:auto;min-height:0;border:0;border-radius:18px;box-shadow:0 6px 18px #0004;font-weight:800;font-size:16px;padding:14px 16px;margin:0}.ngf{flex:1;background:#10a36a;color:#fff}.ngo{background:#fff;color:#111}.ngz{position:absolute;z-index:660;left:12px;top:38%;display:flex;flex-direction:column;gap:8px}.ngz button{width:46px;height:46px;min-height:0;padding:0;margin:0;border:0;border-radius:50%;background:#fff;color:#111;font-size:24px;box-shadow:0 4px 14px #0004}`;document.head.appendChild(st);
function mk(el){const S=el._ng={on:1,follow:1,hd:0,z:17.6,pb:260};
 const d=document.createElement('div');d.className='ngl';d.style.cssText='position:absolute;top:0;left:0;width:100%;height:100%';el.appendChild(d);S.div=d;
 const b=document.createElement('div');b.className='ngb';b.innerHTML='<button class="ngf" hidden>➤ متابعة القيادة</button><button class="ngo">⤢ المسار</button>';el.appendChild(b);S.bar=b;
 const ar=document.createElement('div');ar.className='ngar';ar.innerHTML='<svg width="54" height="54" viewBox="0 0 40 40"><path d="M20 3 L35 35 L20 27 L5 35 Z" fill="#10b981" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';el.appendChild(ar);S.ar=ar;
 const z=document.createElement('div');z.className='ngz';z.innerHTML='<button aria-label="تكبير">＋</button><button aria-label="تصغير">－</button>';el.appendChild(z);S.zb=z;
 ['click','touchstart','mousedown','dblclick','wheel'].forEach(ev=>{b.addEventListener(ev,e=>e.stopPropagation());z.addEventListener(ev,e=>e.stopPropagation())});
 b.querySelector('.ngf').onclick=()=>{S.follow=1;b.querySelector('.ngf').hidden=true;cam(el,1)};
 b.querySelector('.ngo').onclick=()=>{if(!S.g||!S.line||S.line.length<2)return;S.follow=0;b.querySelector('.ngf').hidden=false;cam(el,0);const bb=new maplibregl.LngLatBounds();S.line.forEach(p=>bb.extend([p[1],p[0]]));S.pos&&bb.extend([S.pos.lng,S.pos.lat]);S.g.fitBounds(bb,{padding:{top:90,bottom:S.pb+40,left:40,right:40},bearing:0,pitch:0,duration:800})};
 z.children[0].onclick=()=>{S.z=Math.min(19.5,S.z+1);S.follow?cam(el,1):S.g&&S.g.zoomIn()};z.children[1].onclick=()=>{S.z=Math.max(12,S.z-1);S.follow?cam(el,1):S.g&&S.g.zoomOut()};
 window.VMAP.load().then(()=>{if(!S.on)return;let g;try{g=S.g=new maplibregl.Map({container:d,style:VMAP.STYLE,center:S.pos?[S.pos.lng,S.pos.lat]:[44.36,33.31],zoom:S.z,pitch:50,bearing:S.hd,attributionControl:false,dragRotate:false,pitchWithRotate:false})}catch(e){return NGL.off(el)}
  g.touchZoomRotate.disableRotation();try{VMAP.VM&&VMAP.VM.push(g)}catch(e){}g.on('error',e=>console.warn('NGL',e&&e.error&&e.error.message));setTimeout(()=>{try{g.resize()}catch(e){}},300);
  g.on('style.load',()=>{try{VMAP.tint(g,VMAP.isNight())}catch(e){}g.addSource('rt',{type:'geojson',data:gj(S.line)});
   g.addLayer({id:'rt-c',type:'line',source:'rt',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#ffffff','line-width':['interpolate',['linear'],['zoom'],12,6,18,22]}});
   g.addLayer({id:'rt',type:'line',source:'rt',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#10b981','line-width':['interpolate',['linear'],['zoom'],12,4,18,16]}});S.ready=1;cam(el,0)});
  const ce=document.createElement('div');ce.className='ngcar';ce.innerHTML='<svg width="40" height="40" viewBox="0 0 40 40"><path d="M20 3 L35 35 L20 27 L5 35 Z" fill="#10b981" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>';
  ce.style.visibility='hidden';S.car=new maplibregl.Marker({element:ce,rotationAlignment:'map',pitchAlignment:'map'}).setLngLat(S.pos?[S.pos.lng,S.pos.lat]:[44.36,33.31]).addTo(g);
  const de=document.createElement('div');de.className='ngdst';S.dst=new maplibregl.Marker({element:de}).setLngLat([44.36,33.31]);
  g.on('dragstart',()=>{S.follow=0;b.querySelector('.ngf').hidden=false;cam(el,0)});
  if(window.VM_ON_NIGHT)0}).catch(()=>NGL.off(el))}
const gj=line=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:(line||[]).map(p=>[p[1],p[0]])}});
function cam(el,anim){const S=el._ng;if(!S)return;if(S.ar){const H=S.div.clientHeight,top=Math.round(H*.3),c=top+(H-top-S.pb)/2;S.ar.style.top=c+'px';S.ar.style.opacity=S.follow&&S.g?1:0;if(S.car&&S.car.getElement())S.car.getElement().style.visibility=S.follow?'hidden':'visible'}if(!S.g||!S.pos||!S.follow)return;S.g.easeTo({center:[S.pos.lng,S.pos.lat],bearing:S.hd,zoom:S.z,pitch:50,padding:{top:Math.round(S.div.clientHeight*.3),bottom:S.pb,left:0,right:0},duration:anim==2?250:anim?700:0})}
/* opt: {pos:{lat,lng}, dest:{lat,lng}} */
NGL.drive=function(el,o,line,pb){if(!window.VMAP||!o||!o.pos)return;let S=el._ng;if(!S||!S.on){mk(el);S=el._ng}
 const p={lat:+o.pos.lat,lng:+o.pos.lng};if(!(p.lat&&p.lng))return;
/* الأولوية: اتجاه المسار أمامك (يدور عند كل انعطاف) ← اتجاه الحركة/GPS ← البوصلة */
 const L=line&&line.length?line:S.line,near=L?nearD(p,L):1e9,a=near<60?ahead(p,L):null;S.spd=o.spd||0;EL.add(el);
 if(a&&dm(p,a)>3){S.hd=brg(p,a);S.useC=0}
 else if(typeof o.hd=='number'&&o.hd>=0&&(o.spd>2.5||!o.compass)){S.hd=o.hd;S.useC=0}
 else if(S.pos&&dm(S.pos,p)>6){S.hd=brg(S.pos,p);S.useC=0}
 else if(o.compass){S.useC=1;cmpStart();if(CMP>=0)S.hd=CMP}

 S.pos=p;if(line&&line.length)S.line=line;if(pb)S.pb=Math.max(160,pb+20);S.bar.style.bottom=(S.pb+46)+'px';
 if(S.g){S.car&&S.car.setLngLat([p.lng,p.lat]).setRotation(S.hd);if(o.dest&&S.dst){S.dst.setLngLat([o.dest.lng,o.dest.lat]);if(!S.dst._map)S.dst.addTo(S.g)}if(S.ready&&line&&line.length){const sr=S.g.getSource('rt');sr&&sr.setData(gj(line))}cam(el,1)}};
NGL.off=function(el){const S=el&&el._ng;if(!S)return;EL.delete(el);S.on=0;try{S.g&&S.g.remove()}catch(e){}[S.div,S.bar,S.zb,S.ar].forEach(x=>x&&x.remove());el._ng=null};
NGL.active=el=>!!(el&&el._ng&&el._ng.on);
})();

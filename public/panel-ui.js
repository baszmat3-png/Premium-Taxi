/* panel-ui.js — هيكل لوحة التحكم الاحترافي: شريط جانبي مقسّم، شريط علوي ببحث شامل وتنبيهات، وصفحة تحليلات */
(function(){
const G=[
 ['نظرة عامة',[['D','🏠','الرئيسية'],['A','📊','التحليلات'],['l','🛰️','التتبع المباشر']]],
 ['العمليات',[['r','🚕','رحلات التكسي'],['o','🍔','طلبات الطعام'],['L','🚐','الخطوط'],['j','💬','محادثات الدعم'],['t','🎫','تذاكر الدعم']]],
 ['الشركاء والمستخدمون',[['d','🧑‍✈️','الكباتن'],['a','📝','طلبات التسجيل'],['v','⭐','تقييم الكباتن'],['h','🏆','الحوافز والمسابقات'],['u','👥','الزبائن'],['m','🍴','المطاعم'],['s','🛡️','الموظفون']]],
 ['المالية',[['w','💳','شحن الكباتن'],['z','👛','شحن الزبائن'],['q','🏦','السحوبات'],['y','📒','المحاسبة'],['R','↩️','محاسبة المطاعم']]],
 ['التسويق والمبيعات',[['f','🎁','العروض والأكواد'],['x','🎴','الكروت: توليد وبيع'],['k','🛒','طلبات البطاقات']]],
 ['النظام',[['n','⚡','المتغيرات'],['c','⚙️','الإعدادات']]]];
const RG=[['المطعم',[['o','🧾','الطلبات'],['m','📋','المنيو'],['i','🏪','بيانات المطعم']]]];
const V=o=>Object.values(o||{}),cnt=()=>({a:V(DB.apps).filter(x=>x.st==0).length,q:V(DB.wd).filter(x=>x.st==0).length,w:V(DB.topups).filter(x=>!x.st).length,z:V(DB.ctop).filter(x=>!x.st).length,t:V(DB.tickets).filter(x=>!x.st||x.st=='open'||x.st==0).length,j:(typeof chTot=='function'?chTot():0),k:V(DB.cardorders).filter(x=>x.st==0).length,o:V(DB.orders).filter(x=>x.st==0).length,r:V(DB.rides).filter(x=>x.st==0).length});
let PS=null;try{PS=localStorage.pnSb}catch(e){}
window.PUI={open:0,
 groups(){const allowed=new Set((TABS[AUTH.role]||[]).map(t=>t[0]).concat(AUTH.role=='rest'?[]:['A']));return (AUTH.role=='rest'?RG:G).map(([g,L])=>[g,L.filter(t=>allowed.has(t[0]))]).filter(x=>x[1].length)},
 title(){for(const[g,L]of this.groups())for(const t of L)if(t[0]==tab)return[t[1],t[2],g];return['','','']},
 shell(){if(document.getElementById('pnl'))return;const app=document.getElementById('app'),v=document.getElementById('v');
  const w=document.createElement('div');w.id='pnl';w.innerHTML=`<aside id="psb"><div class="pbr"><img src="/icons/icon-192.png" alt=""><div><b>تكسي المتميز</b><small id="prl"></small></div></div><div id="pnv"></div><button class="pout" onclick="logout()">⎋ تسجيل الخروج</button></aside><div id="pov" onclick="PUI.tog(0)"></div>
  <section id="pmn"><header id="ptb"><button class="pmb" onclick="PUI.tog()" aria-label="القائمة">☰</button><div class="ptt"><small id="pgr"></small><b id="ptl"></b></div><div class="psr"><input id="pq" placeholder="ابحث: اسم، هاتف، رقم طلب أو رحلة…" autocomplete="off" oninput="PUI.search(this.value)" onfocus="PUI.search(this.value)"><div id="pqr" hidden></div></div><button class="pib" onclick="(document.querySelector('header.tb button')||{}).click&&document.querySelector('header.tb button').click()" aria-label="المظهر">🎨</button><button class="pib" id="pbl" onclick="PUI.alerts()" aria-label="التنبيهات">🔔<i id="pbc" hidden></i></button></header><div id="pvw"></div></section>`;
  app.parentNode.insertBefore(w,app);document.getElementById('pvw').appendChild(app);document.addEventListener('click',e=>{if(!e.target.closest('.psr'))document.getElementById('pqr').hidden=true;if(!e.target.closest('#pbl')&&!e.target.closest('#pal')){const a=document.getElementById('pal');a&&a.remove()}})},
 draw(){if(!AUTH.pin){document.body.classList.remove('pnon');return}this.shell();document.body.classList.add('pnon');const c=cnt();
  document.getElementById('prl').textContent=TT[AUTH.role]||'';
  document.getElementById('pnv').innerHTML=this.groups().map(([g,L])=>`<div class="pgp"><div class="pgt">${g}</div>${L.map(t=>`<button class="pit ${t[0]==tab?'a':''}" onclick="PUI.go('${t[0]}')"><span class="pic">${t[1]}</span><span>${t[2]}</span>${c[t[0]]?`<em>${c[t[0]]}</em>`:''}</button>`).join('')}</div>`).join('');
  const T=this.title();document.getElementById('ptl').textContent=T[1];document.getElementById('pgr').textContent=T[2];
  const tot=['a','q','w','z','t','j'].reduce((s,k)=>s+(c[k]||0),0),bc=document.getElementById('pbc');bc.hidden=!tot;bc.textContent=tot>99?'99+':tot;document.getElementById('pbl').style.display=AUTH.role=='rest'?'none':''},
 go(t){tab=t;ed=null;this.tog(0);draw();const m=document.getElementById('pvw');m&&m.scrollTo(0,0);scrollTo(0,0)},
 tog(s){this.open=s==null?!this.open:!!s;document.body.classList.toggle('psbo',this.open)},
 alerts(){let a=document.getElementById('pal');if(a){a.remove();return}const c=cnt(),L=[['a','📝','طلبات تسجيل كباتن بانتظار المراجعة'],['q','🏦','طلبات سحب بانتظار التحويل'],['w','💳','طلبات شحن كباتن'],['z','👛','طلبات شحن زبائن'],['t','🎫','تذاكر دعم مفتوحة'],['j','💬','رسائل دعم غير مقروءة'],['k','🛒','طلبات بطاقات جديدة']].filter(x=>c[x[0]]);
  a=document.createElement('div');a.id='pal';a.innerHTML=`<b>التنبيهات</b>`+(L.length?L.map(x=>`<button onclick="PUI.go('${x[0]}');document.getElementById('pal').remove()"><span>${x[1]}</span><span>${x[2]}</span><em>${c[x[0]]}</em></button>`).join(''):'<div class="mu" style="padding:14px;text-align:center">لا توجد تنبيهات 🎉</div>');document.getElementById('ptb').appendChild(a)},
 search(q){const box=document.getElementById('pqr');q=String(q||'').trim();if(q.length<2){box.hidden=true;return}const n=q.toLowerCase(),dg=q.replace(/\D/g,''),m=x=>x&&String(x).toLowerCase().includes(n)||(dg.length>=4&&x&&String(x).replace(/\D/g,'').includes(dg)),R=[];
  V(DB.customers).forEach(c=>{if(m(c.n)||m(c.ph)||m(c.id))R.push(['u','👤',c.n||c.ph,'زبون • '+(c.ph||'')])});
  V(DB.drivers).forEach(d=>{if(m(d.n)||m(d.ph)||m(d.id)||m(d.plate))R.push(['d','🧑‍✈️',d.n,'كابتن • '+(d.ph||'')+' • '+(d.plate||'')])});
  V(DB.rests).forEach(r=>{if(m(r.n)||m(r.id)||m(r.ph))R.push(['m','🍴',r.n,'مطعم'])});
  V(DB.rides).forEach(r=>{if(m(r.id)||m(r.cn)||m(r.cp))R.push(['r','🚕','رحلة #'+r.id,(r.cn||'')+' • '+(r.fa||'')])});
  V(DB.orders).forEach(o=>{if(m(o.id)||m(o.cn)||m(o.cp))R.push(['o','🍔','طلب #'+o.id,(o.cn||'')+' • '+((DB.rests[o.rid]||{}).n||'')])});
  const ok=new Set((TABS[AUTH.role]||[]).map(t=>t[0]));const L=R.filter(x=>ok.has(x[0])).slice(0,30);
  box.innerHTML=L.length?L.map(x=>`<button onclick="PUI.go('${x[0]}');document.getElementById('pq').value='';document.getElementById('pqr').hidden=true"><span>${x[1]}</span><span><b>${esc(x[2]||'')}</b><small>${esc(x[3]||'')}</small></span></button>`).join(''):'<div class="mu" style="padding:12px">لا نتائج</div>';box.hidden=false}};

/* ===== صفحة التحليلات ===== */
let AP=14;
window.anaT=function(){const DAY=864e5,now=Date.now(),t0=new Date(new Date().toDateString()).getTime()-(AP-1)*DAY,R=V(DB.rides),O=V(DB.orders),days=[...Array(AP)].map((_,i)=>t0+i*DAY),di=t=>Math.floor((t-t0)/DAY);
 const rD=days.map(()=>0),oD=days.map(()=>0),rev=days.map(()=>0),com=days.map(()=>0),hr=Array(24).fill(0);let rc=0,oc=0,cx=0,tot=0,fares=[];const dvr={},rst={},cu=new Set();
 R.forEach(r=>{const t=r.t4||r.at;if(t<t0)return;const i=di(t);if(r.st==4){rD[i]++;rev[i]+=+r.fare||0;com[i]+=+r.com||0;rc++;fares.push(+r.fare||0);hr[new Date(t).getHours()]++;if(r.did){const x=dvr[r.did]=dvr[r.did]||{n:0,s:0};x.n++;x.s+=+r.fare||0}cu.add(r.cid)}else if(r.st<0)cx++;tot++});
 O.forEach(o=>{const t=o.t4||o.at;if(t<t0)return;const i=di(t);if(o.st==4&&!o.ret){oD[i]++;rev[i]+=+o.tot||0;com[i]+=(+o.com||0)+(+o.rcom||0);oc++;hr[new Date(t).getHours()]++;const x=rst[o.rid]=rst[o.rid]||{n:0,s:0};x.n++;x.s+=+o.tot||0;cu.add(o.cid)}else if(o.st<0)cx++;tot++});
 const sum=a=>a.reduce((s,x)=>s+x,0),F=n=>Math.round(n).toLocaleString('en-US'),lbl=t=>{const d=new Date(t);return d.getDate()+'/'+(d.getMonth()+1)};
 const bars=(A,B,col1,col2)=>{const mx=Math.max(1,...A.map((x,i)=>x+(B?B[i]:0))),w=100/A.length;return `<svg viewBox="0 0 100 42" preserveAspectRatio="none" class="ach">${A.map((x,i)=>{const h1=x/mx*38,h2=B?B[i]/mx*38:0;return `<rect x="${i*w+w*.15}" y="${40-h1}" width="${w*.7}" height="${h1}" rx=".6" fill="${col1}"><title>${lbl(days[i])}: ${x}</title></rect>${B?`<rect x="${i*w+w*.15}" y="${40-h1-h2}" width="${w*.7}" height="${h2}" rx=".6" fill="${col2}"><title>${lbl(days[i])}: ${B[i]}</title></rect>`:''}`}).join('')}</svg><div class="axl">${days.map((d,i)=>i%Math.ceil(AP/7)==0?`<span>${lbl(d)}</span>`:'').join('')}</div>`};
 const line=A=>{const mx=Math.max(1,...A),p=A.map((x,i)=>`${(i/(A.length-1||1)*100).toFixed(2)},${(40-x/mx*36).toFixed(2)}`).join(' ');return `<svg viewBox="0 0 100 42" preserveAspectRatio="none" class="ach"><polyline points="0,40 ${p} 100,40" fill="#22c55e22" stroke="none"/><polyline points="${p}" fill="none" stroke="#22c55e" stroke-width="1" vector-effect="non-scaling-stroke" style="stroke-width:2.5px"/></svg><div class="axl">${days.map((d,i)=>i%Math.ceil(AP/7)==0?`<span>${lbl(d)}</span>`:'').join('')}</div>`};
 const hmx=Math.max(1,...hr),top=(o,src,k)=>Object.entries(o).sort((a,b)=>b[1].n-a[1].n).slice(0,6).map(([id,x],i)=>`<div class="atr"><span class="arn">${i+1}</span><b>${esc((src[id]||{}).n||id)}</b><span class="mu">${x.n} ${k}</span><b>${F(x.s)}</b></div>`).join('')||'<div class="mu">لا بيانات</div>';
 const kp=(i,t,v,s)=>`<div class="akp"><span>${i}</span><small>${t}</small><b>${v}</b>${s?`<em>${s}</em>`:''}</div>`;
 const dOn=V(DB.drivers).filter(d=>d.on).length,dAll=V(DB.drivers).length;
 return `<div class="chips">${[[7,'7 أيام'],[14,'14 يوماً'],[30,'30 يوماً'],[90,'90 يوماً']].map(x=>`<button class="${AP==x[0]?'a':''}" onclick="anaP(${x[0]})">${x[1]}</button>`).join('')}</div>
 <div class="akg">${kp('💰','إجمالي المبيعات',F(sum(rev))+' د.ع')}${kp('🏦','عمولة التطبيق',F(sum(com))+' د.ع')}${kp('🚕','رحلات مكتملة',F(rc),fares.length?'متوسط '+F(sum(fares)/fares.length)+' د.ع':'')}${kp('🍔','طلبات مكتملة',F(oc))}${kp('❌','نسبة الإلغاء',(tot?Math.round(cx/tot*100):0)+'%',F(cx)+' ملغي')}${kp('👥','زبائن نشطون',F(cu.size),'من '+F(V(DB.customers).length))}${kp('🟢','كباتن متصلون',dOn+' / '+dAll)}${kp('⏳','بانتظار المراجعة',F(V(DB.apps).filter(x=>x.st==0).length+V(DB.wd).filter(x=>x.st==0).length),'تسجيل + سحب')}</div>
 <div class="acg"><div class="card"><div class="row sp"><b>الرحلات والطلبات يومياً</b><span class="mu"><i class="lg" style="background:#f59e0b"></i>رحلات <i class="lg" style="background:#6366f1"></i>طلبات</span></div>${bars(rD,oD,'#f59e0b','#6366f1')}</div>
 <div class="card"><b>المبيعات اليومية (د.ع)</b>${line(rev)}</div>
 <div class="card"><b>ساعات الذروة</b><div class="ahr">${hr.map((x,h)=>`<div title="${h}:00 — ${x}" style="height:${Math.max(4,x/hmx*100)}%;opacity:${.25+x/hmx*.75}"></div>`).join('')}</div><div class="axl"><span>12ص</span><span>6ص</span><span>12ظ</span><span>6م</span><span>11م</span></div></div>
 <div class="card"><b>🏆 أفضل الكباتن</b>${top(dvr,DB.drivers,'رحلة')}</div>
 <div class="card"><b>🍴 أفضل المطاعم</b>${top(rst,DB.rests,'طلب')}</div></div>`};
window.anaP=d=>{AP=d;draw()};

const css=document.createElement('style');css.textContent=`
body.pnon #app{max-width:none;margin:0;padding:14px 18px 40px}
body.pnon header.tb{display:none!important}body.pnon #v>.row.sp:first-child,body.pnon #v>.tabs:nth-child(2){display:none!important}
#pnl{display:none}body.pnon #pnl{display:flex;min-height:100vh}
#psb{position:sticky;top:0;height:100vh;width:264px;flex:none;overflow-y:auto;background:linear-gradient(180deg,#0b1226,#111a35);color:#e5e9f5;padding:16px 12px;display:flex;flex-direction:column;gap:6px;border-inline-start:1px solid #ffffff10}
.pbr{display:flex;align-items:center;gap:10px;padding:4px 6px 14px;border-bottom:1px solid #ffffff14;margin-bottom:6px}.pbr img{width:44px;height:44px;border-radius:12px}.pbr b{display:block;font-size:16px}.pbr small{color:#93a0c4;font-size:12px}
.pgp{margin:6px 0}.pgt{font-size:11.5px;color:#7d8bb3;font-weight:800;letter-spacing:.3px;padding:8px 10px 4px}
.pit{display:flex;align-items:center;justify-content:flex-start;gap:10px;width:100%;background:none;border:0;color:#cfd6ea;padding:9px 10px;border-radius:12px;font:inherit;font-size:14.5px;cursor:pointer;min-height:0;margin:1px 0;text-align:start}
.pit:hover{background:#ffffff0d}.pit.a{background:linear-gradient(135deg,#f59e0b,#d97706);color:#111;font-weight:800;box-shadow:0 6px 16px #f59e0b33}
.pic{width:24px;text-align:center;font-size:16px}.pit em,.pal em,#pal em{margin-inline-start:auto;font-style:normal;background:#ef4444;color:#fff;border-radius:99px;font-size:11.5px;padding:1px 8px;font-weight:800}.pit.a em{background:#111;color:#fbbf24}
.pout{margin-top:auto;background:#ffffff0d;border:1px solid #ffffff1a;color:#fca5a5;border-radius:12px;padding:10px;font:inherit;cursor:pointer;min-height:0}
#pmn{flex:1;min-width:0;display:flex;flex-direction:column}
#ptb{position:sticky;top:0;z-index:1100;display:flex;align-items:center;gap:12px;padding:10px 18px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid var(--bd)}
.pmb{display:none;background:var(--cd);border:1px solid var(--bd);color:var(--tx);border-radius:12px;width:44px;height:44px;min-height:0;padding:0;font-size:20px;margin:0}
.ptt{min-width:0}.ptt small{display:block;color:var(--mu);font-size:12px}.ptt b{font-size:19px;white-space:nowrap}
.psr{position:relative;flex:1;max-width:460px;margin-inline-start:auto}.psr input{margin:0;border-radius:14px;min-height:44px;padding-inline-start:14px}
#pqr,#pal{position:absolute;top:calc(100% + 6px);inset-inline-end:0;width:min(440px,92vw);max-height:60vh;overflow:auto;background:var(--cd);border:1px solid var(--bd);border-radius:16px;box-shadow:0 20px 50px #0005;z-index:1150;padding:6px}
#pal{inset-inline-end:18px;width:min(360px,92vw)}#pal>b{display:block;padding:8px 10px}
#pqr button,#pal button{display:flex;align-items:center;justify-content:flex-start;gap:10px;width:100%;background:none;border:0;color:var(--tx);padding:10px;border-radius:12px;font:inherit;text-align:start;cursor:pointer;min-height:0;margin:0}#pqr button:hover,#pal button:hover{background:var(--bg)}#pqr small{display:block;color:var(--mu);font-size:12px}
.pib{position:relative;background:var(--cd);border:1px solid var(--bd);border-radius:12px;width:44px;height:44px;min-height:0;padding:0;font-size:19px;margin:0}.pib i{position:absolute;top:-5px;inset-inline-end:-5px;background:#ef4444;color:#fff;border-radius:99px;font-size:11px;font-style:normal;padding:1px 6px;font-weight:800}
#pov{display:none}
@media(max-width:900px){#psb{position:fixed;inset-block:0;inset-inline-start:0;z-index:1300;transform:translateX(105%);transition:transform .25s}body.psbo #psb{transform:none}body.psbo #pov{display:block;position:fixed;inset:0;background:#0007;z-index:1250}.leaflet-container,.maplibregl-map,.map,.mapbox,[id$=map]{isolation:isolate;z-index:0}.pmb{display:block}#ptb{padding:8px 10px;gap:8px}.ptt b{font-size:16px}.psr{max-width:none}body.pnon #app{padding:10px 12px 40px}}
@media(max-width:560px){.ptt{display:none}}
.akg{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin:10px 0}.akp{background:var(--cd);border:1px solid var(--bd);border-radius:18px;padding:14px;display:flex;flex-direction:column;gap:2px}.akp span{font-size:22px}.akp small{color:var(--mu)}.akp b{font-size:21px}.akp em{font-style:normal;color:var(--mu);font-size:12px}
.acg{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}.ach{width:100%;height:170px;display:block;margin-top:10px}.axl{display:flex;justify-content:space-between;color:var(--mu);font-size:11px;direction:ltr;margin-top:4px}
.ahr{display:flex;align-items:flex-end;gap:3px;height:150px;margin-top:12px;direction:ltr}.ahr div{flex:1;background:linear-gradient(180deg,#f59e0b,#d97706);border-radius:4px 4px 0 0}
.atr{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--bd)}.atr b:last-child{margin-inline-start:auto}.arn{width:26px;height:26px;border-radius:50%;background:#f59e0b22;color:#d97706;display:grid;place-items:center;font-weight:800;font-size:13px}.lg{display:inline-block;width:10px;height:10px;border-radius:3px;margin:0 6px 0 2px;vertical-align:middle}`;
document.head.appendChild(css);
})();

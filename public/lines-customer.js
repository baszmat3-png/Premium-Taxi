/* lines-customer.js — قسم «الخطوط» في تطبيق الزبون (سيارات ستاركس 4 / 10 / 11 راكب)
   الزبون يرى الخطوط المتاحة (المقاعد الشاغرة، الخدمات، أيام العمل، السعر)، ويطلب مقعداً بعد تحديد سكنه ومكان عمله/دراسته،
   وصاحب الخط (كابتن الخطوط) يوافق أو يرفض. */
(function(){
const DN=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const SV=[['ac','❄️ تبريد'],['heat','🔥 تدفئة'],['net','📶 إنترنت']];
const LNQ=window.LNQ={tab:'lines',f:'all',q:''};

(function(){const s=document.createElement('style');s.textContent=
 'html{overflow-x:hidden}@supports(overflow:clip){html,body{overflow-x:clip}}.card{min-width:0;max-width:100%;box-sizing:border-box}.card .mu{overflow-wrap:anywhere}.lnhd{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0}.lnhd .tag{margin:0;white-space:nowrap;position:static;float:none}.lnrt{display:block;width:100%;white-space:normal!important;overflow:visible!important;text-overflow:clip!important;overflow-wrap:anywhere;line-height:1.5;font-size:17px}.lac{margin:-4px 0 8px;border:2px solid #d4a63a;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 8px 22px #0006}.laci{display:flex;gap:10px;align-items:flex-start;width:100%;padding:12px 14px;text-align:start;background:#fff;border:0;border-bottom:1px solid #eee;color:#111!important;font:inherit;cursor:pointer;margin:0;min-height:0}.laci:last-child{border:0}.laci:active,.laci:hover{background:#fff6e0}.laci b{display:block;font-size:16px;font-weight:800;color:#111!important}.laci small{display:block;color:#555!important;font-size:13px;margin-top:2px}.lacm{padding:12px 14px;color:#444;font-size:14px;background:#fff}#lnmap{position:relative}.lnloc{position:absolute;top:10px;left:10px;z-index:1000;width:46px;height:46px;min-height:0;margin:0;padding:0;border-radius:50%;background:#fff!important;color:#1a73e8!important;border:0;font-size:24px;line-height:46px;box-shadow:0 3px 12px #0006;cursor:pointer}#lnmap .mk i{transform:scale(1.45) translateY(-35%) rotate(-45deg);border-radius:50% 50% 50% 0!important;position:relative}#lnmap .mk i::after{content:"";position:absolute;inset:28%;border-radius:50%;background:#fff}#lnmap .mk.a i{background:#16a34a}#lnmap .mk.b i{background:#dc2626}.lnc{display:inline-block;padding:2px 10px;border-radius:99px;background:rgba(127,127,127,.16);font-size:12px;margin:2px}.lnc.a{background:var(--pr);color:#fff}'+
 '.lni{height:130px;border-radius:16px;background:#8883 center/cover;margin-bottom:10px}'+
 '.lnm{position:fixed;inset:0;z-index:9000;background:var(--bg);overflow:auto;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 40px}.lnm>div{max-width:560px;margin:auto}'+
 '.lnmap{height:240px;border-radius:16px;overflow:hidden;margin:8px 0}'+
 '.lns{display:flex;align-items:center;gap:18px;justify-content:center;margin:8px 0}.lns button{width:46px;height:46px;min-height:0;border-radius:50%;font-size:22px;padding:0}';
 document.head.appendChild(s)})();

const days=L=>DN.map((n,i)=>`<span class="lnc ${(L.days||[]).includes(i)?'a':''}">${n}</span>`).join('');
const svc=L=>SV.filter(([k])=>L.svc&&L.svc[k]).map(x=>x[1]).join(' • ')||'—';

function card(L){
 return `<div class="card">${L.img?`<div class="lni" style="background-image:url('${esc(L.img)}')"></div>`:''}
 <div class="lnhd"><span class="tag ${L.scope=='out'?'w':'on'}">${L.scope=='out'?'🛣️ خارج المحافظة':'🏙️ داخل المحافظة'}</span><b class="lnrt">${esc(L.fa)} ← ${esc(L.ta)}</b></div>
 <div class="mu">🚐 ${esc(L.car||'ستاركس')}${L.color?' • '+esc(L.color):''}${L.year?' • '+esc(L.year):''} • ${L.seats} مقعد • <b class="${L.free>0?'on':'off'}">${L.free>0?'متاح '+L.free:'مكتمل'}</b></div>
 <div>${days(L)}</div>
 <div class="mu">🕖 الذهاب ${esc(L.t1||'—')}${L.t2?' • العودة '+esc(L.t2):''}</div>
 <div class="mu">${svc(L)}</div>
 <div class="mu">🧑‍✈️ ${esc(L.dn||'كابتن')}${L.gov?' • '+esc(L.gov):''}</div>
 ${L.note?`<div class="mu">${esc(L.note)}</div>`:''}
 <div class="row sp"><b>${fmt(L.price)} <small>للمقعد</small></b>${(()=>{const my=Object.values(DB.lreqs||{}).find(x=>x.lid==L.id&&x.st>=0&&x.st<2);return my?`<button class="l" style="width:auto;margin:0;min-height:44px;padding:0 18px" onclick="LNQ.tab='mine';draw()">${my.st==1?'✅ مقعدك مؤكد':'⏳ طلبك قيد المراجعة'}</button>`:`<button class="big" style="width:auto;margin:0;min-height:44px;padding:0 22px" ${L.free>0?`onclick="lnOpen('${esc(L.id)}')"`:'disabled'}>${L.free>0?'اطلب مقعد':'ممتلئ'}</button>`})()}</div></div>`}

function listHtml(){
 const q=(LNQ.q||'').trim().toLowerCase();
 const L=Object.values(DB.lines||{}).filter(x=>(LNQ.f=='all'||x.scope==LNQ.f)&&(!q||((x.fa||'')+' '+(x.ta||'')+' '+(x.gov||'')+' '+(x.car||'')).toLowerCase().includes(q)))
  .sort((a,b)=>(b.free>0)-(a.free>0)||a.price-b.price);
 return L.length?L.map(card).join(''):'<div class="card mu" style="text-align:center">لا توجد خطوط مطابقة حالياً.</div>'}

function mineHtml(){
 const Q=Object.values(DB.lreqs||{}).sort((a,b)=>b.at-a.at);
 if(!Q.length)return '<div class="card mu" style="text-align:center">لا توجد طلبات بعد. اختر خطاً واطلب مقعدك.</div>';
 return Q.map(x=>{
  const tg=x.st==1?['s','تمت الموافقة']:x.st==0?['w','بانتظار موافقة الكابتن']:x.st==2?['x','مرفوض']:x.st==-1?['x','ملغي']:['x','الخط متوقف'],L=(DB.lines||{})[x.lid];
  return `<div class="card"><div class="lnhd"><span class="tag ${tg[0]}">${tg[1]}</span><b class="lnrt">${esc(x.ll||'')}</b></div>
  <div class="mu">${x.seats} مقعد • ${fmt(x.tot)}</div><div class="mu">من: ${esc(x.fa)} ← إلى: ${esc(x.ta)}</div>
  ${x.st==1?`<div class="mu on">🧑‍✈️ ${esc(x.dn||'الكابتن')} ${x.dph?`• <a href="tel:${esc(x.dph)}">${esc(x.dph)}</a>`:''}</div>${L?`<div>${days(L)}</div><div class="mu">🕖 الذهاب ${esc(L.t1||'—')}${L.t2?' • العودة '+esc(L.t2):''}</div>`:''}`:''}
  ${x.st==2&&x.why?`<div class="mu off">${esc(x.why)}</div>`:''}
  ${x.st>=0&&x.st<2?`<button class="l" onclick="lnCancel('${esc(x.id)}')">إلغاء الطلب</button>`:''}</div>`}).join('')}

window.linesV=function(v){
 const pend=Object.values(DB.lreqs||{}).filter(x=>x.st>=0&&x.st<2).length,t=LNQ.tab;
 v.innerHTML=`<button class="l" onclick="go('home')">رجوع</button><h1>🚐 الخطوط</h1>
 <div class="mu">اشترك بمقعد ثابت في سيارة ستاركس (4 أو 10 أو 11 راكب) من سكنك إلى دائرتك أو جامعتك أو شركتك.</div>
 <div class="row" style="gap:8px;margin:10px 0"><button class="${t=='lines'?'big':'l'}" style="flex:1;margin:0;min-height:44px" onclick="LNQ.tab='lines';draw()">الخطوط المتاحة</button><button class="${t=='mine'?'big':'l'}" style="flex:1;margin:0;min-height:44px" onclick="LNQ.tab='mine';draw()">طلباتي${pend?' ('+pend+')':''}</button></div>
 ${t=='lines'?`<div class="row" style="gap:6px;margin:6px 0;flex-wrap:wrap">${[['all','الكل'],['in','داخل المحافظة'],['out','خارج المحافظة']].map(x=>`<span class="tag ${LNQ.f==x[0]?'on':''}" style="cursor:pointer;padding:7px 14px" onclick="LNQ.f='${x[0]}';draw()">${x[1]}</span>`).join('')}</div>
 <input id="lnq" placeholder="ابحث بالمنطقة أو الجامعة أو المحافظة" value="${esc(LNQ.q)}" oninput="LNQ.q=this.value;lnList()"><div id="lnl">${listHtml()}</div><button class="l" style="width:100%;margin-top:10px" onclick="lsAdd()">➕ لم تجد خطك؟ اطلب خطاً جديداً</button>`:mineHtml()+lsMineHtml()}`};
const lsMineHtml=()=>{const L=Object.values(DB.lsug||{}).sort((a,b)=>b.at-a.at);return L.length?`<h3>طلبات الخطوط الجديدة</h3>`+L.map(x=>`<div class="card"><div class="row sp"><b>${esc(x.fa)} ← ${esc(x.ta)}</b><span class="tag ${x.st==0?'on':''}">${x.st==0?'قيد البحث عن كابتن':x.st==2?'تمت المعالجة':'ملغي'}</span></div><div class="mu">${x.tm?'الوقت: '+esc(x.tm)+' • ':''}المقاعد: ${x.seats}${x.days?' • '+esc(x.days):''}</div>${x.st==0?`<button class="l" onclick="lsClose('${x.id}')">إلغاء</button>`:''}</div>`).join(''):''};
const lsApi=async b=>{try{const r=await fetch('/api/lsug',{method:'POST',headers:{...H(),'content-type':'application/json'},body:JSON.stringify(b)}),j=await r.json().catch(()=>({}));if(!r.ok)alert(j.e||'تعذر الإرسال');else{await load();draw()}return r.ok}catch(e){alert('تعذر الاتصال')}};
window.lsClose=id=>confirm('إلغاء الطلب؟')&&lsApi({op:'close',id});
window.lsAdd=function(){const el=document.createElement('div');el.className='lnm lnf';el.innerHTML=`<div><div class="row sp"><h1 style="margin:0">طلب خط جديد</h1><button class="fab" id="lsx">✕</button></div><div class="mu">اكتب مسارك وسيظهر طلبك لكل الكباتن ليضيفوا خطاً يناسبك.</div>
<input id="ls1" placeholder="من (المنطقة / الحي)"><input id="ls2" placeholder="إلى (الدائرة / الجامعة / الشركة / المحافظة)"><input id="ls3" placeholder="وقت الذهاب (مثلاً 7:30 صباحاً)"><input id="ls4" type="number" min="1" max="11" value="1" placeholder="عدد المقاعد"><input id="ls5" placeholder="الأيام (مثلاً السبت–الخميس)"><textarea id="ls6" rows="2" placeholder="ملاحظات (اختياري)"></textarea><button class="big" id="lsok">إرسال الطلب</button></div>`;document.body.appendChild(el);
 const q=s=>el.querySelector(s);q('#lsx').onclick=()=>el.remove();q('#lsok').onclick=async()=>{if(await lsApi({op:'add',fa:q('#ls1').value,ta:q('#ls2').value,tm:q('#ls3').value,seats:+q('#ls4').value,days:q('#ls5').value,note:q('#ls6').value})){el.remove();alert('تم إرسال طلبك، سيظهر للكباتن');LNQ.tab='mine';draw()}}};
window.lnList=()=>{const e=document.getElementById('lnl');if(e)e.innerHTML=listHtml()};
window.lnTab=t=>{LNQ.tab=t;go('lines')};
window.lnCancel=async id=>{if(!confirm('إلغاء هذا الطلب؟'))return;if(!await set('lreqs',id,{st:-1}))alert('تعذر الإلغاء');draw()};

/* ---------- نافذة طلب مقعد ---------- */
window.lnOpen=function(id){
 const L=(DB.lines||{})[id];if(!L)return;
 const S={n:1,pos:{},set:{},pimg:'',max:Math.max(1,Math.min(L.free,L.seats))},$=s=>el.querySelector(s);
 const el=document.createElement('div');el.className='lnm';
 el.innerHTML=`<div>
 <div class="row sp"><h1 style="margin:0">طلب مقعد</h1><button class="fab" id="lnx" aria-label="إغلاق">✕</button></div>
 <div class="card"><b>${esc(L.fa)} ← ${esc(L.ta)}</b><div class="mu">🚐 ${esc(L.car||'ستاركس')} • متاح ${L.free} من ${L.seats} • ${fmt(L.price)} للمقعد</div></div>
 <div class="card"><b>عدد المقاعد</b><div class="lns"><button class="l" id="lnm1">−</button><b id="lnn" style="font-size:26px">1</b><button class="l" id="lnp1">+</button></div><div class="mu" id="lnt" style="text-align:center"></div></div>
 <div class="card"><b>📍 حدّد سكنك (الانطلاق) ومكان عملك أو دراستك (الوصول)</b>
  <div class="row" style="gap:8px;margin:8px 0"><button class="big" id="lnA" style="margin:0;min-height:42px;flex:1">نقطة الانطلاق</button><button class="l" id="lnB" style="margin:0;min-height:42px;flex:1">نقطة الوصول</button></div>
  <div class="lnmap" id="lnmap"></div><div class="mu">اضغط على الخريطة لتحديد النقطة المختارة أو اسحب العلامة.</div>
  <input id="lnfa" placeholder="عنوان سكنك (الحي / الشارع)"><button class="l" id="lnme" style="margin:6px 0;width:100%">📍 استخدم موقعي الحالي للانطلاق</button>
  <input id="lnta" placeholder="مكان العمل أو الدراسة (دائرة / جامعة / شركة)"></div>
 <label class="card up"><span><b>صورتك (اختياري)</b><div class="mu" id="lnps">يساعد الكابتن على التعرف عليك</div></span><span>📷</span><input type="file" hidden accept="image/*" id="lnpf"></label>
 <div class="card"><input id="lnnote" placeholder="ملاحظات للكابتن (اختياري)"></div>
 <button class="big" id="lnok">إرسال الطلب</button></div>`;
 document.body.appendChild(el);
 const upd=()=>{$('#lnn').textContent=S.n;$('#lnt').textContent='المبلغ: '+fmt(S.n*L.price)+' (سعر المقعد × العدد، يحدده صاحب الخط)'};upd();
 $('#lnm1').onclick=()=>{S.n=Math.max(1,S.n-1);upd()};$('#lnp1').onclick=()=>{S.n=Math.min(S.max,S.n+1);upd()};
 $('#lnx').onclick=()=>el.remove();
 const cur=k=>{if(S.c)S.c.cur=k;$('#lnA').className=k=='a'?'big':'l';$('#lnB').className=k=='b'?'big':'l'};
 $('#lnA').onclick=()=>cur('a');$('#lnB').onclick=()=>cur('b');
 const fill=(k,p)=>{const i=$(k=='a'?'#lnfa':'#lnta');geoRev(p).then(t=>{if(i&&!i.dataset.m&&t)i.value=t}).catch(()=>{})};
 const acW=(inp,k)=>{const box=document.createElement('div');box.className='lac';box.hidden=true;inp.insertAdjacentElement('afterend',box);let tm=0,seq=0;
  const pick=x=>{const p={lat:x.lat,lng:x.lng};inp.value=x.n+(x.a?' - '+x.a:'');inp.dataset.m=1;box.hidden=true;S.pos[k]=p;S.set[k]=1;if(S.c&&S.c.put)S.c.put(k,p);if(S.c&&S.c.map)S.c.map.setView([p.lat,p.lng],16);if(k=='a'&&!S.set.b)cur('b')};
  inp.addEventListener('input',()=>{inp.dataset.m=1;clearTimeout(tm);const q=inp.value.trim();if(q.length<2){box.hidden=true;return}
   tm=setTimeout(async()=>{const my=++seq;box.hidden=false;box.innerHTML='<div class="lacm">جارٍ البحث…</div>';let R=[];try{R=await geoFind(q,S.pos.a||L.from||BG)}catch(e){}if(my!=seq)return;
    if(!R||!R.length){box.innerHTML='<div class="lacm">لا توجد نتائج — جرّب اسمًا آخر أو حدّد المكان على الخريطة</div>';return}
    box.innerHTML='';R.slice(0,7).forEach(x=>{const b=document.createElement('button');b.type='button';b.className='laci';b.innerHTML='<span>📍</span><span><b></b><small></small></span>';b.querySelector('b').textContent=x.n;b.querySelector('small').textContent=x.a||'';b.onclick=()=>pick(x);box.appendChild(b)})},400)});
  inp.addEventListener('blur',()=>setTimeout(()=>box.hidden=true,250));inp.addEventListener('focus',()=>{if(box.children.length&&inp.value.trim().length>1)box.hidden=false})};
 acW($('#lnfa'),'a');acW($('#lnta'),'b');
 S.c=mapPick($('#lnmap'),L.from||BG,pos=>{for(const k of ['a','b']){const p=pos[k];if(p&&(!S.pos[k]||S.pos[k].lat!=p.lat||S.pos[k].lng!=p.lng)){S.pos[k]={lat:p.lat,lng:p.lng};S.set[k]=1;fill(k,S.pos[k]);if(k=='a'&&!S.set.b)cur('b')}}});
 {const lb=document.createElement('button');lb.type='button';lb.className='lnloc';lb.title='موقعي الحالي';lb.setAttribute('aria-label','تحديد موقعي الحالي كنقطة انطلاق');lb.textContent='◎';lb.onclick=e=>{e.stopPropagation();$('#lnme').click()};$('#lnmap').appendChild(lb);['click','mousedown','touchstart','dblclick'].forEach(ev=>lb.addEventListener(ev,x=>x.stopPropagation()))}
 $('#lnme').onclick=()=>{if(!navigator.geolocation)return alert('الموقع غير متاح على جهازك');navigator.geolocation.getCurrentPosition(g=>{const p={lat:g.coords.latitude,lng:g.coords.longitude};if(S.c.put)S.c.put('a',p);S.pos.a=p;S.set.a=1;fill('a',p);cur('b')},()=>alert('تعذر تحديد موقعك. فعّل الموقع أو حدّده على الخريطة.'),{enableHighAccuracy:true,timeout:12000})};
 $('#lnpf').onchange=async e=>{const f=e.target.files[0];if(!f)return;const s=$('#lnps');s.textContent='جارٍ الرفع…';try{S.pimg=await upl(f,800);s.textContent='تم الرفع ✓'}catch(x){s.textContent='فشل الرفع، أعد المحاولة'}};
 $('#lnok').onclick=async()=>{
  const fa=$('#lnfa').value.trim(),ta=$('#lnta').value.trim();
  if(!S.set.a||!S.set.b)return alert('حدّد نقطة الانطلاق ونقطة الوصول على الخريطة');
  if(!fa||!ta)return alert('اكتب عنوان سكنك ومكان عملك أو دراستك');
  const b=$('#lnok');b.disabled=true;
  const P0=(typeof P!='undefined'&&P)||{};
  const ok=await set('lreqs','q'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),{lid:id,seats:S.n,from:S.pos.a,to:S.pos.b,fa,ta,note:$('#lnnote').value.trim(),pimg:S.pimg,cn:P0.n||'',cp:P0.p||''});
  if(!ok){b.disabled=false;return alert(window.LASTE||'تعذر إرسال الطلب. تحقق من الاتصال وأعد المحاولة.')}
  el.remove();LNQ.tab='mine';try{toast('تم إرسال طلبك للكابتن ✅')}catch(e){}go('lines')};
};
})();

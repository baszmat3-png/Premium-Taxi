/* lines-driver.js — لوحة «كابتن الخطوط» في تطبيق الكابتن
   تظهر فقط لمن سُجّل بنوع «كابتن خطوط». يستقبل طلبات الزبائن (المعلومات والموقع والوصول)، يوافق أو يرفض،
   ويسجّل خطوطه بنفسه (من/إلى، السعر، المقاعد، الأيام، الخدمات، المركبة والصور). */
(function(){
const DN=['أحد','اثنين','ثلاثاء','أربعاء','خميس','جمعة','سبت'];
const SV=[['ac','❄️ تبريد'],['heat','🔥 تدفئة'],['net','📶 إنترنت']];
const LD=window.LD={tab:'req'};

(function(){const s=document.createElement('style');s.textContent=
 '.lnc{display:inline-block;padding:2px 10px;border-radius:99px;background:rgba(127,127,127,.16);font-size:12px;margin:2px}.lnc.a{background:var(--pr);color:#fff}'+
 '.lni{height:120px;border-radius:16px;background:#8883 center/cover;margin-bottom:10px}'+
 '.lnm{position:fixed;inset:0;z-index:9000;background:var(--bg);overflow:auto;padding:calc(12px + env(safe-area-inset-top,0px)) 16px 40px}.lnm>div{max-width:560px;margin:auto}'+
 '.lnmap{height:240px;border-radius:16px;overflow:hidden;margin:8px 0}.lnf select,.lnf input{width:100%}'+
 '.lnd{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.lnd label{display:flex;align-items:center;gap:6px;padding:7px 12px;border-radius:99px;background:rgba(127,127,127,.16);font-size:14px}';
 document.head.appendChild(s)})();

const osm=p=>p&&p.lat!=null?'https://www.openstreetmap.org/?mlat='+p.lat+'&mlon='+p.lng+'#map=17/'+p.lat+'/'+p.lng:'#';
const days=L=>DN.map((n,i)=>`<span class="lnc ${(L.days||[]).includes(i)?'a':''}">${n}</span>`).join('');
const svc=L=>SV.filter(([k])=>L.svc&&L.svc[k]).map(x=>x[1]).join(' • ')||'—';
const taken=L=>Object.values(DB.lreqs||{}).filter(x=>x.lid==L.id&&x.st==1).reduce((a,x)=>a+(x.seats||0),0);

function reqCard(x){
 const tg=x.st==1?['s','مقبول']:x.st==0?['w','جديد']:x.st==2?['x','مرفوض']:x.st==-1?['x','ألغاه الزبون']:['x','ملغي'];
 return `<div class="card"><div class="row sp"><b>${esc(x.cn||'زبون')}</b><span class="tag ${tg[0]}">${tg[1]}</span></div>
 <div class="mu">${esc(x.ll||'')}</div><div class="mu">${x.seats} مقعد • ${fmt(x.tot)}</div>
 <div class="mu">📍 الانطلاق: ${esc(x.fa)} — <a href="${osm(x.from)}" target="_blank" rel="noopener">فتح الموقع</a></div>
 <div class="mu">🏁 الوصول: ${esc(x.ta)} — <a href="${osm(x.to)}" target="_blank" rel="noopener">فتح الموقع</a></div>
 ${x.cp?`<div class="mu">📞 <a href="tel:${esc(x.cp)}">${esc(x.cp)}</a></div>`:''}
 ${x.note?`<div class="mu">📝 ${esc(x.note)}</div>`:''}
 ${x.pimg?`<img src="${esc(x.pimg)}" alt="" style="width:76px;height:76px;border-radius:14px;object-fit:cover;margin:6px 0">`:''}
 ${x.why&&x.st==2?`<div class="mu off">${esc(x.why)}</div>`:''}
 ${x.st==0?`<div class="row" style="gap:8px"><button class="big" style="margin:0;flex:1" onclick="lnAns('${esc(x.id)}',1)">✅ موافقة</button><button class="l" style="margin:0;flex:1;min-height:54px" onclick="lnAns('${esc(x.id)}',2)">رفض</button></div>`:''}
 ${x.st==1?`<button class="l" style="width:100%;margin-top:6px" onclick="lnAns('${esc(x.id)}',2)">إلغاء مقعد هذا الراكب</button>`:''}</div>`}

function lineCard(L){
 const t=taken(L),pas=Object.values(DB.lreqs||{}).filter(x=>x.lid==L.id&&x.st==1);
 return `<div class="card">${L.img?`<div class="lni" style="background-image:url('${esc(L.img)}')"></div>`:''}
 <div class="row sp"><b>${esc(L.fa)} ← ${esc(L.ta)}</b><span class="tag ${L.on===0?'off':L.off?'x':'on'}">${L.off?'أوقفته الإدارة':L.on===0?'متوقف':'يعمل'}</span></div>
 <div class="mu">🚐 ${esc(L.car||'')} • ${t}/${L.seats} مقعد محجوز • ${L.scope=='out'?'خارج المحافظة':'داخل المحافظة'}${L.gov?' • '+esc(L.gov):''}</div>
 <div>${days(L)}</div><div class="mu">🕖 الذهاب ${esc(L.t1||'—')}${L.t2?' • العودة '+esc(L.t2):''} • ${svc(L)}</div>
 <div class="mu"><b>${fmt(L.price)}</b> للمقعد</div>
 ${pas.length?`<div class="mu" style="margin-top:6px"><b>الركاب:</b> ${pas.map(x=>esc(x.cn||'راكب')+' ('+x.seats+')'+(x.cp?` <a href="tel:${esc(x.cp)}">📞</a>`:'')).join(' • ')}</div>`:''}
 <div class="row" style="gap:6px;margin-top:8px"><button class="l" style="flex:1;margin:0;min-height:44px" onclick="lnToggle('${esc(L.id)}')">${L.on===0?'تشغيل':'إيقاف مؤقت'}</button><button class="l" style="flex:1;margin:0;min-height:44px" onclick="lnEdit('${esc(L.id)}')">تعديل</button><button class="l off" style="flex:1;margin:0;min-height:44px" onclick="lnDel('${esc(L.id)}')">حذف</button></div></div>`}

window.linesPg=function(){
 const Ls=Object.values(DB.lines||{}).sort((a,b)=>b.at-a.at),Q=Object.values(DB.lreqs||{}).sort((a,b)=>(a.st==0?0:1)-(b.st==0?0:1)||b.at-a.at),P0=Q.filter(x=>x.st==0).length;
 try{if(window._lq!=null&&P0>window._lq&&typeof snd!='undefined'&&snd&&typeof ring=='function')ring(3)}catch(e){}window._lq=P0;
 const t=LD.tab;
 return `<div class="row sp"><h1>🚐 الخطوط</h1><div class="row" style="gap:8px"><button class="fab" onclick="pg='wallet';draw()" aria-label="المحفظة">💰</button><button class="fab" onclick="pg='set';draw()" aria-label="الإعدادات">⚙️</button><button class="fab" onclick="logout()" aria-label="خروج">🚪</button></div></div>
 <div class="row" style="gap:8px;margin:8px 0"><button class="${t=='req'?'big':'l'}" style="flex:1;margin:0;min-height:46px" onclick="LD.tab='req';draw()">الطلبات${P0?' ('+P0+')':''}</button><button class="${t=='mine'?'big':'l'}" style="flex:1;margin:0;min-height:46px" onclick="LD.tab='mine';draw()">خطوطي (${Ls.length})</button><button class="${t=='sug'?'big':'l'}" style="flex:1;margin:0;min-height:46px" onclick="LD.tab='sug';draw()">مطلوب (${(DB.lsug||[]).length})</button></div>
 ${t=='sug'?`<div class="mu">مسارات يطلبها الزبائن ولا يوجد لها خط بعد — أضف خطاً يغطيها.</div>`+((DB.lsug||[]).length?DB.lsug.map(x=>`<div class="card"><div class="row sp"><b>${esc(x.fa)} ← ${esc(x.ta)}</b>${x.n>1?`<span class="tag on">${x.n} طلبات</span>`:''}</div><div class="mu">${x.tm?'الوقت: '+esc(x.tm)+' • ':''}المقاعد: ${x.seats}${x.days?' • '+esc(x.days):''}${x.note?'<br>'+esc(x.note):''}</div><button class="l" onclick="LD.tab='mine';lnEdit()">＋ إضافة خط لهذا المسار</button></div>`).join(''):'<div class="card mu" style="text-align:center">لا توجد طلبات مسارات حالياً</div>'):''}
 ${t=='sug'?'':t=='req'?(Q.length?Q.slice(0,60).map(reqCard).join(''):'<div class="card mu" style="text-align:center"><div style="font-size:42px">🚐</div>لا توجد طلبات بعد. أضف خطك وسيظهر للجميع.<button class="big" onclick="LD.tab=\'mine\';lnEdit()">＋ إضافة خط</button></div>')
  :`<button class="big" onclick="lnEdit()">＋ إضافة خط جديد</button>${Ls.length?Ls.map(lineCard).join(''):'<div class="card mu" style="text-align:center">لم تضف أي خط بعد.</div>'}`}`};

window.lnAns=async(id,st)=>{
 if(st==2){const w=prompt('سبب الرفض أو الإلغاء (اختياري)');if(w===null)return;return act('lreqs',id,{st:2,why:w||''})}
 return act('lreqs',id,{st:1})};
window.lnToggle=id=>{const L=(DB.lines||{})[id];if(L)act('lines',id,{on:L.on===0?1:0})};
window.lnDel=id=>{if(confirm('حذف هذا الخط؟ ستُلغى الطلبات المرتبطة به ويُشعَر الركاب.'))act('lines',id,null)};

/* ---------- نموذج إضافة/تعديل خط ---------- */
window.lnEdit=function(id){
 const O=id?(DB.lines||{})[id]:null,S={pos:{a:O&&O.from,b:O&&O.to},set:{a:!!O,b:!!O},days:new Set(O?O.days:[6,0,1,2,3]),img:'',img2:'',dimg:''};
 const el=document.createElement('div');el.className='lnm lnf';const $=s=>el.querySelector(s);
 const seats=[4,10,11];if(O&&!seats.includes(O.seats))seats.push(O.seats);
 const v=f=>esc(O&&O[f]!=null?O[f]:'');
 el.innerHTML=`<div>
 <div class="row sp"><h1 style="margin:0">${O?'تعديل الخط':'إضافة خط'}</h1><button class="fab" id="lnx" aria-label="إغلاق">✕</button></div>
 <div class="card"><b>📍 المسار</b>
  <div class="row" style="gap:8px;margin:8px 0"><button class="big" id="lnA" style="margin:0;min-height:42px;flex:1">نقطة الانطلاق</button><button class="l" id="lnB" style="margin:0;min-height:42px;flex:1">نقطة الوصول</button></div>
  <div class="lnmap" id="lnmap"></div><div class="mu">اضغط على الخريطة لتحديد النقطة المختارة أو اسحب العلامة.</div>
  <input id="lfa" placeholder="منطقة الانطلاق (مثال: حي الجامعة)" value="${v('fa')}"><input id="lta" placeholder="الوجهة (مثال: جامعة بغداد / مجمع الدوائر)" value="${v('ta')}">
  <select id="lsc"><option value="in" ${O&&O.scope=='out'?'':'selected'}>داخل المحافظة</option><option value="out" ${O&&O.scope=='out'?'selected':''}>خارج المحافظة</option></select>
  <input id="lgov" placeholder="المحافظة / المحافظات (اختياري)" value="${v('gov')}"></div>
 <div class="card"><b>🚐 المركبة والمقاعد</b>
  <select id="lse">${seats.map(n=>`<option value="${n}" ${O&&O.seats==n||(!O&&n==10)?'selected':''}>سيارة ستاركس ${n} راكب</option>`).join('')}</select>
  <input id="lcar" placeholder="نوع المركبة وموديلها" value="${v('car')}"><input id="lco" placeholder="اللون" value="${v('color')}"><input id="lpl" placeholder="رقم اللوحة" value="${v('plate')}"><input id="lyr" placeholder="سنة الصنع" value="${v('year')}"></div>
 <div class="card"><b>💵 السعر (تحدده أنت) للمقعد الواحد</b><input id="lpr" type="number" inputmode="numeric" placeholder="مثال: 5000" value="${v('price')}"></div>
 <div class="card"><b>📅 أيام العمل</b><div class="lnd">${DN.map((n,i)=>`<label><input type="checkbox" data-d="${i}" ${S.days.has(i)?'checked':''}>${n}</label>`).join('')}</div>
  <div class="row" style="gap:8px"><label class="mu" style="flex:1">وقت الذهاب<input id="lt1" type="time" value="${v('t1')}"></label><label class="mu" style="flex:1">وقت العودة<input id="lt2" type="time" value="${v('t2')}"></label></div></div>
 <div class="card"><b>الخدمات في السيارة</b><div class="lnd">${SV.map(([k,n])=>`<label><input type="checkbox" data-s="${k}" ${O&&O.svc&&O.svc[k]?'checked':''}>${n}</label>`).join('')}</div></div>
 <div class="card"><b>📷 الصور (اختياري)</b>
  ${[['img','صورة السيارة'],['img2','داخل السيارة'],['dimg','صورتك كابتن']].map(([k,n])=>`<label class="card up" style="margin:8px 0"><span><b>${n}</b><div class="mu" id="up_${k}">${O&&O[k]?'مرفوعة ✓ (اختر لتغييرها)':'اضغط للاختيار'}</div></span><span>📷</span><input type="file" hidden accept="image/*" data-k="${k}"></label>`).join('')}</div>
 <div class="card"><input id="lnote" placeholder="ملاحظات للركاب (اختياري)" value="${v('note')}"></div>
 <button class="big" id="lok">حفظ الخط</button></div>`;
 document.body.appendChild(el);
 $('#lnx').onclick=()=>el.remove();
 const cur=k=>{if(S.c)S.c.cur=k;$('#lnA').className=k=='a'?'big':'l';$('#lnB').className=k=='b'?'big':'l'};
 $('#lnA').onclick=()=>cur('a');$('#lnB').onclick=()=>cur('b');
 const fill=(k,p)=>{const i=$(k=='a'?'#lfa':'#lta');geoRev(p).then(t=>{if(i&&!i.dataset.m&&!i.value&&t)i.value=t}).catch(()=>{})};
 $('#lfa').oninput=e=>e.target.dataset.m=1;$('#lta').oninput=e=>e.target.dataset.m=1;
 S.c=mapPick($('#lnmap'),(O&&O.from)||(typeof pos!='undefined'&&pos)||BG,p=>{for(const k of ['a','b']){const q=p[k];if(q&&(!S.pos[k]||S.pos[k].lat!=q.lat||S.pos[k].lng!=q.lng)){S.pos[k]={lat:q.lat,lng:q.lng};S.set[k]=1;fill(k,S.pos[k]);if(k=='a'&&!S.set.b)cur('b')}}},O?{a:O.from,b:O.to}:undefined);
 el.querySelectorAll('input[data-k]').forEach(i=>i.onchange=async()=>{const f=i.files[0];if(!f)return;const k=i.dataset.k,s=$('#up_'+k);s.textContent='جارٍ الرفع…';try{S[k]=await upl(f,1100);s.textContent='تم الرفع ✓'}catch(e){s.textContent='فشل الرفع، أعد المحاولة'}});
 $('#lok').onclick=async()=>{
  const d=[...el.querySelectorAll('input[data-d]')].filter(x=>x.checked).map(x=>+x.dataset.d),price=Math.round(+$('#lpr').value),fa=$('#lfa').value.trim(),ta=$('#lta').value.trim();
  if(!S.set.a||!S.set.b)return alert('حدّد نقطة الانطلاق ونقطة الوصول على الخريطة');
  if(!fa||!ta)return alert('اكتب منطقة الانطلاق والوجهة');if(!(price>0))return alert('اكتب سعر المقعد');if(!d.length)return alert('اختر يوماً واحداً على الأقل');
  const b=$('#lok');b.disabled=true;
  const sv={};el.querySelectorAll('input[data-s]').forEach(x=>sv[x.dataset.s]=x.checked?1:0);
  const body={from:S.pos.a,to:S.pos.b,fa,ta,scope:$('#lsc').value,gov:$('#lgov').value.trim(),seats:+$('#lse').value,price,days:d,t1:$('#lt1').value,t2:$('#lt2').value,svc:sv,car:$('#lcar').value.trim(),color:$('#lco').value.trim(),plate:$('#lpl').value.trim(),year:$('#lyr').value.trim(),note:$('#lnote').value.trim()};
  for(const k of ['img','img2','dimg'])if(S[k])body[k]=S[k];
  const ok=await set('lines',id||'l'+Date.now().toString(36)+Math.random().toString(36).slice(2,5),body);
  if(!ok){b.disabled=false;return alert('تعذر حفظ الخط. تأكد من البيانات (ولا يمكن تقليل المقاعد عن عدد الركاب المقبولين).')}
  el.remove();LD.tab='mine';draw()};
};
})();

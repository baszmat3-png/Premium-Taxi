/* dreg.js — واجهة دخول الكابتن/الدلفري + التسجيل الكامل بالمستمسكات والفيديو + متابعة الطلب */
(function(){
const E=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const LS={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const TYPES=[
 {k:'taxi',i:'🚕',t:'كابتن تكسي',d:'سيارة صالون أو SUV بحالة جيدة'},
 {k:'delivery',v:'bike',i:'🛵',t:'دلفري دراجة',d:'توصيل طلبات المطاعم بالدراجة النارية'},
 {k:'delivery',v:'car',i:'🚗',t:'دلفري سيارة',d:'توصيل طلبات المطاعم بالسيارة'},
 {k:'both',i:'⚡',t:'تكسي + دلفري',d:'استقبل الرحلات وطلبات التوصيل معاً'},
 {k:'line',i:'🚐',t:'كابتن خطوط',d:'ستاركس أو كيا 10–11 راكب لخطوط الدوائر والجامعات'}];
const D={
 idf:['🪪','الهوية الوطنية — الوجه الأمامي','صورة واضحة كاملة الحواف','i'],
 idb:['🪪','الهوية الوطنية — الوجه الخلفي','صورة واضحة كاملة الحواف','i'],
 lic:['📄','إجازة السوق','سارية المفعول','i'],
 reg1:['📑','سنوية السيارة — الوجه الأمامي','تطابق رقم اللوحة','i'],
 reg2:['📑','سنوية السيارة — الوجه الخلفي','','i'],
 self:['🤳','صورة شخصية','وجه واضح، بدون نظارة شمسية','i'],
 car1:['🚘','السيارة من الأمام','تظهر اللوحة بوضوح','i'],
 car2:['🚘','السيارة من الخلف','تظهر اللوحة بوضوح','i'],
 car4:['🚘','السيارة من الجانب','','i'],
 car3:['💺','داخل السيارة','المقاعد والنظافة','i'],
 veh1:['🛵','صورة المركبة مع اللوحة','الدراجة أو السيارة كاملة','i'],
 box:['📦','صندوق التوصيل','إن وُجد','i'],
 v1:['🎥','فيديو تعريفي','امسك هويتك بجانب وجهك وقل اسمك الثلاثي (10–20 ثانية)','v'],
 v2:['🎬','فيديو السيارة','لفّ حول السيارة من الخارج ثم صوّر الداخل (20–40 ثانية)','v']};
const REQ={car:{need:['idf','idb','lic','reg1','self','car1','car2','car3','v1','v2'],opt:['reg2','car4']},del:{need:['idf','idb','self','veh1','v1'],opt:['lic','box']}};
const kindOf=R=>R.type=='delivery'?'del':'car';
let R=LS.get('dreg',{}),P='login',UP={};
const save=()=>{R.p=P;LS.set('dreg',R)};
const go=p=>{P=p;if(['type','info','docs','review'].includes(p))R.rp=p;save();draw();const w=document.querySelector('.drw');w&&(w.scrollTop=0)};
const draw=()=>{const v=document.getElementById('v');if(v&&(!window.AUTH||!AUTH.pin))DREG.view(v)};

const css=document.createElement('style');css.textContent=`
.drw{position:fixed;inset:0;z-index:60;overflow-y:auto;-webkit-overflow-scrolling:touch;background:radial-gradient(120% 60% at 50% 0,#1e3a8a 0,#0b1226 55%,#070b18 100%);color:#fff;padding:calc(18px + env(safe-area-inset-top,0px)) 16px 40px;font-family:inherit;direction:rtl}
.drw *{box-sizing:border-box}.drc{max-width:460px;margin:0 auto}
.drh{text-align:center;padding:26px 0 18px}.drl{width:86px;height:86px;border-radius:26px;margin:0 auto 14px;display:grid;place-items:center;font-size:48px;background:linear-gradient(135deg,#fbbf24,#f59e0b);box-shadow:0 14px 40px #f59e0b55}
.drh h1{margin:0;font-size:26px;color:#fff}.drh p{margin:6px 0 0;color:#a5b4d4;font-size:14px}
.drk{background:#fff;color:#0b1324;border-radius:26px;padding:20px;box-shadow:0 20px 60px #0008;margin-bottom:14px}
.drk h2{margin:0 0 4px;font-size:19px;color:#0b1324}.drk .m{color:#64748b;font-size:13px;margin:0 0 12px}
.drf{position:relative;margin:10px 0}.drf span{position:absolute;inset-inline-start:14px;top:50%;transform:translateY(-50%);font-size:18px;opacity:.75}
.drf input,.drf select,.drk textarea{width:100%;margin:0;border:1.5px solid #e2e8f0;background:#f8fafc;color:#0b1324;border-radius:16px;padding:15px 46px 15px 14px;font-size:16px;font-family:inherit;outline:none}
.drf input:focus,.drf select:focus{border-color:#2563eb;background:#fff;box-shadow:0 0 0 4px #2563eb22}
.drb{display:block;width:100%;border:0;border-radius:18px;padding:16px;font-size:17px;font-weight:800;font-family:inherit;cursor:pointer;margin:10px 0 0;min-height:0}
.drb.p{background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff;box-shadow:0 10px 26px #2563eb55}.drb.y{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1a1203;box-shadow:0 10px 26px #f59e0b44}
.drb.g{background:transparent;color:#fff;border:1.5px solid #ffffff44}.drb.l{background:#f1f5f9;color:#0b1324}.drb:disabled{opacity:.5}
.drx{display:flex;align-items:center;gap:10px;color:#94a3b8;font-size:13px;margin:18px 0 8px}.drx:before,.drx:after{content:'';flex:1;height:1px;background:#ffffff22}
.drp{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.drp div{background:#ffffff10;border:1px solid #ffffff1a;border-radius:16px;padding:10px 6px;text-align:center;font-size:12px;color:#cbd5e1}.drp b{display:block;font-size:20px;margin-bottom:2px}
.drt{display:flex;gap:12px;align-items:center;padding:14px;border:1.5px solid #e2e8f0;border-radius:18px;margin:8px 0;cursor:pointer;background:#fff}.drt.a{border-color:#2563eb;background:#eff6ff;box-shadow:0 0 0 4px #2563eb18}.drt i{font-style:normal;font-size:30px;width:48px;text-align:center}.drt b{display:block;font-size:16px}.drt small{color:#64748b}
.drs{display:flex;gap:6px;margin:0 0 16px}.drs i{flex:1;height:5px;border-radius:9px;background:#ffffff22}.drs i.a{background:#fbbf24}
.drtop{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.drtop button{background:#ffffff14;color:#fff;border:0;border-radius:14px;padding:10px 14px;font-size:15px;min-height:0;margin:0;width:auto;font-family:inherit}
.drd{display:flex;gap:12px;align-items:center;padding:12px;border:1.5px dashed #cbd5e1;border-radius:18px;margin:8px 0;cursor:pointer;background:#f8fafc;position:relative;overflow:hidden}
.drd.ok{border-style:solid;border-color:#16a34a;background:#f0fdf4}.drd .ic{width:58px;height:58px;border-radius:14px;display:grid;place-items:center;font-size:26px;background:#fff;flex:none;overflow:hidden}.drd .ic img,.drd .ic video{width:100%;height:100%;object-fit:cover}
.drd .tx{flex:1;min-width:0}.drd b{display:block;font-size:14.5px}.drd b .rq{display:inline}.drd small{color:#64748b;font-size:12px;display:block}.drd .st{font-size:12px;font-weight:700;color:#2563eb}.drd.ok .st{color:#16a34a}
.drd .bar{position:absolute;left:0;bottom:0;height:4px;background:#2563eb;transition:width .2s}.drd .rq{color:#dc2626}
.drpr{background:#eef2ff;border-radius:14px;padding:10px 12px;font-size:13px;color:#3730a3;margin:8px 0}.drok{text-align:center;padding:10px 0}.drok .e{font-size:64px}
.drcode{background:#0b1324;color:#fbbf24;border-radius:16px;padding:14px;text-align:center;font-size:18px;letter-spacing:1px;direction:ltr;margin:8px 0;user-select:all}
.drlst{margin:0;padding:0 18px 0 0;color:#334155;font-size:13.5px;line-height:1.9}`;
document.head.appendChild(css);

function login(){const st=LS.get('dapk',null);
 return `<div class="drh"><div class="drl">🚕</div><h1>تطبيق الكابتن</h1><p>تكسي المتميز — تكسي وتوصيل طعام</p></div>
 <div class="drk"><h2>تسجيل الدخول</h2><p class="m">أدخل رمز الكابتن والرمز السري المرسلين لك بعد تفعيل حسابك</p>
 <div class="drf"><span>🆔</span><input id="li" autocapitalize="off" autocorrect="off" spellcheck="false" inputmode="text" placeholder="رمز الكابتن" value="${E(R.did||'')}"></div>
 <div class="drf"><span>🔒</span><input id="lp" autocapitalize="off" autocorrect="off" spellcheck="false" type="password" placeholder="الرمز السري" value="${E(R.pin||'')}" onkeydown="if(event.key=='Enter')lg()"></div>
 <button class="drb p" onclick="lg()">دخول</button></div>
 <div class="drx">ليس لديك حساب؟</div>
 <button class="drb y" onclick="DREG.start()">🧑‍✈️ سجّل ككابتن تكسي أو دلفري</button>
 ${st?`<button class="drb g" onclick="DREG.status()">📋 متابعة حالة طلبي</button>`:''}
 <div class="drp"><div><b>💰</b>أرباح يومية</div><div><b>🎁</b>مكافأة ترحيب</div><div><b>🏦</b>سحب كي كارد وزين كاش</div></div>`}

function steps(n){return `<div class="drs">${[1,2,3,4].map(i=>`<i class="${i<=n?'a':''}"></i>`).join('')}</div>`}
function top(t,back){return `<div class="drtop"><button onclick="${back}">→ رجوع</button><b>${t}</b><span style="width:60px"></span></div>`}

function typeV(){return top('التسجيل',"DREG.go('login')")+steps(1)+`<div class="drk"><h2>اختر نوع العمل</h2><p class="m">يمكنك تغييره لاحقاً عبر الدعم</p>
 ${TYPES.map((t,i)=>`<div class="drt ${R.ti==i?'a':''}" onclick="DREG.pick(${i})"><i>${t.i}</i><div><b>${t.t}</b><small>${t.d}</small></div></div>`).join('')}
 <button class="drb p" ${R.ti==null?'disabled':''} onclick="DREG.go('info')">التالي</button></div>
 <div class="drk"><h2>📋 ستحتاج إلى</h2><ul class="drlst"><li>الهوية الوطنية (الوجهين)</li><li>إجازة السوق وسنوية المركبة</li><li>صور المركبة من الأمام والخلف والداخل</li><li>فيديو تعريفي قصير وفيديو للمركبة</li></ul></div>`}

function infoV(){const t=TYPES[R.ti]||TYPES[0],f=R.f||{},car=kindOf(R)=='car'||t.v=='car';
 const I=(k,ic,ph,ty,ex)=>`<div class="drf"><span>${ic}</span><input id="rf_${k}" ${ty?`type="${ty}"`:''} ${ex||''} placeholder="${ph}" value="${E(f[k]||'')}" oninput="DREG.f('${k}',this.value)"></div>`;
 return top('المعلومات',"DREG.go('type')")+steps(2)+`<div class="drk"><h2>${t.i} ${t.t}</h2><p class="m">المعلومات الشخصية</p>
 ${I('n','👤','الاسم الثلاثي كما في الهوية')}${I('ph','📱','رقم الهاتف (واتساب)','tel','inputmode="tel" dir="ltr"')}${I('city','📍','المدينة / المنطقة')}
 <p class="m" style="margin-top:14px">معلومات المركبة</p>
 ${I('car','🚘',car?'نوع السيارة وموديلها (مثال: كيا سيراتو)':'نوع الدراجة (مثال: هوندا 150)')}${I('year','📅','سنة الصنع','','inputmode="numeric" maxlength="4"')}${I('color','🎨','اللون')}${I('plate','🔢','رقم اللوحة والمحافظة')}
 <button class="drb p" onclick="DREG.next2()">التالي: المستمسكات</button></div>`}

function docsV(){const K=REQ[kindOf(R)],dc=R.docs||{},all=[...K.need,...K.opt],done=K.need.filter(k=>dc[k]).length;
 return top('المستمسكات',"DREG.go('info')")+steps(3)+`<div class="drk"><h2>📎 المستمسكات والصور</h2><p class="m">اضغط على كل بند للتصوير أو الاختيار من المعرض</p>
 <div class="drpr">اكتمل ${done} من ${K.need.length} مطلوب</div>
 ${all.map(k=>{const d=D[k],u=dc[k],up=UP[k],rq=K.need.includes(k);return `<label class="drd ${u?'ok':''}"><div class="ic">${u?(d[3]=='v'?`<video src="${E(u)}" muted playsinline preload="metadata"></video>`:`<img src="${E(u)}" alt="">`):d[0]}</div><div class="tx"><b>${d[1]} ${rq?'<span class="rq">*</span>':'<small style="display:inline">(اختياري)</small>'}</b><small>${d[2]}</small><span class="st">${up!=null?'جارٍ الرفع… '+up+'%':u?'✓ تم الرفع — اضغط للتغيير':d[3]=='v'?'🎥 اضغط لتصوير الفيديو':'📷 اضغط للتصوير'}</span></div>${up!=null?`<i class="bar" style="width:${up}%"></i>`:''}<input type="file" hidden accept="${d[3]=='v'?'video/*':'image/*'}" ${k=='self'?'capture="user"':''} onchange="DREG.up('${k}',this)"></label>`}).join('')}
 <button class="drb p" ${done<K.need.length?'disabled':''} onclick="DREG.go('review')">التالي: المراجعة</button></div>`}

function reviewV(){const t=TYPES[R.ti]||TYPES[0],f=R.f||{},row=(a,b)=>`<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eef2f7"><span style="color:#64748b">${a}</span><b>${E(b||'—')}</b></div>`;
 return top('المراجعة',"DREG.go('docs')")+steps(4)+`<div class="drk"><h2>راجع طلبك</h2>${row('نوع العمل',t.t)}${row('الاسم',f.n)}${row('الهاتف',f.ph)}${row('المدينة',f.city)}${row('المركبة',[f.car,f.year,f.color].filter(Boolean).join(' • '))}${row('اللوحة',f.plate)}${row('المستمسكات',Object.keys(R.docs||{}).length+' ملف')}
 <label style="display:flex;gap:8px;align-items:flex-start;margin:14px 0;font-size:13.5px;color:#334155"><input type="checkbox" id="rf_ok" style="width:auto;margin-top:3px"> أقرّ بصحة المعلومات والمستمسكات، وأوافق على <a href="/privacy.html" target="_blank">شروط الاستخدام وسياسة الخصوصية</a></label>
 <button class="drb y" id="rf_send" onclick="DREG.send()">إرسال الطلب</button></div>`}

function doneV(){return `<div class="drh"><div class="drl" style="background:linear-gradient(135deg,#22c55e,#16a34a)">✓</div><h1>تم إرسال طلبك</h1><p>سيراجع فريقنا المستمسكات خلال 24–48 ساعة</p></div>
 <div class="drk"><h2>ماذا بعد؟</h2><ul class="drlst"><li>تصلك رسالة عند تفعيل حسابك</li><li>تظهر لك هنا بيانات الدخول بعد الموافقة</li><li>احتفظ بهذا الجهاز لمتابعة الطلب</li></ul><button class="drb p" onclick="DREG.status()">📋 متابعة حالة الطلب</button><button class="drb l" onclick="DREG.go('login')">العودة لتسجيل الدخول</button></div>`}

function statusV(){const s=R.st||{};let body;
 if(s.loading)body='<div class="drok"><div class="e">⏳</div><p class="m">جارٍ التحقق…</p></div>';
 else if(s.e)body=`<div class="drok"><div class="e">⚠️</div><p class="m">${E(s.e)}</p></div>`;
 else if(s.st>0)body=`<div class="drok"><div class="e">🎉</div><h2>تم تفعيل حسابك</h2><p class="m">بيانات الدخول الخاصة بك:</p></div><div class="drcode">رمز الكابتن: ${E(s.did)}</div><div class="drcode">الرمز السري: ${E(s.pin)}</div><button class="drb p" onclick="DREG.useCreds()">الدخول الآن</button>`;
 else if(s.st<0)body=`<div class="drok"><div class="e">❌</div><h2>لم يُقبل الطلب</h2><p class="m">${E(s.why||'تواصل مع الدعم لمعرفة السبب')}</p></div><button class="drb y" onclick="DREG.restart()">تقديم طلب جديد</button>`;
 else body=`<div class="drok"><div class="e">🕒</div><h2>طلبك قيد المراجعة</h2><p class="m">${E(s.n||'')} — سنبلغك فور التفعيل</p></div><button class="drb l" onclick="DREG.status()">🔄 تحديث</button>`;
 return top('حالة الطلب',"DREG.go('login')")+`<div class="drk">${body}</div>`}

window.DREG={
 view(v){const V={login,type:typeV,info:infoV,docs:docsV,review:reviewV,done:doneV,status:statusV}[P]||login;v.innerHTML=`<div class="drw"><div class="drc">${V()}</div></div>`},
 go,start(){go(R.rp&&R.ti!=null?R.rp:'type')},
 pick(i){R.ti=i;R.type=TYPES[i].k;R.veh=TYPES[i].v||'car';save();draw()},
 f(k,v){R.f=R.f||{};R.f[k]=v;save()},
 next2(){const f=R.f||{};if(String(f.n||'').trim().split(/\s+/).length<3)return alert('أدخل الاسم الثلاثي');if(String(f.ph||'').replace(/\D/g,'').length<10)return alert('أدخل رقم هاتف صحيح');if(!f.car||!f.plate)return alert('أدخل نوع المركبة ورقم اللوحة');go('docs')},
 async apt(){if(R.apt&&R.aptAt&&Date.now()-R.aptAt<2.5*36e5)return R.apt;const r=await fetch('/api/apply/start',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}),j=await r.json().catch(()=>({}));if(!j.apt)throw new Error(j.e||'تعذر بدء التسجيل');R.apt=j.apt;R.aptAt=Date.now();save();return j.apt},
 async up(k,el){const f=el.files&&el.files[0];if(!f)return;const vid=D[k][3]=='v';if(vid&&f.size>58e6)return alert('الفيديو كبير جداً — صوّر فيديو أقصر (أقل من دقيقة)');
  let body=f,type=f.type||(vid?'video/mp4':'image/jpeg');
  if(!vid&&window.imgPick){body=await new Promise(res=>imgPick(f,d=>fetch(d).then(x=>x.blob()).then(res),1600));type='image/jpeg'}
  if(vid&&!/^video\/(mp4|quicktime|webm|3gpp|x-m4v)/.test(type))type='video/mp4';
  let tok;try{tok=await DREG.apt()}catch(e){return alert(e.message)}
  UP[k]=0;draw();
  const x=new XMLHttpRequest();x.open('POST','/api/upload');x.setRequestHeader('Content-Type',type);x.setRequestHeader('x-apt',tok);
  x.upload.onprogress=e=>{if(e.lengthComputable){UP[k]=Math.round(e.loaded/e.total*100);draw()}};
  x.onload=()=>{delete UP[k];let j={};try{j=JSON.parse(x.responseText)}catch(e){}if(x.status==200&&j.url){R.docs=R.docs||{};R.docs[k]=j.url;save()}else{if(x.status==401){R.apt=null;save()}alert(j.e||'تعذر رفع الملف، حاول مرة أخرى')}draw()};
  x.onerror=()=>{delete UP[k];alert('تعذر الاتصال، تحقق من الإنترنت');draw()};x.send(body)},
 async send(){if(!document.getElementById('rf_ok').checked)return alert('يرجى الموافقة على الإقرار');const b=document.getElementById('rf_send');b.disabled=true;b.textContent='جارٍ الإرسال…';
  try{const tok=await DREG.apt(),f=R.f||{},r=await fetch('/api/apply/send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apt:tok,type:R.type,veh:R.veh,n:f.n,ph:f.ph,city:f.city,car:f.car,year:f.year,color:f.color,plate:f.plate,docs:R.docs||{}})}),j=await r.json().catch(()=>({}));
   if(!r.ok||!j.id){b.disabled=false;b.textContent='إرسال الطلب';return alert(j.e||'تعذر إرسال الطلب')}
   LS.set('dapk',{id:j.id,key:j.key});R={};P='done';save();draw()}catch(e){b.disabled=false;b.textContent='إرسال الطلب';alert('تعذر الاتصال')}},
 async status(){const k=LS.get('dapk',null);if(!k)return go('type');R.st={loading:1};go('status');
  try{const r=await fetch('/api/apply/status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(k)}),j=await r.json().catch(()=>({}));R.st=r.ok?j:{e:j.e||'تعذر جلب الحالة'}}catch(e){R.st={e:'تعذر الاتصال'}}save();draw()},
 useCreds(){const s=R.st||{};R={did:s.did,pin:s.pin};P='login';save();draw();setTimeout(()=>{try{lg()}catch(e){}},50)},
 restart(){try{localStorage.removeItem('dapk')}catch(e){}R={};go('type')}};
})();

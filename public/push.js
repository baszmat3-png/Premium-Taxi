/* push.js — تفعيل إشعارات الدفع للزبون والكابتن والمطعم
   - يعرض شريطاً صغيراً يطلب إذن الإشعارات بضغطة المستخدم (المتصفحات تمنع الطلب التلقائي)
   - يعيد تسجيل الاشتراك تلقائياً بعد كل تسجيل دخول */
(function(){
 if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window)||!window.isSecureContext)return;
 const ROLES={customer:1,driver:1,rest:1};
 let last='',bar=null,busy=0;
 const u8=s=>{const p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(r,c=>c.charCodeAt(0))};
 const who=()=>{try{return AUTH&&ROLES[AUTH.role]&&AUTH.id?AUTH.role+':'+AUTH.id:''}catch(e){return ''}};
 async function subscribe(){
  const reg=await navigator.serviceWorker.ready,k=(await(await fetch('/api/push/key')).json()).key,key=u8(k);
  let s=await reg.pushManager.getSubscription();
  if(s){const cur=s.options&&s.options.applicationServerKey;if(cur&&cur.byteLength&&new Uint8Array(cur).join()!==key.join()){await s.unsubscribe();s=null}}
  if(!s)s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
  const r=await fetch('/api/push/sub',{method:'POST',headers:H(),body:JSON.stringify({sub:s.toJSON()})});
  return r.ok}
 function hide(){if(bar){bar.remove();bar=null}}
 function show(w){
  if(bar||sessionStorage.pushNo||(+localStorage.pushNo||0)>Date.now()-3*864e5)return;
  bar=document.createElement('div');
  bar.style.cssText='position:fixed;z-index:99999;inset-inline:12px;top:calc(10px + env(safe-area-inset-top,0px));background:#111827;color:#fff;border-radius:16px;padding:12px 14px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px #0006;font:600 14px/1.5 system-ui,sans-serif';
  bar.innerHTML='<span style="font-size:22px">🔔</span><span style="flex:1">فعّل الإشعارات لتصلك حالة الطلبات والرحلات فوراً</span><button id="pnY" style="border:0;border-radius:12px;padding:9px 14px;background:#16a34a;color:#fff;font:700 14px system-ui">تفعيل</button><button id="pnN" aria-label="لاحقاً" style="border:0;border-radius:12px;padding:9px 11px;background:#ffffff22;color:#fff;font:700 14px system-ui">✕</button>';
  document.body.appendChild(bar);
  bar.querySelector('#pnY').onclick=async()=>{hide();try{const p=await Notification.requestPermission();if(p==='granted'&&await subscribe())last=w}catch(e){}};
  bar.querySelector('#pnN').onclick=()=>{sessionStorage.pushNo=1;localStorage.pushNo=Date.now();hide()}}
 async function tick(){
  if(busy)return;const w=who();if(!w){hide();return}if(last===w)return;busy=1;
  try{const p=Notification.permission;
   if(p==='granted'){if(await subscribe())last=w;hide()}
   else if(p==='default')show(w);
   else hide()}catch(e){}finally{busy=0}}
 setInterval(tick,6000);setTimeout(tick,2500);
 window.enablePush=async()=>{const p=await Notification.requestPermission();if(p==='granted'){const ok=await subscribe();if(ok)last=who();return ok}return false};
})();

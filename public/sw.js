const V='off-v1',OFF='/offline.html';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.add(OFF)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode!='navigate')return;
 e.respondWith(fetch(r).then(x=>(x.status>=502&&x.status<=504)?caches.match(OFF).then(o=>o||x):x).catch(()=>caches.match(OFF).then(o=>o||Response.error())))});

/* ---- إشعارات الدفع (Web Push) ---- */
self.addEventListener('push',e=>{
 let d={};try{d=e.data?e.data.json():{}}catch(_){d={t:'تكسي المتميز',b:e.data?e.data.text():''}}
 e.waitUntil(self.registration.showNotification(d.t||'تكسي المتميز',{body:d.b||'',icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',tag:d.tag||undefined,renotify:!!d.tag,data:{u:d.u||'/'},dir:'rtl',lang:'ar',vibrate:[200,100,200,100,300]}))});
self.addEventListener('notificationclick',e=>{
 e.notification.close();const u=(e.notification.data&&e.notification.data.u)||'/';
 e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{for(const c of l){if(c.url.indexOf(u.split('?')[0])>-1&&'focus' in c)return c.focus()}return clients.openWindow(u)}))});

const V='off-v1',OFF='/offline.html';
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.add(OFF)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!=V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.mode!='navigate')return;
 e.respondWith(fetch(r).then(x=>(x.status>=502&&x.status<=504)?caches.match(OFF).then(o=>o||x):x).catch(()=>caches.match(OFF).then(o=>o||Response.error())))});

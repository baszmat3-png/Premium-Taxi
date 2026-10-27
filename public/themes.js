(function(){
var T=[["auto","تلقائي (الافتراضي)","#0a3dff","#6ea0ff","#f6f8fd","#ffffff",0]].concat([["royal", "ملكي ذهبي", "#e0b252", "#b8862b", "#0d0b07", "#1b1710", 1], ["night", "ليل بنفسجي", "#8b5cf6", "#ec4899", "#090719", "#15112e", 1], ["ocean", "أعماق المحيط", "#22d3ee", "#3b82f6", "#04141c", "#0b2531", 1], ["ember", "جمر ناري", "#ff6a3d", "#ef233c", "#120806", "#22110c", 1], ["carbon", "فحمي أنيق", "#f5f5f5", "#bdbdbd", "#0a0a0a", "#171717", 1], ["emerald", "زمردي", "#0f9d6b", "#34d399", "#f1f9f5", "#ffffff", 0], ["sunset", "غروب", "#ff5a36", "#ff9f1c", "#fff5ee", "#ffffff", 0], ["rose", "وردي ملكي", "#e11d74", "#a855f7", "#fff4f8", "#ffffff", 0]]),h=document.documentElement;
function cur(){return localStorage.tm_theme||""}
function meta(){setTimeout(function(){var m=document.querySelector("meta[name=theme-color]");if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m)}m.content=(getComputedStyle(h).getPropertyValue("--bg")||"").trim()||"#fff"},60)}
function apply(t){meta();var x=T.find(function(a){return a[0]==t});if(!x||t=="auto"){h.removeAttribute("data-theme");h.removeAttribute("data-dark");return}h.setAttribute("data-theme",t);x[6]?h.setAttribute("data-dark","1"):h.removeAttribute("data-dark")}
window.THEMES=T;window.setTheme=function(t){localStorage.tm_theme=t;apply(t);draw2()};
apply(cur());
function draw2(){var p=document.getElementById("thp");if(p)p.remove()}
window.openThemes=function(){draw2();var c=cur()||(typeof DB!="undefined"&&DB.cfg&&DB.cfg.theme)||"auto",o=document.createElement("div");o.id="thp";
o.innerHTML='<div><div style="display:flex;justify-content:space-between;align-items:center"><b style="font-size:19px">🎨 اختر الثيم</b><button class="t" style="width:auto;padding:6px 14px" id="thx">إغلاق</button></div><div class="g">'+T.map(function(a){return '<button class="t '+(a[0]==c?"on":"")+'" data-t="'+a[0]+'"><i style="background:linear-gradient(135deg,'+a[4]+' 0%,'+a[4]+' 45%,'+a[2]+' 45%,'+a[3]+' 100%)"></i>'+a[1]+'</button>'}).join("")+'</div></div>';
o.onclick=function(e){var b=e.target.closest("[data-t]");if(b)return setTheme(b.dataset.t);if(e.target==o||e.target.id=="thx")o.remove()};document.body.appendChild(o)};
setInterval(function(){
if(!cur()&&typeof DB!="undefined"&&DB.cfg&&DB.cfg.theme&&h.getAttribute("data-theme")!=DB.cfg.theme&&DB.cfg.theme!="auto")apply(DB.cfg.theme)},1500);
})();

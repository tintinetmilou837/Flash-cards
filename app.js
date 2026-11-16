'use strict';
const KEY='zhcards.v1',GR=['F','E','D','C','B','A'],IV=[.007,1,3,7,14,30],DAY=864e5;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S=JSON.parse(localStorage.getItem(KEY)||'null')||{c:{},size:50,auto:true};
let cards=[],tab='home',filt={deck:'',tag:''},sess=null,qs='',calM=null,chartN=7;
const dk=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const stt=c=>S.c[c.id]||{l:null,due:0,n:0,tags:[]};
const ens=c=>S.c[c.id]||(S.c[c.id]={l:null,due:0,n:0,tags:[]});
const gl=c=>{const l=stt(c).l;return l==null?'N':GR[l]};
const tg=c=>[...new Set([...c.tags,...(stt(c).tags||[])])];
const vis=()=>cards.filter(c=>(!filt.deck||c.deck===filt.deck)&&(!filt.tag||tg(c).includes(filt.tag)));
const shuf=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
// niveau suivant : r = 0 oublié, 1 difficile, 2 bien, 3 facile (0..5 = F..A)
const nl=(l,r)=>r===0?0:l==null?[0,1,2,4][r]:Math.max(0,Math.min(5,l+[0,-1,1,2][r]));

/* ---------- CSV ---------- */
function parseCSV(t){
  t=t.replace(/^\uFEFF/,'');
  const first=t.split('\n')[0],d=[',',';','\t'].sort((a,b)=>first.split(b).length-first.split(a).length)[0];
  const rows=[];let r=[],f='',q=false;
  for(let i=0;i<t.length;i++){const ch=t[i];
    if(q){if(ch==='"'){if(t[i+1]==='"'){f+='"';i++}else q=false}else f+=ch}
    else if(ch==='"')q=true;
    else if(ch===d){r.push(f);f=''}
    else if(ch==='\n'){r.push(f);rows.push(r);r=[];f=''}
    else if(ch!=='\r')f+=ch;
  }
  if(f||r.length){r.push(f);rows.push(r)}
  return rows.filter(r=>r.some(x=>x.trim()));
}
const H={hanzi:['hanzi','caractere','caractère','character','word','mot','漢字','字'],pinyin:['pinyin','拼音'],zhuyin:['zhuyin','bopomofo','注音'],tags:['tags','tag','etiquettes','étiquettes'],meaning:['meaning','sens','traduction','translation']};
function toCards(rows,deck){
  const h=rows[0].map(x=>x.trim().toLowerCase()),ix={};let hasH=false;
  for(const k in H){const i=h.findIndex(x=>H[k].includes(x));if(i>=0){ix[k]=i;hasH=true}}
  if(!hasH)Object.assign(ix,{hanzi:0,pinyin:1,zhuyin:2,tags:3,meaning:4});
  if(ix.hanzi==null)ix.hanzi=0;
  return (hasH?rows.slice(1):rows).map(r=>{const g=k=>(r[ix[k]]??'').trim();
    return {id:deck+'/'+g('hanzi'),deck,hanzi:g('hanzi'),pinyin:g('pinyin'),zhuyin:g('zhuyin'),meaning:g('meaning'),tags:g('tags').split(/[;|]/).map(x=>x.trim()).filter(Boolean)}}).filter(c=>c.hanzi);
}

/* ---------- Chargement des decks ---------- */
async function deckList(){
  let l=null;
  const m=location.hostname.match(/^(.+)\.github\.io$/),p=location.pathname.split('/')[1],repo=p&&!p.includes('.')?p:location.hostname;
  try{if(m){const r=await fetch(`https://api.github.com/repos/${m[1]}/${repo}/contents/decks`);if(r.ok)l=(await r.json()).map(x=>x.name)}}catch(e){}
  if(!l)try{const r=await fetch('decks/index.json',{cache:'no-cache'});if(r.ok)l=await r.json()}catch(e){}
  if(l)localStorage.setItem('zh.decks',JSON.stringify(l));else l=JSON.parse(localStorage.getItem('zh.decks')||'[]');
  return l.filter(n=>/\.csv$/i.test(n));
}
async function load(){
  const names=await deckList();
  const res=await Promise.all(names.map(async n=>{try{
    const r=await fetch('decks/'+encodeURIComponent(n),{cache:'no-cache'});if(!r.ok)return[];
    const rows=parseCSV(await r.text());return rows.length?toCards(rows,n.replace(/\.csv$/i,'')):[];
  }catch(e){return[]}}));
  cards=res.flat();
}

/* ---------- Audio (voix mandarin de l'appareil) ---------- */
function speak(i){
  const s=window.speechSynthesis;if(!s)return;s.cancel();
  const u=new SpeechSynthesisUtterance(cards[i].hanzi);u.lang='zh-TW';u.rate=.8;
  const v=s.getVoices().find(v=>/zh[-_]TW/i.test(v.lang));if(v)u.voice=v;s.speak(u);
}

/* ---------- Tags ---------- */
function tagIdx(i){
  const c=cards[i],s=ens(c);
  const v=prompt('Tags ajoutés (séparés par des virgules)\nTags du CSV : '+(c.tags.join(', ')||'aucun'),(s.tags||[]).join(', '));
  if(v===null)return;
  s.tags=[...new Set(v.split(/[,;]/).map(x=>x.trim()).filter(Boolean))];save();render();
}

/* ---------- Session ---------- */
function pick(){
  const v=vis(),now=Date.now();
  const due=v.filter(c=>{const s=stt(c);return s.l!=null&&s.due<=now}).sort((a,b)=>stt(a).l-stt(b).l||stt(a).due-stt(b).due);
  const nw=shuf(v.filter(c=>stt(c).l==null));
  const rest=v.filter(c=>{const s=stt(c);return s.l!=null&&s.due>now}).sort((a,b)=>stt(a).due-stt(b).due);
  return shuf([...due,...nw,...rest].slice(0,S.size));
}
function start(){const q=pick();if(!q.length)return;sess={q,total:q.length,done:0,flip:false,rq:new Set(),t0:Date.now()};render()}
function quit(){sess=null;render()}
function flip(){sess.flip=true;if(S.auto)speak(cards.indexOf(sess.q[0]));review(1)}
function rate(r){
  const c=sess.q.shift(),s=ens(c);
  s.l=nl(s.l,r);s.due=Date.now()+IV[s.l]*DAY;s.n++;
  const now=Date.now(),h=S.h||(S.h={}),e=h[dk(now)]||(h[dk(now)]={n:0,a:[0,0,0,0],ms:0});
  e.n++;e.a[r]++;e.ms+=Math.min(now-sess.t0,6e4);sess.t0=now;save();
  if(r===0&&!sess.rq.has(c.id)){sess.rq.add(c.id);sess.q.push(c)}else sess.done++;
  sess.flip=false;render();
}

/* ---------- Vues ---------- */
function render(){
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  $('nav').style.display=sess?'none':'';
  sess?review():({home:homeV,cards:listV,stats:statsV,settings:setV})[tab]();
}
function review(anim){
  if(!sess.q.length)return endV();
  const c=sess.q[0],i=cards.indexOf(c),g=gl(c),p=sess.done/sess.total*100;
  const top=`<div class=top><button class=x onclick="quit()">✕</button><div class=bar><i style="width:${p}%"></i></div><span>${sess.done}/${sess.total}</span></div>`;
  const back=`<div class="card bk ${anim?'in':''}"><div class=big>${esc(c.hanzi)}</div><div class=py>${esc(c.pinyin)}</div><div class=zy>${esc(c.zhuyin)}</div>${c.meaning?`<div class=mu>${esc(c.meaning)}</div>`:''}<button class=spk onclick="speak(${i})">🔊</button><div class=chips><span class="badge g${g}">${g==='N'?'Nouveau':g}</span>${tg(c).map(t=>`<span class=chip>${esc(t)}</span>`).join('')}<span class=chip onclick="tagIdx(${i})">🏷 tag</span></div></div>
  <div class=rate>${['Oublié','Difficile','Bien','Facile'].map((t,r)=>`<button style="background:var(--g${'FDBA'[r]})" onclick="rate(${r})">${t}<small>→ ${GR[nl(stt(c).l,r)]}</small></button>`).join('')}</div>`;
  const front=`<div class=card onclick="flip()"><div class=big>${esc(c.hanzi)}</div><p class=mu>Touche pour retourner</p></div><div class=rate style="visibility:hidden"><button>x<small>x</small></button></div>`;
  $('#view').innerHTML=`<div class=rv>${top}${sess.flip?back:front}</div>`;
}
function endV(){
  $('#view').innerHTML=`<div class=rv style="justify-content:center;text-align:center"><h1>完成</h1><p class=mu>${sess.total} cartes révisées</p><button class=go onclick="quit()">Retour</button></div>`;
}
function homeV(){
  const v=vis(),now=Date.now(),n={N:0,A:0,B:0,C:0,D:0,E:0,F:0};let due=0;
  v.forEach(c=>{n[gl(c)]++;const s=stt(c);if(s.l!=null&&s.due<=now)due++});
  const decks=[...new Set(cards.map(c=>c.deck))],tags=[...new Set(cards.flatMap(tg))].sort();
  const op=(a,s,all)=>`<option value="">${all}</option>`+a.map(x=>`<option${x===s?' selected':''}>${esc(x)}</option>`).join('');
  $('#view').innerHTML=`<h1>漢字卡</h1>`+(!cards.length
    ?`<p class=mu>Aucune carte chargée. Ajoute un fichier .csv dans le dossier decks/ du dépôt GitHub, puis va dans Réglages → Recharger.</p>`
    :`<div class=tiles>${['N','A','B','C','D','E','F'].map(k=>`<div class="tile g${k}"><b>${n[k]}</b><span>${k==='N'?'Nouveau':k}</span></div>`).join('')}</div>
    <p class=mu style="margin:10px 2px 0">${due} à revoir aujourd'hui · ${v.length} cartes</p>
    <div class=row><select onchange="filt.deck=this.value;homeV()">${op(decks,filt.deck,'Tous les decks')}</select><select onchange="filt.tag=this.value;homeV()">${op(tags,filt.tag,'Tous les tags')}</select></div>
    <h3>Cartes par session</h3>
    <div class=seg>${[50,80,100].map(x=>`<button class="${S.size===x?'on':''}" onclick="S.size=${x};save();homeV()">${x}</button>`).join('')}</div>
    <button class=go onclick="start()">Commencer (${Math.min(S.size,v.length)} cartes)</button>`);
}
function listV(){
  $('#view').innerHTML=`<h1>Cartes</h1><input type=search id=qs placeholder="Rechercher un mot, pinyin ou tag" value="${esc(qs)}" oninput="qs=this.value;fillList()"><div id=ls style="margin-top:12px"></div>`;
  fillList();
}
function fillList(){
  const t=qs.trim().toLowerCase(),v=cards.filter(c=>!t||[c.hanzi,c.pinyin,c.zhuyin,c.meaning,c.deck,...tg(c)].join(' ').toLowerCase().includes(t));
  $('#ls').innerHTML=v.slice(0,300).map(c=>{const i=cards.indexOf(c),g=gl(c),t=tg(c);
    return `<div class=it onclick="tagIdx(${i})"><span class=h>${esc(c.hanzi)}</span><div class=m>${esc(c.pinyin)} ${esc(c.zhuyin)}<small>${esc(c.deck)}${t.length?' · '+t.map(esc).join(', '):''}</small></div><span class="badge g${g}">${g}</span></div>`}).join('')
    +(v.length>300?`<p class=mu>${v.length-300} cartes de plus : affine la recherche.</p>`:'')||'<p class=mu>Aucun résultat</p>';
}
function setV(){
  const d={};cards.forEach(c=>d[c.deck]=(d[c.deck]||0)+1);
  $('#view').innerHTML=`<h1>Réglages</h1>
  <label class=btn style="color:var(--tx);display:flex;justify-content:space-between;align-items:center">Audio au retournement<input type=checkbox ${S.auto?'checked':''} onchange="S.auto=this.checked;save()"></label>
  <h3>Decks · ${cards.length} cartes</h3>
  ${Object.entries(d).map(([k,n])=>`<div class=it><div class=m>${esc(k)}</div><span class=mu>${n}</span></div>`).join('')||'<p class=mu>Aucun deck</p>'}
  <button class=btn onclick="reload()">↻ Recharger les decks</button>
  <h3>Sauvegarde de la progression</h3>
  <button class=btn onclick="exp()">Exporter (fichier JSON)</button>
  <label class=btn>Importer une sauvegarde<input type=file accept=".json,application/json" hidden onchange="imp(this.files[0])"></label>
  <button class=btn style="color:var(--gF)" onclick="rst()">Tout réinitialiser (progression, historique, tags)</button>`;
}
async function reload(){$('#view').innerHTML='<p class=mu>Chargement…</p>';await load();render()}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='hanzi-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
async function imp(f){if(!f)return;try{const o=JSON.parse(await f.text());if(!o.c)throw 0;S={size:50,auto:true,...o};save();render();alert('Sauvegarde importée')}catch(e){alert('Fichier invalide')}}
function rst(){if(confirm('Effacer la progression, l\'historique et les tags ajoutés ?')){S.c={};S.h={};save();render()}}


/* ---------- Historique ---------- */
function calGo(n){let m=calM.m+n,y=calM.y;if(m<0){m=11;y--}if(m>11){m=0;y++}calM={y,m};statsV()}
function statsV(){
  const sc=$('#view').scrollTop,h=S.h||{},keys=Object.keys(h).sort(),now=new Date();
  const dn=d=>(h[dk(d)]||{}).n||0,sum=n=>{let t=0;for(let i=0;i<n;i++)t+=dn(addD(now,-i));return t};
  const kd=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)};
  const fd=d=>d.toLocaleDateString('fr-FR',{day:'numeric',month:'short'});
  const tot=keys.reduce((s,k)=>s+h[k].n,0),q=[0,0,0,0];
  keys.forEach(k=>h[k].a.forEach((v,i)=>q[i]+=v));
  const ms=keys.reduce((s,k)=>s+h[k].ms,0),avg=keys.length?ms/keys.length/6e4:0;
  let cur=0,d=new Date(now);if(!dn(d))d=addD(d,-1);while(dn(d)){cur++;d=addD(d,-1)}
  let best=0,run=0,prev=null;
  keys.forEach(k=>{if(!h[k].n)return;const dt=kd(k);run=prev&&dk(addD(prev,1))===k?run+1:1;prev=dt;if(run>best)best=run});
  const bk=keys.reduce((b,k)=>!b||h[k].n>h[b].n?k:b,null);
  const bars=[];for(let i=chartN-1;i>=0;i--){const dt=addD(now,-i);bars.push([dt,dn(dt)])}
  const mx=Math.max(1,...bars.map(b=>b[1]));
  if(!calM)calM={y:now.getFullYear(),m:now.getMonth()};
  const off=(new Date(calM.y,calM.m,1).getDay()+6)%7,nd=new Date(calM.y,calM.m+1,0).getDate(),hm=Math.max(1,...keys.map(k=>h[k].n));
  const atNow=calM.y===now.getFullYear()&&calM.m===now.getMonth();
  let cells='';for(let i=0;i<off;i++)cells+='<div></div>';
  for(let i=1;i<=nd;i++){const k=dk(new Date(calM.y,calM.m,i)),n=(h[k]||{}).n||0,lv=n?Math.ceil(n/hm*4):0;
    cells+=`<div class="d l${lv}${k===dk(now)?' td':''}"${lv?` style="background:color-mix(in srgb,var(--ac) ${lv*25}%,var(--cd))"`:''}>${i}${n?`<small>${n}</small>`:''}</div>`}
  const qc=['--gF','--gD','--gB','--gA'],ql=['Oublié','Difficile','Bien','Facile'];
  const fm=m=>m<1?Math.round(m*60)+' s':Math.round(m)+' min';
  $('#view').innerHTML=`<h1>Historique</h1>
  <div class=grid2>
    <div class="st w"><span>Cartes révisées</span><b>${tot}</b></div>
    <div class=st><span>Série en cours</span><b>${cur} j</b><small>record : ${best} j</small></div>
    <div class=st><span>Meilleur jour</span><b>${bk?h[bk].n:0}</b><small>${bk?fd(kd(bk)):'–'}</small></div>
    <div class=st><span>7 derniers jours</span><b>${sum(7)}</b></div>
    <div class=st><span>30 derniers jours</span><b>${sum(30)}</b></div>
  </div>
  <div class=pn><div class=hd><span>Cartes par jour</span><div class="seg s">${[7,30].map(x=>`<button class="${chartN===x?'on':''}" onclick="chartN=${x};statsV()">${x} j</button>`).join('')}</div></div>
    <div class=chart>${bars.map(([dt,n],i)=>`<div class=col><i${i===bars.length-1?' class=t':''} style="height:${n/mx*100}%"></i></div>`).join('')}</div>
    <div class=ax><span>${fd(bars[0][0])}</span><span>max ${mx}</span><span>aujourd'hui</span></div></div>
  <div class=pn><div class=hd><button class=nav2 onclick="calGo(-1)">‹</button><span style="text-transform:capitalize">${new Date(calM.y,calM.m,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</span><button class=nav2 style="${atNow?'visibility:hidden':''}" onclick="calGo(1)">›</button></div>
    <div class=cal>${['L','M','M','J','V','S','D'].map(x=>`<div class=wd>${x}</div>`).join('')}${cells}</div></div>
  <div class=grid2>
    <div class=st><span>Temps moyen par jour</span><b>${keys.length?fm(avg):'–'}</b><small>${keys.length} jour${keys.length>1?'s':''} révisé${keys.length>1?'s':''}</small></div>
    <div class=st><span>Taux de réussite</span><b>${tot?Math.round((tot-q[0])/tot*100)+' %':'–'}</b><small>réponses hors « Oublié »</small></div>
  </div>
  <div class=pn><div class=hd><span>Qualité des réponses</span></div>
    <div class=qb>${tot?q.map((v,i)=>`<i style="width:${v/tot*100}%;background:var(${qc[i]})"></i>`).join(''):''}</div>
    <div class=ql>${ql.map((t,i)=>`<div><i style="background:var(${qc[i]})"></i>${t} · ${q[i]}${tot?` (${Math.round(q[i]/tot*100)} %)`:''}</div>`).join('')}</div></div>
  ${tot?'':'<p class=mu>L\'historique se remplit à chaque carte révisée.</p>'}`;
  $('#view').scrollTop=sc;
}

/* ---------- Démarrage ---------- */
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;sess=null;render()});
$('#view').innerHTML='<p class=mu>Chargement…</p>';
load().then(render);
window.speechSynthesis?.getVoices();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');

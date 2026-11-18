'use strict';
const VER='v9 · 18 nov. 2026',KEY='zhcards.v1',GR=['F','E','D','C','B','A'],IV=[.007,1,3,7,14,30],DAY=864e5;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S=JSON.parse(localStorage.getItem(KEY)||'null')||{c:{},size:50,auto:true};
let cards=[],tab='home',dd='',ddq='',sess=null,qs='',calM=null,chartN=7;
const dk=t=>{const d=new Date(t);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const stt=c=>S.c[c.id]||{l:null,due:0,n:0,tags:[]};
const ens=c=>S.c[c.id]||(S.c[c.id]={l:null,due:0,n:0,tags:[]});
const gl=c=>{const l=stt(c).l;return l==null?'N':GR[l]};
const tg=c=>[...new Set([...c.tags,...(stt(c).tags||[])])];
const pl=(n,w)=>n+' '+w+(n>1?'s':'');
const collate=(x,y)=>x.localeCompare(y,'fr',{numeric:true});
const decksL=()=>[...new Set(cards.map(c=>c.deck))].sort(collate);
const act=()=>{const d=decksL();return (S.fd||[]).filter(x=>d.includes(x))};
const tagsAll=()=>{const a=act();return [...new Set(cards.filter(c=>!a.length||a.includes(c.deck)).flatMap(tg))].sort(collate)};
const actT=()=>{const t=tagsAll();return (S.ft||[]).filter(x=>t.includes(x))};
const vis=()=>{const a=act(),t=actT();return cards.filter(c=>(!a.length||a.includes(c.deck))&&(!t.length||tg(c).some(x=>t.includes(x))))};
/* menus déroulants à cases à cocher (decks / tags) : plusieurs choix = « ou » */
function rr(){const l=$('#ddl'),s=l?l.scrollTop:0,v=$('#view').scrollTop;render();const n=$('#ddl');if(n)n.scrollTop=s;$('#view').scrollTop=v}
function ddSet(k){dd=dd===k?'':k;ddq='';render()}
function ddItems(){
  const d=dd==='d',list=d?decksL():tagsAll(),cnt={},q=ddq.trim().toLowerCase(),a=act();
  (d?cards:cards.filter(c=>!a.length||a.includes(c.deck))).forEach(c=>(d?[c.deck]:tg(c)).forEach(x=>cnt[x]=(cnt[x]||0)+1));
  return list.map((v,i)=>[v,i,cnt[v]||0]).filter(x=>!q||x[0].toLowerCase().includes(q));
}
function ddList(){
  const sel=dd==='d'?act():actT(),it=ddItems();
  return it.map(([v,i,n])=>`<label class=ck><input type=checkbox ${sel.includes(v)?'checked':''} onchange="ddToggle(${i})"><span>${esc(v)}</span><small>${n}</small></label>`).join('')||'<p class=mu style="padding:8px">Aucun résultat</p>';
}
function ddFill(){$('#ddl').innerHTML=ddList()}
function ddToggle(i){const d=dd==='d',v=(d?decksL():tagsAll())[i],a=d?act():actT(),j=a.indexOf(v);j<0?a.push(v):a.splice(j,1);S[d?'fd':'ft']=a;save();rr()}
function ddAll(on){const d=dd==='d',cur=d?act():actT();S[d?'fd':'ft']=on?[...new Set([...cur,...ddItems().map(x=>x[0])])]:[];save();rr()}
function fsel(){
  const a=act(),t=actT(),sm=(l,one,all,n)=>l.length?(l.length===1?esc(l[0]):l.length+' '+n):all;
  const btn=(k,txt)=>`<button class="ddb${dd===k?' op':''}" onclick="ddSet('${k}')"><span>${txt}</span><i>${dd===k?'▲':'▼'}</i></button>`;
  return `<h3>Filtres</h3><div class=row>${btn('d',sm(a,0,'Tous les decks','decks'))}${btn('t',sm(t,0,'Tous les tags','tags'))}</div>`+(dd?`<div class=ddp><input type=search placeholder="Rechercher…" value="${esc(ddq)}" oninput="ddq=this.value;ddFill()"><div class=dda><button onclick="ddAll(1)">Tout cocher</button><button onclick="ddAll(0)">Tout décocher</button></div><div id=ddl>${ddList()}</div></div>`:'');
}
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
const H={hanzi:['hanzi','chinese','chinois','caractere','caractère','character','characters','word','mot','漢字','汉字','中文','字'],pinyin:['pinyin','拼音'],zhuyin:['zhuyin','bopomofo','注音'],tags:['tags','tag','lesson','leçon','lecon','unit','category','catégorie','categorie','etiquettes','étiquettes'],meaning:['meaning','english','anglais','definition','définition','translation','traduction','sens','français','francais','french','gloss']};
function toCards(rows,deck){
  const h=rows[0].map(x=>x.trim().toLowerCase()),ix={};let hasH=false;
  for(const k in H){const i=h.findIndex(x=>H[k].includes(x));if(i>=0){ix[k]=i;hasH=true}}
  if(!hasH)Object.assign(ix,{hanzi:0,pinyin:1,zhuyin:2,tags:3,meaning:4});
  if(ix.hanzi==null)ix.hanzi=0;
  const les=/^(lesson|leçon|lecon|unit)$/.test(h[ix.tags]??''),tv=v=>les&&/^\d+$/.test(v)?h[ix.tags]+' '+v:v; // colonne « Lesson » = 9 → tag « lesson 9 »
  return (hasH?rows.slice(1):rows).map(r=>{const g=k=>(r[ix[k]]??'').trim();
    return {id:deck+'/'+g('hanzi'),deck,hanzi:g('hanzi'),pinyin:g('pinyin'),zhuyin:g('zhuyin'),meaning:g('meaning'),tags:tv(g('tags')).split(/[;|]/).map(x=>x.trim()).filter(Boolean)}}).filter(c=>c.hanzi);
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
function start(){const q=pick();if(!q.length)return;dd='';sess={q,total:q.length,done:0,flip:false,rq:new Set(),t0:Date.now()};render()}
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
  $('nav').style.display=sess||W?'none':'';
  sess?review():W?writeS():({home:homeV,cards:listV,write:writeV,stats:statsV,settings:setV})[tab]();
}
const fz=(c,base)=>{const n=[...c.hanzi].length,per=n>6?Math.ceil(n/2):n;return `font-size:min(${base},calc((100vw - 84px)/${per}))`};
function review(anim){
  if(!sess.q.length)return endV();
  const c=sess.q[0],i=cards.indexOf(c),g=gl(c),p=sess.done/sess.total*100;
  const top=`<div class=top><button class=x onclick="quit()">✕</button><div class=bar><i style="width:${p}%"></i></div><span>${sess.done}/${sess.total}</span></div>`;
  const back=`<div class="card bk ${anim?'in':''}"><div class=big style="${fz(c,'22vw,96px')}">${esc(c.hanzi)}</div><div class=py>${esc(c.pinyin)}</div><div class=zy>${esc(c.zhuyin)}</div>${c.meaning?`<div class=mn>${esc(c.meaning)}</div>`:''}<button class=spk onclick="speak(${i})">🔊</button><div class=chips><span class="badge g${g}">${g==='N'?'Nouveau':g}</span>${tg(c).map(t=>`<span class=chip>${esc(t)}</span>`).join('')}<span class=chip onclick="tagIdx(${i})">🏷 tag</span></div></div>
  <div class=rate>${['Oublié','Difficile','Bien','Facile'].map((t,r)=>`<button style="background:var(--g${'FDBA'[r]})" onclick="rate(${r})">${t}<small>→ ${GR[nl(stt(c).l,r)]}</small></button>`).join('')}</div>`;
  const front=`<div class=card onclick="flip()"><div class=big style="${fz(c,'32vw,140px')}">${esc(c.hanzi)}</div><p class=mu>Touche pour retourner</p></div><div class=rate style="visibility:hidden"><button>x<small>x</small></button></div>`;
  $('#view').innerHTML=`<div class=rv>${top}${sess.flip?back:front}</div>`;
}
function endV(){
  $('#view').innerHTML=`<div class=rv style="justify-content:center;text-align:center"><h1>完成</h1><p class=mu>${sess.total} cartes révisées</p><button class=go onclick="quit()">Retour</button></div>`;
}
function homeV(){
  const v=vis(),now=Date.now(),n={N:0,A:0,B:0,C:0,D:0,E:0,F:0};let due=0;
  v.forEach(c=>{n[gl(c)]++;const s=stt(c);if(s.l!=null&&s.due<=now)due++});
  $('#view').innerHTML=`<h1>漢字卡</h1>`+(!cards.length
    ?`<p class=mu>Aucune carte chargée. Ajoute un fichier .csv dans le dossier decks/ du dépôt GitHub, puis va dans Réglages → Recharger.</p>`
    :`<div class=tiles>${['N','A','B','C','D','E','F'].map(k=>`<div class="tile g${k}"><b>${n[k]}</b><span>${k==='N'?'Nouveau':k}</span></div>`).join('')}</div>
    <p class=mu style="margin:10px 2px 0">${due} à revoir aujourd'hui · ${v.length} cartes</p>
    ${fsel()}
    <h3>Cartes par session</h3>
    <div class=seg>${[50,80,100].map(x=>`<button class="${S.size===x?'on':''}" onclick="S.size=${x};save();homeV()">${x}</button>`).join('')}</div>
    <button class=go onclick="start()">Commencer (${pl(Math.min(S.size,v.length),'carte')})</button>`);
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
  <h3>Application</h3>
  <button class=btn onclick="upd()">Forcer la mise à jour de l'application</button>
  <p class=mu style="text-align:center">Version ${VER}</p>
  <button class=btn style="color:var(--gF)" onclick="rst()">Tout réinitialiser (progression, historique, tags)</button>`;
}
async function upd(){try{const r=await navigator.serviceWorker.getRegistrations();await Promise.all(r.map(x=>x.unregister()));const k=await caches.keys();await Promise.all(k.filter(x=>x!=='hanzi-data').map(x=>caches.delete(x)))}catch(e){}location.reload()}
async function reload(){$('#view').innerHTML='<p class=mu>Chargement…</p>';await load();render()}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='hanzi-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
async function imp(f){if(!f)return;try{const o=JSON.parse(await f.text());if(!o.c)throw 0;S={size:50,auto:true,...o};save();render();alert('Sauvegarde importée')}catch(e){alert('Fichier invalide')}}
function rst(){if(confirm('Effacer la progression, l\'historique et les tags ajoutés ?')){S.c={};S.h={};S.hw={};S.w={};save();render()}}


/* ---------- Historique (flashcards + écriture) ---------- */
let hTab='c';
function calGo(n){let m=calM.m+n,y=calM.y;if(m<0){m=11;y--}if(m>11){m=0;y++}calM={y,m};statsV()}
function statsV(){
  const w=hTab==='w',sc=$('#view').scrollTop,h=(w?S.hw:S.h)||{},keys=Object.keys(h).sort(),now=new Date();
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
  const qc=['--gF','--gD','--gB','--gA'],ql=w?LV.map(x=>x[0]):['Oublié','Difficile','Bien','Facile'];
  const ok=w?q[2]+q[3]:tot-q[0],fm=m=>m<1?Math.round(m*60)+' s':Math.round(m)+' min';
  const wk=Object.values(S.w||{}),extra=w?`<div class="st w"><span>Caractères différents travaillés</span><b>${wk.length}</b><small>dont ${wk.filter(l=>l===3).length} notés Parfait au dernier essai · ${keys.reduce((s,k)=>s+(h[k].st||0),0)} traits tracés</small></div>`:'';
  $('#view').innerHTML=`<h1>Historique</h1>
  <div class=seg style="margin-bottom:14px">${[['c','Flashcards'],['w','Écriture']].map(([k,t])=>`<button class="${hTab===k?'on':''}" onclick="hTab='${k}';$('#view').scrollTop=0;statsV()">${t}</button>`).join('')}</div>
  <div class=grid2>
    <div class="st w"><span>${w?'Caractères tracés':'Cartes révisées'}</span><b>${tot}</b></div>
    <div class=st><span>Série en cours</span><b>${cur} j</b><small>record : ${best} j</small></div>
    <div class=st><span>Meilleur jour</span><b>${bk?h[bk].n:0}</b><small>${bk?fd(kd(bk)):'–'}</small></div>
    <div class=st><span>7 derniers jours</span><b>${sum(7)}</b></div>
    <div class=st><span>30 derniers jours</span><b>${sum(30)}</b></div>
  </div>
  <div class=pn><div class=hd><span>${w?'Caractères par jour':'Cartes par jour'}</span><div class="seg s">${[7,30].map(x=>`<button class="${chartN===x?'on':''}" onclick="chartN=${x};statsV()">${x} j</button>`).join('')}</div></div>
    <div class=chart>${bars.map(([dt,n],i)=>`<div class=col><i${i===bars.length-1?' class=t':''} style="height:${n/mx*100}%"></i></div>`).join('')}</div>
    <div class=ax><span>${fd(bars[0][0])}</span><span>max ${mx}</span><span>aujourd'hui</span></div></div>
  <div class=pn><div class=hd><button class=nav2 onclick="calGo(-1)">‹</button><span style="text-transform:capitalize">${new Date(calM.y,calM.m,1).toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</span><button class=nav2 style="${atNow?'visibility:hidden':''}" onclick="calGo(1)">›</button></div>
    <div class=cal>${['L','M','M','J','V','S','D'].map(x=>`<div class=wd>${x}</div>`).join('')}${cells}</div></div>
  <div class=grid2>
    <div class=st><span>Temps moyen par jour</span><b>${keys.length?fm(avg):'–'}</b><small>${keys.length} jour${keys.length>1?'s':''} ${w?'pratiqué':'révisé'}${keys.length>1?'s':''}</small></div>
    <div class=st><span>Taux de réussite</span><b>${tot?Math.round(ok/tot*100)+' %':'–'}</b><small>${w?'tracés Bien ou Parfait':'réponses hors « Oublié »'}</small></div>
    ${extra}
  </div>
  <div class=pn><div class=hd><span>${w?'Qualité des tracés':'Qualité des réponses'}</span></div>
    <div class=qb>${tot?q.map((v,i)=>`<i style="width:${v/tot*100}%;background:var(${qc[i]})"></i>`).join(''):''}</div>
    <div class=ql>${ql.map((t,i)=>`<div><i style="background:var(${qc[i]})"></i>${t} · ${q[i]}${tot?` (${Math.round(q[i]/tot*100)} %)`:''}</div>`).join('')}</div></div>
  ${tot?'':`<p class=mu>L'historique se remplit à chaque ${w?'caractère tracé':'carte révisée'}.</p>`}`;
  $('#view').scrollTop=sc;
}

/* ---------- Écriture des caractères (Hanzi Writer) ---------- */
const HWV='2.0.1',LV=[['À refaire','--gF','🔁'],['Moyen','--gD','😐'],['Bien','--gB','👍'],['Parfait','--gA','🌟']];
const hwURL=c=>`https://cdn.jsdelivr.net/npm/hanzi-writer-data@${HWV}/${encodeURIComponent(c)}.json`;
const hwLoad=(c,ok,err)=>fetch(hwURL(c)).then(r=>r.ok?r.json():Promise.reject()).then(ok).catch(err);
const han=s=>[...s].filter(ch=>/\p{Script=Han}/u.test(ch));
let W=null,wr=null;
function writeV(){
  const m=S.wm||1,cnt=new Set(vis().flatMap(c=>han(c.hanzi))).size;
  const sg=(k,o,d)=>`<div class=seg>${o.map(([v,t])=>`<button class="${(S[k]||d)===v?'on':''}" onclick="S.${k}=${v};save();writeV()">${t}</button>`).join('')}</div>`;
  $('#view').innerHTML=`<h1>Écriture</h1><p class=mu>Trace chaque caractère trait par trait, au doigt ou à l'Apple Pencil.</p>`+(!cards.length?'':
  `<h3>Mode</h3>${sg('wm',[[1,'Apprentissage'],[2,'Sans modèle']],1)}
  <p class=mu style="margin:8px 2px 0">${m===1?'Le caractère est en filigrane et l\'ordre des traits est animé avant que tu traces.':'Aucun modèle : tu écris de mémoire. L\'ordre des traits est quand même vérifié.'}</p>
  ${fsel()}
  <h3>Caractères par session</h3>${sg('wn',[[10,'10'],[20,'20'],[30,'30']],10)}
  <h3>Tolérance du tracé</h3>${sg('tol',[[.8,'Stricte'],[1,'Normale'],[1.3,'Souple']],1)}
  <button class=go onclick="wStart()">Commencer (${pl(Math.min(S.wn||10,cnt),'caractère')})</button>`);
}
function wStart(){
  const seen=new Map();
  vis().forEach(c=>{const hs=han(c.hanzi);hs.forEach((ch,i)=>{if(!seen.has(ch))seen.set(ch,{ch,c,i,n:hs.length})})});
  const it=shuf([...seen.values()]).sort((a,b)=>((S.w||{})[a.ch]??-1)-((S.w||{})[b.ch]??-1)).slice(0,S.wn||10);
  if(!it.length)return;dd='';
  it.forEach(x=>fetch(hwURL(x.ch)).catch(()=>{})); // préchargement : sert aussi de cache hors ligne
  sess=null;W={it,i:0,res:[],mode:S.wm||1};render();
}
function wQuit(){W=null;wr=null;render()}
function wNext(){W.i++;writeS()}
function writeS(){
  if(W.i>=W.it.length)return wEnd();
  const x=W.it[W.i],sz=Math.round(Math.max(220,Math.min(innerWidth-32,innerHeight-340,520)));
  const sy=s=>{const a=(s||'').trim().split(/\s+/);return a.length===x.n?a[x.i]:s};
  const word=[...x.c.hanzi].map(ch=>ch===x.ch?`<u>${esc(ch)}</u>`:esc(ch)).join('');
  $('#view').innerHTML=`<div class=rv><div class=top><button class=x onclick="wQuit()">✕</button><div class=bar><i style="width:${W.i/W.it.length*100}%"></i></div><span>${W.i}/${W.it.length}</span></div>
  <div class=wwrap><div class=wh style="width:${sz}px"><div><b>${esc(sy(x.c.pinyin))}</b><span>${esc(sy(x.c.zhuyin))}</span></div>${x.n>1?`<div class=cw>${word}</div>`:''}</div>
  <div class=wbox style="width:${sz}px;height:${sz}px"><svg class=wgrid viewBox="0 0 100 100" preserveAspectRatio="none"><rect x=.5 y=.5 width=99 height=99 /><path d="M50 0V100M0 50H100M0 0L100 100M100 0L0 100"/></svg><div id=wc></div></div>
  <div id=wres style="width:100%;display:flex;justify-content:center"></div></div>
  <div class=wbtn><button onclick="wOrder()">▶ Ordre des traits</button><button onclick="wRetry()">↺ Recommencer</button></div></div>`;
  wInit(sz);
}
function wInit(sz){
  const x=W.it[W.i],dm=matchMedia('(prefers-color-scheme: dark)').matches;
  W.n=0;W.peek=false;W.done=false;
  wr=HanziWriter.create('wc',x.ch,{width:sz,height:sz,padding:Math.round(sz*.08),showCharacter:false,showOutline:W.mode===1,
    strokeColor:dm?'#e5e9f5':'#14213d',outlineColor:dm?'#454b5c':'#c9d0de',drawingColor:dm?'#ffffff':'#14213d',highlightColor:'#7f9cf5',
    strokeAnimationSpeed:1.4,delayBetweenStrokes:250,leniency:S.tol||1,showHintAfterMisses:W.mode===1?1:false,markStrokeCorrectAfterMisses:3,
    charDataLoader:hwLoad,
    onLoadCharDataError:()=>{$('#wres').innerHTML='<div class=wr style="--c:var(--gD)"><b>Caractère indisponible</b><span>Données non chargées (connexion ?).</span><button class=go onclick="wNext()">Passer</button></div>'}});
  W.mode===1?wOrder():wQuiz();
}
function wQuiz(){
  W.n=0;W.t0=Date.now();wr.cancelQuiz();
  wr.quiz({onCorrectStroke:()=>W.n++,onComplete:d=>wDone(d.totalMistakes)});
}
function wOrder(){
  if(W.done)return;
  if(W.mode===2)W.peek=true; // consulter l'ordre sans modèle plafonne la note
  wr.cancelQuiz();
  wr.animateCharacter({onComplete:()=>{if(!W.done)wQuiz()}});
}
function wRetry(){
  if(W.done){W.res.pop();W.done=false;$('#wres').innerHTML=''}
  wQuiz();
}
function wDone(m){
  W.done=true;const n=Math.max(W.n,1),x=W.it[W.i];
  let l=m===0?3:m<=Math.ceil(n*.15)?2:m<=Math.ceil(n*.5)?1:0;
  if(W.peek)l=Math.min(l,1);
  W.res.push({ch:x.ch,l,m});(S.w||(S.w={}))[x.ch]=l;
  const now=Date.now(),hw=S.hw||(S.hw={}),e=hw[dk(now)]||(hw[dk(now)]={n:0,a:[0,0,0,0],ms:0,st:0});
  e.n++;e.a[l]++;e.ms+=Math.min(now-W.t0,18e4);e.st+=n;save();
  $('#wres').innerHTML=`<div class=wr style="--c:var(${LV[l][1]})"><b>${LV[l][2]} ${LV[l][0]}</b><span>${m?m+' erreur'+(m>1?'s':''):'Aucune erreur'} · ${n} trait${n>1?'s':''}${W.peek?' · ordre consulté':''}</span><button class=go onclick="wNext()">${W.i+1<W.it.length?'Suivant':'Terminer'}</button></div>`;
}
function wEnd(){
  const r=W.res,c=[0,0,0,0];r.forEach(x=>c[x.l]++);
  $('#view').innerHTML=`<div class=rv><div class=top><button class=x onclick="wQuit()">✕</button><div class=bar><i style="width:100%"></i></div><span>${r.length}/${W.it.length}</span></div>
  <h1 style="margin-top:24px">完成</h1>
  <div class=ql>${[3,2,1,0].map(l=>`<div><i style="background:var(${LV[l][1]})"></i>${LV[l][0]} · ${c[l]}</div>`).join('')}</div>
  <div class=wgs>${r.map(x=>`<span style="--c:var(${LV[x.l][1]})">${esc(x.ch)}</span>`).join('')}</div>
  <button class=go onclick="wQuit()">Retour</button></div>`;
}

/* ---------- Démarrage ---------- */
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;sess=null;W=null;wr=null;dd='';render()});
$('#view').innerHTML='<p class=mu>Chargement…</p>';
load().then(render);
window.speechSynthesis?.getVoices();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');

'use strict';
const KEY='zhcards.v1',GR=['F','E','D','C','B','A'],IV=[.007,1,3,7,14,30],DAY=864e5;
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let S=JSON.parse(localStorage.getItem(KEY)||'null')||{c:{},size:50,auto:true};
let cards=[],tab='home',filt={deck:'',tag:''},sess=null,qs='';
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
function start(){const q=pick();if(!q.length)return;sess={q,total:q.length,done:0,flip:false,rq:new Set()};render()}
function quit(){sess=null;render()}
function flip(){sess.flip=true;if(S.auto)speak(cards.indexOf(sess.q[0]));review(1)}
function rate(r){
  const c=sess.q.shift(),s=ens(c);
  s.l=nl(s.l,r);s.due=Date.now()+IV[s.l]*DAY;s.n++;save();
  if(r===0&&!sess.rq.has(c.id)){sess.rq.add(c.id);sess.q.push(c)}else sess.done++;
  sess.flip=false;render();
}

/* ---------- Vues ---------- */
function render(){
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  $('nav').style.display=sess?'none':'';
  sess?review():({home:homeV,cards:listV,settings:setV})[tab]();
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
  <button class=btn style="color:var(--gF)" onclick="rst()">Réinitialiser progression et tags ajoutés</button>`;
}
async function reload(){$('#view').innerHTML='<p class=mu>Chargement…</p>';await load();render()}
function exp(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='hanzi-progress-'+new Date().toISOString().slice(0,10)+'.json';a.click()}
async function imp(f){if(!f)return;try{const o=JSON.parse(await f.text());if(!o.c)throw 0;S={size:50,auto:true,...o};save();render();alert('Sauvegarde importée')}catch(e){alert('Fichier invalide')}}
function rst(){if(confirm('Effacer toute la progression et les tags ajoutés ?')){S.c={};save();render()}}

/* ---------- Démarrage ---------- */
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;sess=null;render()});
$('#view').innerHTML='<p class=mu>Chargement…</p>';
load().then(render);
window.speechSynthesis?.getVoices();
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js');

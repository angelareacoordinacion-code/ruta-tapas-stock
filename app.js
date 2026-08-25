/* ============ DATOS MAESTROS (del histórico "Material tapas") ============ */
const PRODUCTS = [{"id":0,"nombre":"Pincho Pollo","precio":0.9196,"stockObjetivo":12},{"id":1,"nombre":"Pincho Gambas","precio":0.999,"stockObjetivo":24},{"id":2,"nombre":"Calamares","precio":0.114,"stockObjetivo":7.14},{"id":3,"nombre":"Muslitos cangrejo","precio":0.1809375,"stockObjetivo":7.81},{"id":4,"nombre":"Gambas Torpedo","precio":null,"stockObjetivo":0},{"id":5,"nombre":"Jamon","precio":0.425,"stockObjetivo":3.2},{"id":6,"nombre":"Queso","precio":0.3398,"stockObjetivo":5},{"id":7,"nombre":"Datiles Beicon","precio":0.3108,"stockObjetivo":0},{"id":8,"nombre":"Croquetas jamon","precio":null,"stockObjetivo":0},{"id":9,"nombre":"Patata","precio":0.5271,"stockObjetivo":42},{"id":10,"nombre":"Olivas con pimiento","precio":0.0598,"stockObjetivo":3},{"id":11,"nombre":"Pan tostado","precio":null,"stockObjetivo":2},{"id":12,"nombre":"Coleslaw Americana","precio":0.5495,"stockObjetivo":3},{"id":13,"nombre":"Limones","precio":0.0497,"stockObjetivo":6.67},{"id":14,"nombre":"Remoulade","precio":0.0187,"stockObjetivo":2},{"id":15,"nombre":"Mayonesa","precio":0.0187,"stockObjetivo":3.75},{"id":16,"nombre":"Ketchup","precio":0.0187,"stockObjetivo":6},{"id":17,"nombre":"Chilisauce","precio":0.0468,"stockObjetivo":1},{"id":18,"nombre":"Aioli","precio":0.2398,"stockObjetivo":3},{"id":19,"nombre":"Leche","precio":0.25,"stockObjetivo":9},{"id":20,"nombre":"petesilie congelado","precio":null,"stockObjetivo":0},{"id":21,"nombre":"ajo congelado","precio":null,"stockObjetivo":0},{"id":22,"nombre":"Ajos","precio":0.0199,"stockObjetivo":3},{"id":23,"nombre":"aceite rapsol","precio":null,"stockObjetivo":4},{"id":24,"nombre":"Aceite Freir Girasol","precio":0.9295,"stockObjetivo":12},{"id":25,"nombre":"Aceite oliva","precio":0.1338,"stockObjetivo":2},{"id":26,"nombre":"Mantequilla plancha","precio":0.0012,"stockObjetivo":1},{"id":27,"nombre":"Sal","precio":0.0038,"stockObjetivo":1},{"id":28,"nombre":"vinagre","precio":0.005,"stockObjetivo":1},{"id":29,"nombre":"Paprica schüs","precio":null,"stockObjetivo":1},{"id":30,"nombre":"Paprica Sarf","precio":null,"stockObjetivo":2},{"id":31,"nombre":"Plato schale","precio":0.092,"stockObjetivo":500},{"id":32,"nombre":"Plato Tapa","precio":0.0598,"stockObjetivo":350},{"id":33,"nombre":"Plato Combioval","precio":0.1058,"stockObjetivo":300},{"id":34,"nombre":"Plato Fiesta","precio":0.2198,"stockObjetivo":50},{"id":35,"nombre":"Platito salsas","precio":0.0619,"stockObjetivo":200},{"id":36,"nombre":"Platito olivas","precio":0.0549,"stockObjetivo":200},{"id":37,"nombre":"Tenedores","precio":0.0115,"stockObjetivo":300},{"id":38,"nombre":"Cuchillos","precio":0.0115,"stockObjetivo":300},{"id":39,"nombre":"servilletas","precio":null,"stockObjetivo":500},{"id":40,"nombre":"servilletas rollo","precio":null,"stockObjetivo":8},{"id":41,"nombre":"palillos","precio":0.0009,"stockObjetivo":1},{"id":42,"nombre":"ALU (papel Alu)","precio":0.027,"stockObjetivo":8},{"id":43,"nombre":"ensalada","precio":null,"stockObjetivo":0}];

/* ============ FIREBASE ============ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCuUNIeTdRudOkL_b04gG8JJoq5DPa_TOk",
  authDomain: "ruta-tapa-471c8.firebaseapp.com",
  projectId: "ruta-tapa-471c8",
  storageBucket: "ruta-tapa-471c8.firebasestorage.app",
  messagingSenderId: "1064133025583",
  appId: "1:1064133025583:web:b51220acf8e201a6f00bda"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const STATE_DOC = doc(db, 'rutatapas', 'state');

const STORAGE_KEY = 'rutatapas_v1';
const CLIENT_ID = (localStorage.getItem('rutatapas_client') ||
  (localStorage.setItem('rutatapas_client', Math.random().toString(36).slice(2)), localStorage.getItem('rutatapas_client')));

/* ============ ESTADO (local + nube) ============ */
function defaultState(){
  const stock = {};
  PRODUCTS.forEach(p => stock[p.id] = p.stockObjetivo);
  return { stock, historial: [] };
}
function loadLocalState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw) return JSON.parse(raw);
  }catch(e){}
  return defaultState();
}
function saveLocalState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

async function fetchRemoteState(){
  try{
    const snap = await getDoc(STATE_DOC);
    if(!snap.exists()) return {ok:true, state:null, connected:true};
    const data = snap.data();
    return {ok:true, state: data && data.json ? JSON.parse(data.json) : null, connected:true};
  }catch(e){ return {ok:false, connected:false}; }
}
async function pushRemoteState(s){
  try{
    await setDoc(STATE_DOC, { json: JSON.stringify(s), updatedAt: Date.now(), from: CLIENT_ID });
    return true;
  }catch(e){ return false; }
}

let state = loadLocalState();
let currentView = 'evento';
let historyDetailId = null;
let cloudConnected = null; // null=sin comprobar, true/false tras el primer intento
let lastWriteFromThisTab = 0;

// Suscripción EN TIEMPO REAL: cualquier cambio guardado desde cualquier
// dispositivo se refleja aquí automáticamente, sin recargar la página.
onSnapshot(STATE_DOC,
  (snap) => {
    cloudConnected = true;
    if(!snap.exists()) return; // nube vacía todavía, no hay nada que traer
    const data = snap.data();
    if(!data || !data.json) return;
    // evita re-procesar el eco de nuestra propia escritura reciente
    if(data.from === CLIENT_ID && Date.now() - lastWriteFromThisTab < 4000) return;
    const remote = JSON.parse(data.json);
    state = remote;
    saveLocalState();
    updateHeader();
    render();
  },
  (err) => {
    cloudConnected = false;
    toast('Sin conexión con la nube — usando datos de este dispositivo');
  }
);

async function syncFromCloud(showToast){
  const res = await fetchRemoteState();
  if(!res.ok){
    cloudConnected = false;
    if(showToast) toast('Sin conexión con la nube — usando datos de este dispositivo');
    return;
  }
  cloudConnected = true;
  if(res.state){
    state = res.state;
    saveLocalState();
  } else {
    await pushRemoteState(state);
  }
  updateHeader();
  render();
  if(showToast) toast('Sincronizado con la nube ☁️');
}

/* ============ UTILIDADES ============ */
function fmt(n){
  if(n===null || n===undefined || isNaN(n)) return '—';
  return (Math.round(n*100)/100).toString().replace('.', ',');
}
function fmtEUR(n){
  if(n===null||n===undefined||isNaN(n)) return '—';
  return n.toLocaleString('es-ES',{style:'currency',currency:'EUR'});
}
function fmtDate(iso){
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'});
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), 2200);
}
function lastEvent(){
  return state.historial[state.historial.length-1] || null;
}
function updateHeader(){
  const le = lastEvent();
  document.getElementById('lastEventLabel').textContent = le
    ? `Último evento: ${le.evento} · ${fmtDate(le.fecha)}`
    : 'Sin eventos registrados aún';
}

/* ============ VISTA: NUEVO EVENTO ============ */
let eventoDraft = {}; // {productId: vuelta}

function viewEvento(){
  const el = document.createElement('div');
  el.innerHTML = `
    <h1 class="view-title">Nuevo evento</h1>
    <p class="view-desc">Apunta el nombre de la ciudad y, para cada producto, la cantidad que te ha quedado ("vuelta") al terminar. El resto se calcula solo.</p>
    <div class="card">
      <div class="field-row">
        <div>
          <label for="evtName">Ciudad / evento</label>
          <input type="text" id="evtName" placeholder="p.ej. Weimar" autocomplete="off">
        </div>
        <div>
          <label for="evtDate">Fecha</label>
          <input type="text" id="evtDate" value="${new Date().toISOString().slice(0,10)}" placeholder="AAAA-MM-DD">
        </div>
      </div>
    </div>
    <div class="search-wrap">
      <input type="text" id="prodSearch" placeholder="Buscar producto…">
    </div>
    <div class="prod-list" id="prodList"></div>
    <button class="btn btn-primary btn-block" id="saveEventBtn" style="margin-top:16px;">Guardar evento y calcular stock</button>
  `;
  const list = el.querySelector('#prodList');
  function renderList(filter=''){
    list.innerHTML = '';
    PRODUCTS
      .filter(p => p.nombre.toLowerCase().includes(filter.toLowerCase()))
      .forEach(p => {
        const row = document.createElement('div');
        row.className = 'prod-row' + (eventoDraft[p.id]!==undefined ? ' touched' : '');
        row.innerHTML = `
          <div>
            <div class="prod-name">${p.nombre}</div>
            <div class="prod-target">stock actual: ${fmt(state.stock[p.id])}</div>
          </div>
          <input type="number" inputmode="decimal" min="0" step="0.5" placeholder="0"
                 value="${eventoDraft[p.id] !== undefined ? eventoDraft[p.id] : ''}"
                 data-id="${p.id}">
        `;
        const input = row.querySelector('input');
        input.addEventListener('input', e=>{
          const v = e.target.value;
          if(v === '') { delete eventoDraft[p.id]; row.classList.remove('touched'); }
          else { eventoDraft[p.id] = parseFloat(v); row.classList.add('touched'); }
        });
        list.appendChild(row);
      });
  }
  renderList();
  el.querySelector('#prodSearch').addEventListener('input', e => renderList(e.target.value));

  el.querySelector('#saveEventBtn').addEventListener('click', async () => {
    const nombre = el.querySelector('#evtName').value.trim();
    const fecha = el.querySelector('#evtDate').value || new Date().toISOString().slice(0,10);
    if(!nombre){ toast('Ponle un nombre al evento'); return; }
    if(Object.keys(eventoDraft).length===0){ toast('Apunta al menos un producto'); return; }

    const btn = el.querySelector('#saveEventBtn');
    btn.disabled = true;
    btn.textContent = 'Comprobando la nube antes de guardar…';

    // Nos traemos primero lo último de la nube, por si otro dispositivo
    // ha guardado algo mientras teníamos esta pantalla abierta.
    const fresh = await fetchRemoteState();
    if(fresh.ok && fresh.state){
      state = fresh.state;
      saveLocalState();
    }

    const items = Object.entries(eventoDraft).map(([id, vuelta])=>{
      id = parseInt(id);
      const stockInicio = state.stock[id] !== undefined ? state.stock[id] : (PRODUCTS.find(p=>p.id===id)||{}).stockObjetivo;
      const gastado = Math.max(stockInicio - vuelta, 0);
      return { productId:id, stockInicio, vuelta, gastado, compraNecesaria: gastado };
    });
    items.forEach(it => { state.stock[it.productId] = it.vuelta; });
    state.historial.push({
      id: Date.now(),
      evento: nombre,
      fecha,
      items
    });
    saveLocalState();
    eventoDraft = {};
    toast(`Evento "${nombre}" guardado ✓ sincronizando…`);
    updateHeader();
    render();
    lastWriteFromThisTab = Date.now();
    pushRemoteState(state).then(ok=>{
      toast(ok ? 'Guardado también en la nube ☁️' : 'Guardado en este dispositivo (sin conexión a la nube)');
    });
  });
  return el;
}

/* ============ VISTA: LISTA DE COMPRA ============ */
function viewCompra(){
  const el = document.createElement('div');
  const evts = state.historial;
  el.innerHTML = `
    <h1 class="view-title">Lista de la compra</h1>
    <p class="view-desc">Lo que hace falta comprar para volver al stock objetivo, según el evento seleccionado.</p>
  `;
  if(evts.length === 0){
    el.innerHTML += `<div class="empty-state"><span class="emoji">🧾</span>Todavía no hay ningún evento guardado.<br>Ve a "Nuevo evento" para registrar el primero.</div>`;
    return el;
  }
  const sel = document.createElement('select');
  sel.className = 'evt-select';
  evts.slice().reverse().forEach(e=>{
    const opt = document.createElement('option');
    opt.value = e.id;
    opt.textContent = `${e.evento} · ${fmtDate(e.fecha)}`;
    sel.appendChild(opt);
  });
  el.appendChild(sel);

  const receiptWrap = document.createElement('div');
  el.appendChild(receiptWrap);

  function renderReceipt(evtId){
    const evt = evts.find(e => e.id == evtId);
    const withNeed = evt.items.filter(it => it.compraNecesaria > 0);
    let lines = withNeed.map(it=>{
      const p = PRODUCTS.find(pp=>pp.id===it.productId);
      const cost = p.precio!=null ? p.precio*it.compraNecesaria : null;
      return {name:p.nombre, qty:it.compraNecesaria, cost};
    });
    const total = lines.reduce((s,l)=> s + (l.cost||0), 0);
    const hasUnknownPrice = lines.some(l=>l.cost===null);
    receiptWrap.innerHTML = `
      <div class="receipt">
        <div class="receipt-head">Lista de compra</div>
        <div class="receipt-sub">${evt.evento} · ${fmtDate(evt.fecha)}</div>
        ${lines.length===0
          ? `<div class="receipt-empty">Nada que reponer — volviste con stock completo 🎉</div>`
          : lines.map(l=>`<div class="receipt-line"><span>${l.name}</span><span class="qty">${fmt(l.qty)}</span></div>`).join('')
        }
        ${lines.length>0 ? `<div class="receipt-total"><span>TOTAL${hasUnknownPrice?' *':''}</span><span>${fmtEUR(total)}</span></div>` : ''}
        ${hasUnknownPrice ? `<div class="receipt-sub" style="margin-top:6px;">* hay productos sin precio guardado, no entran en el total</div>` : ''}
      </div>
    `;
  }
  renderReceipt(sel.value);
  sel.addEventListener('change', ()=> renderReceipt(sel.value));
  return el;
}

/* ============ VISTA: STOCK ACTUAL ============ */
function viewStock(){
  const el = document.createElement('div');
  el.innerHTML = `
    <h1 class="view-title">Stock actual</h1>
    <p class="view-desc">Comparado con el stock objetivo de cada producto.</p>
    <div class="search-wrap"><input type="text" id="stockSearch" placeholder="Buscar producto…"></div>
    <div class="card">
      <div class="stock-head"><span>Producto</span><span style="text-align:right">Actual</span><span style="text-align:right">Objet.</span><span></span></div>
      <div id="stockRows"></div>
    </div>
  `;
  const rows = el.querySelector('#stockRows');
  function render(filter=''){
    rows.innerHTML = '';
    PRODUCTS.filter(p=>p.nombre.toLowerCase().includes(filter.toLowerCase())).forEach(p=>{
      const actual = state.stock[p.id];
      const diff = actual - p.stockObjetivo;
      const row = document.createElement('div');
      row.className = 'stock-row';
      row.innerHTML = `
        <span class="stock-name">${p.nombre}</span>
        <span class="stock-num">${fmt(actual)}</span>
        <span class="stock-num">${fmt(p.stockObjetivo)}</span>
        <span class="stock-diff ${diff<0?'diff-low':'diff-ok'}">${diff<0?'▼':'✓'}</span>
      `;
      rows.appendChild(row);
    });
  }
  render();
  el.querySelector('#stockSearch').addEventListener('input', e=>render(e.target.value));
  return el;
}

/* ============ VISTA: HISTORIAL ============ */
function viewHistorial(){
  const el = document.createElement('div');
  if(historyDetailId !== null){
    const evt = state.historial.find(e=>e.id===historyDetailId);
    el.innerHTML = `<button class="detail-back" id="backBtn">← Volver al historial</button>
      <h1 class="view-title">${evt.evento}</h1>
      <p class="view-desc">${fmtDate(evt.fecha)}</p>
      <div class="card">
        ${evt.items.map(it=>{
          const p = PRODUCTS.find(pp=>pp.id===it.productId);
          return `<div class="stock-row" style="grid-template-columns:1fr 55px 55px 55px;">
            <span class="stock-name">${p.nombre}</span>
            <span class="stock-num" title="vuelta">${fmt(it.vuelta)}</span>
            <span class="stock-num" title="gastado">${fmt(it.gastado)}</span>
            <span class="stock-num" title="comprar">${fmt(it.compraNecesaria)}</span>
          </div>`;
        }).join('')}
        <div class="stock-head" style="margin-top:10px;border-top:1px solid var(--line);border-bottom:none;padding-top:8px;grid-template-columns:1fr 55px 55px 55px;">
          <span></span><span style="text-align:right">Vuelta</span><span style="text-align:right">Gastado</span><span style="text-align:right">Comprar</span>
        </div>
      </div>`;
    el.querySelector('#backBtn').addEventListener('click', ()=>{ historyDetailId=null; render(); });
    return el;
  }
  el.innerHTML = `<h1 class="view-title">Historial de eventos</h1><p class="view-desc">Todo lo que has ido registrando, del más reciente al más antiguo.</p>`;
  if(state.historial.length===0){
    el.innerHTML += `<div class="empty-state"><span class="emoji">🗂️</span>Aún no hay eventos guardados.</div>`;
    return el;
  }
  state.historial.slice().reverse().forEach(evt=>{
    const card = document.createElement('div');
    card.className = 'card evt-card';
    card.style.cursor = 'pointer';
    const nProds = evt.items.length;
    card.innerHTML = `<div><div class="name">${evt.evento}</div><div class="meta">${fmtDate(evt.fecha)} · ${nProds} productos</div></div><div class="arrow">›</div>`;
    card.addEventListener('click', ()=>{ historyDetailId = evt.id; render(); });
    el.appendChild(card);
  });
  return el;
}

/* ============ ROUTER ============ */
const VIEWS = { evento: viewEvento, compra: viewCompra, stock: viewStock, historial: viewHistorial };

function render(){
  const app = document.getElementById('app');
  app.innerHTML = '';
  app.appendChild(VIEWS[currentView]());
  document.querySelectorAll('.tab-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.view === currentView);
  });
}

document.querySelectorAll('.tab-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    currentView = btn.dataset.view;
    if(currentView !== 'historial') historyDetailId = null;
    render();
  });
});

document.getElementById('syncBtn').addEventListener('click', ()=> syncFromCloud(true));

updateHeader();
render();
syncFromCloud(false);

// Refresco de respaldo: si el canal en tiempo real está bloqueado
// (algunos bloqueadores de anuncios/firewalls lo hacen), esto asegura
// que como mucho tardes 15s en ver los cambios de otro dispositivo.
setInterval(()=>{ syncFromCloud(false); }, 15000);

// Registra el service worker para que el navegador ofrezca "Instalar app".
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('/sw.js').catch(()=>{});
}

/* ============ DATOS MAESTROS (semilla inicial, mismos que en app.js) ============
   La lista real de productos vive en Firestore (state.products) y se edita
   más abajo, en "Gestión de productos". Este array solo sirve para crear el
   estado inicial o si la nube todavía no tiene productos guardados. */
const SEED_PRODUCTS = [{"id":0,"nombre":"Pincho Pollo","precio":0.9196,"stockObjetivo":12},{"id":1,"nombre":"Pincho Gambas","precio":0.999,"stockObjetivo":24},{"id":2,"nombre":"Calamares","precio":0.114,"stockObjetivo":7.14},{"id":3,"nombre":"Muslitos cangrejo","precio":0.1809375,"stockObjetivo":7.81},{"id":4,"nombre":"Gambas Torpedo","precio":null,"stockObjetivo":0},{"id":5,"nombre":"Jamon","precio":0.425,"stockObjetivo":3.2},{"id":6,"nombre":"Queso","precio":0.3398,"stockObjetivo":5},{"id":7,"nombre":"Datiles Beicon","precio":0.3108,"stockObjetivo":0},{"id":8,"nombre":"Croquetas jamon","precio":null,"stockObjetivo":0},{"id":9,"nombre":"Patata","precio":0.5271,"stockObjetivo":42},{"id":10,"nombre":"Olivas con pimiento","precio":0.0598,"stockObjetivo":3},{"id":11,"nombre":"Pan tostado","precio":null,"stockObjetivo":2},{"id":12,"nombre":"Coleslaw Americana","precio":0.5495,"stockObjetivo":3},{"id":13,"nombre":"Limones","precio":0.0497,"stockObjetivo":6.67},{"id":14,"nombre":"Remoulade","precio":0.0187,"stockObjetivo":2},{"id":15,"nombre":"Mayonesa","precio":0.0187,"stockObjetivo":3.75},{"id":16,"nombre":"Ketchup","precio":0.0187,"stockObjetivo":6},{"id":17,"nombre":"Chilisauce","precio":0.0468,"stockObjetivo":1},{"id":18,"nombre":"Aioli","precio":0.2398,"stockObjetivo":3},{"id":19,"nombre":"Leche","precio":0.25,"stockObjetivo":9},{"id":20,"nombre":"petesilie congelado","precio":null,"stockObjetivo":0},{"id":21,"nombre":"ajo congelado","precio":null,"stockObjetivo":0},{"id":22,"nombre":"Ajos","precio":0.0199,"stockObjetivo":3},{"id":23,"nombre":"aceite rapsol","precio":null,"stockObjetivo":4},{"id":24,"nombre":"Aceite Freir Girasol","precio":0.9295,"stockObjetivo":12},{"id":25,"nombre":"Aceite oliva","precio":0.1338,"stockObjetivo":2},{"id":26,"nombre":"Mantequilla plancha","precio":0.0012,"stockObjetivo":1},{"id":27,"nombre":"Sal","precio":0.0038,"stockObjetivo":1},{"id":28,"nombre":"vinagre","precio":0.005,"stockObjetivo":1},{"id":29,"nombre":"Paprica schüs","precio":null,"stockObjetivo":1},{"id":30,"nombre":"Paprica Sarf","precio":null,"stockObjetivo":2},{"id":31,"nombre":"Plato schale","precio":0.092,"stockObjetivo":500},{"id":32,"nombre":"Plato Tapa","precio":0.0598,"stockObjetivo":350},{"id":33,"nombre":"Plato Combioval","precio":0.1058,"stockObjetivo":300},{"id":34,"nombre":"Plato Fiesta","precio":0.2198,"stockObjetivo":50},{"id":35,"nombre":"Platito salsas","precio":0.0619,"stockObjetivo":200},{"id":36,"nombre":"Platito olivas","precio":0.0549,"stockObjetivo":200},{"id":37,"nombre":"Tenedores","precio":0.0115,"stockObjetivo":300},{"id":38,"nombre":"Cuchillos","precio":0.0115,"stockObjetivo":300},{"id":39,"nombre":"servilletas","precio":null,"stockObjetivo":500},{"id":40,"nombre":"servilletas rollo","precio":null,"stockObjetivo":8},{"id":41,"nombre":"palillos","precio":0.0009,"stockObjetivo":1},{"id":42,"nombre":"ALU (papel Alu)","precio":0.027,"stockObjetivo":8},{"id":43,"nombre":"ensalada","precio":null,"stockObjetivo":0}];

const ADMIN_PIN = "2026"; // cámbialo pidiéndomelo si quieres otro código

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

function defaultState(){
  const products = SEED_PRODUCTS.map(p=>({...p}));
  const stock = {};
  products.forEach(p => stock[p.id] = p.stockObjetivo);
  return { products, stock, historial: [] };
}
function ensureProducts(s){
  if(!s.products || !Array.isArray(s.products) || s.products.length===0){
    s.products = SEED_PRODUCTS.map(p=>({...p}));
  }
  if(!s.stock) s.stock = {};
  s.products.forEach(p=>{
    if(s.stock[p.id] === undefined) s.stock[p.id] = p.stockObjetivo;
  });
  return s;
}
function nextProductId(products){
  return products.reduce((max,p)=>Math.max(max,p.id), -1) + 1;
}

let state = null;

function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), 2500);
}

async function pushState(){
  try{
    await setDoc(STATE_DOC, { json: JSON.stringify(state), updatedAt: Date.now(), from: 'admin' });
    toast('Guardado en la nube ☁️');
    return true;
  }catch(e){
    toast('Error al guardar: ' + e.message);
    return false;
  }
}

/* ============ PIN GATE ============ */
function checkGate(){
  const saved = sessionStorage.getItem('rutatapas_admin_ok');
  if(saved === '1') return true;
  return false;
}

function renderGate(){
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="gate">
      <h1 class="view-title">Acceso backoffice</h1>
      <p class="view-desc">Introduce el código para entrar.</p>
      <input type="password" inputmode="numeric" id="pinInput" maxlength="8" placeholder="••••">
      <button class="btn btn-primary btn-block" id="pinBtn">Entrar</button>
    </div>
  `;
  document.getElementById('pinBtn').addEventListener('click', ()=>{
    const v = document.getElementById('pinInput').value;
    if(v === ADMIN_PIN){
      sessionStorage.setItem('rutatapas_admin_ok','1');
      loadAndRenderApp();
    } else {
      toast('Código incorrecto');
    }
  });
  document.getElementById('pinInput').addEventListener('keydown', e=>{
    if(e.key === 'Enter') document.getElementById('pinBtn').click();
  });
}

/* ============ APP PRINCIPAL DEL BACKOFFICE ============ */
function renderApp(){
  if(!state) return;
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="admin-section">
      <h2>Gestión de productos (${state.products.length})</h2>
      <p class="admin-note">Cambia nombre, precio o stock objetivo directamente en la lista, o añade un producto nuevo. Nada se guarda hasta pulsar "Guardar cambios en productos". Borrar un producto no borra su historial pasado (aparecerá como "producto eliminado" en eventos antiguos).</p>
      <div class="card" id="prodEdit"></div>
      <div class="add-prod-form">
        <input type="text" id="newProdName" placeholder="Nombre del producto nuevo">
        <div class="add-prod-row2">
          <input type="number" step="0.0001" min="0" id="newProdPrecio" placeholder="Precio €">
          <input type="number" step="0.5" min="0" id="newProdObjetivo" placeholder="Stock objetivo">
          <button class="btn btn-secondary" id="addProdBtn">+ Añadir</button>
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="saveProdBtn" style="margin-top:12px;">Guardar cambios en productos</button>
    </div>

    <div class="admin-section">
      <h2>Editar stock actual</h2>
      <p class="admin-note">Cambia el número directamente si necesitas corregir algo a mano. Los cambios no se guardan hasta pulsar "Guardar cambios en stock".</p>
      <div class="card" id="stockEdit"></div>
      <div style="height:56px;"></div>
    </div>

    <div class="admin-section">
      <h2>Historial (${state.historial.length} eventos)</h2>
      <p class="admin-note">Puedes borrar eventos concretos si te equivocaste al registrarlos.</p>
      <div class="card" id="histList"></div>
    </div>

    <div class="admin-section danger-zone">
      <h2>Zona de peligro</h2>
      <p class="admin-note">Esto no se puede deshacer.</p>
      <button class="btn btn-danger btn-block" id="wipeHistBtn">Borrar TODO el historial</button>
      <div style="height:10px;"></div>
      <button class="btn btn-danger btn-block" id="resetAllBtn">Borrar historial Y reiniciar stock al objetivo</button>
    </div>
  `;

  /* ---- Gestión de productos ---- */
  const prodEdit = document.getElementById('prodEdit');
  function renderProdRows(){
    prodEdit.innerHTML = `
      <div class="prod-edit-head">
        <span>Producto</span><span>Precio €</span><span>Stock objetivo</span><span></span>
      </div>
    `;
    state.products.forEach(p=>{
      const row = document.createElement('div');
      row.className = 'prod-edit-row';
      row.dataset.id = p.id;
      row.innerHTML = `
        <input type="text" class="pe-name" value="${p.nombre.replace(/"/g,'&quot;')}">
        <input type="number" class="pe-precio" step="0.0001" min="0" placeholder="—" value="${p.precio!=null ? p.precio : ''}">
        <input type="number" class="pe-objetivo" step="0.5" min="0" value="${p.stockObjetivo}">
        <button class="del" title="Eliminar producto" type="button">🗑</button>
      `;
      row.querySelector('.del').addEventListener('click', ()=>{
        if(!confirm(`¿Eliminar "${p.nombre}" de la lista de productos?`)) return;
        state.products = state.products.filter(pp=>pp.id!==p.id);
        delete state.stock[p.id];
        renderProdRows();
      });
      prodEdit.appendChild(row);
    });
  }
  renderProdRows();

  document.getElementById('addProdBtn').addEventListener('click', ()=>{
    const nameInp = document.getElementById('newProdName');
    const precioInp = document.getElementById('newProdPrecio');
    const objetivoInp = document.getElementById('newProdObjetivo');
    const nombre = nameInp.value.trim();
    if(!nombre){ toast('Ponle un nombre al producto nuevo'); return; }
    const precio = precioInp.value.trim() === '' ? null : parseFloat(precioInp.value);
    const stockObjetivo = objetivoInp.value.trim() === '' ? 0 : (parseFloat(objetivoInp.value) || 0);
    const id = nextProductId(state.products);
    state.products.push({ id, nombre, precio, stockObjetivo });
    state.stock[id] = stockObjetivo;
    nameInp.value = ''; precioInp.value = ''; objetivoInp.value = '';
    renderProdRows();
    toast(`"${nombre}" añadido — recuerda pulsar "Guardar cambios en productos"`);
  });

  document.getElementById('saveProdBtn').addEventListener('click', async ()=>{
    const rows = prodEdit.querySelectorAll('.prod-edit-row');
    const updated = [];
    rows.forEach(row=>{
      const id = parseInt(row.dataset.id);
      const nombre = row.querySelector('.pe-name').value.trim();
      const precioRaw = row.querySelector('.pe-precio').value;
      const precio = precioRaw.trim() === '' ? null : parseFloat(precioRaw);
      const objetivoRaw = row.querySelector('.pe-objetivo').value;
      const stockObjetivo = objetivoRaw.trim() === '' ? 0 : (parseFloat(objetivoRaw) || 0);
      if(nombre) updated.push({ id, nombre, precio, stockObjetivo });
    });
    state.products = updated;
    const ok = await pushState();
    if(ok) renderApp();
  });

  const stockEdit = document.getElementById('stockEdit');
  state.products.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'edit-row';
    row.innerHTML = `
      <div>
        <div class="name">${p.nombre}</div>
        <div class="diff">objetivo: ${p.stockObjetivo}</div>
      </div>
      <input type="number" step="0.5" data-id="${p.id}" value="${state.stock[p.id]}">
    `;
    stockEdit.appendChild(row);
  });

  const histList = document.getElementById('histList');
  if(state.historial.length === 0){
    histList.innerHTML = `<div class="empty-state" style="padding:16px;">Sin eventos.</div>`;
  } else {
    state.historial.slice().reverse().forEach(evt=>{
      const row = document.createElement('div');
      row.className = 'evt-row';
      row.innerHTML = `<span>${evt.evento} — ${evt.fecha} (${evt.items.length} productos)</span><button class="del" title="Borrar este evento">🗑</button>`;
      row.querySelector('.del').addEventListener('click', async ()=>{
        if(!confirm(`¿Borrar el evento "${evt.evento}" (${evt.fecha})? Esto no se puede deshacer.`)) return;
        state.historial = state.historial.filter(e=>e.id!==evt.id);
        const ok = await pushState();
        if(ok) renderApp();
      });
      histList.appendChild(row);
    });
  }

  document.getElementById('wipeHistBtn').addEventListener('click', async ()=>{
    if(!confirm('¿Seguro que quieres borrar TODO el historial? El stock actual se mantiene tal cual está.')) return;
    if(!confirm('Confirmación final: esta acción no se puede deshacer. ¿Continuar?')) return;
    state.historial = [];
    const ok = await pushState();
    if(ok) renderApp();
  });

  document.getElementById('resetAllBtn').addEventListener('click', async ()=>{
    if(!confirm('¿Borrar TODO el historial y poner el stock de cada producto a su valor objetivo? Esto no se puede deshacer.')) return;
    if(!confirm('Confirmación final: esta acción no se puede deshacer. ¿Continuar?')) return;
    state = defaultState();
    const ok = await pushState();
    if(ok) renderApp();
  });

  // barra de guardado del stock, sticky (se quita la anterior para no acumular)
  document.querySelectorAll('.save-bar').forEach(b=>b.remove());
  const bar = document.createElement('div');
  bar.className = 'save-bar';
  bar.innerHTML = `<button class="btn btn-primary btn-block" id="saveStockBtn">Guardar cambios en stock</button>`;
  document.body.appendChild(bar);
  document.getElementById('saveStockBtn').addEventListener('click', async ()=>{
    stockEdit.querySelectorAll('input').forEach(inp=>{
      const id = parseInt(inp.dataset.id);
      const v = parseFloat(inp.value);
      state.stock[id] = isNaN(v) ? 0 : v;
    });
    await pushState();
  });
}

/* ============ INIT ============ */
let subscribed = false;
async function loadAndRenderApp(){
  const snap = await getDoc(STATE_DOC);
  state = ensureProducts((snap.exists() && snap.data().json) ? JSON.parse(snap.data().json) : defaultState());
  renderApp();
  if(!subscribed){
    subscribed = true;
    onSnapshot(STATE_DOC, (s)=>{
      if(!s.exists() || !s.data().json) return;
      state = ensureProducts(JSON.parse(s.data().json));
      // no re-renderizamos automáticamente para no perder ediciones a medio hacer;
      // solo avisamos de que hay cambios más recientes en la nube.
      toast('Hay cambios nuevos en la nube — recarga la página para verlos');
    });
  }
}
function init(){
  if(!checkGate()){ renderGate(); return; }
  loadAndRenderApp();
}
init();

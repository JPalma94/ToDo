import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyD0dgKe3ki4_AFVOhsnMb3UnHxJZjSYvD4",
  authDomain: "todo-287e1.firebaseapp.com",
  projectId: "todo-287e1",
  storageBucket: "todo-287e1.firebasestorage.app",
  messagingSenderId: "802977970794",
  appId: "1:802977970794:web:2ad7cc56e3bf38a6706813"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
const listRef = doc(db, 'lists', 'shared');
const backlogRef = doc(db, 'backlog', 'shared');

// Navigation
function navigateTo(page) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${page}"]`).classList.add('active');
  document.querySelectorAll('section[id^="page-"]').forEach((s) => s.hidden = true);
  document.getElementById(`page-${page}`).hidden = false;
  document.body.classList.toggle('page-home', page === 'home');
  document.body.classList.toggle('page-backlog', page === 'backlog');
  document.body.classList.toggle('page-all-items', page === 'all-items');
}

document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

navigateTo('home');

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}

// All Items data (defined early so render can reference category order)
const allItemsCategories = [
  { title: 'Proteínas', items: ['Feijão Preto','Feijão Branco','Grão','Soja','Seitan','Ovos','Salmão','Filetes de pescada','Peito de Frango','Bife de Frango finíssimos','Hamburguer de Frango','Patanas iglo verdes','Patanas iglo frango e queijo','Miolo de camarão','Cogumelos latas/frescos','Tofu marinado (aldi)','Tofu fumado (aldi)'] },
  { title: 'Laticínios', items: ['Queijo fatias','Queijo philadelphia','Queijo cottage','Queijo parmesão','Queijo mozzarella fresca','Iogurte Alpro Fruta','Iogurte Alpro Sky Natural','Iogurte Alpro Natural','Manteiga','Leite soja 0% açúcar'] },
  { title: 'Grãos/Massas', items: ['Batata forno','Arroz Basmati','Massa larga','Massa esparguete','Massa espiral','Massa lecinhas'] },
  { title: 'Higiene/Casa de banho', items: ['Papel Higienico','Rolo de Cozinha','Toalhetes','Pasta de dentes','Lísterine','Champô','Gel de banho','Sacos do lixo 30','Sacos do lixo 10','Sacos do lixo 5','Sacos de coco milile','Desodorizante','Areia Millie','Comida Millie','Recarga sabão das mãos'] },
  { title: 'Cereais/Complementos', items: ['Cereais Fitness','Cereais Argolas','Flocos de Aveia','Preparado Panquecas','Farinha de Aveia','Pão para congelar/Pão de forma','Tortilhas integrais','Tostas integrais finas','Chocolate negro','Frutos secos (Noz, Caju, Amendoim)','Croutons com sabor'] },
  { title: 'Molhos/Temperos', items: ['Pesto','Molho de tomate com manjericão','Soja','Vinagre balsamico','Creme de Soja','Picante (Tabasco)','Flor de sal','Oregãos','Ervas de provencea','Alho em Pó','Pimentão doce','Pimentão doce fumado','Bechamel','Azeite Trufa'] },
  { title: 'Legumes', items: ['Cebola','Alho','Tomate','Alface','Pepino','Esparregado','Bróculos','Ervilhas','Pimento','Couve flor','Límbes','Lima'] },
  { title: 'Fruta', items: ['Banana','Maçã','Uvas','Pera','Mamão','Framboesas','Morangos'] },
  { title: 'Café/Chá', items: ['Café solúvel','Café capsulas','Chá ervas'] },
  { title: 'Bebidas', items: ['Garrafa de Água','Compal Maçã','Compal Manga','Compal Manga Laranja','Freeze Limão'] },
  { title: 'Sopa', items: ['Alho francês','Cenoura','Courgete','Cabeça de Nabo','Abóbora','Chuchu'] },
  { title: 'Cozinha', items: ['Papel de alumínio','Papel vegetal','Película','Desinfetante cozinha','Desinfetante casa de Banho','Liquido da Loiça','Pastilhas máquina da Loiça','Alcool'] },
  { title: 'Roupa', items: ['Liquido roupa cores','Liquido roupa preta','Amaciador','Água destilada'] },
];

// List
const input       = document.getElementById('new-item');
const list        = document.getElementById('todo-list');
const clearBtn    = document.getElementById('clear-btn');
const itemCount   = document.getElementById('item-count');
const cartTotal   = document.getElementById('cart-total');
const calcBtn     = document.getElementById('calc-btn');
const priceModal  = document.getElementById('price-modal');
const priceInput  = document.getElementById('price-input');
const suggestionsEl = document.getElementById('suggestions');

// Backlog
const backlogInput       = document.getElementById('new-backlog-item');
const backlogList        = document.getElementById('backlog-list');
const backlogClearBtn    = document.getElementById('clear-backlog-btn');
const backlogSuggestionsEl = document.getElementById('backlog-suggestions');

let items = [];
let backlogItems = [];
let calculatorMode = false;

function save() {
  setDoc(listRef, { items, calculatorMode });
}

function saveBacklog() {
  setDoc(backlogRef, { items: backlogItems });
}

function renderItem(item, i) {
  const li = document.createElement('li');
  li.className = item.done ? 'done' : '';
  li.innerHTML = `
    <label>
      <input type="checkbox" ${item.done ? 'checked' : ''} data-i="${i}" />
      <span>${item.text}</span>
    </label>
    <button class="delete" data-i="${i}" aria-label="Delete">✕</button>
  `;
  list.appendChild(li);
}

function renderBacklogItem(item, i) {
  const li = document.createElement('li');
  li.className = item.done ? 'done' : '';
  li.innerHTML = `
    <label>
      <input type="checkbox" ${item.done ? 'checked' : ''} data-i="${i}" />
      <span>${item.text}</span>
    </label>
    <button class="move-to-list" data-i="${i}" aria-label="Add to list">←</button>
    <button class="delete" data-i="${i}" aria-label="Delete">✕</button>
  `;
  backlogList.appendChild(li);
}

function render() {
  list.innerHTML = '';

  // Unchecked uncategorised items first
  items.forEach((item, i) => {
    if (!item.category && !item.done) renderItem(item, i);
  });

  // Unchecked categorised items grouped in aisle order
  allItemsCategories.forEach(({ title }) => {
    const group = items.map((item, i) => ({ ...item, i })).filter((item) => item.category === title && !item.done);
    if (!group.length) return;
    group.forEach(({ i }) => renderItem(items[i], i));
  });

  // Checked items at the bottom
  items.forEach((item, i) => {
    if (item.done) renderItem(item, i);
  });

  clearBtn.hidden = !items.some((item) => item.done);
  const done = items.filter((item) => item.done).length;
  itemCount.textContent = items.length ? `${done}/${items.length}` : '';

  const total = items
    .filter((item) => item.done && typeof item.price === 'number')
    .reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = calculatorMode ? `Total: €${total.toFixed(2)}` : '';
  calcBtn.classList.toggle('active', calculatorMode);
}

function renderBacklog() {
  backlogList.innerHTML = '';

  // Unchecked uncategorised items first
  backlogItems.forEach((item, i) => {
    if (!item.category && !item.done) renderBacklogItem(item, i);
  });

  // Unchecked categorised items grouped in aisle order
  allItemsCategories.forEach(({ title }) => {
    const group = backlogItems.map((item, i) => ({ ...item, i })).filter((item) => item.category === title && !item.done);
    if (!group.length) return;
    group.forEach(({ i }) => renderBacklogItem(backlogItems[i], i));
  });

  // Checked items at the bottom
  backlogItems.forEach((item, i) => {
    if (item.done) renderBacklogItem(item, i);
  });

  backlogClearBtn.hidden = !backlogItems.some((item) => item.done);
}

const priceItemName = document.getElementById('price-item-name');
const priceConfirmBtn = document.getElementById('price-confirm-btn');
const priceBackBtn = document.getElementById('price-back-btn');
const confirmModal = document.getElementById('confirm-modal');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkBtn = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

function showConfirm(message) {
  return new Promise((resolve) => {
    confirmMessage.textContent = message;
    confirmModal.hidden = false;

    const cleanup = () => {
      confirmModal.hidden = true;
      confirmOkBtn.removeEventListener('click', onOk);
      confirmCancelBtn.removeEventListener('click', onCancel);
      confirmModal.removeEventListener('click', onBackdrop);
    };
    const onOk = () => {
      cleanup();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    const onBackdrop = (e) => {
      if (e.target === confirmModal) {
        cleanup();
        resolve(false);
      }
    };

    confirmOkBtn.addEventListener('click', onOk);
    confirmCancelBtn.addEventListener('click', onCancel);
    confirmModal.addEventListener('click', onBackdrop);
  });
}

function promptPrice(itemName, currentPrice) {
  return new Promise((resolve) => {
    priceItemName.textContent = itemName;
    priceInput.value = currentPrice ?? '';
    priceModal.hidden = false;
    setTimeout(() => { priceInput.focus(); priceInput.select(); }, 0);

    const cleanup = () => {
      priceModal.hidden = true;
      priceInput.removeEventListener('keydown', onKey);
      priceModal.removeEventListener('click', onClick);
      priceConfirmBtn.removeEventListener('click', onConfirm);
      priceBackBtn.removeEventListener('click', onBack);
    };
    const confirm = () => {
      const v = parseFloat(priceInput.value);
      cleanup();
      resolve(isNaN(v) ? null : v);
    };
    const onKey = (e) => {
      if (e.key === 'Enter') {
        confirm();
      } else if (e.key === 'Escape') {
        cleanup();
        resolve(null);
      }
    };
    const onClick = (e) => {
      if (e.target === priceModal) { cleanup(); resolve(null); }
    };
    const onConfirm = () => confirm();
    const onBack = () => { cleanup(); resolve(null); };

    priceInput.addEventListener('keydown', onKey);
    priceModal.addEventListener('click', onClick);
    priceConfirmBtn.addEventListener('click', onConfirm);
    priceBackBtn.addEventListener('click', onBack);
  });
}

function addToList(text, category = null) {
  items.push({ text, done: false, category });
  save();
}

function addToBacklog(text, category = null) {
  backlogItems.push({ text, done: false, category });
  saveBacklog();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
}

let currentSuggestions = [];
let currentBacklogSuggestions = [];

function showSuggestions(query) {
  if (!query) { suggestionsEl.hidden = true; return; }
  const q = query.toLowerCase();
  currentSuggestions = [];
  allItemsCategories.forEach(({ title, items: categoryItems }) => {
    categoryItems.forEach((text) => {
      if (text.toLowerCase().includes(q)) currentSuggestions.push({ text, category: title });
    });
  });
  if (!currentSuggestions.length) { suggestionsEl.hidden = true; return; }
  suggestionsEl.innerHTML = currentSuggestions.slice(0, 6).map((s, i) =>
    `<li data-i="${i}">${s.text}</li>`
  ).join('');
  suggestionsEl.hidden = false;
}

function showBacklogSuggestions(query) {
  if (!query) { backlogSuggestionsEl.hidden = true; return; }
  const q = query.toLowerCase();
  currentBacklogSuggestions = [];
  allItemsCategories.forEach(({ title, items: categoryItems }) => {
    categoryItems.forEach((text) => {
      if (text.toLowerCase().includes(q)) currentBacklogSuggestions.push({ text, category: title });
    });
  });
  if (!currentBacklogSuggestions.length) { backlogSuggestionsEl.hidden = true; return; }
  backlogSuggestionsEl.innerHTML = currentBacklogSuggestions.slice(0, 6).map((s, i) =>
    `<li data-i="${i}">${s.text}</li>`
  ).join('');
  backlogSuggestionsEl.hidden = false;
}

input.addEventListener('input', () => showSuggestions(input.value.trim()));

backlogInput.addEventListener('input', () => showBacklogSuggestions(backlogInput.value.trim()));

suggestionsEl.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const { text, category } = currentSuggestions[li.dataset.i];
  addToList(text, category);
  input.value = '';
  suggestionsEl.hidden = true;
  input.focus();
});

backlogSuggestionsEl.addEventListener('click', (e) => {
  const li = e.target.closest('li');
  if (!li) return;
  const { text, category } = currentBacklogSuggestions[li.dataset.i];
  addToBacklog(text, category);
  backlogInput.value = '';
  backlogSuggestionsEl.hidden = true;
  backlogInput.focus();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.input-wrapper')) suggestionsEl.hidden = true;
  if (!e.target.closest('.input-wrapper')) backlogSuggestionsEl.hidden = true;
});

function addItem() {
  const text = input.value.trim();
  if (!text) return;
  addToList(text);
  input.value = '';
  suggestionsEl.hidden = true;
  input.focus();
}

function addBacklogItem() {
  const text = backlogInput.value.trim();
  if (!text) return;
  addToBacklog(text);
  backlogInput.value = '';
  backlogSuggestionsEl.hidden = true;
  backlogInput.focus();
}

list.addEventListener('change', async (e) => {
  if (e.target.type !== 'checkbox') return;
  const i = parseInt(e.target.dataset.i, 10);
  const checking = e.target.checked;

  if (checking && calculatorMode) {
    const price = await promptPrice(items[i].text, items[i].price);
    if (price === null) {
      e.target.checked = false;
      return;
    }
    items[i].price = price;
  }
  items[i].done = checking;

  // Move checked items to the bottom
  if (checking) {
    const [item] = items.splice(i, 1);
    items.push(item);
  }

  save();
});

backlogList.addEventListener('change', async (e) => {
  if (e.target.type !== 'checkbox') return;
  const i = parseInt(e.target.dataset.i, 10);
  const checking = e.target.checked;
  backlogItems[i].done = checking;

  // Move checked items to the bottom
  if (checking) {
    const [item] = backlogItems.splice(i, 1);
    backlogItems.push(item);
  }

  saveBacklog();
});

calcBtn.addEventListener('click', () => {
  calculatorMode = !calculatorMode;
  save();
});

list.addEventListener('click', (e) => {
  if (!e.target.classList.contains('delete')) return;
  items.splice(e.target.dataset.i, 1);
  save();
});

backlogList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete')) {
    backlogItems.splice(e.target.dataset.i, 1);
    saveBacklog();
    return;
  }
  if (e.target.classList.contains('move-to-list')) {
    const i = parseInt(e.target.dataset.i, 10);
    const item = backlogItems[i];
    if (await showConfirm(`Add "${item.text}" to list?`)) {
      backlogItems.splice(i, 1);
      saveBacklog();
      addToList(item.text, item.category || null);
      showToast(`"${item.text}" added to list.`);
    }
  }
});

clearBtn.addEventListener('click', () => {
  items = items.filter((item) => !item.done);
  save();
});

backlogClearBtn.addEventListener('click', () => {
  backlogItems = backlogItems.filter((item) => !item.done);
  saveBacklog();
});

document.getElementById('add-all-to-list-btn').addEventListener('click', async () => {
  if (await showConfirm('Add all to list?')) {
    const itemsToAdd = [...backlogItems];
    backlogItems = [];
    saveBacklog();
    itemsToAdd.forEach((item) => {
      addToList(item.text, item.category || null);
    });
    showToast(`${itemsToAdd.length} items added to list.`);
  }
});

document.getElementById('reset-btn').addEventListener('click', async () => {
  const activePage = document.querySelector('.nav-btn.active').dataset.page;
  if (activePage === 'home') {
    if (await showConfirm('Reset main list?')) {
      items = [];
      save();
    }
  } else if (activePage === 'backlog') {
    if (await showConfirm('Reset backlog?')) {
      backlogItems = [];
      saveBacklog();
    }
  }
});

document.getElementById('add-btn').addEventListener('click', addItem);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addItem(); });

document.getElementById('add-backlog-btn').addEventListener('click', addBacklogItem);
backlogInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBacklogItem(); });

function updateAllItemsHighlights() {
  const inList = new Set([...items, ...backlogItems].map((item) => item.text));
  document.querySelectorAll('.all-item').forEach((el) => {
    el.classList.toggle('in-list', inList.has(el.textContent));
  });
}

// Subscribe to Firestore — renders on every remote or local change
onSnapshot(listRef, (snap) => {
  const data = snap.exists() ? snap.data() : {};
  items = data.items || [];
  calculatorMode = !!data.calculatorMode;
  render();
  updateAllItemsHighlights();
});

onSnapshot(backlogRef, (snap) => {
  const data = snap.exists() ? snap.data() : {};
  backlogItems = data.items || [];
  renderBacklog();
  updateAllItemsHighlights();
});

// Build All Items page
const allItemsPage = document.getElementById('page-all-items');
allItemsCategories.forEach(({ title, items: categoryItems }) => {
  const section = document.createElement('div');
  section.className = 'category';
  section.innerHTML = `
    <h2 class="category-title">
      <span>${title}</span>
      <span class="chevron">▸</span>
    </h2>
    <ul class="category-list" hidden>
      ${categoryItems.map((item) => `<li class="all-item">${item}</li>`).join('')}
    </ul>
  `;
  const titleEl = section.querySelector('.category-title');
  const listEl  = section.querySelector('.category-list');
  const chevron = section.querySelector('.chevron');
  titleEl.addEventListener('click', () => {
    const collapsed = listEl.hidden = !listEl.hidden;
    chevron.textContent = collapsed ? '▸' : '▾';
  });
  listEl.addEventListener('click', (e) => {
    if (!e.target.classList.contains('all-item')) return;
    const text = e.target.textContent;
    const existingIndex = items.findIndex((item) => item.text === text);
    if (existingIndex !== -1) {
      items.splice(existingIndex, 1);
      save();
      showToast(`"${text}" removed.`);
    } else {
      addToList(text, title);
      showToast(`"${text}" added.`);
    }
  });
  allItemsPage.appendChild(section);
});

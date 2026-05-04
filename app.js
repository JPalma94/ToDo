// Navigation
function navigateTo(page) {
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-page="${page}"]`).classList.add('active');
  document.querySelectorAll('section[id^="page-"]').forEach((s) => s.hidden = true);
  document.getElementById(`page-${page}`).hidden = false;
  document.body.classList.toggle('page-home', page === 'home');
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
  { title: 'Grãos/Massas', items: ['Batata fumo','Arroz Basmati','Massa larga','Massa esparguete','Massa espiral','Massa lecinhas'] },
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

// Shopping list
const input     = document.getElementById('new-item');
const list      = document.getElementById('todo-list');
const clearBtn  = document.getElementById('clear-btn');
const itemCount = document.getElementById('item-count');

let items = JSON.parse(localStorage.getItem('todos') || '[]');

function save() {
  localStorage.setItem('todos', JSON.stringify(items));
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

function render() {
  list.innerHTML = '';

  // Uncategorised items first
  items.forEach((item, i) => {
    if (!item.category) renderItem(item, i);
  });

  // Categorised items grouped in aisle order
  allItemsCategories.forEach(({ title }) => {
    const group = items.map((item, i) => ({ ...item, i })).filter((item) => item.category === title);
    if (!group.length) return;
    group.forEach(({ i }) => renderItem(items[i], i));
  });

  clearBtn.hidden = !items.some((item) => item.done);
  const done = items.filter((item) => item.done).length;
  itemCount.textContent = items.length ? `${done}/${items.length}` : '';
}

function addToList(text, category = null) {
  items.push({ text, done: false, category });
  save();
  render();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
}

function addItem() {
  const text = input.value.trim();
  if (!text) return;
  addToList(text);
  input.value = '';
  input.focus();
}

list.addEventListener('change', (e) => {
  if (e.target.type !== 'checkbox') return;
  items[e.target.dataset.i].done = e.target.checked;
  save();
  render();
});

list.addEventListener('click', (e) => {
  if (!e.target.classList.contains('delete')) return;
  items.splice(e.target.dataset.i, 1);
  save();
  render();
});

clearBtn.addEventListener('click', () => {
  items = items.filter((item) => !item.done);
  save();
  render();
});

document.getElementById('reset-btn').addEventListener('click', () => {
  if (confirm('Reset list?')) {
    items = [];
    save();
    render();
  }
});

document.getElementById('add-btn').addEventListener('click', addItem);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addItem(); });

render();

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
    addToList(e.target.textContent, title);
    showToast(`"${e.target.textContent}" added.`);
  });
  allItemsPage.appendChild(section);
});

// Navigation
document.querySelectorAll('.nav-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('section[id^="page-"]').forEach((s) => s.hidden = true);
    document.getElementById(`page-${btn.dataset.page}`).hidden = false;
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('service-worker.js'));
}

const input = document.getElementById('new-item');
const list  = document.getElementById('todo-list');

let items = JSON.parse(localStorage.getItem('todos') || '[]');

function save() {
  localStorage.setItem('todos', JSON.stringify(items));
}

function render() {
  list.innerHTML = '';
  items.forEach((item, i) => {
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
  });
}

function addItem() {
  const text = input.value.trim();
  if (!text) return;
  items.push({ text, done: false });
  save();
  render();
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

document.getElementById('add-btn').addEventListener('click', addItem);
input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addItem(); });

render();

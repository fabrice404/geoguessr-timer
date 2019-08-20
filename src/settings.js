const bsr = chrome != null ? chrome : browser;
let columns = [];

const decamelize = (str) => str
  .replace('_', '')
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1 $2')
  .toUpperCase();

const moveLeft = (key) => {
  if (!key.startsWith('_')) {
    const oldIndex = columns.indexOf(key);
    const newIndex = oldIndex - 1;
    if (newIndex >= 0) {
      columns[oldIndex] = columns[newIndex];
      columns[newIndex] = key;
    }
  }
  loadColumns(); // eslint-disable-line no-use-before-define
};

const moveRight = (key) => {
  if (!key.startsWith('_')) {
    const oldIndex = columns.indexOf(key);
    const newIndex = oldIndex + 1;
    if (newIndex < columns.length) {
      columns[oldIndex] = columns[newIndex];
      columns[newIndex] = key;
    }
  }
  loadColumns(); // eslint-disable-line no-use-before-define
};

const loadColumns = () => {
  const container = document.getElementById('columns');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  for (let i = 0; i < columns.length; i += 1) {
    const key = columns[i];

    // text
    const text = document.createElement('span');
    text.textContent = decamelize(key);

    const li = document.createElement('li');
    li.appendChild(text);

    if (!key.startsWith('_')) {
      if (i > 0) {
        // left button
        const left = document.createElement('button');
        left.addEventListener('click', () => { moveLeft(key); });
        left.innerHTML = '&larr;';
        li.appendChild(left);
      }

      if (i < columns.length - 1) {
        // right button
        const right = document.createElement('button');
        right.addEventListener('click', () => { moveRight(key); });
        right.innerHTML = '&rarr;';
        li.appendChild(right);
      }
    }

    container.appendChild(li);
  }
};

const loadSettings = () => {
  bsr.storage.sync.get({
    active: true,
    colors: false,
    columns: ['roundTimes', 'totalTime', '_round', '_score', '_map'],
  }, (cfg) => {
    document.getElementById('active').checked = cfg.active;
    document.getElementById('colors').checked = cfg.colors;
    columns = cfg.columns;
    loadColumns();
  });
};

const saved = () => {
  const btn = document.getElementById('save');
  btn.textContent = 'Saved!';
  setTimeout(() => { btn.textContent = 'Save'; }, 1000);

  loadSettings();
};

const reset = () => {
  const btn = document.getElementById('reset');
  btn.textContent = 'Reset!';
  setTimeout(() => { btn.textContent = 'Reset'; }, 1000);

  loadSettings();
};

document.addEventListener('DOMContentLoaded', () => loadSettings());

document.getElementById('save')
  .addEventListener('click', () => {
    const active = document.getElementById('active').checked;
    const colors =  document.getElementById('colors').checked;
    bsr.storage.sync.set({
      active,
      colors,
      columns,
    }, () => { saved(); });
  });

document.getElementById('reset')
  .addEventListener('click', () => {
    bsr.storage.sync.clear(() => { reset(); });
  });

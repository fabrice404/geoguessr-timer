const bsr = chrome != null ? chrome : browser;
let columns = [];

const decamelize = (str) => str
  .replace('_', '')
  .replace(/([a-z\d])([A-Z])/g, '$1 $2')
  .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1 $2')
  .toUpperCase();


const load = () => {
  bsr.storage.sync.get({
    active: true,
    colors: false,
    columns: ['roundTimes', 'totalTime', '_round', '_score', '_map'],
  }, (cfg) => {
    document.getElementById('active').checked = cfg.active;
    document.getElementById('colors').checked = cfg.colors;
    columns = cfg.columns;
    loadColumns(); // eslint-disable-line no-use-before-define
  });
};

const save = (obj, callback = null) => {
  bsr.storage.sync.set(obj, () => {
    if (callback != null) {
      callback();
    }
  });
};

const reset = () => {
  bsr.storage.sync.clear(() => { load(); });
};


const moveLeft = (key) => {
  if (!key.startsWith('_')) {
    const oldIndex = columns.indexOf(key);
    const newIndex = oldIndex - 1;
    if (newIndex >= 0) {
      columns[oldIndex] = columns[newIndex];
      columns[newIndex] = key;
    }
  }
  save({ columns }, () => { loadColumns(); }); // eslint-disable-line no-use-before-define
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
  save({ columns }, () => { loadColumns(); }); // eslint-disable-line no-use-before-define
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

document.addEventListener('DOMContentLoaded', () => load());

document.getElementById('active')
  .addEventListener('change', () => {
    const active = document.getElementById('active').checked;
    save({ active });
  });

document.getElementById('colors')
  .addEventListener('change', () => {
    const colors = document.getElementById('colors').checked;
    save({ colors });
  });

document.getElementById('reset')
  .addEventListener('click', (event) => {
    event.preventDefault();
    if (window.confirm('Do you really want to erase your settings and best times?')) { // eslint-disable-line no-alert
      reset();
    }
  });

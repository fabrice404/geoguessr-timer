const bsr = chrome != null ? chrome : browser;
let columns = [];

const debug = (text) => {
  document.getElementById('debug').textContent += text + ' ';
};

const decamelize = (str) => {
  return str
    .replace('_', '')
    .replace(/([a-z\d])([A-Z])/g, '$1' + ' ' + '$2')
    .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1' + ' ' + '$2')
    .toUpperCase();
}

const loadColumns = () => {
  const container = document.getElementById('columns');
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  for (let i = 0; i < columns.length; i++) {
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
        left.addEventListener('click', () => { moveLeft(key) });
        left.innerHTML = '&larr;';
        li.appendChild(left);
      }

      if (i < columns.length - 1) {
        // right button
        const right = document.createElement('button');
        right.addEventListener('click', () => { moveRight(key) });
        right.innerHTML = '&rarr;';
        li.appendChild(right);
      }
    }

    container.appendChild(li);
  }
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
  loadColumns();
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
  loadColumns();
};

const loadSettings = () => {
  bsr.storage.sync.get({
    active: true,
    columns: ['roundTimes', 'totalTime', '_round', '_score', '_map'],
  }, (cfg) => {
    document.getElementById('active').checked = cfg.active;
    columns = cfg.columns;
    loadColumns();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
});

document.getElementById('save')
  .addEventListener('click', () => {
    const active = document.getElementById('active').checked;
    bsr.storage.sync.set({
      active,
      columns,
    }, () => {
      const save = document.getElementById('save');
      save.textContent = 'Saved!';
      loadSettings();
      setTimeout(() => {
        save.textContent = 'Save';
      }, 1000);
    });
  });

document.getElementById('reset')
  .addEventListener('click', () => {
    bsr.storage.sync.clear(() => {
      const clear = document.getElementById('reset');
      clear.textContent = 'Reset!';
      loadSettings();
      setTimeout(() => {
        clear.textContent = 'Reset';
      }, 1000);
    });
  });

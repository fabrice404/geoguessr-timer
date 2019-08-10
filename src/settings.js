const bsr = chrome != null ? chrome : browser;

document.addEventListener('DOMContentLoaded', () => {
  bsr.storage.sync.get({
    active: true,
  }, (cfg) => {
    document.getElementById('active').checked = cfg.active;
  });
});

document.getElementById('save')
  .addEventListener('click', () => {
    const active = document.getElementById('active').checked;
    bsr.storage.sync.set({
      active,
    }, () => {
      const save = document.getElementById('save');
      save.textContent = 'Saved!';
      setTimeout(() => {
        save.textContent = 'Save';
      }, 1000);
    });
  });

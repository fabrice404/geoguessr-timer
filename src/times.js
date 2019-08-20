const bsr = chrome != null ? chrome : browser;

const load = () => {
  bsr.storage.sync.get({
    savegame: {},
  }, ({ savegame }) => {
    Object.keys(savegame).forEach((key) => {
      const map = { map: key, ...savegame[key] };
      console.log({ map });
    });
  });
};

document.addEventListener('DOMContentLoaded', () => load());

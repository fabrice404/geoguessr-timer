const bsr = chrome != null ? chrome : browser;
let savegame = {};

/**
 * Converts a number of milliseconds to time HH:mm:ss(.ms)
 */
const msToTime = (ms) => {
  let seconds = Math.round(ms / 1000);

  const hours = parseInt(seconds / 3600, 10);
  seconds %= 3600;

  const minutes = parseInt(seconds / 60, 10);
  seconds %= 60;

  let result = '';
  if (hours > 0) {
    result = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${Math.round(ms % 1000).toString().padEnd(3, '0')}`;
  } else {
    result = `${minutes}:${seconds.toString().padStart(2, '0')}.${Math.round(ms % 1000).toString().padEnd(3, '0')}`;
  }

  return result;
};

const load = () => {
  bsr.storage.sync.get({
    savegame: {},
  }, (config) => {
    const content = document.getElementsByClassName('times')[0];
    savegame = config.savegame;
    Object.keys(savegame)
      .sort()
      .forEach((map) => {
        const times = { ...savegame[map] };

        // create row
        const row = document.createElement('div');
        row.setAttribute('class', 'row');

        // create label
        const label = document.createElement('span');
        label.setAttribute('class', 'label');
        label.textContent = `${map}: ${msToTime(times.personalBest)}`;
        row.append(label);

        // create pb table
        const table = document.createElement('table');
        table.setAttribute('class', 'table');
        row.append(table);

        // create table rows
        const tr1 = document.createElement('tr');
        const tr2 = document.createElement('tr');
        const tr3 = document.createElement('tr');
        table.append(tr1);
        table.append(tr2);
        table.append(tr3);


        // create rows headers
        const rh = document.createElement('th');
        const rd1 = document.createElement('th');
        const rd2 = document.createElement('th');
        rd1.textContent = 'Personal best splits';
        rd2.textContent = 'Best segments';
        tr1.append(rh);
        tr2.append(rd1);
        tr3.append(rd2);

        // create table cells
        for (let i = 1; i <= 5; i += 1) {
          const th = document.createElement('th');
          const td1 = document.createElement('td');
          const td2 = document.createElement('td');
          th.textContent = `Round ${i}`;
          td1.textContent = msToTime(times.personalBestSplits[i]);
          td2.textContent = msToTime(times.bestSegments[i]);
          tr1.append(th);
          tr2.append(td1);
          tr3.append(td2);
        }

        content.append(row);
      });
  });
};

const download = () => {
  const blob = new Blob([JSON.stringify(savegame, null, 2)], { type: 'text/json' });
  const url = URL.createObjectURL(blob);
  const div = document.createElement('div');
  const a = document.createElement('a');
  document.body.appendChild(div);
  div.appendChild(a);

  a.innerHTML = '&nbsp;';
  div.style.width = '0';
  div.style.height = '0';
  a.href = url;
  a.download = 'GeoGuessr-timer.save';

  const event = new MouseEvent('click', {});
  a.dispatchEvent(event);
  document.body.removeChild(div);
};

const openFile = () => {
  document.getElementById('import-file').click();
};

const importFile = (event) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    bsr.storage.sync.set({
      savegame: JSON.parse(e.target.result),
    }, () => { load(); });
  };
  reader.readAsText(event.target.files[0]);
};

document.addEventListener('DOMContentLoaded', () => load());
document.getElementById('export').addEventListener('click', () => { download(); });
document.getElementById('import').addEventListener('click', () => { openFile(); });
document.getElementById('import-file').addEventListener('change', (event) => { importFile(event); });

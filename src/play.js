const TICK_INTERVAL = 1000;
const bsr = chrome != null ? chrome : browser;

let totalDate = null;
const rounds = {
  1: { begin: null, end: null },
  2: { begin: null, end: null },
  3: { begin: null, end: null },
  4: { begin: null, end: null },
  5: { begin: null, end: null },
};
let currentRound = 0;
let uiRound = '';

const msToHHMMss = (ms) => {
  let seconds = Math.round(ms / 1000);

  const hours = parseInt(seconds / 3600, 10);
  seconds %= 3600;

  const minutes = parseInt(seconds / 60, 10);
  seconds %= 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

const init = (cfg) => {
  // calculate new columns positions
  let totalPosition = cfg.columns.indexOf('totalTime');
  let roundsPosition = cfg.columns.indexOf('roundTimes');

  const gameInfo = document.getElementsByClassName('game-info')[0];

  // create new node
  const totalNode = document.createElement('article');
  totalNode.setAttribute('class', 'game-info__section game-info__section--timer-total');
  totalNode.innerHTML = '<span class="game-info__label">Total time</span><span class="game-info__value" id="timer-total">--:--</span>';
  // rounds are inserted after total
  if (roundsPosition < totalPosition) {
    totalPosition -= 1;
  }
  if (gameInfo.children.length <= totalPosition) {
    gameInfo.append(totalNode);
  }
  else {
    gameInfo.insertBefore(totalNode, gameInfo.children[totalPosition]);
  }

  for (let i = 1; i <= 5; i += 1) {
    const roundNode = document.createElement('article');
    roundNode.setAttribute('class', `game-info__section game-info__section--timer-round-${i}`);
    roundNode.innerHTML = `<span class="game-info__label">Round ${i}</span><span class="game-info__value" id="timer-round-${i}">--:--</span>`;
    if (gameInfo.children.length <= roundsPosition) {
      gameInfo.append(roundNode);
    }
    else {
      gameInfo.insertBefore(roundNode, gameInfo.children[roundsPosition]);
    }
    roundsPosition += 1;
  }
};

const newRound = () => {
  const now = new Date();
  if (totalDate == null) {
    totalDate = now;
  }
  if (rounds[currentRound] != null) {
    rounds[currentRound].end = now;
    const roundTime = msToHHMMss(now - rounds[currentRound].begin);
    document.getElementById(`timer-round-${currentRound}`).innerText = roundTime;
  }
  currentRound += 1;
  if (rounds[currentRound] != null) {
    rounds[currentRound].begin = now;
  }
};

const showTimes = () => {
  const now = new Date();
  const totalTime = msToHHMMss(now - totalDate);

  const score = document.getElementsByClassName('score__progress__points')[0];
  let content = score.innerHTML;
  content += ` and your total time was <b>${totalTime}</b><br>`;
  content += Object.keys(rounds)
    .map((key) => {
      const roundTime = msToHHMMss(rounds[key].end - rounds[key].begin);
      return `Round ${key}: ${roundTime}`;
    })
    .join(' | ');
  score.innerHTML = content;
};

const tick = () => {
  const nodeRoundText = document.getElementsByClassName('game-info__section--round')[0].innerText;
  if (nodeRoundText !== uiRound) {
    newRound();
    uiRound = nodeRoundText;
  }

  if (document.getElementsByClassName('score__final').length > 0) {
    newRound();
    showTimes();
  } else {
    const now = new Date();

    const totalTime = msToHHMMss(now - totalDate);
    document.getElementById('timer-total').innerText = totalTime;

    const roundTime = msToHHMMss(now - rounds[currentRound].begin);
    document.getElementById(`timer-round-${currentRound}`).innerText = roundTime;

    setTimeout(tick, TICK_INTERVAL);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  bsr.storage.sync.get({
    active: true,
    columns: ['roundTimes', 'totalTime', '_round', '_score', '_map'],
  }, (cfg) => {
    if (cfg.active) {
      init(cfg);
      tick();
    }
  });
});

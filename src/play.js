const TICK_INTERVAL = 1000;
const bsr = chrome != null ? chrome : browser;

let currentRound = 0;
const roundsTime = {
  1: { begin: null, end: null },
  2: { begin: null, end: null },
  3: { begin: null, end: null },
  4: { begin: null, end: null },
  5: { begin: null, end: null },
};

/**
 * Converts a number of milliseconds to time HH:mm:ss(.ms)
 */
const msToTime = (ms, showMs = false) => {
  let seconds = Math.round(ms / 1000);

  const hours = parseInt(seconds / 3600, 10);
  seconds %= 3600;

  const minutes = parseInt(seconds / 60, 10);
  seconds %= 60;

  let result = '';
  if (hours > 0) {
    result += `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    result += `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  if (showMs) {
    result += `.${Math.round(ms % 1000).toString().padEnd(3, '0')}`;
  }
  return result;
};

/**
 * Adds the timers in the UI
 * @param {*} config
 */
const init = (config) => {
  // calculate new columns positions
  let totalPosition = config.columns.indexOf('totalTime');
  let roundsPosition = config.columns.indexOf('roundTimes');

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
  } else {
    gameInfo.insertBefore(totalNode, gameInfo.children[totalPosition]);
  }

  for (let i = 1; i <= 5; i += 1) {
    const roundNode = document.createElement('article');
    roundNode.setAttribute('class', `game-info__section game-info__section--timer-round-${i}`);
    roundNode.innerHTML = `<span class="game-info__label">Round ${i}</span><span class="game-info__value" id="timer-round-${i}">--:--</span>`;
    if (gameInfo.children.length <= roundsPosition) {
      gameInfo.append(roundNode);
    } else {
      gameInfo.insertBefore(roundNode, gameInfo.children[roundsPosition]);
    }
    roundsPosition += 1;
  }
};

/**
 * Show result in final score
 */
const showFinalTimes = () => {
  const totalTime = msToTime(roundsTime['5'].end - roundsTime['1'].begin);
  let totalSum = 0;
  const score = document.getElementsByClassName('score__progress__points')[0];

  const rounds = Object.keys(roundsTime)
    .map((key) => {
      const roundTime = msToTime(roundsTime[key].end - roundsTime[key].begin, true);
      totalSum += (roundsTime[key].end - roundsTime[key].begin);
      return `<td>${roundTime}</td>`;
    })
    .join('');

  score.innerHTML = `${score.innerHTML}, 
    your total time was <b>${totalTime}</b>, 
    and the sum of round was <b>${msToTime(totalSum, true)}</b>
    <br/><br/>
    <center>
      <table cellpadding=5 cellspacing=0 border=1>
        <tbody>
          <tr><td>Round 1</td><td>Round 2</td><td>Round 3</td><td>Round 4</td><td>Round 5</td></tr>
          <tr>${rounds}</tr>
        </tbody>
      </table>
    </center>
    <br/>`;
};

/**
 * Starts a new round timer
 */
const startRound = () => {
  const now = new Date();
  currentRound += 1;
  if (currentRound > 0 && currentRound <= 5) {
    roundsTime[currentRound.toString()].begin = now;
    console.log(`Round ${currentRound} > ${now.toISOString()}`);
  }
};

/**
 * Ends the current round timer
 */
const stopRound = () => {
  const now = new Date();
  if (currentRound > 0 && currentRound <= 5) {
    roundsTime[currentRound.toString()].end = now;
    const roundTimeAccurate = msToTime(
      roundsTime[currentRound.toString()].end - roundsTime[currentRound.toString()].begin,
      true,
    );
    document.getElementById(`timer-round-${currentRound}`).innerText = roundTimeAccurate;
    console.log(`Round ${currentRound} < ${now.toISOString()}`);
    console.log(`Round ${currentRound} finished in ${roundTimeAccurate}`);
  }
};

/**
 * Recursive function that updates the UI
 */
const tick = () => {
  if (document.getElementsByClassName('score__final').length > 0) {
    showFinalTimes();
  } else {
    if (currentRound > 0 && currentRound <= 5) {
      const now = new Date();

      const totalTime = msToTime(now - roundsTime['1'].begin);
      document.getElementById('timer-total').innerText = totalTime;

      if (roundsTime[currentRound.toString()].end == null) {
        const roundTime = msToTime(now - roundsTime[currentRound.toString()].begin);
        document.getElementById(`timer-round-${currentRound}`).innerText = roundTime;
      }
    }
    setTimeout(tick, TICK_INTERVAL);
  }
};

/**
 * Load extension config, add observers to start/stop timers,
 * and starts the timer if no modal is shown
 * @param {*} config
 */
const loadConfig = (config) => {
  if (config.active) {
    init(config);

    const observer = new MutationObserver((mutations) => {
      const added = mutations[0].addedNodes.length;
      const removed = mutations[0].removedNodes.length;
      if (added > removed) {
        stopRound();
      } else if (removed > added) {
        startRound();
      }
    });
    const observerOptions = { childList: true, subtree: false };
    observer.observe(document.getElementById('js__checkpoint-modal').childNodes[0], observerOptions);
    observer.observe(document.getElementById('js__accept-challenge-modal').childNodes[0], observerOptions);
    observer.observe(document.getElementById('js__score').childNodes[0].childNodes[2], observerOptions);

    if (
      document.getElementById('js__checkpoint-modal').textContent.trim() === ''
      && document.getElementById('js__accept-challenge-modal').textContent.trim() === ''
    ) {
      startRound();
    }

    tick();
  }
};

/**
 * Load config from local storage when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
  bsr.storage.sync.get({
    active: true,
    columns: ['roundTimes', 'totalTime', '_round', '_score', '_map'],
  }, (config) => { loadConfig(config); });
});

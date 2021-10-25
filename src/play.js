const TICK_INTERVAL = 1000;
const bsr = chrome != null ? chrome : browser;

let config;
let currentMap;
let currentRound = 0;
let isCountryStreak;
const roundsTime = {
  1: { begin: null, end: null },
  2: { begin: null, end: null },
  3: { begin: null, end: null },
  4: { begin: null, end: null },
  5: { begin: null, end: null },
};
const streakTime = {
  startTime: null,
  roundTime: null,
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
 * Save in local storage
 */
const save = () => {
  let finalTime = 0;
  const finalTimes = {};
  for (let i = 1; i <= 5; i += 1) {
    const roundTime = roundsTime[i].end - roundsTime[i].begin;
    finalTime += roundTime;
    finalTimes[i] = roundTime;
  }

  if (config.savegame == null) {
    config.savegame = {};
  }
  if (config.savegame[currentMap] == null) {
    console.log(`New save for map: ${currentMap}`);
    config.savegame[currentMap] = {
      personalBest: finalTime,
      personalBestSplits: {},
      bestSegments: {},
    };
    for (let i = 1; i <= 5; i += 1) {
      config.savegame[currentMap].personalBestSplits[i] = finalTimes[i];
      config.savegame[currentMap].bestSegments[i] = finalTimes[i];
    }
  } else {
    let newRecord = false;
    if (config.savegame[currentMap].personalBest > finalTime) {
      newRecord = true;
    }
    for (let i = 1; i <= 5; i += 1) {
      if (config.savegame[currentMap].bestSegments[i] > finalTimes[i]) {
        newRecord = true;
      }
    }

    if (newRecord && window.confirm('You have beaten one of you best times, do you want to save it?')) {
      if (config.savegame[currentMap].personalBest > finalTime) {
        console.log('New personal best!');
        config.savegame[currentMap].personalBest = finalTime;
        for (let i = 1; i <= 5; i += 1) {
          config.savegame[currentMap].personalBestSplits[i] = finalTimes[i];
        }
      }
      for (let i = 1; i <= 5; i += 1) {
        if (config.savegame[currentMap].bestSegments[i] > finalTimes[i]) {
          console.log(`New best split on round ${i}!`);
          config.savegame[currentMap].bestSegments[i] = finalTimes[i];
        }
      }
    }
  }
  bsr.storage.sync.set(config, null);
};

const detectCountryStreak = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (roundNode) {
    isCountryStreak = roundNode.children[0].textContent.trim().toLowerCase() === 'streak';
    console.log({ isCountryStreak });
  }
};

/**
 * Reset all times
 */
const resetGame = () => {
  if (isCountryStreak != null || currentRound !== 0) {
    console.log('reset game');
    isCountryStreak = null;
    currentMap = null;
    currentRound = 0;
    roundsTime[1] = { begin: null, end: null };
    roundsTime[2] = { begin: null, end: null };
    roundsTime[3] = { begin: null, end: null };
    roundsTime[4] = { begin: null, end: null };
    roundsTime[5] = { begin: null, end: null };
    streakTime.startTime = null;
    streakTime.roundTime = null;
  }
};

/**
 * Show times in summary view
 */
const showFinalTimes = () => {
  let totalRoundsTime = 0;
  const headers = [];
  const times = [];

  for (let i = 1; i <= 5; i += 1) {
    const key = `${i}`;
    totalRoundsTime += (roundsTime[key].end - roundsTime[key].begin);
    headers.push(`Round ${i}`);
    times.push(msToTime(roundsTime[key].end - roundsTime[key].begin, true));
  }
  console.log({ times });
  const scoreBarLabel = document.querySelector('div[class^="standard-final-result_progressBar"]');
  scoreBarLabel.innerHTML = `${scoreBarLabel.innerHTML}
    <div style="font-size: var(--font-size-12); color: var(--ds-color-white); margin-top: 1em;">
      Your total time was <b style="font-size: var(--font-size-14); color: var(--ds-color-yellow-50);">${msToTime(roundsTime['5'].end - roundsTime['1'].begin, true)}</b>,
      and the sum of rounds was <b style="font-size: var(--font-size-14); color: var(--ds-color-yellow-50);">${msToTime(totalRoundsTime, true)}</b>
      <br/>
      <center>
        <table cellpadding=5 cellspacing=0 border=1 style="font-size: var(--font-size-12); color: var(--ds-color-white); margin-top: 0.5em;">
          <tbody>
            <tr><td>${headers.join('</td><td>')}</td></tr>
            <tr><td>${times.join('</td><td>')}</td></tr>
          </tbody>
        </table>
      </center>
    </div>
  `;
  save();
  resetGame();
};

/**
 * Update round node time
 * @param {*} round
 * @param {*} time
 */
const setRoundTime = (round, time) => {
  document.querySelector(`#round${round}-time`).textContent = time;
};

/**
 * Update round node color
 * @param {*} round
 * @param {*} color
 */
const setRoundColor = (round, color) => {
  document.querySelector(`#round${round}-time`).style.color = color;
};

/**
 * Update total time node
 * @param {*} time
 */
const setTotalTime = (time) => {
  document.querySelector('#total-time').innerText = time;
};

/**
 * Update total time color
 * @param {*} color
 */
const setTotalColor = (color) => {
  document.querySelector('#total-time').style.color = color;
};

const getCurrentRound = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  return parseInt(roundNode.children[1].textContent.split(/\//gi)[0].trim(), 10);
};

/**
 * Create time nodes in game status bar
 */
const createTimeNodes = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (!roundNode) {
    return null;
  }
  const totalTimeNode = document.querySelector('#total-time');
  if (!totalTimeNode) {
    if (config.rounds) {
      for (let i = 1; i <= 5; i += 1) {
        const rNode = document.createElement('div');
        rNode.className = roundNode.getAttribute('class');
        rNode.innerHTML = `<div class="${roundNode.children[0].getAttribute('class')}">Round ${i}</div><div id="round${i}-time" class="${roundNode.children[1].getAttribute('class')}">--:--</div>`;
        roundNode.parentNode.append(rNode);
      }
    }
    const tNode = document.createElement('div');
    tNode.className = roundNode.getAttribute('class');
    tNode.innerHTML = `<div class="${roundNode.children[0].getAttribute('class')}">Total</div><div id="total-time" class="${roundNode.children[1].getAttribute('class')}">--:--</div>`;
    roundNode.parentNode.append(tNode);
  }
  return null;
};

const createStreakNodes = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (!roundNode) {
    return null;
  }
  const totalTimeNode = document.querySelector('#total-time');
  if (!totalTimeNode) {
    const rNode = document.createElement('div');
    rNode.className = roundNode.getAttribute('class');
    rNode.innerHTML = `<div class="${roundNode.children[0].getAttribute('class')}">Round</div><div id="round1-time" class="${roundNode.children[1].getAttribute('class')}">--:--</div>`;
    roundNode.parentNode.append(rNode);

    const tNode = document.createElement('div');
    tNode.className = roundNode.getAttribute('class');
    tNode.innerHTML = `<div class="${roundNode.children[0].getAttribute('class')}">Total</div><div id="total-time" class="${roundNode.children[1].getAttribute('class')}">--:--</div>`;
    roundNode.parentNode.append(tNode);
  }
  return null;
};

/**
 * Starts a new round timer
 */
const startRound = () => {
  console.log('start round');
  const now = new Date();
  if (isCountryStreak == null) {
    detectCountryStreak();
  }

  if (isCountryStreak) {
    if (streakTime.roundTime == null) {
      if (streakTime.startTime == null) {
        streakTime.startTime = now;
      }
      streakTime.roundTime = now;
      console.log(`Streak round > ${now.toISOString()}`);
    }
  } else {
    currentRound += 1;
    if (currentRound > 0 && currentRound <= 5) {
      if (roundsTime[currentRound].begin == null) {
        roundsTime[currentRound].begin = now;
        console.log(`Round ${currentRound} > ${now.toISOString()}`);
      }
    }
  }
};

/**
 * Ends the current round timer
 */
const stopRound = () => {
  const now = new Date();
  if (isCountryStreak) {
    if (streakTime.roundTime != null) {
      streakTime.roundTime = null;
    }
  } else if (currentRound > 0 && currentRound <= 5) {
    if (roundsTime[currentRound].end == null) {
      roundsTime[currentRound].end = now;
      const roundTimeMs = roundsTime[currentRound].end - roundsTime[currentRound].begin;
      const roundTime = msToTime(roundTimeMs, false);
      const roundTimeAccurate = msToTime(roundTimeMs);
      setRoundTime(currentRound, roundTime);
      if (config.savegame[currentMap] != null && config.colors) {
        let color = config.savegame[currentMap].personalBestSplits[currentRound] > roundTimeMs ? 'green' : 'red';
        if (config.savegame[currentMap].bestSegments[currentRound] > roundTimeMs) {
          color = 'gold';
        }
        setRoundColor(currentRound, color);
      }
      console.log(`Round ${currentRound} < ${now.toISOString()}`);
      console.log(`Round ${currentRound} finished in ${roundTimeAccurate}`);
    }
  }
};

const tick = () => {
  const now = new Date();
  if (document.querySelector('.game-layout')) {
    if (isCountryStreak == null) {
      detectCountryStreak();
    }
    if (isCountryStreak) {
      let totalTimeNode = document.querySelector('#total-time');
      if (totalTimeNode == null) {
        totalTimeNode = createStreakNodes();
      }
      if (streakTime.startTime == null) {
        startRound();
      }
      setTotalTime(msToTime(now - streakTime.startTime));
      setRoundTime(1, msToTime(now - streakTime.roundTime));
    } else if (currentRound > 0 && currentRound <= 5) {
      // get the current map
      if (currentMap == null) {
        const mapNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="map-name"]');
        if (mapNode) {
          currentMap = mapNode.children[1].textContent.trim();
          console.log({ currentMap });
        }
      }

      let totalTimeNode = document.querySelector('#total-time');
      if (totalTimeNode == null) {
        totalTimeNode = createTimeNodes();
      }

      let totalTimeMs = 0;
      for (let i = 1; i < currentRound; i += 1) {
        totalTimeMs += (roundsTime[i].end - roundsTime[i].begin);
      }
      totalTimeMs += (now - roundsTime[currentRound].begin);
      setTotalTime(msToTime(totalTimeMs));
      if (config.colors && config.savegame[currentMap]) {
        let totalTimePB = 0;
        for (let i = 1; i <= currentRound; i += 1) {
          totalTimePB += config.savegame[currentMap].personalBestSplits[i];
        }
        setTotalColor(totalTimePB > totalTimeMs ? 'green' : 'red');
      }

      if (config.rounds) {
        const roundTimeMs = now - roundsTime[currentRound].begin;
        if (roundsTime[currentRound].end == null) {
          setRoundTime(currentRound, msToTime(roundTimeMs));
          if (config.colors && config.savegame[currentMap]) {
            setRoundColor(currentRound, config.savegame[currentMap].personalBestSplits[currentRound] > roundTimeMs ? 'green' : 'red');
          }
        }
      }
    }
    if (currentRound === 5 && document.querySelector('a[data-qa="play-same-map"]')) {
      showFinalTimes();
    }
  } else {
    resetGame();
  }
  setTimeout(tick, TICK_INTERVAL);
};

const init = () => {
  if (config.active) {
    const observer = new MutationObserver(() => {
      const gameLayout = document.querySelector('.game-layout');
      const resultLayout = document.querySelector('div[class^="result-layout_root"]');

      if (gameLayout) {
        if (resultLayout) {
          stopRound();
        } else if (currentRound !== getCurrentRound()) {
          startRound();
        }
      }
    });

    observer.observe(document.querySelector('#__next'), { subtree: true, childList: true });
    tick();
  }
};

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    bsr.storage.sync.get({
      active: true,
      rounds: true,
      colors: false,
      savegame: {},
    }, (cfg) => {
      config = cfg;
      init();
    });
  }
};

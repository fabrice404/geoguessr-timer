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
  const gameStatusMap = Array.from(document.querySelectorAll('.game-status'))
    .find((e) => e.hasAttribute('data-qa') && e.getAttribute('data-qa') === 'round-number');
  if (gameStatusMap) {
    isCountryStreak = gameStatusMap.querySelector('.game-status__heading').textContent.trim() === 'Streak';
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

  const scoreBarLabel = document.querySelector('.score-bar__label');
  scoreBarLabel.innerHTML = `${scoreBarLabel.innerHTML}
    Your total time was <b>${msToTime(roundsTime['5'].end - roundsTime['1'].begin)}</b>,
    and the sum of rounds was <b>${msToTime(totalRoundsTime, true)}</b>
    <br/><br/>
    <center>
      <table cellpadding=5 cellspacing=0 border=1>
        <tbody>
          <tr><td>${headers.join('</td><td>')}</td></tr>
          <tr><td>${times.join('</td><td>')}</td></tr>
        </tbody>
      </table>
    </center>
    <br/>
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
  document.querySelector(`.game-status__round${round}-time .game-status__body`).innerText = time;
};

/**
 * Update round node color
 * @param {*} round
 * @param {*} color
 */
const setRoundColor = (round, color) => {
  document.querySelector(`.game-status__round${round}-time .game-status__body`).style.color = color;
};

/**
 * Update total time node
 * @param {*} time
 */
const setTotalTime = (time) => {
  document.querySelector('.game-status__total-time .game-status__body').innerText = time;
};

/**
 * Update total time color
 * @param {*} color
 */
const setTotalColor = (color) => {
  document.querySelector('.game-status__total-time .game-status__body').style.color = color;
};

/**
 * Create time nodes in game status bar
 */
const createTimeNodes = () => {
  const gameStatuses = document.querySelector('.game-statuses');
  if (!gameStatuses) {
    return null;
  }

  const totalNode = document.createElement('div');
  totalNode.className = 'game-status game-status__total-time';
  totalNode.innerHTML = '<div class="game-status__heading">Total time</div><div class="game-status__body">--:--</div></div>';
  gameStatuses.prepend(totalNode);

  if (config.rounds) {
    for (let i = 5; i > 0; i -= 1) {
      const roundNode = document.createElement('div');
      roundNode.className = `game-status game-status__round${i}-time`;
      roundNode.innerHTML = `<div class="game-status__heading">Round ${i}</div><div class="game-status__body">--:--</div></div>`;
      gameStatuses.prepend(roundNode);
    }
  }

  return document.querySelector('.game-status__total-time');
};

const createStreakNodes = () => {
  const gameStatuses = document.querySelector('.game-statuses');
  if (!gameStatuses) {
    return null;
  }

  const totalNode = document.createElement('div');
  totalNode.className = 'game-status game-status__total-time';
  totalNode.innerHTML = '<div class="game-status__heading">Total time</div><div class="game-status__body">--:--</div></div>';
  gameStatuses.prepend(totalNode);

  const i = 1;
  const roundNode = document.createElement('div');
  roundNode.className = `game-status game-status__round${i}-time`;
  roundNode.innerHTML = '<div class="game-status__heading">Round time</div><div class="game-status__body">--:--</div></div>';
  gameStatuses.prepend(roundNode);

  return document.querySelector('.game-status__total-time');
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
    if (streakTime.startTime == null) {
      streakTime.startTime = now;
    }
    streakTime.roundTime = now;
  } else {
    currentRound += 1;
    if (currentRound > 0 && currentRound <= 5) {
      roundsTime[currentRound].begin = now;
      console.log(`Round ${currentRound} > ${now.toISOString()}`);
    }
  }
};

/**
 * Ends the current round timer
 */
const stopRound = () => {
  const now = new Date();
  if (isCountryStreak) {
    streakTime.roundTime = now;
  } else if (currentRound > 0 && currentRound <= 5) {
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
};

const tick = () => {
  const now = new Date();
  if (document.querySelector('.game-status')) {
    if (isCountryStreak == null) {
      detectCountryStreak();
    }
    if (isCountryStreak) {
      let totalTimeNode = document.querySelector('.game-status__total-time');
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
        const gameStatusMap = Array.from(document.querySelectorAll('.game-status'))
          .find((e) => e.hasAttribute('data-qa') && e.getAttribute('data-qa') === 'map-name');
        if (gameStatusMap) {
          currentMap = gameStatusMap.querySelector('.game-status__body').innerText;
        }
      }

      let totalTimeNode = document.querySelector('.game-status__total-time');
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
    if (currentRound === 5
      && document.querySelector('.result .button--primary')
      && document.querySelector('.result .button--primary').getAttribute('data-qa') === 'play-same-map'
    ) {
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
      console.log('observed');
      const gameLayout = document.querySelector('.game-layout');
      const result = document.querySelector('.result');

      if (gameLayout) {
        if (result) {
          stopRound();
        } else {
          startRound();
        }
      }
    });

    observer.observe(document.querySelector('.layout__main'), { childList: true, subtree: false });
    tick();
  }
};

document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    bsr.storage.sync.get({
      active: true,
      rounds: true,
      colors: false,
      columns: ['roundTimes', 'totalTime', '_map', '_round', '_score'],
      savegame: {},
    }, (cfg) => {
      config = cfg;
      init();
    });
  }
};

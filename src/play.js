const TICK_INTERVAL = 1000;
const bsr = chrome != null ? chrome : browser;

let config;
let currentMap;
let currentRound = 0;
let isStreak;
let inGame = false;
let roundRunning = false;
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
  totalTime: null,
  roundTimes: [],
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

const detectStreak = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (roundNode) {
    isStreak = false;
    if (roundNode.querySelector('div[class^="status_streaksValue"]')) {
      isStreak = true;
    }
    // console.log({ isStreak });
  }
};

/**
 * Reset all times
 */
const resetGame = () => {
  if (isStreak != null || currentRound !== 0) {
    console.log('reset game');
    inGame = false;
    isStreak = null;
    currentMap = null;
    currentRound = 0;
    roundRunning = false;
    roundsTime[1] = { begin: null, end: null };
    roundsTime[2] = { begin: null, end: null };
    roundsTime[3] = { begin: null, end: null };
    roundsTime[4] = { begin: null, end: null };
    roundsTime[5] = { begin: null, end: null };
    streakTime.startTime = null;
    streakTime.roundTime = null;
    for (let i = 1; i <= 5; i += 1) {
      const rndNode = document.querySelector(`#round${i}-time`);
      if (rndNode) {
        rndNode.textContent = '--:--';
      }
    }
  }
};

/**
 * Show times in streak summary view
 */
const streakSummary = () => {
  if (streakTime.totalTime == null) return;

  const titleNode = document.querySelector('h2[class^="streak-final-result_title"]');
  let timeNode = document.createElement('h2');
  timeNode.textContent = `The total game time was ${streakTime.totalTime}`;
  timeNode.className = titleNode.className;
  titleNode.parentNode.insertBefore(timeNode, titleNode.nextSibling);

  const roundsList = document.querySelectorAll('li[class^="streak-result-list_listItem"]');
  for (let i = 0; i < roundsList.length; i += 1) {
    timeNode = document.createElement('div');
    timeNode.textContent = streakTime.roundTimes[i];
    timeNode.style.flexGrow = 1;
    timeNode.style.textAlign = 'right';
    roundsList[i].append(timeNode);
  }
};

const getMaxRounds = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (roundNode) {
    return parseInt(roundNode.children[1].textContent.split(/\//gi)[1].trim(), 10);
  }
  return 5; // kludge for daily challenge
};

/**
 * Create time nodes in game status bar
 */
const createTimeNodes = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (!roundNode) {
    return null;
  }
  let flexNode;
  if (getMaxRounds() === 1 || !config.rounds) {
    flexNode = roundNode.parentNode;
    flexNode.id = 'timernode';
  } else {
    flexNode = roundNode.parentNode.cloneNode(false);
    flexNode.id = 'timernode';
    flexNode.style.marginLeft = '1rem'; // a little space
  }

  roundNode.parentNode.parentNode.append(flexNode);

  const totalTimeNode = document.querySelector('#total-time');
  if (!totalTimeNode) {
    if (config.rounds) {
      for (let i = 1; i <= getMaxRounds(); i += 1) {
        const rNodeTitle = document.createElement('div');
        rNodeTitle.className = roundNode.children[0].getAttribute('class');
        rNodeTitle.textContent = `Round ${i}`;

        const rNodeTime = document.createElement('div');
        rNodeTime.id = `round${i}-time`;
        rNodeTime.className = roundNode.children[1].getAttribute('class');
        rNodeTime.textContent = '--:--';

        const rNode = document.createElement('div');
        rNode.className = roundNode.getAttribute('class');
        rNode.append(rNodeTitle);
        rNode.append(rNodeTime);
        flexNode.append(rNode);
        // Hide round 1 and show only total if this is a Quick Play.
        if (getMaxRounds() === 1) {
          rNode.style.visibility = 'hidden';
        }
      }
    }

    const tNodeTitle = document.createElement('div');
    tNodeTitle.className = roundNode.children[0].getAttribute('class');
    tNodeTitle.textContent = 'Total';

    const tNodeTime = document.createElement('div');
    tNodeTime.id = 'total-time';
    tNodeTime.className = roundNode.children[1].getAttribute('class');
    tNodeTime.textContent = '--:--';

    const tNode = document.createElement('div');
    tNode.className = roundNode.getAttribute('class');
    tNode.append(tNodeTitle);
    tNode.append(tNodeTime);
    flexNode.append(tNode);
  }
  return null;
};

/**
 * Update round node time
 * @param {*} round
 * @param {*} time
 */
const setRoundTime = (round, time) => {
  const rt = document.querySelector(`#round${round}-time`);
  if (rt) {
    rt.textContent = time;
  } else {
    createTimeNodes();
  }
};

/**
 * Update total time node
 * @param {*} time
 */
const setTotalTime = (time) => {
  const tt = document.querySelector('#total-time');
  if (tt) {
    tt.innerText = time;
  } else {
    createTimeNodes();
  }
};

const getCurrentRound = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (!roundNode) {
    return null;
  }
  detectStreak();
  if (!isStreak) {
    return parseInt(roundNode.children[1].textContent.split(/\//gi)[0].trim(), 10);
  }
  return parseInt(roundNode.children[0].textContent.trim(), 10);
};

const createStreakNodes = () => {
  const roundNode = document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]');
  if (!roundNode) {
    return null;
  }
  const totalTimeNode = document.querySelector('#total-time');
  if (!totalTimeNode) {
    const rNodeTitle = document.createElement('div');
    rNodeTitle.className = roundNode.children[0].getAttribute('class');
    rNodeTitle.textContent = 'Round';

    const rNodeTime = document.createElement('div');
    rNodeTime.id = 'round1-time';
    rNodeTime.className = roundNode.children[1].getAttribute('class');
    rNodeTime.textContent = '--:--';

    const rNode = document.createElement('div');
    rNode.className = roundNode.getAttribute('class');
    rNode.append(rNodeTitle);
    rNode.append(rNodeTime);
    roundNode.parentNode.append(rNode);

    const tNodeTitle = document.createElement('div');
    tNodeTitle.className = roundNode.children[0].getAttribute('class');
    tNodeTitle.textContent = 'Total';

    const tNodeTime = document.createElement('div');
    tNodeTime.id = 'total-time';
    tNodeTime.className = roundNode.children[1].getAttribute('class');
    tNodeTime.textContent = '--:--';

    const tNode = document.createElement('div');
    tNode.className = roundNode.getAttribute('class');
    tNode.append(tNodeTitle);
    tNode.append(tNodeTime);
    roundNode.parentNode.append(tNode);
  }
  return null;
};

/**
 * Starts a new round timer
 */
const startRound = () => {
  console.log('start round');
  inGame = true;
  roundRunning = true;
  const now = new Date();
  if (isStreak == null) {
    detectStreak();
  }

  if (isStreak) {
    if (streakTime.roundTime == null) {
      if (streakTime.startTime == null) {
        streakTime.startTime = now;
        streakTime.totalTime = null;
        streakTime.roundTimes = [];
      }
      streakTime.roundTime = now;
      console.log(`Streak round > ${now.toISOString()}`);
      currentRound = getCurrentRound();
    }
  } else {
    currentRound = getCurrentRound();
    if (currentRound > 0 && currentRound <= getMaxRounds()) {
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
  console.log('stop round');
  roundRunning = false;
  const now = new Date();
  if (isStreak) {
    if (streakTime.roundTime != null) {
      console.log(`Last round time was ${msToTime(now - streakTime.roundTime, false)}, Total streak time so far ${msToTime(now - streakTime.startTime, false)}`);
      streakTime.roundTimes.push(msToTime(now - streakTime.roundTime, false));
      streakTime.totalTime = msToTime(now - streakTime.startTime, false);
      streakTime.roundTime = null;
    }
  } else if (currentRound > 0 && currentRound <= getMaxRounds()) {
    if (roundsTime[currentRound].end == null) {
      roundsTime[currentRound].end = now;
      const roundTimeMs = roundsTime[currentRound].end - roundsTime[currentRound].begin;
      const roundTime = msToTime(roundTimeMs, false);
      const roundTimeAccurate = msToTime(roundTimeMs);
      setRoundTime(currentRound, roundTime);
      console.log(`Round ${currentRound} < ${now.toISOString()}`);
      console.log(`Round ${currentRound} finished in ${roundTimeAccurate}`);
    }
  }
};

const tick = () => {
  const now = new Date();
  if (document.querySelector('div[class^="game_status__"]')) {
    if (isStreak == null) {
      detectStreak();
    }
    if (isStreak) {
      let totalTimeNode = document.querySelector('#total-time');
      if (totalTimeNode == null) {
        totalTimeNode = createStreakNodes();
      }
      if (streakTime.startTime == null && document.querySelector('div[class^="status_inner__"]>div[data-qa="round-number"]')
        && !document.querySelector('button[data-qa="play-again-button"]')) {
        console.log(`starttime null, ${streakTime.startTime}`);
        startRound();
      }
      setTotalTime(msToTime(now - streakTime.startTime));
      if (streakTime.roundTime) {
        setRoundTime(1, msToTime(now - streakTime.roundTime));
      }
    } else if (currentRound > 0 && currentRound <= getMaxRounds()) {
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

      if (config.rounds) {
        const roundTimeMs = now - roundsTime[currentRound].begin;
        if (roundsTime[currentRound].end == null) {
          setRoundTime(currentRound, msToTime(roundTimeMs));
        }
      }
    } else {
      startRound();
    }
    if (inGame) {
      if (document.querySelector('button[data-qa="play-again-button"]')) {
        console.log('Play again button detected. Game Over.');
        resetGame();
      }
    }
    // if there are more than 1 title, streakSummary is already run.
    if (document.querySelectorAll('h2[class^="streak-final-result_title"]').length === 1) {
      streakSummary();
    }
  } else {
    resetGame();
  }
  setTimeout(tick, TICK_INTERVAL);
};

const init = () => {
  if (config.active) {
    const observer = new MutationObserver(() => {
      const gameStatus = document.querySelector('div[class^="game_status__"]');
      const resultLayout = document.querySelector('div[class^="result-layout_root"]');

      if (gameStatus) {
        if (resultLayout) {
          if (roundRunning) stopRound();
        } else if (currentRound !== getCurrentRound() && !roundRunning) {
          console.log(`startround from init ${currentRound} ${getCurrentRound()}`);
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
      savegame: {},
    }, (cfg) => {
      config = cfg;
      init();
    });
  }
};

let totalDate = null;
let roundDate = null;

const msToHHMMss = (ms) => {
  let seconds = Math.round(ms / 1000);

  let hours = parseInt(seconds / 3600);
  seconds = seconds % 3600;

  let minutes = parseInt(seconds / 60);
  seconds = seconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

const timer = () => {
  const now = new Date();
  const totalTime = msToHHMMss(now - totalDate);

  // create "totalTime" node if not exists
  let totalTimeNodes = document.getElementsByClassName('game-info__section--timer-total');
  if (totalTimeNodes.length === 0) {
    // create new "totalTime" node in DOM
    const newNode = document.createElement('article');
    newNode.setAttribute('class', 'game-info__section game-info__section--timer-total');

    // locate "round" node in DOM
    const roundNode = document.getElementsByClassName('game-info__section--round')[0];

    // add new "totalTime" node before "round" node
    roundNode.parentNode.insertBefore(newNode, roundNode.nextSibling);

    // select "totalTime" nodes to update
    totalTimeNodes = document.getElementsByClassName('game-info__section--timer-total');
  }
  const totalTimeNode = totalTimeNodes[0];
  totalTimeNode.innerHTML = `<span class="game-info__label">Total time</span>
  <span class="game-info__value">${totalTime}</span>`;

  const roundTime = msToHHMMss(now - roundDate);

  // create currentTime node if not exists
  let roundTimeNodes = document.getElementsByClassName('game-info__section--timer-round');
  if (roundTimeNodes.length === 0) {
    // create new "roundTime" node in DOM
    const newNode = document.createElement('article');
    newNode.setAttribute('class', 'game-info__section game-info__section--timer-round');

    // locate "round" node in DOM
    const roundNode = document.getElementsByClassName('game-info__section--round')[0];

    // add new "roundTime" node before "round" node
    roundNode.parentNode.insertBefore(newNode, roundNode.nextSibling.nextSibling);

    // select "roundTime" nodes to update
    roundTimeNodes = document.getElementsByClassName('game-info__section--timer-round');
  }
  const roundTimeNode = roundTimeNodes[0];
  roundTimeNode.innerHTML = `<span class="game-info__label">Round time</span>
  <span class="game-info__value">${roundTime}</span>`;


  if (document.getElementsByClassName('score__round').length > 0) {
    roundDate = new Date();
  }

  if (document.getElementsByClassName('score__final').length > 0) {
    const score = document.getElementsByClassName('score__progress__points')[0];
    score.innerHTML = `${score.innerHTML} and your total time was <b>${totalTime}</b>`
  } else {
    setTimeout(timer, 1000);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  totalDate = new Date();
  roundDate = new Date();
  timer();
});
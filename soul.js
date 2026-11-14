const screens = [...document.querySelectorAll('.screen')];
const journeyItems = [...document.querySelectorAll('.journey-item')];
const deviceGallery = document.querySelector('.device-gallery');
const primaryPhone = document.querySelector('.primary-phone');
const companionPhone = document.querySelector('.companion-phone');
const intentOptions = [...document.querySelectorAll('[data-screen="intent"] .intent-option')];
const examIntentOptions = [...document.querySelectorAll('.exam-intent-option')];
const whyBackdrop = document.getElementById('whyBackdrop');
const successToast = document.getElementById('successToast');
const examSuccessToast = document.getElementById('examSuccessToast');
const toastTitle = successToast.querySelector('strong');
const toastDetail = successToast.querySelector('small');
const messageInput = document.getElementById('messageInput');
const suggestionBlock = document.getElementById('suggestionBlock');
const messages = document.getElementById('messages');
const chatThread = document.getElementById('chatThread');
const interestNudge = document.getElementById('interestNudge');
const captureParams = new URLSearchParams(window.location.search);
const captureMode = captureParams.get('capture') === '1';
const openStoryVideoButtons = [...document.querySelectorAll('[data-open-story-video]')];
const closeStoryVideoButton = document.getElementById('closeStoryVideo');
const storyVideoModal = document.getElementById('storyVideoModal');
const storyVideo = document.getElementById('storyVideo');
const mobileIntro = document.querySelector('.mobile-intro');
const prototypeStage = document.querySelector('.stage');
const startMobilePrototypeButton = document.getElementById('startMobilePrototype');
let storyVideoTrigger = openStoryVideoButtons[0];
if (captureMode) {
  document.documentElement.classList.add('capture-mode');
  document.body.classList.add('capture-mode');
}
let selectedIntent = '随便聊聊';
let selectedExamIntent = '找同校研友';
let matchingTimer;
let nudgeRevealTimer;
let nudgeHideTimer;
let feedAutoNudgeTimer;
let suggestionSetIndex = 0;

function openStoryVideo(event) {
  storyVideoTrigger = event?.currentTarget || openStoryVideoButtons[0];
  storyVideoModal.hidden = false;
  document.body.classList.add('video-open');
  storyVideo.currentTime = 0;
  window.requestAnimationFrame(() => {
    closeStoryVideoButton.focus();
    const playback = storyVideo.play();
    if (playback) playback.catch(() => {});
  });
}

function closeStoryVideo() {
  storyVideo.pause();
  storyVideoModal.hidden = true;
  document.body.classList.remove('video-open');
  storyVideoTrigger?.focus();
}

openStoryVideoButtons.forEach((button) => button.addEventListener('click', openStoryVideo));
closeStoryVideoButton.addEventListener('click', closeStoryVideo);
storyVideoModal.addEventListener('click', (event) => {
  if (event.target === storyVideoModal) closeStoryVideo();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !storyVideoModal.hidden) closeStoryVideo();
});

function setMobilePrototypeActive(active) {
  document.body.classList.toggle('mobile-prototype-started', active);
  mobileIntro.setAttribute('aria-hidden', active ? 'true' : 'false');
  prototypeStage.setAttribute('aria-hidden', active ? 'false' : 'true');

  if (active) {
    window.scrollTo(0, 0);
    showScreen('feed');
    return;
  }

  window.clearTimeout(feedAutoNudgeTimer);
  hideInterestNudge(true);
  window.scrollTo(0, 0);
}

startMobilePrototypeButton.addEventListener('click', () => {
  window.history.pushState({ mobilePrototype: true }, '', '#prototype');
  setMobilePrototypeActive(true);
});

window.addEventListener('popstate', () => {
  setMobilePrototypeActive(window.location.hash === '#prototype');
});

function showInterestNudge() {
  window.clearTimeout(nudgeRevealTimer);
  window.clearTimeout(nudgeHideTimer);
  window.clearTimeout(feedAutoNudgeTimer);
  interestNudge.hidden = false;
  interestNudge.setAttribute('aria-hidden', 'false');
  void interestNudge.offsetWidth;
  interestNudge.classList.add('is-visible');
}

function scheduleFeedAutoNudge(delay = 3000) {
  window.clearTimeout(feedAutoNudgeTimer);
  feedAutoNudgeTimer = window.setTimeout(() => {
    const feedScreen = document.querySelector('[data-screen="feed"]');
    if (feedScreen.classList.contains('is-active') && interestNudge.hidden) {
      showInterestNudge();
    }
  }, delay);
}

function scheduleInterestNudge(button) {
  window.clearTimeout(nudgeRevealTimer);
  nudgeRevealTimer = window.setTimeout(() => {
    if (button.classList.contains('is-liked')) showInterestNudge();
  }, 3000);
}

function hideInterestNudge(immediate = false) {
  window.clearTimeout(nudgeRevealTimer);
  window.clearTimeout(nudgeHideTimer);
  interestNudge.classList.remove('is-visible');
  interestNudge.setAttribute('aria-hidden', 'true');
  if (immediate) {
    interestNudge.hidden = true;
    return;
  }
  nudgeHideTimer = window.setTimeout(() => {
    interestNudge.hidden = true;
  }, 360);
}

const journeyMap = {
  feed: 'feed',
  consent: 'consent',
  intent: 'intent',
  matching: 'matching',
  result: 'result',
  chat: 'result'
};

function showScreen(name) {
  window.clearTimeout(matchingTimer);
  window.clearTimeout(feedAutoNudgeTimer);
  if (name !== 'feed') hideInterestNudge(true);
  primaryPhone.classList.toggle('is-chatting', name === 'chat');
  const comparingIntents = name === 'intent';
  deviceGallery.classList.toggle('is-comparing', comparingIntents);
  companionPhone.setAttribute('aria-hidden', comparingIntents ? 'false' : 'true');
  screens.forEach((screen) => {
    screen.classList.toggle('is-active', screen.dataset.screen === name);
  });
  journeyItems.forEach((item) => {
    item.classList.toggle('is-active', item.dataset.jump === journeyMap[name]);
  });
  whyBackdrop.hidden = true;
  successToast.classList.remove('is-visible');

  if (name === 'feed' && !captureMode) scheduleFeedAutoNudge();

  if (name === 'matching') {
    const status = document.getElementById('matchingStatus');
    const factor = document.getElementById('onlineFactor');
    status.textContent = '先看共同话题，再看交流意图和在线状态';
    factor.innerHTML = '<i></i>当前在线';
    factor.classList.remove('is-done');
    if (captureMode) return;
    matchingTimer = window.setTimeout(() => {
      factor.innerHTML = '<i></i>当前在线';
      factor.classList.add('is-done');
      status.textContent = '找到一位现在适合打招呼的人';
      matchingTimer = window.setTimeout(() => showScreen('result'), 650);
    }, 1350);
  }
}

document.addEventListener('click', (event) => {
  const next = event.target.closest('[data-next]');
  const back = event.target.closest('[data-back]');
  if (next) showScreen(next.dataset.next);
  if (back) showScreen(back.dataset.back);
});

journeyItems.forEach((item) => item.addEventListener('click', () => showScreen(item.dataset.jump)));

document.querySelectorAll('.bottom-nav [data-nav]').forEach((item) => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.bottom-nav [data-nav]').forEach((navItem) => {
      const isCurrent = navItem === item;
      navItem.classList.toggle('is-active', isCurrent);
      if (isCurrent) navItem.setAttribute('aria-current', 'page');
      else navItem.removeAttribute('aria-current');
    });
  });
});

document.getElementById('restartDemo').addEventListener('click', () => {
  selectedIntent = '随便聊聊';
  intentOptions.forEach((option, index) => {
    option.classList.toggle('is-selected', index === 0);
    option.setAttribute('aria-checked', index === 0 ? 'true' : 'false');
  });
  selectedExamIntent = '找同校研友';
  examIntentOptions.forEach((option) => {
    const active = option.dataset.examIntent === selectedExamIntent;
    option.classList.toggle('is-selected', active);
    option.setAttribute('aria-checked', active ? 'true' : 'false');
  });
  document.getElementById('intentTag').textContent = selectedIntent;
  document.getElementById('intentReason').textContent = `你们都选择了“${selectedIntent}”。`;
  document.getElementById('topicConsent').checked = true;
  document.getElementById('enableMatching').disabled = false;
  messageInput.value = '';
  document.querySelectorAll('.message-row.outgoing').forEach((message) => message.remove());
  chatThread.hidden = true;
  document.querySelectorAll('[data-action="like"]').forEach((button) => button.classList.remove('is-liked'));
  suggestionBlock.hidden = false;
  suggestionSetIndex = 0;
  renderSuggestions();
  hideInterestNudge(true);
  showScreen('feed');
});

document.querySelector('.dismiss-nudge').addEventListener('click', () => {
  hideInterestNudge();
  scheduleFeedAutoNudge(3000);
});

document.querySelectorAll('[data-action="like"]').forEach((button) => {
  button.addEventListener('click', () => {
    button.classList.toggle('is-liked');
    if (button.dataset.triggerNudge === 'true') {
      if (button.classList.contains('is-liked')) scheduleInterestNudge(button);
      else hideInterestNudge();
    }
  });
});

document.getElementById('topicConsent').addEventListener('change', (event) => {
  document.getElementById('enableMatching').disabled = !event.target.checked;
});

intentOptions.forEach((option) => {
  option.addEventListener('click', () => {
    selectedIntent = option.dataset.intent;
    intentOptions.forEach((item) => {
      const active = item === option;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    document.getElementById('intentTag').textContent = selectedIntent;
    document.getElementById('intentReason').textContent = `你们都选择了“${selectedIntent}”。`;
  });
});

examIntentOptions.forEach((option) => {
  option.addEventListener('click', () => {
    selectedExamIntent = option.dataset.examIntent;
    examIntentOptions.forEach((item) => {
      const active = item === option;
      item.classList.toggle('is-selected', active);
      item.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  });
});

document.getElementById('useExamIntent').addEventListener('click', () => {
  examSuccessToast.querySelector('strong').textContent = `已选择「${selectedExamIntent}」`;
  examSuccessToast.classList.add('is-visible');
  window.setTimeout(() => examSuccessToast.classList.remove('is-visible'), 3200);
});

document.getElementById('whyMatch').addEventListener('click', () => {
  whyBackdrop.hidden = false;
});

function closeWhy() {
  whyBackdrop.hidden = true;
}

document.getElementById('closeWhy').addEventListener('click', closeWhy);
document.getElementById('understandWhy').addEventListener('click', closeWhy);
whyBackdrop.addEventListener('click', (event) => {
  if (event.target === whyBackdrop) closeWhy();
});

document.querySelectorAll('.suggestion-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    messageInput.value = chip.dataset.message || chip.textContent.trim();
    messageInput.focus();
  });
});

const suggestionSets = [
  [
    { lead: '哈喽', copy: '今天天气还挺适合骑车', reason: '经典问候，安全不出错', message: '哈喽，今天天气还挺适合骑车' },
    { lead: '嗨', copy: '我也在找夜骑路线', reason: '共同话题，更容易接住', message: '嗨，我也在找夜骑路线' }
  ],
  [
    { lead: '周末', copy: '要不要一起去踩线', reason: '明确邀约，自然不冒进', message: '周末要不要一起去踩线？' },
    { lead: '好巧', copy: '我也收藏了徐汇滨江', reason: '从共同地点轻松开场', message: '好巧，我也收藏了徐汇滨江的路线' }
  ]
];

function renderSuggestions() {
  const chips = [...document.querySelectorAll('.suggestion-chip')];
  const currentSet = suggestionSets[suggestionSetIndex];
  chips.forEach((chip, index) => {
    const suggestion = currentSet[index];
    chip.dataset.message = suggestion.message;
    chip.querySelector('.suggestion-main').innerHTML = `<strong>${suggestion.lead}</strong><i>/</i>${suggestion.copy}`;
    chip.querySelector('small').innerHTML = `<b>✦</b>${suggestion.reason}`;
  });
}

document.getElementById('refreshSuggestions').addEventListener('click', () => {
  suggestionSetIndex = (suggestionSetIndex + 1) % suggestionSets.length;
  renderSuggestions();
});

function sendMessage() {
  const text = messageInput.value.trim();
  if (!text) return;
  const row = document.createElement('div');
  row.className = 'message-row outgoing';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  row.appendChild(bubble);
  chatThread.hidden = false;
  chatThread.appendChild(row);
  messageInput.value = '';
  suggestionBlock.hidden = true;
  messages.scrollTop = messages.scrollHeight;
  toastTitle.textContent = '消息已发送';
  toastDetail.textContent = '你可以随时结束对话';
  successToast.classList.add('is-visible');
  window.setTimeout(() => successToast.classList.remove('is-visible'), 3200);
}

document.getElementById('sendMessage').addEventListener('click', sendMessage);
messageInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') sendMessage();
});

showScreen('feed');

if (!captureMode && window.matchMedia('(max-width: 800px)').matches) {
  setMobilePrototypeActive(window.location.hash === '#prototype');
}

if (captureMode) {
  const captureState = captureParams.get('state') || 'feed';
  if (captureState === 'nudge') {
    showScreen('feed');
    const likeButton = document.querySelector('[data-action="like"][data-trigger-nudge="true"]');
    likeButton.classList.add('is-liked');
    showInterestNudge();
  } else if (captureState === 'intent') {
    const teamOption = intentOptions.find((option) => option.dataset.intent === '周末组队');
    teamOption.click();
    showScreen('intent');
  } else if (captureState === 'chat' || captureState === 'reply') {
    showScreen('chat');
    if (captureState === 'reply') {
      suggestionBlock.hidden = true;
      chatThread.hidden = false;
      chatThread.innerHTML = `
        <div class="message-row outgoing"><div class="bubble">哈喽，今天天气还挺适合骑车。</div></div>
        <div class="message-row incoming">
          <img class="capture-avatar" src="soulassets/avatars/lost-north.png" alt="">
          <div class="bubble">是呀，我今天刚给轮胎打了气，准备过两天去骑车。</div>
        </div>`;
    }
  } else {
    showScreen(captureState);
  }
}

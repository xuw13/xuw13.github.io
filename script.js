const btnEn = document.getElementById('btnEn');
const btnZh = document.getElementById('btnZh');

const langBox = document.querySelector('.language');

function moveLangThumb() {
  const active = langBox.querySelector('.lang-btn.active');
  if (!active) return;
  langBox.style.setProperty('--thumb-x', `${active.offsetLeft}px`);
  langBox.style.setProperty('--thumb-w', `${active.offsetWidth}px`);
}

function applyLanguage(language) {
  document.documentElement.lang = language === 'zh' ? 'zh' : 'en';
  btnEn.classList.toggle('active', language === 'en');
  btnZh.classList.toggle('active', language === 'zh');
  moveLangThumb();

  document.querySelectorAll('[data-en][data-zh]').forEach((element) => {
    element.innerHTML = element.dataset[language];
  });

  localStorage.setItem('portfolio-language', language);
}

function switchLanguage(language) {
  const current = document.documentElement.lang === 'zh' ? 'zh' : 'en';
  if (language === current) return;
  // Move the toggle thumb immediately so its slide isn't frozen by the page transition
  btnEn.classList.toggle('active', language === 'en');
  btnZh.classList.toggle('active', language === 'zh');
  moveLangThumb();
  if (document.startViewTransition && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.startViewTransition(() => applyLanguage(language));
  } else {
    applyLanguage(language);
  }
}

btnEn.addEventListener('click', () => { if (!dragMoved) switchLanguage('en'); });
btnZh.addEventListener('click', () => { if (!dragMoved) switchLanguage('zh'); });
applyLanguage(localStorage.getItem('portfolio-language') || 'en');

// --- Draggable thumb ---
let dragging = false;
let dragMoved = false;

const lerp = (a, b, t) => a + (b - a) * t;

function dragTo(clientX) {
  const rect = langBox.getBoundingClientRect();
  const x = clientX - rect.left;
  const cEn = btnEn.offsetLeft + btnEn.offsetWidth / 2;
  const cZh = btnZh.offsetLeft + btnZh.offsetWidth / 2;
  const t = Math.min(1, Math.max(0, (x - cEn) / (cZh - cEn)));
  const w = lerp(btnEn.offsetWidth, btnZh.offsetWidth, t);
  langBox.style.setProperty('--thumb-x', `${lerp(cEn, cZh, t) - w / 2}px`);
  langBox.style.setProperty('--thumb-w', `${w}px`);
  return t;
}

let dragStartX = 0;

langBox.addEventListener('pointerdown', (event) => {
  dragging = true;
  dragMoved = false;
  dragStartX = event.clientX;
});

langBox.addEventListener('pointermove', (event) => {
  if (!dragging) return;
  // Ignore sub-pixel jitter so normal clicks aren't treated as drags
  if (!dragMoved && Math.abs(event.clientX - dragStartX) < 3) return;
  if (!dragMoved) {
    dragMoved = true;
    langBox.classList.add('dragging');
    langBox.setPointerCapture(event.pointerId);
  }
  dragTo(event.clientX);
});

langBox.addEventListener('pointerup', (event) => {
  if (!dragging) return;
  dragging = false;
  langBox.classList.remove('dragging');
  if (dragMoved) {
    const t = dragTo(event.clientX);
    switchLanguage(t < 0.5 ? 'en' : 'zh');
    moveLangThumb();
    // Let the click event (fired right after pointerup) see dragMoved, then reset
    setTimeout(() => { dragMoved = false; }, 0);
  }
});

langBox.addEventListener('pointercancel', () => {
  dragging = false;
  langBox.classList.remove('dragging');
  dragMoved = false;
  moveLangThumb();
});

// --- Interactive terminal ---
const term = document.getElementById('terminal');
if (term) {
  const body = document.getElementById('termBody');
  const hints = document.getElementById('termHints');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PROJECTS = [
    ['braeburn/', 'braeburn-project.html'],
    ['softsignal/', 'softsignal-project.html'],
    ['airport-kiosk/', 'sna-project.html'],
    ['mercari-nav/', 'mercari-mockup.html'],
    ['pocket-market/', 'pocket-market-mockup.html'],
    ['token-atm/', 'token-atm-mockup.html'],
    ['tmge/', 'tmge-mockup.html'],
  ];
  let inputEnabled = false;
  let buffer = '';
  let caret = null;
  let inputLine = null;

  const scrollDown = () => { body.scrollTop = body.scrollHeight; };
  const wait = (ms) => (reduced ? Promise.resolve() : new Promise((r) => setTimeout(r, ms)));

  function print(html) {
    const line = document.createElement('div');
    line.innerHTML = html;
    body.appendChild(line);
    scrollDown();
  }

  const projectsHTML = () => PROJECTS.map(([name, href]) => `<a href="${href}">${name}</a>`).join('  ');

  async function typeLine(text) {
    const line = document.createElement('div');
    line.className = 't-cmd';
    const c = document.createElement('span');
    c.className = 't-caret';
    c.textContent = '▊';
    line.appendChild(c);
    body.appendChild(line);
    for (const ch of text) {
      c.before(document.createTextNode(ch));
      scrollDown();
      await wait(42);
    }
    c.remove();
  }

  const COMMANDS = {
    help() { print(`<span class="t-dim">available commands:</span>\n<span class="t-out">help · ls · whoami · status · work · about · contact · resume · zh · en · clear · sudo hire-me</span>`); },
    ls() { print(`<span class="t-out">${projectsHTML()}</span>`); },
    whoami() { print('<span class="t-out">Xu Wang — designer × engineer</span>'); },
    status() { print('<span class="t-out"><span class="t-ok">●</span> available for product design opportunities</span>'); },
    work() { print('<span class="t-dim">navigating to selected work…</span>'); document.getElementById('work').scrollIntoView({ behavior: 'smooth' }); },
    about() { print('<span class="t-dim">navigating to about…</span>'); document.getElementById('about').scrollIntoView({ behavior: 'smooth' }); },
    contact() { print('<span class="t-out">→ <a href="mailto:miragew13@gmail.com">miragew13@gmail.com</a></span>'); },
    resume() { print('<span class="t-dim">opening résumé…</span>'); window.open('resume.html', '_blank'); },
    clear() { body.innerHTML = ''; },
    zh() { switchLanguage('zh'); print('<span class="t-ok">✓ 已切换到中文</span>'); },
    en() { switchLanguage('en'); print('<span class="t-ok">✓ switched to English</span>'); },
  };
  COMMANDS['sudo hire-me'] = () => { print('<span class="t-ok">✓ permission granted — opening résumé</span>'); window.open('resume.html', '_blank'); };
  COMMANDS['sudo hire me'] = COMMANDS['sudo hire-me'];
  COMMANDS['cd work'] = COMMANDS.work;
  COMMANDS['ls projects/'] = COMMANDS.ls;

  function newPrompt() {
    inputLine = document.createElement('div');
    inputLine.innerHTML = '<span class="t-dim">xu@portfolio</span> <span class="t-cmd">›</span> <span class="t-input t-out"></span>';
    caret = document.createElement('span');
    caret.className = 't-caret';
    caret.textContent = '▊';
    inputLine.appendChild(caret);
    body.appendChild(inputLine);
    scrollDown();
    buffer = '';
    inputEnabled = true;
  }

  const renderBuffer = () => { inputLine.querySelector('.t-input').textContent = buffer; scrollDown(); };

  function run(raw) {
    const cmd = raw.trim().toLowerCase();
    inputEnabled = false;
    caret.remove();
    if (cmd) {
      const fn = COMMANDS[cmd];
      if (fn) fn();
      else print(`<span class="t-dim">command not found: ${cmd.replace(/[<>&]/g, '')} — try 'help'</span>`);
    }
    newPrompt();
  }

  term.addEventListener('keydown', (event) => {
    if (!inputEnabled) return;
    if (event.key === 'Enter') { event.preventDefault(); run(buffer); }
    else if (event.key === 'Backspace') { event.preventDefault(); buffer = buffer.slice(0, -1); renderBuffer(); }
    else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) { event.preventDefault(); buffer += event.key; renderBuffer(); }
  });
  term.addEventListener('pointerdown', (event) => {
    if (!event.target.closest('a, button')) term.focus({ preventScroll: true });
  });

  ['help', 'work', 'sudo hire-me', '中文'].forEach((label) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.addEventListener('click', () => {
      if (!inputEnabled) return;
      buffer = label === '中文' ? 'zh' : label;
      renderBuffer();
      run(buffer);
    });
    hints.appendChild(btn);
  });

  (async function boot() {
    await wait(500);
    await typeLine('> whoami');
    await wait(160);
    COMMANDS.whoami();
    await wait(420);
    await typeLine('> ls projects/');
    await wait(160);
    COMMANDS.ls();
    await wait(420);
    await typeLine('> status');
    await wait(160);
    COMMANDS.status();
    await wait(480);
    print('<span class="t-dim">type \'help\' to explore — or just click around</span>');
    newPrompt();
  })();
}

// --- Custom cursor (dot + trailing ring) & magnetic buttons ---
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (finePointer.matches && !reducedMotion.matches) {
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'cursor-dot';
  ring.className = 'cursor-ring';
  document.body.append(dot, ring);
  document.body.classList.add('custom-cursor', 'cursor-hidden');

  let mx = innerWidth / 2, my = innerHeight / 2;
  let rx = mx, ry = my;

  document.addEventListener('pointermove', (event) => {
    mx = event.clientX;
    my = event.clientY;
    dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;
    document.body.classList.remove('cursor-hidden');
  });
  document.addEventListener('pointerdown', () => document.body.classList.add('cursor-pressed'));
  document.addEventListener('pointerup', () => document.body.classList.remove('cursor-pressed'));
  document.documentElement.addEventListener('pointerleave', () => document.body.classList.add('cursor-hidden'));

  (function followLoop() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    const size = ring.offsetWidth / 2;
    ring.style.transform = `translate(${rx - size}px, ${ry - size}px)`;
    requestAnimationFrame(followLoop);
  })();

  const INTERACTIVE = 'a, button, .project[data-href]';
  document.addEventListener('pointerover', (event) => {
    document.body.classList.toggle('cursor-on-link', !!event.target.closest(INTERACTIVE));
  });

  // Magnetic pull for primary CTAs
  const RADIUS = 85;
  const magnets = document.querySelectorAll('.primary-button, .contact-pill');
  magnets.forEach((el) => el.classList.add('magnetic'));

  document.addEventListener('pointermove', (event) => {
    // Don't pull anything while the pointer is on another interactive control
    const onOther = event.target.closest('a, button, .language');
    magnets.forEach((el) => {
      if (onOther && !el.contains(onOther) && onOther !== el) {
        el.style.transform = '';
        return;
      }
      const rect = el.getBoundingClientRect();
      const dx = event.clientX - (rect.left + rect.width / 2);
      const dy = event.clientY - (rect.top + rect.height / 2);
      const dist = Math.hypot(dx, dy);
      el.style.transform = dist < RADIUS
        ? `translate(${dx * 0.28}px, ${dy * 0.28}px)`
        : '';
    });
  }, { passive: true });
}

// Enable thumb animation only after initial position is set (no slide-in on page load)
requestAnimationFrame(() => requestAnimationFrame(() => langBox.classList.add('ready')));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveLangThumb);
window.addEventListener('resize', moveLangThumb);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    revealObserver.unobserve(entry.target);
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

function resizePreviews() {
  document.querySelectorAll('.project-preview').forEach((preview) => {
    const scale = preview.clientWidth / 900;
    preview.style.height = `${560 * scale + 34}px`;
    preview.querySelectorAll('iframe').forEach((iframe) => { iframe.style.transform = `scale(${scale})`; });
  });
}

resizePreviews();
window.addEventListener('resize', resizePreviews);
document.querySelectorAll('.project-preview iframe').forEach((iframe) => iframe.addEventListener('load', resizePreviews));

// --- Project index: hover to switch the stage card ---
const stage = document.getElementById('projectStage');
if (stage) {
  const STAGE_DATA = [
    {
      num: '01', tags: 'UX · SMART HOME · CAPSTONE', title: 'Braeburn Capstone', href: 'braeburn-project.html', src: 'braeburn-mockup.html',
      tintA: 'rgba(57,161,218,.15)', tintB: 'rgba(58,96,156,.055)',
      sub: ['Redesigning a smart thermostat app', '智能恒温器 App 的重新设计'],
      desc: ['A year-long capstone with Braeburn Systems, rebuilding the homeowner experience around first-time setup, troubleshooting, and everyday control.', '与 Braeburn Systems 合作的一年期毕业设计，围绕初次配置、故障排查与日常控制重做住户端体验。'],
      role: ['UX Researcher & Designer', '用户研究员 & 设计师'], link: ['Read case study ↗', '查看案例 ↗'],
    },
    {
      num: '02', tags: 'UX · WEARABLE · AI', title: 'SoftSignal', href: 'softsignal-project.html', src: 'softsignal-mockup.html',
      tintA: 'rgba(115,138,255,.14)', tintB: 'rgba(84,227,239,.055)',
      sub: ['AI-assisted exit cues for social anxiety', '为社交焦虑设计的 AI 辅助离场提示'],
      desc: ['A discreet wearable system that recognizes stress and helps people leave overwhelming social situations with confidence.', '通过可穿戴设备识别压力信号，帮助用户在社交过载前自然、有尊严地离场。'],
      role: ['UX Researcher & Designer', '用户研究员 & 设计师'], link: ['Read case study ↗', '查看案例 ↗'],
    },
    {
      num: '03', tags: 'UX · KIOSK · AIRPORT', title: 'Airport Smart Check-in', href: 'sna-project.html', src: 'sna-checkin-mockup.html',
      tintA: 'rgba(255,128,105,.13)', tintB: 'rgba(255,202,106,.05)',
      sub: ['Making self check-in feel less stressful', '让机场自助值机更清晰、更安心'],
      desc: ['A redesigned airport kiosk that helps travelers recover from frozen screens, baggage issues, and confusing handoffs.', '重新设计机场自助值机系统，帮助旅客处理屏幕故障、行李问题和不清晰的人工转接。'],
      role: ['UX Researcher & Designer', '用户研究员 & 设计师'], link: ['Read case study ↗', '查看案例 ↗'],
    },
    {
      num: '04', tags: 'RESEARCH · EVALUATION', title: 'Mercari Navigation', href: 'mercari-mockup.html', src: 'mercari-mockup.html',
      tintA: 'rgba(174,139,255,.15)', tintB: 'rgba(102,159,255,.05)',
      sub: ['Turning a crowded marketplace into a clearer path', '为复杂的二手交易平台建立更清晰的导航'],
      desc: ['A mixed-method UX study that reorganized navigation into eight categories, improving task success by 28%.', '结合多种研究方法，将导航重组为八个类别，使任务成功率提升 28%。'],
      role: ['UX Researcher & Designer', '用户研究员 & 设计师'], link: ['View project ↗', '查看项目 ↗'],
    },
    {
      num: '05', tags: 'PRODUCT · MOBILE', title: 'Pocket Market', href: 'pocket-market-mockup.html', src: 'pocket-market-mockup.html',
      tintA: 'rgba(120,237,197,.13)', tintB: 'rgba(84,227,239,.05)',
      sub: ['Smart multi-store grocery planning', '智能多商店购物规划'],
      desc: ['A shopping companion that plans the cheapest route across nearby stores from a single grocery list.', '根据一张购物清单，自动规划附近多家商店的最优购买路线。'],
      role: ['Designer & Engineer', '设计师 & 开发者'], link: ['View project ↗', '查看项目 ↗'],
    },
    {
      num: '06', tags: 'EDTECH · PLATFORM', title: 'Token ATM', href: 'token-atm-mockup.html', src: 'token-atm-mockup.html',
      tintA: 'rgba(255,158,128,.13)', tintB: 'rgba(255,202,106,.05)',
      sub: ['An EdTech platform for 1,300 students', '服务 1,300 名学生的教育平台'],
      desc: ['A token-economy platform that helps teachers reward positive behavior, used daily across an entire school.', '基于代币激励的课堂管理平台，被全校师生每天使用。'],
      role: ['Designer & Engineer', '设计师 & 开发者'], link: ['View project ↗', '查看项目 ↗'],
    },
    {
      num: '07', tags: 'SOCIAL · REALTIME', title: 'ChattNoww', href: 'https://chattnoww.online', src: 'chattnoww-mockup.html',
      tintA: 'rgba(137,164,255,.14)', tintB: 'rgba(178,155,255,.05)',
      sub: ['Location-based real-time communities', '基于位置的实时社区'],
      desc: ['A live web community where conversations are anchored to real places, built end-to-end and shipped online.', '将对话锚定在真实地点的实时社区，从设计到上线独立完成。'],
      role: ['Designer & Engineer', '设计师 & 开发者'], link: ['Visit site ↗', '访问网站 ↗'],
    },
    {
      num: '08', tags: 'ENGINEERING · GAME', title: 'TMGE', href: 'tmge-mockup.html', src: 'tmge-mockup.html',
      tintA: 'rgba(178,155,255,.14)', tintB: 'rgba(106,228,255,.05)',
      sub: ['A flexible tile-matching game engine', '可扩展的消除类游戏引擎'],
      desc: ['A reusable game engine that powers multiple tile-matching games from one clean, extensible architecture.', '一套可复用的游戏引擎架构，支撑多款消除类游戏。'],
      role: ['Engineer', '开发者'], link: ['View project ↗', '查看项目 ↗'],
    },
  ];

  const rows = document.querySelectorAll('.index-row');
  const stageText = document.getElementById('stageText');
  const stagePreview = document.getElementById('stagePreview');
  const frames = { 0: stagePreview.querySelector('iframe') };
  try {
    if (frames[0].contentDocument && frames[0].contentDocument.readyState === 'complete') frames[0].dataset.loaded = '1';
  } catch (e) { /* cross-origin — treat as loaded on event below */ }
  if (!frames[0].dataset.loaded) frames[0].addEventListener('load', () => { frames[0].dataset.loaded = '1'; }, { once: true });
  let current = 0;
  let swapTimer = null;

  const langIdx = () => (document.documentElement.lang === 'zh' ? 1 : 0);
  function setField(id, pair) {
    const el = document.getElementById(id);
    el.dataset.en = pair[0];
    el.dataset.zh = pair[1];
    el.innerHTML = pair[langIdx()];
  }

  function setActive(i) {
    if (i === current) return;
    current = i;
    const d = STAGE_DATA[i];
    rows.forEach((row, r) => row.classList.toggle('active', r === i));

    if (!frames[i]) {
      const f = document.createElement('iframe');
      f.src = d.src;
      f.title = 'Project preview';
      f.tabIndex = -1;
      f.addEventListener('load', () => { f.dataset.loaded = '1'; resizePreviews(); }, { once: true });
      stagePreview.appendChild(f);
      frames[i] = f;
      resizePreviews();
    }
    // Crossfade only once the target iframe has rendered — keeps the old
    // screenshot visible instead of flashing a white loading frame
    const target = frames[i];
    const activate = () => {
      if (current !== i) return;
      Object.entries(frames).forEach(([k, f]) => {
        const isNew = Number(k) === i;
        // Old active frame stays fully visible underneath while the new one fades in
        f.classList.toggle('prev', !isNew && f.classList.contains('active'));
        f.classList.toggle('active', isNew);
      });
      setTimeout(() => {
        if (current !== i) return;
        Object.values(frames).forEach((f) => { if (!f.classList.contains('active')) f.classList.remove('prev'); });
      }, 550);
    };
    if (target.dataset.loaded) activate();
    else target.addEventListener('load', activate, { once: true });

    stageText.style.opacity = '0';
    clearTimeout(swapTimer);
    swapTimer = setTimeout(() => {
      document.getElementById('stageNum').textContent = d.num;
      document.getElementById('stageTags').textContent = d.tags;
      document.getElementById('stageTitle').textContent = d.title;
      setField('stageSubtitle', d.sub);
      setField('stageDesc', d.desc);
      setField('stageRole', d.role);
      setField('stageLink', d.link);
      const link = document.getElementById('stageLink');
      link.href = d.href;
      stage.dataset.href = d.href;
      stage.style.setProperty('--tint-a', d.tintA);
      stage.style.setProperty('--tint-b', d.tintB);
      stageText.style.opacity = '1';
    }, 240);
  }

  rows.forEach((row) => {
    const i = Number(row.dataset.idx);
    row.addEventListener('pointerenter', (event) => {
      if (event.pointerType === 'mouse') setActive(i);
    });
    row.addEventListener('click', (event) => {
      if (window.matchMedia('(hover: none)').matches && current !== i) {
        event.preventDefault();
        setActive(i);
      }
    });
  });
}

document.querySelectorAll('.project[data-href]').forEach((card) => {
  const openCard = () => { window.location.href = card.dataset.href; };

  card.addEventListener('click', (event) => {
    if (event.target.closest('a')) return;
    openCard();
  });

  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openCard();
  });

  card.addEventListener('pointermove', (event) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    card.style.transform = `perspective(1200px) rotateX(${-y * 1.4}deg) rotateY(${x * 1.4}deg) translateY(-5px)`;
  });

  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

const glassSurfaces = document.querySelectorAll(
  '.site-nav, .hero-playground, .project, .mini-project, .contact'
);

glassSurfaces.forEach((surface) => {
  surface.addEventListener('pointermove', (event) => {
    const bounds = surface.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    surface.style.setProperty('--glass-x', `${x}%`);
    surface.style.setProperty('--glass-y', `${y}%`);
  });

  surface.addEventListener('pointerleave', () => {
    surface.style.setProperty('--glass-x', '50%');
    surface.style.setProperty('--glass-y', '20%');
  });
});

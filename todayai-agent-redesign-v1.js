const scenes = {
  today: {
    kicker: "8:00 · Morning Brief",
    title: "Every day starts here.",
    message: "Nice to meet you here, April. I’m Today. I already know a bit about you — what should I focus on first?",
    metrics: [["Sleep", "8h 14m"], ["HRV", "83.6 ms"], ["Movement", "2.8k steps"], ["HRR", "44 bpm"]],
    detail: ["Working on", "Launch Page Visual Design", "3 directions · Due 6 pm"],
    action: "Ask Today…"
  },
  tasks: {
    kicker: "Today · Tasks",
    title: "Launch Page Visual Design",
    message: "Tuesday’s launch review needs three directions. You have the references and product shots — just need to lay them out.",
    metrics: [["Start", "9 am"], ["Due", "6 pm"], ["Step 1", "Figma"], ["Step 2", "Import refs"]],
    detail: ["Requirements changed", "A warmer hero", "Fewer technical details · Real-home photography"],
    action: "Organize changes"
  },
  memories: {
    kicker: "Living memory",
    title: "It remembers what matters.",
    message: "Your days, people, preferences, and the goals you keep coming back to stay in context — with you in control.",
    metrics: [["People", "6 key"], ["Goals", "4 active"], ["Learning", "Spanish"], ["Health", "Recovery"]],
    detail: ["Next adventure", "Camino Francés", "5 days · 115 km · Sarria to Santiago"],
    action: "Open Memories"
  },
  capabilities: {
    kicker: "Built to actually work",
    title: "From request to result.",
    message: "Today can plan the work, use tools, check progress, and report back — with stable computers in the cloud.",
    metrics: [["Models", "Frontier"], ["Tools", "Connected"], ["Cloud", "24 hours"], ["Devices", "Cross-device"]],
    detail: ["Community Skill", "Meeting Summarizer", "Marketing · ready to use"],
    action: "View Capabilities"
  }
};

const panel = document.querySelector("[data-scene-panel]");
const sceneTabs = document.querySelectorAll("[data-scene]");

function renderScene(name) {
  const data = scenes[name];
  panel.animate([{ opacity: .2, transform: "translateY(8px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 360, easing: "ease-out" });
  panel.querySelector(".agent-kicker").textContent = data.kicker;
  panel.querySelector("h2").textContent = data.title;
  panel.querySelector(".agent-message").textContent = data.message;
  const items = panel.querySelectorAll(".context-row > div");
  items.forEach((item, index) => {
    item.querySelector("span").textContent = data.metrics[index][0];
    item.querySelector("strong").textContent = data.metrics[index][1];
  });
  const detail = panel.querySelector("[data-agent-detail]");
  detail.querySelector("span").textContent = data.detail[0];
  detail.querySelector("strong").textContent = data.detail[1];
  detail.querySelector("small").textContent = data.detail[2];
  panel.querySelector(".agent-action").firstChild.textContent = `${data.action} `;
}

const sceneSwitcher = document.querySelector("[data-scene-switcher]");
const sceneInterval = 4400;
let activeSceneIndex = 0;
let sceneTimer;
let sceneTimerStarted = 0;
let sceneTimeRemaining = sceneInterval;
let sceneSwitcherVisible = false;
let sceneSwitcherPaused = true;

function activateScene(tab) {
  sceneTabs.forEach((item) => { item.classList.remove("active"); item.setAttribute("aria-selected", "false"); });
  tab.classList.add("active");
  tab.setAttribute("aria-selected", "true");
  activeSceneIndex = Array.from(sceneTabs).indexOf(tab);
  panel.setAttribute("aria-labelledby", tab.id);
  renderScene(tab.dataset.scene);
}

function stopSceneTimer() {
  if (!sceneTimer) return;
  sceneTimeRemaining = Math.max(0, sceneTimeRemaining - (performance.now() - sceneTimerStarted));
  clearTimeout(sceneTimer);
  sceneTimer = undefined;
}

function startSceneTimer(reset = false) {
  if (reset) sceneTimeRemaining = sceneInterval;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !sceneSwitcherVisible || sceneSwitcherPaused || document.hidden) return;
  clearTimeout(sceneTimer);
  sceneTimerStarted = performance.now();
  sceneTimer = window.setTimeout(() => {
    sceneTimeRemaining = sceneInterval;
    activateScene(sceneTabs[(activeSceneIndex + 1) % sceneTabs.length]);
    startSceneTimer(true);
  }, sceneTimeRemaining);
}

function pauseSceneAutoplay() {
  sceneSwitcherPaused = true;
  sceneSwitcher.classList.add("is-paused");
  stopSceneTimer();
}

function resumeSceneAutoplay() {
  sceneSwitcherPaused = false;
  sceneSwitcher.classList.remove("is-paused");
  startSceneTimer(sceneTimeRemaining <= 0);
}

sceneTabs.forEach((tab) => tab.addEventListener("click", () => {
  activateScene(tab);
  sceneTimeRemaining = sceneInterval;
  if (!sceneSwitcherPaused) startSceneTimer(true);
}));

sceneSwitcher.addEventListener("pointerenter", pauseSceneAutoplay);
sceneSwitcher.addEventListener("pointerleave", resumeSceneAutoplay);
sceneSwitcher.addEventListener("focusin", pauseSceneAutoplay);
sceneSwitcher.addEventListener("focusout", (event) => {
  if (!sceneSwitcher.contains(event.relatedTarget)) resumeSceneAutoplay();
});

const sceneObserver = new IntersectionObserver(([entry]) => {
  sceneSwitcherVisible = entry.isIntersecting;
  if (sceneSwitcherVisible) resumeSceneAutoplay();
  else pauseSceneAutoplay();
}, { threshold: .45 });
sceneObserver.observe(sceneSwitcher);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopSceneTimer();
  else startSceneTimer(false);
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll(".reveal").forEach((element, index) => {
  element.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
  revealObserver.observe(element);
});

const header = document.querySelector("[data-header]");
const updateHeader = () => {
  header.classList.toggle("scrolled", window.scrollY > 48);
};
updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const contextManifesto = document.querySelector("[data-context-manifesto]");
const manifestoSteps = contextManifesto ? Array.from(contextManifesto.querySelectorAll("[data-manifest-step]")) : [];

function prepareManifestoUnits() {
  manifestoSteps.forEach((step) => {
    Array.from(step.childNodes).forEach((node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;

      const fragment = document.createDocumentFragment();
      Array.from(node.textContent).forEach((character) => {
        if (/\s/.test(character)) {
          fragment.append(character);
          return;
        }

        const letter = document.createElement("span");
        letter.className = "manifest-letter";
        letter.setAttribute("aria-hidden", "true");
        letter.textContent = character;
        fragment.append(letter);
      });
      node.replaceWith(fragment);
    });
  });

  return contextManifesto
    ? Array.from(contextManifesto.querySelectorAll(".manifest-letter, .manifest-icon, .manifest-devices"))
    : [];
}

const manifestoUnits = prepareManifestoUnits();
let manifestoProgress = 0;
let manifestoTarget = 0;
let manifestoUnitProgress = 0;
let manifestoFrame;

function readManifestoUnitTarget(progress) {
  const revealStart = .27;
  const revealEnd = .64;
  const revealProgress = Math.min(1, Math.max(0, (progress - revealStart) / (revealEnd - revealStart)));
  return revealProgress * manifestoUnits.length;
}

function readManifestoProgress() {
  if (!contextManifesto) return 0;
  const rect = contextManifesto.getBoundingClientRect();
  const travel = Math.max(1, window.innerHeight + rect.height);
  return Math.min(1, Math.max(0, (window.innerHeight - rect.top) / travel));
}

function renderContextManifesto(progress) {
  if (!contextManifesto) return;
  const shiftRange = window.innerWidth < 700 ? 32 : 56;
  const shift = -shiftRange + progress * shiftRange * 2;
  contextManifesto.style.setProperty("--manifest-progress", progress.toFixed(3));
  contextManifesto.style.setProperty("--manifest-shift", `${shift.toFixed(1)}px`);

  const visibleUnits = Math.floor(manifestoUnitProgress);

  manifestoUnits.forEach((unit, index) => {
    unit.classList.toggle("is-lit", index < visibleUnits);
  });
}

function animateContextManifesto() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const delta = manifestoTarget - manifestoProgress;
  const unitTarget = reducedMotion ? manifestoUnits.length : readManifestoUnitTarget(manifestoTarget);
  const unitDelta = unitTarget - manifestoUnitProgress;

  if (reducedMotion) {
    manifestoProgress = 1;
    manifestoUnitProgress = manifestoUnits.length;
  } else if (Math.abs(delta) < .001) {
    manifestoProgress = manifestoTarget;
  } else {
    manifestoProgress += delta * .14;
  }

  if (!reducedMotion) {
    if (Math.abs(unitDelta) < .01) {
      manifestoUnitProgress = unitTarget;
    } else {
      const unitStep = Math.sign(unitDelta) * Math.min(Math.abs(unitDelta) * .16, .8);
      manifestoUnitProgress += unitStep;
    }
  }

  renderContextManifesto(manifestoProgress);

  if (
    !reducedMotion &&
    (Math.abs(manifestoTarget - manifestoProgress) >= .001 || Math.abs(unitTarget - manifestoUnitProgress) >= .01)
  ) {
    manifestoFrame = requestAnimationFrame(animateContextManifesto);
  } else {
    manifestoFrame = undefined;
  }
}

function requestManifestoUpdate() {
  manifestoTarget = readManifestoProgress();
  if (!manifestoFrame) manifestoFrame = requestAnimationFrame(animateContextManifesto);
}

manifestoTarget = readManifestoProgress();
manifestoProgress = manifestoTarget;
manifestoUnitProgress = readManifestoUnitTarget(manifestoProgress);
renderContextManifesto(manifestoProgress);
window.addEventListener("scroll", requestManifestoUpdate, { passive: true });
window.addEventListener("resize", requestManifestoUpdate);

const featureTabs = Array.from(document.querySelectorAll("[data-feature-tab]"));
const featurePanels = Array.from(document.querySelectorAll("[data-feature-panel]"));

function activateFeature(nextTab) {
  const featureName = nextTab.dataset.featureTab;
  featureTabs.forEach((tab) => {
    const active = tab === nextTab;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
    tab.querySelector("i").textContent = active ? "−" : "+";
  });
  featurePanels.forEach((panel) => {
    const active = panel.dataset.featurePanel === featureName;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
}

featureTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateFeature(tab));
  tab.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const direction = event.key === "ArrowDown" ? 1 : -1;
    const nextTab = featureTabs[(index + direction + featureTabs.length) % featureTabs.length];
    nextTab.focus();
    activateFeature(nextTab);
  });
});

const eventObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      document.querySelectorAll(".proactive-event").forEach((event) => event.classList.remove("active"));
      entry.target.classList.add("active");
    }
  });
}, { rootMargin: "-35% 0px -45%", threshold: 0 });
document.querySelectorAll(".proactive-event").forEach((event) => eventObserver.observe(event));

const dialog = document.querySelector("[data-demo-dialog]");
document.querySelector("[data-open-demo]").addEventListener("click", () => dialog.showModal());
document.querySelector("[data-close-demo]").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});

const track = document.querySelector("[data-drag-track]");
let dragging = false;
let dragStart = 0;
let scrollStart = 0;
if (track) {
  track.addEventListener("pointerdown", (event) => { dragging = true; dragStart = event.clientX; scrollStart = track.scrollLeft; track.setPointerCapture(event.pointerId); });
  track.addEventListener("pointermove", (event) => { if (dragging) track.scrollLeft = scrollStart - (event.clientX - dragStart); });
  track.addEventListener("pointerup", () => { dragging = false; });
  track.addEventListener("pointercancel", () => { dragging = false; });
}

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  window.addEventListener("pointermove", (event) => {
    const stage = document.querySelector(".agent-shell");
    if (window.innerWidth < 900) return;
    const x = (event.clientX / window.innerWidth - .5) * 5;
    const y = (event.clientY / window.innerHeight - .5) * -4;
    stage.style.transform = `perspective(1200px) rotateY(${x - 5}deg) rotateX(${y + 2}deg)`;
  }, { passive: true });
}

// rednote prototype: interaction entry.
(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const screens = $$("[data-screen]");
  const initialCommentCount = $$("#commentsList > .comment-row").length + 1;
  const state = { screen: "note", start: "今晚", pace: "轻松完成", role: 0, saved: false, liked: false, done: false, newComments: 0 };
  const timers = new Set();
  let matchingTimers = [];
  let invitationTimer;
  let toastTimer;
  let replyTo = "";
  let dialogReturnFocus;

  const stepMap = { note: "note", goal: "goal", intent: "goal", matching: "matching", group: "matching", day: "day", finish: "finish" };

  function delay(fn, ms) {
    const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  }

  function clearMatching() {
    matchingTimers.forEach((id) => { window.clearTimeout(id); timers.delete(id); });
    matchingTimers = [];
  }

  function updatePreview(mode) {
    const ids = { note: "previewNote", comments: "previewComments", invitation: "previewInvitation" };
    $$(".preview-modes button").forEach((button) => {
      const active = button.id === ids[mode];
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function closeInvitation() {
    $("#actionNudge").classList.remove("is-open");
    $("#nudgeBackdrop").classList.remove("is-open");
    $("#actionNudge").setAttribute("aria-hidden", "true");
    updateStartGuide();
  }

  function openInvitation() {
    if (state.screen !== "note") return;
    $("#actionNudge").classList.add("is-open");
    $("#nudgeBackdrop").classList.add("is-open");
    $("#actionNudge").setAttribute("aria-hidden", "false");
    updateStartGuide();
    updatePreview("invitation");
  }

  function showScreen(name, options = {}) {
    const target = screens.find((screen) => screen.dataset.screen === name);
    if (!target) return;
    clearMatching();
    window.clearTimeout(invitationTimer);
    closeInvitation();
    closeDialog(false);
    state.screen = name;
    screens.forEach((screen) => screen.classList.toggle("is-active", screen === target));
    $$("[data-jump]").forEach((button) => {
      const active = button.dataset.jump === stepMap[name];
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "step" : "false");
    });
    const scroller = $(".screen-scroll, .note-scroll", target);
    if (scroller && !options.keepScroll) scroller.scrollTop = 0;
    updatePreview("note");
    updateStartGuide();
    if (name === "matching") matchSequence();
  }

  function updateStartGuide() {
    const visible = state.screen === "note" && !state.saved && !$("#actionNudge").classList.contains("is-open");
    const tip = $("#saveCoachmark");
    tip.hidden = !visible;
    $("#saveNote").classList.toggle("needs-start", visible);
    if (!visible) return;
    const screen = $("[data-screen='note']");
    const screenRect = screen.getBoundingClientRect();
    const saveRect = $("#saveNote").getBoundingClientRect();
    const scale = screenRect.width / screen.offsetWidth;
    if (scale > 0) tip.style.left = ((saveRect.left + saveRect.width / 2 - screenRect.left) / scale) + "px";
  }

  function selectedCopy() {
    $("#matchingTime").textContent = state.start + "开始";
    $("#matchingPace").textContent = state.pace;
    $("#groupTime").textContent = "都想" + state.start + "开始";
    $("#groupPace").textContent = "都选择" + state.pace;
    $("#groupPaceNote").textContent = state.pace === "轻松完成" ? "允许补卡，不制造压力" : "每天完整跟练，保持共同节奏";
    $("#matchingTitle").textContent = state.pace === "轻松完成" ? "轻松练习小队" : "每日练习小队";
    $("#matchingRole").textContent = ["想一起开始行动", "愿意分享实践经验", "先观察，再慢慢参与"][state.role];
    $(".group-rule p").textContent = state.role === 2
      ? "先观察也没关系，准备好后随时加入行动。"
      : "不催促、不评判；未打卡不会通知其他成员。";
  }

  function matchSequence() {
    selectedCopy();
    $("#matchingStatus").textContent = "正在寻找" + state.start + "开始的人";
    matchingTimers.push(delay(() => { $("#matchingStatus").textContent = "正在对齐练习节奏"; }, 800));
    matchingTimers.push(delay(() => { $("#matchingStatus").textContent = "正在确认同行意愿"; }, 1600));
    matchingTimers.push(delay(() => { if (state.screen === "matching") showScreen("group"); }, 2600));
  }

  function selectOption(button) {
    const group = button.closest("[data-choice-group]");
    $$("button", group).forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle("is-selected", active);
      candidate.setAttribute("aria-pressed", String(active));
    });
    if (group.dataset.choiceGroup === "start") state.start = button.textContent.trim();
    if (group.dataset.choiceGroup === "pace") state.pace = button.dataset.value;
    if (group.dataset.choiceGroup === "role") state.role = $$("button", group).indexOf(button);
    selectedCopy();
  }

  function showComments(smooth = false) {
    showScreen("note", { keepScroll: true });
    const scroller = $("#noteScroll");
    const anchor = $("#commentsSection");
    const top = scroller.scrollTop + anchor.getBoundingClientRect().top - scroller.getBoundingClientRect().top - 8;
    scroller.scrollTo({ top, behavior: smooth ? "smooth" : "instant" });
    updatePreview("comments");
  }

  function toast(message) {
    window.clearTimeout(toastTimer);
    const el = $("#demoToast");
    el.textContent = message;
    el.hidden = false;
    toastTimer = delay(() => { el.hidden = true; }, 2200);
  }

  function openDialog(title, content) {
    dialogReturnFocus = document.activeElement;
    $("#utilityTitle").textContent = title;
    $("#utilityContent").innerHTML = content;
    $("#utilityOverlay").hidden = false;
    $("#utilityOverlay .icon-button").focus({ preventScroll: true });
  }

  function closeDialog(restoreFocus = true) {
    $("#utilityOverlay").hidden = true;
    if (restoreFocus && dialogReturnFocus?.isConnected) {
      dialogReturnFocus.focus({ preventScroll: true });
    }
  }

  function compose(name = "") {
    replyTo = name;
    openDialog(name ? "回复 " + name : "说点什么", '<textarea class="comment-editor" id="commentEditor" maxlength="300" aria-label="评论内容" placeholder="分享你的真实想法…"></textarea><div class="compose-note"><span>真诚分享，友好互动</span><span id="commentLength">0 / 300</span></div><button class="button button--primary button--wide" id="postComment">发布评论</button>');
    const editor = $("#commentEditor");
    editor.addEventListener("input", () => {
      $("#commentLength").textContent = editor.value.length + " / 300";
    });
    $("#postComment").addEventListener("click", () => {
      const text = editor.value.trim();
      if (!text) { editor.focus(); toast("写一点自己的想法吧"); return; }
      const article = document.createElement("article");
      article.className = "comment-row user-comment";
      article.innerHTML = '<span class="comment-avatar comment-avatar--self"></span><div class="comment-body"><div class="comment-name">我</div><p></p><div class="comment-meta"><span>刚刚</span><button data-compose="我">回复</button><button class="comment-like" aria-label="赞这条评论"><svg><use href="#icon-heart"></use></svg></button><button class="comment-reaction" aria-label="表情回应"><svg><use href="#icon-smile"></use></svg></button></div></div>';
      $("p", article).textContent = (replyTo ? "回复 " + replyTo + "：" : "") + text;
      $("#commentsList").prepend(article);
      state.newComments += 1;
      $("#commentCount").textContent = initialCommentCount + state.newComments;
      $("#footerCommentCount").textContent = initialCommentCount + state.newComments;
      closeDialog(false);
      showComments(true);
      toast("评论已发布");
    });
    editor.focus({ preventScroll: true });
  }

  const helpCopy = {
    info: ["一起试试", "<p>从一篇想实践的笔记出发，找到时间、目标和节奏相近的人。</p><p>一起尝试 7 天，用打卡和鼓励留下共同经历。结束后，你可以自主决定是否继续关注。</p>"],
    rules: ["小队约定", "<p>按自己的节奏参与，不催促，也不评判。</p><p>不公开浏览历史；没打卡时，不会向其他成员发送提醒。</p><p>可以随时离开小队，也可以在计划结束后继续关注同行的人。</p>"],
    share: ["分享这篇笔记", "<p>把这篇笔记分享给朋友，也可以和正在尝试的人一起行动。</p>"],
    voice: ["用声音留下真实感受", "<p>一次小小的尝试，也值得被听见。</p><p>这次先用文字记录，给同行的人留一点鼓励吧。</p>"],
    image: ["记录一次真实的尝试", "<p>分享实践中的发现，帮助下一位看到笔记的人。</p><p>你也可以先用文字，记下今天的感受。</p>"]
  };

  function help(type) {
    const [title, text] = helpCopy[type] || helpCopy.info;
    const isCompose = type === "voice" || type === "image";
    openDialog(title, '<div class="utility-copy">' + text + '</div><button class="button button--primary button--wide" id="utilityConfirm">' + (isCompose ? "写下我的感受" : type === "share" ? "邀请同行的人" : "知道了") + "</button>");
    $("#utilityConfirm").addEventListener("click", () => {
      closeDialog(false);
      if (isCompose) compose();
      if (type === "share") openInvitation();
    });
  }

  function completeToday() {
    if (state.done) return;
    state.done = true;
    $("#todayCard").classList.add("is-complete");
    $("#completeDay").innerHTML = '<svg><use href="#icon-check"></use></svg><span>今天已完成</span>';
    $("#teamCompletedCount").textContent = "2 / 4 已完成";
    $("#completedState").classList.add("is-visible");
    $("#previewFinish").classList.add("is-visible");
    $("#myTeamUpdate").hidden = false;
    delay(() => {
      const scroller = $(".day-scroll");
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }, 120);
  }

  function resetDemo() {
    timers.forEach((id) => window.clearTimeout(id));
    timers.clear();
    matchingTimers = [];
    Object.assign(state, { screen: "note", start: "今晚", pace: "轻松完成", role: 0, saved: false, liked: false, done: false, newComments: 0 });
    $("#saveNote").classList.remove("is-saved");
    $("#saveNote").setAttribute("aria-pressed", "false");
    $("#saveNote span").textContent = "1064";
    $("#likeNote").classList.remove("is-active");
    $("#likeNote").setAttribute("aria-pressed", "false");
    $("#likeNote span").textContent = "969";
    $("#todayCard").classList.remove("is-complete");
    $("#completeDay").innerHTML = '<svg><use href="#icon-check"></use></svg><span>我完成了</span>';
    $("#teamCompletedCount").textContent = "1 / 4 已完成";
    $("#completedState").classList.remove("is-visible");
    $("#previewFinish").classList.remove("is-visible");
    $("#myTeamUpdate").hidden = true;
    $("#demoToast").hidden = true;
    $$(".user-comment").forEach((row) => row.remove());
    $("#commentCount").textContent = String(initialCommentCount);
    $("#footerCommentCount").textContent = String(initialCommentCount);
    $("#nestedReply").hidden = true;
    $("#expandReply span").textContent = "展开 1 条回复";
    $$("[data-choice-group]").forEach((group) => selectOption($("button", group)));
    $$(".follow-toggle, .follow-button").forEach((button) => {
      button.classList.remove("is-followed");
      button.textContent = "关注";
    });
    $$(".comment-like").forEach((button) => button.classList.remove("is-liked"));
    $$(".cheer-button").forEach((button) => {
      button.classList.remove("is-sent");
      button.textContent = "送鼓励";
    });
    showScreen("note");
    selectedCopy();
  }

  $("#saveNote").addEventListener("click", () => {
    state.saved = !state.saved;
    $("#saveNote").classList.toggle("is-saved", state.saved);
    $("#saveNote").setAttribute("aria-pressed", String(state.saved));
    $("#saveNote span").textContent = state.saved ? "1065" : "1064";
    updateStartGuide();
    window.clearTimeout(invitationTimer);
    if (state.saved) invitationTimer = delay(openInvitation, 700);
  });

  $("#saveCoachmark").addEventListener("click", () => $("#saveNote").click());

  $("#likeNote").addEventListener("click", () => {
    state.liked = !state.liked;
    $("#likeNote").classList.toggle("is-active", state.liked);
    $("#likeNote").setAttribute("aria-pressed", String(state.liked));
    $("#likeNote span").textContent = state.liked ? "970" : "969";
  });

  $("#joinAction").addEventListener("click", () => showScreen("goal"));
  $("#dismissNudge").addEventListener("click", () => { closeInvitation(); updatePreview("note"); });
  $("#nudgeBackdrop").addEventListener("click", () => { closeInvitation(); updatePreview("note"); });
  $("#inlineInvite").addEventListener("click", openInvitation);
  $("#goalContinue").addEventListener("click", () => showScreen("intent"));
  $("#startMatching").addEventListener("click", () => showScreen("matching"));
  $("#beginDay").addEventListener("click", () => showScreen("day"));
  $("#completeDay").addEventListener("click", completeToday);
  $("#previewFinish").addEventListener("click", () => showScreen("finish"));
  $("#restartDemo").addEventListener("click", resetDemo);
  $("#finishRestart").addEventListener("click", resetDemo);
  $("#previewNote").addEventListener("click", () => showScreen("note"));
  $("#previewComments").addEventListener("click", () => showComments());
  $("#previewInvitation").addEventListener("click", () => { showScreen("note"); openInvitation(); });
  $("#showComments").addEventListener("click", () => showComments(true));
  $("#mobileStart").addEventListener("click", () => { document.body.classList.add("demo-started"); resetDemo(); });
  $("#backToIntro").addEventListener("click", () => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      document.body.classList.remove("demo-started");
      resetDemo();
    } else {
      showScreen("note");
      toast("已回到笔记开头");
    }
  });

  $$("[data-back]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.back)));
  $$("[data-choice-group] button").forEach((button) => button.addEventListener("click", () => selectOption(button)));
  $$("[data-jump]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.jump)));
  $$(".secondary-button").forEach((button) => button.addEventListener("click", () => showScreen("matching")));
  $$(".follow-toggle, .follow-button").forEach((button) => button.addEventListener("click", () => {
    const followed = button.classList.toggle("is-followed");
    button.textContent = followed ? "已关注" : "关注";
    button.setAttribute("aria-pressed", String(followed));
  }));
  $$(".cheer-button").forEach((button) => button.addEventListener("click", () => {
    if (!state.done) { toast("完成第一次打卡后，就能送出鼓励"); return; }
    button.classList.add("is-sent");
    button.textContent = "已送出";
  }));

  $("#expandReply").addEventListener("click", () => {
    const reply = $("#nestedReply");
    reply.hidden = !reply.hidden;
    $("#expandReply span").textContent = reply.hidden ? "展开 1 条回复" : "收起回复";
  });

  document.addEventListener("click", (event) => {
    const composeButton = event.target.closest("[data-compose]");
    if (composeButton) compose(composeButton.dataset.compose);
    const closeButton = event.target.closest("[data-close-dialog]");
    if (closeButton) closeDialog();
    const helpButton = event.target.closest("[data-help]");
    if (helpButton) help(helpButton.dataset.help);
    const like = event.target.closest(".comment-like");
    if (like) {
      const liked = like.classList.toggle("is-liked");
      like.setAttribute("aria-pressed", String(liked));
    }
    if (event.target.closest(".comment-reaction")) toast("给这条真实分享送出一个微笑");
  });

  $$(".app-header .icon-button, .today-card__top .icon-button").forEach((button) => {
    if (!button.hasAttribute("data-back") && !button.hasAttribute("data-help") && !button.id) {
      button.setAttribute("data-help", button.getAttribute("aria-label") === "更多" ? "rules" : "info");
      if (!button.hasAttribute("aria-label")) button.setAttribute("aria-label", "查看说明");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!$("#utilityOverlay").hidden) closeDialog();
      else { closeInvitation(); updatePreview("note"); }
    }
    if (event.key === "Tab" && !$("#utilityOverlay").hidden) {
      const focusables = $$("button, textarea, input, [tabindex='0']", $("#utilityOverlay"));
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });

  function resizeDevice() {
    if (window.innerWidth > 760) {
      const stage = $(".device-stage");
      const availableHeight = stage.clientHeight - 127;
      const availableWidth = stage.clientWidth - 58;
      const scale = Math.min(1, Math.max(.5, availableHeight / 866), availableWidth / 408);
      document.documentElement.style.setProperty("--device-scale", scale.toFixed(4));
    }
    updateStartGuide();
  }

  window.addEventListener("resize", resizeDevice);
  resetDemo();
  resizeDevice();
})();

(function () {
  "use strict";

  var engine = window.MSTEngine;
  var state = {
    levelIndex: 0, built: null, index: 0, mode: "demo", timer: null,
    score: 0, streak: 0, asked: 0, right: 0, quizTarget: -1, answered: {}
  };
  var HUES = [205, 25, 150, 275, 335, 55, 180, 95];
  var $ = function (id) { return document.getElementById(id); };

  function edgeById(id) {
    var result = null;
    state.built.graph.edges.forEach(function (edge) { if (edge.id === id) result = edge; });
    return result;
  }
  function edgeName(edge) { return engine.edgeName(edge, state.built.graph); }
  function nodeName(index) { return state.built.graph.nodes[index] ? state.built.graph.nodes[index].id : "—"; }
  function svg(tag, attrs) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.keys(attrs || {}).forEach(function (key) { element.setAttribute(key, attrs[key]); });
    return element;
  }
  function textSvg(tag, attrs, text) { var el = svg(tag, attrs); el.textContent = text; return el; }

  function drawGraph() {
    var graph = state.built.graph, root = $("graph");
    root.innerHTML = "";
    var edgeLayer = svg("g", {}), nodeLayer = svg("g", {});
    graph.edges.forEach(function (edge) {
      var a = graph.nodes[edge.u], b = graph.nodes[edge.v];
      edgeLayer.appendChild(svg("line", { x1: a.x, y1: a.y, x2: b.x, y2: b.y, "class": "graph-edge", "data-edge": edge.id }));
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      var weight = svg("g", { "class": "edge-weight", "data-weight": edge.id });
      weight.appendChild(svg("rect", { x: mx - 15, y: my - 13, width: 30, height: 26, rx: 7 }));
      weight.appendChild(textSvg("text", { x: mx, y: my + 1 }, String(edge.w)));
      edgeLayer.appendChild(weight);
    });
    graph.nodes.forEach(function (node, index) {
      var group = svg("g", { "class": "graph-node", "data-node": index });
      group.appendChild(svg("circle", { "class": "node-halo", cx: node.x, cy: node.y, r: 34 }));
      group.appendChild(svg("circle", { "class": "node-circle", cx: node.x, cy: node.y, r: 25 }));
      group.appendChild(textSvg("text", { "class": "node-letter", x: node.x, y: node.y + 1 }, node.id));
      if (node.name) group.appendChild(textSvg("text", { "class": "node-name", x: node.x, y: node.y - 38 }, node.name));
      nodeLayer.appendChild(group);
    });
    root.appendChild(edgeLayer); root.appendChild(nodeLayer);
  }

  function renderGraph(step) {
    var selected = {}, rejected = {}, activeNodes = {};
    step.selected.forEach(function (id) { selected[id] = true; var e = edgeById(id); activeNodes[e.u] = true; activeNodes[e.v] = true; });
    step.rejected.forEach(function (id) { rejected[id] = true; });
    Array.prototype.forEach.call(document.querySelectorAll(".graph-edge"), function (line) {
      var id = line.getAttribute("data-edge");
      line.setAttribute("class", "graph-edge" + (selected[id] ? " tree" : "") + (rejected[id] && !selected[id] ? " reject" : "") + (step.current === id ? " current" : "") + (step.current && step.current !== id && !selected[id] ? " dim" : ""));
    });
    Array.prototype.forEach.call(document.querySelectorAll(".graph-node"), function (group) {
      var index = Number(group.getAttribute("data-node")), on = activeNodes[index];
      if (step.algorithm === "prim") on = step.inTree[index];
      group.setAttribute("class", "graph-node" + (on ? " active" : ""));
      var circle = group.querySelector(".node-circle");
      if (step.algorithm === "kruskal" && step.parent) {
        var root = index;
        while (step.parent[root] !== root) root = step.parent[root];
        circle.style.fill = "hsl(" + HUES[root % HUES.length] + " 75% 90%)";
      } else circle.style.fill = "";
    });
  }

  function renderKruskalData(step) {
    $("leftTitle").textContent = "EDGES · " + (step.kind === "start" ? "輸入順序" : "由小到大排序");
    $("leftNote").textContent = step.processed.length + " / " + step.order.length + " 已看";
    $("rightTitle").textContent = "UNION-FIND · p[x]";
    var selected = {}, rejected = {}, processed = {};
    step.selected.forEach(function (id) { selected[id] = true; }); step.rejected.forEach(function (id) { rejected[id] = true; }); step.processed.forEach(function (id) { processed[id] = true; });
    $("leftData").innerHTML = step.order.map(function (id, index) {
      var edge = edgeById(id), cls = (selected[id] ? "tree " : "") + (rejected[id] ? "reject " : "") + (step.current === id ? "current " : "");
      return '<div class="' + cls + '"><span>#' + (index + 1) + '　' + edgeName(edge) + '</span><b>' + edge.w + '</b></div>';
    }).join("");
    $("rightData").innerHTML = step.parent.map(function (parent, index) {
      return '<div class="parent-cell"><span>p[' + nodeName(index) + ']</span><b>' + nodeName(parent) + '</b></div>';
    }).join("");
  }
  function renderPrimData(step) {
    $("leftTitle").textContent = "PQ · 優先佇列"; $("leftNote").textContent = "最小票在上"; $("rightTitle").textContent = "in[v] · 已在樹裡";
    $("leftData").innerHTML = step.queue.length ? step.queue.map(function (ticket, index) {
      var label = ticket.from < 0 ? "起點 " + nodeName(ticket.v) : nodeName(ticket.from) + "→" + nodeName(ticket.v);
      return '<div class="ticket"><span>#' + (index + 1) + '　' + label + '</span><b>' + ticket.w + '</b></div>';
    }).join("") : '<p class="empty">優先佇列目前是空的</p>';
    $("rightData").innerHTML = step.inTree.map(function (inside, index) {
      return '<div class="parent-cell ' + (inside ? "in" : "") + '"><span>' + nodeName(index) + '</span><b>' + (inside ? "IN" : "OUT") + '</b></div>';
    }).join("");
  }

  function renderCode(step) {
    var algo = step.algorithm, lines = engine.CODE[algo], docs = engine.CODE_DOC[algo];
    $("codeTitle").textContent = (algo === "kruskal" ? "Kruskal" : "Prim") + "——玩到哪，亮到哪";
    $("complexity").textContent = algo === "kruskal" ? "O(E log E)" : "O(E log V)";
    $("codeLines").innerHTML = lines.map(function (line, index) { return '<li class="' + (index === step.line ? "active" : "") + '">' + escapeHtml(line) + '</li>'; }).join("");
    $("codeExplain").textContent = step.line >= 0 && docs[step.line] ? "第 " + (step.line + 1) + " 行｜" + docs[step.line] : "目前是說明步驟，尚未執行任何一行。";
    $("fullCode").textContent = completeCode();
    $("lineDocs").innerHTML = lines.map(function (line, index) { return '<div><b>' + (index + 1) + '</b>' + escapeHtml(docs[index]) + '</div>'; }).join("");
  }
  function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function completeCode() {
    return '#include <bits/stdc++.h>\nusing namespace std;\nusing T = tuple<int,int,int>;\n\n' + engine.CODE.kruskal.join("\n") + '\n\n' + engine.CODE.prim.join("\n");
  }

  function historyItems() {
    var list = state.built.steps.slice(0, state.index + 1).filter(function (step) { return step.kind !== "start"; }).slice(-8);
    return list.length ? list.map(function (step) { return "<li><b>" + step.badge + "</b>　" + escapeHtml(step.title) + "</li>"; }).join("") : "<li>還沒開始。</li>";
  }

  function render() {
    var steps = state.built.steps, step = steps[state.index], algo = step.algorithm;
    $("algoLabel").textContent = algo.toUpperCase(); $("graphTitle").textContent = "地圖＋" + (algo === "kruskal" ? "Kruskal" : "Prim") + " 的資料";
    $("graphNote").textContent = step.kind === "done" ? "完成" : "步驟 " + state.index;
    $("groupLegend").textContent = algo === "kruskal" ? "同色頂點＝同一組" : "綠色頂點＝已在樹裡";
    $("stepBadge").textContent = step.badge; $("stepKind").textContent = "STEP " + String(state.index).padStart(2, "0"); $("stepTitle").textContent = step.title; $("stepText").textContent = step.description;
    $("statsAlgo").textContent = algo === "kruskal" ? "Kruskal" : "Prim"; $("statEdges").textContent = step.selected.length + " / " + step.target; $("statTotal").textContent = step.total;
    $("statAuxLabel").textContent = algo === "kruskal" ? "已看的邊" : "候選票數"; $("statAux").textContent = algo === "kruskal" ? step.processed.length : step.queue.length; $("statRejected").textContent = step.rejected.length;
    $("history").innerHTML = historyItems(); $("stepCount").textContent = state.index + " / " + (steps.length - 1); $("progressBar").style.width = (state.index / (steps.length - 1) * 100) + "%";
    $("prevBtn").disabled = state.index === 0 || state.quizTarget >= 0; $("nextBtn").disabled = state.index === steps.length - 1 || state.quizTarget >= 0; $("playBtn").disabled = state.quizTarget >= 0;
    renderGraph(step); if (algo === "kruskal") renderKruskalData(step); else renderPrimData(step); renderCode(step);
  }

  function stopPlay() { if (state.timer) clearInterval(state.timer); state.timer = null; $("playBtn").textContent = "▶ 自動播放"; }
  function moveTo(index) { state.index = Math.max(0, Math.min(index, state.built.steps.length - 1)); render(); if (state.index === state.built.steps.length - 1) stopPlay(); }
  function quizKey(target) { return state.levelIndex + ":" + target; }
  function findUpcomingQuiz(target) { var step = state.built.steps[target]; return step && step.quiz && !state.answered[quizKey(target)] ? step.quiz : null; }
  function showQuiz(target) {
    var quiz = findUpcomingQuiz(target); if (!quiz) return false;
    state.quizTarget = target; $("quizPanel").hidden = false; $("quizQuestion").textContent = quiz.question; $("quizFeedback").textContent = "";
    var correctText = quiz.options[quiz.answer], options = quiz.options.slice(), rotate = target % options.length;
    options = options.slice(rotate).concat(options.slice(0, rotate));
    $("quizOptions").innerHTML = options.map(function (option) { return '<button data-answer="' + (option === correctText ? "1" : "0") + '">' + escapeHtml(option) + '</button>'; }).join("");
    render(); return true;
  }
  function requestNext() {
    stopPlay(); var target = state.index + 1;
    if (state.mode === "quiz" && showQuiz(target)) return;
    moveTo(target);
  }
  function answerQuiz(button) {
    if (state.quizTarget < 0 || button.disabled) return;
    var correct = button.getAttribute("data-answer") === "1";
    state.asked += 1; if (correct) { state.right += 1; state.streak += 1; state.score += 10 + Math.max(0, state.streak - 1) * 2; button.className = "correct"; $("quizFeedback").textContent = "答對！準備進入這一步。"; }
    else { state.streak = 0; button.className = "wrong"; $("quizFeedback").textContent = "答錯。正確答案已標出，看看原因再繼續。"; Array.prototype.forEach.call($("quizOptions").querySelectorAll('button[data-answer="1"]'), function (item) { item.className = "correct"; }); }
    Array.prototype.forEach.call($("quizOptions").querySelectorAll("button"), function (item) { item.disabled = true; });
    $("score").textContent = state.score; $("streak").textContent = state.streak; $("accuracy").textContent = Math.round(state.right / state.asked * 100) + "%";
    var target = state.quizTarget; state.answered[quizKey(target)] = true; state.quizTarget = -1;
    setTimeout(function () { $("quizPanel").hidden = true; moveTo(target); }, 650);
  }

  function selectLevel(index) {
    stopPlay(); state.levelIndex = index; state.built = engine.build(index); state.index = 0; state.quizTarget = -1; $("quizPanel").hidden = true;
    Array.prototype.forEach.call(document.querySelectorAll(".level-btn"), function (button) { button.classList.toggle("is-on", Number(button.getAttribute("data-level")) === index); });
    drawGraph(); render();
  }
  function setMode(mode) {
    stopPlay(); state.mode = mode; state.quizTarget = -1; $("quizPanel").hidden = true; $("scoreBox").hidden = mode !== "quiz";
    Array.prototype.forEach.call(document.querySelectorAll(".mode-btn"), function (button) { var active = button.getAttribute("data-mode") === mode; button.classList.toggle("is-on", active); button.setAttribute("aria-selected", active ? "true" : "false"); });
    render(); if (mode === "quiz") showQuiz(state.index + 1);
  }
  function bind() {
    $("levelButtons").addEventListener("click", function (event) { var button = event.target.closest("[data-level]"); if (button) selectLevel(Number(button.getAttribute("data-level"))); });
    Array.prototype.forEach.call(document.querySelectorAll(".mode-btn"), function (button) { button.addEventListener("click", function () { setMode(button.getAttribute("data-mode")); }); });
    $("prevBtn").addEventListener("click", function () { stopPlay(); moveTo(state.index - 1); }); $("nextBtn").addEventListener("click", requestNext); $("resetBtn").addEventListener("click", function () { stopPlay(); moveTo(0); });
    $("playBtn").addEventListener("click", function () { if (state.timer) { stopPlay(); return; } if (state.index === state.built.steps.length - 1) moveTo(0); $("playBtn").textContent = "Ⅱ 暫停"; state.timer = setInterval(function () { if (state.mode === "quiz") { stopPlay(); return; } moveTo(state.index + 1); }, 900); });
    $("quizOptions").addEventListener("click", function (event) { var button = event.target.closest("button"); if (button) answerQuiz(button); });
    document.addEventListener("keydown", function (event) { if (/INPUT|SELECT|BUTTON/.test(document.activeElement.tagName)) return; if (event.key === "ArrowRight") { event.preventDefault(); requestNext(); } if (event.key === "ArrowLeft") { event.preventDefault(); stopPlay(); moveTo(state.index - 1); } if (event.code === "Space") { event.preventDefault(); $("playBtn").click(); } });
  }

  function boot() {
    if (!engine) throw new Error("MSTEngine 未載入");
    bind(); selectLevel(0); $("bootNotice").hidden = true; window.__MST_BOOTED__ = true;
    window.MSTGame = { getState: function () { return { level: state.levelIndex, mode: state.mode, step: state.index, steps: state.built.steps.length, score: state.score }; }, selectLevel: selectLevel };
  }
  window.addEventListener("error", function (event) { var notice = $("bootNotice"); if (notice) { notice.hidden = false; notice.textContent = "互動程式載入失敗：" + (event.message || "未知錯誤") + "。請重新整理或查看瀏覽器主控台。"; notice.className = "fatal-notice"; } });
  try { boot(); } catch (error) { var notice = $("bootNotice"); notice.hidden = false; notice.textContent = "互動程式載入失敗：" + error.message + "。"; notice.className = "fatal-notice"; throw error; }
}());

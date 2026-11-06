(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.MSTEngine = api;
}(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var CAMPUS = [
    { id: "A", name: "校門", x: 70, y: 205 },
    { id: "B", name: "圖書館", x: 235, y: 75 },
    { id: "C", name: "餐廳", x: 235, y: 335 },
    { id: "D", name: "系館", x: 445, y: 75 },
    { id: "E", name: "宿舍", x: 445, y: 335 },
    { id: "F", name: "體育館", x: 610, y: 205 }
  ];
  var CAMPUS_EDGES = [
    ["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8],
    ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["E", "F", 3]
  ];
  var TIE_EDGES = [
    ["A", "B", 2], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5], ["C", "D", 8],
    ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["E", "F", 3]
  ];
  var CYCLE_NODES = [
    { id: "A", name: "", x: 120, y: 100 }, { id: "B", name: "", x: 120, y: 315 },
    { id: "C", name: "", x: 390, y: 75 }, { id: "D", name: "", x: 350, y: 290 },
    { id: "E", name: "", x: 605, y: 195 }
  ];
  var CYCLE_EDGES = [
    ["A", "B", 2], ["A", "C", 5], ["A", "D", 4], ["B", "D", 3],
    ["C", "D", 1], ["C", "E", 7], ["D", "E", 6]
  ];
  var FOREST_EDGES = [
    ["A", "B", 3], ["A", "C", 2], ["B", "C", 1],
    ["D", "E", 4], ["D", "F", 5], ["E", "F", 1]
  ];

  var LEVELS = [
    {
      tag: "Kruskal", name: "校園地圖", algo: "kruskal", nodes: CAMPUS, edges: CAMPUS_EDGES,
      intro: "六棟建築要鋪網路線。把邊由小到大檢查，兩端已連通就跳過。",
      finish: "A–B（4）雖然比 B–D（5）便宜，卻會形成 A–C–B 的環，因此最終總重是 13。"
    },
    {
      tag: "Prim·A", name: "從 A 長出去", algo: "prim", start: "A", nodes: CAMPUS, edges: CAMPUS_EDGES,
      intro: "同一張校園地圖，改從 A 校門用 Prim 向外生長。",
      finish: "依序收下 A–C、B–C、B–D、D–E、E–F，總重同樣是 13。"
    },
    {
      tag: "Prim·F", name: "換起點 F", algo: "prim", start: "F", nodes: CAMPUS, edges: CAMPUS_EDGES,
      intro: "從 F 體育館出發，觀察起點改變是否會影響最小總重。",
      finish: "收邊順序改變，但總重仍是 13；Prim 的起點不影響最小總重。"
    },
    {
      tag: "平手", name: "兩棵都最小", algo: "kruskal", nodes: CAMPUS, edges: TIE_EDGES,
      intro: "A–B、A–C、D–E 都是權重 2。平手時依端點字母排序。",
      finish: "A–B 與 A–C 可以互換，得到不同的樹，但總重都等於 13。"
    },
    {
      tag: "成環", name: "一直成環", algo: "kruskal", nodes: CYCLE_NODES, edges: CYCLE_EDGES,
      intro: "兩條邊會因成環被跳過，並示範 find 往上找代表與路徑壓縮。",
      finish: "A–D 與 A–C 被跳過；路徑壓縮會把中途節點直接接到代表。"
    },
    {
      tag: "森林", name: "不連通的圖", algo: "kruskal", nodes: CAMPUS, edges: FOREST_EDGES,
      intro: "圖分成左右兩塊，無法形成一棵涵蓋全部頂點的樹。",
      finish: "最後得到兩棵樹、4 條邊、總重 8，稱為最小生成森林。"
    }
  ];

  var CODE = {
    kruskal: [
      "int p[100];",
      "int find(int x) {",
      "  if (p[x] != x) p[x] = find(p[x]);",
      "  return p[x];",
      "}",
      "int kruskal(int n, vector<Edge> edges) {",
      "  sort(edges.begin(), edges.end());",
      "  for (int x=0; x<n; x++) p[x] = x;",
      "  int total=0, cnt=0;",
      "  for (auto [w,u,v] : edges) {",
      "    int ru=find(u), rv=find(v);",
      "    if (ru == rv) continue;",
      "    if (ru < rv) p[rv]=ru; else p[ru]=rv;",
      "    total += w; cnt++;",
      "    if (cnt == n-1) break;",
      "  }",
      "  return total;",
      "}"
    ],
    prim: [
      "int prim(int n, vector<vector<P>>& adj, int s) {",
      "  vector<bool> in(n, false);",
      "  priority_queue<T, vector<T>, greater<T>> pq;",
      "  pq.push({0, s, -1});",
      "  int total = 0;",
      "  while (!pq.empty()) {",
      "    auto [w,v,from] = pq.top(); pq.pop();",
      "    if (in[v]) continue;",
      "    in[v] = true; total += w;",
      "    for (auto [x,wx] : adj[v])",
      "      if (!in[x]) pq.push({wx,x,v});",
      "  }",
      "  return total;",
      "}"
    ]
  };

  var CODE_DOC = {
    kruskal: [
      "準備併查集 parent 陣列。", "find 的開頭：尋找 x 所屬群組的代表。",
      "若 x 不是代表，遞迴找最上層並做路徑壓縮。", "回傳群組代表。", "find 結束。",
      "Kruskal 函式接收頂點數與所有邊。", "將邊按權重與端點順序排序。",
      "每個頂點一開始各自成組。", "總重與收邊數從 0 開始。", "依序檢查每條邊。",
      "找出邊兩端的代表。", "代表相同表示加入會成環，直接跳過。", "代表不同就合併兩組。",
      "累加權重與收邊數。", "連通圖收滿 V−1 條即可停止。", "回到迴圈。", "回傳總重。", "函式結束。"
    ],
    prim: [
      "Prim 函式接收鄰接表與起點。", "in[v] 記錄頂點是否已進入樹。", "用最小堆積保存候選票。",
      "起點票的成本為 0。", "總重從 0 開始。", "佇列未空就持續處理。", "取出權重最小的票。",
      "頂點已進樹表示是舊票，直接丟棄。", "第一次到達頂點時收邊並累加。", "逐一查看新頂點的鄰居。",
      "把通往樹外頂點的邊放入佇列。", "回到迴圈。", "回傳總重。", "函式結束。"
    ]
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(level) {
    var index = {}, i;
    for (i = 0; i < level.nodes.length; i += 1) index[level.nodes[i].id] = i;
    return {
      nodes: clone(level.nodes),
      edges: level.edges.map(function (item, edgeIndex) {
        var u = index[item[0]], v = index[item[1]];
        return { id: "e" + edgeIndex, u: Math.min(u, v), v: Math.max(u, v), w: item[2] };
      })
    };
  }
  function edgeName(edge, graph) { return graph.nodes[edge.u].id + "–" + graph.nodes[edge.v].id; }
  function sortedEdges(edges) {
    return edges.slice().sort(function (a, b) { return a.w - b.w || a.u - b.u || a.v - b.v; });
  }
  function componentCount(graph) {
    var parent = graph.nodes.map(function (_, i) { return i; });
    function find(x) { while (parent[x] !== x) x = parent[x]; return x; }
    graph.edges.forEach(function (edge) {
      var a = find(edge.u), b = find(edge.v);
      if (a !== b) parent[b] = a;
    });
    var roots = {};
    parent.forEach(function (_, i) { roots[find(i)] = true; });
    return Object.keys(roots).length;
  }
  function quiz(question, options, answer) { return { question: question, options: options, answer: answer }; }
  function uniqueOptions(options) {
    var seen = {};
    return options.filter(function (text) {
      if (!text || seen[text]) return false;
      seen[text] = true;
      return true;
    });
  }

  function buildKruskal(level) {
    var graph = normalize(level), n = graph.nodes.length, order = sortedEdges(graph.edges);
    var parent = graph.nodes.map(function (_, i) { return i; });
    var selected = [], rejected = [], processed = [], steps = [], total = 0, components = componentCount(graph);
    var target = n - components;

    function find(x) {
      var path = [x], current = x, changed = [];
      while (parent[current] !== current) { current = parent[current]; path.push(current); }
      path.slice(0, -1).forEach(function (node) {
        if (parent[node] !== current) { parent[node] = current; changed.push(node); }
      });
      return { root: current, path: path, changed: changed };
    }
    function add(data) {
      steps.push(Object.assign({
        algorithm: "kruskal", parent: parent.slice(), order: order.map(function (e) { return e.id; }),
        selected: selected.slice(), rejected: rejected.slice(), processed: processed.slice(),
        total: total, target: target, current: null, line: -1, quiz: null
      }, data));
    }

    add({ kind: "start", badge: "START", title: "原本的圖：還沒挑任何邊", description: level.intro });
    add({
      kind: "sort", badge: "SORT", title: "把所有邊由小到大排好", line: 6,
      description: "排序後為：" + order.map(function (e) { return edgeName(e, graph) + " " + e.w; }).join("、") + "。",
      quiz: quiz("排序後第一條要檢查哪一條？", uniqueOptions([
        edgeName(order[0], graph) + "（" + order[0].w + "）",
        edgeName(order[order.length - 1], graph) + "（" + order[order.length - 1].w + "）",
        edgeName(order[Math.min(1, order.length - 1)], graph) + "（" + order[Math.min(1, order.length - 1)].w + "）"
      ]), 0)
    });
    add({ kind: "init", badge: "INIT", title: "每個頂點自己一組", line: 7, description: "設定 p[x] = x；目前每個頂點都是自己的代表。" });
    add({
      kind: "init", badge: "COUNT", title: "確認目標邊數", line: 8,
      description: components === 1 ? "連通圖需要 V−1 = " + target + " 條邊。" : "圖有 " + components + " 塊，森林需要 V−塊數 = " + target + " 條邊。",
      quiz: quiz("這一關最後會收幾條邊？", [target + " 條", n + " 條", graph.edges.length + " 條"], 0)
    });

    order.forEach(function (edge, orderIndex) {
      if (selected.length === n - 1) return;
      processed.push(edge.id);
      add({
        kind: "pick", badge: "NEXT", current: edge.id, line: 9,
        title: "第 " + (orderIndex + 1) + " 條：" + edgeName(edge, graph) + "（" + edge.w + "）",
        description: "接著用 find 檢查兩端是否已經屬於同一組。",
        quiz: orderIndex === 0 ? null : quiz("接下來檢查哪一條邊？", uniqueOptions([
          edgeName(edge, graph) + "（" + edge.w + "）",
          order[orderIndex - 1] ? edgeName(order[orderIndex - 1], graph) + "（" + order[orderIndex - 1].w + "）" : "",
          order[orderIndex + 1] ? edgeName(order[orderIndex + 1], graph) + "（" + order[orderIndex + 1].w + "）" : ""
        ]), 0)
      });
      var left = find(edge.u), right = find(edge.v);
      add({
        kind: "find", badge: "FIND", current: edge.id, line: 10,
        findPaths: [left.path, right.path],
        title: "find(" + graph.nodes[edge.u].id + ") = " + graph.nodes[left.root].id + "、find(" + graph.nodes[edge.v].id + ") = " + graph.nodes[right.root].id,
        description: "兩端代表" + (left.root === right.root ? "相同，加入會形成環。" : "不同，可以安全合併。"),
        quiz: quiz("這條邊應該收下還是跳過？", [left.root === right.root ? "跳過：會成環" : "收下：不同組", left.root === right.root ? "收下：權重較小" : "跳過：一定成環"], 0)
      });
      if (left.changed.length || right.changed.length) {
        add({ kind: "path", badge: "PATH", current: edge.id, line: 2, title: "路徑壓縮", description: "把尋找路徑上的節點直接接到代表，下次 find 會更快。" });
      }
      if (left.root === right.root) {
        rejected.push(edge.id);
        add({ kind: "reject", badge: "CYCLE", current: edge.id, line: 11, title: "成環，跳過 " + edgeName(edge, graph), description: "兩端原本就能互相到達，多加這條邊只會造成環與額外成本。" });
      } else {
        var small = Math.min(left.root, right.root), large = Math.max(left.root, right.root);
        parent[large] = small;
        add({ kind: "union", badge: "UNION", current: edge.id, line: 12, title: "合併兩個群組", description: graph.nodes[large].id + " 的代表改成 " + graph.nodes[small].id + "。" });
        selected.push(edge.id); total += edge.w;
        add({
          kind: "take", badge: "TAKE", current: edge.id, line: 13,
          title: "收下 " + edgeName(edge, graph) + "，總重 " + total,
          description: "目前已收 " + selected.length + " / " + target + " 條邊。",
          quiz: quiz("收下後目前總重是多少？", [String(total), String(total - edge.w), String(total + edge.w)], 0)
        });
      }
    });
    add({
      kind: "done", badge: "DONE", line: 16,
      title: components === 1 ? "完成最小生成樹：總重 " + total : "完成最小生成森林：總重 " + total,
      description: level.finish, components: components
    });
    return { graph: graph, steps: steps };
  }

  function ticketCompare(a, b) { return a.w - b.w || a.v - b.v || a.from - b.from; }
  function buildPrim(level) {
    var graph = normalize(level), n = graph.nodes.length, adjacency = graph.nodes.map(function () { return []; });
    graph.edges.forEach(function (edge) {
      adjacency[edge.u].push({ v: edge.v, w: edge.w, edgeId: edge.id });
      adjacency[edge.v].push({ v: edge.u, w: edge.w, edgeId: edge.id });
    });
    adjacency.forEach(function (list) { list.sort(function (a, b) { return a.w - b.w || a.v - b.v; }); });
    var start = 0;
    graph.nodes.forEach(function (node, i) { if (node.id === level.start) start = i; });
    var inTree = graph.nodes.map(function () { return false; }), queue = [], selected = [], rejected = [], processed = [], steps = [], total = 0;
    var target = n - 1;
    function add(data) {
      steps.push(Object.assign({
        algorithm: "prim", inTree: inTree.slice(), queue: clone(queue.slice().sort(ticketCompare)),
        selected: selected.slice(), rejected: rejected.slice(), processed: processed.slice(),
        total: total, target: target, current: null, hand: null, line: -1, quiz: null
      }, data));
    }
    add({ kind: "start", badge: "START", title: "原本的圖：還沒有頂點在樹裡", description: level.intro });
    queue.push({ w: 0, v: start, from: -1, edgeId: null });
    add({ kind: "seed", badge: "PUSH", line: 3, title: "放入起點票 (0, " + graph.nodes[start].id + ", —)", description: "起點不用經過任何邊，成本是 0。" });
    while (queue.length) {
      queue.sort(ticketCompare);
      var ticket = queue.shift();
      if (ticket.edgeId) processed.push(ticket.edgeId);
      add({
        kind: "pop", badge: "POP", line: 6, hand: clone(ticket), current: ticket.edgeId,
        title: ticket.from < 0 ? "取出起點 " + graph.nodes[ticket.v].id : "取出 " + graph.nodes[ticket.from].id + "–" + graph.nodes[ticket.v].id + "（" + ticket.w + "）",
        description: "優先佇列每次取出權重最小的票。",
        quiz: queue.length ? quiz("這次拿出的票權重是多少？", uniqueOptions([String(ticket.w), String(queue[0].w), String(ticket.w + 1)]), 0) : null
      });
      if (inTree[ticket.v]) {
        if (ticket.edgeId) rejected.push(ticket.edgeId);
        add({ kind: "stale", badge: "STALE", line: 7, hand: clone(ticket), current: ticket.edgeId, title: "舊票，直接丟掉", description: graph.nodes[ticket.v].id + " 已經透過其他邊進入樹裡。" });
        continue;
      }
      inTree[ticket.v] = true;
      if (ticket.edgeId) { selected.push(ticket.edgeId); total += ticket.w; }
      add({
        kind: "take", badge: "TAKE", line: 8, hand: clone(ticket), current: ticket.edgeId,
        title: ticket.from < 0 ? graph.nodes[ticket.v].id + " 成為起點" : "收下 " + graph.nodes[ticket.from].id + "–" + graph.nodes[ticket.v].id,
        description: "目前總重 " + total + "，已有 " + selected.length + " / " + target + " 條邊。",
        quiz: ticket.edgeId ? quiz("收邊後總重是多少？", [String(total), String(total - ticket.w), String(total + ticket.w)], 0) : null
      });
      adjacency[ticket.v].forEach(function (next) {
        if (inTree[next.v]) {
          add({ kind: "skip", badge: "SKIP", line: 10, current: next.edgeId, title: "鄰居 " + graph.nodes[next.v].id + " 已在樹裡", description: "不用放入候選票。" });
          return;
        }
        var newTicket = { w: next.w, v: next.v, from: ticket.v, edgeId: next.edgeId };
        queue.push(newTicket);
        add({
          kind: "push", badge: "PUSH", line: 10, current: next.edgeId,
          title: "放入候選票 " + graph.nodes[ticket.v].id + "→" + graph.nodes[next.v].id + "（" + next.w + "）",
          description: graph.nodes[next.v].id + " 還在樹外，這條邊成為候選。"
        });
      });
    }
    add({ kind: "done", badge: "DONE", line: 12, title: "完成最小生成樹：總重 " + total, description: level.finish, components: 1 });
    return { graph: graph, steps: steps };
  }

  function build(levelIndex) {
    var level = LEVELS[levelIndex];
    var result = level.algo === "prim" ? buildPrim(level) : buildKruskal(level);
    result.level = level;
    return result;
  }
  function resultOf(levelIndex) {
    var built = build(levelIndex), last = built.steps[built.steps.length - 1];
    return { total: last.total, selected: last.selected.slice(), components: last.components || 1 };
  }

  return {
    LEVELS: LEVELS,
    CODE: CODE,
    CODE_DOC: CODE_DOC,
    build: build,
    resultOf: resultOf,
    edgeName: edgeName
  };
}));

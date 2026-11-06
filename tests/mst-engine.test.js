const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../js/mst-engine.js");

test("六個關卡資料完整", () => {
  assert.equal(engine.LEVELS.length, 6);
  engine.LEVELS.forEach((level, index) => {
    const built = engine.build(index);
    assert.ok(built.graph.nodes.length >= 5);
    assert.ok(built.graph.edges.length >= 6);
    assert.ok(built.steps.length >= 20);
    assert.equal(built.steps[0].kind, "start");
    assert.equal(built.steps[built.steps.length - 1].kind, "done");
  });
});

test("校園 Kruskal 與兩個 Prim 起點皆得到總重 13", () => {
  assert.equal(engine.resultOf(0).total, 13);
  assert.equal(engine.resultOf(1).total, 13);
  assert.equal(engine.resultOf(2).total, 13);
  assert.equal(engine.resultOf(0).selected.length, 5);
  assert.equal(engine.resultOf(1).selected.length, 5);
  assert.equal(engine.resultOf(2).selected.length, 5);
});

test("平手關仍得到總重 13", () => {
  const result = engine.resultOf(3);
  assert.equal(result.total, 13);
  assert.equal(result.selected.length, 5);
});

test("成環關記錄兩次以上淘汰與路徑壓縮", () => {
  const steps = engine.build(4).steps;
  assert.ok(steps.filter((step) => step.kind === "reject").length >= 2);
  assert.ok(steps.some((step) => step.kind === "path"));
  assert.equal(engine.resultOf(4).total, 12);
});

test("不連通圖得到兩棵樹、4 條邊、總重 8", () => {
  const result = engine.resultOf(5);
  assert.deepEqual(result, { total: 8, selected: ["e2", "e5", "e1", "e3"], components: 2 });
});

test("每個關卡至少產生一道闖關題", () => {
  engine.LEVELS.forEach((_, index) => {
    assert.ok(engine.build(index).steps.some((step) => step.quiz));
  });
});

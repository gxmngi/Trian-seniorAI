import test from "node:test";
import assert from "node:assert/strict";
import { buildDesignSummary } from "./design-agent-summary";

test("creates a readable summary from tool calls", () => {
  const summary = buildDesignSummary([
    { toolName: "addNode", input: { id: "a" } },
    { toolName: "addEdge", input: { id: "e1" } },
    { toolName: "moveNode", input: { id: "a" } },
  ]);

  assert.match(summary, /3 action/);
  assert.match(summary, /created node/);
  assert.match(summary, /connection/);
  assert.match(summary, /moved node/);
});

test("returns a fallback summary when provided", () => {
  const summary = buildDesignSummary([], "Generated a chat architecture draft.");
  assert.equal(summary, "Generated a chat architecture draft.");
});

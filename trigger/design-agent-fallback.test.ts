import test from "node:test";
import assert from "node:assert/strict";
import { buildFallbackDesignActions } from "./design-agent-fallback";

test("buildFallbackDesignActions creates a sensible architecture layout from the prompt", () => {
  const actions = buildFallbackDesignActions("Design a high-scale e-commerce backend with an API gateway, auth, product catalog, and order processing") as Array<{ toolName: string; input: Record<string, unknown> }>;

  assert.ok(actions.length >= 4);
  assert.ok(actions.some((action) => action.toolName === "addNode" && action.input.label === "API Gateway"));
  assert.ok(actions.some((action) => action.toolName === "addNode" && action.input.label === "User Service / Auth"));
  assert.ok(actions.some((action) => action.toolName === "addNode" && action.input.label === "Product Catalog Service"));
  assert.ok(actions.some((action) => action.toolName === "addEdge"));
});

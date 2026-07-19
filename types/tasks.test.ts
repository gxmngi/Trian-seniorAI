import test from "node:test";
import assert from "node:assert/strict";
import { parseAiStatusFeedPayload } from "./tasks";

test("accepts a valid status feed payload with optional text", () => {
  const parsed = parseAiStatusFeedPayload({ text: "Ghost AI is working" });
  assert.deepEqual(parsed, { text: "Ghost AI is working" });
});

test("rejects invalid payloads", () => {
  assert.equal(parseAiStatusFeedPayload({ text: 123 }), null);
  assert.equal(parseAiStatusFeedPayload({ foo: "bar" }), null);
});

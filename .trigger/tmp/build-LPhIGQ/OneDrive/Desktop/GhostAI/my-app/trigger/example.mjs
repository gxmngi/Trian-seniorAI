import {
  task
} from "../../../../../chunk-BKPXB7OI.mjs";
import "../../../../../chunk-ZHBVPOXT.mjs";
import {
  __name,
  init_esm
} from "../../../../../chunk-5A2LE32G.mjs";

// trigger/example.ts
init_esm();
var helloWorld = task({
  id: "hello-world",
  // The run function is executed when the task is triggered
  run: /* @__PURE__ */ __name(async (payload) => {
    console.log(`Hello, ${payload.name}!`);
    return {
      message: `Hello ${payload.name}! Task executed successfully.`
    };
  }, "run")
});
export {
  helloWorld
};
//# sourceMappingURL=example.mjs.map

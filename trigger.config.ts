import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  // Your project ref (found in your dashboard URL or Project Settings)
  project: process.env.TRIGGER_PROJECT_REF || "proj_your_project_ref",
  // The directory where your task files are located
  dirs: ["./trigger"],
  // Runtime configuration
  runtime: "node",
  logLevel: "log",
  maxDuration: 3600,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});

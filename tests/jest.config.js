export default {
  testEnvironment: "node",
  setupFilesAfterEnv: ["./tests/e2e/setup.js"],
  globalTeardown: "./tests/e2e/teardown.js",
  transform: {
    "^.+\\.js$": "jest-esm-transformer"
  }
};



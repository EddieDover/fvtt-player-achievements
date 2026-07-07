// jest-environment-jsdom does not expose Node's structuredClone
// (https://github.com/jsdom/jsdom/issues/3363). Browsers and Foundry have it
// natively; provide a plain-data equivalent for tests.
if (globalThis.structuredClone === undefined) {
  // eslint-disable-next-line unicorn/prefer-structured-clone -- this IS the structuredClone stand-in
  globalThis.structuredClone = (value) => JSON.parse(JSON.stringify(value));
}

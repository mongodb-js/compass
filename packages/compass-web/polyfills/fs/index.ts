export const promises = {
  chmod() {
    return Promise.resolve();
  },
  access() {
    return Promise.reject(new Error('Not supported in browser environment'));
  },
  readFile() {
    return Promise.reject(new Error('Not supported in browser environment'));
  },
};
export function rmSync() {
  // noop
}
export function readFileSync() {
  const c = console;
  c.log('this is the web you cannot read files.');
  // noop
}

export function createWriteStream() {
  throw new Error('Not supported in browser environment');
}

export default { promises, rmSync, readFileSync, createWriteStream };

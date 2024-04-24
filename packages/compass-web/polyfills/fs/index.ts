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
  // noop
}
export default { promises, rmSync, readFileSync };

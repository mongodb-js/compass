export const promises = {
  chmod() {
    return Promise.resolve();
  },
};
export function rmSync() {
  // noop
}
export function readFileSync() {
  // noop
}
export default { promises, rmSync, readFileSync };

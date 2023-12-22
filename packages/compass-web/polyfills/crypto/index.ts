/* global crypto */
export function randomBytes(
  n: number,
  cb: (err: any | null, res?: Buffer) => void
): Buffer | void {
  const vals = crypto.getRandomValues(new Uint32Array(n));
  if (cb) {
    cb(null, Buffer.from(vals));
    return;
  }
  return Buffer.from(vals);
}
export default { randomBytes };

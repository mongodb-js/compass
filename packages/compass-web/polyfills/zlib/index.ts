import { Buffer } from 'buffer';
import init, { compress, decompress } from './zlib_wasm';
import {
  addCompressionStat,
  addDecompressionStat,
} from '../../src/compression-stats';

let initialized = false;
async function initZlib() {
  if (!initialized) {
    await init();
    initialized = true;
  }
}

export function inflate(
  buffer: Uint8Array,
  callback: (err: Error | null, result?: Buffer) => void
): void {
  initZlib()
    .then(() => {
      const start = performance.now();
      const decompressed = decompress(buffer, 0);
      addDecompressionStat(buffer.length, decompressed.length, start);
      callback(null, Buffer.from(decompressed));
    })
    .catch(callback);
}
export function deflate(
  buffer: Uint8Array,
  _opt: { asBuffer: true },
  callback: (err: Error | null, result?: Buffer) => void
): void {
  initZlib()
    .then(() => {
      const start = performance.now();
      const compressed = compress(buffer, 6);
      addCompressionStat(buffer.length, compressed.length, start);
      callback(null, Buffer.from(compressed));
    })
    .catch(callback);
}

export default { inflate, deflate };

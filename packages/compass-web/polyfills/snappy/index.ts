import { Buffer } from 'buffer';
import {
  compress as compressSnappy,
  decompress as decompressSnappy,
} from './snap_wasm';
import {
  addCompressionStat,
  addDecompressionStat,
} from '../../src/compression-stats';

export async function compress(buffer: Uint8Array) {
  const startTime = performance.now();
  const compressed = await compressSnappy(buffer);
  addCompressionStat(buffer.length, compressed.length, startTime);
  return Buffer.from(compressed);
}

export async function uncompress(buffer: Uint8Array) {
  const startTime = performance.now();
  const decompressed = await decompressSnappy(buffer);
  addDecompressionStat(buffer.length, decompressed.length, startTime);
  return Buffer.from(decompressed);
}

export default { compress, uncompress };

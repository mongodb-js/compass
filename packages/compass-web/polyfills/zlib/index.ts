import {
  addCompressionStat,
  addDecompressionStat,
} from '../../src/compression-stats';

const algorithm = 'deflate';

export function inflate(
  buffer: Uint8Array,
  callback: (err: Error | null, result?: Buffer) => void
): void {
  const start = performance.now();
  const ds = new DecompressionStream(algorithm);
  const writer = ds.writable.getWriter();

  (async () => {
    // Start consuming the readable stream immediately to prevent backpressure
    const readPromise = new Response(ds.readable).arrayBuffer();

    await writer.ready;
    await writer.write(Buffer.from(buffer));
    await writer.close();

    const decompressed = await readPromise;
    addDecompressionStat(buffer.length, decompressed.byteLength, start);
    callback(null, Buffer.from(decompressed));
  })().catch(callback);
}
export function deflate(
  buffer: Uint8Array,
  _opt: { asBuffer: true },
  callback: (err: Error | null, result?: Buffer) => void
): void {
  const start = performance.now();
  const cs = new CompressionStream(algorithm);
  const writer = cs.writable.getWriter();

  (async () => {
    // Start consuming the readable stream immediately to prevent backpressure
    const readPromise = new Response(cs.readable).arrayBuffer();

    await writer.ready;
    await writer.write(Buffer.from(buffer));
    await writer.close();

    const compressed = await readPromise;
    addCompressionStat(buffer.length, compressed.byteLength, start);
    callback(null, Buffer.from(compressed));
  })().catch(callback);
}

export default { inflate, deflate };

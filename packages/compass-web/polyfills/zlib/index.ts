const FORMAT = 'deflate';

async function handleStreamCompression(
  stream: GenericTransformStream,
  buffer: Uint8Array
) {
  const writer = stream.writable.getWriter();
  // Start consuming the readable stream immediately to prevent backpressure
  const readPromise = new Response(stream.readable).arrayBuffer();

  await writer.ready;
  await writer.write(Buffer.from(buffer));
  await writer.close();
  const data = await readPromise;
  return Buffer.from(data);
}

export function inflate(
  buffer: Uint8Array,
  callback: (err: Error | null, result?: Buffer) => void
): void {
  handleStreamCompression(new DecompressionStream(FORMAT), buffer)
    .then((result) => callback(null, result))
    .catch(callback);
}
export function deflate(
  buffer: Uint8Array,
  _opt: unknown,
  callback: (err: Error | null, result?: Buffer) => void
): void {
  handleStreamCompression(new CompressionStream(FORMAT), buffer)
    .then((result) => callback(null, result))
    .catch(callback);
}

export default { inflate, deflate };

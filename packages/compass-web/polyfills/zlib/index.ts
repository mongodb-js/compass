type CallbackFunction = (err: Error | null, result?: Buffer) => void;
type CallbackOrOptions = CallbackFunction | Record<string, unknown>;

const FORMAT = 'deflate';

async function pipeBufferThroughTransformStream(
  stream: GenericTransformStream,
  buffer: Uint8Array
): Promise<Buffer> {
  const writer = stream.writable.getWriter();
  // Start consuming the readable stream immediately to prevent backpressure
  const readPromise = new Response(stream.readable).arrayBuffer();

  await writer.ready;
  await writer.write(Buffer.from(buffer));
  await writer.close();
  const data = await readPromise;
  return Buffer.from(data);
}

function getCallback(
  optOrCallback: CallbackOrOptions,
  callback?: CallbackFunction
): CallbackFunction {
  return typeof optOrCallback === 'function' ? optOrCallback : callback!;
}

function runStreamTransform(
  createStream: () => GenericTransformStream,
  buffer: Uint8Array,
  callback: (err: Error | null, result?: Buffer) => void
): void {
  try {
    pipeBufferThroughTransformStream(createStream(), buffer)
      .then((result) => callback(null, result))
      .catch((error) => callback(error));
  } catch (error) {
    callback(error as Error);
  }
}

export function inflate(
  buffer: Uint8Array,
  optOrCallback: CallbackOrOptions,
  callback?: CallbackFunction
): void {
  runStreamTransform(
    () => new DecompressionStream(FORMAT),
    buffer,
    getCallback(optOrCallback, callback)
  );
}
export function deflate(
  buffer: Uint8Array,
  optOrCallback: CallbackOrOptions,
  callback?: CallbackFunction
): void {
  runStreamTransform(
    () => new CompressionStream(FORMAT),
    buffer,
    getCallback(optOrCallback, callback)
  );
}

export default { inflate, deflate };

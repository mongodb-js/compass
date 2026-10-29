import { Readable, Writable } from 'node:stream';

// Readable.fromWeb / Writable.fromWeb can't be used here: readable-stream
// (what `stream` resolves to in compass-web) only ships stubs that throw, and
// Node.js rejects WHATWG streams created by the renderer's DOM.

export function readableFromWeb(stream: ReadableStream<Uint8Array>): Readable {
  const reader = stream.getReader();
  return new Readable({
    read() {
      reader.read().then(
        ({ done, value }) => {
          this.push(done ? null : value);
        },
        (err: Error) => {
          this.destroy(err);
        }
      );
    },
    destroy(err, callback) {
      reader.cancel(err ?? undefined).then(
        () => callback(err),
        () => callback(err)
      );
    },
  });
}

function concatChunks(chunks: { chunk: Uint8Array }[]): Uint8Array {
  const result = new Uint8Array(
    chunks.reduce((length, { chunk }) => length + chunk.byteLength, 0)
  );
  let offset = 0;
  for (const { chunk } of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

export function writableFromWeb(stream: WritableStream<Uint8Array>): Writable {
  const writer = stream.getWriter();
  return new Writable({
    write(chunk: Uint8Array, _encoding, callback) {
      writer.write(chunk).then(() => callback(), callback);
    },
    // Every write to a FileSystemWritableFileStream is a round trip to the
    // browser process, so chunks that queue up behind a pending write are
    // sent as one.
    writev(chunks: { chunk: Uint8Array }[], callback) {
      writer.write(concatChunks(chunks)).then(() => callback(), callback);
    },
    final(callback) {
      writer.close().then(() => callback(), callback);
    },
    destroy(err, callback) {
      if (this.writableFinished) {
        callback(err);
        return;
      }
      // Aborting a FileSystemWritableFileStream discards everything written
      // so far instead of leaving a partial file behind.
      writer.abort(err ?? undefined).then(
        () => callback(err),
        () => callback(err)
      );
    },
  });
}

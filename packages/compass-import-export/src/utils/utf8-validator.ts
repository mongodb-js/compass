import { Transform } from 'node:stream';

// Emits the decoded text rather than the original bytes so that every chunk
// ends on a character boundary: papaparse decodes each chunk on its own and
// would otherwise mangle multi-byte characters split between two chunks.
export class Utf8Validator extends Transform {
  decoder = new TextDecoder('utf8', { fatal: true, ignoreBOM: true });

  _transform(
    chunk: Buffer,
    enc: unknown,
    cb: (err: null | Error, text?: string) => void
  ) {
    let text: string;
    try {
      text = this.decoder.decode(chunk, { stream: true });
    } catch (err: any) {
      cb(err);
      return;
    }
    cb(null, text);
  }

  _flush(cb: (err: null | Error, text?: string) => void) {
    let text: string;
    try {
      text = this.decoder.decode(new Uint8Array());
    } catch (err: any) {
      cb(err);
      return;
    }
    cb(null, text);
  }
}

import { Transform } from 'stream';
import util from 'util';

export class Utf8Validator extends Transform {
  decoder = new util.TextDecoder('utf8', { fatal: true, ignoreBOM: true });

  _transform(
    chunk: Buffer,
    enc: unknown,
    cb: (err: null | Error, chunk?: Buffer) => void
  ) {
    try {
      this.decoder.decode(chunk, { stream: true });
    } catch (err: any) {
      cb(err);
      return;
    }
    cb(null, chunk);
  }

  _flush(cb: (err: null | Error, chunk?: Buffer) => void) {
    try {
      this.decoder.decode(new Uint8Array());
    } catch (err: any) {
      cb(err);
      return;
    }
    cb(null);
  }
}

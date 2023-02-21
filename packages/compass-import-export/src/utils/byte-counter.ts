import { Transform } from 'stream';

export class ByteCounter extends Transform {
  total = 0;

  _transform(
    chunk: Buffer,
    enc: unknown,
    cb: (err: null | Error, chunk?: Buffer) => void
  ) {
    this.total += chunk.length;
    cb(null, chunk);
  }
}

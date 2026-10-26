import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import { Readable, promises as streamPromises } from 'stream';
import { readableFromWeb, writableFromWeb } from './web-streams';

chai.use(chaiAsPromised);

async function collect(readable: Readable): Promise<Buffer[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(chunk);
  }
  return chunks;
}

describe('web-streams', function () {
  describe('readableFromWeb', function () {
    it('emits the bytes of the web stream as Buffers', async function () {
      const webStream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('hello '));
          controller.enqueue(new TextEncoder().encode('world'));
          controller.close();
        },
      });

      const chunks = await collect(readableFromWeb(webStream));

      expect(chunks).to.have.length.greaterThan(0);
      expect(chunks.every((chunk) => Buffer.isBuffer(chunk))).to.equal(true);
      expect(Buffer.concat(chunks).toString('utf8')).to.equal('hello world');
    });

    it('cancels the web stream when destroyed', async function () {
      const cancel = sinon.spy();
      const webStream = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.enqueue(new Uint8Array([1]));
        },
        cancel,
      });
      const readable = readableFromWeb(webStream);

      readable.destroy();
      await streamPromises.finished(readable).catch(() => undefined);

      expect(cancel).to.have.been.calledOnce;
    });

    it('errors when the web stream errors', async function () {
      const webStream = new ReadableStream<Uint8Array>({
        pull(controller) {
          controller.error(new Error('read failed'));
        },
      });

      await expect(collect(readableFromWeb(webStream))).to.be.rejectedWith(
        Error,
        'read failed'
      );
    });
  });

  describe('writableFromWeb', function () {
    let written: string[];
    let close: sinon.SinonSpy;
    let abort: sinon.SinonSpy;
    let webStream: WritableStream<Uint8Array>;

    beforeEach(function () {
      written = [];
      close = sinon.spy();
      abort = sinon.spy();
      webStream = new WritableStream<Uint8Array>({
        async write(chunk) {
          // Resolve on a later tick so that writes queue up behind each other
          // like they do for a real file.
          await new Promise((resolve) => setTimeout(resolve, 1));
          written.push(new TextDecoder().decode(chunk));
        },
        close,
        abort,
      });
    });

    it('writes chunks to the web stream and closes it on end', async function () {
      await streamPromises.pipeline(
        Readable.from(['a', 'b', 'c']),
        writableFromWeb(webStream)
      );

      expect(written.join('')).to.equal('abc');
      expect(close).to.have.been.calledOnce;
      expect(abort).to.not.have.been.called;
    });

    it('batches chunks that queue up while a write is pending', async function () {
      const writable = writableFromWeb(webStream);

      writable.write('a');
      writable.write('b');
      writable.write('c');
      writable.end();
      await streamPromises.finished(writable);

      expect(written).to.deep.equal(['a', 'bc']);
    });

    it('aborts the web stream when destroyed with an error', async function () {
      const writable = writableFromWeb(webStream);
      const error = new Error('export failed');

      writable.destroy(error);
      await expect(streamPromises.finished(writable)).to.be.rejectedWith(error);

      expect(abort).to.have.been.calledOnceWith(error);
      expect(close).to.not.have.been.called;
    });

    it('aborts the web stream when destroyed before it finished', async function () {
      const writable = writableFromWeb(webStream);
      writable.write('a');

      writable.destroy();
      await streamPromises.finished(writable).catch(() => undefined);

      expect(abort).to.have.been.calledOnce;
      expect(close).to.not.have.been.called;
    });
  });
});

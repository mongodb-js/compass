import { expect } from 'chai';
import { EventEmitter } from 'events';
import { listen, onceEvent, waitUntil } from './events';

describe('events', function () {
  describe('listen', function () {
    it('stops calling the listener once disposed', function () {
      const target = new EventTarget();
      const seen: string[] = [];
      const listening = listen(target, 'ping', (event: Event) =>
        seen.push(event.type)
      );
      target.dispatchEvent(new Event('ping'));
      listening[Symbol.dispose]();
      target.dispatchEvent(new Event('ping'));
      expect(seen).to.deep.equal(['ping']);
    });

    it('runs a once listener a single time on an EventTarget', function () {
      const target = new EventTarget();
      let calls = 0;
      listen(target, 'ping', () => calls++, { once: true });
      target.dispatchEvent(new Event('ping'));
      target.dispatchEvent(new Event('ping'));
      expect(calls).to.equal(1);
    });

    it('runs a once listener a single time on an EventEmitter', function () {
      const emitter = new EventEmitter();
      let calls = 0;
      listen(emitter, 'ping', () => calls++, { once: true });
      emitter.emit('ping');
      emitter.emit('ping');
      expect(calls).to.equal(1);
    });

    it('removes a once listener on dispose before it runs', function () {
      const emitter = new EventEmitter();
      const listening = listen(emitter, 'ping', () => undefined, {
        once: true,
      });
      listening[Symbol.dispose]();
      expect(emitter.listenerCount('ping')).to.equal(0);
    });
  });

  describe('onceEvent', function () {
    it('resolves with the event from an EventTarget', async function () {
      const target = new EventTarget();
      const next = onceEvent<[Event]>(target, 'ping');
      const event = new Event('ping');
      target.dispatchEvent(event);
      expect(await next).to.deep.equal([event]);
    });

    it('resolves with the emitted arguments from an EventEmitter', async function () {
      const emitter = new EventEmitter();
      const next = onceEvent(emitter, 'ping');
      emitter.emit('ping', 1, 2);
      expect(await next).to.deep.equal([1, 2]);
      expect(emitter.listenerCount('ping')).to.equal(0);
    });

    it('skips events the filter rejects', async function () {
      const emitter = new EventEmitter();
      const next = onceEvent<[number]>(emitter, 'n', {
        filter: (n) => n > 1,
      });
      emitter.emit('n', 1);
      emitter.emit('n', 2);
      expect(await next).to.deep.equal([2]);
    });

    it('rejects with the reason when the signal aborts', async function () {
      const emitter = new EventEmitter();
      const controller = new AbortController();
      const next = onceEvent(emitter, 'never', { signal: controller.signal });
      controller.abort(new Error('stop'));
      const error = await next.catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
      expect(emitter.listenerCount('never')).to.equal(0);
    });

    it('rejects straight away for an already aborted signal', async function () {
      const error = await onceEvent(new EventEmitter(), 'x', {
        signal: AbortSignal.abort(new Error('already')),
      }).catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'already');
    });
  });

  describe('waitUntil', function () {
    it('resolves with the first value pick returns', async function () {
      const emitter = new EventEmitter();
      const next = waitUntil(emitter, 'n', (n: number) =>
        n > 1 ? `got ${n}` : undefined
      );
      emitter.emit('n', 1);
      emitter.emit('n', 2);
      expect(await next).to.equal('got 2');
    });

    it('rejects when pick throws', async function () {
      const emitter = new EventEmitter();
      const next = waitUntil(emitter, 'n', () => {
        throw new Error('bad message');
      });
      emitter.emit('n', 1);
      const error = await next.catch((err: Error) => err);
      expect(error)
        .to.be.instanceOf(Error)
        .with.property('message', 'bad message');
      expect(emitter.listenerCount('n')).to.equal(0);
    });
  });
});

import { EventEmitter } from 'node:events';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  errorFromEvent,
  listen,
  once,
  abortable,
  addAbortListener,
  cancellableWait,
  waitUntil,
} from './events';

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

  describe('once', function () {
    it('resolves with the event from an EventTarget', async function () {
      const target = new EventTarget();
      const next = once<[Event]>(target, 'ping');
      const event = new Event('ping');
      target.dispatchEvent(event);
      expect(await next).to.deep.equal([event]);
    });

    it('resolves with the emitted arguments from an EventEmitter', async function () {
      const emitter = new EventEmitter();
      const next = once(emitter, 'ping');
      emitter.emit('ping', 1, 2);
      expect(await next).to.deep.equal([1, 2]);
      expect(emitter.listenerCount('ping')).to.equal(0);
    });

    it('rejects with the reason when the signal aborts', async function () {
      const emitter = new EventEmitter();
      const controller = new AbortController();
      const next = once(emitter, 'never', { signal: controller.signal });
      controller.abort(new Error('stop'));
      const error = await next.catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
      expect(emitter.listenerCount('never')).to.equal(0);
    });

    it('rejects straight away for an already aborted signal', async function () {
      const error = await once(new EventEmitter(), 'x', {
        signal: AbortSignal.abort(new Error('already')),
      }).catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'already');
    });
  });

  describe('waitUntil', function () {
    it('resolves with the arguments of the first event the filter accepts', async function () {
      const emitter = new EventEmitter();
      const next = waitUntil(emitter, 'n', (n: number) => n > 1);
      emitter.emit('n', 1);
      emitter.emit('n', 2);
      expect(await next).to.deep.equal([2]);
    });

    it('stops filtering after the first match', async function () {
      const emitter = new EventEmitter();
      const seen: number[] = [];
      const next = waitUntil(emitter, 'n', (n: number) => {
        seen.push(n);
        return true;
      });
      emitter.emit('n', 1);
      emitter.emit('n', 2);
      await next;
      expect(seen).to.deep.equal([1]);
      expect(emitter.listenerCount('n')).to.equal(0);
    });

    it('rejects when the filter throws', async function () {
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

    it('rejects with the reason when the signal aborts', async function () {
      const emitter = new EventEmitter();
      const controller = new AbortController();
      const next = waitUntil(emitter, 'n', () => true, {
        signal: controller.signal,
      });
      controller.abort(new Error('stop'));
      const error = await next.catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
      expect(emitter.listenerCount('n')).to.equal(0);
    });

    it('stops filtering as soon as the signal aborts', async function () {
      const emitter = new EventEmitter();
      const controller = new AbortController();
      const seen: number[] = [];
      const next = waitUntil(
        emitter,
        'n',
        (n: number) => {
          seen.push(n);
          return false;
        },
        { signal: controller.signal }
      );
      controller.abort(new Error('stop'));
      emitter.emit('n', 1);
      const error = await next.catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
      expect(seen).to.deep.equal([]);
    });
  });

  describe('addAbortListener', function () {
    it('calls the listener with the signal as this', function () {
      const controller = new AbortController();
      const reasons: unknown[] = [];
      addAbortListener(controller.signal, function () {
        reasons.push(this.reason);
      });
      controller.abort('stop');
      expect(reasons).to.deep.equal(['stop']);
    });

    it('stops calling the listener once disposed', function () {
      const controller = new AbortController();
      let calls = 0;
      const listening = addAbortListener(controller.signal, () => calls++);
      listening[Symbol.dispose]();
      controller.abort();
      expect(calls).to.equal(0);
    });

    it('returns a disposable for a missing signal', function () {
      const listening = addAbortListener(undefined, () => undefined);
      expect(() => listening[Symbol.dispose]()).to.not.throw();
    });
  });

  describe('abortable', function () {
    const unhandled: unknown[] = [];
    const onUnhandled = (reason: unknown) => unhandled.push(reason);

    beforeEach(function () {
      unhandled.length = 0;
      process.on('unhandledRejection', onUnhandled);
    });

    afterEach(function () {
      process.off('unhandledRejection', onUnhandled);
    });

    it('resolves with the value of the promise without a signal', async function () {
      expect(await abortable(Promise.resolve(42))).to.equal(42);
    });

    it('resolves with the value of the promise', async function () {
      const controller = new AbortController();
      expect(
        await abortable(Promise.resolve(42), { signal: controller.signal })
      ).to.equal(42);
    });

    it('rejects with the reason when the signal aborts first', async function () {
      const controller = new AbortController();
      const pending = abortable(new Promise(() => {}), {
        signal: controller.signal,
      });
      controller.abort(new Error('stop'));
      const error = await pending.catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
    });

    it('rejects with an AbortError DOMException for a default abort', async function () {
      const error = await abortable(new Promise(() => {}), {
        signal: AbortSignal.abort(),
      }).catch((err: Error) => err);
      expect(error)
        .to.be.instanceOf(DOMException)
        .with.property('name', 'AbortError');
    });

    it('prefers an already settled promise over an already aborted signal', async function () {
      expect(
        await abortable(Promise.resolve(42), { signal: AbortSignal.abort() })
      ).to.equal(42);
    });

    it('handles a rejection that arrives after an early abort', async function () {
      const { promise, reject } = Promise.withResolvers<never>();
      const error = await abortable(promise, {
        signal: AbortSignal.abort(new Error('stop')),
      }).catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
      reject(new Error('late'));
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandled).to.deep.equal([]);
    });

    it('prefers an already rejected promise over an already aborted signal', async function () {
      const error = await abortable(Promise.reject(new Error('promise')), {
        signal: AbortSignal.abort(new Error('signal')),
      }).catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'promise');
    });

    it('rejects with the rejection of an already rejected promise', async function () {
      const controller = new AbortController();
      const error = await abortable(Promise.reject(new Error('promise')), {
        signal: controller.signal,
      }).catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'promise');
    });

    it('resolves with the value of an eventually resolving promise', async function () {
      const controller = new AbortController();
      const eventually = new Promise((resolve) => setTimeout(resolve, 1, 42));
      expect(
        await abortable(eventually, { signal: controller.signal })
      ).to.equal(42);
    });

    it('rejects with the rejection of an eventually rejecting promise', async function () {
      const controller = new AbortController();
      const eventually = new Promise((_resolve, reject) =>
        setTimeout(reject, 1, new Error('promise'))
      );
      const error = await abortable(eventually, {
        signal: controller.signal,
      }).catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'promise');
    });

    describe('listener cleanup', function () {
      let controller: AbortController;
      let addSpy: sinon.SinonSpy;
      let removeSpy: sinon.SinonSpy;

      beforeEach(function () {
        controller = new AbortController();
        addSpy = sinon.spy(controller.signal, 'addEventListener');
        removeSpy = sinon.spy(controller.signal, 'removeEventListener');
      });

      afterEach(function () {
        sinon.restore();
      });

      it('removes the abort listener when the promise resolves', async function () {
        await abortable(Promise.resolve(42), { signal: controller.signal });
        expect(addSpy).to.have.been.calledOnce;
        expect(removeSpy).to.have.been.calledOnceWith(
          'abort',
          addSpy.firstCall.args[1]
        );
      });

      it('removes the abort listener when the promise rejects', async function () {
        await abortable(Promise.reject(new Error('promise')), {
          signal: controller.signal,
        }).catch(() => undefined);
        expect(addSpy).to.have.been.calledOnce;
        expect(removeSpy).to.have.been.calledOnceWith(
          'abort',
          addSpy.firstCall.args[1]
        );
      });

      it('removes the abort listener when the signal aborts', async function () {
        const pending = abortable(new Promise(() => {}), {
          signal: controller.signal,
        });
        controller.abort(new Error('stop'));
        await pending.catch(() => undefined);
        expect(addSpy).to.have.been.calledOnce;
        expect(removeSpy).to.have.been.calledOnceWith(
          'abort',
          addSpy.firstCall.args[1]
        );
      });
    });
  });

  describe('cancellableWait', function () {
    let clock: sinon.SinonFakeTimers;

    beforeEach(function () {
      clock = sinon.useFakeTimers();
    });

    afterEach(function () {
      clock.restore();
    });

    it('resolves with the value after the delay', async function () {
      const pending = cancellableWait(100, 'done');
      await clock.tickAsync(100);
      expect(await pending).to.equal('done');
    });

    it('does not resolve before the delay', async function () {
      let settled = false;
      void cancellableWait(100).then(() => (settled = true));
      await clock.tickAsync(99);
      expect(settled).to.equal(false);
    });

    it('rejects with the reason when the signal aborts', async function () {
      const controller = new AbortController();
      const pending = cancellableWait(100, undefined, {
        signal: controller.signal,
      });
      controller.abort(new Error('stop'));
      const error = await pending.catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'stop');
      expect(clock.countTimers()).to.equal(0);
    });

    it('rejects straight away for an already aborted signal', async function () {
      const error = await cancellableWait(100, undefined, {
        signal: AbortSignal.abort(new Error('already')),
      }).catch((err: Error) => err);
      expect(error).to.be.instanceOf(Error).with.property('message', 'already');
      expect(clock.countTimers()).to.equal(0);
    });

    it('removes the abort listener after resolving', async function () {
      const controller = new AbortController();
      const removeSpy = sinon.spy(controller.signal, 'removeEventListener');
      const pending = cancellableWait(100, undefined, {
        signal: controller.signal,
      });
      await clock.tickAsync(100);
      await pending;
      expect(removeSpy).to.have.been.calledOnceWith('abort');
    });
  });

  describe('errorFromEvent', function () {
    it('returns an Error dispatched as the event itself', function () {
      const error = new Error('direct');
      expect(errorFromEvent(error)).to.equal(error);
    });

    it('returns the Error an ErrorEvent carries', function () {
      const error = new Error('carried');
      expect(errorFromEvent({ error, message: 'other' })).to.equal(error);
    });

    it('builds an Error from the message when there is none', function () {
      const error = errorFromEvent({ message: 'only a message' });
      expect(error)
        .to.be.instanceOf(Error)
        .with.property('message', 'only a message');
    });
  });
});

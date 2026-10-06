import { expect } from 'chai';
import { forwardUtilityPorts } from './utility-ports';

// Node.js's MessageEvent only accepts a MessagePort as `source`
function message(init: {
  data: unknown;
  ports?: MessagePort[];
  source?: unknown;
}) {
  return Object.assign(new Event('message'), { ports: [], ...init });
}

describe('forwardUtilityPorts', function () {
  let target: EventTarget;
  let forwarded: unknown[][];
  let forwarding: Disposable;

  beforeEach(function () {
    target = new EventTarget();
    forwarded = [];
    forwarding = forwardUtilityPorts(target as unknown as Window, {
      postMessage: (...args: unknown[]) => forwarded.push(args),
    });
  });

  afterEach(function () {
    forwarding[Symbol.dispose]();
  });

  it('forwards a utility port channel message from its own window', function () {
    const { port1 } = new MessageChannel();
    const data = { type: 'compass:utility:embedded-shell:port' };
    target.dispatchEvent(
      message({
        data,
        ports: [port1],
        source: target,
      })
    );
    expect(forwarded).to.deep.equal([[data.type, data, [port1]]]);
  });

  it('ignores other messages', function () {
    target.dispatchEvent(
      message({
        data: { type: 'something-else' },
        source: target,
      })
    );
    expect(forwarded).to.have.lengthOf(0);
  });

  it('ignores messages from another source', function () {
    target.dispatchEvent(
      message({
        data: { type: 'compass:utility:embedded-shell:port' },
      })
    );
    expect(forwarded).to.have.lengthOf(0);
  });
});

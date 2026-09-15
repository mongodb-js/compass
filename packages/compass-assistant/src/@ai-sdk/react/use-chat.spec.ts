import { expect } from 'chai';
import type { UIMessage } from 'ai';
import {
  MAX_MESSAGES_UPDATE_THROTTLE_MS,
  MESSAGES_UPDATE_THROTTLE_MS,
  throttleWaitFor,
} from './use-chat';

function messageOfLength(length: number): UIMessage {
  return {
    id: 'streaming',
    role: 'assistant',
    parts: [{ type: 'text', text: 'a'.repeat(length) }],
  };
}

describe('throttleWaitFor', function () {
  const base = MESSAGES_UPDATE_THROTTLE_MS;

  it('uses the base wait for an empty chat', function () {
    expect(throttleWaitFor(base, [])).to.equal(base);
  });

  it('uses the base wait for a message that has just started', function () {
    expect(throttleWaitFor(base, [messageOfLength(0)])).to.equal(base);
  });

  it('grows the wait as the streaming message grows', function () {
    const short = throttleWaitFor(base, [messageOfLength(1_000)]);
    const long = throttleWaitFor(base, [messageOfLength(4_000)]);

    expect(short).to.be.greaterThan(base);
    expect(long).to.be.greaterThan(short);
  });

  it('caps the wait for very long messages', function () {
    expect(throttleWaitFor(base, [messageOfLength(8_000)])).to.equal(
      MAX_MESSAGES_UPDATE_THROTTLE_MS
    );
    expect(throttleWaitFor(base, [messageOfLength(500_000)])).to.equal(
      MAX_MESSAGES_UPDATE_THROTTLE_MS
    );
  });

  it('measures only the message being streamed', function () {
    const history = [messageOfLength(50_000), messageOfLength(0)];
    expect(throttleWaitFor(base, history)).to.equal(base);
  });

  it('sums the text parts and ignores other parts', function () {
    const message: UIMessage = {
      id: 'streaming',
      role: 'assistant',
      parts: [
        { type: 'text', text: 'a'.repeat(2_000) },
        { type: 'text', text: 'a'.repeat(2_000) },
        { type: 'source-url', sourceId: 'source', url: 'https://example.com' },
      ],
    };

    expect(throttleWaitFor(base, [message])).to.equal(
      throttleWaitFor(base, [messageOfLength(4_000)])
    );
  });

  it('never returns less than the base wait', function () {
    const wait = throttleWaitFor(MAX_MESSAGES_UPDATE_THROTTLE_MS * 2, [
      messageOfLength(8_000),
    ]);
    expect(wait).to.equal(MAX_MESSAGES_UPDATE_THROTTLE_MS * 2);
  });
});

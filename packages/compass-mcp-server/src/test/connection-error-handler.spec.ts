import { expect } from 'chai';
import { compassConnectionErrorHandler } from '../connection-error-handler';

describe('compassConnectionErrorHandler', function () {
  // The wire-text returned here is what the AI sees when an upstream tool
  // (find/aggregate/count/...) is called without a live MongoDB session.
  // Any change to wording risks confusing the AI into asking the user for
  // a connection string again — the exact regression we wrote this handler
  // to fix. Snapshot a handful of load-bearing phrases.

  function getText() {
    const result = compassConnectionErrorHandler(
      // Inputs aren't used by our handler.
      undefined as never,
      undefined as never
    );
    expect(result.errorHandled).to.equal(true);
    expect(result.result.isError).to.equal(true);
    const block = result.result.content?.[0];
    expect(block?.type).to.equal('text');
    return (block as { text: string }).text;
  }

  it('always handles the error (no fallback to upstream)', function () {
    const result = compassConnectionErrorHandler(
      undefined as never,
      undefined as never
    );
    expect(result.errorHandled).to.equal(true);
  });

  it('returns an isError result so the AI parses it as a tool failure', function () {
    const result = compassConnectionErrorHandler(
      undefined as never,
      undefined as never
    );
    expect(result.result.isError).to.equal(true);
  });

  it('tells the AI to call list-connections first', function () {
    expect(getText()).to.match(/list-connections/);
  });

  it('tells the AI to call connect with a connectionId', function () {
    const text = getText();
    expect(text).to.match(/`connect`/);
    expect(text).to.match(/connectionId/);
  });

  it('explicitly forbids asking for or passing a connection string', function () {
    const text = getText();
    // The two failure modes we observed in practice: AI asks the user for a
    // URI, or AI hallucinates one.
    expect(text).to.match(/do not ask the user for a connection string/i);
    expect(text).to.match(/do not pass\s+a connection string/i);
  });

  it('handles the "no connections saved yet" case explicitly', function () {
    expect(getText()).to.match(/add a connection in Compass first/i);
  });
});

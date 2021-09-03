import createLogger from './';
import { once } from 'events';
import { expect } from 'chai';

describe('createLogger', function() {
  it('creates a logger that forwards log lines as events', async function() {
    const { log, mongoLogId } = createLogger('COMPONENT');
    const logevent = once(process, 'compass:log');

    log.info(mongoLogId(12345), 'ctx', 'message', { attr: 42 });
    const [{line}] = await logevent;
    const parsed = JSON.parse(line);
    expect(parsed.s).to.equal('I');
    expect(parsed.c).to.equal('COMPONENT');
    expect(parsed.id).to.equal(12345);
    expect(parsed.ctx).to.equal('ctx');
    expect(parsed.msg).to.equal('message');
    expect(parsed.attr).to.deep.equal({ attr: 42 });
  });
});

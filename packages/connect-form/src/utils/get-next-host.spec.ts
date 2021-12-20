import { expect } from 'chai';

import { getNextHost } from './get-next-host';

describe('#getNextHost', function () {
  it('should give the next one with one port increased', function () {
    const nextHostname = getNextHost(['localhost:27019'], 0);
    expect(nextHostname).to.equal('localhost:27020');
  });

  it('should give port 27018 when the hostname has no port', function () {
    const nextHostname = getNextHost(['space'], 0);
    expect(nextHostname).to.equal('space:27018');
  });

  it('should give the default port when there are no hosts', function () {
    const nextHostname = getNextHost([], 0);
    expect(nextHostname).to.equal('localhost:27017');
  });

  it('should give the hostname of the index before it', function () {
    const nextHostname = getNextHost(
      ['aaa:27011', 'bbb:28001', 'cccc:28008'],
      1
    );
    expect(nextHostname).to.equal('bbb:28002');
  });

  it('should give the default hostname when the host is empty', function () {
    const nextHostname = getNextHost([''], 0);
    expect(nextHostname).to.equal('localhost:27018');
  });

  it('should give a default port when the port is not a number', function () {
    const nextHostname = getNextHost(['pineapple:27abc014'], 0);
    expect(nextHostname).to.equal('pineapple:27018');
  });

  it('should give a default port when the port has different characters', function () {
    const nextHostname = getNextHost(['pineapple:28:!019'], 0);
    expect(nextHostname).to.equal('pineapple:27018');
  });

  it('should give a default port when there is no port', function () {
    const nextHostname = getNextHost(['pineapple:'], 0);
    expect(nextHostname).to.equal('pineapple:27018');
  });
});

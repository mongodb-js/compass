import { expect } from 'chai';

import { checkForInvalidCharacterInHost } from './check-for-invalid-character-in-host';

describe('#checkForInvalidCharacterInHost', function () {
  it('should return if there is no invalid character in host', function () {
    checkForInvalidCharacterInHost('localhost:27017,', false);
  });

  it('should throw if there is an @ character in a host', function () {
    let errorThrown;
    try {
      checkForInvalidCharacterInHost('aaAA@@aa', false);
    } catch (e) {
      // Expected to throw.
      errorThrown = e.message;
    }

    expect(errorThrown).to.equal("Invalid character in host: '@'");
  });

  it('should throw if there is an , character in an srv hostname', function () {
    let errorThrown;
    try {
      checkForInvalidCharacterInHost('localhost,,', true);
    } catch (e) {
      // Expected to throw.
      errorThrown = e.message;
    }

    expect(errorThrown).to.equal("Invalid character in host: ','");
  });

  it('should throw if there is an : character in an srv hostname', function () {
    let errorThrown;
    try {
      checkForInvalidCharacterInHost('localhost:222', true);
    } catch (e) {
      // Expected to throw.
      errorThrown = e.message;
    }

    expect(errorThrown).to.equal("Invalid character in host: ':'");
  });
});

import { expect } from 'chai';
import { getMongoshCommand } from './mongosh-command';
import { DEFAULT_CONNECTION_STRING_FALLBACK } from './constants';

describe('getMongoshCommand', () => {
  // Invalid URIs cannot reach renderWithActiveConnection; test the fallback directly.
  for (const uri of ['', 'invalid://user:secret@localhost']) {
    it(`uses a safe placeholder for ${
      uri ? 'an invalid' : 'a missing'
    } URI`, () => {
      const result = getMongoshCommand({
        id: 'test',
        connectionOptions: { connectionString: uri },
      });
      expect(result.command).to.equal(
        `mongosh '${DEFAULT_CONNECTION_STRING_FALLBACK}' --file mockdatascript.js`
      );
    });
  }
});

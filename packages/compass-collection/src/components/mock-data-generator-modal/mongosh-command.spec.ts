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
        `mongosh "${DEFAULT_CONNECTION_STRING_FALLBACK}" --file mockdatascript.js`
      );
    });
  }

  const encodings = [
    ['$(value)', '%24(value)'],
    ['`value`', '%60value%60'],
    ['";value', '%22;value'],
    ['\\', '%5C'],
    ['\u201Cvalue\u201D', '%E2%80%9Cvalue%E2%80%9D'],
    [';', ';'],
    ["it's", "it's"],
  ];

  for (const [input, encoded] of encodings) {
    it(`encodes ${JSON.stringify(input)} as ${encoded}`, () => {
      const getCommand = (connectionString: string) =>
        getMongoshCommand({
          id: 'test',
          connectionOptions: { connectionString },
        }).command;

      expect(getCommand(`mongodb://h${input}:27017/`)).to.equal(
        `mongosh "mongodb://h${encoded}:27017/" --file mockdatascript.js`
      );
      expect(getCommand(`mongodb://localhost/db${input}`)).to.equal(
        `mongosh "mongodb://localhost/db${encoded}" --file mockdatascript.js`
      );
      expect(getCommand(`mongodb://localhost/?appName=${input}`)).to.equal(
        `mongosh "mongodb://localhost/?appName=${encoded}" --file mockdatascript.js`
      );
    });
  }

  it('round-trips to the same URI after decoding', () => {
    const { command } = getMongoshCommand({
      id: 'test',
      connectionOptions: {
        connectionString: 'mongodb://localhost/db?appName=$(x)%60\\',
      },
    });
    const quoted = command.match(/^mongosh "([^"]*)"/)?.[1] as string;
    expect(new URL(quoted).searchParams.get('appName')).to.equal('$(x)`\\');
  });
});

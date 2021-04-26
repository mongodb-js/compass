import sinon from 'sinon';
import util from 'util';
import { AceAutocompleterAdapter } from './ace-autocompleter-adapter';
import { expect } from '../../testing/chai';
import { Completion } from '@mongosh/browser-runtime-core';

async function testGetCompletions(adaptee, textBeforeCursor): Promise<Completion[]> {
  const completer = new AceAutocompleterAdapter(adaptee as any);
  const getCompletions = util.promisify(completer.getCompletions.bind(completer));

  const rows = textBeforeCursor.split('\n');
  const prefix = textBeforeCursor.split(/[\. ]/g).pop();

  return await getCompletions(
    null,
    {
      getLine: (i) => rows[i]
    },
    {
      row: rows.length - 1,
      column: rows[rows.length - 1].length
    },
    prefix
  );
}

describe('AceAutocompleterAdapter', () => {
  describe('getCompletions', () => {
    it('calls adaptee.getCompletions with code', async() => {
      const adaptee = {
        getCompletions: sinon.spy(() => Promise.resolve([]))
      };

      await testGetCompletions(adaptee, 'text');

      expect(adaptee.getCompletions).to.have.been.calledWith('text');
    });

    it('calls adaptee.getCompletions with code till cursor', async() => {
      const adaptee = {
        getCompletions: sinon.spy(() => Promise.resolve([]))
      };

      await testGetCompletions(adaptee, 'some text');

      expect(adaptee.getCompletions).to.have.been.calledWith('some text');
    });

    it('passes dots', async() => {
      const adaptee = {
        getCompletions: sinon.spy(() => Promise.resolve([]))
      };

      await testGetCompletions(adaptee, 'some.text');

      expect(adaptee.getCompletions).to.have.been.calledWith('some.text');
    });

    it('only gets cursor line', async() => {
      const adaptee = {
        getCompletions: sinon.spy(() => Promise.resolve([]))
      };

      await testGetCompletions(adaptee, 'this is\nsome text');

      expect(adaptee.getCompletions).to.have.been.calledWith('some text');
    });

    it('converts the completions to the ace format', async() => {
      const adaptee = {
        getCompletions: sinon.spy(() => Promise.resolve([
          {
            completion: 'something to.complete'
          }
        ]))
      };

      const completions = await testGetCompletions(adaptee, 'something to.compl');

      expect(completions[0]).to.deep.equal({
        value: 'complete',
        caption: 'complete'
      });
    });
  });
});


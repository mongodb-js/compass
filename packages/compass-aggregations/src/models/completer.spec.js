import { EditSession } from 'brace';
import ace from 'brace';
import Completer from 'models/completer';
import STAGE_OPERATORS from 'constants/stage-operators';

const { Mode } = ace.acequire('ace/mode/javascript');

describe('Completer', () => {
  const completer = new Completer();
  const editor = sinon.spy();

  describe('#getCompletions', () => {
    context('when no stage operator has been defined', () => {
      context('when the prefix is empty', () => {
        const session = new EditSession('', new Mode());
        const position = { row: 0, column: 0 };

        it('returns all the stage operators', () => {
          completer.getCompletions(editor, session, position, '', (error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal(STAGE_OPERATORS);
          });
        });
      });

      context('when the prefix begins with $', () => {
        const session = new EditSession('{ $', new Mode());
        const position = { row: 0, column: 2 };

        it('returns all the stage operators', () => {
          completer.getCompletions(editor, session, position, '$', (error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal(STAGE_OPERATORS);
          });
        });
      });

      context('when the prefix begins with an unknown', () => {
        const session = new EditSession('{ $notAnOp', new Mode());
        const position = { row: 0, column: 9 };

        it('returns none of the stage operators', () => {
          completer.getCompletions(editor, session, position, '$notAnOp', (error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([]);
          });
        });
      });

      context('when the prefix begins with $a', () => {
        const session = new EditSession('{ $a', new Mode());
        const position = { row: 0, column: 3 };

        it('returns all the stage operators starting with $a', () => {
          completer.getCompletions(editor, session, position, '$a', (error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                name: '$addFields',
                value: '$addFields',
                score: 1,
                meta: 'stage',
                version: '3.4.0'
              }
            ]);
          });
        });
      });

      context('when the prefix begins with $co', () => {
        const session = new EditSession('{ $co', new Mode());
        const position = { row: 0, column: 4 };

        it('returns all the stage operators starting with $co', () => {
          completer.getCompletions(editor, session, position, '$co', (error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                name: '$collStats',
                value: '$collStats',
                score: 1,
                meta: 'stage',
                version: '3.4.0'
              },
              {
                name: '$count',
                value: '$count',
                score: 1,
                meta: 'stage',
                version: '2.2.0'
              }
            ]);
          });
        });
      });

      context('when the prefix begins with $s', () => {
        const session = new EditSession('{ $s', new Mode());
        const position = { row: 0, column: 3 };

        it('returns all the stage operators starting with $s', () => {
          completer.getCompletions(editor, session, position, '$s', (error, results) => {
            expect(error).to.equal(null);
            expect(results).to.deep.equal([
              {
                name: '$sample',
                value: '$sample',
                score: 1,
                meta: 'stage',
                version: '3.2.0'
              },
              {
                name: '$skip',
                value: '$skip',
                score: 1,
                meta: 'stage',
                version: '2.2.0'
              },
              {
                name: '$sort',
                value: '$sort',
                score: 1,
                meta: 'stage',
                version: '2.2.0'
              },
              {
                name: '$sortByCount',
                value: '$sortByCount',
                score: 1,
                meta: 'stage',
                version: '3.4.0'
              }
            ]);
          });
        });
      });
    });
  });

  describe('#getPreviousOperatorTokens', () => {

  });
});

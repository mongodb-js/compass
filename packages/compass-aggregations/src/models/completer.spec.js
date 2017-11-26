import Completer from 'models/completer';
import STAGE_OPERATORS from 'constants/stage-operators';

describe('Completer', () => {
  const completer = new Completer();
  const editor = sinon.spy();
  const session = sinon.spy();

  describe('#getCompletions', () => {
    context('when the prefix is empty', () => {
      it('returns all the stage operators', () => {
        completer.getCompletions(editor, session, 0, '', (error, results) => {
          expect(error).to.equal(null);
          expect(results).to.deep.equal(STAGE_OPERATORS);
        });
      });
    });

    context('when the prefix begins with $', () => {
      it('returns all the stage operators', () => {
        completer.getCompletions(editor, session, 1, '$', (error, results) => {
          expect(error).to.equal(null);
          expect(results).to.deep.equal(STAGE_OPERATORS);
        });
      });
    });

    context('when the prefix begins with an unknown', () => {
      it('returns none of the stage operators', () => {
        completer.getCompletions(editor, session, 1, '$notAnOp', (error, results) => {
          expect(error).to.equal(null);
          expect(results).to.deep.equal([]);
        });
      });
    });

    context('when the prefix begins with $a', () => {
      it('returns all the stage operators starting with $a', () => {
        completer.getCompletions(editor, session, 1, '$a', (error, results) => {
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
      it('returns all the stage operators starting with $co', () => {
        completer.getCompletions(editor, session, 1, '$co', (error, results) => {
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
      it('returns all the stage operators starting with $s', () => {
        completer.getCompletions(editor, session, 1, '$s', (error, results) => {
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

import { parseNamespace } from 'utils/stage';

describe('utils', () => {
  describe('#parseNamespace', () => {
    context('when the stage is only a collection name', () => {
      const stage = {
        isEnabled: true,
        stageOperator: '$merge',
        stage: '"coll"'
      };

      it('returns the namespace', () => {
        expect(parseNamespace('db', stage)).to.equal('db.coll');
      });
    });

    context('when the stage is an object', () => {
      context('when the into field is a string', () => {
        const stage = {
          isEnabled: true,
          stageOperator: '$merge',
          stage: '{ into: "coll" }'
        };

        it('returns the namespace', () => {
          expect(parseNamespace('db', stage)).to.equal('db.coll');
        });
      });

      context('when the into field is an object', () => {
        context('when db is not present', () => {
          const stage = {
            isEnabled: true,
            stageOperator: '$merge',
            stage: '{ into: { coll: "coll" }}'
          };

          it('returns the namespace', () => {
            expect(parseNamespace('db', stage)).to.equal('db.coll');
          });
        });

        context('when db is present', () => {
          const stage = {
            isEnabled: true,
            stageOperator: '$merge',
            stage: '{ into: { db: "test", coll: "coll" }}'
          };

          it('returns the namespace', () => {
            expect(parseNamespace('db', stage)).to.equal('test.coll');
          });
        });
      });
    });
  });
});

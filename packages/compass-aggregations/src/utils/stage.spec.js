import { parseNamespace, filterStageOperators } from './stage';

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

  describe('#filterStageOperators', () => {
    context('when server version < 5.0', () => {
      it('does not return setWindowFields stage', () => {
        const setWindowFields = filterStageOperators('4.9.9')
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(0);
      });
    });

    context('when server version >= 5.0', () => {
      it('does not return setWindowFields stage', () => {
        const setWindowFields = filterStageOperators('5.0.0')
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(1);
      });
    });

    context('when server version is prerelease 5.0', () => {
      it('does not return setWindowFields stage', () => {
        const setWindowFields = filterStageOperators('5.0.0-rc0')
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(1);
      });
    });
  });
});

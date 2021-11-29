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
    const defaultFilter = {
      allowWrites: true,
      env: 'on-prem',
      isTimeSeries: false,
      isReadonly: false,
      sourceName: null,
      serverVersion: '4.2.0'
    };

    context('when server version < 5.0', () => {
      it('does not return setWindowFields stage', () => {
        const setWindowFields = filterStageOperators({ ...defaultFilter })
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(0);
      });
    });

    context('when server version >= 5.0', () => {
      it('returns setWindowFields stage', () => {
        const setWindowFields = filterStageOperators({ ...defaultFilter, serverVersion: '5.0.0' })
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(1);
      });
    });

    context('when server version is prerelease 5.0', () => {
      it('returns setWindowFields stage', () => {
        const setWindowFields = filterStageOperators({ ...defaultFilter, serverVersion: '5.0.0-rc0' })
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(1);
      });
    });

    context('when server version >= 5.1', () => {
      const filter = { ...defaultFilter, serverVersion: '5.1.0' };

      it('returns $search stage for a regular collection', () => {
        const search = filterStageOperators({ ...filter })
          .filter((o) => (o.name === '$search'));

        expect(search.length).to.be.equal(1);
      });

      it('returns $searchMeta stage for a regular collection', () => {
        const searchMeta = filterStageOperators({ ...filter })
          .filter((o) => (o.name === '$searchMeta'));

        expect(searchMeta.length).to.be.equal(1);
      });

      it('returns $documents stage for a regular collection', () => {
        const documents = filterStageOperators({ ...filter })
          .filter((o) => (o.name === '$documents'));

        expect(documents.length).to.be.equal(1);
      });

      it('does not return full-text search stages for time-series on-prem', () => {
        const searchStages = filterStageOperators({ ...filter, isTimeSeries: true })
          .filter((o) => (['$search', '$searchMeta', '$documents'].includes(o.name)));

        expect(searchStages.length).to.be.equal(0);
      });

      it('does not return full-text search stages for time-series on atlas', () => {
        const searchStages = filterStageOperators({ ...filter, isTimeSeries: true, env: 'atlas' })
          .filter((o) => (['$search', '$searchMeta', '$documents'].includes(o.name)));

        expect(searchStages.length).to.be.equal(0);
      });

      it('does not return full-text search stages for views', () => {
        const searchStages = filterStageOperators({ ...filter, isReadonly: true, sourceName: 'simple.sample' })
          .filter((o) => (['$search', '$searchMeta', '$documents'].includes(o.name)));

        expect(searchStages.length).to.be.equal(0);
      });
    });
  });
});

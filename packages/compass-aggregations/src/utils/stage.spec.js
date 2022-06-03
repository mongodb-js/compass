import { parseNamespace, filterStageOperators } from './stage';
import { expect } from 'chai';

describe('utils', function() {
  describe('#parseNamespace', function() {
    context('when the stage is only a collection name', function() {
      const stage = {
        isEnabled: true,
        stageOperator: '$merge',
        stage: '"coll"'
      };

      it('returns the namespace', function() {
        expect(parseNamespace('db', stage)).to.equal('db.coll');
      });
    });

    context('when the stage is an object', function() {
      context('when the into field is a string', function() {
        const stage = {
          isEnabled: true,
          stageOperator: '$merge',
          stage: '{ into: "coll" }'
        };

        it('returns the namespace', function() {
          expect(parseNamespace('db', stage)).to.equal('db.coll');
        });
      });

      context('when the into field is an object', function() {
        context('when db is not present', function() {
          const stage = {
            isEnabled: true,
            stageOperator: '$merge',
            stage: '{ into: { coll: "coll" }}'
          };

          it('returns the namespace', function() {
            expect(parseNamespace('db', stage)).to.equal('db.coll');
          });
        });

        context('when db is present', function() {
          const stage = {
            isEnabled: true,
            stageOperator: '$merge',
            stage: '{ into: { db: "test", coll: "coll" }}'
          };

          it('returns the namespace', function() {
            expect(parseNamespace('db', stage)).to.equal('test.coll');
          });
        });
      });
    });
  });

  describe('#filterStageOperators', function() {
    const defaultFilter = {
      env: 'on-prem',
      isTimeSeries: false,
      isReadonly: false,
      sourceName: null,
      serverVersion: '4.2.0'
    };

    context('when server version < 5.0', function() {
      it('does not return setWindowFields stage', function() {
        const setWindowFields = filterStageOperators({ ...defaultFilter })
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(0);
      });
    });

    context('when server version >= 5.0', function() {
      it('returns setWindowFields stage', function() {
        const setWindowFields = filterStageOperators({ ...defaultFilter, serverVersion: '5.0.0' })
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(1);
      });
    });

    context('when server version is prerelease 5.0', function() {
      it('returns setWindowFields stage', function() {
        const setWindowFields = filterStageOperators({ ...defaultFilter, serverVersion: '5.0.0-rc0' })
          .filter((o) => (o.name === '$setWindowFields'));

        expect(setWindowFields.length).to.be.equal(1);
      });
    });

    context('when server version >= 5.1', function() {
      const filter = { ...defaultFilter, serverVersion: '5.1.0' };

      it('returns $search stage for a regular collection', function() {
        const search = filterStageOperators({ ...filter })
          .filter((o) => (o.name === '$search'));

        expect(search.length).to.be.equal(1);
      });

      it('returns $searchMeta stage for a regular collection', function() {
        const searchMeta = filterStageOperators({ ...filter })
          .filter((o) => (o.name === '$searchMeta'));

        expect(searchMeta.length).to.be.equal(1);
      });

      // $documents only works for db.aggregate, not coll.aggregate
      it('does not return $documents stage for a regular collection', function() {
        const documents = filterStageOperators({ ...filter })
          .filter((o) => (o.name === '$documents'));

        expect(documents.length).to.be.equal(0);
      });

      it('does not return full-text search stages for time-series on-prem', function() {
        const searchStages = filterStageOperators({ ...filter, isTimeSeries: true })
          .filter((o) => (['$search', '$searchMeta', '$documents'].includes(o.name)));

        expect(searchStages.length).to.be.equal(0);
      });

      it('does not return full-text search stages for time-series on atlas', function() {
        const searchStages = filterStageOperators({ ...filter, isTimeSeries: true, env: 'atlas' })
          .filter((o) => (['$search', '$searchMeta', '$documents'].includes(o.name)));

        expect(searchStages.length).to.be.equal(0);
      });

      it('does not return full-text search stages for views', function() {
        const searchStages = filterStageOperators({ ...filter, isReadonly: true, sourceName: 'simple.sample' })
          .filter((o) => (['$search', '$searchMeta', '$documents'].includes(o.name)));

        expect(searchStages.length).to.be.equal(0);
      });
    });

    context('when on-prem', function() {
      it('returns "atlas only" stages', function() {
        const searchStages = filterStageOperators({ ...defaultFilter, env: 'on-prem', serverVersion: '6.0.0' })
          .filter((o) => (['$search', '$searchMeta'].includes(o.name)));

        expect(searchStages.length).to.be.equal(2);
      });

      it('only returns "atlas only" stages matching version', function() {
        const searchStages = filterStageOperators({ ...defaultFilter, env: 'on-prem', serverVersion: '4.2.0' })
          .filter((o) => (['$search', '$searchMeta'].includes(o.name)));

        expect(searchStages.length).to.be.equal(1);
      });

      it('returns $out and $merge', function() {
        const searchStages = filterStageOperators({ ...defaultFilter, env: 'on-prem', serverVersion: '6.0.0' })
          .filter((o) => (['$out', '$merge'].includes(o.name)));

        expect(searchStages.length).to.be.equal(2);
      });
    });

    context('when on ADL', function() {
      it('returns $out and $merge', function() {
        const searchStages = filterStageOperators({ ...defaultFilter, env: 'adl', serverVersion: '6.0.0' })
          .filter((o) => (['$out', '$merge'].includes(o.name)));

        expect(searchStages.length).to.be.equal(2);
      });
    });
  });
});

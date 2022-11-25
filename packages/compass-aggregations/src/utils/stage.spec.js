import { filterStageOperators, findAtlasOperator, getDestinationNamespaceFromStage } from './stage';
import { expect } from 'chai';

describe('utils', function() {
  describe('#filterStageOperators', function() {
    const defaultFilter = {
      env: 'on-prem',
      isTimeSeries: false,
      isReadonly: false,
      preferencesReadOnly: false,
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

    context('when is not a read-only distribution of Compass', function() {
      it('returns output stages if isReadonly is false', function() {
        const searchStages = filterStageOperators({ ...defaultFilter, env: 'adl', serverVersion: '6.0.0', isReadonly: false })
          .filter((o) => (['$out', '$merge'].includes(o.name)));

        expect(searchStages.length).to.be.equal(2);
      });

      it('returns output stages if isReadonly is undefined', function() {
        const searchStages = filterStageOperators({ ...defaultFilter, env: 'adl', serverVersion: '6.0.0' })
          .filter((o) => (['$out', '$merge'].includes(o.name)));

        expect(searchStages.length).to.be.equal(2);
      });
    });

    context('when is a read-only distribution of Compass', function() {
      it('filters out output stages if isEditable is true', function() {
        const searchStages = filterStageOperators({ ...defaultFilter, env: 'adl', serverVersion: '6.0.0', preferencesReadOnly: true })
          .filter((o) => (['$out', '$merge'].includes(o.name)));

        expect(searchStages.length).to.be.equal(0);
      });
    });
  });
  context('findAtlasOperator', function() {
    it('returns atlas only stage operator', function() {
      expect(
        findAtlasOperator(['$search', '$match', '$out', '$searchMeta'])
      ).to.deep.equal('$search');
    });

    it('returns undefined when operators do not have atlas operator', function() {
      expect(
        findAtlasOperator(['$project', '$match', '$out'])
      ).to.deep.equal(undefined);
    })
  });

  context('getDestinationNamespaceFromStage', function() {
    it('returns null when stage is not defined', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users')).to.equal(null);
    });
    it('handles $out stage with scaler value', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users', {
        $out: 'users_out'
      })).to.equal('airbnb.users_out');
    });
    it('handles $out stage with db and coll in object', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users', {
        $out: {
          db: 'another',
          coll: 'users_out'
        }
      })).to.equal('another.users_out');
    });
    it('does not handle $out s3 yet', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users', {
        $out: {
          s3: {}
        }
      })).to.equal(null);
    });
    it('does not handle $out atlas yet', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users', {
        $out: {
          atlas: {}
        }
      })).to.equal(null);
    });

    it('handles $merge stage with scaler value', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users', {
        $merge: 'users_merge'
      })).to.equal('airbnb.users_merge');
    });
    it('handles $merge stage with db and coll in object', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users', {
        $merge: {
          into: {
            db: 'another',
            coll: 'users_merge'
          }
        }
      })).to.equal('another.users_merge');
    });
    it('does not handle $merge atlas yet', function() {
      expect(getDestinationNamespaceFromStage('airbnb.users', {
        $merge: {
          into: {
            atlas: {}
          }
        }
      })).to.equal(null);
    });
  });
});

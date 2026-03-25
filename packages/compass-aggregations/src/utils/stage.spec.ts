import {
  filterStageOperators,
  findAtlasOperator,
  getDestinationNamespaceFromStage,
  getSearchIndexNameFromSearchStage,
  getSearchStageInfoFromPipeline,
} from './stage';
import { expect } from 'chai';

describe('utils', function () {
  describe('#filterStageOperators', function () {
    const defaultFilter = {
      env: 'on-prem',
      isTimeSeries: false,
      preferencesReadOnly: false,
      sourceName: null,
      serverVersion: '4.2.0',
    } as const;

    context('when server version < 5.0', function () {
      it('does not return setWindowFields stage', function () {
        const setWindowFields = filterStageOperators({
          ...defaultFilter,
        }).filter((o) => o.name === '$setWindowFields');

        expect(setWindowFields.length).to.be.equal(0);
      });
    });

    context('when server version >= 5.0', function () {
      it('returns setWindowFields stage', function () {
        const setWindowFields = filterStageOperators({
          ...defaultFilter,
          serverVersion: '5.0.0',
        }).filter((o) => o.name === '$setWindowFields');

        expect(setWindowFields.length).to.be.equal(1);
      });
    });

    context('when server version is prerelease 5.0', function () {
      it('returns setWindowFields stage', function () {
        const setWindowFields = filterStageOperators({
          ...defaultFilter,
          serverVersion: '5.0.0-rc0',
        }).filter((o) => o.name === '$setWindowFields');

        expect(setWindowFields.length).to.be.equal(1);
      });
    });

    context('when server version >= 5.1', function () {
      const filter = { ...defaultFilter, serverVersion: '5.1.0' };

      it('returns $search stage for a regular collection', function () {
        const search = filterStageOperators({ ...filter }).filter(
          (o) => o.name === '$search'
        );

        expect(search.length).to.be.equal(1);
      });

      it('returns $searchMeta stage for a regular collection', function () {
        const searchMeta = filterStageOperators({ ...filter }).filter(
          (o) => o.name === '$searchMeta'
        );

        expect(searchMeta.length).to.be.equal(1);
      });

      it('returns $search stage for a view', function () {
        const search = filterStageOperators({
          ...filter,
          sourceName: 'simple.sample',
        }).filter((o) => o.name === '$search');

        expect(search.length).to.be.equal(1);
      });

      it('returns $searchMeta stage for a view', function () {
        const searchMeta = filterStageOperators({
          ...filter,
          sourceName: 'simple.sample',
        }).filter((o) => o.name === '$searchMeta');

        expect(searchMeta.length).to.be.equal(1);
      });

      // $documents only works for db.aggregate, not coll.aggregate
      it('does not return $documents stage for a regular collection', function () {
        const documents = filterStageOperators({ ...filter }).filter(
          (o) => o.name === '$documents'
        );

        expect(documents.length).to.be.equal(0);
      });

      it('does not return full-text search stages for time-series on-prem', function () {
        const searchStages = filterStageOperators({
          ...filter,
          isTimeSeries: true,
        }).filter((o) =>
          ['$search', '$searchMeta', '$documents'].includes(o.name)
        );

        expect(searchStages.length).to.be.equal(0);
      });

      it('does not return full-text search stages for time-series on atlas', function () {
        const searchStages = filterStageOperators({
          ...filter,
          isTimeSeries: true,
          env: 'atlas',
        }).filter((o) =>
          ['$search', '$searchMeta', '$documents'].includes(o.name)
        );

        expect(searchStages.length).to.be.equal(0);
      });
    });

    context('when on-prem', function () {
      it('returns "atlas only" stages', function () {
        const searchStages = filterStageOperators({
          ...defaultFilter,
          env: 'on-prem',
          serverVersion: '6.0.0',
        }).filter((o) => ['$search', '$searchMeta'].includes(o.name));

        expect(searchStages.length).to.be.equal(2);
      });

      it('only returns "atlas only" stages matching version', function () {
        const searchStages = filterStageOperators({
          ...defaultFilter,
          env: 'on-prem',
          serverVersion: '4.2.0',
        }).filter((o) => ['$search', '$searchMeta'].includes(o.name));

        expect(searchStages.length).to.be.equal(1);
      });

      it('returns $out and $merge', function () {
        const searchStages = filterStageOperators({
          ...defaultFilter,
          env: 'on-prem',
          serverVersion: '6.0.0',
        }).filter((o) => ['$out', '$merge'].includes(o.name));

        expect(searchStages.length).to.be.equal(2);
      });
    });

    context('when on ADL', function () {
      it('returns $out and $merge', function () {
        const searchStages = filterStageOperators({
          ...defaultFilter,
          env: 'adl',
          serverVersion: '6.0.0',
        }).filter((o) => ['$out', '$merge'].includes(o.name));

        expect(searchStages.length).to.be.equal(2);
      });
    });

    context('when is not a read-only distribution of Compass', function () {
      it('returns output stages', function () {
        const searchStages = filterStageOperators({
          ...defaultFilter,
          env: 'adl',
          serverVersion: '6.0.0',
          preferencesReadOnly: false,
        }).filter((o) => ['$out', '$merge'].includes(o.name));

        expect(searchStages.length).to.be.equal(2);
      });
    });

    context('when is a read-only distribution of Compass', function () {
      it('filters out output stages', function () {
        const searchStages = filterStageOperators({
          ...defaultFilter,
          env: 'adl',
          serverVersion: '6.0.0',
          preferencesReadOnly: true,
        }).filter((o) => ['$out', '$merge'].includes(o.name));

        expect(searchStages.length).to.be.equal(0);
      });
    });
  });

  context('findAtlasOperator', function () {
    it('returns atlas only stage operator', function () {
      expect(
        findAtlasOperator([
          '$search',
          '$rankFusion',
          '$match',
          '$out',
          '$searchMeta',
        ])
      ).to.deep.equal('$rankFusion');
    });

    it('returns undefined when operators do not have atlas operator', function () {
      expect(findAtlasOperator(['$project', '$match', '$out'])).to.deep.equal(
        undefined
      );
    });
  });

  context('getDestinationNamespaceFromStage', function () {
    const invalidNamespaces = [
      null,
      undefined,
      '',
      {},
      { db: '', coll: null },
      { db: '', coll: undefined },
      { db: '', coll: '' },
      { db: '', coll: 'users' },
      { db: 'airbnb', coll: '' },
      { db: '', coll: '' },
    ];
    it('returns null when stage is not defined', function () {
      expect(getDestinationNamespaceFromStage('airbnb.users', null)).to.equal(
        null
      );
    });
    context('$out stage', function () {
      it('returns null for invalid stage value', function () {
        const invalidStageValues = [
          null,
          undefined,
          '',
          {},
          ...invalidNamespaces,
        ];
        invalidStageValues.forEach((invalidStageValue) => {
          expect(
            getDestinationNamespaceFromStage('airbnb.users', {
              $merge: invalidStageValue,
            })
          ).to.be.null;
        });
      });
      it('handles $out stage with scaler value', function () {
        expect(
          getDestinationNamespaceFromStage('airbnb.users', {
            $out: 'users_out',
          })
        ).to.equal('airbnb.users_out');
      });
      it('handles $out stage with db and coll in object', function () {
        expect(
          getDestinationNamespaceFromStage('airbnb.users', {
            $out: {
              db: 'another',
              coll: 'users_out',
            },
          })
        ).to.equal('another.users_out');
      });
      it('does not handle $out s3 yet', function () {
        expect(
          getDestinationNamespaceFromStage('airbnb.users', {
            $out: {
              s3: {},
            },
          })
        ).to.equal(null);
      });
      it('does not handle $out atlas yet', function () {
        expect(
          getDestinationNamespaceFromStage('airbnb.users', {
            $out: {
              atlas: {},
            },
          })
        ).to.equal(null);
      });
    });

    context('$merge stage', function () {
      it('returns null for invalid stage value', function () {
        const invalidStageValues = [
          null,
          undefined,
          '',
          {},
          ...invalidNamespaces.map((ns) => ({ into: ns })),
        ];
        invalidStageValues.forEach((invalidStageValue) => {
          expect(
            getDestinationNamespaceFromStage('airbnb.users', {
              $merge: invalidStageValue,
            })
          ).to.be.null;
        });
      });
      it('handles $merge stage with scaler value', function () {
        expect(
          getDestinationNamespaceFromStage('airbnb.users', {
            $merge: 'users_merge',
          })
        ).to.equal('airbnb.users_merge');
      });
      it('handles $merge stage with db and coll in object', function () {
        expect(
          getDestinationNamespaceFromStage('airbnb.users', {
            $merge: {
              into: {
                db: 'another',
                coll: 'users_merge',
              },
            },
          })
        ).to.equal('another.users_merge');
      });
      it('does not handle $merge atlas yet', function () {
        expect(
          getDestinationNamespaceFromStage('airbnb.users', {
            $merge: {
              into: {
                atlas: {},
              },
            },
          })
        ).to.equal(null);
      });
    });
  });

  context('getSearchIndexNameFromSearchStage', function () {
    it('returns null when stageOperator is null', function () {
      expect(
        getSearchIndexNameFromSearchStage(null, '{ index: "myIndex" }')
      ).to.equal(null);
    });

    it('returns null when stageValue is null', function () {
      expect(getSearchIndexNameFromSearchStage('$search', null)).to.equal(null);
    });

    it('returns null when stageOperator is not a search stage', function () {
      expect(
        getSearchIndexNameFromSearchStage('$match', '{ field: "value" }')
      ).to.equal(null);
    });

    it('returns index name from $search stage', function () {
      expect(
        getSearchIndexNameFromSearchStage(
          '$search',
          '{ index: "mySearchIndex", text: { query: "test", path: "field" } }'
        )
      ).to.equal('mySearchIndex');
    });

    it('returns index name from $searchMeta stage', function () {
      expect(
        getSearchIndexNameFromSearchStage(
          '$searchMeta',
          '{ index: "metaIndex", facet: { operator: { text: { query: "test", path: "field" } } } }'
        )
      ).to.equal('metaIndex');
    });

    it('returns index name from $vectorSearch stage', function () {
      expect(
        getSearchIndexNameFromSearchStage(
          '$vectorSearch',
          '{ index: "vectorIndex", path: "embedding", queryVector: [0.1, 0.2], numCandidates: 100, limit: 10 }'
        )
      ).to.equal('vectorIndex');
    });

    it('returns null when index field is missing', function () {
      expect(
        getSearchIndexNameFromSearchStage(
          '$search',
          '{ text: { query: "test", path: "field" } }'
        )
      ).to.equal(null);
    });

    it('returns null when index field is not a string', function () {
      expect(
        getSearchIndexNameFromSearchStage('$search', '{ index: 123 }')
      ).to.equal(null);
    });

    it('returns null when stageValue is invalid BSON', function () {
      expect(
        getSearchIndexNameFromSearchStage('$search', '{ invalid bson }')
      ).to.equal(null);
    });
  });

  context('getSearchStageInfoFromPipeline', function () {
    it('returns null values for empty pipeline', function () {
      expect(getSearchStageInfoFromPipeline('[]')).to.deep.equal({
        searchIndexName: null,
        searchStageOperator: null,
      });
    });

    it('returns null values for invalid pipeline text', function () {
      expect(getSearchStageInfoFromPipeline('not a pipeline')).to.deep.equal({
        searchIndexName: null,
        searchStageOperator: null,
      });
    });

    it('returns null values when pipeline is not an array', function () {
      expect(getSearchStageInfoFromPipeline('{ $match: {} }')).to.deep.equal({
        searchIndexName: null,
        searchStageOperator: null,
      });
    });

    it('returns null values when first stage is not a search stage', function () {
      expect(
        getSearchStageInfoFromPipeline('[{ $match: { field: "value" } }]')
      ).to.deep.equal({
        searchIndexName: null,
        searchStageOperator: null,
      });
    });

    it('returns index name and operator from $search stage', function () {
      expect(
        getSearchStageInfoFromPipeline(
          '[{ $search: { index: "mySearchIndex", text: { query: "test", path: "field" } } }]'
        )
      ).to.deep.equal({
        searchIndexName: 'mySearchIndex',
        searchStageOperator: '$search',
      });
    });

    it('returns index name and operator from $searchMeta stage', function () {
      expect(
        getSearchStageInfoFromPipeline(
          '[{ $searchMeta: { index: "metaIndex", facet: { operator: { text: { query: "test", path: "field" } } } } }]'
        )
      ).to.deep.equal({
        searchIndexName: 'metaIndex',
        searchStageOperator: '$searchMeta',
      });
    });

    it('returns index name and operator from $vectorSearch stage', function () {
      expect(
        getSearchStageInfoFromPipeline(
          '[{ $vectorSearch: { index: "vectorIndex", path: "embedding", queryVector: [0.1, 0.2], numCandidates: 100, limit: 10 } }]'
        )
      ).to.deep.equal({
        searchIndexName: 'vectorIndex',
        searchStageOperator: '$vectorSearch',
      });
    });

    it('returns index name and operator when search stage is followed by other stages', function () {
      expect(
        getSearchStageInfoFromPipeline(
          '[{ $search: { index: "myIndex", text: { query: "test", path: "field" } } }, { $limit: 10 }]'
        )
      ).to.deep.equal({
        searchIndexName: 'myIndex',
        searchStageOperator: '$search',
      });
    });

    it('returns null values when search stage is not the first stage', function () {
      expect(
        getSearchStageInfoFromPipeline(
          '[{ $match: { active: true } }, { $search: { index: "myIndex", text: { query: "test", path: "field" } } }]'
        )
      ).to.deep.equal({
        searchIndexName: null,
        searchStageOperator: null,
      });
    });

    it('returns null searchIndexName when index field is missing', function () {
      expect(
        getSearchStageInfoFromPipeline(
          '[{ $search: { text: { query: "test", path: "field" } } }]'
        )
      ).to.deep.equal({
        searchIndexName: null,
        searchStageOperator: '$search',
      });
    });

    it('returns null searchIndexName when index field is not a string', function () {
      expect(
        getSearchStageInfoFromPipeline('[{ $search: { index: 123 } }]')
      ).to.deep.equal({
        searchIndexName: null,
        searchStageOperator: '$search',
      });
    });
  });
});

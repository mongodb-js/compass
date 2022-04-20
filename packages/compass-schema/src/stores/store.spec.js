import configureStore from '.';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';

import { ANALYSIS_STATE_INITIAL } from '../constants/analysis-states';

describe('Schema Store', function () {
  describe('#configureStore', function () {
    let store;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();
    const dataService = 'test';
    const namespace = 'db.coll';

    beforeEach(function () {
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        namespace: namespace,
      });
    });

    afterEach(function () {
      store = null;
    });

    it('sets the local app registry', function () {
      expect(store.localAppRegistry).to.equal(localAppRegistry);
    });

    it('sets the global app registry', function () {
      expect(store.globalAppRegistry).to.equal(globalAppRegistry);
    });

    it('sets the data provider', function () {
      expect(store.dataService).to.equal(dataService);
    });

    it('sets the namespace', function () {
      expect(store.ns).to.equal(namespace);
    });

    it('defaults analysis state to initial', function () {
      expect(store.state.analysisState).to.equal(ANALYSIS_STATE_INITIAL);
    });

    it('defaults the error to empty', function () {
      expect(store.state.errorMessage).to.equal('');
    });

    it('defaults max time ms to the default', function () {
      expect(store.query.maxTimeMS).to.equal(60000);
    });

    it('defaults the schema to null', function () {
      expect(store.state.schema).to.equal(null);
    });
  });

  context('when query change events are emitted', function () {
    let store;
    const localAppRegistry = new AppRegistry();
    const filter = { name: 'test' };
    const limit = 50;
    const project = { name: 1 };

    beforeEach(function () {
      store = configureStore({ localAppRegistry: localAppRegistry });
      localAppRegistry.emit('query-changed', {
        filter: filter,
        limit: limit,
        project: project,
      });
    });

    afterEach(function () {
      store = null;
    });

    it('sets the filter', function () {
      expect(store.query.filter).to.deep.equal(filter);
    });

    it('sets the limit', function () {
      expect(store.query.limit).to.deep.equal(limit);
    });

    it('sets the project', function () {
      expect(store.query.project).to.deep.equal(project);
    });
  });

  context('schema analysis tracking', function () {
    let store;

    beforeEach(function () {
      store = configureStore();
    });

    it('calculates the correct depth of schema', function () {
      let schema = {
        fields: [],
      };
      expect(store.calculateSchemaDepth(schema)).to.equal(0);

      schema = {
        fields: [
          {
            type: 'String',
            path: 'name',
            types: [
              {
                bsonType: 'String',
                path: 'name',
              },
            ],
          },
        ],
      };
      expect(store.calculateSchemaDepth(schema)).to.equal(1);

      schema = {
        fields: [
          {
            path: 'tags',
            type: 'Array',
            types: [
              {
                bsonType: 'Array',
                path: 'tags',
                types: [
                  {
                    bsonType: 'Double',
                    path: 'tags',
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(store.calculateSchemaDepth(schema)).to.equal(2);

      schema = {
        fields: [
          {
            name: 'location',
            path: 'location',
            types: [
              {
                bsonType: 'Document',
                path: 'location',
                fields: [
                  {
                    name: 'coordinates',
                    path: 'location.coordinates',
                    types: [
                      {
                        bsonType: 'Array',
                        path: 'location.coordinates',
                        types: [
                          {
                            bsonType: 'Double',
                            path: 'location.coordinates',
                          },
                        ],
                      },
                    ],
                    type: 'Array',
                  },
                  {
                    name: 'type',
                    path: 'location.type',
                    types: [
                      {
                        bsonType: 'String',
                        path: 'location.type',
                      },
                    ],
                    type: 'String',
                  },
                ],
              },
            ],
            type: 'Document',
          },
        ],
      };
      expect(store.calculateSchemaDepth(schema)).to.equal(3);

      schema = {
        fields: [
          {
            name: 'location',
            path: 'location',
            types: [
              {
                bsonType: 'Document',
                path: 'location',
                fields: [
                  {
                    name: 'coordinates',
                    path: 'location.coordinates',
                    types: [
                      {
                        bsonType: 'Array',
                        path: 'location.coordinates',
                        types: [
                          {
                            bsonType: 'Double',
                            path: 'location.coordinates',
                          },
                        ],
                      },
                    ],
                    type: 'Array',
                  },
                  {
                    name: 'type',
                    path: 'location.type',
                    types: [
                      {
                        bsonType: 'String',
                        path: 'location.type',
                      },
                    ],
                    type: 'String',
                  },
                ],
              },
            ],
            type: 'Document',
          },
          {
            path: 'investments',
            types: [
              {
                bsonType: 'Array',
                path: 'investments',
                types: [
                  {
                    bsonType: 'Document',
                    path: 'investments',
                    fields: [
                      {
                        path: 'investments.funding_round',
                        types: [
                          {
                            bsonType: 'Document',
                            path: 'investments.funding_round',
                            fields: [
                              {
                                path: 'investments.funding_round.company',
                                types: [
                                  {
                                    bsonType: 'Document',
                                    path: 'investments.funding_round.company',
                                    fields: [
                                      {
                                        path: 'investments.funding_round.company.name',
                                        types: [
                                          {
                                            bsonType: 'String',
                                            path: 'investments.funding_round.company.name',
                                          },
                                        ],
                                      },
                                      {
                                        path: 'investments.funding_round.company.permalink',
                                        types: [
                                          {
                                            bsonType: 'String',
                                            path: 'investments.funding_round.company.permalink',
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                                type: 'Document',
                              },
                              {
                                path: 'investments.funding_round.funded_day',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.funded_day',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.funded_day',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.funded_month',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.funded_month',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.funded_month',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.funded_year',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.funded_year',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.funded_year',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.raised_amount',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.raised_amount',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.raised_amount',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.raised_currency_code',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.raised_currency_code',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.raised_currency_code',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.round_code',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.round_code',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.source_description',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.source_description',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.source_url',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.source_url',
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            type: 'Array',
          },
        ],
      };
      expect(store.calculateSchemaDepth(schema)).to.equal(4);
    });

    it('checks if schema contains geo data', function () {
      let schema = {
        fields: [],
      };
      expect(store.schemaContainsGeoData(schema)).to.be.false;

      schema = {
        fields: [
          {
            type: 'String',
            path: 'name',
            types: [
              {
                bsonType: 'String',
                path: 'name',
              },
            ],
          },
        ],
      };
      expect(store.schemaContainsGeoData(schema)).to.be.false;

      schema = {
        fields: [
          {
            path: 'tags',
            type: 'Array',
            types: [
              {
                bsonType: 'Array',
                path: 'tags',
                types: [
                  {
                    bsonType: 'Double',
                    path: 'tags',
                  },
                ],
              },
            ],
          },
        ],
      };
      expect(store.schemaContainsGeoData(schema)).to.false;

      schema = {
        fields: [
          {
            name: 'location',
            path: 'location',
            types: [
              {
                bsonType: 'Document',
                path: 'location',
                fields: [
                  {
                    name: 'coordinates',
                    path: 'location.coordinates',
                    types: [
                      {
                        bsonType: 'Array',
                        path: 'location.coordinates',
                        types: [
                          {
                            bsonType: 'Double',
                            path: 'location.coordinates',
                          },
                        ],
                      },
                    ],
                    type: 'Array',
                  },
                  {
                    name: 'type',
                    path: 'location.type',
                    types: [
                      {
                        bsonType: 'String',
                        path: 'location.type',
                        values: ['Point', 'Point'],
                      },
                    ],
                    type: 'String',
                  },
                ],
              },
            ],
            type: 'Document',
          },
        ],
      };
      expect(store.schemaContainsGeoData(schema)).to.true;

      schema = {
        fields: [
          {
            name: 'location',
            path: 'location',
            types: [
              {
                bsonType: 'Document',
                path: 'location',
                fields: [
                  {
                    name: 'coordinates',
                    path: 'location.coordinates',
                    types: [
                      {
                        bsonType: 'Array',
                        path: 'location.coordinates',
                        types: [
                          {
                            bsonType: 'Double',
                            path: 'location.coordinates',
                          },
                        ],
                      },
                    ],
                    type: 'Array',
                  },
                  {
                    name: 'type',
                    path: 'location.type',
                    types: [
                      {
                        bsonType: 'String',
                        path: 'location.type',
                        values: [
                          'LineString',
                          'LineString',
                          'LineString',
                          null,
                          undefined,
                          123,
                        ],
                      },
                    ],
                    type: 'String',
                  },
                ],
              },
            ],
            type: 'Document',
          },
          {
            path: 'investments',
            types: [
              {
                bsonType: 'Array',
                path: 'investments',
                types: [
                  {
                    bsonType: 'Document',
                    path: 'investments',
                    fields: [
                      {
                        path: 'investments.funding_round',
                        types: [
                          {
                            bsonType: 'Document',
                            path: 'investments.funding_round',
                            fields: [
                              {
                                path: 'investments.funding_round.company',
                                types: [
                                  {
                                    bsonType: 'Document',
                                    path: 'investments.funding_round.company',
                                    fields: [
                                      {
                                        path: 'investments.funding_round.company.name',
                                        types: [
                                          {
                                            bsonType: 'String',
                                            path: 'investments.funding_round.company.name',
                                          },
                                        ],
                                      },
                                      {
                                        path: 'investments.funding_round.company.permalink',
                                        types: [
                                          {
                                            bsonType: 'String',
                                            path: 'investments.funding_round.company.permalink',
                                          },
                                        ],
                                      },
                                    ],
                                  },
                                ],
                                type: 'Document',
                              },
                              {
                                path: 'investments.funding_round.funded_day',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.funded_day',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.funded_day',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.funded_month',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.funded_month',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.funded_month',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.funded_year',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.funded_year',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.funded_year',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.raised_amount',
                                types: [
                                  {
                                    bsonType: 'Int32',
                                    path: 'investments.funding_round.raised_amount',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.raised_amount',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.raised_currency_code',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.raised_currency_code',
                                  },
                                  {
                                    bsonType: 'Null',
                                    path: 'investments.funding_round.raised_currency_code',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.round_code',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.round_code',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.source_description',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.source_description',
                                  },
                                ],
                              },
                              {
                                path: 'investments.funding_round.source_url',
                                types: [
                                  {
                                    bsonType: 'String',
                                    path: 'investments.funding_round.source_url',
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
            type: 'Array',
          },
        ],
      };
      expect(store.schemaContainsGeoData(schema)).to.true;
    });
  });
});

import { expect } from 'chai';
import {
  getRouteFromWorkspaceTab,
  getWorkspaceTabFromRoute,
} from './url-builder';

describe('url builder helpers', function () {
  describe('getWorkspaceTabFromRoute', function () {
    const specs = [
      ['Welcome', '/', null],
      ['Databases', '/Cluster0', null],
      ['Collections', '/Cluster0/%23db', { namespace: '#db' }],
      ['Collection', '/Cluster0/%23db/coll', { namespace: '#db.coll' }],
      [
        'Collection',
        '/Cluster0/%23db/coll/find',
        { namespace: '#db.coll', initialSubtab: 'Documents' },
      ],
      [
        'Collection',
        '/Cluster0/%23db/coll/aggregation',
        { namespace: '#db.coll', initialSubtab: 'Aggregations' },
      ],
      [
        'Collection',
        '/Cluster0/%23db/coll/schema',
        { namespace: '#db.coll', initialSubtab: 'Schema' },
      ],
      [
        'Collection',
        '/Cluster0/%23db/coll/indexes',
        { namespace: '#db.coll', initialSubtab: 'Indexes' },
      ],
      [
        'Collection',
        '/Cluster0/%23db/coll/validation',
        { namespace: '#db.coll', initialSubtab: 'Validation' },
      ],
      ['Collection', '/Cluster0/%23db/coll/foobar', { namespace: '#db.coll' }],
    ] as const;

    for (const [type, route, extraParams] of specs) {
      it(`should return ${type} workspace when initial route is ${route}`, function () {
        expect(getWorkspaceTabFromRoute(route)).to.deep.eq({
          type,
          ...(type !== 'Welcome' && { connectionId: 'Cluster0' }),
          ...extraParams,
        });
      });
    }
  });

  describe('getRouteFromWorkspaceTab', function () {
    const specs = [
      ['/', { type: 'Welcome' }],
      ['/Cluster0', { type: 'Databases' }],
      ['/Cluster0/db', { type: 'Collections', namespace: 'db' }],
      ['/Cluster0/db/%23coll', { type: 'Collection', namespace: 'db.#coll' }],
      [
        '/Cluster0/db/%23coll/find',
        { type: 'Collection', namespace: 'db.#coll', subTab: 'Documents' },
      ],
      [
        '/Cluster0/db/%23coll/aggregation',
        { type: 'Collection', namespace: 'db.#coll', subTab: 'Aggregations' },
      ],
      [
        '/Cluster0/db/%23coll/schema',
        { type: 'Collection', namespace: 'db.#coll', subTab: 'Schema' },
      ],
      [
        '/Cluster0/db/%23coll/indexes',
        { type: 'Collection', namespace: 'db.#coll', subTab: 'Indexes' },
      ],
      [
        '/Cluster0/db/%23coll/validation',
        { type: 'Collection', namespace: 'db.#coll', subTab: 'Validation' },
      ],
      [
        '/Cluster0/db/%23coll',
        { type: 'Collection', namespace: 'db.#coll', subTab: 'FooBar' },
      ],
    ] as const;

    for (const [route, workspace] of specs) {
      it(`should return ${route} route when workspace is ${workspace.type}`, function () {
        expect(
          getRouteFromWorkspaceTab(
            workspace.type === 'Welcome'
              ? workspace
              : ({ ...workspace, connectionId: 'Cluster0' } as any)
          )
        ).to.eq(route);
      });
    }
  });
});

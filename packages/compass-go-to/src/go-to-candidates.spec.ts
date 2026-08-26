import { expect } from 'chai';
import { buildGoToCandidates } from './go-to-candidates';

describe('buildGoToCandidates', function () {
  it('includes databases and collections only for connected connections', function () {
    const connections = [
      { id: 'c1', title: 'Prod', status: 'connected' },
      { id: 'c2', title: 'Staging', status: 'disconnected' },
    ];
    const instances = new Map([
      [
        'c1',
        {
          databases: [
            {
              name: 'admin',
              collections: [
                { name: 'users', type: 'collection' },
                { name: 'roles', type: 'view' },
              ],
            },
          ],
        },
      ],
      [
        'c2',
        {
          databases: [
            {
              name: 'should-not-appear',
              collections: [{ name: 'ghost', type: 'collection' }],
            },
          ],
        },
      ],
    ]);

    const candidates = buildGoToCandidates(connections, instances);

    expect(candidates.map((c) => c.id)).to.deep.equal([
      'connection:c1',
      'database:c1:admin',
      'collection:c1:admin.users',
      'collection:c1:admin.roles',
      'connection:c2',
    ]);
    expect(candidates.find((c) => c.id === 'database:c1:admin')).to.include({
      primary: 'admin',
      secondary: 'Prod',
    });
    expect(
      candidates.find((c) => c.id === 'collection:c1:admin.roles')
    ).to.include({
      primary: 'roles',
      secondary: 'admin · Prod',
      collectionType: 'view',
      namespace: 'admin.roles',
    });
    expect(candidates.find((c) => c.id === 'connection:c2')).to.include({
      primary: 'Staging',
      connected: false,
      secondary: '',
    });
  });

  it('skips nested inventory when a connected connection has no instance yet', function () {
    const candidates = buildGoToCandidates(
      [{ id: 'c1', title: 'Local', status: 'connected' }],
      new Map()
    );

    expect(candidates).to.deep.equal([
      {
        id: 'connection:c1',
        kind: 'connection',
        connectionId: 'c1',
        primary: 'Local',
        secondary: '',
        connected: true,
      },
    ]);
  });
});

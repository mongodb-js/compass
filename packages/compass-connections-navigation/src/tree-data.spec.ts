import { expect } from 'chai';
import { getVirtualTreeItems } from './tree-data';
import type { NotConnectedConnection } from './tree-data';

function makeConnection(
  id: string,
  name: string,
  groupId?: string
): NotConnectedConnection {
  return {
    name,
    connectionStatus: 'disconnected',
    connectionInfo: {
      id,
      connectionOptions: { connectionString: `mongodb://${name}` },
      favorite: { name, ...(groupId ? { groupId } : {}) },
      savedConnectionType: 'favorite',
    },
  };
}

const defaultsForGetItems = {
  preferencesReadOnly: false,
  preferencesReadWrite: false,
  preferencesShellEnabled: true,
};

describe('getVirtualTreeItems with connection groups', function () {
  it('renders a flat list when grouping is disabled', function () {
    const items = getVirtualTreeItems({
      connections: [
        makeConnection('c1', 'alpha', 'g1'),
        makeConnection('c2', 'beta'),
      ],
      groupsById: { g1: { id: 'g1', name: 'prod' } },
      expandedItems: {},
      expandedGroups: {},
      enableConnectionGroups: false,
      ...defaultsForGetItems,
    });
    expect(items.map((item) => item.type)).to.deep.equal([
      'connection',
      'connection',
    ]);
  });

  it('groups by groupId and resolves name + colorCode from the groups map', function () {
    const items = getVirtualTreeItems({
      connections: [makeConnection('c1', 'a', 'g1'), makeConnection('c2', 'b')],
      groupsById: { g1: { id: 'g1', name: 'prod', color: 'color1' } },
      expandedItems: {},
      expandedGroups: {},
      enableConnectionGroups: true,
      ...defaultsForGetItems,
    });
    const header = items.find((i) => i.type === 'group') as any;
    expect(header.id).to.equal('group:g1');
    expect(header.groupId).to.equal('g1');
    expect(header.name).to.equal('prod');
    expect(header.groupName).to.equal('prod');
    expect(header.colorCode).to.equal('color1');
    // ungrouped connection 'b' still at root
    expect(items.find((i: any) => i.name === 'b')?.level).to.equal(1);
    // grouped connection 'a' indented under the group
    expect(items.find((i: any) => i.name === 'a')?.level).to.equal(2);
  });

  it('sorts groups by resolved name and hides a collapsed group', function () {
    const items = getVirtualTreeItems({
      connections: [
        makeConnection('c1', 'a', 'g2'),
        makeConnection('c2', 'b', 'g1'),
      ],
      groupsById: {
        g1: { id: 'g1', name: 'alpha' },
        g2: { id: 'g2', name: 'zeta' },
      },
      expandedItems: {},
      expandedGroups: { g2: false },
      enableConnectionGroups: true,
      ...defaultsForGetItems,
    });
    const headers = items.filter((i) => i.type === 'group') as any[];
    expect(headers.map((h) => h.name)).to.deep.equal(['alpha', 'zeta']); // sorted by resolved name
    // g2 collapsed → its connection 'a' hidden
    expect(items.find((i: any) => i.name === 'a')).to.be.undefined;
  });

  it('renders a flat list when grouping disabled', function () {
    const items = getVirtualTreeItems({
      connections: [makeConnection('c1', 'a', 'g1')],
      groupsById: { g1: { id: 'g1', name: 'prod' } },
      expandedItems: {},
      expandedGroups: {},
      enableConnectionGroups: false,
      ...defaultsForGetItems,
    });
    expect(items.every((i) => i.type !== 'group')).to.equal(true);
  });

  it('indents grouped connections one level deeper', function () {
    const items = getVirtualTreeItems({
      connections: [
        makeConnection('c1', 'grouped', 'g1'),
        makeConnection('c2', 'plain'),
      ],
      groupsById: { g1: { id: 'g1', name: 'prod' } },
      expandedItems: {},
      expandedGroups: {},
      enableConnectionGroups: true,
      ...defaultsForGetItems,
    });
    const grouped = items.find((i: any) => i.name === 'grouped') as any;
    const plain = items.find((i: any) => i.name === 'plain') as any;
    const header = items.find((i) => i.type === 'group') as any;
    expect(header.level).to.equal(1);
    expect(grouped.level).to.equal(2);
    expect(plain.level).to.equal(1);
  });

  it('hides connections of a collapsed group', function () {
    const items = getVirtualTreeItems({
      connections: [makeConnection('c1', 'grouped', 'g1')],
      groupsById: { g1: { id: 'g1', name: 'prod' } },
      expandedItems: {},
      expandedGroups: { g1: false },
      enableConnectionGroups: true,
      ...defaultsForGetItems,
    });
    expect(items).to.have.lengthOf(1);
    expect(items[0].type).to.equal('group');
    expect((items[0] as any).isExpanded).to.equal(false);
  });

  it('falls back to the groupId as the header name when the group is not in the map', function () {
    const items = getVirtualTreeItems({
      connections: [makeConnection('c1', 'grouped', 'g-unknown')],
      groupsById: {},
      expandedItems: {},
      expandedGroups: {},
      enableConnectionGroups: true,
      ...defaultsForGetItems,
    });
    const header = items.find((i) => i.type === 'group') as any;
    expect(header.id).to.equal('group:g-unknown');
    expect(header.name).to.equal('g-unknown');
    expect(header.colorCode).to.equal(undefined);
  });
});

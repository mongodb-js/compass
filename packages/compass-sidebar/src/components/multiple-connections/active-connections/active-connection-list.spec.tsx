import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import type { ConnectionInfo } from '@mongodb-js/connection-info';
import { ActiveConnectionList } from './active-connection-list';

const mockConnections: ConnectionInfo[] = [
  {
    id: 'turtle',
    connectionOptions: {
      connectionString: 'mongodb://turtle',
    },
    savedConnectionType: 'recent',
  },
  {
    id: 'oranges',
    connectionOptions: {
      connectionString: 'mongodb://peaches',
    },
    favorite: {
      name: 'peaches',
    },
    savedConnectionType: 'favorite',
  },
];

describe('<ActiveConnectionList />', function () {
  let useActiveConnections: () => ConnectionInfo[];

  beforeEach(() => {
    useActiveConnections = () => mockConnections;
    render(
      <ActiveConnectionList testUseActiveConnections={useActiveConnections} />
    );
  });

  it('Should render all active connections - using their correct titles', function () {
    expect(screen.queryByText('turtle')).to.be.visible;
    expect(screen.queryByText('peaches')).to.be.visible;
  });
});

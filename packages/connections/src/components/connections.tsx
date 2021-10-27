/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import { useState } from 'react';
import { spacing } from '@mongodb-js/compass-components';
import ConnectForm from '@mongodb-js/connect-form';
import { ConnectionInfo } from 'mongodb-data-service';

import ConnectionList from './connection-list/connection-list';
import FormHelp from './form-help/form-help';

const connectStyles = css({
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  top: 0,
  display: 'flex',
  flexDirection: 'row',
  background: '#f5f6f7',
});

const formContainerStyles = css({
  position: 'relative',
  flexGrow: 1,
  padding: 0,
  paddingBottom: spacing[4],
  overflow: 'auto',
});

const mockRecents: ConnectionInfo[] = [];
for (let i = 0; i < 25; i++) {
  mockRecents.push({
    connectionOptions: {
      connectionString: `mongodb://localhost:2${
        5000 + Math.floor(Math.random() * 5000)
      }`,
    },
    lastUsed: new Date(Date.now() - (Date.now() / 2) * Math.random()),
  });
}

const mockConnections = [
  {
    connectionOptions: {
      connectionString: '',
    },
    favorite: {
      name: 'Development cluster',
      color: '#deb342',
    },
    lastUsed: new Date(),
  },
  {
    connectionOptions: {
      connectionString:
        'mongodb+srv://testUserForTesting:notMyRealPassword@test.mongodb.net/test?authSource=admin&replicaSet=art-dev-shard-0&readPreference=primary&ssl=true',
    },
    favorite: {
      name: 'Atlas test',
      color: '#d4366e',
    },
    lastUsed: new Date(),
  },
  {
    connectionOptions: {
      connectionString: '',
    },
    favorite: {
      name: 'super long favorite name - super long favorite name - super long favorite name - super long favorite name',
      color: '#5fc86e',
    },
    lastUsed: new Date(),
  },
  {
    connectionOptions: {
      connectionString: 'invalid connection string',
    },
    lastUsed: new Date(),
  },
  ...mockRecents,
];

function Connections(): React.ReactElement {
  return (
    <div css={connectStyles}>
      <ConnectionList connections={mockConnections} />
      <div css={formContainerStyles}>
        <ConnectForm
          onConnectClicked={() => alert(`connect to ${'ok'}`)}
          initialConnectionInfo={{
            connectionOptions: {
              connectionString:
                'mongodb+srv://testUserForTesting:notMyRealPassword@test.mongodb.net/test?authSource=admin&replicaSet=art-dev-shard-0&readPreference=primary&ssl=true',
            },
            favorite: {
              name: 'Atlas test',
              color: '#326fde',
            },
            lastUsed: new Date(),
          }}
        />
        <FormHelp />
      </div>
    </div>
  );
}

export default Connections;

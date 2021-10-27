/** @jsx jsx */
import { css, jsx } from '@emotion/react';
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
});

const mockRecents: ConnectionInfo[] = [];
for (let i = 0; i < 25; i++) {
  mockRecents.push({
    connectionOptions: {
      connectionString: `localhost:2${5000 + Math.floor(Math.random() * 5000)}`,
    },
    lastUsed: new Date(Date.now() - (Date.now() / 2) * Math.random()),
  });
}

function Connections(): React.ReactElement {
  return (
    <div css={connectStyles}>
      <ConnectionList
        connections={[
          {
            connectionOptions: {
              connectionString: '',
            },
            favorite: {
              name: 'Development cluster',
              color: '#326fde',
            },
            lastUsed: new Date(),
          },
          {
            connectionOptions: {
              connectionString: '',
            },
            favorite: {
              name: 'super long favorite name - super long favorite name - super long favorite name - super long favorite name',
              color: '#3b8196',
            },
            lastUsed: new Date(),
          },
          {
            connectionOptions: {
              connectionString: 'localhost:27017',
            },
            lastUsed: new Date(),
          },
          ...mockRecents,
        ]}
      />
      <div css={formContainerStyles}>
        <ConnectForm onConnectClicked={() => alert(`connect to ${'ok'}`)} />
        <FormHelp />
      </div>
    </div>
  );
}

export default Connections;

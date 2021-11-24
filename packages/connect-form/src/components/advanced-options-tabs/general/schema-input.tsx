import React from 'react';
import {
  Description,
  Label,
  RadioBox,
  RadioBoxGroup,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

// import { useConnectionStringContext } from '../../../contexts/connection-string-context';

enum MONGODB_SCHEMA {
  MONGODB = 'MONGODB',
  MONGODB_SRV = 'MONGODB_SRV',
}

const regularSchemaDescription =
  'Standard Connection String Format. The standard format of the MongoDB connection URI is used to connect to a MongoDB deployment: standalone, replica set, or a sharded cluster.';
const srvSchemaDescription =
  'DNS Seed List Connection Format. The +srv indicates to the client that the hostname that follows corresponds to a DNS SRV record.';

function SchemaInput({
  connectionStringUrl,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  // const [{ connectionStringUrl }, { setConnectionString }] =
  //   useConnectionStringContext();

  const { isSRV } = connectionStringUrl;

  return (
    <>
      <Label htmlFor="connection-schema-radio-box-group">Schema</Label>
      <RadioBoxGroup
        id="connection-schema-radio-box-group"
        value={isSRV ? MONGODB_SCHEMA.MONGODB_SRV : MONGODB_SCHEMA.MONGODB}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          // TODO: Assign default or always have connection string.
          // TODO: Maybe have a more distinct place for this conversion?
          if (event.target.value === MONGODB_SCHEMA.MONGODB) {
            if (!isSRV) {
              // Skip if already not srv (re-clicked option).
              return;
            }

            const newConnectionString = connectionStringUrl.toString();

            const newConnectionStringUrl = new ConnectionStringUrl(
              newConnectionString.replace('mongodb+srv://', 'mongodb://')
            );

            newConnectionStringUrl.hosts = [
              `${newConnectionStringUrl.hosts[0]}:27017`,
            ];

            // Chose regular schema.
            // TODO: Add port if not exists (coming from srv)

            setConnectionStringUrl(newConnectionStringUrl);
          } else {
            let newConnectionStringUrl = connectionStringUrl.clone();
            // Only include one host without port.
            newConnectionStringUrl.hosts = [
              newConnectionStringUrl.hosts[0].substring(
                0,
                newConnectionStringUrl.hosts[0].indexOf(':') === -1
                  ? undefined
                  : newConnectionStringUrl.hosts[0].indexOf(':')
              ),
            ];
            const newConnectionString = newConnectionStringUrl.toString();

            newConnectionStringUrl = new ConnectionStringUrl(
              newConnectionString.replace('mongodb://', 'mongodb+srv://')
            );

            if (newConnectionStringUrl.searchParams.get('directConnection')) {
              newConnectionStringUrl.searchParams.delete('directConnection');
            }

            // Chose srv.
            // TODO:
            // Remove additional hosts if they exist.
            // Remove port.
            // Remove direct connection
            // setConnectionStringUrl(
            //   new ConnectionStringUrl(
            //     newConnectionString.replace('mongodb://', 'mongodb+srv://')
            //   )
            // );
            // setConnectionStringUrl(
            //   new ConnectionStringUrl('mongodb+srv://one,two,three')
            // );
            setConnectionStringUrl(newConnectionStringUrl);
          }
          // TODO: Ensure it's a valid connection string first? try catch?
        }}
      >
        <RadioBox value={MONGODB_SCHEMA.MONGODB}>mongodb</RadioBox>
        <RadioBox value={MONGODB_SCHEMA.MONGODB_SRV}>mongodb+srv</RadioBox>
      </RadioBoxGroup>
      <Description>
        {isSRV ? srvSchemaDescription : regularSchemaDescription}
      </Description>
    </>
  );
}

export default SchemaInput;

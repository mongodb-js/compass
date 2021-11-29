import React from 'react';
import {
  Description,
  Label,
  RadioBox,
  RadioBoxGroup,
} from '@mongodb-js/compass-components';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { defaultHostname } from '../../../constants/default-connection';

enum MONGODB_SCHEMA {
  MONGODB = 'MONGODB',
  MONGODB_SRV = 'MONGODB_SRV',
}

const regularSchemaDescription =
  'Standard Connection String Format. The standard format of the MongoDB connection URI is used to connect to a MongoDB deployment: standalone, replica set, or a sharded cluster.';
const srvSchemaDescription =
  'DNS Seed List Connection Format. The +srv indicates to the client that the hostname that follows corresponds to a DNS SRV record.';

function updateConnectionStringToStandard(
  connectionStringUrl: ConnectionStringUrl
): ConnectionStringUrl {
  if (!connectionStringUrl.isSRV) {
    // Already is standard schema, nothing to do.
    return connectionStringUrl;
  }

  const newConnectionString = connectionStringUrl.toString();

  const newConnectionStringUrl = new ConnectionStringUrl(
    newConnectionString.replace('mongodb+srv://', 'mongodb://')
  );

  newConnectionStringUrl.hosts = [`${newConnectionStringUrl.hosts[0]}:27017`];

  return newConnectionStringUrl;
}

function updateConnectionStringToSRV(
  connectionStringUrl: ConnectionStringUrl
): ConnectionStringUrl {
  if (connectionStringUrl.isSRV) {
    // Already is srv schema, nothing to do.
    return connectionStringUrl;
  }

  let newConnectionStringUrl = connectionStringUrl.clone();

  // Only include one host without port.
  const newHost =
    newConnectionStringUrl.hosts.length > 0
      ? newConnectionStringUrl.hosts[0].substring(
          0,
          newConnectionStringUrl.hosts[0].indexOf(':') === -1
            ? undefined
            : newConnectionStringUrl.hosts[0].indexOf(':')
        )
      : defaultHostname;
  newConnectionStringUrl.hosts = [newHost];

  const newConnectionString = newConnectionStringUrl.toString();
  newConnectionStringUrl = new ConnectionStringUrl(
    newConnectionString.replace('mongodb://', 'mongodb+srv://')
  );

  // SRV connections can't have directConnection set.
  if (newConnectionStringUrl.searchParams.get('directConnection')) {
    newConnectionStringUrl.searchParams.delete('directConnection');
  }

  return newConnectionStringUrl;
}

function updateConnectionStringSchema(
  connectionStringUrl: ConnectionStringUrl,
  schema: MONGODB_SCHEMA
): ConnectionStringUrl {
  if (schema === MONGODB_SCHEMA.MONGODB) {
    return updateConnectionStringToStandard(connectionStringUrl);
  } else {
    return updateConnectionStringToSRV(connectionStringUrl);
  }
}

function SchemaInput({
  connectionStringUrl,
  setConnectionStringUrl,
}: {
  connectionStringUrl: ConnectionStringUrl;
  setConnectionStringUrl: (connectionStringUrl: ConnectionStringUrl) => void;
}): React.ReactElement {
  const { isSRV } = connectionStringUrl;

  return (
    <>
      <Label htmlFor="connection-schema-radio-box-group">Schema</Label>
      <RadioBoxGroup
        id="connection-schema-radio-box-group"
        value={isSRV ? MONGODB_SCHEMA.MONGODB_SRV : MONGODB_SCHEMA.MONGODB}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          try {
            const newConnectionStringUrl = updateConnectionStringSchema(
              connectionStringUrl,
              event.target.value as MONGODB_SCHEMA
            );

            setConnectionStringUrl(newConnectionStringUrl);
          } catch (e) {
            // TODO: show a targeted error/warning why we can't convert.
            //
          }
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

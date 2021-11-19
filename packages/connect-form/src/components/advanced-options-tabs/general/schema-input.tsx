import React from 'react';
import {
  Description,
  Label,
  RadioBox,
  RadioBoxGroup,
} from '@mongodb-js/compass-components';

import { useConnectionStringContext } from '../../../contexts/connection-string-context';

enum MONGODB_SCHEMA {
  MONGODB = 'MONGODB',
  MONGODB_SRV = 'MONGODB_SRV',
}

const regularSchemaDescription =
  'Standard Connection String Format. The standard format of the MongoDB connection URI is used to connect to a MongoDB deployment: standalone, replica set, or a sharded cluster.';
const srvSchemaDescription =
  'DNS Seed List Connection Format. The +srv indicates to the client that the hostname that follows corresponds to a DNS SRV record.';

function SchemaInput(): React.ReactElement {
  const [{ connectionStringUrl }, { setConnectionString }] =
    useConnectionStringContext();

  const { isSRV } = connectionStringUrl;

  // const connection

  return (
    <>
      <Label htmlFor="connection-schema-radio-box-group">Schema</Label>
      <RadioBoxGroup
        id="connection-schema-radio-box-group"
        value={isSRV ? MONGODB_SCHEMA.MONGODB_SRV : MONGODB_SCHEMA.MONGODB}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          if (event.target.value === MONGODB_SCHEMA.MONGODB) {
            if (!isSRV) {
              // Skip if already srv (re-clicked option).
              return;
            }
            // Chose regular schema.
            // TODO: Add port if not exists (coming from srv)
            // First check if srv then avoid if not.

            setConnectionString('mongodb://localhost:27017');
          } else {
            // Chose srv.
            // TODO:
            // Remove additional hosts if they exist.
            // Remove port.
            setConnectionString('mongodb+srv://localhost');
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

import { createContext, useContext } from 'react';
import ConnectionStringUrl from 'mongodb-connection-string-url';

const ConnectionStringContext = createContext('');
export default ConnectionStringContext;

interface State {
  connectionString: string;
  connectionStringInvalidError: string;
  connectionStringUrl: ConnectionStringUrl;
}

export const useConnectionStringContext = (): [
  State,
  {
    setConnectionString: (connectionString: string) => void;
  }
] => {
  const context = useContext(ConnectionStringContext);

  if (!context) {
    throw new Error(
      'useConnectionStringContext must be used within a ConnectionStringContext Provider'
    );
  }

  const connectionStringInvalidError = '';

  const connectionStringUrl = new ConnectionStringUrl(
    'mongodb://localhost:27017'
  );

  // TODO: Signature is ?
  function setConnectionString(connectionString: string) {
    try {
      // connectionString;
    } catch (e) {
      // Should we trust anything they send is valid?
      // if (connectionStringInvalidError) {
      // }
    }
  }

  // TODO: Should we a different kind of refresh
  // Should we pull the individual props used here?

  return [
    {
      connectionString: 'mongodb://localhost27017', // TODO
      connectionStringUrl,
      connectionStringInvalidError,
    },
    {
      setConnectionString,
    },
  ];
};

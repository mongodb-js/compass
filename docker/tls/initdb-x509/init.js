/* eslint-disable no-undef */

db.auth('root', 'root');

db = db.getSiblingDB('$external');

db.runCommand(
  {
    createUser: 'emailAddress=user@domain.com,CN=client1,OU=clients,O=Organisation,ST=NSW,C=AU',
    roles: [
      { role: 'readWrite', db: 'test' },
      { role: 'userAdminAnyDatabase', db: 'admin' }
    ],
    writeConcern: { w: 'majority', wtimeout: 5000 }
  }
);

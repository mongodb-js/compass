/* eslint-disable no-undef */

db.auth('root', 'root');

db = db.getSiblingDB('db3');

db.createCollection('coll1');
db.createCollection('coll2');
db.createCollection('coll3');

db = db.getSiblingDB('admin');

db.createUser( // readWriteAnyDatabase both SCRAM-SHA-1 and SCRAM-SHA-256
  {
    user: 'user1',
    pwd: 'password',
    roles: ['readWriteAnyDatabase']
  }
);

db.createUser( // readWriteAnyDatabase only SCRAM-SHA-1
  {
    user: 'scramSha1',
    pwd: 'password',
    roles: ['readWriteAnyDatabase'],
    mechanisms: ['SCRAM-SHA-1']
  }
);

db.createUser( // readWriteAnyDatabase only SCRAM-SHA-256
  {
    user: 'scramSha256',
    pwd: 'password',
    roles: ['readWriteAnyDatabase'],
    mechanisms: ['SCRAM-SHA-256']
  }
);

db.createUser(
  {
    user: 'user3',
    pwd: 'password',
    roles: [
      { role: 'read', db: 'db1' },
      { role: 'readWrite', db: 'db2' },
      { role: 'dbAdmin', db: 'db3' },
      { role: 'dbOwner', db: 'db4' }
    ]
  }
);

db = db.getSiblingDB('sandbox');

db.createRole(
  {
    role: 'role1',
    privileges: [
      { resource: { db: 'sandbox', collection: 'coll1' }, actions: ['find', 'update', 'insert', 'remove'] },
      { resource: { db: 'sandbox', collection: 'coll2' }, actions: ['update', 'insert', 'remove'] }
    ],
    roles: []
  },
  { w: 'majority', wtimeout: 5000 }
);

db = db.getSiblingDB('admin');

db.createUser( // custom role with privileges on non-existing collections
  {
    user: 'customRole',
    pwd: 'password',
    roles: [{
      role: 'role1', db: 'sandbox'
    }],
    mechanisms: ['SCRAM-SHA-256']
  }
);

db = db.getSiblingDB('authDb');

db.createUser( // different auth db
  {
    user: 'authDb',
    pwd: 'password',
    roles: [
      { role: 'dbOwner', db: 'authDb' }
    ]
  }
);

// Test script that verifies that automatic encryption using mongocryptd
// works when using the Mongo() object to construct the encryption key and
// to create an auto-encryption-aware connection.

export default String.raw `
const assert = function(value, message) {
  if (!value) {
    console.error('assertion failed:', message);
    unencryptedDb.dropDatabase();
    process.exit(1);
  }
};
try {
  // The mongocryptd binary that we ship works on Ubuntu 18.04 and above,
  // but not Ubuntu 16.04.
  if (os.platform() === 'linux' && fs.readFileSync('/etc/issue', 'utf8').match(/Ubuntu 16/)) {
    print('Test skipped')
    process.exit(0);
  }
} catch(err) {
  console.log(err);
}
if (db.version().startsWith('4.0.') ||
    !db.runCommand({buildInfo:1}).modules.includes('enterprise')) {
  // No FLE on mongod < 4.2 or community
  print('Test skipped')
  process.exit(0)
}

const dbname = 'testdb_fle' + new Date().getTime();
use(dbname);
unencryptedDb = db;
assert(db.getName() === dbname, 'db name must match');

const local = { key: Buffer.from('kh4Gv2N8qopZQMQYMEtww/AkPsIrXNmEMxTrs3tUoTQZbZu4msdRUaR8U5fXD7A7QXYHcEvuu4WctJLoT+NvvV3eeIg3MD+K8H9SR794m/safgRHdIfy6PD+rFpvmFbY', 'base64') };

const keyMongo = Mongo(db.getMongo()._uri, {
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: { local }
});

const keyVault = keyMongo.getKeyVault();
const keyId = keyVault.createKey('local');
sleep(100);

const schemaMap = {};
schemaMap[dbname + '.employees'] = {
  bsonType: 'object',
  properties: {
    taxid: {
      encrypt: {
        keyId: [keyId],
        bsonType: 'string',
        algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
      }
    }
  }
};

console.log('Using schema map', schemaMap);

const autoMongo = Mongo(db.getMongo()._uri, {
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: { local },
  schemaMap
});

db = autoMongo.getDB(dbname);
db.employees.insertOne({ taxid: 'abc' });

// If there is some failure that is not related to the assert() calls, we still
// want to make sure that we only print the success message if everything
// has worked so far, because the shell keeps evaluating statements after errors.
let verifiedEncrypted = false
let verifiedUnencrypted = false
{
  const document = db.employees.find().toArray()[0];
  console.log('auto-decrypted document', document);
  verifiedEncrypted = document.taxid === 'abc';
  assert(verifiedEncrypted, 'Must do automatic decryption');
}
db = unencryptedDb;
{
  const document = db.employees.find().toArray()[0];
  console.log('non-decrypted document', document);
  verifiedUnencrypted = document.taxid.constructor === Binary && document.taxid.sub_type === 6;
  assert(verifiedUnencrypted, 'Must not do decryption without keys');
}
if (verifiedEncrypted && verifiedUnencrypted) {
  print('Test succeeded')
}
db.dropDatabase();
`;

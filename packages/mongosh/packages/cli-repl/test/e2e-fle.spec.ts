import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { TestShell } from './test-shell';
import { startTestServer, useBinaryPath, skipIfServerVersion, skipIfCommunityServer } from '../../../testing/integration-testing-hooks';
import { makeFakeHTTPServer, fakeAWSHandlers } from '../../../testing/fake-kms';
import { once } from 'events';
import { serialize } from 'v8';
import { inspect } from 'util';
import path from 'path';

describe('FLE tests', () => {
  const testServer = startTestServer('shared');
  skipIfServerVersion(testServer, '< 4.2'); // FLE only available on 4.2+
  skipIfCommunityServer(testServer); // FLE is enterprise-only
  useBinaryPath(testServer); // Get mongocryptd in the PATH for this test
  let kmsServer: ReturnType<typeof makeFakeHTTPServer>;
  let dbname: string;

  before(async() => {
    kmsServer = makeFakeHTTPServer(fakeAWSHandlers);
    kmsServer.listen(0);
    await once(kmsServer, 'listening');
  });
  after(() => {
    kmsServer.close();
  });
  beforeEach(() => {
    kmsServer.requests = [];
    dbname = `test-${Date.now()}`;
  });
  afterEach(async() => {
    const client = await MongoClient.connect(await testServer.connectionString(), {});
    await client.db(dbname).dropDatabase();
    await client.close();
  });
  afterEach(TestShell.cleanup);

  context('with AWS KMS', () => {
    const accessKeyId = 'SxHpYMUtB1CEVg9tX0N1';
    const secretAccessKey = '44mjXTk34uMUmORma3w1viIAx4RCUv78bzwDY0R7';
    const sessionToken = 'WXWHMnniSqij0CH27KK7H';
    async function makeTestShell(withSessionToken: boolean): Promise<TestShell> {
      return TestShell.start({
        args: [
          `--awsAccessKeyId=${accessKeyId}`,
          `--awsSecretAccessKey=${secretAccessKey}`,
          `--keyVaultNamespace=${dbname}.keyVault`,
          ...(withSessionToken ? [`--awsSessionToken=${sessionToken}`] : []),
          await testServer.connectionString()
        ],
        env: {
          ...process.env,
          NODE_OPTIONS: '--require ./redirect-network-io.js',
          REDIRECT_NETWORK_SOURCES: serialize(fakeAWSHandlers.map(({ host }) => host)).toString('base64'),
          REDIRECT_NETWORK_TARGET: `localhost:${(kmsServer.address() as any).port}`,
        },
        cwd: path.join(__dirname, 'fixtures')
      });
    }

    for (const withSessionToken of [ false, true ]) {
      // eslint-disable-next-line no-loop-func
      it(`passes through command line options (${withSessionToken ? 'with' : 'without'} sessionToken)`, async() => {
        const shell = await makeTestShell(withSessionToken);
        await shell.executeLine(`use ${dbname}`);
        await shell.executeLine(`db.keyVault.insertOne({
          _id: UUID("e7b4abe7-ff70-48c3-9d3a-3526e18c2646"),
          keyMaterial: new Binary(Buffer.from("010202007888b7b9089f9cf816059c4c02edf139d50227528b2a74a5c9910c89095d45a9d10133bd4c047f2ba610d7ad4efcc945f863000000c23081bf06092a864886f70d010706a081b13081ae0201003081a806092a864886f70d010701301e060960864801650304012e3011040cf406b9ccb00f83dd632e76e9020110807b9c2b3a676746e10486ec64468d45ec89cac30f59812b711fc24530188166c481f4f4ab376c258f8f54affdc8523468fdd07b84e77b21a14008a23fb6d111c05eb4287b7b973f3a60d5c7d87074119b424477366cbe72c31da8fc76b8f72e31f609c3b423c599d3e4a59c21e4a0fe227ebe1aa53038cb94f79c457b", "hex"), 0),
          creationDate: ISODate('2021-02-10T15:51:00.567Z'),
          updateDate: ISODate('2021-02-10T15:51:00.567Z'),
          status: 0,
          masterKey: {
            provider: 'aws',
            region: 'us-east-2',
            key: 'arn:aws:kms:us-east-2:398471984214:key/174b7c1d-3651-4517-7521-21988befd8cb'
          }
        })`);
        await shell.executeLine(`db.data.insertOne({
          _id: ObjectId("602400ec9933cbed7fa92a1c"),
          taxid: new Binary(Buffer.from("02e7b4abe7ff7048c39d3a3526e18c264602846f122fa8c1ae1b8aff3dc7c20a8a3dbc95541e8d0d75cb8daf0b7e3137d553a788ccb62e31fed2da98ea3a596972c6dc7c17bbe6f9a9edc3a7f3e2ad96a819", "hex"), 6)
        });`);
        // This will try to automatically decrypt the data, but it will not succeed.
        // That does not matter here -- we're just checking that the HTTP requests
        // made were successful.
        await shell.executeLine('db.data.find();');

        // The actual assertion here:
        if (!kmsServer.requests.some(req => req.headers.authorization.includes(accessKeyId)) ||
            (withSessionToken && !kmsServer.requests.some(req => req.headers['x-amz-security-token'] === sessionToken))) {
          throw new Error(`Missed expected request to AWS\nShell output:\n${shell.output}\nRequests:\n${kmsServer.requests.map(req => inspect(req.headers))}`);
        }
      });

      // eslint-disable-next-line no-loop-func
      it('forwards command line options to the main Mongo instance', async() => {
        const shell = await makeTestShell(withSessionToken);
        await shell.executeLine(`use ${dbname}`);
        await shell.executeLine('keyId = db.getMongo().getKeyVault().createKey("aws", {' +
          'region: "us-east-2", key: "arn:aws:kms:us-east-2:398471984214:key/174b7c1d-3651-4517-7521-21988befd8cb" });');
        await shell.executeLine('clientEncryption = db.getMongo().getClientEncryption();');
        await shell.executeLine('encrypted = clientEncryption.encrypt(' +
          'keyId, { someValue: "foo" }, "AEAD_AES_256_CBC_HMAC_SHA_512-Random");');
        const result = await shell.executeLine('({ decrypted: clientEncryption.decrypt(encrypted) })');
        expect(result).to.include("{ decrypted: { someValue: 'foo' } }");
        shell.assertNoErrors();
      });
    }
  });

  it('works when the original shell was started with --nodb', async() => {
    const shell = TestShell.start({
      args: ['--nodb']
    });
    await shell.waitForPrompt();
    await shell.executeLine('local = { key: BinData(0, "kh4Gv2N8qopZQMQYMEtww/AkPsIrXNmEMxTrs3tUoTQZbZu4msdRUaR8U5fXD7A7QXYHcEvuu4WctJLoT+NvvV3eeIg3MD+K8H9SR794m/safgRHdIfy6PD+rFpvmFbY") }');
    await shell.executeLine(`keyMongo = Mongo(${JSON.stringify(await testServer.connectionString())}, { \
      keyVaultNamespace: '${dbname}.keyVault', \
      kmsProviders: { local }, \
      explicitEncryptionOnly: true \
    });`);
    await shell.executeLine('keyVault = keyMongo.getKeyVault();');
    const keyId = await shell.executeLine('keyId = keyVault.createKey("local");');
    const uuidRegexp = /UUID([^)])/;
    expect(keyId).to.match(uuidRegexp);
    await shell.executeLine(`plainMongo = Mongo(${JSON.stringify(await testServer.connectionString())})`);
    await shell.executeLine(`db = plainMongo.getDB('${dbname}')`);
    const keyVaultContents = await shell.executeLine('db.keyVault.find()');
    expect(keyVaultContents).to.include(keyId.match(uuidRegexp)[1]);
  });

  it('performs KeyVault data key management as expected', async() => {
    const shell = TestShell.start({
      args: [await testServer.connectionString()]
    });
    await shell.waitForPrompt();
    // Wrapper for executeLine that expects single-line output
    const runSingleLine = async(line) => (await shell.executeLine(line)).split('\n')[0].trim();
    await runSingleLine('local = { key: BinData(0, "kh4Gv2N8qopZQMQYMEtww/AkPsIrXNmEMxTrs3tUoTQZbZu4msdRUaR8U5fXD7A7QXYHcEvuu4WctJLoT+NvvV3eeIg3MD+K8H9SR794m/safgRHdIfy6PD+rFpvmFbY") }');
    await runSingleLine(`keyMongo = Mongo(db.getMongo()._uri, { \
      keyVaultNamespace: '${dbname}.keyVault', \
      kmsProviders: { local }, \
      explicitEncryptionOnly: true \
    });`);
    await runSingleLine(`use('${dbname}')`);
    await runSingleLine('keyVault = keyMongo.getKeyVault();');
    await runSingleLine('keyId = keyVault.createKey("local", "", ["testaltname"]);');
    expect(await runSingleLine('db.keyVault.countDocuments({ _id: keyId, keyAltNames: "testaltname" })'))
      .to.equal('1');
    expect(await runSingleLine('keyVault.getKey(keyId).next()._id.toString() == keyId.toString()'))
      .to.equal('true');
    expect(await runSingleLine('keyVault.getKeys().next()._id.toString() == keyId.toString()'))
      .to.equal('true');
    expect(await runSingleLine('keyVault.addKeyAlternateName(keyId, "otheraltname").keyAltNames.join(",")'))
      .to.equal('testaltname');
    expect(await runSingleLine('keyVault.getKeyByAltName("otheraltname").next().keyAltNames.join(",")'))
      .to.equal('testaltname,otheraltname');
    expect(await runSingleLine('keyVault.removeKeyAlternateName(keyId, "testaltname").keyAltNames.join(",")'))
      .to.equal('testaltname,otheraltname');
    expect(await runSingleLine('keyVault.getKeyByAltName("otheraltname").next().keyAltNames.join(",")'))
      .to.equal('otheraltname');
    expect(await runSingleLine('keyVault.deleteKey(keyId).deletedCount'))
      .to.equal('1');
    expect(await runSingleLine('db.keyVault.countDocuments()'))
      .to.equal('0');
  });
});

import { expect } from 'chai';
import sinon from 'sinon';
import { handleFLE2Options } from './create-namespace';
import type { Binary } from 'bson';
import { UUID } from 'bson';

describe('create collection module', function () {
  describe('#handleFLE2Options', function () {
    let ds: { createDataKey: sinon.SinonStub<any[], Promise<Binary>> };
    let uuid: Binary;

    beforeEach(function () {
      uuid = new UUID().toBinary();
      ds = {
        createDataKey: sinon.stub().resolves(uuid),
      };
    });

    it('parses an encryptedFields config', async function () {
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '',
        })
      ).to.deep.equal({});
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{}',
        })
      ).to.deep.equal({});
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{ foo: "bar" }',
        })
      ).to.deep.equal({ encryptedFields: { foo: 'bar' } });
    });

    it('rejects unparseable encryptedFields config', async function () {
      try {
        await handleFLE2Options(ds, {
          encryptedFields: '{',
        });
        expect.fail('missed exception');
      } catch (err) {
        expect((err as Error).message).to.include(
          'Could not parse encryptedFields config'
        );
      }
    });

    it('creates data keys for missing fields if kms and key encryption key are provided', async function () {
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{ fields: [{ path: "foo", bsonType: "string" }] }',
          kmsProvider: 'local',
          keyEncryptionKey: '',
        })
      ).to.deep.equal({
        encryptedFields: {
          fields: [{ path: 'foo', bsonType: 'string', keyId: uuid }],
        },
      });
    });

    it('does not create data keys if encryptedFields.fields is not an array', async function () {
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{ fields: {x: "y"} }',
          kmsProvider: 'local',
          keyEncryptionKey: '',
        })
      ).to.deep.equal({
        encryptedFields: {
          fields: { x: 'y' },
        },
      });
    });

    it('fails when creating data keys fails', async function () {
      ds.createDataKey.rejects(new Error('createDataKey failed'));
      try {
        await handleFLE2Options(ds, {
          encryptedFields: '{ fields: [{ path: "foo", bsonType: "string" }] }',
          kmsProvider: 'local',
          keyEncryptionKey: '',
        });
        expect.fail('missed exception');
      } catch (err) {
        expect((err as Error).message).to.equal('createDataKey failed');
      }
    });
  });
});

import { Encrypter, Decrypter } from './encrypt';
import { expect } from 'chai';

describe('Encryption support', function () {
  it('can encrypt and decrypt data', async function () {
    const encrypter = new Encrypter('passphrase');
    const decrypter = new Decrypter('passphrase');

    const plaintext = 'plaintext';
    const ciphertext = await encrypter.encrypt(plaintext);
    const decrypted = await decrypter.decrypt(ciphertext);
    expect(ciphertext).to.match(/^AA[E-H]/); // version
    expect(ciphertext.length).to.be.greaterThanOrEqual(60); // version + salt + iv + auth tag
    expect(plaintext).to.equal(decrypted);
  });

  it('generates different ciphertexts on each invocation', async function () {
    const encrypter = new Encrypter('passphrase');
    const plaintext = 'plaintext';
    const ciphertext1 = await encrypter.encrypt(plaintext);
    const ciphertext2 = await encrypter.encrypt(plaintext);
    expect(ciphertext1).to.not.equal(ciphertext2);
  });

  it('fails to decrypt if passwords mismatch', async function () {
    const encrypter = new Encrypter('passphrase1');
    const decrypter = new Decrypter('passphrase2');

    const plaintext = 'plaintext';
    const ciphertext = await encrypter.encrypt(plaintext);
    try {
      await decrypter.decrypt(ciphertext);
      expect.fail('missed exception');
    } catch (err) {
      expect((err as Error).message).to.equal(
        'Cannot decrypt due to corrupt data or wrong passphrase'
      );
    }
  });

  it('can encrypt/decrypt multiple times without needing to recreate keys', async function () {
    const encrypter = new Encrypter('passphrase');
    const decrypter = new Decrypter('passphrase');
    const ciphertext1 = await encrypter.encrypt('plaintext1');
    const ciphertext2 = await encrypter.encrypt('plaintext2');
    expect(await decrypter.decrypt(ciphertext1)).to.equal('plaintext1');
    expect(await decrypter.decrypt(ciphertext2)).to.equal('plaintext2');
  });
});

import redactCredentials from './redact-credentials';
import { expect } from 'chai';

describe('redact credentials', () => {
  context('when url contains credentials', () => {
    it('returns the <credentials> in output instead of password', () => {
      expect(redactCredentials('mongodb+srv://admin:catsc@tscat3ca1s@cats-data-sets-e08dy.mongodb.net/admin'))
        .to.equal('mongodb+srv://<credentials>@cats-data-sets-e08dy.mongodb.net/admin');
    });

    it('returns the <credentials> in output instead of IAM session token', () => {
      expect(redactCredentials('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken,else%3Amiau&param=true'))
        .to.equal('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>,else%3Amiau&param=true');
      expect(redactCredentials('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken&param=true'))
        .to.equal('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>&param=true');
      expect(redactCredentials('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken'))
        .to.equal('mongodb+srv://cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>');
    });

    it('returns the <credentials> in output instead of password and IAM session token', () => {
      expect(redactCredentials('mongodb+srv://admin:tscat3ca1s@cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3Asampletoken&param=true'))
        .to.equal('mongodb+srv://<credentials>@cats-data-sets-e08dy.mongodb.net/admin?authMechanism=MONGODB-AWS&authMechanismProperties=AWS_SESSION_TOKEN%3A<credentials>&param=true');
    });
  });

  context('when url contains no credentials', () => {
    it('does not alter input', () => {
      expect(redactCredentials('mongodb://127.0.0.1:27017')).to.equal('mongodb://127.0.0.1:27017');
    });
  });
});

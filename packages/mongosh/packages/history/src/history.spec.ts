import { changeHistory } from './history';

import { expect } from 'chai';

describe('changeHistory', () => {
  const history = ['db.shipwrecks.findOne()', 'use ships'];

  context('when redact option is not used', () => {
    it('removes sensitive commands from history', () => {
      const i = ['db.createUser({ user: "reportUser256" })', 'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i);
      expect(i).to.deep.equal(history);
    });
    it('removes connect commands from history', () => {
      const i = ['db = connect(\'uri\', \'u\', \'p\')', 'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i);
      expect(i).to.deep.equal(history);
    });
    it('removes URI having Mongo from history', () => {
      const i = ['m = new Mongo(\'mongodb://anna:anna@127.0.0.1:27017/test\')', 'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i);
      expect(i).to.deep.equal(history);
    });
    it('removes URI having Mongo from history for srv', () => {
      const i = ['m = new Mongo(\'mongodb+srv://admin:catscat3ca1s@cats-data-sets-e08dy.mongodb.net/admin\')', 'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i);
      expect(i).to.deep.equal(history);
    });

    it('leaves history as is if command is not sensitive', () => {
      const i = ['db.shipwrecks.find({quasou: "depth unknown"})', 'db.shipwrecks.findOne()', 'use ships'];
      const cloned = Array.from(i);
      changeHistory(cloned);
      expect(cloned).to.deep.equal(i);
    });
  });

  context('when redact option is false', () => {
    it('removes sensitive commands from history', () => {
      const i = ['db.createUser({ user: "reportUser256" })', 'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i, false);
      expect(i).to.deep.equal(history);
    });

    it('leaves history as is if command is not sensitive', () => {
      const i = ['db.shipwrecks.find({quasou: "depth unknown"})', 'db.shipwrecks.findOne()', 'use ships'];
      const cloned = Array.from(i);
      changeHistory(cloned, false);
      expect(cloned).to.deep.equal(i);
    });
  });

  context('when redact option is true', () => {
    it('removes sensitive commands from history', () => {
      const i = ['db.createUser({ user: "reportUser256" })', 'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i, true);
      expect(i).to.deep.equal(history);
    });

    it('removes sensitive raw commands from history', () => {
      const i = ['db.runCommand({createUser: "reportUser256", pwd: "pwd", roles: {] })', 'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i, true);
      expect(i).to.deep.equal(history);
    });

    it('leaves history as is if command is not sensitive', () => {
      const i = ['db.shipwrecks.find({quasou: "depth unknown"})', 'db.shipwrecks.findOne()', 'use ships'];
      const cloned = Array.from(i);
      changeHistory(cloned, true);
      expect(cloned).to.deep.equal(i);
    });

    it('leaves history as is if command is not sensitive but contains sensitive substrings', () => {
      const i = ['db.shipwrecks.find({quasou: "connectionId"})', 'db.shipwrecks.findOne()', 'use ships'];
      const cloned = Array.from(i);
      changeHistory(cloned, true);
      expect(cloned).to.deep.equal(i);
    });

    it('removes command from history and does not redact even if info in command is redactable', () => {
      const i = ['db.createUser( { user: "restricted", pwd: passwordPrompt(),      // Or  "<cleartext password>" roles: [ { role: "readWrite", db: "reporting" } ], authenticationRestrictions: [ { clientSource: ["192.0.2.0"], serverAddress: ["198.51.100.0"] } ] })',
        'db.shipwrecks.findOne()', 'use ships'];
      changeHistory(i, true);
      expect(i).to.deep.equal(history);
    });

    it('does not remove from history, but redacts info if redact is true', () => {
      const i = ['db.supplies.find({email: "cat@cat.cat"})',
        'db.supplies.findOne()', 'use sales'];
      const redacted = ['db.supplies.find({email: "<email>"})',
        'db.supplies.findOne()', 'use sales'];
      const cloned = Array.from(i);
      changeHistory(cloned, true);
      expect(cloned).to.deep.equal(redacted);
    });
  });
});

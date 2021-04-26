import sinon from 'ts-sinon';
import Help from './help';
import { toShellResult } from './index';
import { expect } from 'chai';

describe('Help', () => {
  let translate;

  beforeEach(() => {
    translate = sinon.fake((x) => `translated: ${x}`);
  });

  describe('#toShellResult', () => {
    it('returns Help', async() => {
      expect((await toShellResult(new Help({ help: 'help' }, { translate }))).type).to.equal('Help');
    });
  });

  describe('#toShellResult', () => {
    it('returns the Help a plain object', async() => {
      const properties = {
        help: 'help'
      };

      const help = new Help(properties, { translate });
      const result = await toShellResult(help);
      expect(result.printable.constructor.name).to.equal('Object');
      expect(result.printable).to.not.equal(help);
    });

    it('returns translated help', async() => {
      const properties = {
        help: 'help'
      };

      expect(
        (await toShellResult(new Help(properties, { translate })))
          .printable
          .help
      ).to.equal('translated: help');
    });

    it('returns docs', async() => {
      const properties = {
        help: 'help',
        docs: 'https://example.com'
      };

      expect(
        (await toShellResult(new Help(properties, { translate })))
          .printable
          .docs
      ).to.equal('translated: https://example.com');
    });

    it('returns default attr', async() => {
      const properties = {
        help: 'help'
      };

      const help = new Help(properties, { translate });

      expect((await toShellResult(help)).printable.attr).to.deep.equal([]);
    });

    it('returns attr with translated description', async() => {
      const properties = {
        help: 'help',
        attr: [{ name: 'key', description: 'description' }]
      };

      expect(
        (await toShellResult(new Help(properties, { translate })))
          .printable
          .attr
      ).to.deep.equal([{ name: 'key', description: 'translated: description' }]);
    });
  });
});

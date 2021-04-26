import { MongoshInternalError } from '@mongosh/errors';
import { fail } from 'assert';
import { expect } from 'chai';
import Translator from './translator';

describe('Translator', () => {
  describe('#setLocale', () => {
    context('when the locale exists', () => {
      const translator = new Translator({});

      beforeEach(() => {
        translator.setLocale('en_US');
      });

      it('sets the catalog', () => {
        expect(translator.translate('cli-repl.cli-repl.connecting')).
          to.equal('Connecting to:');
      });
    });

    context('when the locale does not exist', () => {
      const translator = new Translator({});

      beforeEach(() => {
        translator.setLocale('de');
      });

      it('sets the default catalog', () => {
        expect(translator.translate('cli-repl.cli-repl.connecting')).
          to.equal('Connecting to:');
      });
    });
  });

  describe('#translateApiHelp', () => {
    const translator = new Translator();

    context('when the result is a string', () => {
      it('returns the string', () => {
        expect(translator.translateApiHelp('shell-api.classes.ShellApi.help.description')).
          to.equal('Shell Help');
      });
    });

    context('when the result is an object', () => {
      it('returns the api formatted template', () => {
        expect(translator.translateApiHelp('shell-api.classes.Collection.help.attributes.aggregate')).
          to.include('Calculates');
      });
    });

    context('when the key is not found', () => {
      it('returns undefined', () => {
        expect(translator.translateApiHelp('testing.testing.testing')).
          to.equal(undefined);
      });
    });
  });

  describe('#translate', () => {
    context('when providing a catalog', () => {
      context('when providing a key', () => {
        context('when the key does not use object notation', () => {
          const translator = new Translator({ test: 'value' });

          context('when the key is found', () => {
            it('returns the translation', () => {
              expect(translator.translate('test')).to.equal('value');
            });
          });

          context('when the key is not found', () => {
            it('returns undefined', () => {
              expect(translator.translate('testing')).to.equal(undefined);
            });
          });
        });

        context('when the key uses object notation', () => {
          const translator = new Translator({ test: { test: 'value' } });

          context('when the key is found', () => {
            it('returns the translation', () => {
              expect(translator.translate('test.test')).to.equal('value');
            });
          });

          context('when the key is not found', () => {
            it('returns undefined', () => {
              expect(translator.translate('testing.testing.testing')).
                to.equal(undefined);
            });
          });
        });
      });
    });

    context('when not providing a catalog', () => {
      context('when providing a key', () => {
        context('when the key does not use object notation', () => {
          const translator = new Translator();

          context('when the key is found', () => {
            it('returns the translation', () => {
              expect(translator.translate('cli-repl.cli-repl.connecting')).
                to.equal('Connecting to:');
            });
          });
        });
      });
    });
  });

  describe('#__', () => {
    const translator = new Translator();

    it('returns the string for existing key', () => {
      expect(translator.__('shell-api.classes.ShellApi.help.description')).to.equal('Shell Help');
    });

    it('throws an error for missing key', () => {
      try {
        translator.__('testing.testing.testing');
        fail('expected error');
      } catch (e) {
        expect(e).to.be.instanceOf(MongoshInternalError);
      }
    });
  });
});

import { MongoshUnimplementedError } from '@mongosh/errors';
import { expect } from 'chai';
import stripAnsi from 'strip-ansi';
import { getLocale, parseCliArgs } from './arg-parser';

const NODE = 'node';
const MONGOSH = 'mongosh';
const START = 'start';

describe('arg-parser', () => {
  describe('.getLocale', () => {
    context('when --locale is provided', () => {
      it('returns the locale', () => {
        expect(getLocale(['--locale', 'de_DE'], {})).to.equal('de_DE');
      });
    });

    context('when --locale is not provided', () => {
      context('when env.LANG is set', () => {
        context('when it contains the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LANG: 'de_DE.UTF-8' })).to.equal('de_DE');
          });
        });

        context('when it does not contain the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LANG: 'de_DE' })).to.equal('de_DE');
          });
        });
      });

      context('when env.LANGUAGE is set', () => {
        context('when it contains the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LANGUAGE: 'de_DE.UTF-8' })).to.equal('de_DE');
          });
        });

        context('when it does not contain the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LANGUAGE: 'de_DE' })).to.equal('de_DE');
          });
        });
      });

      context('when env.LC_ALL is set', () => {
        context('when it contains the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LC_ALL: 'de_DE.UTF-8' })).to.equal('de_DE');
          });
        });

        context('when it does not contain the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LC_ALL: 'de_DE' })).to.equal('de_DE');
          });
        });
      });

      context('when env.LC_MESSAGES is set', () => {
        context('when it contains the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LC_MESSAGES: 'de_DE.UTF-8' })).to.equal('de_DE');
          });
        });

        context('when it does not contain the encoding', () => {
          it('returns the locale', () => {
            expect(getLocale([], { LC_MESSAGES: 'de_DE' })).to.equal('de_DE');
          });
        });
      });
    });
  });

  describe('.parse', () => {
    [
      { contextDescription: 'when running from a linked bin script or executable', baseArgv: [NODE, MONGOSH] },
      { contextDescription: 'when running via npm start', baseArgv: [ NODE, MONGOSH, START ] },
    ].forEach(({ contextDescription, baseArgv }) => {
      context(contextDescription, () => {
        context('when providing only a URI', () => {
          const uri = 'mongodb://domain.com:20000';
          const argv = [ ...baseArgv, uri];

          it('returns the URI in the object', () => {
            expect(parseCliArgs(argv)._[0]).to.equal(uri);
          });
        });

        context('when providing a URI + options', () => {
          const uri = 'mongodb://domain.com:20000';

          context('when providing general options', () => {
            context('when providing --ipv6', () => {
              const argv = [ ...baseArgv, uri, '--ipv6' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the ipv6 value in the object', () => {
                expect(parseCliArgs(argv).ipv6).to.equal(true);
              });
            });

            context('when providing -h', () => {
              const argv = [ ...baseArgv, uri, '-h' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the help value in the object', () => {
                expect(parseCliArgs(argv).help).to.equal(true);
              });
            });

            context('when providing --help', () => {
              const argv = [ ...baseArgv, uri, '--help' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the help value in the object', () => {
                expect(parseCliArgs(argv).help).to.equal(true);
              });
            });

            context('when providing --version', () => {
              const argv = [ ...baseArgv, uri, '--version' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the version value in the object', () => {
                expect(parseCliArgs(argv).version).to.equal(true);
              });
            });

            context('when providing --verbose', () => {
              const argv = [ ...baseArgv, uri, '--verbose' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the verbose value in the object', () => {
                expect(parseCliArgs(argv).verbose).to.equal(true);
              });
            });

            context('when providing --shell', () => {
              const argv = [ ...baseArgv, uri, '--shell' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the shell value in the object', () => {
                expect(parseCliArgs(argv).shell).to.equal(true);
              });
            });

            context('when providing --nodb', () => {
              const argv = [ ...baseArgv, uri, '--nodb' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the nodb value in the object', () => {
                expect(parseCliArgs(argv).nodb).to.equal(true);
              });
            });

            context('when providing --norc', () => {
              const argv = [ ...baseArgv, uri, '--norc' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the norc value in the object', () => {
                expect(parseCliArgs(argv).norc).to.equal(true);
              });
            });

            context('when providing --quiet', () => {
              const argv = [ ...baseArgv, uri, '--quiet' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the quiet value in the object', () => {
                expect(parseCliArgs(argv).quiet).to.equal(true);
              });
            });

            context('when providing --eval', () => {
              const argv = [ ...baseArgv, uri, '--eval', '1+1' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the eval value in the object', () => {
                expect(parseCliArgs(argv).eval).to.equal('1+1');
              });
            });

            context('when providing --retryWrites', () => {
              const argv = [ ...baseArgv, uri, '--retryWrites' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the retryWrites value in the object', () => {
                expect(parseCliArgs(argv).retryWrites).to.equal(true);
              });
            });

            context('when providing an unknown parameter', () => {
              const argv = [ ...baseArgv, uri, '--what' ];

              it('raises an error', () => {
                try {
                  parseCliArgs(argv);
                } catch (err) {
                  return expect(
                    stripAnsi(err.message)
                  ).to.contain('Error parsing command line: unrecognized option: --what');
                }
                expect.fail('parsing unknown parameter did not throw');
              });
            });
          });

          context('when providing authentication options', () => {
            context('when providing -u', () => {
              const argv = [ ...baseArgv, uri, '-u', 'richard' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the username in the object', () => {
                expect(parseCliArgs(argv).username).to.equal('richard');
              });
            });

            context('when providing --username', () => {
              const argv = [ ...baseArgv, uri, '--username', 'richard' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the username in the object', () => {
                expect(parseCliArgs(argv).username).to.equal('richard');
              });
            });

            context('when providing -p', () => {
              const argv = [ ...baseArgv, uri, '-p', 'pw' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the password in the object', () => {
                expect(parseCliArgs(argv).password).to.equal('pw');
              });
            });

            context('when providing --password', () => {
              const argv = [ ...baseArgv, uri, '--password', 'pw' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the password in the object', () => {
                expect(parseCliArgs(argv).password).to.equal('pw');
              });
            });

            context('when providing --authenticationDatabase', () => {
              const argv = [ ...baseArgv, uri, '--authenticationDatabase', 'db' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the authenticationDatabase in the object', () => {
                expect(parseCliArgs(argv).authenticationDatabase).to.equal('db');
              });
            });

            context('when providing --authenticationMechanism', () => {
              const argv = [ ...baseArgv, uri, '--authenticationMechanism', 'SCRAM-SHA-256' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the authenticationMechanism in the object', () => {
                expect(parseCliArgs(argv).authenticationMechanism).to.equal('SCRAM-SHA-256');
              });
            });

            context('when providing --gssapiServiceName', () => {
              const argv = [ ...baseArgv, uri, '--gssapiServiceName', 'mongosh' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the gssapiServiceName in the object', () => {
                expect(parseCliArgs(argv).gssapiServiceName).to.equal('mongosh');
              });
            });

            context('when providing --gssapiHostName', () => {
              const argv = [ ...baseArgv, uri, '--gssapiHostName', 'example.com' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the gssapiHostName in the object', () => {
                expect(parseCliArgs(argv).gssapiHostName).to.equal('example.com');
              });
            });

            context('when providing --awsIamSessionToken', () => {
              const argv = [ ...baseArgv, uri, '--awsIamSessionToken', 'tok' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the awsIamSessionToken in the object', () => {
                expect(parseCliArgs(argv).awsIamSessionToken).to.equal('tok');
              });
            });
          });

          context('when providing TLS options', () => {
            context('when providing --tls', () => {
              const argv = [ ...baseArgv, uri, '--tls' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tls in the object', () => {
                expect(parseCliArgs(argv).tls).to.equal(true);
              });
            });

            context('when providing --tlsCertificateKeyFile', () => {
              const argv = [ ...baseArgv, uri, '--tlsCertificateKeyFile', 'test' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsCertificateKeyFile in the object', () => {
                expect(parseCliArgs(argv).tlsCertificateKeyFile).to.equal('test');
              });
            });

            context('when providing --tlsCertificateKeyFilePassword', () => {
              const argv = [ ...baseArgv, uri, '--tlsCertificateKeyFilePassword', 'test' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsCertificateKeyFilePassword in the object', () => {
                expect(parseCliArgs(argv).tlsCertificateKeyFilePassword).to.equal('test');
              });
            });

            context('when providing --tlsCAFile', () => {
              const argv = [ ...baseArgv, uri, '--tlsCAFile', 'test' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsCAFile in the object', () => {
                expect(parseCliArgs(argv).tlsCAFile).to.equal('test');
              });
            });

            context('when providing --tlsCRLFile', () => {
              const argv = [ ...baseArgv, uri, '--tlsCRLFile', 'test' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsCRLFile in the object', () => {
                expect(parseCliArgs(argv).tlsCRLFile).to.equal('test');
              });
            });

            context('when providing --tlsAllowInvalidHostnames', () => {
              const argv = [ ...baseArgv, uri, '--tlsAllowInvalidHostnames' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsAllowInvalidHostnames in the object', () => {
                expect(parseCliArgs(argv).tlsAllowInvalidHostnames).to.equal(true);
              });
            });

            context('when providing --tlsAllowInvalidCertificates', () => {
              const argv = [ ...baseArgv, uri, '--tlsAllowInvalidCertificates' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsAllowInvalidCertificates in the object', () => {
                expect(parseCliArgs(argv).tlsAllowInvalidCertificates).to.equal(true);
              });
            });

            context('when providing --tlsFIPSMode', () => {
              const argv = [ ...baseArgv, uri, '--tlsFIPSMode' ];

              it('throws an error since it is not yet supported', () => {
                try {
                  parseCliArgs(argv);
                } catch (e) {
                  expect(e).to.be.instanceOf(MongoshUnimplementedError);
                  expect(e.message).to.include('Argument --tlsFIPSMode is not yet supported in mongosh');
                  return;
                }
                expect.fail('Expected error');
              });

              // it('returns the URI in the object', () => {
              //   expect(parseCliArgs(argv)._[0]).to.equal(uri);
              // });

              // it('sets the tlsFIPSMode in the object', () => {
              //   expect(parseCliArgs(argv).tlsFIPSMode).to.equal(true);
              // });
            });

            context('when providing --tlsCertificateSelector', () => {
              const argv = [ ...baseArgv, uri, '--tlsCertificateSelector', 'test' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsCertificateSelector in the object', () => {
                expect(parseCliArgs(argv).tlsCertificateSelector).to.equal('test');
              });
            });

            context('when providing --tlsDisabledProtocols', () => {
              const argv = [ ...baseArgv, uri, '--tlsDisabledProtocols', 'TLS1_0,TLS2_0' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the tlsDisabledProtocols in the object', () => {
                expect(parseCliArgs(argv).tlsDisabledProtocols).to.equal('TLS1_0,TLS2_0');
              });
            });
          });

          context('when providing FLE options', () => {
            context('when providing --awsAccessKeyId', () => {
              const argv = [ ...baseArgv, uri, '--awsAccessKeyId', 'foo' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the awsAccessKeyId in the object', () => {
                expect(parseCliArgs(argv).awsAccessKeyId).to.equal('foo');
              });
            });

            context('when providing --awsSecretAccessKey', () => {
              const argv = [ ...baseArgv, uri, '--awsSecretAccessKey', 'foo' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the awsSecretAccessKey in the object', () => {
                expect(parseCliArgs(argv).awsSecretAccessKey).to.equal('foo');
              });
            });

            context('when providing --awsSessionToken', () => {
              const argv = [ ...baseArgv, uri, '--awsSessionToken', 'foo' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the awsSessionToken in the object', () => {
                expect(parseCliArgs(argv).awsSessionToken).to.equal('foo');
              });
            });

            context('when providing --keyVaultNamespace', () => {
              const argv = [ ...baseArgv, uri, '--keyVaultNamespace', 'foo.bar' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the keyVaultNamespace in the object', () => {
                expect(parseCliArgs(argv).keyVaultNamespace).to.equal('foo.bar');
              });
            });

            context('when providing --kmsURL', () => {
              const argv = [ ...baseArgv, uri, '--kmsURL', 'example.com' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the kmsURL in the object', () => {
                expect(parseCliArgs(argv).kmsURL).to.equal('example.com');
              });
            });
          });

          context('when providing versioned API options', () => {
            context('when providing --apiVersion', () => {
              const argv = [ ...baseArgv, uri, '--apiVersion', '1' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the apiVersion in the object', () => {
                expect(parseCliArgs(argv).apiVersion).to.equal('1');
              });
            });

            context('when providing --apiDeprecationErrors', () => {
              const argv = [ ...baseArgv, uri, '--apiDeprecationErrors' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the apiVersion in the object', () => {
                expect(parseCliArgs(argv).apiDeprecationErrors).to.equal(true);
              });
            });

            context('when providing --apiStrict', () => {
              const argv = [ ...baseArgv, uri, '--apiStrict' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the apiVersion in the object', () => {
                expect(parseCliArgs(argv).apiStrict).to.equal(true);
              });
            });
          });

          context('when providing filenames', () => {
            context('when the filenames end in .js', () => {
              const argv = [ ...baseArgv, uri, 'test1.js', 'test2.js' ];

              it('returns the URI in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(uri);
              });

              it('sets the filenames', () => {
                expect(parseCliArgs(argv)._[1]).to.equal('test1.js');
                expect(parseCliArgs(argv)._[2]).to.equal('test2.js');
              });
            });
          });
        });

        context('when providing no URI', () => {
          context('when providing a DB address', () => {
            context('when only a db name is provided', () => {
              const db = 'foo';
              const argv = [ ...baseArgv, db ];

              it('sets the db in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(db);
              });
            });

            context('when a db address is provided without a scheme', () => {
              const db = '192.168.0.5:9999/foo';
              const argv = [ ...baseArgv, db ];

              it('sets the db in the object', () => {
                expect(parseCliArgs(argv)._[0]).to.equal(db);
              });
            });
          });

          context('when providing no DB address', () => {
            context('when providing a host', () => {
              const argv = [ ...baseArgv, '--host', 'example.com' ];

              it('sets the host value in the object', () => {
                expect(parseCliArgs(argv).host).to.equal('example.com');
              });
            });

            context('when providing a port', () => {
              const argv = [ ...baseArgv, '--port', '20000' ];

              it('sets the port value in the object', () => {
                expect(parseCliArgs(argv).port).to.equal('20000');
              });
            });
          });
        });

        context('when providing a deprecated argument', () => {
          [
            { deprecated: 'ssl', replacement: 'tls' },
            { deprecated: 'sslAllowInvalidCertificates', replacement: 'tlsAllowInvalidCertificates' },
            { deprecated: 'sslAllowInvalidCertificates', replacement: 'tlsAllowInvalidCertificates' },
            { deprecated: 'sslAllowInvalidHostname', replacement: 'tlsAllowInvalidHostname' },
            // { deprecated: 'sslFIPSMode', replacement: 'tlsFIPSMode' }, <<-- FIPS is currently not supported right now
            { deprecated: 'sslPEMKeyFile', replacement: 'tlsCertificateKeyFile', value: 'pemKeyFile' },
            { deprecated: 'sslPEMKeyPassword', replacement: 'tlsCertificateKeyFilePassword', value: 'pemKeyPass' },
            { deprecated: 'sslCAFile', replacement: 'tlsCAFile', value: 'caFile' },
            // { deprecated: 'sslCertificateSelector', replacement: 'tlsCertificateSelector', value: 'certSelector' }, <<-- Certificate selector not supported right now
            { deprecated: 'sslCRLFile', replacement: 'tlsCRLFile', value: 'crlFile' },
            { deprecated: 'sslDisabledProtocols', replacement: 'tlsDisabledProtocols', value: 'disabledProtos' }
          ].forEach(({ deprecated, replacement, value }) => {
            it(`replaces --${deprecated} with --${replacement}`, () => {
              const argv = [...baseArgv, `--${deprecated}`];
              if (value) {
                argv.push(value);
              }

              const args = parseCliArgs(argv);
              expect(args).to.not.have.property(deprecated);
              expect(args[replacement]).to.equal(value ?? true);
            });
          });
        });
      });
    });
  });
});

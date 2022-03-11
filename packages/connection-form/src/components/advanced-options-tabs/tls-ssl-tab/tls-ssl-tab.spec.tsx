import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SSLTab, { getTLSOptionForConnectionString } from './tls-ssl-tab';

describe('SchemaInput', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  describe('with ssl=true', function () {
    let testUrl: ConnectionStringUrl;
    let rerender: (
      ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>
    ) => void;
    beforeEach(function () {
      testUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
      );
      const component = render(
        <SSLTab
          connectionStringUrl={testUrl}
          connectionOptions={{
            connectionString: testUrl.href,
            useSystemCA: false,
          }}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
      rerender = component.rerender;
    });

    it('should render the TLS/SSL `On` radio box selected', function () {
      const tlsOnRadioBox = screen.getAllByRole('radio')[1] as HTMLInputElement;
      expect(tlsOnRadioBox.checked).to.equal(true);
      expect(tlsOnRadioBox.getAttribute('aria-checked')).to.equal('true');
    });

    it('should render the client cert and CA file labels', function () {
      expect(screen.getByText('Certificate Authority (.pem)')).to.be.visible;
      expect(screen.getByText('Client Certificate and Key (.pem)')).to.be
        .visible;
    });

    it('should render TLS/SSL `Default` and `Off` radio boxes not selected', function () {
      const tlsDefaultRadioBox = screen.getAllByRole(
        'radio'
      )[0] as HTMLInputElement;
      expect(tlsDefaultRadioBox.checked).to.equal(false);
      expect(tlsDefaultRadioBox.getAttribute('aria-checked')).to.equal('false');

      const tlsOffRadioBox = screen.getAllByRole(
        'radio'
      )[2] as HTMLInputElement;
      expect(tlsOffRadioBox.checked).to.equal(false);
      expect(tlsOffRadioBox.getAttribute('aria-checked')).to.equal('false');
    });

    it('should render all of the checkboxes unchecked', function () {
      const checkboxes: HTMLInputElement[] = screen.getAllByRole('checkbox');
      expect(checkboxes.length).to.equal(4);
      expect(checkboxes.find((checkbox) => checkbox.checked)).to.equal(
        undefined
      );
    });

    describe('when TLS/SSL default is clicked', function () {
      beforeEach(function () {
        const tlsDefaultRadioBox = screen.getAllByRole('radio')[0];
        fireEvent.click(tlsDefaultRadioBox);
      });

      it('should call to update the connection configuration to TLS/SSL default', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-tls',
          tlsOption: 'DEFAULT',
        });
      });
    });

    describe('when TLS/SSL off is clicked', function () {
      beforeEach(function () {
        const standardSchemaRadioBox = screen.getAllByRole('radio')[2];
        fireEvent.click(standardSchemaRadioBox);
      });

      it('should call to update the connection configuration to TLS/SSL off', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-tls',
          tlsOption: 'OFF',
        });
      });
    });

    describe('when TLS/SSL on is clicked', function () {
      beforeEach(function () {
        const standardSchemaRadioBox = screen.getAllByRole('radio')[1];
        fireEvent.click(standardSchemaRadioBox);
      });

      it("shouldn't call to update anything", function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
      });
    });

    describe('when a tlsCAFile is chosen', function () {
      beforeEach(async function () {
        const fileInput = screen.getByTestId('tlsCAFile-input');

        await waitFor(() =>
          fireEvent.change(fileInput, {
            target: {
              files: [
                {
                  path: 'new/caFile/path',
                },
              ],
            },
          })
        );
      });

      it('should call to update the tlsCAFile with the chosen file', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-tls-option',
          key: 'tlsCAFile',
          value: 'new/caFile/path',
        });
      });
    });

    describe('when a tlsCertificateKeyFile is chosen', function () {
      beforeEach(async function () {
        const fileInput = screen.getByTestId('tlsCertificateKeyFile-input');

        await waitFor(() =>
          fireEvent.change(fileInput, {
            target: {
              files: [
                {
                  path: 'new/caFile/path',
                },
              ],
            },
          })
        );
      });

      it('should call to update the tlsCertificateKeyFile with the chosen file', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-tls-option',
          key: 'tlsCertificateKeyFile',
          value: 'new/caFile/path',
        });
      });
    });

    describe('when tlsCAFile exists', function () {
      beforeEach(function () {
        testUrl.searchParams.set('tlsCAFile', 'pineapples');
        rerender(
          <SSLTab
            connectionStringUrl={testUrl}
            connectionOptions={{
              connectionString: testUrl.href,
              useSystemCA: false,
            }}
            updateConnectionFormField={updateConnectionFormFieldSpy}
          />
        );
      });

      it('should render the filepath', function () {
        expect(screen.getAllByText('pineapples').length).to.equal(2);
      });
    });

    describe('when tlsCertificateKeyFile exists', function () {
      beforeEach(function () {
        testUrl.searchParams.set('tlsCertificateKeyFile', 'a_great_file_path');
        rerender(
          <SSLTab
            connectionStringUrl={testUrl}
            connectionOptions={{
              connectionString: testUrl.href,
              useSystemCA: false,
            }}
            updateConnectionFormField={updateConnectionFormFieldSpy}
          />
        );
      });

      it('should render the filepath', function () {
        expect(screen.getAllByText('a_great_file_path').length).to.equal(2);
      });
    });

    describe('when tlsCertificateKeyFilePassword exists', function () {
      beforeEach(function () {
        testUrl.searchParams.set(
          'tlsCertificateKeyFilePassword',
          'tlsClientPassword'
        );
        rerender(
          <SSLTab
            connectionStringUrl={testUrl}
            connectionOptions={{
              connectionString: testUrl.href,
              useSystemCA: false,
            }}
            updateConnectionFormField={updateConnectionFormFieldSpy}
          />
        );
      });

      it('should render the password', function () {
        expect(
          screen
            .getByTestId('tlsCertificateKeyFilePassword-input')
            .getAttribute('type')
        ).to.equal('password');
        expect(screen.getByTestId('tlsCertificateKeyFilePassword-input')).to.be
          .visible;
        expect(
          screen
            .getByTestId('tlsCertificateKeyFilePassword-input')
            .getAttribute('value')
        ).to.equal('tlsClientPassword');
      });
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    [
      'tlsInsecure',
      'tlsAllowInvalidHostnames',
      'tlsAllowInvalidCertificates',
    ].forEach((connectionStringTlsParam) => {
      describe('with ', function () {
        it('should render the checkbox not checked', function () {
          const checkbox: HTMLInputElement = screen.getByTestId(
            `${connectionStringTlsParam}-input`
          );
          expect(checkbox.checked).to.equal(false);
        });

        describe(`when ${connectionStringTlsParam} is clicked`, function () {
          beforeEach(function () {
            const checkboxLabel = screen.getByText(connectionStringTlsParam);
            fireEvent.click(checkboxLabel);
          });

          it('should call to update the connection configuration to set the param to true', function () {
            expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
            expect(
              updateConnectionFormFieldSpy.firstCall.args[0]
            ).to.deep.equal({
              type: 'update-tls-option',
              key: connectionStringTlsParam,
              value: 'true',
            });
          });
        });

        describe(`when ${connectionStringTlsParam} is true`, function () {
          beforeEach(function () {
            testUrl.searchParams.set(connectionStringTlsParam, 'true');
            rerender(
              <SSLTab
                connectionStringUrl={testUrl}
                connectionOptions={{
                  connectionString: testUrl.href,
                  useSystemCA: false,
                }}
                updateConnectionFormField={updateConnectionFormFieldSpy}
              />
            );
          });

          it('should render the checkbox checked', function () {
            const checkbox: HTMLInputElement = screen.getByTestId(
              `${connectionStringTlsParam}-input`
            );
            expect(checkbox.checked).to.equal(true);
          });

          describe(`when ${connectionStringTlsParam} is clicked`, function () {
            beforeEach(function () {
              const checkboxLabel = screen.getByText(connectionStringTlsParam);
              fireEvent.click(checkboxLabel);
            });

            it('should call to update the connection configuration to set the param to false', function () {
              expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
              expect(
                updateConnectionFormFieldSpy.firstCall.args[0]
              ).to.deep.equal({
                type: 'update-tls-option',
                key: connectionStringTlsParam,
                value: null,
              });
            });
          });
        });
      });
    });
  });

  describe('with ssl=false', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=false'
      );
      render(
        <SSLTab
          connectionStringUrl={connectionStringUrl}
          connectionOptions={{
            connectionString: connectionStringUrl.href,
            useSystemCA: false,
          }}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render the TLS/SSL `Off` radio box selected', function () {
      const tlsOnRadioBox = screen.getAllByRole('radio')[2] as HTMLInputElement;
      expect(tlsOnRadioBox.checked).to.equal(true);
      expect(tlsOnRadioBox.getAttribute('aria-checked')).to.equal('true');
    });

    it('should render all of the checkboxes disabled', function () {
      const checkboxes: HTMLInputElement[] = screen.getAllByRole('checkbox');
      expect(checkboxes.find((checkbox) => !checkbox.disabled)).to.equal(
        undefined
      );
    });

    describe('when TLS/SSL off is clicked', function () {
      beforeEach(function () {
        const standardSchemaRadioBox = screen.getAllByRole('radio')[2];
        fireEvent.click(standardSchemaRadioBox);
      });

      it("shouldn't call to update anything", function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
      });
    });

    describe('when TLS/SSL on is clicked', function () {
      beforeEach(function () {
        const standardSchemaRadioBox = screen.getAllByRole('radio')[1];
        fireEvent.click(standardSchemaRadioBox);
      });

      it('should call to update the connection configuration to TLS/SSL on', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-tls',
          tlsOption: 'ON',
        });
      });
    });
  });

  describe('#getTLSOptionForConnectionString', function () {
    let testUrl: ConnectionStringUrl;

    beforeEach(function () {
      testUrl = new ConnectionStringUrl('mongodb://localhost');
    });

    it('should return `DEFAULT` when tls and ssl are unset', function () {
      expect(getTLSOptionForConnectionString(testUrl)).to.equal('DEFAULT');
    });

    describe('when tls is `true`', function () {
      beforeEach(function () {
        testUrl.searchParams.set('tls', 'true');
      });

      it('should return `ON`', function () {
        expect(getTLSOptionForConnectionString(testUrl)).to.equal('ON');
      });

      describe('when ssl is `false`', function () {
        beforeEach(function () {
          testUrl.searchParams.set('ssl', 'false');
        });

        it('should return `undefined`', function () {
          expect(getTLSOptionForConnectionString(testUrl)).to.equal(undefined);
        });
      });
    });

    describe('when ssl is `true`', function () {
      beforeEach(function () {
        testUrl.searchParams.set('ssl', 'true');
      });

      it('should return `ON`', function () {
        expect(getTLSOptionForConnectionString(testUrl)).to.equal('ON');
      });

      describe('when tls is `false`', function () {
        beforeEach(function () {
          testUrl.searchParams.set('tls', 'false');
        });

        it('should return `undefined`', function () {
          expect(getTLSOptionForConnectionString(testUrl)).to.equal(undefined);
        });
      });

      describe('when tls is `true`', function () {
        beforeEach(function () {
          testUrl.searchParams.set('tls', 'true');
        });

        it('should return `ON`', function () {
          expect(getTLSOptionForConnectionString(testUrl)).to.equal('ON');
        });
      });
    });

    describe('when ssl is `false`', function () {
      beforeEach(function () {
        testUrl.searchParams.set('ssl', 'false');
      });

      it('should return `OFF`', function () {
        expect(getTLSOptionForConnectionString(testUrl)).to.equal('OFF');
      });

      describe('when tls is `true`', function () {
        beforeEach(function () {
          testUrl.searchParams.set('tls', 'true');
        });

        it('should return `undefined`', function () {
          expect(getTLSOptionForConnectionString(testUrl)).to.equal(undefined);
        });
      });
    });

    describe('when tls is `false`', function () {
      beforeEach(function () {
        testUrl.searchParams.set('tls', 'false');
      });

      it('should return `ON`', function () {
        expect(getTLSOptionForConnectionString(testUrl)).to.equal('OFF');
      });

      describe('when ssl `false`', function () {
        beforeEach(function () {
          testUrl.searchParams.set('ssl', 'false');
        });

        it('should return `OFF`', function () {
          expect(getTLSOptionForConnectionString(testUrl)).to.equal('OFF');
        });
      });
    });

    describe('when tls has a value not `true` or `false`', function () {
      beforeEach(function () {
        testUrl.searchParams.set('ssl', 'aaaa');
      });

      it('should return `undefined`', function () {
        expect(getTLSOptionForConnectionString(testUrl)).to.equal(undefined);
      });
    });

    describe('when ssl has a value not `true` or `false`', function () {
      beforeEach(function () {
        testUrl.searchParams.set('ssl', 'aaaa');
      });

      it('should return `undefined`', function () {
        expect(getTLSOptionForConnectionString(testUrl)).to.equal(undefined);
      });
    });
  });
});

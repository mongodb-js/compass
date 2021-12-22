import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
      );
      render(
        <SSLTab
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render the TLS/SSL `On` radio box selected', function () {
      const tlsOnRadioBox = screen.getAllByRole('radio')[1] as HTMLInputElement;
      expect(tlsOnRadioBox.checked).to.equal(true);
      expect(tlsOnRadioBox.getAttribute('aria-checked')).to.equal('true');
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

    describe('when TLS/SSL default is clicked', function () {
      beforeEach(function () {
        const tlsDefaultRadioBox = screen.getAllByRole('radio')[0];
        fireEvent.click(tlsDefaultRadioBox);
      });

      it('should call to update the connection configuration to TLS/SSL default', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-tls-option',
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
          type: 'update-tls-option',
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
  });

  describe('with ssl=false', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=false'
      );
      render(
        <SSLTab
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render the TLS/SSL `Off` radio box selected', function () {
      const tlsOnRadioBox = screen.getAllByRole('radio')[2] as HTMLInputElement;
      expect(tlsOnRadioBox.checked).to.equal(true);
      expect(tlsOnRadioBox.getAttribute('aria-checked')).to.equal('true');
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
          type: 'update-tls-option',
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

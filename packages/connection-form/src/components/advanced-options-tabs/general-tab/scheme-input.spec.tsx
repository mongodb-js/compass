import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import SchemeInput from './scheme-input';

describe('SchemeInput', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('with a srv connection string scheme (mongodb+srv://)', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb+srv://0ranges:p!neapp1es@localhost/?ssl=true'
      );
      render(
        <SchemeInput
          errors={[]}
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render the srv box selected', function () {
      const srvRadioBox = screen.getAllByRole('radio')[1] as HTMLInputElement;
      expect(srvRadioBox.checked).to.equal(true);
      expect(srvRadioBox.getAttribute('aria-checked')).to.equal('true');
    });

    it('should render the standard box not selected', function () {
      const standardSchemeRadioBox = screen.getAllByRole(
        'radio'
      )[0] as HTMLInputElement;
      expect(standardSchemeRadioBox.checked).to.equal(false);
      expect(standardSchemeRadioBox.getAttribute('aria-checked')).to.equal(
        'false'
      );
    });

    describe('when the standard scheme radio box is clicked', function () {
      beforeEach(function () {
        const standardSchemeRadioBox = screen.getAllByRole('radio')[0];
        fireEvent.click(standardSchemeRadioBox);
      });

      it('should call to update the connection string with standard scheme', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-connection-scheme',
          isSrv: false,
        });
      });
    });

    describe('when the srv radio box is clicked again', function () {
      beforeEach(function () {
        const srvRadioBox = screen.getAllByRole('radio')[1];
        fireEvent.click(srvRadioBox);
      });

      it('should not call to update the field string', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
      });
    });
  });

  describe('with a standard connection string schema (mongodb://)', function () {
    describe('with a single host', function () {
      beforeEach(function () {
        const connectionStringUrl = new ConnectionStringUrl(
          'mongodb://0ranges:p!neapp1es@outerspace:27017/?ssl=true'
        );
        render(
          <SchemeInput
            errors={[]}
            connectionStringUrl={connectionStringUrl}
            updateConnectionFormField={updateConnectionFormFieldSpy}
          />
        );
      });

      it('should render the standard selected', function () {
        const srvRadioBox = screen.getAllByRole('radio')[0] as HTMLInputElement;
        expect(srvRadioBox.checked).to.equal(true);
        expect(srvRadioBox.getAttribute('aria-checked')).to.equal('true');
      });

      it('should render the srv box not selected', function () {
        const srvRadioBox = screen.getAllByRole('radio')[1] as HTMLInputElement;
        expect(srvRadioBox.checked).to.equal(false);
        expect(srvRadioBox.getAttribute('aria-checked')).to.equal('false');
      });

      describe('when the srv scheme radio box is clicked', function () {
        beforeEach(function () {
          const srvSchemeRadioBox = screen.getAllByRole('radio')[1];
          fireEvent.click(srvSchemeRadioBox);
        });

        it('should call to update the connection string with srv scheme', function () {
          expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
          expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
            type: 'update-connection-scheme',
            isSrv: true,
          });
        });
      });
    });
  });

  describe('when there is a scheme error', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://0ranges:p!neapp1es@outerspace:27017/?ssl=true'
      );
      render(
        <SchemeInput
          errors={[
            {
              message: 'unrelated error',
            },
            {
              fieldTab: 'general',
              fieldName: 'isSrv',
              message: 'aaaa!!!1!',
            },
          ]}
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render the scheme conversion error', function () {
      expect(screen.getByText('aaaa!!!1!')).to.be.visible;
    });
  });
});

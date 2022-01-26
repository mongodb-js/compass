import React from 'react';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import DirectConnectionInput from './direct-connection-input';

describe('DirectConnectionInput', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  beforeEach(function () {
    updateConnectionFormFieldSpy = sinon.spy();
  });

  afterEach(cleanup);

  describe('when directConnection is "true" on the connection string', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://localhost:27019/?directConnection=true&ssl=false'
      );
      render(
        <DirectConnectionInput
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render checked', function () {
      const checkbox: HTMLInputElement = screen.getByRole('checkbox');
      expect(checkbox.checked).to.equal(true);
    });

    describe('when the checkbox is clicked', function () {
      beforeEach(function () {
        const checkbox: HTMLInputElement = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
      });

      it('should call to update with direct connection = false', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'delete-search-param',
          key: 'directConnection',
        });
      });
    });
  });

  describe('when directConnection is unset on the connection string', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://localhost:27019/?ssl=true'
      );
      render(
        <DirectConnectionInput
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render not checked', function () {
      const checkbox: HTMLInputElement = screen.getByRole('checkbox');
      expect(checkbox.checked).to.equal(false);
    });

    describe('when the checkbox is clicked', function () {
      beforeEach(function () {
        const checkbox: HTMLInputElement = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
      });

      it('should call to update with direct connection = true', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-search-param',
          currentKey: 'directConnection',
          value: 'true',
        });
      });
    });
  });

  describe('when directConnection is "NOT_TRUE_OR_FALSE" on the connection string', function () {
    beforeEach(function () {
      const connectionStringUrl = new ConnectionStringUrl(
        'mongodb://localhost:27019/?directConnection=NOT_TRUE_OR_FALSE&ssl=false'
      );
      render(
        <DirectConnectionInput
          connectionStringUrl={connectionStringUrl}
          updateConnectionFormField={updateConnectionFormFieldSpy}
        />
      );
    });

    it('should render not checked', function () {
      const checkbox: HTMLInputElement = screen.getByRole('checkbox');
      expect(checkbox.checked).to.equal(false);
    });

    describe('when the checkbox is clicked', function () {
      beforeEach(function () {
        const checkbox: HTMLInputElement = screen.getByRole('checkbox');
        fireEvent.click(checkbox);
      });

      it('should call to update with direct connection = true', function () {
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.firstCall.args[0]).to.deep.equal({
          type: 'update-search-param',
          currentKey: 'directConnection',
          value: 'true',
        });
      });
    });
  });
});

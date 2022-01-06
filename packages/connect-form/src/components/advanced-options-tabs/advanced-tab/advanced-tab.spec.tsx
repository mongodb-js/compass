import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import { readPreferences } from './../../../utils/read-preferences';

import AdvancedTab from './advanced-tab';

const connectionStringUrl = new ConnectionStringUrl(
  'mongodb+srv://0ranges:p!neapp1es@localhost/'
);

const formFields = [
  {
    testId: 'replica-set',
    key: 'replicaSet',
  },
  {
    testId: 'default-database',
    key: 'authSource',
  },
];

let updateConnectionFormFieldSpy: sinon.SinonSpy;

describe('AdvancedTab', function () {
  describe('no searchParam', function () {
    beforeEach(function () {
      updateConnectionFormFieldSpy = sinon.spy();
      render(
        <AdvancedTab
          errors={[]}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          hideError={() => {}}
          updateConnectionFormField={updateConnectionFormFieldSpy}
          connectionStringUrl={connectionStringUrl}
        />
      );
    });

    it('renders view correctly', function () {
      expect(screen.getByTestId('read-preferences')).to.exist;
      expect(screen.getByTestId('replica-set')).to.exist;
      expect(screen.getByTestId('default-database')).to.exist;
      expect(screen.getByTestId('url-options')).to.exist;
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    readPreferences.forEach(({ id }) => {
      it(`handles changes on readPreference radio button - ${id}`, function () {
        fireEvent.click(screen.getByTestId(`${id}-preference-button`));
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
          type: 'update-search-param',
          currentKey: 'readPreference',
          value: id,
        });
      });
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    formFields.forEach(({ key, testId }) => {
      it(`handles changes on ${key} field`, function () {
        fireEvent.change(screen.getByTestId(testId), { target: { value: 'hello' } });
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
          type: 'update-search-param',
          currentKey: key,
          value: 'hello',
        });

        // todo: fix delete
        // fireEvent.change(screen.getByTestId(testId), { target: { value: '' } });
        // expect(updateConnectionFormFieldSpy.callCount).to.equal(2);
        // expect(updateConnectionFormFieldSpy.args[1][0]).to.deep.equal({
        //   type: 'delete-search-param',
        //   key,
        // });
      });
    });
  });

  describe('renders selected values from connectionStringUrl', function () {
    beforeEach(function () {
      updateConnectionFormFieldSpy = sinon.spy();
      connectionStringUrl.searchParams.set('readPreference', 'nearest');
      connectionStringUrl.searchParams.set('replicaSet', 'hello-rs');
      connectionStringUrl.searchParams.set('authSource', 'hello-db');
      render(
        <AdvancedTab
          errors={[]}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          hideError={() => {}}
          updateConnectionFormField={updateConnectionFormFieldSpy}
          connectionStringUrl={connectionStringUrl}
        />
      );
    });
    it('renders selected values', function () {
      expect(
        screen
          .getByTestId('nearest-preference-button')
          .getAttribute('aria-checked')
      ).to.equal('true');
      expect(screen.getByTestId('replica-set').getAttribute('value')).to.equal(
        'hello-rs'
      );
      expect(
        screen.getByTestId('default-database').getAttribute('value')
      ).to.equal('hello-db');
    });
  });
});

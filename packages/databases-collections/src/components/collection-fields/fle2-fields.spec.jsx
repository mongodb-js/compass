import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import FLE2Fields from './fle2-fields';

describe('FLE2Fields [Component]', function () {
  afterEach(function () {
    cleanup();
  });

  context('when isFLE2 prop is true', function () {
    it('renders the form field containers', function () {
      render(
        <FLE2Fields
          isTimeSeries={false}
          isClustered={false}
          isFLE2
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      // When expanded, there should be encrypted fields editor, KMS provider radio group, and key encryption key editor
      expect(screen.getByText('Encrypted fields')).to.exist;
      expect(screen.getByText('KMS Provider')).to.exist;
      expect(screen.getByText('Key Encryption Key')).to.exist;
      expect(screen.getByTestId('fle2-encryptedFields')).to.exist;
    });
  });

  context('when isFLE2 prop is false', function () {
    it('does not render the fields', function () {
      render(
        <FLE2Fields
          isTimeSeries={false}
          isClustered={false}
          isFLE2={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      // When collapsed, the encrypted fields should not be visible
      expect(screen.queryByText('Encrypted fields')).to.not.exist;
      expect(screen.queryByTestId('fle2-encryptedFields')).to.not.exist;
    });

    it('has the FLE2 checkbox enabled', function () {
      render(
        <FLE2Fields
          isTimeSeries={false}
          isClustered={false}
          isFLE2={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      const checkbox = screen.getByRole('checkbox', {
        name: /Queryable Encryption/i,
      });
      expect(checkbox).to.exist;
      expect(checkbox).to.not.have.attribute('aria-disabled', 'true');
    });
  });

  describe('when the fle2 checkbox is clicked', function () {
    it('calls the onchange with fle2 collection on', function () {
      const onChangeSpy = sinon.spy();
      render(
        <FLE2Fields
          isTimeSeries={false}
          isClustered={false}
          isFLE2={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsFLE2={onChangeSpy}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      const checkbox = screen.getByRole('checkbox', {
        name: /Queryable Encryption/i,
      });
      userEvent.click(checkbox, undefined, { skipPointerEventsCheck: true });

      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });

  describe('when the isTimeSeries prop is true', function () {
    it('has the FLE2 checkbox disabled', function () {
      render(
        <FLE2Fields
          isTimeSeries
          isClustered={false}
          configuredKMSProviders={['local']}
          currentTopologyType="ReplicaSetWithPrimary"
          fle2={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      const checkbox = screen.getByRole('checkbox', {
        name: /Queryable Encryption/i,
      });
      // LeafyGreen uses aria-disabled instead of disabled attribute
      expect(checkbox).to.have.attribute('aria-disabled', 'true');
    });
  });
});

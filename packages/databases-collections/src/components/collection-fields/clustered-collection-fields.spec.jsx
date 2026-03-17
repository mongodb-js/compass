import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import ClusteredCollectionFields from './clustered-collection-fields';

describe('ClusteredCollectionFields [Component]', function () {
  context('when isClustered prop is true', function () {
    it('renders the form field containers', function () {
      render(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isClustered
          clusteredIndex={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      // When expanded, there should be 2 text inputs (name and expireAfterSeconds)
      expect(screen.getByRole('textbox', { name: /name/i })).to.exist;
      expect(
        screen.getByRole('spinbutton', { name: /expireAfterSeconds/i })
      ).to.exist;
    });
  });

  context('when isClustered prop is false', function () {
    it('does not render the fields', function () {
      render(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isClustered={false}
          clusteredIndex={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      // When collapsed, the text inputs should not be visible
      expect(screen.queryByRole('textbox', { name: /name/i })).to.not.exist;
      expect(
        screen.queryByRole('spinbutton', { name: /expireAfterSeconds/i })
      ).to.not.exist;
    });

    it('has the clustered checkbox enabled', function () {
      render(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isClustered={false}
          clusteredIndex={{}}
          onChangeIsClustered={() => {}}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      const checkbox = screen.getByRole('checkbox', {
        name: /Clustered Collection/i,
      });
      expect(checkbox).to.exist;
      expect(checkbox).to.not.have.attribute('aria-disabled', 'true');
    });
  });

  describe('when the clustered checkbox is clicked', function () {
    it('calls the onchange with clustered collection on', function () {
      const onChangeSpy = sinon.spy();
      render(
        <ClusteredCollectionFields
          isTimeSeries={false}
          isClustered={false}
          clusteredIndex={{}}
          onChangeIsClustered={onChangeSpy}
          onChangeField={() => {}}
          expireAfterSeconds=""
        />
      );
      const checkbox = screen.getByRole('checkbox', {
        name: /Clustered Collection/i,
      });
      userEvent.click(checkbox, undefined, { skipPointerEventsCheck: true });

      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });
});

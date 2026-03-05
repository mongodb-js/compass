import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import TimeSeriesFields from './time-series-fields';

describe('TimeSeriesFields [Component]', function () {
  afterEach(function () {
    cleanup();
  });

  context('when isTimeSeries prop is true', function () {
    it('renders the form field containers', function () {
      render(
        <TimeSeriesFields
          isTimeSeries
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      // When expanded, there should be: timeField, metaField, granularity (Select), expireAfterSeconds
      expect(screen.getByRole('textbox', { name: /timeField/i })).to.exist;
      expect(screen.getByRole('textbox', { name: /metaField/i })).to.exist;
      expect(screen.getByRole('button', { name: /granularity/i })).to.exist;
      expect(
        screen.getByRole('spinbutton', { name: /expireAfterSeconds/i })
      ).to.exist;
    });
  });

  context('when isTimeSeries prop is false', function () {
    it('does not render the fields', function () {
      render(
        <TimeSeriesFields
          isTimeSeries={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      // When collapsed, the text inputs should not be visible
      expect(
        screen.queryByRole('textbox', { name: /timeField/i })
      ).to.not.exist;
      expect(
        screen.queryByRole('textbox', { name: /metaField/i })
      ).to.not.exist;
    });

    it('has the time-series checkbox enabled', function () {
      render(
        <TimeSeriesFields
          isTimeSeries={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      const checkbox = screen.getByRole('checkbox', { name: /Time-Series/i });
      expect(checkbox).to.exist;
      expect(checkbox).to.not.have.attribute('aria-disabled', 'true');
    });
  });

  describe('when the time series checkbox is clicked', function () {
    it('calls the onchange with time series collection on', function () {
      const onChangeSpy = sinon.spy();
      render(
        <TimeSeriesFields
          isTimeSeries={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={onChangeSpy}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      const checkbox = screen.getByRole('checkbox', { name: /Time-Series/i });
      userEvent.click(checkbox, undefined, { skipPointerEventsCheck: true });

      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });

  describe('when supportsFlexibleBucketConfiguration is true', function () {
    it('renders flexible bucketing options', function () {
      render(
        <TimeSeriesFields
          isTimeSeries={true}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={true}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      expect(screen.getByRole('spinbutton', { name: /bucketMaxSpanSeconds/i }))
        .to.exist;
      expect(screen.getByRole('spinbutton', { name: /bucketRoundingSeconds/i }))
        .to.exist;
    });
  });

  context('when rendered', function () {
    describe('when a granularity is chosen', function () {
      it('calls the onchange with granularity set', function () {
        const onChangeFieldSpy = sinon.spy();
        render(
          <TimeSeriesFields
            isTimeSeries
            isClustered={false}
            isFLE2={false}
            supportsFlexibleBucketConfiguration={false}
            onChangeIsTimeSeries={() => {}}
            onChangeField={onChangeFieldSpy}
            timeSeries={{}}
            expireAfterSeconds=""
          />
        );
        // Click the granularity dropdown button
        const granularityButton = screen.getByRole('button', {
          name: /granularity/i,
        });
        userEvent.click(granularityButton, undefined, {
          skipPointerEventsCheck: true,
        });

        // Select 'hours' option from the listbox
        const listbox = screen.getByRole('listbox');
        const hoursOption = within(listbox).getByText('hours');
        userEvent.click(hoursOption, undefined, {
          skipPointerEventsCheck: true,
        });

        expect(onChangeFieldSpy.callCount).to.equal(1);
        expect(onChangeFieldSpy.firstCall.args[0]).to.deep.equal(
          'timeSeries.granularity'
        );
        expect(onChangeFieldSpy.firstCall.args[1]).to.deep.equal('hours');
      });
    });
  });
});

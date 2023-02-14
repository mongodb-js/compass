import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { FormFieldContainer, Select } from '@mongodb-js/compass-components';

import TimeSeriesFields from './time-series-fields';

describe('TimeSeriesFields [Component]', function () {
  context('when isTimeSeries prop is true', function () {
    let component;

    beforeEach(function () {
      component = mount(
        <TimeSeriesFields
          isTimeSeries
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('renders the form field containers', function () {
      expect(component.find(FormFieldContainer).length).to.equal(5);
    });
  });

  context('when isTimeSeries prop is false', function () {
    let component;

    beforeEach(function () {
      component = mount(
        <TimeSeriesFields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('does not render the fields', function () {
      expect(component.find(FormFieldContainer).length).to.equal(1);
    });

    it('has the time-series checkbox enabled', function () {
      expect(component.find('Checkbox').props().disabled).to.equal(false);
    });
  });

  describe('when the time series checkbox is clicked', function () {
    let component;
    let onChangeSpy;

    beforeEach(function () {
      onChangeSpy = sinon.spy();
      component = mount(
        <TimeSeriesFields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={onChangeSpy}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      component
        .find('input[type="checkbox"]')
        .at(0)
        .simulate('change', { target: { checked: true } });
      component.update();
    });

    afterEach(function () {
      component = null;
      onChangeSpy = null;
    });

    it('calls the onchange with time series collection on', function () {
      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });

  describe('when the isCapped prop is true', function () {
    let component;

    beforeEach(function () {
      component = mount(
        <TimeSeriesFields
          isTimeSeries={false}
          isCapped
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(function () {
      component = null;
    });

    it('has the time-series checkbox disabled', function () {
      expect(component.find('Checkbox').props().disabled).to.equal(true);
    });
  });

  describe('when supportsFlexibleBucketConfiguration is true', function () {
    it('renders flexible bucketing options', function () {
      const component = mount(
        <TimeSeriesFields
          isTimeSeries={true}
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={true}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      expect(
        component.find('input[name="timeSeries.bucketMaxSpanSeconds"]')
      ).to.have.lengthOf(1);
      expect(
        component.find('input[name="timeSeries.bucketRoundingSeconds"]')
      ).to.have.lengthOf(1);
    });
  });

  context('when rendered', function () {
    let component;
    let onChangeSpy;
    let onChangeFieldSpy;

    beforeEach(function () {
      onChangeSpy = sinon.spy();
      onChangeFieldSpy = sinon.spy();

      component = mount(
        <TimeSeriesFields
          isTimeSeries
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          supportsFlexibleBucketConfiguration={false}
          onChangeIsTimeSeries={onChangeSpy}
          onChangeField={onChangeFieldSpy}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(function () {
      component = null;
      onChangeSpy = null;
      onChangeFieldSpy = null;
    });

    describe('when a granularity is chosen', function () {
      beforeEach(function () {
        component.find(Select).at(0).props().onChange('hours');
        component.update();
      });

      it('calls the onchange with granularity set', function () {
        expect(onChangeFieldSpy.callCount).to.equal(1);
        expect(onChangeFieldSpy.firstCall.args[0]).to.deep.equal(
          'timeSeries.granularity'
        );
        expect(onChangeFieldSpy.firstCall.args[1]).to.deep.equal('hours');
      });
    });
  });
});

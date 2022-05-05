import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import sinon from 'sinon';
import { Checkbox, Select } from '@mongodb-js/compass-components';

import TimeSeriesFields from './time-series-fields';
import FieldSet from '../field-set/field-set';

describe('TimeSeriesFields [Component]', () => {
  context('when isTimeSeries prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <TimeSeriesFields
          isTimeSeries
          isCapped={false}
          isClustered={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the field sets', () => {
      expect(component.find(FieldSet).length).to.equal(5);
    });
  });

  context('when isTimeSeries prop is false', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <TimeSeriesFields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          isFLE2={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('does not render the fields', () => {
      expect(component.find(FieldSet).length).to.equal(1);
    });

    it('has the time-series checkbox enabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(false);
    });
  });

  describe('when the time series checkbox is clicked', () => {
    let component;
    let onChangeSpy;

    beforeEach(() => {
      onChangeSpy = sinon.spy();
      component = mount(
        <TimeSeriesFields
          isTimeSeries={false}
          isCapped={false}
          isClustered={false}
          onChangeIsTimeSeries={onChangeSpy}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
      component.find('input[type="checkbox"]').at(0).simulate(
        'change', { target: { checked: true } }
      );
      component.update();
    });

    afterEach(() => {
      component = null;
      onChangeSpy = null;
    });

    it('calls the onchange with time series collection on', () => {
      expect(onChangeSpy.callCount).to.equal(1);
      expect(onChangeSpy.firstCall.args[0]).to.deep.equal(true);
    });
  });

  describe('when the isCapped prop is true', () => {
    let component;

    beforeEach(() => {
      component = mount(
        <TimeSeriesFields
          isTimeSeries={false}
          isCapped
          isClustered={false}
          onChangeIsTimeSeries={() => {}}
          onChangeField={() => {}}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('has the time-series checkbox disabled', () => {
      expect(component.find(Checkbox).props().disabled).to.equal(true);
    });
  });

  context('when rendered', () => {
    let component;
    let onChangeSpy;
    let onChangeFieldSpy;

    beforeEach(() => {
      onChangeSpy = sinon.spy();
      onChangeFieldSpy = sinon.spy();

      component = mount(
        <TimeSeriesFields
          isTimeSeries
          isCapped={false}
          isClustered={false}
          onChangeIsTimeSeries={onChangeSpy}
          onChangeField={onChangeFieldSpy}
          timeSeries={{}}
          expireAfterSeconds=""
        />
      );
    });

    afterEach(() => {
      component = null;
      onChangeSpy = null;
      onChangeFieldSpy = null;
    });

    describe('when a granularity is chosen', () => {
      beforeEach(() => {
        component.find(Select).at(0).props().onChange('hours');
        component.update();
      });

      it('calls the onchange with granularity set', () => {
        expect(onChangeFieldSpy.callCount).to.equal(1);
        expect(onChangeFieldSpy.firstCall.args[0]).to.deep.equal(
          'timeSeries.granularity'
        );
        expect(onChangeFieldSpy.firstCall.args[1]).to.deep.equal(
          'hours'
        );
      });
    });
  });
});
